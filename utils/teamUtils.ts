export const getMobileTeamName = (name: string): string => {
  const map: Record<string, string> = {
    "República Tcheca": "Rep. Tcheca",
    "Estados Unidos": "EUA",
    "Costa do Marfim": "Cos. Marfim",
    "Coreia do Sul": "Coreia S.",
    "Bósnia e Herzegovina": "Bósnia",
    "Bosnia e Herzegovina": "Bósnia",
    "Bosnia e Hezergovina": "Bósnia",
    "Arábia Saudita": "Ar. Saudita",
    "África do Sul": "Áfr. do Sul",
    "Africa do Sul": "Áfr. do Sul"
  };
  return map[name] || name;
};
