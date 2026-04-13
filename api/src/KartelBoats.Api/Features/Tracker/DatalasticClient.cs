using System.Text.Json;
using KartelBoats.Api.Domain.Common;
using Microsoft.Extensions.Options;

namespace KartelBoats.Api.Features.Tracker;

public sealed partial class DatalasticClient(
    HttpClient httpClient,
    IOptions<DatalasticOptions> options,
    ILogger<DatalasticClient> logger)
{
    private readonly DatalasticOptions _options = options.Value;

    public async Task<Result<VesselSearchResponseDto>> SearchVesselAsync(
        string query,
        CancellationToken ct = default)
    {
        var url = $"{_options.BaseUrl}/vessel_find?api-key={_options.ApiKey}&name={Uri.EscapeDataString(query)}";

        LogSearchAttempt(logger, query);

        try
        {
            using var response = await httpClient.GetAsync(url, ct);

            if (!response.IsSuccessStatusCode)
            {
                LogSearchFailed(logger, query, (int)response.StatusCode);
                return new AppError("Datalastic.RequestFailed", $"API returned {response.StatusCode}");
            }

            using var stream = await response.Content.ReadAsStreamAsync(ct);
            var json = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

            var vessels = ParseVessels(json);

            LogSearchSuccess(logger, query, vessels.Count);
            return new VesselSearchResponseDto { Vessels = vessels };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            LogSearchError(logger, query, ex);
            return new AppError("Datalastic.Error", ex.Message);
        }
    }

    public async Task<Result<VesselSearchResponseDto>> GetVesselByMmsiAsync(
        string mmsi,
        CancellationToken ct = default)
    {
        var url = $"{_options.BaseUrl}/vessel_prob?api-key={_options.ApiKey}&mmsi={Uri.EscapeDataString(mmsi)}";

        try
        {
            using var response = await httpClient.GetAsync(url, ct);

            if (!response.IsSuccessStatusCode)
                return new AppError("Datalastic.RequestFailed", $"API returned {response.StatusCode}");

            using var stream = await response.Content.ReadAsStreamAsync(ct);
            var json = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

            var vessels = ParseVessels(json);
            return new VesselSearchResponseDto { Vessels = vessels };
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            LogSearchError(logger, mmsi, ex);
            return new AppError("Datalastic.Error", ex.Message);
        }
    }

    private static List<VesselDto> ParseVessels(JsonDocument json)
    {
        var vessels = new List<VesselDto>();
        var root = json.RootElement;

        if (root.TryGetProperty("data", out var data))
        {
            if (data.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in data.EnumerateArray())
                {
                    vessels.Add(ParseSingleVessel(item));
                }
            }
            else
            {
                vessels.Add(ParseSingleVessel(data));
            }
        }

        return vessels;
    }

    private static VesselDto ParseSingleVessel(JsonElement item)
    {
        return new VesselDto
        {
            Name = item.GetPropertyOrDefault("name", "UNKNOWN"),
            Type = item.GetPropertyOrDefault("type_specific", "UNKNOWN"),
            Mmsi = item.GetPropertyOrDefault("mmsi", ""),
            Lat = item.GetDoubleOrDefault("lat"),
            Lon = item.GetDoubleOrDefault("lon"),
            Speed = item.GetDoubleOrDefault("speed"),
            Course = item.GetDoubleOrDefault("course"),
            Destination = item.GetPropertyOrDefault("destination", ""),
            Flag = item.GetPropertyOrDefault("country_iso", "")
        };
    }

    [LoggerMessage(Level = LogLevel.Information, Message = "Searching Datalastic for vessel: {Query}")]
    private static partial void LogSearchAttempt(ILogger logger, string query);

    [LoggerMessage(Level = LogLevel.Warning, Message = "Datalastic search failed for {Query}: HTTP {StatusCode}")]
    private static partial void LogSearchFailed(ILogger logger, string query, int statusCode);

    [LoggerMessage(Level = LogLevel.Information, Message = "Datalastic search for {Query} returned {Count} vessel(s)")]
    private static partial void LogSearchSuccess(ILogger logger, string query, int count);

    [LoggerMessage(Level = LogLevel.Error, Message = "Datalastic search error for {Query}")]
    private static partial void LogSearchError(ILogger logger, string query, Exception ex);
}

file static class JsonElementExtensions
{
    public static string GetPropertyOrDefault(this JsonElement element, string property, string fallback)
    {
        return element.TryGetProperty(property, out var value) && value.ValueKind == JsonValueKind.String
            ? value.GetString() ?? fallback
            : fallback;
    }

    public static double GetDoubleOrDefault(this JsonElement element, string property, double fallback = 0)
    {
        if (!element.TryGetProperty(property, out var value))
            return fallback;

        return value.ValueKind switch
        {
            JsonValueKind.Number => value.GetDouble(),
            JsonValueKind.String when double.TryParse(value.GetString(), out var parsed) => parsed,
            _ => fallback
        };
    }
}
