
import { Match, Team, UserRanking, MatchStage } from './types';

// Helper to create teams
const createTeam = (
  id: string, 
  name: string, 
  code: string, 
  flagType: Team['flagType'], 
  colors: string[], 
  textColor: string = 'text-black'
): Team => ({
  id, name, code, flagType, colors, textColor
});

export const TBD_TEAM: Team = createTeam('TBD', 'A Definir', 'TBD', 'solid', ['#ccc'], 'text-gray-800');

export const TEAMS: Record<string, Team> = {
  USA: createTeam('USA', 'EUA', 'USA', 'usa', ['#3c3b6e', '#b22234', '#ffffff']),
  MEX: createTeam('MEX', 'México', 'MEX', 'v-tri', ['#006847', '#ffffff', '#ce1126']),
  CAN: createTeam('CAN', 'Canadá', 'CAN', 'v-bi', ['#ff0000', '#ffffff']),
  BRA: createTeam('BRA', 'Brasil', 'BRA', 'bra', ['#009c3b', '#ffdf00', '#002776']),
  ARG: createTeam('ARG', 'Argentina', 'ARG', 'h-tri', ['#74acdf', '#ffffff', '#74acdf']),
  URU: createTeam('URU', 'Uruguai', 'URU', 'h-tri', ['#ffffff', '#0038a8', '#ffffff']),
  COL: createTeam('COL', 'Colômbia', 'COL', 'h-tri', ['#fcd116', '#003893', '#ce1126']),
  ECU: createTeam('ECU', 'Equador', 'ECU', 'h-tri', ['#ffdd00', '#034ea2', '#ed1c24']),
  FRA: createTeam('FRA', 'França', 'FRA', 'v-tri', ['#002395', '#ffffff', '#ed2939']),
  ESP: createTeam('ESP', 'Espanha', 'ESP', 'h-tri', ['#aa151b', '#f1bf00', '#aa151b']),
  GER: createTeam('GER', 'Alemanha', 'GER', 'h-tri', ['#000000', '#dd0000', '#ffce00']),
  ENG: createTeam('ENG', 'Inglaterra', 'ENG', 'cross', ['#ffffff', '#cf081f']),
  POR: createTeam('POR', 'Portugal', 'POR', 'v-bi', ['#006600', '#ff0000']),
  ITA: createTeam('ITA', 'Itália', 'ITA', 'v-tri', ['#009246', '#ffffff', '#ce2b37']),
  NED: createTeam('NED', 'Holanda', 'NED', 'h-tri', ['#ae1c28', '#ffffff', '#21468b']),
  BEL: createTeam('BEL', 'Bélgica', 'BEL', 'v-tri', ['#000000', '#fdd516', '#ef3340']),
  CRO: createTeam('CRO', 'Croácia', 'CRO', 'h-tri', ['#ff0000', '#ffffff', '#0000ff']),
  SUI: createTeam('SUI', 'Suíça', 'SUI', 'cross', ['#d52b1e', '#ffffff']),
  DEN: createTeam('DEN', 'Dinamarca', 'DEN', 'cross', ['#c60c30', '#ffffff']),
  SWE: createTeam('SWE', 'Suécia', 'SWE', 'cross', ['#006aa7', '#fecc00']),
  POL: createTeam('POL', 'Polônia', 'POL', 'h-bi', ['#ffffff', '#dc143c']),
  MAR: createTeam('MAR', 'Marrocos', 'MAR', 'solid', ['#c1272d'], 'text-white'),
  SEN: createTeam('SEN', 'Senegal', 'SEN', 'v-tri', ['#00853f', '#fdef42', '#e31b23']),
  EGY: createTeam('EGY', 'Egito', 'EGY', 'h-tri', ['#ce1126', '#ffffff', '#000000']),
  NGA: createTeam('NGA', 'Nigéria', 'NGA', 'v-tri', ['#008751', '#ffffff', '#008751']),
  CMR: createTeam('CMR', 'Camarões', 'CMR', 'v-tri', ['#007a5e', '#ce1126', '#fcd116']),
  ALG: createTeam('ALG', 'Argélia', 'ALG', 'v-bi', ['#006233', '#ffffff']),
  JPN: createTeam('JPN', 'Japão', 'JPN', 'circle', ['#ffffff', '#bc002d']),
  KOR: createTeam('KOR', 'Coreia Sul', 'KOR', 'circle', ['#ffffff', '#cd2e3a']),
  IRN: createTeam('IRN', 'Irã', 'IRN', 'h-tri', ['#239f40', '#ffffff', '#da0000']),
  KSA: createTeam('KSA', 'Arábia S.', 'KSA', 'solid', ['#006c35'], 'text-white'),
  AUS: createTeam('AUS', 'Austrália', 'AUS', 'solid', ['#ffcd00']),
  CRC: createTeam('CRC', 'Costa Rica', 'CRC', 'h-tri', ['#002b7f', '#ce1126', '#002b7f']),
  PAN: createTeam('PAN', 'Panamá', 'PAN', 'cross', ['#ffffff', '#da121a']),
  NZL: createTeam('NZL', 'Nova Zel.', 'NZL', 'usa', ['#00247d', '#cc142b', '#ffffff']),
  UKR: createTeam('UKR', 'Ucrânia', 'UKR', 'h-bi', ['#0057b7', '#ffd700']),
  AUT: createTeam('AUT', 'Áustria', 'AUT', 'h-tri', ['#ed2939', '#ffffff', '#ed2939']),
  HUN: createTeam('HUN', 'Hungria', 'HUN', 'h-tri', ['#ce2939', '#ffffff', '#477050']),
  SCO: createTeam('SCO', 'Escócia', 'SCO', 'cross', ['#005eb8', '#ffffff']),
  TUR: createTeam('TUR', 'Turquia', 'TUR', 'solid', ['#e30a17'], 'text-white'),
  CHI: createTeam('CHI', 'Chile', 'CHI', 'h-bi', ['#ffffff', '#da291c']),
  PAR: createTeam('PAR', 'Paraguai', 'PAR', 'h-tri', ['#d52b1e', '#ffffff', '#0038a8']),
  PER: createTeam('PER', 'Peru', 'PER', 'v-tri', ['#d91023', '#ffffff', '#d91023']),
  CIV: createTeam('CIV', 'Costa Marfim', 'CIV', 'v-tri', ['#f77f00', '#ffffff', '#009e60']),
  GHA: createTeam('GHA', 'Gana', 'GHA', 'h-tri', ['#ce1126', '#fcd116', '#006b3f']),
  RSA: createTeam('RSA', 'África Sul', 'RSA', 'h-tri', ['#e03c31', '#007749', '#001489']),
  QAT: createTeam('QAT', 'Catar', 'QAT', 'v-bi', ['#ffffff', '#8d1b3d']),
  IRQ: createTeam('IRQ', 'Iraque', 'IRQ', 'h-tri', ['#ce1126', '#ffffff', '#000000']),
};

export const GROUP_DEFINITIONS: Record<string, Team[]> = {
  'A': [TEAMS.MEX, TEAMS.CRO, TEAMS.CMR, TEAMS.KSA],
  'B': [TEAMS.USA, TEAMS.ENG, TEAMS.SCO, TEAMS.IRN],
  'C': [TEAMS.ARG, TEAMS.SWE, TEAMS.NGA, TEAMS.AUS],
  'D': [TEAMS.FRA, TEAMS.URU, TEAMS.KOR, TEAMS.AUT],
  'E': [TEAMS.ESP, TEAMS.COL, TEAMS.POL, TEAMS.CRC],
  'F': [TEAMS.BRA, TEAMS.SUI, TEAMS.ALG, TEAMS.QAT],
  'G': [TEAMS.BEL, TEAMS.EGY, TEAMS.IRN, TEAMS.NZL], 
  'H': [TEAMS.GER, TEAMS.CHI, TEAMS.GHA, TEAMS.IRQ],
  'I': [TEAMS.POR, TEAMS.NED, TEAMS.CIV, TEAMS.PAN],
  'J': [TEAMS.ITA, TEAMS.ECU, TEAMS.UKR, TEAMS.RSA],
  'K': [TEAMS.CAN, TEAMS.DEN, TEAMS.PAR, TEAMS.TUR],
  'L': [TEAMS.JPN, TEAMS.SEN, TEAMS.PER, TEAMS.HUN] 
};

export const SIMULATED_TODAY = '12/06';

const generateGroupMatches = (): Match[] => {
  const matches: Match[] = [];
  const groups = Object.keys(GROUP_DEFINITIONS);
  
  groups.forEach((groupLetter) => {
    const teams = GROUP_DEFINITIONS[groupLetter];
    
    // Distribuindo datas
    let baseDate = '10/06'; // Passado
    if (['C', 'D'].includes(groupLetter)) baseDate = '11/06'; // Passado próximo
    if (['E', 'F'].includes(groupLetter)) baseDate = '12/06'; // Hoje
    if (['G', 'H'].includes(groupLetter)) baseDate = '13/06'; // Amanhã
    if (groupLetter >= 'I') baseDate = '14/06'; // Futuro

    const pairings = [
      { h: teams[0], a: teams[1], d: baseDate, t: '13:00' },
      { h: teams[2], a: teams[3], d: baseDate, t: '16:00' },
      { h: teams[0], a: teams[2], d: '17/06', t: '14:00' },
      { h: teams[1], a: teams[3], d: '17/06', t: '17:00' },
      { h: teams[0], a: teams[3], d: '22/06', t: '15:00' },
      { h: teams[1], a: teams[2], d: '22/06', t: '18:00' },
    ];
    
    pairings.forEach((pair, idx) => {
      const isPast = pair.d === '10/06' || pair.d === '11/06';
      
      matches.push({
        id: `m-${groupLetter}-${idx + 1}`,
        homeTeam: pair.h,
        awayTeam: pair.a,
        date: `${pair.d}/26`,
        time: pair.t,
        group: `Grupo ${groupLetter}`,
        stadium: 'Estádio Copa',
        stage: 'GROUPS',
        isLocked: isPast,
        realHomeScore: isPast ? (idx % 2 === 0 ? 2 : 1) : undefined,
        realAwayScore: isPast ? (idx % 2 === 0 ? 0 : 1) : undefined
      });
    });
  });
  return matches;
};

const generateKnockoutMatches = (stage: MatchStage, count: number, labelPrefix: string, date: string): Match[] => {
    return Array.from({ length: count }).map((_, i) => ({
        id: `${stage.toLowerCase()}-${i + 1}`,
        homeTeam: TBD_TEAM,
        awayTeam: TBD_TEAM,
        date: date,
        time: 'TBD',
        group: labelPrefix,
        stadium: 'Estádio TBD',
        stage: stage,
        isLocked: true,
        placeholderLabel: `${labelPrefix} ${i + 1}`,
        realHomeScore: undefined,
        realAwayScore: undefined
    }));
};

export const MOCK_MATCHES: Match[] = [
    ...generateGroupMatches(),
    ...generateKnockoutMatches('R32', 16, '2ª Fase', '24/06/26'),
    ...generateKnockoutMatches('R16', 8, 'Oitavas', '29/06/26'),
    ...generateKnockoutMatches('QF', 4, 'Quartas', '04/07/26'),
    ...generateKnockoutMatches('SF', 2, 'Semifinal', '08/07/26'),
    ...generateKnockoutMatches('FINAL', 1, 'Final', '19/07/26'),
];

export const MOCK_LEADERBOARD: UserRanking[] = [
  { id: 'u1', name: 'PixelKing', points: 150, avatar: '10' },
  { id: 'u2', name: 'RetroGoal', points: 125, avatar: '20' },
  { id: 'u3', name: 'Ronaldinho8Bit', points: 115, avatar: 'user-ronaldo' },
  { id: 'u4', name: '8BitStriker', points: 110, avatar: '30' },
  { id: 'u5', name: 'CopaMaster', points: 95, avatar: '40' },
  { id: 'u6', name: 'ZicoBot', points: 80, avatar: '50' },
];