using Bolao.Copa2026.API.Data;
using Bolao.Copa2026.API.Models;
using Bolao.Copa2026.API.Repositories;
using Bolao.Copa2026.API.Services;
using FootballData.Intergration.Core;
using FootballData.Intergration.Modules;
using MongoDB.Bson.Serialization.Serializers;
using MongoDB.Bson.Serialization;
using MongoDB.Bson;
using MongoDB.Driver;

var builder = WebApplication.CreateBuilder(args);

// Adicionar serviços ao contêiner.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.CustomSchemaIds(type => type.FullName);
});

// --- NOVO: Configuração da API de Futebol ---
// Pega a seção "FootballApi" do appsettings.json e injeta em FootballApiSettings
builder.Services.Configure<FootballApiSettings>(
    builder.Configuration.GetSection("FootballApi"));

builder.Services.Configure<MatchPollingConfig>(
    builder.Configuration.GetSection("MatchPolling"));

builder.Services.AddHostedService<MatchSyncBackgroundService>();

builder.Services.AddHttpClient<TeamsModule>();
builder.Services.AddScoped<TeamsModule>();
builder.Services.AddHttpClient<MatchesModule>();
builder.Services.AddScoped<MatchesModule>();




// --- Configuração MongoDB ---
var mongoConnectionString = builder.Configuration["MongoDb:ConnectionString"] ?? "mongodb://localhost:27017";
var mongoDatabaseName = builder.Configuration["MongoDb:DatabaseName"] ?? "BolaoCopa2026Db";

builder.Services.AddSingleton<IMongoClient>(sp => new MongoClient(mongoConnectionString));
builder.Services.AddScoped<IMongoDatabase>(sp => 
    sp.GetRequiredService<IMongoClient>().GetDatabase(mongoDatabaseName));

// --- Injeção de Dependência dos Repositórios ---
builder.Services.AddScoped<IRepository<Match>>(sp => 
    new MongoRepository<Match>(sp.GetRequiredService<IMongoDatabase>(), "matches"));
builder.Services.AddScoped<IRepository<Team>>(sp => 
    new MongoRepository<Team>(sp.GetRequiredService<IMongoDatabase>(), "teams"));
builder.Services.AddScoped<IRepository<User>>(sp => 
    new MongoRepository<User>(sp.GetRequiredService<IMongoDatabase>(), "users"));
builder.Services.AddScoped<IRepository<Prediction>>(sp => 
    new MongoRepository<Prediction>(sp.GetRequiredService<IMongoDatabase>(), "predictions"));
builder.Services.AddScoped<IRepository<UserRanking>>(sp => 
    new MongoRepository<UserRanking>(sp.GetRequiredService<IMongoDatabase>(), "user_rankings"));

// --- Injeção de Dependência dos Serviços ---
builder.Services.AddScoped<IMatchService, MatchService>();
builder.Services.AddScoped<IPredictionService, PredictionService>();
builder.Services.AddScoped<IRankingService, RankingService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ITeamsService, TeamsService>();
builder.Services.AddScoped<DbSeeder>();

// Configuração de CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.SetIsOriginAllowed(origin => 
                  origin.Contains("localhost") || 
                  origin.Contains("amplifyapp.com") ||
                  origin.Contains("cloudfront.net"))
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Swagger habilitado em todos os ambientes
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();
BsonSerializer.RegisterSerializer(new GuidSerializer(GuidRepresentation.Standard));
// Seed inicial
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DbSeeder>();
    await seeder.SeedAsync();
}

app.Run();