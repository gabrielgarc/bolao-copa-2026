using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Bolao.Copa2026.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RankingController : ControllerBase
    {
        private readonly IRankingService _service;

        public RankingController(IRankingService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<List<RankingDto>>> GetLeaderboard()
        {
            var leaderboard = await _service.GetLeaderboardAsync();
            return Ok(leaderboard);
        }
    }
}
