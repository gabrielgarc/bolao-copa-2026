using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Bson.Serialization.Options;
using System;
using System.Collections.Generic;

namespace Bolao.Copa2026.API.Models
{
    [BsonIgnoreExtraElements]
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

        [BsonElement("zeroMatches")]
        public int ZeroMatches { get; set; }

        [BsonElement("pointsByStage")]
        [BsonDictionaryOptions(DictionaryRepresentation.Document)]
        public Dictionary<string, int> PointsByStage { get; set; } = new Dictionary<string, int>();

        [BsonElement("pointsByMatch")]
        [BsonDictionaryOptions(DictionaryRepresentation.Document)]
        public Dictionary<string, int> PointsByMatch { get; set; } = new Dictionary<string, int>();

        [BsonElement("correctQualifiedTeamIds")]
        public List<Guid> CorrectQualifiedTeamIds { get; set; } = new List<Guid>();

        /// <summary>
        /// Status de cada time que o usuário previu como classificado.
        /// Key: TeamId.ToString(), Value: "correct" | "wrong" | "waiting"
        /// </summary>
        [BsonElement("qualifiedTeamStatuses")]
        [BsonDictionaryOptions(DictionaryRepresentation.Document)]
        public Dictionary<string, string> QualifiedTeamStatuses { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Bônus de classificados por grupo (letra do grupo → pontos).
        /// </summary>
        [BsonElement("qualificationBonusByGroup")]
        [BsonDictionaryOptions(DictionaryRepresentation.Document)]
        public Dictionary<string, int> QualificationBonusByGroup { get; set; } = new Dictionary<string, int>();
    }
}
