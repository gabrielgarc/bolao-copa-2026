using System.Linq.Expressions;

namespace Bolao.Copa2026.API.Repositories
{
    public interface IRepository<T> where T : class
    {
        Task<List<T>> GetAllAsync();
        Task<T?> GetByIdAsync(Guid id);
        Task<T?> FindOneAsync(Expression<Func<T, bool>> filter);
        Task<List<T>> FindAsync(Expression<Func<T, bool>> filter);
        Task CreateAsync(T entity);
        Task UpdateAsync(Guid id, T entity);
        Task DeleteAsync(Guid id);
        Task<bool> AnyAsync();
    }
}
