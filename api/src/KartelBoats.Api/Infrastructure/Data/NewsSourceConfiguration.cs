using KartelBoats.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KartelBoats.Api.Infrastructure.Data;

public sealed class NewsSourceConfiguration : IEntityTypeConfiguration<NewsSource>
{
    public void Configure(EntityTypeBuilder<NewsSource> builder)
    {
        builder.HasKey(ns => ns.Id);

        builder.Property(ns => ns.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(ns => ns.RssUrl)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(ns => ns.DefaultCategory)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasIndex(ns => ns.RssUrl).IsUnique();
    }
}
