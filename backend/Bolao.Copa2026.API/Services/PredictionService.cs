using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;

namespace Bolao.Copa2026.API.Services
{
    public class PredictionService : IPredictionService
    {
        private readonly IRepository<Prediction> _predictionRepo;
        private readonly IRepository<Match> _matchRepo;
        private readonly IRepository<User> _userRepo;
        private readonly IRepository<Team> _teamRepo;

        public PredictionService(IRepository<Prediction> predictionRepo, IRepository<Match> matchRepo, IRepository<User> userRepo, IRepository<Team> teamRepo)
        {
            _predictionRepo = predictionRepo;
            _matchRepo = matchRepo;
            _userRepo = userRepo;
            _teamRepo = teamRepo;
        }

        public async Task<Dictionary<Guid, PredictionDto>> GetUserPredictionsAsync(Guid userId)
        {
            var preds = await _predictionRepo.FindAsync(p => p.UserId == userId);

            var dict = new Dictionary<Guid, PredictionDto>();
            foreach(var p in preds)
            {
                dict[p.MatchId] = new PredictionDto(p.MatchId, p.HomeScore.ToString(), p.AwayScore.ToString());
            }
            return dict;
        }

        public async Task<(bool Success, string Message, StandingsResponseDto? UpdatedStandings)> SavePredictionAsync(Guid userId, CreatePredictionDto dto)
        {
            if (!int.TryParse(dto.HomeScore, out int home) || !int.TryParse(dto.AwayScore, out int away))
            {
                return (false, "Placares inválidos", null);
            }

            var match = await _matchRepo.GetByIdAsync(dto.MatchId);
            if (match == null) return (false, "Jogo não encontrado", null);
            
            if (match.IsLocked || match.RealHomeScore.HasValue) 
                return (false, "Este jogo já está fechado para palpites", null);

            if (!string.IsNullOrEmpty(match.Date) && !string.IsNullOrEmpty(match.Time))
            {
                try 
                {
                    int year = 2026, month = 1, day = 1;
                    if (match.Date.Contains('-'))
                    {
                        var dateParts = match.Date.Split('-');
                        year = int.Parse(dateParts[0]);
                        month = int.Parse(dateParts[1]);
                        day = int.Parse(dateParts[2]);
                    }
                    else
                    {
                        var dateParts = match.Date.Split('/');
                        day = int.Parse(dateParts[0]);
                        month = int.Parse(dateParts[1]);
                    }

                    var timeParts = match.Time.Split(':');
                    int hour = int.Parse(timeParts[0]);
                    int min = int.Parse(timeParts[1]);
                    
                    // As datas no banco de dados estão em UTC (do apiMatch.UtcDate)
                    var matchDateTimeUtc = new DateTime(year, month, day, hour, min, 0, DateTimeKind.Utc);
                    var nowUtc = DateTime.UtcNow;
                    
                    // Trava o jogo se o tempo atual em UTC já passou do horário do jogo em UTC
                    if (nowUtc >= matchDateTimeUtc)
                    {
                        return (false, "O horário deste jogo já passou!", null);
                    }
                } 
                catch { /* Ignorar erros de parseamento da string do JSON */ }
            }

            var existing = await _predictionRepo.FindOneAsync(p => p.UserId == userId && p.MatchId == dto.MatchId);

            var updateTime = DateTime.UtcNow.AddHours(-3);

            if (existing != null)
            {
                existing.HomeScore = home;
                existing.AwayScore = away;
                existing.LastUpdated = updateTime;
                await _predictionRepo.UpdateAsync(existing.Id, existing);
            }
            else
            {
                await _predictionRepo.CreateAsync(new Prediction
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    MatchId = dto.MatchId,
                    HomeScore = home,
                    AwayScore = away,
                    LastUpdated = updateTime
                });
            }

            var updatedStandings = await GetSimulatedStandingsAsync(userId);
            return (true, "Sucesso", updatedStandings);
        }

        public async Task<StandingsResponseDto> GetSimulatedStandingsAsync(Guid? userId)
        {
            var matchesTask = _matchRepo.GetAllAsync();
            var predictionsTask = userId.HasValue ? _predictionRepo.FindAsync(p => p.UserId == userId.Value) : Task.FromResult(new List<Prediction>());
            var teamsTask = _teamRepo.GetAllAsync();

            await Task.WhenAll(matchesTask, predictionsTask, teamsTask);

            var matches = matchesTask.Result.Where(m => m.IsGroupStage).ToList();
            var predictions = predictionsTask.Result
                .GroupBy(p => p.MatchId)
                .ToDictionary(g => g.Key, g => g.First());
            var teams = teamsTask.Result
                .GroupBy(t => t.Id)
                .ToDictionary(g => g.Key, g => g.First());

            var response = new StandingsResponseDto();

            // 1. Group Matches
            var matchesByGroup = matches.GroupBy(m => m.Group).ToList();

            foreach (var groupMatches in matchesByGroup)
            {
                var statsMap = new Dictionary<Guid, TeamStatsDto>();

                // Initialize teams
                foreach (var match in groupMatches)
                {
                    if (!statsMap.ContainsKey(match.HomeTeamId) && teams.ContainsKey(match.HomeTeamId))
                        statsMap[match.HomeTeamId] = new TeamStatsDto { TeamId = match.HomeTeamId, Team = teams[match.HomeTeamId] };

                    if (!statsMap.ContainsKey(match.AwayTeamId) && teams.ContainsKey(match.AwayTeamId))
                        statsMap[match.AwayTeamId] = new TeamStatsDto { TeamId = match.AwayTeamId, Team = teams[match.AwayTeamId] };
                }

                // When scoring for a specific user, determine how many predictions they have in this group.
                // - 0 predictions  → leave the group table zeroed (no scores processed)
                // - ≥1 predictions → process only predicted games (no fallback to real scores)
                // - userId == null → official standings, use real scores as fallback (original behaviour)
                bool isUserMode = userId.HasValue;
                int userPredsInGroup = isUserMode
                    ? groupMatches.Count(m => predictions.ContainsKey(m.Id))
                    : 0;

                if (isUserMode && userPredsInGroup == 0)
                {
                    // No predictions in this group – skip score processing entirely
                    response.Groups[groupMatches.Key] = statsMap.Values
                        .OrderBy(t => t.Team.Name)
                        .ToList();
                    continue;
                }

                // Process simulations
                foreach (var match in groupMatches)
                {
                    int? hScore = null;
                    int? aScore = null;

                    if (predictions.TryGetValue(match.Id, out var pred))
                    {
                        hScore = pred.HomeScore;
                        aScore = pred.AwayScore;
                    }
                    else if (!isUserMode && match.RealHomeScore.HasValue && match.RealAwayScore.HasValue)
                    {
                        // Official standings only: fall back to real result
                        hScore = match.RealHomeScore;
                        aScore = match.RealAwayScore;
                    }
                    // isUserMode with no prediction for this match → hScore/aScore remain null → game skipped

                    if (hScore.HasValue && aScore.HasValue)
                    {
                        var homeStats = statsMap[match.HomeTeamId];
                        var awayStats = statsMap[match.AwayTeamId];

                        homeStats.Played++;
                        awayStats.Played++;

                        homeStats.GoalsFor += hScore.Value;
                        homeStats.GoalsAgainst += aScore.Value;
                        homeStats.GoalDiff += (hScore.Value - aScore.Value);

                        awayStats.GoalsFor += aScore.Value;
                        awayStats.GoalsAgainst += hScore.Value;
                        awayStats.GoalDiff += (aScore.Value - hScore.Value);

                        if (hScore.Value > aScore.Value)
                        {
                            homeStats.Points += 3;
                            homeStats.Won++;
                            awayStats.Lost++;
                        }
                        else if (aScore.Value > hScore.Value)
                        {
                            awayStats.Points += 3;
                            awayStats.Won++;
                            homeStats.Lost++;
                        }
                        else
                        {
                            homeStats.Points += 1;
                            homeStats.Drawn++;
                            awayStats.Points += 1;
                            awayStats.Drawn++;
                        }
                    }
                }

                // Sorting - Algoritmo Avançado de Desempate (Regras da FIFA)
                var sortedGroup = statsMap.Values.ToList();
                
                // Passo 1: Agrupar por Critérios Gerais (Pontos, Saldo, Gols Pró)
                var tiers = sortedGroup
                    .GroupBy(t => new { t.Points, t.GoalDiff, t.GoalsFor })
                    .OrderByDescending(g => g.Key.Points)
                    .ThenByDescending(g => g.Key.GoalDiff)
                    .ThenByDescending(g => g.Key.GoalsFor)
                    .ToList();

                var finalSortedGroup = new List<TeamStatsDto>();

                foreach (var tier in tiers)
                {
                    var tiedTeams = tier.ToList();
                    
                    if (tiedTeams.Count == 1)
                    {
                        finalSortedGroup.Add(tiedTeams[0]);
                    }
                    else
                    {
                        // Passo 2: Empate detectado - Criar Mini-Tabela de Confronto Direto
                        var tiedTeamIds = tiedTeams.Select(t => t.TeamId).ToHashSet();
                        
                        var h2hStats = new Dictionary<Guid, TeamStatsDto>();
                        foreach (var tId in tiedTeamIds)
                        {
                            h2hStats[tId] = new TeamStatsDto { TeamId = tId, Team = statsMap[tId].Team };
                        }

                        // Processar apenas os jogos entre as equipes empatadas
                        var tiedMatches = groupMatches.Where(m => tiedTeamIds.Contains(m.HomeTeamId) && tiedTeamIds.Contains(m.AwayTeamId));
                        
                        foreach (var match in tiedMatches)
                        {
                            int? hScore = null, aScore = null;
                            if (predictions.TryGetValue(match.Id, out var p))
                            {
                                hScore = p.HomeScore;
                                aScore = p.AwayScore;
                            }
                            else if (!isUserMode && match.RealHomeScore.HasValue && match.RealAwayScore.HasValue)
                            {
                                hScore = match.RealHomeScore;
                                aScore = match.RealAwayScore;
                            }

                            if (hScore.HasValue && aScore.HasValue)
                            {
                                var h = h2hStats[match.HomeTeamId];
                                var a = h2hStats[match.AwayTeamId];
                                
                                h.GoalsFor += hScore.Value;
                                a.GoalsFor += aScore.Value;
                                h.GoalDiff += (hScore.Value - aScore.Value);
                                a.GoalDiff += (aScore.Value - hScore.Value);
                                
                                if (hScore.Value > aScore.Value) h.Points += 3;
                                else if (aScore.Value > hScore.Value) a.Points += 3;
                                else { h.Points += 1; a.Points += 1; }
                            }
                        }

                        // Passo 3: Ordenar o subgrupo usando os dados da Mini-Tabela
                        tiedTeams.Sort((a, b) => 
                        {
                            var h2hA = h2hStats[a.TeamId];
                            var h2hB = h2hStats[b.TeamId];

                            // Critérios de Confronto Direto
                            if (h2hB.Points != h2hA.Points) return h2hB.Points.CompareTo(h2hA.Points);
                            if (h2hB.GoalDiff != h2hA.GoalDiff) return h2hB.GoalDiff.CompareTo(h2hA.GoalDiff);
                            if (h2hB.GoalsFor != h2hA.GoalsFor) return h2hB.GoalsFor.CompareTo(h2hA.GoalsFor);

                            // Passo 4: Fair Play / Sorteio (Override Manual)
                            if (b.Team.TiebreakerScore != a.Team.TiebreakerScore) 
                                return b.Team.TiebreakerScore.CompareTo(a.Team.TiebreakerScore);

                            return a.Team.Name.CompareTo(b.Team.Name);
                        });

                        finalSortedGroup.AddRange(tiedTeams);
                    }
                }

                // Top 2 Qualified
                for (int i = 0; i < finalSortedGroup.Count; i++)
                {
                    if (i < 2) finalSortedGroup[i].IsQualified = true;
                }

                response.Groups[groupMatches.Key] = finalSortedGroup;
            }

            // Repescagem - Third places
            var thirdPlaces = response.Groups.Values
                .Where(g => g.Count >= 3)
                .Select(g => g[2])
                .ToList();

            thirdPlaces.Sort((a, b) => 
            {
                if (b.Points != a.Points) 
                    return b.Points.CompareTo(a.Points);
                if (b.GoalDiff != a.GoalDiff) 
                    return b.GoalDiff.CompareTo(a.GoalDiff);
                if (b.GoalsFor != a.GoalsFor) 
                    return b.GoalsFor.CompareTo(a.GoalsFor);
                if (b.Team.TiebreakerScore != a.Team.TiebreakerScore) 
                    return b.Team.TiebreakerScore.CompareTo(a.Team.TiebreakerScore);
                return a.Team.Name.CompareTo(b.Team.Name);
            });

            for (int i = 0; i < thirdPlaces.Count; i++)
            {
                if (i < 8) thirdPlaces[i].IsQualified = true;
            }

            response.OverallThirds = thirdPlaces;
            return response;
        }
    }
}

