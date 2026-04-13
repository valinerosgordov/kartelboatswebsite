namespace KartelBoats.Api.Features.Tracker;

public sealed class DatalasticOptions
{
    public const string SectionName = "Datalastic";

    public required string ApiKey { get; init; }
    public string BaseUrl { get; init; } = "https://api.datalastic.com/api/v0";
}
