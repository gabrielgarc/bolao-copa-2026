using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Bolao.Copa2026.API.Models
{
    [BsonIgnoreExtraElements]
    public class RegistrationToken
    {
        [BsonId]
        public Guid Id { get; set; } = Guid.NewGuid();

        [BsonElement("token")]
        public string Token { get; set; } = string.Empty;

        [BsonElement("isUsed")]
        public bool IsUsed { get; set; } = false;

        [BsonElement("userId")]
        public Guid? UserId { get; set; }

        [BsonElement("userName")]
        public string? UserName { get; set; }

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
