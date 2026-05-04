using FootballData.Intergration.Data;

namespace Bolao.Copa2026.API.Services
{
    /// <summary>
    /// Abstração para fornecer dados de partidas — pode ser a API real ou um mock.
    /// </summary>
    public interface IMatchDataProvider
    {
        Task<MatchesResponse?> GetMatchesAsync();
    }
}
