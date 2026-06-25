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
                throw new InvalidOperationException("API Key do Gemini não configurada.");
            }

            // Descobrir um modelo válido dinamicamente, priorizando os mais avançados
            string modelName = "gemini-1.5-pro"; // fallback melhorado
            var listUrl = $"https://generativelanguage.googleapis.com/v1beta/models?key={apiKey.Trim()}";
            try
            {
                var listResponse = await _httpClient.GetAsync(listUrl);
                if (listResponse.IsSuccessStatusCode)
                {
                    var listJson = await listResponse.Content.ReadAsStringAsync();
                    using var listDoc = JsonDocument.Parse(listJson);
                    
                    var availableModels = new List<string>();

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
                                availableModels.Add(name.Replace("models/", ""));
                            }
                        }
                    }

                    if (availableModels.Any())
                    {
                        // Prioridade de escolha: 1.5 Pro > 1.5 Pro Latest > 1.5 Flash > 1.0 Pro / genérico
                        if (availableModels.Contains("gemini-1.5-pro")) modelName = "gemini-1.5-pro";
                        else if (availableModels.Contains("gemini-1.5-pro-latest")) modelName = "gemini-1.5-pro-latest";
                        else if (availableModels.Contains("gemini-1.5-flash")) modelName = "gemini-1.5-flash";
                        else if (availableModels.Contains("gemini-pro")) modelName = "gemini-pro";
                        else modelName = availableModels.First();
                    }
                }
            }
            catch { /* Ignora e usa o fallback */ }

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={apiKey.Trim()}";

            var systemPrompt = @"Você é um comentarista de futebol brasileiro carismático, meio maluco e polêmico, no estilo de programas como 'Bate Bola' ou 'Donos da Bola'. 
Seu papel é comentar sobre os dados de um Bolão da Copa do Mundo de 2026.
Você receberá dados como: ranking atual, resultados reais de jogos passados, palpites de jogos passados, e comentários de IA feitos anteriormente.

Regras IMPORTANTES:
1. NUNCA mencione o palpite específico de um jogador para um jogo que ainda não aconteceu. Comente apenas jogos que já terminaram.
2. Seja DINÂMICO, mas use 2 parágrafos CURTOS. Vá direto ao ponto e não fique enrolando em um mesmo assunto.
3. Foque muito em RESULTADOS ABSURDOS: dê destaque para zebras, placares elásticos ou inesperados. Detone quem errou feio (fez palpite pífio) e elogie quem cravou resultados difíceis.
4. VARIE AS PESSOAS CITADAS. Não fale sempre do líder ou do lanterna. Busque histórias no meio da tabela ou apostas peculiares da rodada atual.
5. SOBRE O RANKING: NÃO comente sobre a classificação se nada mudou muito de um dia para o outro. Fale do ranking APENAS se houver uma reviravolta grande (alguém disparou ou afundou).
6. MANERE NOS BORDÕES. Seja informal e natural, mas não jogue frases feitas do nada. Escolha no máximo 1 gíria ou bordão por comentário e aplique no contexto certo (ex: cravada, zebra, pipoqueiro, pífio, na gaveta, cê tá de brincadeira).
7. Tente variar o tema do comentário em relação ao comentário anterior. Use CAPS-LOCK ocasionalmente para enfatizar indignação ou surpresa. Use o nome dos jogadores.
8. NOMES DOS TIMES: TRADUZA SEMPRE os nomes das seleções para o PORTUGUÊS do Brasil (ex: 'United States' vira 'Estados Unidos', 'Spain' vira 'Espanha'). NUNCA use o nome em inglês.
9. NOMES DOS JOGADORES: Ao citar os apostadores, use APENAS o primeiro nome ou no máximo o primeiro e o último nome (ex: em vez de 'Gabriel de Moraes Garcia', escreva apenas 'Gabriel' ou 'Gabriel Garcia').
10. SEM MARKDOWN: NUNCA use formatação markdown como asteriscos (**nome**) para colocar palavras em negrito. O sistema não suporta markdown, então escreva APENAS TEXTO PURO.

Algumas gírias/bordões como inspiração (use com moderação extrema, apenas se encaixar com perfeição):
- Para detonar: Pipoqueiro, Perna de pau, Mão de alface, Pífio, Patético, Ridículo, Inimigo da bola, Entregou a paçoca.
- Para elogiar: Cravada, Na gaveta, Pintura, Amassar, Tirar doce de criança.
- Jogo/Tática: Retranca, Zebra, Deu lógica, Dividida de foice.
- Indignação: Cê tá de brincadeira!, Fanfarrão, Baita de um...
";

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
                throw new HttpRequestException($"Erro na API do Gemini: {response.StatusCode} - Detalhes: {errorBody}");
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
                
                if (string.IsNullOrWhiteSpace(text))
                    throw new InvalidOperationException("Gemini retornou texto vazio ou nulo.");
                    
                return text;
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Falha ao processar a resposta do Gemini.", ex);
            }
        }
    }
}
