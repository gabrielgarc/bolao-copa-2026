using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using Bolao.Copa2026.API.Services;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json.Serialization;

namespace Bolao.Copa2026.API.Controllers
{
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public enum SimulateStage
    {
        GROUP_STAGE,
        LAST_32,
        LAST_16,
        QUARTER_FINALS,
        SEMI_FINALS,
        THIRD_PLACE,
        FINAL
    }

    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly IRepository<Match> _matchRepo;
        private readonly IRepository<UserRanking> _userRankingRepo;
        private readonly IRepository<User> _userRepo;
        private readonly IRankingService _rankingService;
        private readonly IPredictionService _predictionService;
        private readonly MockMatchDataProvider? _mockProvider;
        private readonly IConfiguration _config;

        public AdminController(
            IRepository<Match> matchRepo,
            IRepository<UserRanking> userRankingRepo,
            IRepository<User> userRepo,
            IRankingService rankingService,
            IPredictionService predictionService,
            IConfiguration config,
            MockMatchDataProvider? mockProvider = null)
        {
            _matchRepo = matchRepo;
            _userRankingRepo = userRankingRepo;
            _userRepo = userRepo;
            _rankingService = rankingService;
            _predictionService = predictionService;
            _config = config;
            _mockProvider = mockProvider;
        }

        /// <summary>
        /// Simula resultados aleatórios para todas as partidas de uma fase.
        /// Após simular a fase de grupos, popula automaticamente os confrontos do mata-mata.
        /// </summary>
        [HttpPost("simulate/{stage}")]
        public async Task<ActionResult> SimulateStage(SimulateStage stage)
        {
            var stageName = stage.ToString();

            var allMatches = await _matchRepo.GetAllAsync();
            var stageMatches = allMatches.Where(m => m.Stage == stageName).ToList();

            if (stageMatches.Count == 0)
                return NotFound($"Nenhuma partida encontrada para a fase '{stageName}'.");

            var rng = new Random();
            int count = 0;

            foreach (var match in stageMatches)
            {
                match.RealHomeScore = rng.Next(0, 5);
                match.RealAwayScore = rng.Next(0, 5);
                match.Status = "FINISHED";
                match.IsLocked = true;
                await _matchRepo.UpdateAsync(match.Id, match);
                count++;
            }

            // After simulating, populate the next knockout round with qualified teams
            int bracketUpdates = await PopulateNextRound(stageName);

            // Recalcular ranking
            await _rankingService.RecalculateAllPoints();

            return Ok(new
            {
                message = $"Simulação concluída! {count} partidas da fase '{stageName}' simuladas. {bracketUpdates} confrontos do mata-mata atualizados.",
                count,
                bracketUpdates
            });
        }

        /// <summary>
        /// Simula resultados aleatórios para todas as partidas de um grupo específico.
        /// Exemplo de uso: /api/Admin/simulate/group/GROUP_A
        /// </summary>
        [HttpPost("simulate/group/{groupName}")]
        public async Task<ActionResult> SimulateGroup(string groupName)
        {
            var allMatches = await _matchRepo.GetAllAsync();
            var groupMatches = new List<Match>();
            
            if (groupName.Length == 1)
            {
                var letter = groupName.ToUpper();
                groupMatches = allMatches.Where(m => m.Stage == "GROUP_STAGE" && 
                    (m.Group.Equals($"Grupo {letter}", StringComparison.OrdinalIgnoreCase) ||
                     m.Group.Equals($"Group {letter}", StringComparison.OrdinalIgnoreCase) ||
                     m.Group.Equals($"GROUP_{letter}", StringComparison.OrdinalIgnoreCase))).ToList();
            }
            else
            {
                groupMatches = allMatches.Where(m => m.Stage == "GROUP_STAGE" && m.Group.Equals(groupName, StringComparison.OrdinalIgnoreCase)).ToList();
                if (groupMatches.Count == 0)
                {
                    var alternativeGroupName = groupName.Replace("GROUP_", "Grupo ", StringComparison.OrdinalIgnoreCase)
                                                        .Replace("GROUP_", "Group ", StringComparison.OrdinalIgnoreCase);
                    groupMatches = allMatches.Where(m => m.Stage == "GROUP_STAGE" && m.Group.Equals(alternativeGroupName, StringComparison.OrdinalIgnoreCase)).ToList();
                }
            }

            if (groupMatches.Count == 0)
                return NotFound($"Nenhuma partida encontrada para o grupo '{groupName}'.");

            var rng = new Random();
            int count = 0;

            foreach (var match in groupMatches)
            {
                match.RealHomeScore = rng.Next(0, 5);
                match.RealAwayScore = rng.Next(0, 5);
                match.Status = "FINISHED";
                match.IsLocked = true;
                await _matchRepo.UpdateAsync(match.Id, match);
                count++;
            }

            // Recalcular ranking (sem repopular o mata-mata automaticamente, a não ser que a fase inteira termine)
            await _rankingService.RecalculateAllPoints();

            return Ok(new
            {
                message = $"Simulação concluída! {count} partidas do grupo '{groupName}' simuladas.",
                count
            });
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
            {
                await _userRankingRepo.DeleteAsync(ranking.Id);
            }

            return Ok(new { message = $"Dados limpos! {count} partidas resetadas e rankings removidos." });
        }

        private async Task<int> PopulateNextRound(string finishedStage)
        {
            var allMatches = await _matchRepo.GetAllAsync();
            int updates = 0;

            if (finishedStage == "GROUP_STAGE")
            {
                // Get official standings to determine who qualified
                var standings = await _predictionService.GetSimulatedStandingsAsync(null);

                // Collect qualified teams by position per group
                // Each group: 1st, 2nd, (3rd goes to a pool)
                var groupWinners = new Dictionary<string, Guid>();   // GROUP_A -> 1st place teamId
                var groupRunners = new Dictionary<string, Guid>();   // GROUP_A -> 2nd place teamId
                var qualifiedThirds = new List<Guid>();

                foreach (var (groupKey, teams) in standings.Groups)
                {
                    var sorted = teams.OrderByDescending(t => t.Points)
                        .ThenByDescending(t => t.GoalDiff)
                        .ThenByDescending(t => t.GoalsFor)
                        .ToList();
                    if (sorted.Count >= 1) groupWinners[groupKey] = sorted[0].TeamId;
                    if (sorted.Count >= 2) groupRunners[groupKey] = sorted[1].TeamId;
                }

                foreach (var t in standings.OverallThirds.Where(t => t.IsQualified))
                    qualifiedThirds.Add(t.TeamId);

                // Build a list of all 32 qualified teams in bracket order
                // FIFA 2026 Round of 32 bracket (simplified — just pair winners vs runners from different groups)
                var allQualified = new List<Guid>();
                var groupLetters = new[] { "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L" };
                foreach (var g in groupLetters)
                {
                    var key = $"GROUP_{g}";
                    if (groupWinners.ContainsKey(key)) allQualified.Add(groupWinners[key]);
                    if (groupRunners.ContainsKey(key)) allQualified.Add(groupRunners[key]);
                }
                allQualified.AddRange(qualifiedThirds);

                // Assign qualified teams to LAST_32 matches in order
                var knockoutMatches = allMatches.Where(m => m.Stage == "LAST_32")
                    .OrderBy(m => m.Date).ThenBy(m => m.Time).ToList();

                for (int i = 0; i < knockoutMatches.Count && i * 2 + 1 < allQualified.Count; i++)
                {
                    var match = knockoutMatches[i];
                    match.HomeTeamId = allQualified[i * 2];
                    match.AwayTeamId = allQualified[i * 2 + 1];

                    var homeTeamName = standings.Groups.Values.SelectMany(g => g).FirstOrDefault(t => t.TeamId == match.HomeTeamId)?.Team?.Name;
                    var awayTeamName = standings.Groups.Values.SelectMany(g => g).FirstOrDefault(t => t.TeamId == match.AwayTeamId)?.Team?.Name;
                    if (homeTeamName == null) homeTeamName = standings.OverallThirds.FirstOrDefault(t => t.TeamId == match.HomeTeamId)?.Team?.Name;
                    if (awayTeamName == null) awayTeamName = standings.OverallThirds.FirstOrDefault(t => t.TeamId == match.AwayTeamId)?.Team?.Name;

                    match.HomeTeamName = homeTeamName;
                    match.AwayTeamName = awayTeamName;

                    await _matchRepo.UpdateAsync(match.Id, match);
                    updates++;
                }
            }
            else
            {
                // For knockout rounds: winners advance to next round
                var nextStage = finishedStage switch
                {
                    "LAST_32" => "LAST_16",
                    "LAST_16" => "QUARTER_FINALS",
                    "QUARTER_FINALS" => "SEMI_FINALS",
                    "SEMI_FINALS" => "FINAL",
                    _ => null
                };

                // Also handle third place from semis
                if (finishedStage == "SEMI_FINALS")
                {
                    var semiMatches = allMatches.Where(m => m.Stage == "SEMI_FINALS").OrderBy(m => m.Date).ToList();
                    var thirdPlaceMatch = allMatches.FirstOrDefault(m => m.Stage == "THIRD_PLACE");
                    if (thirdPlaceMatch != null && semiMatches.Count == 2)
                    {
                        // Losers go to third place
                        thirdPlaceMatch.HomeTeamId = GetLoser(semiMatches[0]);
                        thirdPlaceMatch.AwayTeamId = GetLoser(semiMatches[1]);
                        thirdPlaceMatch.HomeTeamName = semiMatches[0].RealHomeScore < semiMatches[0].RealAwayScore ? semiMatches[0].HomeTeamName : semiMatches[0].AwayTeamName;
                        thirdPlaceMatch.AwayTeamName = semiMatches[1].RealHomeScore < semiMatches[1].RealAwayScore ? semiMatches[1].HomeTeamName : semiMatches[1].AwayTeamName;
                        await _matchRepo.UpdateAsync(thirdPlaceMatch.Id, thirdPlaceMatch);
                        updates++;
                    }
                }

                if (nextStage != null)
                {
                    var finishedMatches = allMatches.Where(m => m.Stage == finishedStage)
                        .OrderBy(m => m.Date).ThenBy(m => m.Time).ToList();
                    var nextMatches = allMatches.Where(m => m.Stage == nextStage)
                        .OrderBy(m => m.Date).ThenBy(m => m.Time).ToList();

                    // Pair winners: match 1 winner vs match 2 winner, etc
                    for (int i = 0; i < nextMatches.Count && i * 2 + 1 < finishedMatches.Count; i++)
                    {
                        var m = nextMatches[i];
                        m.HomeTeamId = GetWinner(finishedMatches[i * 2]);
                        m.AwayTeamId = GetWinner(finishedMatches[i * 2 + 1]);
                        m.HomeTeamName = GetWinnerName(finishedMatches[i * 2]);
                        m.AwayTeamName = GetWinnerName(finishedMatches[i * 2 + 1]);
                        await _matchRepo.UpdateAsync(m.Id, m);
                        updates++;
                    }
                }
            }

            return updates;
        }

        private static Guid GetWinner(Match m)
        {
            if (m.RealHomeScore > m.RealAwayScore) return m.HomeTeamId;
            if (m.RealAwayScore > m.RealHomeScore) return m.AwayTeamId;
            // Draw: pick home as winner (penalty simulation)
            return m.HomeTeamId;
        }

        private static Guid GetLoser(Match m)
        {
            if (m.RealHomeScore > m.RealAwayScore) return m.AwayTeamId;
            if (m.RealAwayScore > m.RealHomeScore) return m.HomeTeamId;
            return m.AwayTeamId;
        }

        private static string? GetWinnerName(Match m)
        {
            if (m.RealHomeScore > m.RealAwayScore) return m.HomeTeamName;
            if (m.RealAwayScore > m.RealHomeScore) return m.AwayTeamName;
            return m.HomeTeamName;
        }

        // ==================== ADMIN AUTH & USERS ====================

        [HttpPost("login")]
        public ActionResult Login([FromBody] AdminLoginRequest request)
        {
            var adminUser = _config["Admin:Username"];
            var adminPass = _config["Admin:Password"];

            if (request.Username == adminUser && request.Password == adminPass)
            {
                return Ok(new { token = "admin-secret-token" });
            }

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

        /// <summary>
        /// Simula resultados aleatórios para um grupo inteiro via mock (não escreve no banco — o sync faz isso).
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
        /// Limpa todos os estados mock.
        /// </summary>
        [HttpDelete("mock/clear")]
        public ActionResult MockClear()
        {
            if (_mockProvider == null)
                return BadRequest("MockApi não está habilitado.");

            _mockProvider.ClearAll();
            return Ok(new { message = "Mock: Todos os estados limpos." });
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
}
