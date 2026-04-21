namespace Bolao.Copa2026.API.DTOs
{
    public class TeamStatsDto
    {
        public Guid TeamId { get; set; }
        public Models.Team Team { get; set; }
        public int Points { get; set; }
        public int Played { get; set; }
        public int Won { get; set; }
        public int Drawn { get; set; }
        public int Lost { get; set; }
        public int GoalDiff { get; set; }
        public int GoalsFor { get; set; }
        public int GoalsAgainst { get; set; }
        public bool IsQualified { get; set; }
    }
}
