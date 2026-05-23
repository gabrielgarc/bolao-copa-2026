using MongoDB.Bson.Serialization.Attributes;

namespace Bolao.Copa2026.API.Models
{
    [BsonIgnoreExtraElements]
    public class Announcement
    {
        [BsonId]
        public Guid Id { get; set; } = Guid.NewGuid();

        [BsonElement("title")]
        public string Title { get; set; } = string.Empty;

        [BsonElement("description")]
        public string Description { get; set; } = string.Empty;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [BsonElement("readByUserIds")]
        public List<Guid> ReadByUserIds { get; set; } = new();
    }
}
