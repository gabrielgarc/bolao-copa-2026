using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Bolao.Copa2026.API.Services
{
    public class AiCommentBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<AiCommentBackgroundService> _logger;

        public AiCommentBackgroundService(IServiceProvider serviceProvider, ILogger<AiCommentBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var commentRepo = scope.ServiceProvider.GetRequiredService<IRepository<AiComment>>();
                var comments = await commentRepo.GetAllAsync();
                var today = DateTime.UtcNow.Date;
                if (!comments.Any(c => c.CreatedAt.Date == today))
                {
                    _logger.LogInformation("[AiComment] Nenhum comentário encontrado hoje. Gerando imediatamente no startup...");
                    await GenerateAndSaveCommentAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AiComment] Erro ao verificar/gerar comentário inicial no startup.");
            }

            while (!stoppingToken.IsCancellationRequested)
            {
                var nextRunTime = GetNextRunTime();
                var delay = nextRunTime - DateTimeOffset.Now;

                if (delay > TimeSpan.Zero)
                {
                    _logger.LogInformation($"[AiComment] Aguardando {delay}. Próxima execução: {nextRunTime}");
                    try
                    {
                        await Task.Delay(delay, stoppingToken);
                    }
                    catch (TaskCanceledException)
                    {
                        break;
                    }
                }

                if (!stoppingToken.IsCancellationRequested)
                {
                    await GenerateAndSaveCommentAsync();
                    // Pequeno delay após execução para evitar rodar várias vezes no mesmo segundo
                    await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
                }
            }
        }

        private DateTimeOffset GetNextRunTime()
        {
            using var scope = _serviceProvider.CreateScope();
            var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
            var scheduleStr = config["AiCommentSchedule"] ?? "05:00"; 
            
            if (!TimeSpan.TryParse(scheduleStr, out var timeOfDay))
            {
                timeOfDay = new TimeSpan(5, 0, 0);
            }

            TimeZoneInfo brtZone;
            try {
                brtZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            } catch {
                try {
                    brtZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
                } catch {
                    brtZone = TimeZoneInfo.CreateCustomTimeZone("BRT", new TimeSpan(-3, 0, 0), "BRT", "BRT");
                }
            }

            var nowBrt = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, brtZone);
            var nextRunDateBrt = nowBrt.Date + timeOfDay;
            
            if (nextRunDateBrt <= nowBrt)
            {
                nextRunDateBrt = nextRunDateBrt.AddDays(1);
            }

            return new DateTimeOffset(nextRunDateBrt, brtZone.GetUtcOffset(nextRunDateBrt));
        }

        private async Task GenerateAndSaveCommentAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var geminiService = scope.ServiceProvider.GetRequiredService<IGeminiService>();
            var commentRepo = scope.ServiceProvider.GetRequiredService<IRepository<AiComment>>();
            var matchRepo = scope.ServiceProvider.GetRequiredService<IRepository<Match>>();
            var userRepo = scope.ServiceProvider.GetRequiredService<IRepository<User>>();
            var userRankingRepo = scope.ServiceProvider.GetRequiredService<IRepository<UserRanking>>();
            var predictionRepo = scope.ServiceProvider.GetRequiredService<IRepository<Prediction>>();

            _logger.LogInformation("[AiComment] Iniciando geração do comentário diário...");

            try
            {
                var matches = await matchRepo.GetAllAsync();
                var users = await userRepo.GetAllAsync();
                var rankings = await userRankingRepo.GetAllAsync();
                var predictions = await predictionRepo.GetAllAsync();
                var comments = await commentRepo.GetAllAsync();

                var finishedMatches = matches.Where(m => m.Status == "FINISHED" || m.Status == "IN_PLAY" || m.IsLocked).ToList();
                var futureMatches = matches.Where(m => m.Status != "FINISHED" && m.Status != "IN_PLAY" && !m.IsLocked).ToList();

                var topUsers = rankings.OrderByDescending(r => r.TotalPoints).Take(3).ToList();
                var bottomUsers = rankings.OrderBy(r => r.TotalPoints).Take(3).ToList();

                var recentComments = comments.OrderByDescending(c => c.CreatedAt).Take(5).ToList();

                var contextBuilder = new System.Text.StringBuilder();

                if (recentComments.Any())
                {
                    contextBuilder.AppendLine("=== ÚLTIMOS COMENTÁRIOS GERADOS (Para dar continuidade) ===");
                    foreach (var c in recentComments)
                    {
                        contextBuilder.AppendLine($"[{c.CreatedAt:dd/MM/yyyy}] {c.Content}");
                    }
                    contextBuilder.AppendLine();
                }

                contextBuilder.AppendLine("=== RANKING (Top 3 e Últimos 3) ===");
                foreach (var r in topUsers)
                {
                    var user = users.FirstOrDefault(u => u.Id == r.UserId);
                    if(user != null) contextBuilder.AppendLine($"Top: {user.Name} - {r.TotalPoints} pts");
                }
                foreach (var r in bottomUsers)
                {
                    var user = users.FirstOrDefault(u => u.Id == r.UserId);
                    if(user != null) contextBuilder.AppendLine($"Lanterna: {user.Name} - {r.TotalPoints} pts");
                }

                contextBuilder.AppendLine("\n=== JOGOS JÁ REALIZADOS ===");
                foreach (var m in finishedMatches.OrderByDescending(m => m.Date).Take(5))
                {
                    contextBuilder.AppendLine($"Jogo: {m.HomeTeamName} {m.RealHomeScore} x {m.RealAwayScore} {m.AwayTeamName}");
                    var matchPreds = predictions.Where(p => p.MatchId == m.Id).ToList();
                    foreach(var p in matchPreds)
                    {
                        var user = users.FirstOrDefault(u => u.Id == p.UserId);
                        if(user != null)
                            contextBuilder.AppendLine($" - {user.Name} apostou {p.HomeScore}x{p.AwayScore}");
                    }
                }

                contextBuilder.AppendLine("\n=== PRÓXIMOS JOGOS (ESTATÍSTICAS GERAIS) ===");
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

                int maxRetries = 10;
                for (int i = 0; i < maxRetries; i++)
                {
                    try
                    {
                        var generatedText = await geminiService.GenerateCommentaryAsync(contextBuilder.ToString());
                        
                        var newComment = new AiComment
                        {
                            Content = generatedText,
                            CreatedAt = DateTime.UtcNow
                        };

                        await commentRepo.CreateAsync(newComment);
                        _logger.LogInformation("[AiComment] Comentário gerado e salvo com sucesso no banco.");
                        break; // Sucesso, sai do loop de tentativas
                    }
                    catch (Exception ex)
                    {
                        if (i == maxRetries - 1)
                        {
                            _logger.LogError(ex, $"[AiComment] Erro ao gerar comentário após {maxRetries} tentativas. Nenhum comentário foi salvo hoje.");
                        }
                        else
                        {
                            _logger.LogWarning(ex, $"[AiComment] Erro ao gerar comentário (Tentativa {i + 1}/{maxRetries}). Tentando novamente em 5 minutos...");
                            await Task.Delay(TimeSpan.FromMinutes(5));
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[AiComment] Erro fatal na construção do contexto para gerar o comentário.");
            }
        }
    }
}
