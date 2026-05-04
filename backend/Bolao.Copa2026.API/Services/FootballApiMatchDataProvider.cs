using FootballData.Intergration.Data;
using FootballData.Intergration.Modules;

namespace Bolao.Copa2026.API.Services
{
    /// <summary>
    /// Provider real — delega para a API football-data.org via MatchesModule.
    /// </summary>
    public class FootballApiMatchDataProvider : IMatchDataProvider
    {
        private readonly MatchesModule _matchesModule;

        public FootballApiMatchDataProvider(MatchesModule matchesModule)
        {
            _matchesModule = matchesModule;
        }

        public async Task<MatchesResponse?> GetMatchesAsync()
        {
            return await _matchesModule.GetWorldCupMatchesAsync();
        }
    }
}
