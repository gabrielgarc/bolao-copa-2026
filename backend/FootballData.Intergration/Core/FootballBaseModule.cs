using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FootballData.Intergration.Core
{
    public abstract class FootballBaseModule
    {
        protected readonly HttpClient _httpClient;
        protected readonly JsonSerializerOptions _jsonOptions;

        protected FootballBaseModule(HttpClient httpClient, IOptions<FootballApiSettings> settings)
        {
            _httpClient = httpClient;
            
            // Configura a Base URL e o Token no Header
            _httpClient.BaseAddress = new Uri(settings.Value.BaseUrl);
            _httpClient.DefaultRequestHeaders.Add("X-Auth-Token", settings.Value.Token);

            // Configuração global de JSON (opcional, já que usamos atributos na model, mas boa prática)
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
        }

        protected async Task<T?> GetAsync<T>(string endpoint)
        {
            try
            {
                // Faz a chamada GET
                var response = await _httpClient.GetAsync(endpoint);

                // Lança exceção se não for 200 OK (você pode tratar isso de forma mais granular depois)
                response.EnsureSuccessStatusCode();

                // Deserializa usando System.Text.Json
                return await response.Content.ReadFromJsonAsync<T>(_jsonOptions);
            }
            catch (HttpRequestException ex)
            {
                // Logar erro aqui
                Console.WriteLine($"Erro na requisição: {ex.Message}");
                throw;
            }
        }
    }
}
