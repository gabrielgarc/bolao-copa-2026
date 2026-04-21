using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using FootballData.Intergration.Modules;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;

namespace Bolao.Copa2026.API.Services
{
    public class MatchSyncBackgroundService : BackgroundService
    {
        private readonly ILogger<MatchSyncBackgroundService> _logger;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly int _intervalSeconds;
        private readonly bool _syncEnabled;

        public MatchSyncBackgroundService(
            ILogger<MatchSyncBackgroundService> logger, 
            IServiceScopeFactory scopeFactory, 
            IOptions<MatchPollingConfig> config)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
            _intervalSeconds = config.Value.IntervalSeconds;
            _syncEnabled = config.Value.SyncEnabled;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Match Sync Background Service rodando com intervalo de {Interval} segundos.", _intervalSeconds);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await SyncMatchesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao sincronizar partidas da Copa do Mundo.");
                }

                await Task.Delay(TimeSpan.FromSeconds(_intervalSeconds), stoppingToken);
            }
        }

        private async Task SyncMatchesAsync()
        {
            using var scope = _scopeFactory.CreateScope();
            int updatedCount = 0;

            if (_syncEnabled)
            {
                _logger.LogInformation("Sincronizando partidas...");

                var matchesModule = scope.ServiceProvider.GetRequiredService<MatchesModule>();
                var matchRepo = scope.ServiceProvider.GetRequiredService<IRepository<Match>>();

                var apiMatchesResponse = await matchesModule.GetWorldCupMatchesAsync();
                if (apiMatchesResponse?.Matches != null)
                {
                    var dbMatchesList = await matchRepo.GetAllAsync();
                    var dbMatches = dbMatchesList.Where(m => m.ApiId != 0).ToDictionary(m => m.ApiId);

                    foreach (var apiMatch in apiMatchesResponse.Matches)
                    {
                        if (apiMatch.Id.HasValue && dbMatches.TryGetValue(apiMatch.Id.Value, out var dbMatch))
                        {
                            bool hasChanges = false;

                            if (dbMatch.RealHomeScore != apiMatch.Score?.FullTime?.Home)
                            {
                                dbMatch.RealHomeScore = apiMatch.Score?.FullTime?.Home;
                                hasChanges = true;
                            }

                            if (dbMatch.RealAwayScore != apiMatch.Score?.FullTime?.Away)
                            {
                                dbMatch.RealAwayScore = apiMatch.Score?.FullTime?.Away;
                                hasChanges = true;
                            }

                            string status = apiMatch.Status ?? string.Empty;
                            bool isLockedNow = status == "FINISHED" || status == "IN_PLAY" || status == "PAUSED";

                            if (dbMatch.IsLocked != isLockedNow)
                            {
                                dbMatch.IsLocked = isLockedNow;
                                hasChanges = true;
                            }

                            if (dbMatch.Status != status)
                            {
                                dbMatch.Status = status;
                                hasChanges = true;
                            }

                            var teamRepo = scope.ServiceProvider.GetRequiredService<IRepository<Team>>();
                            if (apiMatch.HomeTeam?.Id != null)
                            {
                                var homeTeam = await teamRepo.FindOneAsync(t => t.ApiId == apiMatch.HomeTeam.Id);
                                if (homeTeam != null && dbMatch.HomeTeamId != homeTeam.Id)
                                {
                                    dbMatch.HomeTeamId = homeTeam.Id;
                                    dbMatch.HomeTeamName = homeTeam.Name;
                                    hasChanges = true;
                                }
                            }
                            if (apiMatch.AwayTeam?.Id != null)
                            {
                                var awayTeam = await teamRepo.FindOneAsync(t => t.ApiId == apiMatch.AwayTeam.Id);
                                if (awayTeam != null && dbMatch.AwayTeamId != awayTeam.Id)
                                {
                                    dbMatch.AwayTeamId = awayTeam.Id;
                                    dbMatch.AwayTeamName = awayTeam.Name;
                                    hasChanges = true;
                                }
                            }

                            if (hasChanges)
                            {
                                await matchRepo.UpdateAsync(dbMatch.Id, dbMatch);
                                updatedCount++;
                            }
                        }
                    }

                    if (updatedCount > 0)
                        _logger.LogInformation("Partidas sincronizadas com sucesso. {Count} atualizadas.", updatedCount);
                }
            }
            else
            {
                _logger.LogDebug("Sincronização de partidas desativada (SyncEnabled=false). Apenas recalculando ranking.");
            }

            // Ranking recalculation always runs
            var rankingRepo = scope.ServiceProvider.GetRequiredService<IRepository<UserRanking>>();
            bool rankingIsEmpty = !await rankingRepo.AnyAsync();

            if (updatedCount > 0 || rankingIsEmpty)
            {
                _logger.LogInformation("Recalculando pontuação dos participantes...");
                var rankingService = scope.ServiceProvider.GetRequiredService<IRankingService>();
                await rankingService.RecalculateAllPoints();
                _logger.LogInformation("Pontuação recalculada com sucesso.");
            }
        }
    }
}
