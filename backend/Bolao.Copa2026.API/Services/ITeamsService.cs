using FootballData.Intergration.Data;

namespace Bolao.Copa2026.API.Services
{
    public interface ITeamsService
    {
        Task<CompetitionResponse> GetTeamsAsync();
    }
}
