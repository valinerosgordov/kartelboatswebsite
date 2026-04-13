using KartelBoats.Api.Domain.Entities;
using KartelBoats.Api.Features.Blog;
using KartelBoats.Api.Infrastructure.Data;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;

namespace KartelBoats.Api.Features.Admin;

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/admin")
            .WithTags("Admin");

        // Articles
        group.MapGet("/articles", GetAllArticles)
            .WithName("AdminGetAllArticles");

        group.MapPost("/articles/{id:guid}/publish", PublishArticle)
            .WithName("AdminPublishArticle");

        group.MapPost("/articles/{id:guid}/unpublish", UnpublishArticle)
            .WithName("AdminUnpublishArticle");

        group.MapDelete("/articles/{id:guid}", DeleteArticle)
            .WithName("AdminDeleteArticle");

        // News Sources
        group.MapGet("/sources", GetSources)
            .WithName("AdminGetSources");

        group.MapPost("/sources", AddSource)
            .WithName("AdminAddSource");

        group.MapDelete("/sources/{id:guid}", DeleteSource)
            .WithName("AdminDeleteSource");

        group.MapPost("/sources/{id:guid}/toggle", ToggleSource)
            .WithName("AdminToggleSource");
    }

    // ===== Articles =====

    private static async Task<Ok<ArticlePagedResponseDto>> GetAllArticles(
        AppDbContext db,
        int page = 1,
        int pageSize = 20,
        CancellationToken ct = default)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page = Math.Max(1, page);

        var totalCount = await db.Articles.CountAsync(ct);

        var articles = await db.Articles
            .AsNoTracking()
            .OrderByDescending(a => a.CreatedAt)
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

    private static async Task<Results<Ok, NotFound>> PublishArticle(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var article = await db.Articles.FindAsync([id], ct);
        if (article is null) return TypedResults.NotFound();

        article.Publish();
        await db.SaveChangesAsync(ct);
        return TypedResults.Ok();
    }

    private static async Task<Results<Ok, NotFound>> UnpublishArticle(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var article = await db.Articles.FindAsync([id], ct);
        if (article is null) return TypedResults.NotFound();

        article.Unpublish();
        await db.SaveChangesAsync(ct);
        return TypedResults.Ok();
    }

    private static async Task<Results<NoContent, NotFound>> DeleteArticle(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var article = await db.Articles.FindAsync([id], ct);
        if (article is null) return TypedResults.NotFound();

        db.Articles.Remove(article);
        await db.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }

    // ===== News Sources =====

    private static async Task<Ok<List<NewsSourceDto>>> GetSources(
        AppDbContext db,
        CancellationToken ct)
    {
        var sources = await db.NewsSources
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .Select(s => new NewsSourceDto
            {
                Id = s.Id,
                Name = s.Name,
                RssUrl = s.RssUrl,
                DefaultCategory = s.DefaultCategory.ToString(),
                IsEnabled = s.IsEnabled,
                LastParsedAt = s.LastParsedAt
            })
            .ToListAsync(ct);

        return TypedResults.Ok(sources);
    }

    private static async Task<Created<NewsSourceDto>> AddSource(
        AddNewsSourceRequest request,
        AppDbContext db,
        CancellationToken ct)
    {
        var source = NewsSource.Create(request.Name, request.RssUrl, request.DefaultCategory);

        db.NewsSources.Add(source);
        await db.SaveChangesAsync(ct);

        return TypedResults.Created($"/api/admin/sources/{source.Id}", new NewsSourceDto
        {
            Id = source.Id,
            Name = source.Name,
            RssUrl = source.RssUrl,
            DefaultCategory = source.DefaultCategory.ToString(),
            IsEnabled = source.IsEnabled,
            LastParsedAt = source.LastParsedAt
        });
    }

    private static async Task<Results<NoContent, NotFound>> DeleteSource(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var source = await db.NewsSources.FindAsync([id], ct);
        if (source is null) return TypedResults.NotFound();

        db.NewsSources.Remove(source);
        await db.SaveChangesAsync(ct);
        return TypedResults.NoContent();
    }

    private static async Task<Results<Ok, NotFound>> ToggleSource(
        Guid id,
        AppDbContext db,
        CancellationToken ct)
    {
        var source = await db.NewsSources.FindAsync([id], ct);
        if (source is null) return TypedResults.NotFound();

        source.IsEnabled = !source.IsEnabled;
        await db.SaveChangesAsync(ct);
        return TypedResults.Ok();
    }
}

public sealed record NewsSourceDto
{
    public required Guid Id { get; init; }
    public required string Name { get; init; }
    public required string RssUrl { get; init; }
    public required string DefaultCategory { get; init; }
    public required bool IsEnabled { get; init; }
    public DateTime? LastParsedAt { get; init; }
}

public sealed record AddNewsSourceRequest
{
    public required string Name { get; init; }
    public required string RssUrl { get; init; }
    public required ArticleCategory DefaultCategory { get; init; }
}
