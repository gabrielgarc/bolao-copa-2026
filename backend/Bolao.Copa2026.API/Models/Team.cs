namespace Bolao.Copa2026.API.Models
{
    public class Team
    {
        public Guid Id { get; set; } = new Guid();
        public int ApiId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string FlagType { get; set; } = "solid";
        public List<string> Colors { get; set; } = new List<string>();
        public string TextColor { get; set; } = "text-black";
        public string CrestUrl { get; set; } = string.Empty;
    }
}
