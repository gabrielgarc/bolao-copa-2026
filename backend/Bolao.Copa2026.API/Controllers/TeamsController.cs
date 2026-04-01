using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Services;
using FootballData.Intergration.Data;
using FootballData.Intergration.Modules;
using Microsoft.AspNetCore.Mvc;

namespace Bolao.Copa2026.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamsController : ControllerBase
    {
        private readonly ITeamsService _service;

        public TeamsController(ITeamsService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<CompetitionResponse>> GetTeams()
        {
            return await _service.GetTeamsAsync();
        }

        [HttpGet("debug")]
        public async Task<IActionResult> Debug([FromServices] Bolao.Copa2026.API.Repositories.IRepository<Bolao.Copa2026.API.Models.Match> matchRepo, [FromServices] Bolao.Copa2026.API.Repositories.IRepository<Bolao.Copa2026.API.Models.Team> teamRepo)
        {
            var teams = await teamRepo.GetAllAsync();
            var matches = await matchRepo.GetAllAsync();
            var unk = matches.Where(m => !teams.Any(t => t.Id == m.HomeTeamId)).ToList();
            return Ok(new { 
                teamIds = teams.Select(t => new { t.Id, t.Name, t.ApiId }), 
                unknownMatches = unk.Select(m => new { m.Id, m.HomeTeamId, m.AwayTeamId, m.Group }) 
            });
        }
    }
}
