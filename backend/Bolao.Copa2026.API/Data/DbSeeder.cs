using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using Bolao.Copa2026.API.Services;
using FootballData.Intergration.Modules;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Bolao.Copa2026.API.Data
{
    public class DbSeeder
    {
        private readonly IRepository<Team> _teamRepo;
        private readonly IRepository<Match> _matchRepo;
        private readonly IRepository<User> _userRepo;
        private readonly MatchesModule _matchesModule;
        private readonly TeamsModule _teamsModule;

        public DbSeeder(IRepository<Team> teamRepo, IRepository<Match> matchRepo, IRepository<User> userRepo, MatchesModule matchesModule, TeamsModule teamsModule)
        {
            _teamRepo = teamRepo;
            _matchRepo = matchRepo;
            _userRepo = userRepo;
            _teamsModule = teamsModule;
            _matchesModule = matchesModule;
        }

        public async Task SeedAsync()
        {
            if (!await _teamRepo.AnyAsync())
            {
                await CreateTeams();
            }
            else
            {
                await SyncTeamTranslations();
            }

            if (!await _matchRepo.AnyAsync())
            {
                await CreateMatches();
            }
        }

        private async Task SyncTeamTranslations()
        {
            var teams = await _teamRepo.GetAllAsync();
            foreach (var team in teams)
            {
                if (string.IsNullOrEmpty(team.NamePt))
                {
                    team.NamePt = Bolao.Copa2026.API.Helpers.TeamTranslator.Translate(team.Name);
                    await _teamRepo.UpdateAsync(team.Id, team);
                }
            }
        }

        private async Task CreateTeams()
        {
            var apiTeams = await _teamsModule.GetWorldCupTeamsAsync();
            if (apiTeams?.Teams != null)
            {
                foreach (var apiTeam in apiTeams.Teams)
                {
                    await _teamRepo.CreateAsync(CreateTeam(apiTeam));
                }
            }
        }

        private Team CreateTeam(FootballData.Intergration.Data.Team apiTeam)
        {
            var name = apiTeam.Name ?? "Unknown";
            return new Team
            {
                Name = name,
                NamePt = Bolao.Copa2026.API.Helpers.TeamTranslator.Translate(name),
                Code = apiTeam.Tla ?? "TBD",
                Id = Guid.NewGuid(),
                ApiId = apiTeam.Id ?? 0,
                CrestUrl = apiTeam.Crest ?? ""
            };
        }

        private async Task CreateMatches()
        {
            var apiMatches = await _matchesModule.GetWorldCupMatchesAsync();
            if (apiMatches?.Matches != null)
            {
                foreach (var apiMatch in apiMatches.Matches)
                {
                    await _matchRepo.CreateAsync(await CreateMatchAsync(apiMatch));
                }
            }
        }

        private async Task<Match> CreateMatchAsync(FootballData.Intergration.Data.Match apiMatch)
        {
            var homeTeam = await _teamRepo.FindOneAsync(t => t.ApiId == apiMatch.HomeTeam.Id);
            if (homeTeam == null && apiMatch.HomeTeam?.Id != null)
            {
                var name = apiMatch.HomeTeam.Name ?? apiMatch.HomeTeam.ShortName ?? "TBD";
                homeTeam = new Team
                {
                    Name = name,
                    NamePt = Bolao.Copa2026.API.Helpers.TeamTranslator.Translate(name),
                    Code = apiMatch.HomeTeam.Tla ?? "TBD",
                    Id = Guid.NewGuid(),
                    ApiId = apiMatch.HomeTeam.Id.Value,
                    CrestUrl = apiMatch.HomeTeam.Crest ?? ""
                };
                await _teamRepo.CreateAsync(homeTeam);
            }

            var awayTeam = await _teamRepo.FindOneAsync(t => t.ApiId == apiMatch.AwayTeam.Id);
            if (awayTeam == null && apiMatch.AwayTeam?.Id != null)
            {
                var name = apiMatch.AwayTeam.Name ?? apiMatch.AwayTeam.ShortName ?? "TBD";
                awayTeam = new Team
                {
                    Name = name,
                    NamePt = Bolao.Copa2026.API.Helpers.TeamTranslator.Translate(name),
                    Code = apiMatch.AwayTeam.Tla ?? "TBD",
                    Id = Guid.NewGuid(),
                    ApiId = apiMatch.AwayTeam.Id.Value,
                    CrestUrl = apiMatch.AwayTeam.Crest ?? ""
                };
                await _teamRepo.CreateAsync(awayTeam);
            }

            return new Match
            {
                ApiId = apiMatch.Id ?? 0,
                AwayTeamId = awayTeam?.Id ?? Guid.Empty,
                AwayTeamName = awayTeam?.Name,
                HomeTeamId = homeTeam?.Id ?? Guid.Empty,
                HomeTeamName = homeTeam?.Name,
                Date = apiMatch.UtcDate.ToString("yyyy-MM-dd"),
                Time = apiMatch.UtcDate.ToString("HH:mm"),
                Group = apiMatch.Group ?? string.Empty,
                Stadium = "tbd",
                IsLocked = false,
                RealAwayScore = apiMatch.Score?.FullTime?.Away,
                RealHomeScore = apiMatch.Score?.FullTime?.Home,
                Stage = apiMatch.Stage
            };
        }
    }
}
