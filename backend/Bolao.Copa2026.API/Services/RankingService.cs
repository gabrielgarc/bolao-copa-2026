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
                .Select(u => new RankingDto(u.UserId, u.Name, u.TotalPoints, u.Avatar, u.FullMatches, u.QualifiedTeamsCount, u.HalfMatches, u.OutcomeMatches, u.PartialMatches, u.ZeroMatches))
                .ToList();

            // Add users that are registered but don't have a ranking entry yet
            foreach (var user in users)
            {
                if (!leaderboard.Any(r => r.Id == user.Id))
                {
                    leaderboard.Add(new RankingDto(user.Id, user.Name, 0, user.Avatar, 0, 0, 0, 0, 0, 0));
                }
            }

            return leaderboard
                .OrderByDescending(u => u.Points)
                .ThenByDescending(u => u.FullMatches)
                .ThenByDescending(u => u.QualifiedTeamsCount)
                .ThenByDescending(u => u.HalfMatches)
                .ThenByDescending(u => u.OutcomeMatches)
                .ThenByDescending(u => u.PartialMatches)
                .ToList();
        }

        public async Task RecalculateAllPoints()
        {
            var matches = await _matchRepo.GetAllAsync();
            var validMatches = matches
                .Where(m => m.RealHomeScore != null && m.RealAwayScore != null)
                .ToList();

            // Identify which individual groups are fully finished
            var groupStageMatches = matches.Where(m => m.Stage == "GROUP_STAGE").ToList();
            var matchesByGroup = groupStageMatches.GroupBy(m => m.Group).ToDictionary(g => g.Key, g => g.ToList());
            
            var finishedGroups = new HashSet<string>();
            foreach (var (groupName, groupMatches) in matchesByGroup)
            {
                if (groupMatches.All(m => m.Status == "FINISHED"))
                    finishedGroups.Add(groupName);
            }
            
            bool allGroupStageFinished = groupStageMatches.Count > 0 &&
                groupStageMatches.All(m => m.Status == "FINISHED");

            // Get official standings (based on real results, userId=null)
            var officialStandings = await _predictionService.GetSimulatedStandingsAsync(null);
            
            // Build official qualified teams per group (1st & 2nd) for finished groups
            var officialQualifiedPerGroup = new Dictionary<string, HashSet<Guid>>();
            
            // Normalize finished group names to lowercase for comparison
            var finishedGroupsLower = finishedGroups.Select(g => g.ToLowerInvariant()).ToHashSet();
            
            foreach (var (groupKey, teams) in officialStandings.Groups)
            {
                // Check all possible representations of this group name
                var possibleNames = new[] { 
                    groupKey, 
                    groupKey.Replace("GROUP_", "Grupo "),
                    groupKey.Replace("GROUP_", "Group "),
                    groupKey.Replace("Grupo ", "GROUP_"),
                    groupKey.Replace("Group ", "GROUP_"),
                    groupKey.Replace("Grupo ", "Group "),
                    groupKey.Replace("Group ", "Grupo ")
                };
                
                bool groupFinished = possibleNames.Any(n => finishedGroupsLower.Contains(n.ToLowerInvariant()));
                
                if (groupFinished)
                {
                    var qualifiedIds = teams.Take(2).Where(t => t.IsQualified).Select(t => t.TeamId).ToHashSet();
                    officialQualifiedPerGroup[groupKey] = qualifiedIds;
                }
            }
            
            // 3rd place qualifiers only available when ALL groups finished
            var officialThirdPlaceTeams = new HashSet<Guid>();
            if (allGroupStageFinished)
            {
                foreach (var team in officialStandings.OverallThirds.Where(t => t.IsQualified))
                    officialThirdPlaceTeams.Add(team.TeamId);
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
                int zeroMatches = 0;
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
                        else if (result.Type == "NONE") zeroMatches++;
                    }
                }

                var userStandings = await _predictionService.GetSimulatedStandingsAsync(user.Id);
                int qualifiedTeamsCount = 0;
                var correctQualifiedTeamIds = new List<Guid>();
                var qualifiedTeamStatuses = new Dictionary<string, string>();
                var qualificationBonusByGroup = new Dictionary<string, int>();

                // Build a set of group names where the user has at least 1 prediction.
                // This is used to prevent awarding qualified-team points for groups with no predictions.
                var userPredMatchIds = new HashSet<Guid>(userPreds.Select(p => p.MatchId));
                var groupsWithPredictions = new HashSet<string>(
                    groupStageMatches
                        .Where(m => userPredMatchIds.Contains(m.Id))
                        .Select(m => m.Group),
                    StringComparer.OrdinalIgnoreCase);

                // Check 1st & 2nd place per finished group
                foreach (var (groupKey, userGroupTeams) in userStandings.Groups)
                {
                    var groupLetter = ExtractGroupLetter(groupKey);
                    int groupBonus = 0;

                    // If the user made no predictions in this group, they earn 0 qualified-team points.
                    bool hasPredictionInGroup = groupsWithPredictions.Any(g =>
                        ExtractGroupLetter(g) == groupLetter);

                    if (!hasPredictionInGroup)
                    {
                        qualificationBonusByGroup[groupLetter] = 0;
                        continue;
                    }

                    // Find matching official group (flexible key matching)
                    var officialKey = officialQualifiedPerGroup.Keys.FirstOrDefault(k =>
                        k.Equals(groupKey, StringComparison.OrdinalIgnoreCase) ||
                        ExtractGroupLetter(k) == groupLetter);
                    
                    // Check if this specific group is finished
                    var possibleGroupNames = new[] { groupKey, $"GROUP_{groupLetter}", $"Group {groupLetter}", $"Grupo {groupLetter}" };
                    bool thisGroupFinished = possibleGroupNames.Any(n => finishedGroupsLower.Contains(n.ToLowerInvariant()));

                    foreach (var team in userGroupTeams.Where(t => t.IsQualified))
                    {
                        var teamIdStr = team.TeamId.ToString();
                        var pos = userGroupTeams.IndexOf(team);
                        
                        if (pos < 2)
                        {
                            // 1st & 2nd: check against this group's official qualifiers
                            if (!thisGroupFinished)
                            {
                                qualifiedTeamStatuses[teamIdStr] = "waiting";
                            }
                            else if (officialKey != null && officialQualifiedPerGroup[officialKey].Contains(team.TeamId))
                            {
                                qualifiedTeamStatuses[teamIdStr] = "correct";
                                qualifiedTeamsCount++;
                                correctQualifiedTeamIds.Add(team.TeamId);
                                groupBonus += 50;
                            }
                            else
                            {
                                qualifiedTeamStatuses[teamIdStr] = "wrong";
                            }
                        }
                        else
                        {
                            // 3rd place: check against overall thirds (only when all groups finished)
                            if (!allGroupStageFinished)
                            {
                                qualifiedTeamStatuses[teamIdStr] = "waiting";
                            }
                            else if (officialThirdPlaceTeams.Contains(team.TeamId))
                            {
                                qualifiedTeamStatuses[teamIdStr] = "correct";
                                qualifiedTeamsCount++;
                                if (!correctQualifiedTeamIds.Contains(team.TeamId))
                                    correctQualifiedTeamIds.Add(team.TeamId);
                                groupBonus += 50;
                            }
                            else
                            {
                                qualifiedTeamStatuses[teamIdStr] = "wrong";
                            }
                        }
                    }

                    qualificationBonusByGroup[groupLetter] = groupBonus;
                }
                
                // Also check 3rd place from overallThirds
                if (allGroupStageFinished)
                {
                    foreach (var team in userStandings.OverallThirds.Where(t => t.IsQualified))
                    {
                        var teamIdStr = team.TeamId.ToString();
                        if (!qualifiedTeamStatuses.ContainsKey(teamIdStr))
                        {
                            if (officialThirdPlaceTeams.Contains(team.TeamId))
                            {
                                qualifiedTeamStatuses[teamIdStr] = "correct";
                                qualifiedTeamsCount++;
                                if (!correctQualifiedTeamIds.Contains(team.TeamId))
                                    correctQualifiedTeamIds.Add(team.TeamId);
                            }
                            else
                            {
                                qualifiedTeamStatuses[teamIdStr] = "wrong";
                            }
                        }
                    }
                }

                totalPoints += qualifiedTeamsCount * 50;

                var existing = await _userRankingRepo.FindOneAsync(r => r.UserId == user.Id);
                if (existing == null)
                {
                    await _userRankingRepo.CreateAsync(new UserRanking
                    {
                        UserId = user.Id,
                        UserName = user.UserName,
                        Name = user.Name,
                        Avatar = user.Avatar,
                        TotalPoints = totalPoints,
                        FullMatches = fullMatches,
                        HalfMatches = halfMatches,
                        OutcomeMatches = outcomeMatches,
                        PartialMatches = partialMatches,
                        ZeroMatches = zeroMatches,
                        QualifiedTeamsCount = qualifiedTeamsCount,
                        PointsByMatch = pointsByMatch,
                        PointsByStage = pointsByStage,
                        CorrectQualifiedTeamIds = correctQualifiedTeamIds,
                        QualifiedTeamStatuses = qualifiedTeamStatuses,
                        QualificationBonusByGroup = qualificationBonusByGroup
                    });
                }
                else
                {
                    existing.UserName = user.UserName;
                    existing.Name = user.Name;
                    existing.Avatar = user.Avatar;
                    existing.TotalPoints = totalPoints;
                    existing.FullMatches = fullMatches;
                    existing.HalfMatches = halfMatches;
                    existing.OutcomeMatches = outcomeMatches;
                    existing.PartialMatches = partialMatches;
                    existing.ZeroMatches = zeroMatches;
                    existing.QualifiedTeamsCount = qualifiedTeamsCount;
                    existing.PointsByMatch = pointsByMatch;
                    existing.PointsByStage = pointsByStage;
                    existing.CorrectQualifiedTeamIds = correctQualifiedTeamIds;
                    existing.QualifiedTeamStatuses = qualifiedTeamStatuses;
                    existing.QualificationBonusByGroup = qualificationBonusByGroup;
                    await _userRankingRepo.UpdateAsync(existing.Id, existing);
                }
            }
        }

        public static (int Points, string Type) CalculatePoints(int predHome, int predAway, int realHome, int realAway, string stage)
        {
            int weight = stage switch
            {
                "GROUP_STAGE" => 1,
                "LAST_32" => 3,
                "ROUND_OF_32" => 3,
                "LAST_16" => 5,
                "ROUND_OF_16" => 5,
                "QUARTER_FINALS" => 7,
                "SEMI_FINALS" => 9,
                "THIRD_PLACE" => 10,
                "FINAL" => 15,
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

        /// <summary>
        /// Extracts the group letter from any format: "GROUP_A" -> "A", "Group A" -> "A", "Grupo A" -> "A"
        /// </summary>
        private static string ExtractGroupLetter(string groupName)
        {
            return groupName
                .Replace("GROUP_", "", StringComparison.OrdinalIgnoreCase)
                .Replace("Group ", "", StringComparison.OrdinalIgnoreCase)
                .Replace("Grupo ", "", StringComparison.OrdinalIgnoreCase)
                .Trim()
                .ToUpperInvariant();
        }
    }
}
