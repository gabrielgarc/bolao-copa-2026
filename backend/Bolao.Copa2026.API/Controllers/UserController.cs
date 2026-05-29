using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace Bolao.Copa2026.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _service;

        public UserController(IUserService service)
        {
            _service = service;
        }

        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login([FromBody] LoginRequestDto request)
        {
            var user = await _service.LoginAsync(request.UserName, request.Password);
            if (user == null)
            {
                return Unauthorized("Usuário ou senha inválidos.");
            }
            return Ok(user);
        }

        [HttpPost("create")]
        public async Task<ActionResult<UserDto>> Create([FromBody] CreateUserRequestDto request)
        {
            try
            {
                var user = await _service.CreateUserAsync(request.UserName, request.Password, request.AvatarConfig, request.Token, request.Name);
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("reset-password")]
        public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequestDto request)
        {
            try
            {
                await _service.ResetPasswordAsync(request.Token, request.NewPassword);
                return Ok(new { message = "Senha alterada com sucesso." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPost("update-avatar")]
        public async Task<ActionResult<UserDto>> UpdateAvatar([FromBody] UpdateAvatarRequestDto request)
        {
            try
            {
                var user = await _service.UpdateAvatarAsync(request.UserId, request.AvatarConfig);
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
