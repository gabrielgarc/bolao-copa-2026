using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Bolao.Copa2026.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MatchesController : ControllerBase
    {
        private readonly IMatchService _service;

        public MatchesController(IMatchService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<List<MatchDto>>> GetMatches()
        {
            var matches = await _service.GetAllMatchesAsync();
            return Ok(matches);
        }
    }
}
