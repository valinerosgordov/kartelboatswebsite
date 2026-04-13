using KartelBoats.Api.Domain.Common;

namespace KartelBoats.Api.Domain.Entities;

public sealed class Article : Entity<Guid>
{
    public required string Title { get; set; }
    public required string Summary { get; set; }
    public required string SourceUrl { get; set; }
    public string? ImageUrl { get; set; }
    public required string SourceName { get; set; }
    public required ArticleCategory Category { get; set; }
    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }

    public static Article Create(
        string title,
        string summary,
        string sourceUrl,
        string sourceName,
        ArticleCategory category,
        string? imageUrl = null)
    {
        return new Article
        {
            Id = Guid.CreateVersion7(),
            Title = title,
            Summary = summary,
            SourceUrl = sourceUrl,
            SourceName = sourceName,
            Category = category,
            ImageUrl = imageUrl,
            IsPublished = false
        };
    }

    public void Publish()
    {
        IsPublished = true;
        PublishedAt = DateTime.UtcNow;
        MarkUpdated();
    }

    public void Unpublish()
    {
        IsPublished = false;
        PublishedAt = null;
        MarkUpdated();
    }
}

public enum ArticleCategory
{
    IndustryNews,
    Reviews,
    Lifestyle,
    Events,
    Safety
}
