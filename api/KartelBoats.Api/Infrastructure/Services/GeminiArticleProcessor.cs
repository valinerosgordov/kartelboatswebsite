using System.Text.Json;
using Microsoft.Extensions.Options;

namespace KartelBoats.Api.Infrastructure.Services;

public sealed partial class ArticleProcessor(
    HttpClient httpClient,
    IOptions<OpenAiOptions> options,
    ILogger<ArticleProcessor> logger)
{
    private readonly OpenAiOptions _options = options.Value;

    private const string SystemPrompt = """
        Ты — редактор блога о яхтах и катерах для российского производителя KARTEL BOATS.

        Тебе дают заголовок и описание статьи (возможно на английском). Твоя задача:

        1. ПЕРЕВЕСТИ заголовок и описание на русский язык (если на английском)
        2. НАПИСАТЬ качественный анонс на русском (100-200 слов), сохраняя факты из оригинала
        3. ОПРЕДЕЛИТЬ категорию из списка: IndustryNews, Reviews, Lifestyle, Events, Safety
        4. ОЦЕНИТЬ релевантность для аудитории яхтенного блога (true/false)
           - false: реклама, политика, спам, не про яхты/катера/море
           - true: новости яхтенной индустрии, обзоры, регаты, технологии, lifestyle

        Ответ СТРОГО в JSON формате:
        {
          "title_ru": "Заголовок на русском",
          "summary_ru": "Анонс на русском 100-200 слов",
          "category": "IndustryNews",
          "relevant": true
        }
        """;

    public async Task<ProcessedArticle?> ProcessAsync(
        string title,
        string rawDescription,
        CancellationToken ct = default)
    {
        var userPrompt = $"Заголовок: {title}\n\nОписание: {rawDescription}";

        try
        {
            var url = $"{_options.BaseUrl}/chat/completions";

            var payload = new
            {
                model = _options.Model,
                messages = new object[]
                {
                    new { role = "system", content = SystemPrompt },
                    new { role = "user", content = userPrompt }
                },
                temperature = 0.3,
                max_tokens = 1024,
                response_format = new { type = "json_object" }
            };

            var json = JsonSerializer.Serialize(payload);
            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _options.ApiKey);

            using var response = await httpClient.SendAsync(request, ct);

            if (!response.IsSuccessStatusCode)
            {
                LogApiFailed(logger, (int)response.StatusCode);
                return null;
            }

            var responseJson = await response.Content.ReadAsStringAsync(ct);
            return ParseResponse(responseJson);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            LogApiError(logger, ex);
            return null;
        }
    }

    private static ProcessedArticle? ParseResponse(string responseJson)
    {
        using var doc = JsonDocument.Parse(responseJson);
        var root = doc.RootElement;

        // Navigate: choices[0].message.content
        if (!root.TryGetProperty("choices", out var choices))
            return null;

        var firstChoice = choices[0];
        if (!firstChoice.TryGetProperty("message", out var message))
            return null;

        var text = message.GetProperty("content").GetString();
        if (string.IsNullOrEmpty(text))
            return null;

        using var resultDoc = JsonDocument.Parse(text);
        var result = resultDoc.RootElement;

        return new ProcessedArticle
        {
            TitleRu = result.GetProperty("title_ru").GetString() ?? "",
            SummaryRu = result.GetProperty("summary_ru").GetString() ?? "",
            Category = result.GetProperty("category").GetString() ?? "IndustryNews",
            IsRelevant = result.GetProperty("relevant").GetBoolean()
        };
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "OpenAI API returned HTTP {StatusCode}")]
    private static partial void LogApiFailed(ILogger logger, int statusCode);

    [LoggerMessage(Level = LogLevel.Error, Message = "OpenAI processing error")]
    private static partial void LogApiError(ILogger logger, Exception ex);
}

public sealed class ProcessedArticle
{
    public required string TitleRu { get; init; }
    public required string SummaryRu { get; init; }
    public required string Category { get; init; }
    public required bool IsRelevant { get; init; }
}
