using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Bolao.Copa2026.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiCommentController : ControllerBase
    {
        private readonly IRepository<AiComment> _commentRepo;

        public AiCommentController(IRepository<AiComment> commentRepo)
        {
            _commentRepo = commentRepo;
        }

        [HttpGet]
        public async Task<ActionResult> GetComments()
        {
            var comments = await _commentRepo.GetAllAsync();
            return Ok(comments.OrderByDescending(c => c.CreatedAt).ToList());
        }
    }
}
