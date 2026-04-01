using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;

namespace Bolao.Copa2026.API.Services
{
    public class MatchService : IMatchService
    {
        private readonly IRepository<Match> _matchRepo;
        private readonly IRepository<Team> _teamRepo;

        public MatchService(IRepository<Match> matchRepo, IRepository<Team> teamRepo)
        {
            _matchRepo = matchRepo;
            _teamRepo = teamRepo;
        }

        public async Task<List<MatchDto>> GetAllMatchesAsync()
        {
            var matches = await _matchRepo.GetAllAsync();
            var teams = await _teamRepo.GetAllAsync();
            
            // Map manual para simular o "Include" do EF
            var teamMap = teams.ToDictionary(t => t.Id);

            var dtos = new List<MatchDto>();

            foreach (var m in matches)
            {
                // Fallback seguro caso o time não exista no banco (TBD)
                var homeTeam = teamMap.ContainsKey(m.HomeTeamId) ? teamMap[m.HomeTeamId] : new Team { Id = Guid.Empty, Name = "Unknown" };
                var awayTeam = teamMap.ContainsKey(m.AwayTeamId) ? teamMap[m.AwayTeamId] : new Team { Id = Guid.Empty, Name = "Unknown" };

                dtos.Add(new MatchDto(
                    m.Id,
                    new TeamDto(homeTeam.Id, homeTeam.Name, homeTeam.Code, homeTeam.FlagType, homeTeam.Colors, homeTeam.TextColor, homeTeam.CrestUrl ?? ""),
                    new TeamDto(awayTeam.Id, awayTeam.Name, awayTeam.Code, awayTeam.FlagType, awayTeam.Colors, awayTeam.TextColor, awayTeam.CrestUrl ?? ""),
                    m.Date,
                    m.Time,
                    m.Group,
                    m.Stadium,
                    m.Stage,
                    m.RealHomeScore,
                    m.RealAwayScore,
                    m.IsLocked,
                    m.PlaceholderLabel
                ));
            }

            return dtos;
        }
    }
}
