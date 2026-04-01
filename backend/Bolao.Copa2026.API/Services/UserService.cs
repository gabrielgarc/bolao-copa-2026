using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;

namespace Bolao.Copa2026.API.Services
{
    public class UserService : IUserService
    {
        private readonly IRepository<User> _userRepo;

        public UserService(IRepository<User> userRepo)
        {
            _userRepo = userRepo;
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

            var rank = allUsers.Count(u => u.TotalPoints > user.TotalPoints) + 1;
            return new UserDto(user.Id, user.UserName, rank, user.TotalPoints);
        }

        public async Task<UserDto> CreateUserAsync(string userName, string password)
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
                Avatar = "user-ronaldo", 
                TotalPoints = 0 
            };
            
            await _userRepo.CreateAsync(newUser);

            allUsers = await _userRepo.GetAllAsync();
            var rank = allUsers.Count(u => u.TotalPoints > newUser.TotalPoints) + 1;

            return new UserDto(newUser.Id, newUser.UserName, rank, newUser.TotalPoints);
        }
    }
}
