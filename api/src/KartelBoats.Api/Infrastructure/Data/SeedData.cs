using KartelBoats.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace KartelBoats.Api.Infrastructure.Data;

public static class SeedData
{
    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        await db.Database.MigrateAsync(ct);

        if (await db.NewsSources.AnyAsync(ct))
            return;

        db.NewsSources.AddRange(
            // International — yacht & boat industry
            NewsSource.Create("Yachting World", "https://www.yachtingworld.com/feed", ArticleCategory.Lifestyle),
            NewsSource.Create("Motor Boat & Yachting", "https://www.mby.com/feed", ArticleCategory.Reviews),
            NewsSource.Create("gCaptain", "https://gcaptain.com/feed/", ArticleCategory.IndustryNews),
            NewsSource.Create("Power & Motoryacht", "https://powerandmotoryacht.com/feed/", ArticleCategory.Reviews),
            NewsSource.Create("PassageMaker", "http://passagemaker.com/feed/", ArticleCategory.Lifestyle),
            NewsSource.Create("Sail Magazine", "http://sailmagazine.com/feed/", ArticleCategory.Lifestyle),
            NewsSource.Create("Cruising World", "https://www.cruisingworld.com/feed/", ArticleCategory.Lifestyle),
            NewsSource.Create("Sailing Scuttlebutt", "https://www.sailingscuttlebutt.com/feed/", ArticleCategory.Events),
            NewsSource.Create("Sailing World", "https://www.sailingworld.com/feed/", ArticleCategory.Events),
            NewsSource.Create("Marine Technology News", "https://www.marinetechnologynews.com/rss/news?take=20", ArticleCategory.IndustryNews)
        );

        await db.SaveChangesAsync(ct);
    }
}
