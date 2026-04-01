using FootballData.Intergration.Core;
using FootballData.Intergration.Data;
using Microsoft.Extensions.Options;

namespace FootballData.Intergration.Modules
{
   public class MatchesModule : FootballBaseModule
    {
        public MatchesModule(HttpClient httpClient, IOptions<FootballApiSettings> settings) 
            : base(httpClient, settings)
        {
        }

        public async Task<MatchesResponse?> GetWorldCupMatchesAsync()
        {
            return await GetAsync<MatchesResponse>("competitions/WC/matches");
        }
    }
}
