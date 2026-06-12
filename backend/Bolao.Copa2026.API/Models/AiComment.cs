using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Bolao.Copa2026.API.Models
{
    public class AiComment
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
