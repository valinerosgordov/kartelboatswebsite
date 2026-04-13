using KartelBoats.Api.Domain.Entities;

namespace KartelBoats.Api.Features.Blog;

public sealed record ArticleListDto
{
    public required Guid Id { get; init; }
    public required string Title { get; init; }
    public required string Summary { get; init; }
    public required string SourceUrl { get; init; }
    public string? ImageUrl { get; init; }
    public required string SourceName { get; init; }
    public required string Category { get; init; }
    public required DateTime CreatedAt { get; init; }
    public DateTime? PublishedAt { get; init; }
}

public sealed record ArticlePagedResponseDto
{
    public required IReadOnlyList<ArticleListDto> Articles { get; init; }
    public required int TotalCount { get; init; }
    public required int Page { get; init; }
    public required int PageSize { get; init; }
}

public static class ArticleMappings
{
    public static ArticleListDto ToDto(this Article article) => new()
    {
        Id = article.Id,
        Title = article.Title,
        Summary = article.Summary,
        SourceUrl = article.SourceUrl,
        ImageUrl = article.ImageUrl,
        SourceName = article.SourceName,
        Category = article.Category.ToString(),
        CreatedAt = article.CreatedAt,
        PublishedAt = article.PublishedAt
    };
}
