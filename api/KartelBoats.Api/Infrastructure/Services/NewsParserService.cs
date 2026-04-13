using System.ServiceModel.Syndication;
using System.Xml;
using KartelBoats.Api.Domain.Entities;
using KartelBoats.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace KartelBoats.Api.Infrastructure.Services;

public sealed partial class NewsParserService(
    IServiceScopeFactory scopeFactory,
    HttpClient httpClient,
    ILogger<NewsParserService> logger) : BackgroundService
{
    private static readonly TimeSpan ParseInterval = TimeSpan.FromHours(2);
    private static readonly TimeSpan GeminiDelay = TimeSpan.FromSeconds(2); // Rate limiting

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        LogParserStarted(logger);

        // Wait for app startup
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        using var timer = new PeriodicTimer(ParseInterval);

        do
        {
            try
            {
                await ParseAllSourcesAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                LogParserError(logger, ex);
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task ParseAllSourcesAsync(CancellationToken ct)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var gemini = scope.ServiceProvider.GetRequiredService<ArticleProcessor>();

        var sources = await db.NewsSources
            .Where(s => s.IsEnabled)
            .ToListAsync(ct);

        LogParsingRound(logger, sources.Count);

        foreach (var source in sources)
        {
            try
            {
                var newCount = await ParseSourceAsync(db, gemini, source, ct);
                source.MarkParsed();
                LogSourceParsed(logger, source.Name, newCount);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                LogSourceError(logger, source.Name, ex);
            }
        }

        await db.SaveChangesAsync(ct);
    }

    private async Task<int> ParseSourceAsync(
        AppDbContext db,
        ArticleProcessor gemini,
        NewsSource source,
        CancellationToken ct)
    {
        using var stream = await httpClient.GetStreamAsync(source.RssUrl, ct);
        using var reader = XmlReader.Create(stream, new XmlReaderSettings { Async = true, DtdProcessing = DtdProcessing.Ignore });

        var feed = SyndicationFeed.Load(reader);
        var newArticles = 0;

        foreach (var item in feed.Items)
        {
            var link = item.Links.FirstOrDefault()?.Uri?.AbsoluteUri;
            if (string.IsNullOrEmpty(link))
                continue;

            var exists = await db.Articles
                .AnyAsync(a => a.SourceUrl == link, ct);

            if (exists)
                continue;

            var rawTitle = item.Title?.Text ?? "Untitled";
            var rawSummary = StripHtml(item.Summary?.Text ?? "");
            var imageUrl = ExtractImageUrl(item);

            // Process with Gemini: translate, summarize, categorize, filter
            var processed = await gemini.ProcessAsync(rawTitle, rawSummary, ct);

            if (processed is null)
            {
                // Gemini failed — save raw (fallback)
                LogGeminiFallback(logger, rawTitle);
                SaveArticleRaw(db, rawTitle, rawSummary, link, source, imageUrl);
                newArticles++;
                continue;
            }

            // Skip irrelevant articles (ads, spam, off-topic)
            if (!processed.IsRelevant)
            {
                LogArticleSkipped(logger, rawTitle);
                continue;
            }

            // Parse category from Gemini response
            var category = Enum.TryParse<ArticleCategory>(processed.Category, out var parsed)
                ? parsed
                : source.DefaultCategory;

            var title = processed.TitleRu.Length > 500
                ? processed.TitleRu[..497] + "..."
                : processed.TitleRu;

            var summary = processed.SummaryRu.Length > 2000
                ? processed.SummaryRu[..1997] + "..."
                : processed.SummaryRu;

            var article = Article.Create(
                title: title,
                summary: summary,
                sourceUrl: link,
                sourceName: source.Name,
                category: category,
                imageUrl: imageUrl
            );

            db.Articles.Add(article);
            newArticles++;

            // Rate limit Gemini calls
            await Task.Delay(GeminiDelay, ct);
        }

        return newArticles;
    }

    private static void SaveArticleRaw(
        AppDbContext db,
        string title,
        string summary,
        string link,
        NewsSource source,
        string? imageUrl)
    {
        if (title.Length > 500) title = title[..497] + "...";
        if (summary.Length > 2000) summary = summary[..1997] + "...";

        var article = Article.Create(
            title: title,
            summary: summary,
            sourceUrl: link,
            sourceName: source.Name,
            category: source.DefaultCategory,
            imageUrl: imageUrl
        );

        db.Articles.Add(article);
    }

    private static string StripHtml(string html)
    {
        if (string.IsNullOrEmpty(html))
            return string.Empty;

        var span = html.AsSpan();
        var result = new char[span.Length];
        var resultIndex = 0;
        var inTag = false;

        foreach (var c in span)
        {
            switch (c)
            {
                case '<':
                    inTag = true;
                    break;
                case '>':
                    inTag = false;
                    break;
                default:
                    if (!inTag)
                        result[resultIndex++] = c;
                    break;
            }
        }

        return new string(result, 0, resultIndex).Trim();
    }

    private static string? ExtractImageUrl(SyndicationItem item)
    {
        foreach (var ext in item.ElementExtensions)
        {
            if (ext.OuterName is "content" or "thumbnail")
            {
                var element = ext.GetObject<XmlElement>();
                var url = element?.GetAttribute("url");
                if (!string.IsNullOrEmpty(url))
                    return url;
            }
        }

        var imageLink = item.Links.FirstOrDefault(l =>
            l.MediaType?.StartsWith("image/", StringComparison.OrdinalIgnoreCase) == true);

        return imageLink?.Uri?.AbsoluteUri;
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "News parser service started")]
    private static partial void LogParserStarted(ILogger logger);

    [LoggerMessage(Level = LogLevel.Information, Message = "Parsing {Count} enabled news source(s)")]
    private static partial void LogParsingRound(ILogger logger, int count);

    [LoggerMessage(Level = LogLevel.Information, Message = "Parsed {SourceName}: {NewCount} new article(s)")]
    private static partial void LogSourceParsed(ILogger logger, string sourceName, int newCount);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Failed to parse source {SourceName}")]
    private static partial void LogSourceError(ILogger logger, string sourceName, Exception ex);

    [LoggerMessage(Level = LogLevel.Error, Message = "News parser round failed")]
    private static partial void LogParserError(ILogger logger, Exception ex);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Gemini failed for '{Title}', saving raw")]
    private static partial void LogGeminiFallback(ILogger logger, string title);

    [LoggerMessage(Level = LogLevel.Information, Message = "Skipped irrelevant article: {Title}")]
    private static partial void LogArticleSkipped(ILogger logger, string title);
}
