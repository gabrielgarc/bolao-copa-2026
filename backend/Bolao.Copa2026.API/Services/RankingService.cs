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

        public RankingService(
            IRepository<User> userRepo, 
            IRepository<Match> matchRepo, 
            IRepository<Prediction> predictionRepo)
        {
            _userRepo = userRepo;
            _matchRepo = matchRepo;
            _predictionRepo = predictionRepo;
        }

        public async Task<List<RankingDto>> GetLeaderboardAsync()
        {
            await RecalculateAllPoints();

            var users = await _userRepo.GetAllAsync();

            return users
                .OrderByDescending(u => u.TotalPoints)
                .Select(u => new RankingDto(u.Id, u.UserName, u.TotalPoints, u.Avatar))
                .ToList();
        }

        private async Task RecalculateAllPoints()
        {
            var matches = await _matchRepo.GetAllAsync();
            var validMatches = matches
                .Where(m => m.RealHomeScore != null && m.RealAwayScore != null)
                .ToList();

            var users = await _userRepo.GetAllAsync();
            var predictions = await _predictionRepo.GetAllAsync();

            foreach (var user in users)
            {
                int totalPoints = 0;
                var userPreds = predictions.Where(p => p.UserId == user.Id).ToList();

                foreach (var pred in userPreds)
                {
                    var match = validMatches.FirstOrDefault(m => m.Id == pred.MatchId);
                    if (match != null && match.RealHomeScore.HasValue && match.RealAwayScore.HasValue)
                    {
                        totalPoints += CalculatePoints(pred.HomeScore, pred.AwayScore, match.RealHomeScore.Value, match.RealAwayScore.Value);
                    }
                }

                if (user.TotalPoints != totalPoints)
                {
                    user.TotalPoints = totalPoints;
                    await _userRepo.UpdateAsync(user.Id, user);
                }
            }
        }

        public static int CalculatePoints(int predHome, int predAway, int realHome, int realAway)
        {
            if (predHome == realHome && predAway == realAway) return 3;

            string predWinner = predHome > predAway ? "HOME" : predHome < predAway ? "AWAY" : "DRAW";
            string realWinner = realHome > realAway ? "HOME" : realHome < realAway ? "AWAY" : "DRAW";

            if (predWinner != realWinner) return 0;
            if (predHome == realHome || predAway == realAway) return 2;
            return 1;
        }
    }
}
