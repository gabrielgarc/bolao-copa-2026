using Bolao.Copa2026.API.DTOs;

namespace Bolao.Copa2026.API.Services
{
    public interface IPredictionService
    {
        Task<Dictionary<Guid, PredictionDto>> GetUserPredictionsAsync(Guid userId);
        Task<(bool Success, string Message, StandingsResponseDto? UpdatedStandings)> SavePredictionAsync(Guid userId, CreatePredictionDto dto);
        Task<StandingsResponseDto> GetSimulatedStandingsAsync(Guid? userId);
    }
}
