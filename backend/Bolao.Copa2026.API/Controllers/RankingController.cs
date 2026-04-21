using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using Bolao.Copa2026.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Bolao.Copa2026.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RankingController : ControllerBase
    {
        private readonly IRankingService _service;
        private readonly IRepository<UserRanking> _userRankingRepo;

        public RankingController(IRankingService service, IRepository<UserRanking> userRankingRepo)
        {
            _service = service;
            _userRankingRepo = userRankingRepo;
        }

        [HttpGet]
        public async Task<ActionResult<List<RankingDto>>> GetLeaderboard()
        {
            var leaderboard = await _service.GetLeaderboardAsync();
            return Ok(leaderboard);
        }

        [HttpGet("me")]
        public async Task<ActionResult> GetMyRanking()
        {
            var userIdStr = Request.Headers["X-User-Id"].FirstOrDefault();
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var ranking = await _userRankingRepo.FindOneAsync(r => r.UserId == userId);
            if (ranking == null)
                return Ok(new { pointsByMatch = new Dictionary<string, int>(), totalPoints = 0, qualifiedTeamsCount = 0 });

            return Ok(new
            {
                pointsByMatch = ranking.PointsByMatch,
                pointsByStage = ranking.PointsByStage,
                totalPoints = ranking.TotalPoints,
                fullMatches = ranking.FullMatches,
                halfMatches = ranking.HalfMatches,
                outcomeMatches = ranking.OutcomeMatches,
                partialMatches = ranking.PartialMatches,
                qualifiedTeamsCount = ranking.QualifiedTeamsCount,
                correctQualifiedTeamIds = ranking.CorrectQualifiedTeamIds
            });
        }
    }
}
