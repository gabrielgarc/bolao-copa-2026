using Bolao.Copa2026.API.DTOs;

namespace Bolao.Copa2026.API.Services
{
    public interface IMatchService
    {
        Task<List<MatchDto>> GetAllMatchesAsync();
    }
}
