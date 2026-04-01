using Bolao.Copa2026.API.Services;
using FootballData.Intergration.Data;
using FootballData.Intergration.Modules;

namespace Bolao.Copa2026.API.Services
{
    public class TeamsService : ITeamsService
    {
        private readonly TeamsModule _teamsModule;

        public TeamsService(TeamsModule teamsModule)
        {
            _teamsModule = teamsModule;
        }

        public async Task<CompetitionResponse> GetTeamsAsync()
        {
            return await _teamsModule.GetWorldCupTeamsAsync();
        }
    }
}
