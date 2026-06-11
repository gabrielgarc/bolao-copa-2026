using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using Bolao.Copa2026.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;

namespace Bolao.Copa2026.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IRepository<Match> _matchRepo;
        private readonly IRepository<UserRanking> _userRankingRepo;
        private readonly IRepository<User> _userRepo;
        private readonly IRepository<Prediction> _predictionRepo;
        private readonly IRepository<RegistrationToken> _tokenRepo;
        private readonly IRankingService _rankingService;
        private readonly IPredictionService _predictionService;
        private readonly IGeminiService _geminiService;
        private readonly MockMatchDataProvider? _mockProvider;
        private readonly IConfiguration _config;

        public AdminController(
            IRepository<Match> matchRepo,
            IRepository<UserRanking> userRankingRepo,
            IRepository<User> userRepo,
            IRepository<Prediction> predictionRepo,
            IRepository<RegistrationToken> tokenRepo,
            IRankingService rankingService,
            IPredictionService predictionService,
            IGeminiService geminiService,
            IConfiguration config,
            MockMatchDataProvider? mockProvider = null)
        {
            _matchRepo = matchRepo;
            _userRankingRepo = userRankingRepo;
            _userRepo = userRepo;
            _predictionRepo = predictionRepo;
            _tokenRepo = tokenRepo;
            _rankingService = rankingService;
            _predictionService = predictionService;
            _geminiService = geminiService;
            _config = config;
            _mockProvider = mockProvider;
        }

        /// <summary>
        /// Recalcula os pontos de todos os usuários sem simular nenhuma partida.
        /// Útil para aplicar mudanças nas regras de pontuação.
        /// </summary>
        [HttpPost("recalculate")]
        public async Task<ActionResult> RecalculatePoints()
        {
            await _rankingService.RecalculateAllPoints();
            return Ok(new { message = "Pontuação de todos os usuários recalculada com sucesso." });
        }

        /// <summary>
        /// Limpa todos os resultados, status e locks de todas as partidas. Remove todos os rankings.
        /// Reseta times do mata-mata para Guid.Empty.
        /// </summary>
        [HttpPost("clear")]
        public async Task<ActionResult> ClearAll()
        {
            var allMatches = await _matchRepo.GetAllAsync();
            int count = 0;

            foreach (var match in allMatches)
            {
                match.RealHomeScore = null;
                match.RealAwayScore = null;
                match.Status = string.Empty;
                match.IsLocked = false;

                // Reset knockout teams back to empty
                if (match.Stage != "GROUP_STAGE")
                {
                    match.HomeTeamId = Guid.Empty;
                    match.AwayTeamId = Guid.Empty;
                    match.HomeTeamName = null;
                    match.AwayTeamName = null;
                }

                await _matchRepo.UpdateAsync(match.Id, match);
                count++;
            }

            // Limpar todos os rankings
            var allRankings = await _userRankingRepo.GetAllAsync();
            foreach (var ranking in allRankings)
                await _userRankingRepo.DeleteAsync(ranking.Id);

            // Também limpa o estado in-memory do mock
            _mockProvider?.ClearAll();

            return Ok(new { message = $"Dados limpos! {count} partidas resetadas e rankings removidos." });
        }

        // ==================== ADMIN AUTH & USERS ====================

        [HttpPost("login")]
        public ActionResult Login([FromBody] AdminLoginRequest request)
        {
            var adminUser = _config["Admin:Username"];
            var adminPass = _config["Admin:Password"];

            if (request.Username == adminUser && request.Password == adminPass)
                return Ok(new { token = "admin-secret-token" });

            return Unauthorized("Credenciais de administrador inválidas.");
        }

        [HttpGet("users")]
        public async Task<ActionResult> GetUsers()
        {
            var users = await _userRepo.GetAllAsync();
            var rankings = await _userRankingRepo.GetAllAsync();

            var usersData = users.Select(u => {
                var ranking = rankings.FirstOrDefault(r => r.UserId == u.Id);
                return new
                {
                    id = u.Id,
                    username = u.UserName,
                    avatar = u.Avatar,
                    points = ranking?.TotalPoints ?? 0
                };
            }).OrderByDescending(u => u.points).ToList();

            return Ok(usersData);
        }

        [HttpGet("missing-predictions")]
        public async Task<ActionResult> GetMissingPredictions([FromQuery] string date)
        {
            if (string.IsNullOrWhiteSpace(date))
                return BadRequest(new { message = "Data é obrigatória." });

            var searchStr = date;
            // Se vier no formato DD/MM (ex: 11/06), converte para MM-DD para casar com yyyy-MM-dd
            if (date.Length == 5 && date.Contains("/"))
            {
                var parts = date.Split('/');
                searchStr = $"{parts[1]}-{parts[0]}";
            }

            var matches = await _matchRepo.FindAsync(m => m.Date == date || m.Date.EndsWith(searchStr));
            if (!matches.Any())
                return Ok(new List<object>());

            var users = await _userRepo.GetAllAsync();
            var matchIds = matches.Select(m => m.Id).ToList();
            var predictions = await _predictionRepo.FindAsync(p => matchIds.Contains(p.MatchId));

            var result = matches.Select(m => {
                var predictedUserIds = predictions.Where(p => p.MatchId == m.Id).Select(p => p.UserId).ToHashSet();
                var missingUsers = users
                    .Where(u => !predictedUserIds.Contains(u.Id))
                    .Select(u => new {
                        id = u.Id,
                        name = u.UserName,
                        avatar = u.Avatar
                    })
                    .OrderBy(u => u.name)
                    .ToList();

                return new {
                    matchId = m.Id,
                    homeTeam = m.HomeTeamName ?? "TBD",
                    awayTeam = m.AwayTeamName ?? "TBD",
                    time = m.Time,
                    group = m.Group,
                    missingUsersCount = missingUsers.Count,
                    missingUsers = missingUsers
                };
            }).OrderBy(m => m.time).ToList();

            return Ok(result);
        }

        // ==================== TOKENS DE CADASTRO ====================

        [HttpGet("tokens")]
        public async Task<ActionResult> GetTokens()
        {
            var tokens = await _tokenRepo.GetAllAsync();
            return Ok(tokens.OrderByDescending(t => t.CreatedAt).Select(t => new Bolao.Copa2026.API.DTOs.RegistrationTokenDto(
                t.Id, t.Token, t.IsUsed, t.UserName, t.CreatedAt
            )));
        }

        [HttpPost("tokens")]
        public async Task<ActionResult> GenerateToken([FromBody] Bolao.Copa2026.API.DTOs.GenerateTokenRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Prefix) || request.Prefix.Length != 4 || !request.Prefix.All(char.IsLetter))
            {
                return BadRequest("O prefixo deve conter exatamente 4 letras.");
            }

            var random = new Random();
            var numberPart = random.Next(1000, 10000).ToString(); // 4 dígitos

            var newTokenString = $"{request.Prefix.ToUpper()}{numberPart}";

            var token = new RegistrationToken
            {
                Token = newTokenString,
                IsUsed = false
            };

            await _tokenRepo.CreateAsync(token);

            return Ok(new Bolao.Copa2026.API.DTOs.RegistrationTokenDto(
                token.Id, token.Token, token.IsUsed, token.UserName, token.CreatedAt
            ));
        }

        // ==================== MOCK API ENDPOINTS ====================

        /// <summary>
        /// Seta placar e status de um jogo mockado pelo ApiId.
        /// </summary>
        [HttpPost("mock/match/{apiId}")]
        public ActionResult MockMatch(int apiId, [FromBody] MockMatchRequest request)
        {
            if (_mockProvider == null)
                return BadRequest("MockApi não está habilitado. Ative 'MatchPolling:MockApi' no appsettings.json.");

            _mockProvider.SetMatchResult(apiId, request.HomeScore, request.AwayScore, request.Status ?? "FINISHED");
            return Ok(new { message = $"Mock: Match {apiId} → {request.HomeScore}x{request.AwayScore} ({request.Status ?? "FINISHED"})" });
        }

        [HttpPost("mock/recalculate-brackets")]
        public async Task<ActionResult> RecalculateBrackets()
        {
            if (_mockProvider == null)
                return BadRequest("MockApi não está habilitado.");

            int count = await _mockProvider.RecalculateBracketsAsync();
            return Ok(new { message = $"Mock: {count} times de chaveamento recalculados com base nos resultados atuais.", count });
        }

        [HttpPost("mock/next")]
        public async Task<ActionResult> MockNextMatch()
        {
            if (_mockProvider == null)
                return BadRequest("MockApi não está habilitado.");

            var match = await _mockProvider.SimulateNextMatchAsync();
            if (match == null)
                return NotFound("Todos os jogos já foram simulados.");

            return Ok(new { 
                message = $"Mock: Partida {match.ApiId} ({match.HomeTeamName} vs {match.AwayTeamName}) simulada com sucesso.",
                matchId = match.ApiId,
                home = match.HomeTeamName,
                away = match.AwayTeamName
            });
        }

        /// <summary>
        /// Simula resultados aleatórios para um grupo inteiro via mock.
        /// O sync (30s) vai pegar esses resultados e escrever no banco.
        /// </summary>
        [HttpPost("mock/group/{letter}")]
        public async Task<ActionResult> MockGroup(string letter)
        {
            if (_mockProvider == null)
                return BadRequest("MockApi não está habilitado.");

            int count = await _mockProvider.SimulateGroupAsync(letter);
            if (count == 0)
                return NotFound($"Nenhuma partida encontrada para o grupo '{letter}'.");

            return Ok(new { message = $"Mock: {count} jogos do grupo {letter.ToUpper()} simulados. Aguarde o sync (30s) para refletir no banco.", count });
        }

        /// <summary>
        /// Simula resultados para uma fase inteira (ou todas as fases com ALL).
        /// Com chaveamento correto baseado nas regras de classificação da FIFA 2026.
        /// </summary>
        [HttpPost("mock/stage")]
        public async Task<ActionResult> MockStage([FromQuery] MockStageOption stage)
        {
            if (_mockProvider == null)
                return BadRequest("MockApi não está habilitado.");

            if (stage == MockStageOption.ALL)
            {
                var (totalSim, totalBrk) = await _mockProvider.SimulateAllStagesAsync();
                return Ok(new
                {
                    message = $"Mock ALL: {totalSim} jogos simulados em todas as fases. {totalBrk} chaveamentos atualizados. Aguarde o sync (30s).",
                    totalSimulated = totalSim,
                    totalBracketed = totalBrk
                });
            }
            else
            {
                var (sim, brk) = await _mockProvider.SimulateStageAsync(stage.ToString());
                return Ok(new
                {
                    message = $"Mock: {sim} jogos da fase '{stage}' simulados. {brk} chaveamentos atualizados. Aguarde o sync (30s).",
                    simulated = sim,
                    bracketed = brk
                });
            }
        }

        /// <summary>
        /// Coloca um jogo como IN_PLAY (simulando jogo ao vivo).
        /// </summary>
        [HttpPost("mock/start/{apiId}")]
        public ActionResult MockStartMatch(int apiId)
        {
            if (_mockProvider == null)
                return BadRequest("MockApi não está habilitado.");

            _mockProvider.StartMatch(apiId);
            return Ok(new { message = $"Mock: Match {apiId} → IN_PLAY" });
        }

        /// <summary>
        /// Finaliza um jogo com o placar atual.
        /// </summary>
        [HttpPost("mock/finish/{apiId}")]
        public ActionResult MockFinishMatch(int apiId)
        {
            if (_mockProvider == null)
                return BadRequest("MockApi não está habilitado.");

            _mockProvider.FinishMatch(apiId);
            return Ok(new { message = $"Mock: Match {apiId} → FINISHED" });
        }

        /// <summary>
        /// Mostra o estado atual de todos os mocks ativos.
        /// </summary>
        [HttpGet("mock/status")]
        public ActionResult MockStatus()
        {
            if (_mockProvider == null)
                return BadRequest("MockApi não está habilitado.");

            var states = _mockProvider.GetAllMockStates();
            return Ok(new { mockEnabled = true, count = states.Count, matches = states });
        }

        /// <summary>
        /// Limpa todos os estados mock (sem apagar dados do banco).
        /// </summary>
        [HttpDelete("mock/clear")]
        public ActionResult MockClear()
        {
            if (_mockProvider == null)
                return BadRequest("MockApi não está habilitado.");

            _mockProvider.ClearAll();
            return Ok(new { message = "Mock: Todos os estados limpos." });
        }

        // ==================== O COMENTARISTA AI ====================
        [HttpGet("ai-comment")]
        public async Task<ActionResult> GetAiComment()
        {
            var matches = await _matchRepo.GetAllAsync();
            var users = await _userRepo.GetAllAsync();
            var rankings = await _userRankingRepo.GetAllAsync();
            var predictions = await _predictionRepo.GetAllAsync();

            var finishedMatches = matches.Where(m => m.Status == "FINISHED" || m.Status == "IN_PLAY" || m.IsLocked).ToList();
            var futureMatches = matches.Where(m => m.Status != "FINISHED" && m.Status != "IN_PLAY" && !m.IsLocked).ToList();

            var topUsers = rankings.OrderByDescending(r => r.TotalPoints).Take(3).ToList();
            var bottomUsers = rankings.OrderBy(r => r.TotalPoints).Take(3).ToList();

            var contextBuilder = new System.Text.StringBuilder();
            
            contextBuilder.AppendLine("=== RANKING (Top 3 e Últimos 3) ===");
            foreach (var r in topUsers)
            {
                var user = users.FirstOrDefault(u => u.Id == r.UserId);
                contextBuilder.AppendLine($"Top: {user?.UserName} - {r.TotalPoints} pts");
            }
            foreach (var r in bottomUsers)
            {
                var user = users.FirstOrDefault(u => u.Id == r.UserId);
                contextBuilder.AppendLine($"Lanterna: {user?.UserName} - {r.TotalPoints} pts");
            }

            contextBuilder.AppendLine("\n=== JOGOS JÁ REALIZADOS (Pode citar palpites de usuários específicos aqui) ===");
            foreach (var m in finishedMatches.OrderByDescending(m => m.Date).Take(5))
            {
                contextBuilder.AppendLine($"Jogo: {m.HomeTeamName} {m.RealHomeScore} x {m.RealAwayScore} {m.AwayTeamName}");
                var matchPreds = predictions.Where(p => p.MatchId == m.Id).ToList();
                foreach(var p in matchPreds)
                {
                    var user = users.FirstOrDefault(u => u.Id == p.UserId);
                    if(user != null)
                        contextBuilder.AppendLine($" - {user.UserName} apostou {p.HomeScore}x{p.AwayScore}");
                }
            }

            contextBuilder.AppendLine("\n=== PRÓXIMOS JOGOS (NÃO MENCIONE PALPITES INDIVIDUAIS COM NOME, SÓ ESTATÍSTICAS) ===");
            foreach (var m in futureMatches.Take(3))
            {
                contextBuilder.AppendLine($"Próximo: {m.HomeTeamName} x {m.AwayTeamName}");
                var matchPreds = predictions.Where(p => p.MatchId == m.Id).ToList();
                if(matchPreds.Any())
                {
                    var avgHome = matchPreds.Average(p => p.HomeScore);
                    var avgAway = matchPreds.Average(p => p.AwayScore);
                    contextBuilder.AppendLine($" - Média de apostas da galera: {avgHome:0.0} x {avgAway:0.0}");
                }
            }

            var comment = await _geminiService.GenerateCommentaryAsync(contextBuilder.ToString());
            return Ok(new { comment });
        }
    }

    public class MockMatchRequest
    {
        public int HomeScore { get; set; }
        public int AwayScore { get; set; }
        public string? Status { get; set; } = "FINISHED";
    }

    public class AdminLoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    [System.Text.Json.Serialization.JsonConverter(typeof(System.Text.Json.Serialization.JsonStringEnumConverter))]
    public enum MockStageOption
    {
        ALL,
        GROUP_STAGE,
        LAST_32,
        LAST_16,
        QUARTER_FINALS,
        SEMI_FINALS,
        THIRD_PLACE,
        FINAL
    }
}
