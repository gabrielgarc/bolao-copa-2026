using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;

namespace Bolao.Copa2026.API.Services
{
    public class UserService : IUserService
    {
        private readonly IRepository<User> _userRepo;
        private readonly IRepository<UserRanking> _userRankingRepo;

        public UserService(IRepository<User> userRepo, IRepository<UserRanking> userRankingRepo)
        {
            _userRepo = userRepo;
            _userRankingRepo = userRankingRepo;
        }

        public async Task<UserDto> GetCurrentUserAsync()
        {
            // Ponto cego: Sem autenticação JWT não temos 'me' de fato
            // Isso será substituido pelo estado local do frontend.
            throw new NotImplementedException();
        }

        public async Task<UserDto?> LoginAsync(string userName, string password)
        {
            var allUsers = await _userRepo.GetAllAsync();
            var user = allUsers.FirstOrDefault(u => u.UserName.Equals(userName, StringComparison.OrdinalIgnoreCase));

            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.Password))
            {
                return null;
            }

            var allRankings = await _userRankingRepo.GetAllAsync();
            var userRanking = allRankings.FirstOrDefault(r => r.UserId == user.Id);
            int totalPoints = userRanking?.TotalPoints ?? 0;
            var rank = allRankings.Count(r => r.TotalPoints > totalPoints) + 1;
            return new UserDto(user.Id, user.UserName, rank, totalPoints);
        }

        public async Task<UserDto> CreateUserAsync(string userName, string password, string avatarConfig)
        {
            var allUsers = await _userRepo.GetAllAsync();
            if (allUsers.Any(u => u.UserName.Equals(userName, StringComparison.OrdinalIgnoreCase)))
            {
                throw new Exception("Esse nome de usuário já está em uso.");
            }

            var newUser = new User 
            { 
                Id = Guid.NewGuid(), 
                UserName = userName, 
                Password = BCrypt.Net.BCrypt.HashPassword(password),
                Avatar = string.IsNullOrWhiteSpace(avatarConfig) ? "user-ronaldo" : avatarConfig
            };
            
            await _userRepo.CreateAsync(newUser);

            // New user has 0 points — rank = last place + 1
            var allRankings = await _userRankingRepo.GetAllAsync();
            var rank = allRankings.Count + 1;

            return new UserDto(newUser.Id, newUser.UserName, rank, 0);
        }
    }
}
