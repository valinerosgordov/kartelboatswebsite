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
