using Bolao.Copa2026.API.DTOs;
using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Bolao.Copa2026.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnnouncementsController : ControllerBase
    {
        private readonly IRepository<Announcement> _announcementRepo;
        private readonly IConfiguration _config;

        public AnnouncementsController(IRepository<Announcement> announcementRepo, IConfiguration config)
        {
            _announcementRepo = announcementRepo;
            _config = config;
        }

        /// <summary>
        /// Retorna todos os avisos do mais recente ao mais antigo.
        /// Aceita userId como query param opcional para calcular isRead.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<AnnouncementDto>>> GetAll([FromQuery] Guid? userId = null)
        {
            var announcements = await _announcementRepo.GetAllAsync();
            var result = announcements
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new AnnouncementDto(
                    a.Id,
                    a.Title,
                    a.Description,
                    a.CreatedAt,
                    userId.HasValue && a.ReadByUserIds.Contains(userId.Value)
                ))
                .ToList();

            return Ok(result);
        }

        /// <summary>
        /// Retorna o aviso mais recente que o usuário ainda não leu.
        /// </summary>
        [HttpGet("unread/{userId}")]
        public async Task<ActionResult<AnnouncementDto?>> GetUnread(Guid userId)
        {
            var announcements = await _announcementRepo.GetAllAsync();
            var unread = announcements
                .Where(a => !a.ReadByUserIds.Contains(userId))
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefault();

            if (unread == null)
                return Ok(null);

            return Ok(new AnnouncementDto(
                unread.Id,
                unread.Title,
                unread.Description,
                unread.CreatedAt,
                false
            ));
        }

        /// <summary>
        /// Marca um aviso como lido para um usuário.
        /// </summary>
        [HttpPost("{id}/read")]
        public async Task<ActionResult> MarkAsRead(Guid id, [FromBody] Guid userId)
        {
            var announcement = await _announcementRepo.GetByIdAsync(id);
            if (announcement == null)
                return NotFound("Aviso não encontrado.");

            if (!announcement.ReadByUserIds.Contains(userId))
            {
                announcement.ReadByUserIds.Add(userId);
                await _announcementRepo.UpdateAsync(id, announcement);
            }

            return Ok(new { message = "Aviso marcado como lido." });
        }

        /// <summary>
        /// Admin: Cria um novo aviso.
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<AnnouncementDto>> Create([FromBody] CreateAnnouncementDto dto)
        {
            if (!IsAdmin())
                return Unauthorized("Acesso restrito ao administrador.");

            if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Description))
                return BadRequest("Título e descrição são obrigatórios.");

            var announcement = new Announcement
            {
                Title = dto.Title.Trim(),
                Description = dto.Description.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            await _announcementRepo.CreateAsync(announcement);

            return Ok(new AnnouncementDto(
                announcement.Id,
                announcement.Title,
                announcement.Description,
                announcement.CreatedAt,
                false
            ));
        }

        /// <summary>
        /// Admin: Deleta um aviso.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(Guid id)
        {
            if (!IsAdmin())
                return Unauthorized("Acesso restrito ao administrador.");

            var announcement = await _announcementRepo.GetByIdAsync(id);
            if (announcement == null)
                return NotFound("Aviso não encontrado.");

            await _announcementRepo.DeleteAsync(id);
            return Ok(new { message = "Aviso removido com sucesso." });
        }

        private bool IsAdmin()
        {
            if (!Request.Headers.TryGetValue("X-Admin-Token", out var token))
                return false;
            return token == "admin-secret-token";
        }
    }
}
