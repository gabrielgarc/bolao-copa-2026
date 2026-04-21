namespace Bolao.Copa2026.API.DTOs
{
    // DTO para enviar times pro frontend
    public record TeamDto(
        Guid Id, 
        string Name, 
        string NamePt,
        string Code, 
        string FlagType, 
        List<string> Colors, 
        string TextColor,
        string CrestUrl
    );

    // DTO para enviar partidas pro frontend
    public record MatchDto(
        Guid Id,
        TeamDto HomeTeam,
        TeamDto AwayTeam,
        string Date,
        string Time,
        string Group,
        string Stadium,
        string Stage,
        int? RealHomeScore,
        int? RealAwayScore,
        bool IsLocked,
        string? PlaceholderLabel
    );

    // DTO para receber palpites
    public record CreatePredictionDto(
        Guid MatchId,
        string HomeScore, // Recebemos como string pra facilitar parsing do input html
        string AwayScore
    );

    // DTO para enviar palpites salvos
    public record PredictionDto(
        Guid MatchId,
        string HomeScore,
        string AwayScore
    );

    // DTO para o Ranking
    public record RankingDto(
        Guid Id,
        string Name,
        int Points,
        string Avatar,
        int FullMatches,
        int QualifiedTeamsCount,
        int HalfMatches,
        int OutcomeMatches
    );

    // DTO Usuário Atual
    public record UserDto(
        Guid Id,
        string Name,
        int Rank,
        int TotalPoints
    );

    // DTO para Login e Criar Usuario
    public record LoginRequestDto(
        string UserName,
        string Password
    );

    public record CreateUserRequestDto(
        string UserName,
        string Password
    );
}
