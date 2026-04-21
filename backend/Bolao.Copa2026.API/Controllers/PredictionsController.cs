using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Bolao.Copa2026.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PredictionsController : ControllerBase
    {
        private readonly IPredictionService _service;

        public PredictionsController(IPredictionService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<Dictionary<Guid, PredictionDto>>> GetMyPredictions()
        {
            var userIdStr = Request.Headers["X-User-Id"].FirstOrDefault();
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var result = await _service.GetUserPredictionsAsync(userId);
            return Ok(result);
        }

        [HttpGet("standings")]
        public async Task<ActionResult<StandingsResponseDto>> GetSimulatedStandings([FromQuery] bool official = false)
        {
            Guid? userId = null;

            if (!official) 
            {
                var userIdStr = Request.Headers["X-User-Id"].FirstOrDefault();
                if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid parsedId))
                    return Unauthorized();
                userId = parsedId;
            }

            var result = await _service.GetSimulatedStandingsAsync(userId);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> SavePrediction([FromBody] CreatePredictionDto dto)
        {
            var userIdStr = Request.Headers["X-User-Id"].FirstOrDefault();
            if (string.IsNullOrEmpty(userIdStr) || !Guid.TryParse(userIdStr, out Guid userId))
                return Unauthorized();

            var (success, message, updatedStandings) = await _service.SavePredictionAsync(userId, dto);
            if (!success)
            {
                return BadRequest(message);
            }
            return Ok(updatedStandings);
        }
    }
}

