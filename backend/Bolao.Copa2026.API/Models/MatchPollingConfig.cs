namespace Bolao.Copa2026.API.Models
{
    public class MatchPollingConfig
    {
        public int IntervalSeconds { get; set; } = 30;
        public bool SyncEnabled { get; set; } = true;
    }
}
