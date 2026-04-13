namespace KartelBoats.Api.Features.Tracker;

public sealed record VesselDto
{
    public required string Name { get; init; }
    public required string Type { get; init; }
    public required string Mmsi { get; init; }
    public required double Lat { get; init; }
    public required double Lon { get; init; }
    public required double Speed { get; init; }
    public required double Course { get; init; }
    public required string Destination { get; init; }
    public required string Flag { get; init; }
}

public sealed record VesselSearchResponseDto
{
    public required IReadOnlyList<VesselDto> Vessels { get; init; }
}
