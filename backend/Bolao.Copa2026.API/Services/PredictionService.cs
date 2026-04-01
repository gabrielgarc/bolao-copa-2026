using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;

namespace Bolao.Copa2026.API.Services
{
    public class PredictionService : IPredictionService
    {
        private readonly IRepository<Prediction> _predictionRepo;
        private readonly IRepository<Match> _matchRepo;
        private readonly IRepository<User> _userRepo;
        private Guid CURRENT_USER_ID; 

        public PredictionService(IRepository<Prediction> predictionRepo, IRepository<Match> matchRepo, IRepository<User> userRepo)
        {
            _predictionRepo = predictionRepo;
            _matchRepo = matchRepo;
            _userRepo = userRepo;
        }

        public async Task<Dictionary<Guid, PredictionDto>> GetUserPredictionsAsync(Guid userId)
        {
            var preds = await _predictionRepo.FindAsync(p => p.UserId == userId);

            var dict = new Dictionary<Guid, PredictionDto>();
            foreach(var p in preds)
            {
                dict[p.MatchId] = new PredictionDto(p.MatchId, p.HomeScore.ToString(), p.AwayScore.ToString());
            }
            return dict;
        }

        public async Task<(bool Success, string Message)> SavePredictionAsync(Guid userId, CreatePredictionDto dto)
        {
            if (!int.TryParse(dto.HomeScore, out int home) || !int.TryParse(dto.AwayScore, out int away))
            {
                return (false, "Placares inválidos");
            }

            var match = await _matchRepo.GetByIdAsync(dto.MatchId);
            if (match == null) return (false, "Jogo não encontrado");
            
            if (match.IsLocked || match.RealHomeScore.HasValue) 
                return (false, "Este jogo já está fechado para palpites");

            if (!string.IsNullOrEmpty(match.Date) && !string.IsNullOrEmpty(match.Time))
            {
                try 
                {
                    int year = 2026, month = 1, day = 1;
                    if (match.Date.Contains('-'))
                    {
                        var dateParts = match.Date.Split('-');
                        year = int.Parse(dateParts[0]);
                        month = int.Parse(dateParts[1]);
                        day = int.Parse(dateParts[2]);
                    }
                    else
                    {
                        var dateParts = match.Date.Split('/');
                        day = int.Parse(dateParts[0]);
                        month = int.Parse(dateParts[1]);
                    }

                    var timeParts = match.Time.Split(':');
                    int hour = int.Parse(timeParts[0]);
                    int min = int.Parse(timeParts[1]);
                    
                    var matchDateTime = new DateTime(year, month, day, hour, min, 0);
                    var nowBrasilia = DateTime.UtcNow.AddHours(-3);
                    
                    if (nowBrasilia >= matchDateTime)
                    {
                        return (false, "O horário deste jogo já passou!");
                    }
                } 
                catch { /* Ignorar erros de parseamento da string do JSON */ }
            }

            var existing = await _predictionRepo.FindOneAsync(p => p.UserId == userId && p.MatchId == dto.MatchId);

            if (existing != null)
            {
                existing.HomeScore = home;
                existing.AwayScore = away;
                await _predictionRepo.UpdateAsync(existing.Id, existing);
            }
            else
            {
                await _predictionRepo.CreateAsync(new Prediction
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    MatchId = dto.MatchId,
                    HomeScore = home,
                    AwayScore = away
                });
            }

            return (true, "Sucesso");
        }
    }
}
