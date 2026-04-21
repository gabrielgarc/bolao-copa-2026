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
        private Guid CURRENT_USER_ID; 

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
                    
                    var matchDateTime = new DateTime(year, month, day, hour, min, 0);
                    var nowBrasilia = DateTime.UtcNow.AddHours(-3);
                    
                    if (nowBrasilia >= matchDateTime)
                    {
                        return (false, "O horário deste jogo já passou!", null);
                    }
                } 
                catch { /* Ignorar erros de parseamento da string do JSON */ }
            }

            var existing = await _predictionRepo.FindOneAsync(p => p.UserId == userId && p.MatchId == dto.MatchId);

            if (existing != null)
            {
                existing.HomeScore = home;
                existing.AwayScore = away;
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
                    AwayScore = away
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
            var predictions = predictionsTask.Result.ToDictionary(p => p.MatchId);
            var teams = teamsTask.Result.ToDictionary(t => t.Id);

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
                    else if (match.RealHomeScore.HasValue && match.RealAwayScore.HasValue)
                    {
                        hScore = match.RealHomeScore;
                        aScore = match.RealAwayScore;
                    }

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

                // Sorting
                var sortedGroup = statsMap.Values.ToList();
                sortedGroup.Sort((a, b) => 
                {
                    if (b.Points != a.Points) return b.Points.CompareTo(a.Points);
                    if (b.GoalDiff != a.GoalDiff) return b.GoalDiff.CompareTo(a.GoalDiff);
                    if (b.GoalsFor != a.GoalsFor) return b.GoalsFor.CompareTo(a.GoalsFor);

                    // Head-to-Head
                    var directMatch = groupMatches.FirstOrDefault(m => 
                        (m.HomeTeamId == a.TeamId && m.AwayTeamId == b.TeamId) || 
                        (m.HomeTeamId == b.TeamId && m.AwayTeamId == a.TeamId));

                    if (directMatch != null)
                    {
                        int? hScore = null, aScore = null;
                        if (predictions.TryGetValue(directMatch.Id, out var p))
                        {
                            hScore = p.HomeScore;
                            aScore = p.AwayScore;
                        }
                        else if (directMatch.RealHomeScore.HasValue)
                        {
                            hScore = directMatch.RealHomeScore;
                            aScore = directMatch.RealAwayScore;
                        }

                        if (hScore.HasValue && aScore.HasValue && hScore.Value != aScore.Value)
                        {
                            bool homeWon = hScore.Value > aScore.Value;
                            if (directMatch.HomeTeamId == a.TeamId) return homeWon ? -1 : 1;
                            if (directMatch.HomeTeamId == b.TeamId) return homeWon ? 1 : -1;
                        }
                    }

                    // Tiebreaker Score (Manual Override)
                    if (b.Team.TiebreakerScore != a.Team.TiebreakerScore) 
                        return b.Team.TiebreakerScore.CompareTo(a.Team.TiebreakerScore);

                    return a.Team.Name.CompareTo(b.Team.Name);
                });

                // Top 2 Qualified
                for (int i = 0; i < sortedGroup.Count; i++)
                {
                    if (i < 2) sortedGroup[i].IsQualified = true;
                }

                response.Groups[groupMatches.Key] = sortedGroup;
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

