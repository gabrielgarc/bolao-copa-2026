using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;
using System;
using System.Collections.Generic;

namespace Bolao.Copa2026.API.Models
{
    public class UserRanking
    {
        [BsonId]
        public Guid Id { get; set; } = Guid.NewGuid();

        [BsonElement("userId")]
        public Guid UserId { get; set; }

        [BsonElement("userName")]
        public string UserName { get; set; } = string.Empty;

        [BsonElement("avatar")]
        public string Avatar { get; set; } = string.Empty;

        [BsonElement("totalPoints")]
        public int TotalPoints { get; set; }

        [BsonElement("fullMatches")]
        public int FullMatches { get; set; }

        [BsonElement("qualifiedTeamsCount")]
        public int QualifiedTeamsCount { get; set; }

        [BsonElement("halfMatches")]
        public int HalfMatches { get; set; }

        [BsonElement("outcomeMatches")]
        public int OutcomeMatches { get; set; }

        [BsonElement("partialMatches")]
        public int PartialMatches { get; set; }

        [BsonElement("pointsByStage")]
        [BsonDictionaryOptions(DictionaryRepresentation.Document)]
        public Dictionary<string, int> PointsByStage { get; set; } = new Dictionary<string, int>();

        [BsonElement("pointsByMatch")]
        [BsonDictionaryOptions(DictionaryRepresentation.Document)]
        public Dictionary<string, int> PointsByMatch { get; set; } = new Dictionary<string, int>();

        [BsonElement("correctQualifiedTeamIds")]
        public List<Guid> CorrectQualifiedTeamIds { get; set; } = new List<Guid>();
    }
}
