using KartelBoats.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace KartelBoats.Api.Infrastructure.Data;

public sealed class ArticleConfiguration : IEntityTypeConfiguration<Article>
{
    public void Configure(EntityTypeBuilder<Article> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Title)
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(a => a.Summary)
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(a => a.SourceUrl)
            .HasMaxLength(1000)
            .IsRequired();

        builder.Property(a => a.SourceName)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(a => a.ImageUrl)
            .HasMaxLength(1000);

        builder.Property(a => a.Category)
            .HasConversion<string>()
            .HasMaxLength(50);

        builder.HasIndex(a => a.IsPublished);
        builder.HasIndex(a => a.Category);
        builder.HasIndex(a => a.SourceUrl).IsUnique();
    }
}
