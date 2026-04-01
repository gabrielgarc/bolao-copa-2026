using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Bolao.Copa2026.API.Models
{
    public class User
    {
        [BsonId]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [BsonElement("userName")]
        public string UserName { get; set; } = string.Empty;
        [BsonElement("password")]
        public string Password { get; set; } = string.Empty;

        [BsonElement("avatar")]
        public string Avatar { get; set; } = "user-ronaldo";

        [BsonElement("totalPoints")]
        public int TotalPoints { get; set; }
    }
}
