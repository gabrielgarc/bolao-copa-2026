using Bolao.Copa2026.API.Services;
using FluentAssertions;
using Xunit;

namespace Bolao.Copa2026.Tests
{
    public class RankingServiceTests
    {
        [Theory]
        [InlineData(1, 1, 1, 1, "GROUP_STAGE", 120, "FULL")] // Cravou o placar (empate)
        [InlineData(2, 1, 2, 1, "GROUP_STAGE", 120, "FULL")] // Cravou o placar (vitória mandante)
        [InlineData(0, 3, 0, 3, "GROUP_STAGE", 120, "FULL")] // Cravou o placar (vitória visitante)
        public void CalculatePoints_ShouldReturn120_WhenExactScore(int ph, int pa, int rh, int ra, string stage, int expectedPoints, string expectedType)
        {
            var result = RankingService.CalculatePoints(ph, pa, rh, ra, stage);
            result.Points.Should().Be(expectedPoints);
            result.Type.Should().Be(expectedType);
        }

        [Theory]
        [InlineData(2, 0, 2, 1, "GROUP_STAGE", 90, "HALF")] // Acertou vencedor e placar mandante
        [InlineData(3, 1, 2, 1, "GROUP_STAGE", 90, "HALF")] // Acertou vencedor e placar visitante
        public void CalculatePoints_ShouldReturn90_WhenWinnerAndOneScoreCorrect(int ph, int pa, int rh, int ra, string stage, int expectedPoints, string expectedType)
        {
            var result = RankingService.CalculatePoints(ph, pa, rh, ra, stage);
            result.Points.Should().Be(expectedPoints);
            result.Type.Should().Be(expectedType);
        }

        [Theory]
        [InlineData(2, 0, 3, 1, "GROUP_STAGE", 60, "OUTCOME")] // Acertou só vencedor
        [InlineData(0, 1, 1, 2, "GROUP_STAGE", 60, "OUTCOME")] // Acertou só vencedor
        [InlineData(1, 1, 0, 0, "GROUP_STAGE", 60, "OUTCOME")] // Acertou só empate
        public void CalculatePoints_ShouldReturn60_WhenOnlyWinnerCorrect(int ph, int pa, int rh, int ra, string stage, int expectedPoints, string expectedType)
        {
            var result = RankingService.CalculatePoints(ph, pa, rh, ra, stage);
            result.Points.Should().Be(expectedPoints);
            result.Type.Should().Be(expectedType);
        }

        [Theory]
        [InlineData(1, 0, 1, 2, "GROUP_STAGE", 30, "PARTIAL")] // Acertou só gol mandante, errou vencedor
        [InlineData(3, 2, 1, 2, "GROUP_STAGE", 30, "PARTIAL")] // Acertou só gol visitante, errou vencedor (aposta 3x2, real 1x2)
        [InlineData(1, 1, 1, 0, "GROUP_STAGE", 30, "PARTIAL")] // Acertou empate mas jogo foi vitoria, porem acertou gol mandante
        public void CalculatePoints_ShouldReturn30_WhenWrongWinnerButOneScoreCorrect(int ph, int pa, int rh, int ra, string stage, int expectedPoints, string expectedType)
        {
            var result = RankingService.CalculatePoints(ph, pa, rh, ra, stage);
            result.Points.Should().Be(expectedPoints);
            result.Type.Should().Be(expectedType);
        }

        [Theory]
        [InlineData(2, 0, 0, 1, "GROUP_STAGE", 0, "NONE")] // Errou tudo
        [InlineData(1, 1, 2, 0, "GROUP_STAGE", 0, "NONE")] // Errou tudo
        public void CalculatePoints_ShouldReturn0_WhenNothingMatches(int ph, int pa, int rh, int ra, string stage, int expectedPoints, string expectedType)
        {
            var result = RankingService.CalculatePoints(ph, pa, rh, ra, stage);
            result.Points.Should().Be(expectedPoints);
            result.Type.Should().Be(expectedType);
        }

        [Theory]
        [InlineData("LAST_32", 2)]
        [InlineData("ROUND_OF_16", 3)]
        [InlineData("QUARTER_FINALS", 4)]
        [InlineData("SEMI_FINALS", 5)]
        [InlineData("THIRD_PLACE", 6)]
        [InlineData("FINAL", 7)]
        public void CalculatePoints_ShouldApplyWeight_BasedOnStage(string stage, int weight)
        {
            // Exact score gives 120 * weight
            var result = RankingService.CalculatePoints(2, 1, 2, 1, stage);
            result.Points.Should().Be(120 * weight);
        }
    }
}
