using Bolao.Copa2026.API.DTOs;

namespace Bolao.Copa2026.API.Services
{
    public interface IUserService
    {
        Task<UserDto> GetCurrentUserAsync();
        Task<UserDto?> LoginAsync(string userName, string password);
        Task<UserDto> CreateUserAsync(string userName, string password);
    }
}
