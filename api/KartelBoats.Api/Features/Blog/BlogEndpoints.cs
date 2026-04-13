using KartelBoats.Api.Domain.Entities;
using KartelBoats.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace KartelBoats.Api.Features.Blog;

public static class BlogEndpoints
{
    public static void MapBlogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/blog")
            .WithTags("Blog");

        group.MapGet("/articles", GetPublishedArticles)
            .WithName("GetPublishedArticles")
            .WithSummary("Get published articles with pagination and optional category filter");

        group.MapGet("/articles/{id:guid}", GetArticleById)
            .WithName("GetArticleById")
            .WithSummary("Get a single published article");

        group.MapGet("/categories", GetCategories)
            .WithName("GetCategories")
            .WithSummary("Get all article categories");
    }

    private static async Task<Ok<ArticlePagedResponseDto>> GetPublishedArticles(
        AppDbContext db,
        int page = 1,
        int pageSize = 12,
        ArticleCategory? category = null,
        CancellationToken ct = default)
    {
        pageSize = Math.Clamp(pageSize, 1, 50);
        page = Math.Max(1, page);

        var query = db.Articles
            .AsNoTracking()
            .Where(a => a.IsPublished);

        if (category is not null)
            query = query.Where(a => a.Category == category);

        var totalCount = await query.CountAsync(ct);

        var articles = await query
            .OrderByDescending(a => a.PublishedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => a.ToDto())
            .ToListAsync(ct);

        return TypedResults.Ok(new ArticlePagedResponseDto
        {
            Articles = articles,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    private static async Task<Results<Ok<ArticleListDto>, NotFound>> GetArticleById(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var article = await db.Articles
            .AsNoTracking()
            .Where(a => a.Id == id && a.IsPublished)
            .Select(a => a.ToDto())
            .FirstOrDefaultAsync(ct);

        return article is not null
            ? TypedResults.Ok(article)
            : TypedResults.NotFound();
    }

    private static Ok<string[]> GetCategories()
    {
        var categories = Enum.GetNames<ArticleCategory>();
        return TypedResults.Ok(categories);
    }
}
