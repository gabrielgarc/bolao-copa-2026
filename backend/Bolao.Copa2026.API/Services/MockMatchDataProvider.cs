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
        private bool _initialized = false;
        private List<Match> _baseMatches = new();

        public MockMatchDataProvider(IServiceScopeFactory scopeFactory, ILogger<MockMatchDataProvider> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        /// <summary>
        /// Inicializa os dados base a partir do banco (só roda uma vez).
        /// </summary>
        private async Task EnsureInitializedAsync()
        {
            if (_initialized) return;

            using var scope = _scopeFactory.CreateScope();
            var matchRepo = scope.ServiceProvider.GetRequiredService<IRepository<DbMatch>>();
            var teamRepo = scope.ServiceProvider.GetRequiredService<IRepository<DbTeam>>();

            var dbMatches = await matchRepo.GetAllAsync();
            var teams = (await teamRepo.GetAllAsync())
                .GroupBy(t => t.Id)
                .ToDictionary(g => g.Key, g => g.First());

            _baseMatches = dbMatches
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
                .ToList();

            _initialized = true;
            _logger.LogInformation("MockMatchDataProvider inicializado com {Count} partidas do banco.", _baseMatches.Count);
        }

        public async Task<MatchesResponse?> GetMatchesAsync()
        {
            await EnsureInitializedAsync();

            // Aplica os overrides do mock sobre os dados base
            var matches = _baseMatches.Select(m =>
            {
                var clone = CloneMatch(m);
                if (m.Id.HasValue && _mockStates.TryGetValue(m.Id.Value, out var mockState))
                {
                    clone.Status = mockState.Status;
                    clone.Score = new Score
                    {
                        Winner = mockState.HomeScore > mockState.AwayScore ? "HOME_TEAM" :
                                 mockState.AwayScore > mockState.HomeScore ? "AWAY_TEAM" :
                                 mockState.HomeScore == mockState.AwayScore ? "DRAW" : null,
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
        }

        public void StartMatch(int apiId)
        {
            if (_mockStates.TryGetValue(apiId, out var state))
            {
                _mockStates[apiId] = state with { Status = "IN_PLAY" };
            }
            else
            {
                _mockStates[apiId] = new MockMatchState(0, 0, "IN_PLAY");
            }
            _logger.LogInformation("Mock: Match {ApiId} → IN_PLAY", apiId);
        }

        public void FinishMatch(int apiId)
        {
            if (_mockStates.TryGetValue(apiId, out var state))
            {
                _mockStates[apiId] = state with { Status = "FINISHED" };
            }
            else
            {
                _mockStates[apiId] = new MockMatchState(0, 0, "FINISHED");
            }
            _logger.LogInformation("Mock: Match {ApiId} → FINISHED", apiId);
        }

        public async Task<int> SimulateGroupAsync(string groupLetter)
        {
            await EnsureInitializedAsync();

            var letter = groupLetter.Trim().ToUpper();
            var possibleNames = new[] { $"Group {letter}", $"GROUP_{letter}", $"Grupo {letter}" };
            var rng = new Random();
            int count = 0;

            foreach (var match in _baseMatches.Where(m =>
                m.Group != null &&
                possibleNames.Any(n => m.Group.Equals(n, StringComparison.OrdinalIgnoreCase)) &&
                m.Id.HasValue))
            {
                var home = rng.Next(0, 5);
                var away = rng.Next(0, 5);
                SetMatchResult(match.Id!.Value, home, away, "FINISHED");
                count++;
            }

            _logger.LogInformation("Mock: Simulado grupo {Letter} com {Count} jogos (tentou: {Names}).", letter, count, string.Join(", ", possibleNames));
            return count;
        }

        /// <summary>
        /// Simula resultados aleatórios para todos os jogos de uma fase eliminatória.
        /// Stages válidos: LAST_32, LAST_16, QUARTER_FINALS, SEMI_FINALS, THIRD_PLACE, FINAL
        /// </summary>
        public async Task<int> SimulateStageAsync(string stage)
        {
            await EnsureInitializedAsync();

            var rng = new Random();
            int count = 0;

            foreach (var match in _baseMatches.Where(m =>
                m.Stage != null &&
                m.Stage.Equals(stage, StringComparison.OrdinalIgnoreCase) &&
                m.Id.HasValue))
            {
                var home = rng.Next(0, 4);
                var away = rng.Next(0, 4);
                // Avoid draws in knockout (re-roll once)
                if (home == away) away = rng.Next(0, 4);
                SetMatchResult(match.Id!.Value, home, away, "FINISHED");
                count++;
            }

            _logger.LogInformation("Mock: Simulado stage {Stage} com {Count} jogos.", stage, count);
            return count;
        }

        public Dictionary<int, MockMatchState> GetAllMockStates() => new(_mockStates);

        public void ClearAll()
        {
            _mockStates.Clear();
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
