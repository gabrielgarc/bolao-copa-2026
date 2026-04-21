namespace Bolao.Copa2026.API.Helpers
{
    public static class TeamTranslator
    {
        private static readonly Dictionary<string, string> _translations = new(StringComparer.OrdinalIgnoreCase)
        {
            {"Algeria", "Argélia"},
            {"Argentina", "Argentina"},
            {"Australia", "Austrália"},
            {"Austria", "Áustria"},
            {"Belgium", "Bélgica"},
            {"Bosnia-Herzegovina", "Bósnia e Herzegovina"},
            {"Brazil", "Brasil"},
            {"Canada", "Canadá"},
            {"Cape Verde Islands", "Cabo Verde"},
            {"Colombia", "Colômbia"},
            {"Congo DR", "RD Congo"},
            {"Croatia", "Croácia"},
            {"Curaçao", "Curaçao"},
            {"Czechia", "República Tcheca"},
            {"Ecuador", "Equador"},
            {"Egypt", "Egito"},
            {"England", "Inglaterra"},
            {"France", "França"},
            {"Germany", "Alemanha"},
            {"Ghana", "Gana"},
            {"Haiti", "Haiti"},
            {"Iran", "Irã"},
            {"Iraq", "Iraque"},
            {"Ivory Coast", "Costa do Marfim"},
            {"Japan", "Japão"},
            {"Jordan", "Jordânia"},
            {"Mexico", "México"},
            {"Morocco", "Marrocos"},
            {"Netherlands", "Holanda"},
            {"New Zealand", "Nova Zelândia"},
            {"Norway", "Noruega"},
            {"Panama", "Panamá"},
            {"Paraguay", "Paraguai"},
            {"Portugal", "Portugal"},
            {"Qatar", "Catar"},
            {"Saudi Arabia", "Arábia Saudita"},
            {"Scotland", "Escócia"},
            {"Senegal", "Senegal"},
            {"South Africa", "África do Sul"},
            {"South Korea", "Coreia do Sul"},
            {"Spain", "Espanha"},
            {"Sweden", "Suécia"},
            {"Switzerland", "Suíça"},
            {"Tunisia", "Tunísia"},
            {"Turkey", "Turquia"},
            {"United States", "Estados Unidos"},
            {"Unknown", "A Definir"},
            {"Uruguay", "Uruguai"},
            {"Uzbekistan", "Uzbequistão"}
        };

        public static string Translate(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return name;
            return _translations.TryGetValue(name, out var pt) ? pt : name;
        }
    }
}
