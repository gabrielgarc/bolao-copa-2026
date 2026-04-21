namespace Bolao.Copa2026.API.DTOs
{
    public class StandingsResponseDto
    {
        public Dictionary<string, List<TeamStatsDto>> Groups { get; set; } = new Dictionary<string, List<TeamStatsDto>>();
        public List<TeamStatsDto> OverallThirds { get; set; } = new List<TeamStatsDto>();
    }
}
