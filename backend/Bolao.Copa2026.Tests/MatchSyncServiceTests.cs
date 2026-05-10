using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using Bolao.Copa2026.API.Services;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading;
using System.Threading.Tasks;
using Xunit;
using FootballData.Intergration.Data;
using DbMatch = Bolao.Copa2026.API.Models.Match;
using DbTeam = Bolao.Copa2026.API.Models.Team;
using System;

namespace Bolao.Copa2026.Tests
{
    public class MatchSyncServiceTests
    {
        [Fact]
        public async Task SyncMatchesAsync_ShouldUseFullTimeScore_WhenUpdatingDbMatch()
        {
            // Arrange
            var loggerMock = new Mock<ILogger<MatchSyncBackgroundService>>();
            var scopeFactoryMock = new Mock<IServiceScopeFactory>();
            var scopeMock = new Mock<IServiceScope>();
            var serviceProviderMock = new Mock<IServiceProvider>();
            
            var config = Options.Create(new MatchPollingConfig { IntervalSeconds = 30, SyncEnabled = true });

            var matchDataProviderMock = new Mock<IMatchDataProvider>();
            var matchRepoMock = new Mock<IRepository<DbMatch>>();
            var teamRepoMock = new Mock<IRepository<DbTeam>>();
            var rankingRepoMock = new Mock<IRepository<UserRanking>>();
            var rankingServiceMock = new Mock<IRankingService>();

            scopeFactoryMock.Setup(s => s.CreateScope()).Returns(scopeMock.Object);
            scopeMock.Setup(s => s.ServiceProvider).Returns(serviceProviderMock.Object);

            serviceProviderMock.Setup(x => x.GetService(typeof(IMatchDataProvider))).Returns(matchDataProviderMock.Object);
            serviceProviderMock.Setup(x => x.GetService(typeof(IRepository<DbMatch>))).Returns(matchRepoMock.Object);
            serviceProviderMock.Setup(x => x.GetService(typeof(IRepository<DbTeam>))).Returns(teamRepoMock.Object);
            serviceProviderMock.Setup(x => x.GetService(typeof(IRepository<UserRanking>))).Returns(rankingRepoMock.Object);
            serviceProviderMock.Setup(x => x.GetService(typeof(IRankingService))).Returns(rankingServiceMock.Object);

            var matchId = Guid.NewGuid();
            var dbMatch = new DbMatch { Id = matchId, ApiId = 123, RealHomeScore = null, RealAwayScore = null, Status = "TIMED" };
            var dbMatchesList = new List<DbMatch> { dbMatch };
            matchRepoMock.Setup(r => r.GetAllAsync()).ReturnsAsync(dbMatchesList);
            rankingRepoMock.Setup(r => r.AnyAsync()).ReturnsAsync(true); // Don't trigger initial recalculation if no updates

            var apiResponse = new MatchesResponse
            {
                Matches = new List<FootballData.Intergration.Data.Match>
                {
                    new FootballData.Intergration.Data.Match
                    {
                        Id = 123,
                        Status = "FINISHED",
                        Score = new Score
                        {
                            Duration = "EXTRA_TIME",
                            FullTime = new FullTime { Home = 2, Away = 1 }, // Score after 120 mins
                            HalfTime = new HalfTime { Home = 0, Away = 0 }
                        }
                    }
                }
            };
            matchDataProviderMock.Setup(m => m.GetMatchesAsync()).ReturnsAsync(apiResponse);

            var service = new MatchSyncBackgroundService(loggerMock.Object, scopeFactoryMock.Object, config);

            // Act: Using reflection to call private method SyncMatchesAsync
            var methodInfo = typeof(MatchSyncBackgroundService).GetMethod("SyncMatchesAsync", BindingFlags.NonPublic | BindingFlags.Instance);
            var task = (Task)methodInfo!.Invoke(service, null)!;
            await task;

            // Assert
            matchRepoMock.Verify(r => r.UpdateAsync(matchId, It.Is<DbMatch>(m => 
                m.RealHomeScore == 2 && 
                m.RealAwayScore == 1 &&
                m.Status == "FINISHED" &&
                m.IsLocked == true
            )), Times.Once);

            rankingServiceMock.Verify(r => r.RecalculateAllPoints(), Times.Once);
        }
    }
}
