using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace KartelBoats.Api.Features.Tracker;

public sealed class AisStreamOptions
{
    public const string SectionName = "AisStream";
    public required string ApiKey { get; init; }
    public string WsUrl { get; init; } = "wss://stream.aisstream.io/v0/stream";
}

/// <summary>
/// Background service that connects to AISStream WebSocket,
/// receives vessel positions, and broadcasts to connected browser clients via SSE.
/// </summary>
public sealed partial class AisStreamRelay(
    IConfiguration configuration,
    ILogger<AisStreamRelay> logger) : BackgroundService
{
    private readonly ConcurrentDictionary<string, VesselPosition> _vessels = new();
    private readonly ConcurrentBag<TaskCompletionSource<bool>> _newDataSignals = [];

    public IReadOnlyDictionary<string, VesselPosition> Vessels => _vessels;

    public void WaitForNewData(TaskCompletionSource<bool> tcs) => _newDataSignals.Add(tcs);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var options = configuration.GetSection(AisStreamOptions.SectionName).Get<AisStreamOptions>();
        if (options is null || string.IsNullOrEmpty(options.ApiKey) || options.ApiKey == "YOUR_AISSTREAM_API_KEY")
        {
            LogNoApiKey(logger);
            return;
        }

        LogStarting(logger);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ConnectAndStreamAsync(options, stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                LogError(logger, ex);
                await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
            }
        }
    }

    private async Task ConnectAndStreamAsync(AisStreamOptions options, CancellationToken ct)
    {
        using var ws = new ClientWebSocket();
        await ws.ConnectAsync(new Uri(options.WsUrl), ct);
        LogConnected(logger);

        // Send subscription immediately (must be within 3 seconds)
        var subscription = JsonSerializer.Serialize(new
        {
            APIKey = options.ApiKey,
            BoundingBoxes = new double[][][] {
                [[-90.0, -180.0], [90.0, 180.0]]   // Worldwide
            }
        });

        var subBytes = Encoding.UTF8.GetBytes(subscription);
        await ws.SendAsync(subBytes, WebSocketMessageType.Text, true, ct);
        LogSubscribed(logger);

        var buffer = new byte[8192];
        while (ws.State == WebSocketState.Open && !ct.IsCancellationRequested)
        {
            var result = await ws.ReceiveAsync(buffer, ct);
            if (result.MessageType == WebSocketMessageType.Close)
                break;

            var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
            ProcessMessage(json);
        }
    }

    private void ProcessMessage(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (!root.TryGetProperty("MessageType", out var msgType))
                return;
            if (msgType.GetString() != "PositionReport")
                return;

            if (!root.TryGetProperty("MetaData", out var meta))
                return;

            var mmsi = meta.TryGetProperty("MMSI", out var mmsiEl) ? mmsiEl.GetInt64().ToString(System.Globalization.CultureInfo.InvariantCulture) : null;
            if (string.IsNullOrEmpty(mmsi)) return;

            var lat = meta.TryGetProperty("latitude", out var latEl) ? latEl.GetDouble() : 0;
            var lon = meta.TryGetProperty("longitude", out var lonEl) ? lonEl.GetDouble() : 0;
            if (lat == 0 && lon == 0) return;

            var name = meta.TryGetProperty("ShipName", out var nameEl) ? nameEl.GetString()?.Trim() ?? "UNKNOWN" : "UNKNOWN";

            var pos = root.TryGetProperty("Message", out var msgEl)
                && msgEl.TryGetProperty("PositionReport", out var posEl) ? posEl : default;

            var speed = pos.ValueKind != JsonValueKind.Undefined && pos.TryGetProperty("Sog", out var sogEl) ? sogEl.GetDouble() : 0;
            var course = pos.ValueKind != JsonValueKind.Undefined && pos.TryGetProperty("Cog", out var cogEl) ? cogEl.GetDouble() : 0;

            var vessel = new VesselPosition(mmsi, name, lat, lon, speed, course, DateTime.UtcNow);
            _vessels[mmsi] = vessel;

            // Signal waiting SSE clients
            while (_newDataSignals.TryTake(out var tcs))
            {
                tcs.TrySetResult(true);
            }
        }
        catch
        {
            // Skip malformed
        }
    }

    [LoggerMessage(Level = LogLevel.Warning, Message = "AIS Stream: No API key configured, skipping")]
    private static partial void LogNoApiKey(ILogger logger);

    [LoggerMessage(Level = LogLevel.Information, Message = "AIS Stream relay starting")]
    private static partial void LogStarting(ILogger logger);

    [LoggerMessage(Level = LogLevel.Information, Message = "AIS Stream WebSocket connected")]
    private static partial void LogConnected(ILogger logger);

    [LoggerMessage(Level = LogLevel.Information, Message = "AIS Stream subscription sent")]
    private static partial void LogSubscribed(ILogger logger);

    [LoggerMessage(Level = LogLevel.Error, Message = "AIS Stream error, reconnecting")]
    private static partial void LogError(ILogger logger, Exception ex);
}

public sealed record VesselPosition(
    string Mmsi,
    string Name,
    double Lat,
    double Lon,
    double Speed,
    double Course,
    DateTime UpdatedAt);
