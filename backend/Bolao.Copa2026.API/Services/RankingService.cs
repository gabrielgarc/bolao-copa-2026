using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;

namespace Bolao.Copa2026.API.Services
{
    public class RankingService : IRankingService
    {
        private readonly IRepository<User> _userRepo;
        private readonly IRepository<Match> _matchRepo;
        private readonly IRepository<Prediction> _predictionRepo;
        private readonly IPredictionService _predictionService;
        private readonly IRepository<UserRanking> _userRankingRepo;

        public RankingService(
            IRepository<User> userRepo, 
            IRepository<Match> matchRepo, 
            IRepository<Prediction> predictionRepo,
            IPredictionService predictionService,
            IRepository<UserRanking> userRankingRepo)
        {
            _userRepo = userRepo;
            _matchRepo = matchRepo;
            _predictionRepo = predictionRepo;
            _predictionService = predictionService;
            _userRankingRepo = userRankingRepo;
        }

        public async Task<List<RankingDto>> GetLeaderboardAsync()
        {
            var userRankings = await _userRankingRepo.GetAllAsync();
            var users = await _userRepo.GetAllAsync();

            var leaderboard = userRankings
                .Select(u => new RankingDto(u.UserId, u.UserName, u.TotalPoints, u.Avatar, u.FullMatches, u.QualifiedTeamsCount, u.HalfMatches, u.OutcomeMatches))
                .ToList();

            // Add users that are registered but don't have a ranking entry yet
            foreach (var user in users)
            {
                if (!leaderboard.Any(r => r.Id == user.Id))
                {
                    leaderboard.Add(new RankingDto(user.Id, user.UserName, 0, user.Avatar, 0, 0, 0, 0));
                }
            }

            return leaderboard
                .OrderByDescending(u => u.Points)
                .ThenByDescending(u => u.FullMatches)
                .ThenByDescending(u => u.QualifiedTeamsCount)
                .ThenByDescending(u => u.HalfMatches)
                .ThenByDescending(u => u.OutcomeMatches)
                .ToList();
        }

        public async Task RecalculateAllPoints()
        {
            var matches = await _matchRepo.GetAllAsync();
            var validMatches = matches
                .Where(m => m.RealHomeScore != null && m.RealAwayScore != null)
                .ToList();

            // Only award qualified-team bonus after ALL group stage matches are FINISHED
            var groupStageMatches = matches.Where(m => m.Stage == "GROUP_STAGE").ToList();
            bool allGroupStageFinished = groupStageMatches.Count > 0 &&
                groupStageMatches.All(m => m.Status == "FINISHED");

            var officialQualifiedTeams = new HashSet<Guid>();
            if (allGroupStageFinished)
            {
                var officialStandings = await _predictionService.GetSimulatedStandingsAsync(null);
                foreach (var group in officialStandings.Groups.Values)
                {
                    foreach (var team in group.Where(t => t.IsQualified).Select(t => t.TeamId))
                        officialQualifiedTeams.Add(team);
                }
                foreach (var team in officialStandings.OverallThirds.Where(t => t.IsQualified).Select(t => t.TeamId))
                    officialQualifiedTeams.Add(team);
            }

            var users = await _userRepo.GetAllAsync();
            var predictions = await _predictionRepo.GetAllAsync();

            foreach (var user in users)
            {
                int totalPoints = 0;
                int fullMatches = 0;
                int halfMatches = 0;
                int outcomeMatches = 0;
                int partialMatches = 0;
                var pointsByMatch = new Dictionary<string, int>();
                var pointsByStage = new Dictionary<string, int>();
                var userPreds = predictions.Where(p => p.UserId == user.Id).ToList();

                foreach (var pred in userPreds)
                {
                    var match = validMatches.FirstOrDefault(m => m.Id == pred.MatchId);
                    if (match != null && match.RealHomeScore.HasValue && match.RealAwayScore.HasValue)
                    {
                        var result = CalculatePoints(pred.HomeScore, pred.AwayScore, match.RealHomeScore.Value, match.RealAwayScore.Value, match.Stage);
                        totalPoints += result.Points;
                        pointsByMatch[match.Id.ToString()] = result.Points;

                        if (!pointsByStage.ContainsKey(match.Stage)) pointsByStage[match.Stage] = 0;
                        pointsByStage[match.Stage] += result.Points;

                        if (result.Type == "FULL") fullMatches++;
                        else if (result.Type == "HALF") halfMatches++;
                        else if (result.Type == "OUTCOME") outcomeMatches++;
                        else if (result.Type == "PARTIAL") partialMatches++;
                    }
                }

                var userStandings = await _predictionService.GetSimulatedStandingsAsync(user.Id);
                int qualifiedTeamsCount = 0;
                var correctQualifiedTeamIds = new List<Guid>();

                foreach (var group in userStandings.Groups.Values)
                {
                    foreach (var team in group.Where(t => t.IsQualified))
                    {
                        if (officialQualifiedTeams.Contains(team.TeamId))
                        {
                            qualifiedTeamsCount++;
                            correctQualifiedTeamIds.Add(team.TeamId);
                        }
                    }
                }
                foreach (var team in userStandings.OverallThirds.Where(t => t.IsQualified))
                {
                    if (officialQualifiedTeams.Contains(team.TeamId))
                    {
                        qualifiedTeamsCount++;
                        if (!correctQualifiedTeamIds.Contains(team.TeamId))
                        {
                            correctQualifiedTeamIds.Add(team.TeamId);
                        }
                    }
                }

                totalPoints += qualifiedTeamsCount * 100;

                var existing = await _userRankingRepo.FindOneAsync(r => r.UserId == user.Id);
                if (existing == null)
                {
                    await _userRankingRepo.CreateAsync(new UserRanking
                    {
                        UserId = user.Id,
                        UserName = user.UserName,
                        Avatar = user.Avatar,
                        TotalPoints = totalPoints,
                        FullMatches = fullMatches,
                        HalfMatches = halfMatches,
                        OutcomeMatches = outcomeMatches,
                        PartialMatches = partialMatches,
                        QualifiedTeamsCount = qualifiedTeamsCount,
                        PointsByMatch = pointsByMatch,
                        PointsByStage = pointsByStage,
                        CorrectQualifiedTeamIds = correctQualifiedTeamIds
                    });
                }
                else
                {
                    existing.UserName = user.UserName;
                    existing.Avatar = user.Avatar;
                    existing.TotalPoints = totalPoints;
                    existing.FullMatches = fullMatches;
                    existing.HalfMatches = halfMatches;
                    existing.OutcomeMatches = outcomeMatches;
                    existing.PartialMatches = partialMatches;
                    existing.QualifiedTeamsCount = qualifiedTeamsCount;
                    existing.PointsByMatch = pointsByMatch;
                    existing.PointsByStage = pointsByStage;
                    existing.CorrectQualifiedTeamIds = correctQualifiedTeamIds;
                    await _userRankingRepo.UpdateAsync(existing.Id, existing);
                }
            }
        }

        public static (int Points, string Type) CalculatePoints(int predHome, int predAway, int realHome, int realAway, string stage)
        {
            int weight = stage switch
            {
                "GROUP_STAGE" => 1,
                "LAST_32" => 2,
                "ROUND_OF_32" => 2,
                "LAST_16" => 3,
                "ROUND_OF_16" => 3,
                "QUARTER_FINALS" => 4,
                "SEMI_FINALS" => 5,
                "THIRD_PLACE" => 6,
                "FINAL" => 7,
                _ => 1
            };

            bool homeMatch = predHome == realHome;
            bool awayMatch = predAway == realAway;

            string predWinner = predHome > predAway ? "HOME" : predHome < predAway ? "AWAY" : "DRAW";
            string realWinner = realHome > realAway ? "HOME" : realHome < realAway ? "AWAY" : "DRAW";
            bool winnerMatch = predWinner == realWinner;

            // 120 pts: both scores correct (winner is implicitly correct too)
            if (homeMatch && awayMatch)
                return (120 * weight, "FULL");

            // 90 pts: correct winner + one score
            if (winnerMatch && (homeMatch || awayMatch))
                return (90 * weight, "HALF");

            // 60 pts: correct winner only
            if (winnerMatch)
                return (60 * weight, "OUTCOME");

            // 30 pts: one score correct even with wrong winner
            if (homeMatch || awayMatch)
                return (30 * weight, "PARTIAL");

            return (0, "NONE");
        }
    }
}
