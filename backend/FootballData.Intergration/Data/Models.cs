using System.Text.Json.Serialization;

namespace FootballData.Intergration.Data
{
   // Classe Raiz
    public class CompetitionResponse
    {
        [JsonPropertyName("count")]
        public int? Count { get; set; }

        [JsonPropertyName("filters")]
        public Filters Filters { get; set; }

        [JsonPropertyName("competition")]
        public Competition Competition { get; set; }

        [JsonPropertyName("season")]
        public Season Season { get; set; }

        [JsonPropertyName("teams")]
        public List<Team> Teams { get; set; }
    }

    public class Filters
    {
        [JsonPropertyName("season")]
        public string Season { get; set; }
    }

    public class Competition
    {
        [JsonPropertyName("id")]
        public int? Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("code")]
        public string Code { get; set; }

        [JsonPropertyName("type")]
        public string Type { get; set; }

        [JsonPropertyName("emblem")]
        public string Emblem { get; set; }
    }

    public class Season
    {
        [JsonPropertyName("id")]
        public int? Id { get; set; }

        [JsonPropertyName("startDate")]
        public string StartDate { get; set; } // Pode ser DateTime, mas string é mais seguro para YYYY-MM-DD

        [JsonPropertyName("endDate")]
        public string EndDate { get; set; }

        [JsonPropertyName("currentMatchday")]
        public int? CurrentMatchday { get; set; }

        [JsonPropertyName("winner")]
        public object Winner { get; set; } // Null no JSON, seria um objeto Team se houvesse vencedor
    }

    public class Team
    {
        [JsonPropertyName("area")]
        public Area Area { get; set; }

        [JsonPropertyName("id")]
        public int? Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("shortName")]
        public string ShortName { get; set; }

        [JsonPropertyName("tla")]
        public string Tla { get; set; }

        [JsonPropertyName("crest")]
        public string Crest { get; set; }

        [JsonPropertyName("address")]
        public string Address { get; set; }

        [JsonPropertyName("website")]
        public string Website { get; set; }

        [JsonPropertyName("founded")]
        public int? Founded { get; set; }

        [JsonPropertyName("clubColors")]
        public string ClubColors { get; set; }

        [JsonPropertyName("venue")]
        public string Venue { get; set; }

        [JsonPropertyName("runningCompetitions")]
        public List<Competition> RunningCompetitions { get; set; }

        [JsonPropertyName("coach")]
        public Coach Coach { get; set; }

        // Squad e Staff estão vazios no JSON, mantive como List<object> por segurança
        [JsonPropertyName("squad")]
        public List<object> Squad { get; set; }

        [JsonPropertyName("staff")]
        public List<object> Staff { get; set; }

        [JsonPropertyName("lastUpdated")]
        public DateTime LastUpdated { get; set; }
    }

    public class Area
    {
        [JsonPropertyName("id")]
        public int? Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("code")]
        public string Code { get; set; }

        [JsonPropertyName("flag")]
        public string Flag { get; set; }
    }

    public class Coach
    {
        [JsonPropertyName("id")]
        public int? Id { get; set; }

        [JsonPropertyName("firstName")]
        public string FirstName { get; set; }

        [JsonPropertyName("lastName")]
        public string LastName { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("dateOfBirth")]
        public string DateOfBirth { get; set; }

        [JsonPropertyName("nationality")]
        public string Nationality { get; set; }

        [JsonPropertyName("contract")]
        public Contract Contract { get; set; }
    }

    public class Contract
    {
        [JsonPropertyName("start")]
        public string Start { get; set; }

        [JsonPropertyName("until")]
        public string Until { get; set; }
    }

    // --- Matches API Models ---
    public class MatchesResponse
    {
        [JsonPropertyName("filters")]
        public MatchesFilters Filters { get; set; }

        [JsonPropertyName("resultSet")]
        public ResultSet ResultSet { get; set; }

        [JsonPropertyName("competition")]
        public Competition Competition { get; set; } // Re-using existing Competition class

        [JsonPropertyName("matches")]
        public List<Match> Matches { get; set; }
    }

    public class MatchesFilters
    {
        [JsonPropertyName("season")]
        public string Season { get; set; }
    }

    public class ResultSet
    {
        [JsonPropertyName("count")]
        public int? Count { get; set; }

        [JsonPropertyName("first")]
        public string First { get; set; }

        [JsonPropertyName("last")]
        public string Last { get; set; }

        [JsonPropertyName("played")]
        public int? Played { get; set; }
    }

    public class Match
    {
        [JsonPropertyName("area")]
        public Area Area { get; set; } // Re-using existing Area class

        [JsonPropertyName("competition")]
        public Competition Competition { get; set; } // Re-using existing Competition class

        [JsonPropertyName("season")]
        public Season Season { get; set; } // Re-using existing Season class

        [JsonPropertyName("id")]
        public int? Id { get; set; }

        [JsonPropertyName("utcDate")]
        public DateTime UtcDate { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; }

        [JsonPropertyName("matchday")]
        public int? Matchday { get; set; }

        [JsonPropertyName("stage")]
        public string Stage { get; set; }

        [JsonPropertyName("group")]
        public string Group { get; set; }

        [JsonPropertyName("lastUpdated")]
        public DateTime? LastUpdated { get; set; }

        [JsonPropertyName("homeTeam")]
        public MatchTeam HomeTeam { get; set; }

        [JsonPropertyName("awayTeam")]
        public MatchTeam AwayTeam { get; set; }

        [JsonPropertyName("score")]
        public Score Score { get; set; }

        [JsonPropertyName("odds")]
        public Odds Odds { get; set; }

        [JsonPropertyName("referees")]
        public List<Referee> Referees { get; set; }
    }

    public class MatchTeam
    {
        [JsonPropertyName("id")]
        public int? Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("shortName")]
        public string ShortName { get; set; }

        [JsonPropertyName("tla")]
        public string Tla { get; set; }

        [JsonPropertyName("crest")]
        public string Crest { get; set; }
    }

    public class Score
    {
        [JsonPropertyName("winner")]
        public string Winner { get; set; }

        [JsonPropertyName("duration")]
        public string Duration { get; set; }

        [JsonPropertyName("fullTime")]
        public FullTime FullTime { get; set; }

        [JsonPropertyName("halfTime")]
        public HalfTime HalfTime { get; set; }
    }

    public class FullTime
    {
        [JsonPropertyName("home")]
        public int? Home { get; set; }

        [JsonPropertyName("away")]
        public int? Away { get; set; }
    }

    public class HalfTime
    {
        [JsonPropertyName("home")]
        public int? Home { get; set; }

        [JsonPropertyName("away")]
        public int? Away { get; set; }
    }

    public class Odds
    {
        [JsonPropertyName("msg")]
        public string Msg { get; set; }
    }

    public class Referee
    {
        [JsonPropertyName("id")]
        public int? Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("type")]
        public string Type { get; set; }

        [JsonPropertyName("nationality")]
        public string Nationality { get; set; }
    }
}