using KartelBoats.Api.Domain.Common;

namespace KartelBoats.Api.Domain.Entities;

public sealed class NewsSource : Entity<Guid>
{
    public required string Name { get; set; }
    public required string RssUrl { get; set; }
    public required ArticleCategory DefaultCategory { get; set; }
    public bool IsEnabled { get; set; } = true;
    public DateTime? LastParsedAt { get; set; }

    public static NewsSource Create(
        string name,
        string rssUrl,
        ArticleCategory defaultCategory)
    {
        return new NewsSource
        {
            Id = Guid.CreateVersion7(),
            Name = name,
            RssUrl = rssUrl,
            DefaultCategory = defaultCategory
        };
    }

    public void MarkParsed()
    {
        LastParsedAt = DateTime.UtcNow;
        MarkUpdated();
    }
}
