using FootballData.Intergration.Core;
using FootballData.Intergration.Data;
using Microsoft.Extensions.Options;

namespace FootballData.Intergration.Modules
{
   public class TeamsModule : FootballBaseModule
    {
        // O HttpClient é injetado automaticamente pela Factory
        public TeamsModule(HttpClient httpClient, IOptions<FootballApiSettings> settings) 
            : base(httpClient, settings)
        {
        }

        public async Task<CompetitionResponse?> GetWorldCupTeamsAsync()
        {
            // Rota específica solicitada
            return await GetAsync<CompetitionResponse>("competitions/WC/teams");
        }
    }
}
