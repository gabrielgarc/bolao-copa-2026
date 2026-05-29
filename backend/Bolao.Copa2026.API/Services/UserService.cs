using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;

namespace Bolao.Copa2026.API.Services
{
    public class UserService : IUserService
    {
        private readonly IRepository<User> _userRepo;
        private readonly IRepository<UserRanking> _userRankingRepo;
        private readonly IRepository<RegistrationToken> _tokenRepo;

        public UserService(IRepository<User> userRepo, IRepository<UserRanking> userRankingRepo, IRepository<RegistrationToken> tokenRepo)
        {
            _userRepo = userRepo;
            _userRankingRepo = userRankingRepo;
            _tokenRepo = tokenRepo;
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
            return new UserDto(user.Id, user.Name, rank, totalPoints, user.Avatar);
        }

        public async Task<UserDto> CreateUserAsync(string userName, string password, string avatarConfig, string token, string name)
        {
            userName = userName?.Trim();
            name = name?.Trim();

            if (string.IsNullOrWhiteSpace(name))
            {
                throw new Exception("Nome é obrigatório.");
            }

            if (string.IsNullOrWhiteSpace(userName))
            {
                throw new Exception("Nome de usuário é obrigatório.");
            }

            if (string.IsNullOrWhiteSpace(token))
            {
                throw new Exception("Token de cadastro é obrigatório.");
            }

            var allTokens = await _tokenRepo.GetAllAsync();
            var regToken = allTokens.FirstOrDefault(t => t.Token.Equals(token, StringComparison.OrdinalIgnoreCase));
            
            if (regToken == null)
            {
                throw new Exception("Token de cadastro inválido.");
            }
            if (regToken.IsUsed)
            {
                throw new Exception("Esse token já foi utilizado.");
            }

            var allUsers = await _userRepo.GetAllAsync();
            if (allUsers.Any(u => u.UserName.Equals(userName, StringComparison.OrdinalIgnoreCase)))
            {
                throw new Exception("Esse nome de usuário já está em uso.");
            }

            var newUser = new User 
            { 
                Id = Guid.NewGuid(), 
                UserName = userName, 
                Name = name,
                Password = BCrypt.Net.BCrypt.HashPassword(password),
                Avatar = string.IsNullOrWhiteSpace(avatarConfig) ? "user-ronaldo" : avatarConfig,
                RegistrationToken = regToken.Token.ToUpper()
            };
            
            await _userRepo.CreateAsync(newUser);

            // Marcar token como usado
            regToken.IsUsed = true;
            regToken.UserId = newUser.Id;
            regToken.UserName = newUser.UserName;
            await _tokenRepo.UpdateAsync(regToken.Id, regToken);

            // New user has 0 points — rank = last place + 1
            var allRankings = await _userRankingRepo.GetAllAsync();
            var rank = allRankings.Count + 1;

            return new UserDto(newUser.Id, newUser.Name, rank, 0, newUser.Avatar);
        }
        public async Task<UserDto> UpdateAvatarAsync(Guid userId, string avatarConfig)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null) throw new Exception("Usuário não encontrado.");

            user.Avatar = avatarConfig;
            await _userRepo.UpdateAsync(user.Id, user);

            // Update avatar in ranking as well
            var allRankings = await _userRankingRepo.GetAllAsync();
            var userRanking = allRankings.FirstOrDefault(r => r.UserId == userId);
            if (userRanking != null)
            {
                userRanking.Avatar = avatarConfig;
                await _userRankingRepo.UpdateAsync(userRanking.Id, userRanking);
            }

            int totalPoints = userRanking?.TotalPoints ?? 0;
            var rank = allRankings.Count(r => r.TotalPoints > totalPoints) + 1;

            return new UserDto(user.Id, user.Name, rank, totalPoints, user.Avatar);
        }

        public async Task<bool> ResetPasswordAsync(string token, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new Exception("Token inválido.");

            var allUsers = await _userRepo.GetAllAsync();
            var user = allUsers.FirstOrDefault(u => string.Equals(u.RegistrationToken, token, StringComparison.OrdinalIgnoreCase));

            if (user == null)
                throw new Exception("Nenhum usuário encontrado com este token.");

            user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _userRepo.UpdateAsync(user.Id, user);
            return true;
        }
    }
}
