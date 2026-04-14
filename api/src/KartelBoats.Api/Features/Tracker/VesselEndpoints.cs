using System.Text.Json;
using Microsoft.AspNetCore.Http.HttpResults;

namespace KartelBoats.Api.Features.Tracker;

public static class VesselEndpoints
{
    public static void MapVesselEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/vessel")
            .WithTags("Vessel Tracker");

        group.MapGet("/search", SearchVessel)
            .WithName("SearchVessel")
            .WithSummary("Search for a vessel by name, MMSI, or IMO");

        group.MapGet("/mmsi/{mmsi}", GetByMmsi)
            .WithName("GetVesselByMmsi")
            .WithSummary("Get vessel position by MMSI");

        // AIS live stream via SSE
        group.MapGet("/live", LiveStream)
            .WithName("VesselLiveStream")
            .WithSummary("Server-Sent Events stream of live AIS vessel positions");

        // Snapshot of all currently tracked vessels
        group.MapGet("/live/snapshot", LiveSnapshot)
            .WithName("VesselLiveSnapshot")
            .WithSummary("Get all currently tracked vessels");
    }

    private static async Task LiveStream(
        HttpContext context,
        AisStreamRelay relay,
        CancellationToken ct)
    {
        context.Response.ContentType = "text/event-stream";
        context.Response.Headers.CacheControl = "no-cache";
        context.Response.Headers.Connection = "keep-alive";

        // Send initial snapshot
        var snapshot = relay.Vessels.Values.ToList();
        if (snapshot.Count > 0)
        {
            var json = JsonSerializer.Serialize(snapshot);
            await context.Response.WriteAsync($"event: snapshot\ndata: {json}\n\n", ct);
            await context.Response.Body.FlushAsync(ct);
        }

        // Stream updates
        while (!ct.IsCancellationRequested)
        {
            var tcs = new TaskCompletionSource<bool>();
            relay.WaitForNewData(tcs);

            // Wait for new data or timeout (send keepalive)
            var completed = await Task.WhenAny(tcs.Task, Task.Delay(15000, ct));
            if (ct.IsCancellationRequested) break;

            if (completed == tcs.Task)
            {
                // Send all current vessels
                var vessels = relay.Vessels.Values.ToList();
                var data = JsonSerializer.Serialize(vessels);
                await context.Response.WriteAsync($"event: update\ndata: {data}\n\n", ct);
            }
            else
            {
                // Keepalive
                await context.Response.WriteAsync(": keepalive\n\n", ct);
            }

            await context.Response.Body.FlushAsync(ct);
        }
    }

    private static Ok<List<VesselPosition>> LiveSnapshot(AisStreamRelay relay)
    {
        return TypedResults.Ok(relay.Vessels.Values.ToList());
    }

    private static async Task<Results<Ok<VesselSearchResponseDto>, BadRequest<string>, StatusCodeHttpResult>> SearchVessel(
        string q,
        DatalasticClient client,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return TypedResults.BadRequest("Query must be at least 2 characters.");

        var result = await client.SearchVesselAsync(q, ct);

        return result.Match<Results<Ok<VesselSearchResponseDto>, BadRequest<string>, StatusCodeHttpResult>>(
            onSuccess: v => TypedResults.Ok(v),
            onFailure: _ => TypedResults.StatusCode(502)
        );
    }

    private static async Task<Results<Ok<VesselSearchResponseDto>, BadRequest<string>, StatusCodeHttpResult>> GetByMmsi(
        string mmsi,
        DatalasticClient client,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(mmsi) || mmsi.Length != 9)
            return TypedResults.BadRequest("MMSI must be exactly 9 digits.");

        var result = await client.GetVesselByMmsiAsync(mmsi, ct);

        return result.Match<Results<Ok<VesselSearchResponseDto>, BadRequest<string>, StatusCodeHttpResult>>(
            onSuccess: v => TypedResults.Ok(v),
            onFailure: _ => TypedResults.StatusCode(502)
        );
    }
}
