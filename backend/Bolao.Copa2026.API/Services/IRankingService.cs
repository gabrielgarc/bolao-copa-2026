using Bolao.Copa2026.API.DTOs;

namespace Bolao.Copa2026.API.Services
{
    public interface IRankingService
    {
        Task<List<RankingDto>> GetLeaderboardAsync();
    }
}
