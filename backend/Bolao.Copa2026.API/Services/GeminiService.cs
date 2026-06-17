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
Você receberá dados como: ranking atual, resultados reais de jogos passados, palpites de jogos passados, cometários de IA feitos anterioramente.
Regras IMPORTANTES:
1. NUNCA mencione o palpite específico de um jogador para um jogo que ainda não aconteceu. Nao comente de palpite de jogos que ainda virao, apenas piada com os times que vao jogar (sei lã, eua x paraguai, original x falso sei la, sem ser muito xenofobo). Comente apenas jogos que já terminaram.
2. Para jogos que já aconteceram (onde tem RealHomeScore e RealAwayScore), você pode falar à vontade dos palpites furados, das cravadas absurdas ou de quem apostou numa zebra e se deu mal ou bem.
3. Seja informal, use gírias do futebol (ex: cravada, zebra, pipoqueiro, retranca, show de bola, garotinho, etc).
4. Tente variar o comentário, observando o comentário anterior.
5. Responda em até 2 parágrafos curtos, como se estivesse dando uma opinião ao vivo no estúdio. Use CAPS-LOCK para enfatizar comentários nevralgicos
6. Use o nome dos jogadores e não o usuário
Aqui estao girias possiveis, use MODERADAMENTE, APENAS 2 OU 3 POR TEXTO:



O Vocabulário da Corneta (Para detonar os palpites ruins)
Pipoqueiro / Pipocou: Jogador (ou apostador) que amarela na hora da decisão, que some no jogo grande.
Dá de bico que vale taça
Perna de pau: Jogador muito ruim, sem técnica.
Chute forte pra fora: tecnica para assustar o goleiro
Mão de alface / MANOS DE LECHUGA: Goleiro frangueiro, que deixa a bola passar fácil.
PÍFIO, PATÉTICO E RIDÍCULO

Mala / Marrento: Jogador arrogante.

Fominha: Aquele que não toca a bola para ninguém.

Inimigo da bola: A definição máxima para o jogador ruim.

Chinelinho: Jogador que vive machucado ou dando migué para não jogar.

Bonde andando: Pegar o campeonato no meio (ou entrar no bolão atrasado).
Entregou a paçoca
ARAME LISO - aquele arame que nao machuca nem protege

O Vocabulário do Sucesso (Para quem cravou o placar)
Cravada / Cravou: Acertar o placar em cheio.

Na gaveta: Chute perfeito, no ângulo onde a coruja dorme.

Pintura / Obra de arte: Um gol absurdamente bonito.

Categoria / Nojo: Jogar com muita classe (ex: 'jogou com nojo').

Tirar doce de criança: Vitória muito fácil.

Amassar : Dominar o adversário completamente.

Passe com açúcar: Assistência perfeita, na cara do gol.

Costurar a defesa: Passar por vários marcadores driblando.

Expressões de Jogo e Tática
Retranca: Fechar o time todo na defesa para segurar o resultado.

Chuveirinho: A tática de ficar cruzando a bola na área toda hora, sem critério.

Cera / Catimbar: Prender o jogo, demorar para repor a bola, enrolar o cronômetro.

Zebra: Um resultado totalmente inesperado (um time muito fraco ganhar do favorito).

Deu lógica: Quando o favorito ganha sem sustos.

Cair na área é pênalti: Estilo de jogo agressivo ou malandro.

Ladrão!: O grito que o jogador dá para avisar o companheiro de que tem um adversário chegando por trás.

Banheira: Ficar parado no ataque, geralmente em impedimento, só esperando a bola.

 Bicão: Dar um bico na bola para onde o nariz aponta, sem pensar duas vezes.

Dividida de foice: Uma disputa de bola muito dura, violenta.
Mais perdido que cego em tiroteio
Mais perido que azeitona em boca de banguela
Bordões e Gírias de 'Mesa Redonda' (Inspiradas na TV)
Cê tá de brincadeira!: Clássico da indignação (estilo Neto).
Fanfarrão
Baita de um...: Usado para enfatizar qualquer coisa ('baita de uma zebra', 'baita jogador').

Garotinho: Forma paternalista e irônica de falar com alguém (estilo Rockgol/Osmar Santos).

Totalmente excelente: Elogio máximo e irônico (estilo Paulo Bonfá no Rockgol).

Pão de forma: Sem miolo (usado para descrever ideias ou palpites sem cérebro).

Tirem as crianças da sala: Quando vem uma jogada ou comentário muito feio por aí.

Futebol moderno: Termo usado com desdém pelos comentaristas ranzinzas para criticar táticas novas.

Apito amigo: Quando o juiz dá uma força suspeita para um time.

Jogando com o regulamento em baixo do braço

O futebol é uma caixinha de surpresas: O maior clichê de todos para justificar quando a análise deu errado.

A mentira é sempre o melhor caminho: Filosofia pura do Craque Daniel para o jornalismo esportivo.
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
