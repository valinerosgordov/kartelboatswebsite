namespace KartelBoats.Api.Domain.Common;

public abstract class Entity<TId> where TId : notnull
{
    public TId Id { get; protected init; } = default!;
    public DateTime CreatedAt { get; protected init; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; protected set; }

    protected void MarkUpdated() => UpdatedAt = DateTime.UtcNow;
}
