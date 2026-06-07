namespace Bolao.Copa2026.API.Services
{
    public interface IGeminiService
    {
        Task<string> GenerateCommentaryAsync(string contextData);
    }
}
