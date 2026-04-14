using KartelBoats.Api.Features.Admin;
using KartelBoats.Api.Features.Blog;
using KartelBoats.Api.Features.Tracker;
using KartelBoats.Api.Infrastructure.Data;
using KartelBoats.Api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ===== Database =====
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=kartelboats.db"));

// ===== Datalastic (Vessel Tracker) =====
builder.Services.Configure<DatalasticOptions>(
    builder.Configuration.GetSection(DatalasticOptions.SectionName));

builder.Services.AddHttpClient<DatalasticClient>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(15);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
})
.AddStandardResilienceHandler();

// ===== OpenAI (Article Processing) =====
builder.Services.Configure<OpenAiOptions>(
    builder.Configuration.GetSection(OpenAiOptions.SectionName));

builder.Services.AddHttpClient<ArticleProcessor>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});

// ===== AIS Stream (Live vessel tracking) =====
builder.Services.AddSingleton<AisStreamRelay>();
builder.Services.AddHostedService(sp => sp.GetRequiredService<AisStreamRelay>());

// ===== News Parser =====
builder.Services.AddHttpClient<NewsParserService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(30);
});
builder.Services.AddHostedService<NewsParserService>();

// ===== CORS =====
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
            ?? ["http://localhost:5500", "http://127.0.0.1:5500"];

        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ===== OpenAPI =====
builder.Services.AddOpenApi();

var app = builder.Build();

// ===== Seed Database =====
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await SeedData.SeedAsync(db);
}

// ===== Middleware =====
app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// ===== Static Files (serve frontend from wwwroot) =====
app.UseDefaultFiles();
app.UseStaticFiles();

// ===== Endpoints =====
app.MapVesselEndpoints();
app.MapBlogEndpoints();
app.MapAdminEndpoints();

// ===== Health Check =====
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .WithTags("Health");

app.Run();
