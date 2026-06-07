using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace Bolao.Copa2026.API.Services
{
    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        public GeminiService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _config = config;
        }

        public async Task<string> GenerateCommentaryAsync(string contextData)
        {
            var apiKey = _config["Gemini:ApiKey"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return "🎙️ Alô garotinho! Parece que o estúdio tá sem energia... A chave da API do Gemini não foi configurada!";
            }

            // Descobrir um modelo válido dinamicamente
            string modelName = "gemini-pro"; // fallback
            var listUrl = $"https://generativelanguage.googleapis.com/v1beta/models?key={apiKey.Trim()}";
            try
            {
                var listResponse = await _httpClient.GetAsync(listUrl);
                if (listResponse.IsSuccessStatusCode)
                {
                    var listJson = await listResponse.Content.ReadAsStringAsync();
                    using var listDoc = JsonDocument.Parse(listJson);
                    foreach (var model in listDoc.RootElement.GetProperty("models").EnumerateArray())
                    {
                        var methods = model.GetProperty("supportedGenerationMethods");
                        bool supportsGenerateContent = false;
                        foreach (var method in methods.EnumerateArray())
                        {
                            if (method.GetString() == "generateContent") supportsGenerateContent = true;
                        }
                        if (supportsGenerateContent)
                        {
                            var name = model.GetProperty("name").GetString();
                            if (name != null)
                            {
                                // "models/gemini-pro" -> precisamos apenas da parte depois da barra, mas a url usa o path inteiro
                                modelName = name.Replace("models/", "");
                                break;
                            }
                        }
                    }
                }
            }
            catch { /* Ignora e usa o fallback */ }

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={apiKey.Trim()}";

            var systemPrompt = @"Você é um comentarista de futebol brasileiro carismático, meio maluco e polêmico, no estilo de programas como 'Bate Bola' ou 'Donos da Bola'. 
Seu papel é comentar sobre os dados de um Bolão da Copa do Mundo de 2026.
Você receberá dados como: ranking atual, resultados reais de jogos passados, palpites de jogos passados e dados agregados de jogos futuros.
Regras IMPORTANTES:
1. NUNCA mencione o palpite específico de um jogador para um jogo que ainda não aconteceu. Você pode falar 'A maioria apostou no Brasil', mas nunca 'O João apostou 2 a 0'.
2. Para jogos que já aconteceram (onde tem RealHomeScore e RealAwayScore), você pode falar à vontade dos palpites furados, das cravadas absurdas ou de quem apostou numa zebra e se deu mal ou bem.
3. Seja informal, use gírias do futebol (ex: cravada, zebra, pipoqueiro, retranca, show de bola, garotinho, etc).
4. Responda em apenas um ou dois parágrafos, como se estivesse dando uma opinião ao vivo no estúdio.";

            var promptText = $"{systemPrompt}\n\nAqui estão os dados do bolão:\n{contextData}";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = promptText }
                        }
                    }
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, jsonContent);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                if (response.StatusCode == System.Net.HttpStatusCode.ServiceUnavailable)
                {
                    return "🎙️ Ih rapaz, o estúdio do Google tá lotado! (Servidor sobrecarregado). Dá uns segundinhos e clica de novo!";
                }
                return $"🎙️ Ih rapaz, deu ruim na transmissão! Tentamos o modelo {modelName}. Erro do Gemini: {response.StatusCode} - Detalhes: {errorBody}";
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var document = JsonDocument.Parse(responseString);
            
            try
            {
                var text = document.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text")
                    .GetString();
                return text ?? "🎙️ Fiquei sem palavras!";
            }
            catch
            {
                return "🎙️ Rapaz, engasguei com o microfone!";
            }
        }
    }
}
