using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Bolao.Copa2026.API.Models
{
    public class Match
    {
        [BsonId]
        public Guid Id { get; set; } = new Guid();

        [BsonElement("homeTeamId")]
        public Guid HomeTeamId { get; set; } = new Guid();
        
        [BsonElement("awayTeamId")]
        public Guid AwayTeamId { get; set; } = new Guid();
        
        [BsonElement("date")]
        public string Date { get; set; } = string.Empty;
        
        [BsonElement("time")]
        public string Time { get; set; } = string.Empty;
        
        [BsonElement("group")]
        public string Group { get; set; } = string.Empty;
        
        [BsonElement("stadium")]
        public string Stadium { get; set; } = string.Empty;
        
        [BsonElement("stage")]
        public string Stage { get; set; } = string.Empty;

        [BsonElement("realHomeScore")]
        public int? RealHomeScore { get; set; } 
        
        [BsonElement("realAwayScore")]
        public int? RealAwayScore { get; set; }
        
        [BsonElement("isLocked")]
        public bool IsLocked { get; set; }
        
        [BsonElement("placeholderLabel")]
        public string? PlaceholderLabel { get; set; }
        [BsonElement("homeTeamName")]
        public string? HomeTeamName { get; internal set; }
        [BsonElement("awayTeamName")]
        public string? AwayTeamName { get; internal set; }
    }
}
