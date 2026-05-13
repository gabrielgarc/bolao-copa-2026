using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using FootballData.Intergration.Data;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Match = FootballData.Intergration.Data.Match;
using DbMatch = Bolao.Copa2026.API.Models.Match;
using DbTeam = Bolao.Copa2026.API.Models.Team;

namespace Bolao.Copa2026.API.Services
{
    /// <summary>
    /// Provider mock — mantém estado em memória, populado pelo AdminController.
    /// Singleton: o estado persiste entre ciclos de sync.
    /// </summary>
    public class MockMatchDataProvider : IMatchDataProvider
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<MockMatchDataProvider> _logger;

        // Estado mock: ApiId → (homeScore, awayScore, status)
        private readonly Dictionary<int, MockMatchState> _mockStates = new();

        // Snapshots in-memory das partidas (atualizados a cada simul de fase)
        // ApiId → Match base info (inclui stage, group, teams)
        private Dictionary<int, Match> _baseMatchesById = new();
        private bool _initialized = false;

        public MockMatchDataProvider(IServiceScopeFactory scopeFactory, ILogger<MockMatchDataProvider> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        /// <summary>
        /// Carrega/atualiza o snapshot base a partir do banco.
        /// Chamado na primeira vez e após cada simulação de fase para refletir chaveamento.
        /// </summary>
        private async Task LoadFromDbAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            var matchRepo = scope.ServiceProvider.GetRequiredService<IRepository<DbMatch>>();
            var teamRepo = scope.ServiceProvider.GetRequiredService<IRepository<DbTeam>>();

            var dbMatches = await matchRepo.GetAllAsync();
            var teams = (await teamRepo.GetAllAsync())
                .GroupBy(t => t.Id)
                .ToDictionary(g => g.Key, g => g.First());

            _baseMatchesById = dbMatches
                .Where(m => m.ApiId != 0)
                .Select(m =>
                {
                    teams.TryGetValue(m.HomeTeamId, out var homeTeam);
                    teams.TryGetValue(m.AwayTeamId, out var awayTeam);

                    return new Match
                    {
                        Id = m.ApiId,
                        Status = m.Status ?? "TIMED",
                        Stage = m.Stage,
                        Group = m.Group,
                        UtcDate = DateTime.UtcNow,
                        HomeTeam = new MatchTeam
                        {
                            Id = homeTeam?.ApiId,
                            Name = homeTeam?.Name ?? "TBD",
                            ShortName = homeTeam?.Name ?? "TBD",
                            Tla = homeTeam?.Code ?? "TBD"
                        },
                        AwayTeam = new MatchTeam
                        {
                            Id = awayTeam?.ApiId,
                            Name = awayTeam?.Name ?? "TBD",
                            ShortName = awayTeam?.Name ?? "TBD",
                            Tla = awayTeam?.Code ?? "TBD"
                        },
                        Score = new Score
                        {
                            Winner = null,
                            Duration = "REGULAR",
                            FullTime = new FullTime { Home = m.RealHomeScore, Away = m.RealAwayScore },
                            HalfTime = new HalfTime { Home = null, Away = null }
                        }
                    };
                })
                .ToDictionary(m => m.Id!.Value);

            _initialized = true;
            _logger.LogInformation("MockMatchDataProvider carregado com {Count} partidas do banco.", _baseMatchesById.Count);
        }

        private async Task EnsureInitializedAsync()
        {
            if (!_initialized) await LoadFromDbAsync();
        }

        public async Task<MatchesResponse?> GetMatchesAsync()
        {
            await EnsureInitializedAsync();

            // Aplica os overrides do mock sobre os dados base
            var matches = _baseMatchesById.Values.Select(m =>
            {
                var clone = CloneMatch(m);
                if (m.Id.HasValue && _mockStates.TryGetValue(m.Id.Value, out var mockState))
                {
                    clone.Status = mockState.Status;
                    clone.Score = new Score
                    {
                        Winner = mockState.HomeScore > mockState.AwayScore ? "HOME_TEAM" :
                                 mockState.AwayScore > mockState.HomeScore ? "AWAY_TEAM" :
                                 "DRAW",
                        Duration = "REGULAR",
                        FullTime = new FullTime { Home = mockState.HomeScore, Away = mockState.AwayScore },
                        HalfTime = new HalfTime { Home = null, Away = null }
                    };
                }
                return clone;
            }).ToList();

            return new MatchesResponse
            {
                Matches = matches,
                ResultSet = new ResultSet { Count = matches.Count, Played = matches.Count(m => m.Status == "FINISHED") }
            };
        }

        // --- Métodos públicos para o AdminController manipular o estado ---

        public void SetMatchResult(int apiId, int homeScore, int awayScore, string status)
        {
            _mockStates[apiId] = new MockMatchState(homeScore, awayScore, status);
            _logger.LogInformation("Mock: Match {ApiId} → {Home}x{Away} ({Status})", apiId, homeScore, awayScore, status);

            if (status == "FINISHED")
            {
                // Dispara check assíncrono (fire and forget ou espera?)
                // Melhor disparar via Task.Run para não travar o set
                if (_baseMatchesById.TryGetValue(apiId, out var match))
                {
                    Task.Run(() => AutoCheckStageCompletionAsync(match.Stage!));
                }
            }
        }

        public void StartMatch(int apiId)
        {
            if (_mockStates.TryGetValue(apiId, out var state))
                _mockStates[apiId] = state with { Status = "IN_PLAY" };
            else
                _mockStates[apiId] = new MockMatchState(0, 0, "IN_PLAY");
            _logger.LogInformation("Mock: Match {ApiId} → IN_PLAY", apiId);
        }

        public void FinishMatch(int apiId)
        {
            if (_mockStates.TryGetValue(apiId, out var state))
                _mockStates[apiId] = state with { Status = "FINISHED" };
            else
                _mockStates[apiId] = new MockMatchState(0, 0, "FINISHED");
            _logger.LogInformation("Mock: Match {ApiId} → FINISHED", apiId);

            if (_baseMatchesById.TryGetValue(apiId, out var match))
            {
                Task.Run(() => AutoCheckStageCompletionAsync(match.Stage!));
            }
        }

        public async Task<int> SimulateGroupAsync(string groupLetter)
        {
            await EnsureInitializedAsync();

            var letter = groupLetter.Trim().ToUpper();
            var possibleNames = new[] { $"Group {letter}", $"GROUP_{letter}", $"Grupo {letter}" };
            var rng = new Random();
            int count = 0;

            foreach (var match in _baseMatchesById.Values.Where(m =>
                m.Group != null &&
                possibleNames.Any(n => m.Group.Equals(n, StringComparison.OrdinalIgnoreCase)) &&
                m.Id.HasValue))
            {
                var home = rng.Next(0, 5);
                var away = rng.Next(0, 5);
                SetMatchResult(match.Id!.Value, home, away, "FINISHED");
                count++;
            }

            _logger.LogInformation("Mock: Simulado grupo {Letter} com {Count} jogos.", letter, count);
            return count;
        }

        /// <summary>
        /// Simula resultados aleatórios para todos os jogos de uma fase e popula o próximo round.
        /// Para GROUP_STAGE: classifica times usando standings reais e preenche LAST_32.
        /// Para fases eliminatórias: propaga vencedores para o próximo round.
        /// </summary>
        public async Task<(int simulated, int bracketed)> SimulateStageAsync(string stage)
        {
            await EnsureInitializedAsync();

            var rng = new Random();
            int count = 0;

            var stageMatches = _baseMatchesById.Values
                .Where(m => m.Stage != null && m.Stage.Equals(stage, StringComparison.OrdinalIgnoreCase) && m.Id.HasValue)
                .OrderBy(m => m.UtcDate)
                .ToList();

            if (stageMatches.Count == 0)
            {
                _logger.LogWarning("Mock: Nenhuma partida encontrada para stage {Stage}.", stage);
                return (0, 0);
            }

            bool isKnockout = stage != "GROUP_STAGE";

            foreach (var match in stageMatches)
            {
                var home = rng.Next(0, 4);
                var away = rng.Next(0, 4);
                // Evita empate no mata-mata (re-rola uma vez)
                if (isKnockout && home == away)
                    away = (away + 1 + rng.Next(0, 3)) % 4;
                SetMatchResult(match.Id!.Value, home, away, "FINISHED");
                count++;
            }

            _logger.LogInformation("Mock: Simulado stage {Stage} com {Count} jogos.", stage, count);

            // Popula próxima fase baseado nas classificações reais
            int bracketed = await PopulateNextRoundAsync(stage);

            return (count, bracketed);
        }

        /// <summary>
        /// Simula todas as fases em ordem, com chaveamento correto entre elas.
        /// </summary>
        public async Task<(int totalSimulated, int totalBracketed)> SimulateAllStagesAsync()
        {
            var stagesInOrder = new[]
            {
                "GROUP_STAGE",
                "LAST_32",
                "LAST_16",
                "QUARTER_FINALS",
                "SEMI_FINALS",
                "THIRD_PLACE",
                "FINAL"
            };

            int totalSimulated = 0;
            int totalBracketed = 0;

            foreach (var stage in stagesInOrder)
            {
                // Recarrega do banco para pegar times do chaveamento que o sync escreveu
                await LoadFromDbAsync();

                var (sim, brk) = await SimulateStageAsync(stage);
                totalSimulated += sim;
                totalBracketed += brk;

                if (sim > 0)
                    _logger.LogInformation("Mock ALL: {Stage} → {Sim} simulados, {Brk} chaveamentos.", stage, sim, brk);
            }
            return (totalSimulated, totalBracketed);
        }

        /// <summary>
        /// Encontra o próximo jogo cronológico que ainda não tem resultado e simula um placar.
        /// </summary>
        public async Task<DbMatch?> SimulateNextMatchAsync()
        {
            await EnsureInitializedAsync();

            using var scope = _scopeFactory.CreateScope();
            var matchRepo = scope.ServiceProvider.GetRequiredService<IRepository<DbMatch>>();
            var allDbMatches = await matchRepo.GetAllAsync();

            // Encontra a primeira partida (por data/hora) que ainda não tem resultado no banco E nem no mock atual
            var nextMatch = allDbMatches
                .Where(m => !m.RealHomeScore.HasValue && !_mockStates.ContainsKey(m.ApiId) && m.ApiId != 0 && m.HomeTeamId != Guid.Empty && m.AwayTeamId != Guid.Empty)
                .OrderBy(m => m.Date)
                .ThenBy(m => m.Time)
                .FirstOrDefault();

            if (nextMatch != null)
            {
                var rng = new Random();
                var home = rng.Next(0, 4);
                var away = rng.Next(0, 4);

                // Evita empate no mata-mata
                if (nextMatch.Stage != "GROUP_STAGE" && home == away)
                    home++;

                SetMatchResult(nextMatch.ApiId, home, away, "FINISHED");
                _logger.LogInformation("Mock NEXT: Simulada partida {Id} ({Home} {H}x{A} {Away})", nextMatch.ApiId, nextMatch.HomeTeamName, home, away, nextMatch.AwayTeamName);
                
                await AutoCheckStageCompletionAsync(nextMatch.Stage!);
            }

            return nextMatch;
        }

        private async Task AutoCheckStageCompletionAsync(string stage)
        {
            await EnsureInitializedAsync();
            var stageMatches = _baseMatchesById.Values
                .Where(m => m.Stage != null && m.Stage.Equals(stage, StringComparison.OrdinalIgnoreCase))
                .ToList();

            if (stageMatches.Count > 0 && stageMatches.All(m => 
                (_mockStates.TryGetValue(m.Id!.Value, out var s) && s.Status == "FINISHED") || 
                m.Status == "FINISHED"))
            {
                _logger.LogInformation("Mock: Fase {Stage} completa! Populando próxima fase...", stage);
                await PopulateNextRoundAsync(stage);
            }
        }

        public async Task<int> RecalculateBracketsAsync()
        {
            return await PopulateNextRoundAsync("GROUP_STAGE");
        }

        /// <summary>
        /// Após simular uma fase, usa as classificações do banco (atualizadas pelo sync) para
        /// preencher o chaveamento da próxima fase nos _baseMatchesById em memória.
        /// Nota: os times já estão no banco após o sync processar os mocks da fase anterior.
        /// </summary>
        private async Task<int> PopulateNextRoundAsync(string finishedStage)
        {
            using var scope = _scopeFactory.CreateScope();
            var matchRepo = scope.ServiceProvider.GetRequiredService<IRepository<DbMatch>>();
            var teamRepo = scope.ServiceProvider.GetRequiredService<IRepository<DbTeam>>();
            var predictionService = scope.ServiceProvider.GetRequiredService<IPredictionService>();

            var allDbMatches = await matchRepo.GetAllAsync();
            var teams = (await teamRepo.GetAllAsync()).ToDictionary(t => t.Id);
            int updates = 0;

            if (finishedStage == "GROUP_STAGE")
            {
                // Calcula standings usando os mocks atuais
                var groupStandings = ComputeGroupStandingsFromMock(allDbMatches, teams);

                // Coleta classificados: 1º e 2º de cada grupo (12 grupos) + 8 melhores 3ºs
                var qualified = new List<(Guid id, string name)>();
                var allThirds = new List<(Guid id, string name, int pts, int gd, int gf)>();

                var groupLetters = new[] { "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L" };
                foreach (var g in groupLetters)
                {
                    var key = $"GROUP_{g}";
                    if (groupStandings.TryGetValue(key, out var standings))
                    {
                        if (standings.Count >= 1) qualified.Add(standings[0]);
                        if (standings.Count >= 2) qualified.Add(standings[1]);
                        if (standings.Count >= 3)
                        {
                            var third = standings[2];
                            var stats = GetTeamStats(key, third.id, allDbMatches);
                            allThirds.Add((third.id, third.name, stats.pts, stats.gd, stats.gf));
                        }
                    }
                }

                // Best 8 thirds
                var qualifiedThirds = allThirds
                    .OrderByDescending(t => t.pts)
                    .ThenByDescending(t => t.gd)
                    .ThenByDescending(t => t.gf)
                    .Take(8)
                    .Select(t => (t.id, t.name))
                    .ToList();

                qualified.AddRange(qualifiedThirds);

                // Atualiza partidas LAST_32 sequencialmente (32 times -> 16 matches)
                var last32Db = allDbMatches.Where(m => m.Stage == "LAST_32")
                    .OrderBy(m => m.ApiId).ToList(); // Usa ApiId para ordem sequencial (73, 74...)

                for (int i = 0; i < last32Db.Count && i * 2 + 1 < qualified.Count; i++)
                {
                    var dbMatch = last32Db[i];
                    dbMatch.HomeTeamId = qualified[i * 2].id;
                    dbMatch.HomeTeamName = qualified[i * 2].name;
                    dbMatch.AwayTeamId = qualified[i * 2 + 1].id;
                    dbMatch.AwayTeamName = qualified[i * 2 + 1].name;
                    await matchRepo.UpdateAsync(dbMatch.Id, dbMatch);
                    updates++;

                    if (dbMatch.ApiId != 0 && _baseMatchesById.TryGetValue(dbMatch.ApiId, out var baseMatch))
                    {
                        baseMatch.HomeTeam = new MatchTeam { Name = dbMatch.HomeTeamName, Id = teams.GetValueOrDefault(dbMatch.HomeTeamId)?.ApiId };
                        baseMatch.AwayTeam = new MatchTeam { Name = dbMatch.AwayTeamName, Id = teams.GetValueOrDefault(dbMatch.AwayTeamId)?.ApiId };
                    }
                }
            }
            else
            {
                // Fases eliminatórias: propagamos vencedores/perdedores sequencialmente
                var nextStage = finishedStage switch
                {
                    "LAST_32" => "LAST_16",
                    "LAST_16" => "QUARTER_FINALS",
                    "QUARTER_FINALS" => "SEMI_FINALS",
                    "SEMI_FINALS" => "FINAL",
                    _ => null
                };

                var finishedDbMatches = allDbMatches.Where(m => m.Stage == finishedStage)
                    .OrderBy(m => m.ApiId).ToList();

                if (finishedStage == "SEMI_FINALS")
                {
                    var thirdPlaceMatch = allDbMatches.FirstOrDefault(m => m.Stage == "THIRD_PLACE");
                    var finalMatch = allDbMatches.FirstOrDefault(m => m.Stage == "FINAL");

                    if (finishedDbMatches.Count >= 2)
                    {
                        var (w1Id, w1Name) = GetWinnerFromMock(finishedDbMatches[0]);
                        var (w2Id, w2Name) = GetWinnerFromMock(finishedDbMatches[1]);
                        var (l1Id, l1Name) = GetLoserFromMock(finishedDbMatches[0]);
                        var (l2Id, l2Name) = GetLoserFromMock(finishedDbMatches[1]);

                        if (finalMatch != null)
                        {
                            finalMatch.HomeTeamId = w1Id; finalMatch.HomeTeamName = w1Name;
                            finalMatch.AwayTeamId = w2Id; finalMatch.AwayTeamName = w2Name;
                            await matchRepo.UpdateAsync(finalMatch.Id, finalMatch);
                            updates++;
                        }
                        if (thirdPlaceMatch != null)
                        {
                            thirdPlaceMatch.HomeTeamId = l1Id; thirdPlaceMatch.HomeTeamName = l1Name;
                            thirdPlaceMatch.AwayTeamId = l2Id; thirdPlaceMatch.AwayTeamName = l2Name;
                            await matchRepo.UpdateAsync(thirdPlaceMatch.Id, thirdPlaceMatch);
                            updates++;
                        }
                    }
                }
                else if (nextStage != null)
                {
                    var nextDbMatches = allDbMatches.Where(m => m.Stage == nextStage)
                        .OrderBy(m => m.ApiId).ToList();

                    for (int i = 0; i < nextDbMatches.Count && i * 2 + 1 < finishedDbMatches.Count; i++)
                    {
                        var nextMatch = nextDbMatches[i];
                        var (w1Id, w1Name) = GetWinnerFromMock(finishedDbMatches[i * 2]);
                        var (w2Id, w2Name) = GetWinnerFromMock(finishedDbMatches[i * 2 + 1]);

                        nextMatch.HomeTeamId = w1Id; nextMatch.HomeTeamName = w1Name;
                        nextMatch.AwayTeamId = w2Id; nextMatch.AwayTeamName = w2Name;
                        await matchRepo.UpdateAsync(nextMatch.Id, nextMatch);
                        updates++;

                        if (nextMatch.ApiId != 0 && _baseMatchesById.TryGetValue(nextMatch.ApiId, out var baseNext))
                        {
                            baseNext.HomeTeam = new MatchTeam { Name = w1Name };
                            baseNext.AwayTeam = new MatchTeam { Name = w2Name };
                        }
                    }
                }
            }

            _logger.LogInformation("Mock: Chaveamento após {Stage} → {Count} partidas atualizadas.", finishedStage, updates);
            return updates;
        }

        /// <summary>
        /// Calcula standings dos grupos usando os estados mock atuais (não o banco).
        /// Retorna Dict groupKey → lista ordenada de (teamId, teamName).
        /// </summary>
        private Dictionary<string, List<(Guid id, string name)>> ComputeGroupStandingsFromMock(
            List<DbMatch> allDbMatches, Dictionary<Guid, DbTeam> teams)
        {
            var groupMatches = allDbMatches.Where(m => m.Stage == "GROUP_STAGE").ToList();
            var result = new Dictionary<string, List<(Guid, string)>>();

            var matchesByGroup = groupMatches.GroupBy(m => NormalizeGroup(m.Group ?? ""));

            foreach (var grp in matchesByGroup)
            {
                var statsMap = new Dictionary<Guid, (int pts, int gd, int gf, string name)>();

                foreach (var match in grp)
                {
                    int? homeScore = null;
                    int? awayScore = null;

                    if (match.ApiId != 0 && _mockStates.TryGetValue(match.ApiId, out var state))
                    {
                        homeScore = state.HomeScore;
                        awayScore = state.AwayScore;
                    }
                    else if (match.RealHomeScore.HasValue)
                    {
                        homeScore = match.RealHomeScore;
                        awayScore = match.RealAwayScore;
                    }

                    var homeName = teams.GetValueOrDefault(match.HomeTeamId)?.Name ?? "TBD";
                    var awayName = teams.GetValueOrDefault(match.AwayTeamId)?.Name ?? "TBD";

                    if (!statsMap.ContainsKey(match.HomeTeamId)) statsMap[match.HomeTeamId] = (0, 0, 0, homeName);
                    if (!statsMap.ContainsKey(match.AwayTeamId)) statsMap[match.AwayTeamId] = (0, 0, 0, awayName);

                    if (homeScore.HasValue && awayScore.HasValue)
                    {
                        var h = statsMap[match.HomeTeamId];
                        var a = statsMap[match.AwayTeamId];

                        int hPts = 0, aPts = 0;
                        if (homeScore > awayScore) { hPts = 3; }
                        else if (awayScore > homeScore) { aPts = 3; }
                        else { hPts = 1; aPts = 1; }

                        statsMap[match.HomeTeamId] = (h.pts + hPts, h.gd + (homeScore.Value - awayScore.Value), h.gf + homeScore.Value, h.name);
                        statsMap[match.AwayTeamId] = (a.pts + aPts, a.gd + (awayScore.Value - homeScore.Value), a.gf + awayScore.Value, a.name);
                    }
                }

                var groupKey = $"GROUP_{grp.Key}";
                result[groupKey] = statsMap
                    .OrderByDescending(kvp => kvp.Value.pts)
                    .ThenByDescending(kvp => kvp.Value.gd)
                    .ThenByDescending(kvp => kvp.Value.gf)
                    .Select(kvp => (kvp.Key, kvp.Value.name))
                    .ToList();
            }

            return result;
        }

        private static string NormalizeGroup(string group)
        {
            // "Group A", "Grupo A", "GROUP_A" → "A"
            group = group.Trim();
            if (group.StartsWith("GROUP_", StringComparison.OrdinalIgnoreCase))
                return group.Substring(6).Trim().ToUpper();
            var parts = group.Split(' ');
            return parts.Length >= 2 ? parts[^1].ToUpper() : group.ToUpper();
        }

        private (int pts, int gd, int gf) GetTeamStats(string groupKey, Guid teamId, List<DbMatch> allMatches)
        {
            int pts = 0, gd = 0, gf = 0;
            var gMatches = allMatches.Where(m => m.Stage == "GROUP_STAGE" && NormalizeGroup(m.Group ?? "") == NormalizeGroup(groupKey));
            foreach (var m in gMatches)
            {
                int? hs = null, as_ = null;
                if (m.ApiId != 0 && _mockStates.TryGetValue(m.ApiId, out var s)) { hs = s.HomeScore; as_ = s.AwayScore; }
                else if (m.RealHomeScore.HasValue) { hs = m.RealHomeScore; as_ = m.RealAwayScore; }
                if (!hs.HasValue) continue;

                if (m.HomeTeamId == teamId)
                {
                    gf += hs.Value; gd += hs.Value - as_!.Value;
                    if (hs > as_) pts += 3; else if (hs == as_) pts += 1;
                }
                else if (m.AwayTeamId == teamId)
                {
                    gf += as_!.Value; gd += as_.Value - hs.Value;
                    if (as_ > hs) pts += 3; else if (as_ == hs) pts += 1;
                }
            }
            return (pts, gd, gf);
        }

        /// <summary>Retorna o vencedor de uma partida do banco usando o estado mock atual.</summary>
        private (Guid id, string name) GetWinnerFromMock(DbMatch m)
        {
            int? hs = null, as_ = null;
            if (m.ApiId != 0 && _mockStates.TryGetValue(m.ApiId, out var s)) { hs = s.HomeScore; as_ = s.AwayScore; }
            else if (m.RealHomeScore.HasValue) { hs = m.RealHomeScore; as_ = m.RealAwayScore; }

            if (hs.HasValue && hs > as_) return (m.HomeTeamId, m.HomeTeamName ?? "TBD");
            if (hs.HasValue && as_ > hs) return (m.AwayTeamId, m.AwayTeamName ?? "TBD");
            // Empate: home avança (simulação de pênaltis)
            return (m.HomeTeamId, m.HomeTeamName ?? "TBD");
        }

        private (Guid id, string name) GetLoserFromMock(DbMatch m)
        {
            int? hs = null, as_ = null;
            if (m.ApiId != 0 && _mockStates.TryGetValue(m.ApiId, out var s)) { hs = s.HomeScore; as_ = s.AwayScore; }
            else if (m.RealHomeScore.HasValue) { hs = m.RealHomeScore; as_ = m.RealAwayScore; }

            if (hs.HasValue && hs > as_) return (m.AwayTeamId, m.AwayTeamName ?? "TBD");
            if (hs.HasValue && as_ > hs) return (m.HomeTeamId, m.HomeTeamName ?? "TBD");
            return (m.AwayTeamId, m.AwayTeamName ?? "TBD");
        }

        public Dictionary<int, MockMatchState> GetAllMockStates() => new(_mockStates);

        public void ClearAll()
        {
            _mockStates.Clear();
            _initialized = false; // força recarregar do banco na próxima chamada
            _logger.LogInformation("Mock: Todos os estados mock limpos.");
        }

        private static Match CloneMatch(Match m) => new()
        {
            Id = m.Id,
            Status = m.Status,
            Stage = m.Stage,
            Group = m.Group,
            UtcDate = m.UtcDate,
            HomeTeam = m.HomeTeam,
            AwayTeam = m.AwayTeam,
            Score = m.Score
        };
    }

    public record MockMatchState(int HomeScore, int AwayScore, string Status);
}
