using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using Bolao.Copa2026.API.Services;
using FootballData.Intergration.Modules;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;
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
        private readonly IMongoDatabase _database;

        public DbSeeder(IRepository<Team> teamRepo, IRepository<Match> matchRepo, IRepository<User> userRepo, MatchesModule matchesModule, TeamsModule teamsModule, IMongoDatabase database)
        {
            _teamRepo = teamRepo;
            _matchRepo = matchRepo;
            _userRepo = userRepo;
            _teamsModule = teamsModule;
            _matchesModule = matchesModule;
            _database = database;
        }

        public async Task SeedAsync()
        {
            await EnsureIndexesAsync();

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

        private async Task EnsureIndexesAsync()
        {
            // 1. Index em predictions: { userId: 1, matchId: 1 } único
            var predictionsCol = _database.GetCollection<Prediction>("predictions");
            var allPredictions = await predictionsCol.Find(_ => true).ToListAsync();
            var duplicatePredictions = allPredictions.GroupBy(p => new { p.UserId, p.MatchId }).Where(g => g.Count() > 1).SelectMany(g => g.Skip(1)).Select(p => p.Id).ToList();
            if (duplicatePredictions.Any())
            {
                await predictionsCol.DeleteManyAsync(Builders<Prediction>.Filter.In(p => p.Id, duplicatePredictions));
            }
            var predictionIndexKeys = Builders<Prediction>.IndexKeys.Ascending(p => p.UserId).Ascending(p => p.MatchId);
            var predictionIndexOptions = new CreateIndexOptions { Unique = true };
            await predictionsCol.Indexes.CreateOneAsync(new CreateIndexModel<Prediction>(predictionIndexKeys, predictionIndexOptions));

            // 2. Index em user_rankings: { userId: 1 } único
            var rankingsCol = _database.GetCollection<UserRanking>("user_rankings");
            var allRankings = await rankingsCol.Find(_ => true).ToListAsync();
            var duplicateRankings = allRankings.GroupBy(r => r.UserId).Where(g => g.Count() > 1).SelectMany(g => g.Skip(1)).Select(r => r.Id).ToList();
            if (duplicateRankings.Any())
            {
                await rankingsCol.DeleteManyAsync(Builders<UserRanking>.Filter.In(r => r.Id, duplicateRankings));
            }
            var rankingsIndexKeys = Builders<UserRanking>.IndexKeys.Ascending(r => r.UserId);
            var rankingsIndexOptions = new CreateIndexOptions { Unique = true };
            await rankingsCol.Indexes.CreateOneAsync(new CreateIndexModel<UserRanking>(rankingsIndexKeys, rankingsIndexOptions));

            // 3. Index em teams: { apiId: 1 } único
            var teamsCol = _database.GetCollection<Team>("teams");
            var allTeams = await teamsCol.Find(_ => true).ToListAsync();
            var duplicateTeams = allTeams.GroupBy(t => t.ApiId).Where(g => g.Count() > 1).SelectMany(g => g.Skip(1)).Select(t => t.Id).ToList();
            if (duplicateTeams.Any())
            {
                await teamsCol.DeleteManyAsync(Builders<Team>.Filter.In(t => t.Id, duplicateTeams));
            }
            var teamsIndexKeys = Builders<Team>.IndexKeys.Ascending(t => t.ApiId);
            var teamsIndexOptions = new CreateIndexOptions { Unique = true };
            await teamsCol.Indexes.CreateOneAsync(new CreateIndexModel<Team>(teamsIndexKeys, teamsIndexOptions));

            // 4. Index em users: { userName: 1 } único
            var usersCol = _database.GetCollection<User>("users");
            var allUsers = await usersCol.Find(_ => true).ToListAsync();
            var duplicateUsers = allUsers.GroupBy(u => u.UserName).Where(g => g.Count() > 1).SelectMany(g => g.Skip(1)).Select(u => u.Id).ToList();
            if (duplicateUsers.Any())
            {
                await usersCol.DeleteManyAsync(Builders<User>.Filter.In(u => u.Id, duplicateUsers));
            }
            var usersIndexKeys = Builders<User>.IndexKeys.Ascending(u => u.UserName);
            var usersIndexOptions = new CreateIndexOptions { Unique = true };
            await usersCol.Indexes.CreateOneAsync(new CreateIndexModel<User>(usersIndexKeys, usersIndexOptions));
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
