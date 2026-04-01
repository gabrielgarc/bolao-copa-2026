using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Bolao.Copa2026.API.Models
{
    public class Prediction
    {
        [BsonId]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [BsonElement("userId")]
        public Guid UserId { get; set; } = Guid.NewGuid();
        
        [BsonElement("matchId")]
        public Guid MatchId { get; set; }= new Guid();
        
        [BsonElement("homeScore")]
        public int HomeScore { get; set; }
        
        [BsonElement("awayScore")]
        public int AwayScore { get; set; }
    }
}
