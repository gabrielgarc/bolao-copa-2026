
import React, { useState, useMemo } from 'react';
import { Match, MatchStage, TeamStats } from '../types';
import { PixelCard, PixelInput, PixelFlag, PixelButton } from './PixelComponents';
import { GROUP_DEFINITIONS } from '../constants';
import { StandingsTable } from './StandingsTable';

interface SpreadsheetViewProps {
  matches: Match[];
  predictions: Record<string, { home: string; away: string }>;
  onPredict: (matchId: string, home: string, away: string) => Promise<void>;
  currentStage: MatchStage;
  onStageChange: (stage: MatchStage) => void;
  isOfficial?: boolean;
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  matches,
  predictions,
  onPredict,
  currentStage,
  onStageChange,
  isOfficial = false
}) => {
  const [localPredictions, setLocalPredictions] = useState<Record<string, { home: string; away: string }>>(predictions);
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'error' | 'saved'>>({});

  // Garante que se o App carregar os dados atrasado, a tela puxe!
  React.useEffect(() => {
    setLocalPredictions(predictions);
  }, [predictions]);

  const stages: { id: MatchStage, label: string }[] = [
    { id: 'GROUPS', label: 'Grupos' },
    { id: 'R32', label: '2ª Fase' },
    { id: 'R16', label: 'Oitavas' },
    { id: 'QF', label: 'Quartas' },
    { id: 'SF', label: 'Semi' },
    { id: 'FINAL', label: 'Final' },
  ];

  const handleInputChange = async (matchId: string, side: 'home' | 'away', value: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || match.isLocked || isMatchStarted(match)) return;

    if (value === '' || (parseInt(value) >= 0 && value.length <= 2)) {
      const current = localPredictions[matchId] || { home: '', away: '' };
      const next = { ...current, [side]: value };

      setLocalPredictions({
        ...localPredictions,
        [matchId]: next
      });

      if ((next.home !== '' && next.away !== '') || (next.home === '' && next.away === '')) {
        setSaveStatus(prev => ({ ...prev, [matchId]: 'saving' }));
        try {
            await onPredict(matchId, next.home, next.away);
            setSaveStatus(prev => ({ ...prev, [matchId]: 'saved' }));
            setTimeout(() => {
                setSaveStatus(prev => {
                    const current = { ...prev };
                    if (current[matchId] === 'saved') delete current[matchId];
                    return current;
                });
            }, 2000);
        } catch {
            setSaveStatus(prev => ({ ...prev, [matchId]: 'error' }));
        }
      }
    }
  };

  const isMatchStarted = (match: Match): boolean => {
    if (!match.date || !match.time) return false;
    try {
      let year = 2026, month = 1, day = 1;
      if (match.date.includes('-')) {
        const parts = match.date.split('-');
        year = parseInt(parts[0]);
        month = parseInt(parts[1]);
        day = parseInt(parts[2]);
      } else {
        const parts = match.date.split('/');
        day = parseInt(parts[0]);
        month = parseInt(parts[1]);
      }
      
      const timeParts = match.time.split(':');
      const hour = parseInt(timeParts[0]);
      const min = parseInt(timeParts[1]);
      
      const matchDate = new Date(year, month - 1, day, hour, min);
      // Validacao final se o `matchDate` foi contruido corretamente
      if (isNaN(matchDate.getTime())) return false;
      return new Date() >= matchDate;
    } catch {
      return false;
    }
  };

  const filteredMatches = matches.filter(m => m.stage === currentStage);

  // --- LOGIC FOR DESKTOP (Grouped) ---
  const matchesByGroup = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    filteredMatches.forEach(m => {
      if (!groups[m.group]) groups[m.group] = [];
      groups[m.group].push(m);
    });
    return groups;
  }, [filteredMatches]);

  const sortedGroupEntries = useMemo(() => {
    return (Object.entries(matchesByGroup) as [string, Match[]][]).sort((a, b) => a[0].localeCompare(b[0]));
  }, [matchesByGroup]);

  // --- CALCULATION LOGIC ---
  const calculateGroupStandings = (groupName: string, groupMatches: Match[]) => {
    const groupLetter = groupName.replace('Grupo ', '');
    const statsMap: Record<string, TeamStats> = {};

    groupMatches.forEach(match => {
      if (!statsMap[match.homeTeam.id]) {
        statsMap[match.homeTeam.id] = {
          teamId: match.homeTeam.id, team: match.homeTeam, points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalDiff: 0, goalsFor: 0, goalsAgainst: 0
        };
      }
      if (!statsMap[match.awayTeam.id]) {
        statsMap[match.awayTeam.id] = {
          teamId: match.awayTeam.id, team: match.awayTeam, points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalDiff: 0, goalsFor: 0, goalsAgainst: 0
        };
      }
    });

    groupMatches.forEach(match => {
      const pred = localPredictions[match.id];
      if (pred && pred.home !== '' && pred.away !== '') {
        const hScore = parseInt(pred.home);
        const aScore = parseInt(pred.away);

        if (!isNaN(hScore) && !isNaN(aScore)) {
          if (statsMap[match.homeTeam.id]) {
            statsMap[match.homeTeam.id].played += 1;
            statsMap[match.homeTeam.id].goalsFor += hScore;
            statsMap[match.homeTeam.id].goalsAgainst += aScore;
            statsMap[match.homeTeam.id].goalDiff += (hScore - aScore);
          }
          if (statsMap[match.awayTeam.id]) {
            statsMap[match.awayTeam.id].played += 1;
            statsMap[match.awayTeam.id].goalsFor += aScore;
            statsMap[match.awayTeam.id].goalsAgainst += hScore;
            statsMap[match.awayTeam.id].goalDiff += (aScore - hScore);
          }

          if (hScore > aScore) {
            if (statsMap[match.homeTeam.id]) { statsMap[match.homeTeam.id].points += 3; statsMap[match.homeTeam.id].won += 1; }
            if (statsMap[match.awayTeam.id]) { statsMap[match.awayTeam.id].lost += 1; }
          } else if (aScore > hScore) {
            if (statsMap[match.awayTeam.id]) { statsMap[match.awayTeam.id].points += 3; statsMap[match.awayTeam.id].won += 1; }
            if (statsMap[match.homeTeam.id]) { statsMap[match.homeTeam.id].lost += 1; }
          } else {
            if (statsMap[match.homeTeam.id]) { statsMap[match.homeTeam.id].points += 1; statsMap[match.homeTeam.id].drawn += 1; }
            if (statsMap[match.awayTeam.id]) { statsMap[match.awayTeam.id].points += 1; statsMap[match.awayTeam.id].drawn += 1; }
          }
        }
      }
    });

    return Object.values(statsMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      return b.goalsFor - a.goalsFor;
    });
  };

  // Helper render row for Match (Reused logic ideally, but separated for strict layout control)
  const renderMatchRow = (match: Match, showGroup: boolean = false) => {
    const pred = localPredictions[match.id] || { home: '', away: '' };
    const started = isMatchStarted(match);
    const hasRealScore = match.realHomeScore !== undefined && match.realHomeScore !== null;
    const isLocked = match.isLocked || hasRealScore || started;
    const status = saveStatus[match.id];

    return (
      <tr key={match.id} className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${isLocked ? 'bg-gray-50' : ''}`}>
        <td className="p-1 md:p-2 border-r border-gray-200 text-center leading-none">
          <div className="text-gray-800 scale-90 md:scale-100">{match.date.split('/')[0]}{match.date.split('/')[1]}</div>
          {showGroup && <div className="text-[5px] text-blue-600 font-bold uppercase">{match.group.replace('Grupo ', 'GP ')}</div>}
          <div className="text-[5px] md:text-[8px] text-gray-400 uppercase mt-0.5">{match.time}</div>
        </td>
        <td className="p-0.5 md:p-1 border-r border-gray-200 text-right overflow-hidden">
          <div className="flex items-center justify-end gap-1">
            <span className={`uppercase truncate ${isLocked ? 'text-gray-400' : 'text-black'}`}>
              <span className="md:hidden">{match.homeTeam.code}</span>
              <span className="hidden md:inline">{match.homeTeam.name}</span>
            </span>
            <PixelFlag team={match.homeTeam} className="w-4 h-3 md:w-6 md:h-4 border-black shrink-0" />
          </div>
        </td>
        <td className="p-0.5 md:p-1 border-r border-gray-200">
          <div className="flex items-center justify-center gap-0.5 relative">
            <PixelInput
              type="number"
              value={isOfficial ? (hasRealScore ? match.realHomeScore : '') : pred.home}
              onChange={(e) => !isOfficial && handleInputChange(match.id, 'home', e.target.value)}
              disabled={isLocked || isOfficial}
              className={`w-6 h-6 md:w-10 md:h-10 text-center p-0 font-bold bg-white text-[8px] md:text-base border shadow-none 
                ${isOfficial ? 'text-blue-600 bg-blue-50' : ''} 
                ${(isLocked && !isOfficial) ? 'bg-gray-200 text-gray-500 opacity-80 cursor-not-allowed border-gray-400' : ''}
                ${status === 'error' ? 'border-red-500 bg-red-50' : ''}
              `}
              placeholder="-"
            />
            
            <span className="text-[6px] md:text-xs text-gray-400 w-3 md:w-4 flex justify-center items-center">
              {status === 'saving' ? (
                <div className="w-2 h-2 md:w-3 md:h-3 border border-yellow-500 border-t-transparent animate-spin rounded-full"></div>
              ) : status === 'saved' ? (
                <span className="text-green-500 font-bold drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]">✓</span>
              ) : status === 'error' ? (
                <span className="text-red-500 font-bold drop-shadow-[1px_1px_0_rgba(0,0,0,0.5)]">!</span>
              ) : (
                "x"
              )}
            </span>

            <PixelInput
              type="number"
              value={isOfficial ? (hasRealScore ? match.realAwayScore : '') : pred.away}
              onChange={(e) => !isOfficial && handleInputChange(match.id, 'away', e.target.value)}
              disabled={isLocked || isOfficial}
              className={`w-6 h-6 md:w-10 md:h-10 text-center p-0 font-bold bg-white text-[8px] md:text-base border shadow-none 
                ${isOfficial ? 'text-blue-600 bg-blue-50' : ''} 
                ${(isLocked && !isOfficial) ? 'bg-gray-200 text-gray-500 opacity-80 cursor-not-allowed border-gray-400' : ''}
                ${status === 'error' ? 'border-red-500 bg-red-50' : ''}
              `}
              placeholder="-"
            />
          </div>
        </td>
        <td className="p-0.5 md:p-1 text-left overflow-hidden">
          <div className="flex items-center gap-1">
            <PixelFlag team={match.awayTeam} className="w-4 h-3 md:w-6 md:h-4 border-black shrink-0" />
            <span className={`uppercase truncate ${isLocked && !isOfficial ? 'text-gray-400' : 'text-black'}`}>
              <span className="md:hidden">{match.awayTeam.code}</span>
              <span className="hidden md:inline">{match.awayTeam.name}</span>
            </span>
          </div>
        </td>
        {!isOfficial && (
          <td className="p-0.5 md:p-1 text-center border-l border-gray-200">
            {hasRealScore ? (
              <span className="bg-gray-900 text-yellow-400 px-1 py-0.5 font-bold border border-black text-[6px] md:text-[10px] whitespace-nowrap">
                {match.realHomeScore}-{match.realAwayScore}
              </span>
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </td>
        )}
      </tr>
    );
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 px-1 md:px-4">
      {/* Titulo extra se for Resultados Oficiais */}
      {isOfficial && (
        <div className="mb-6 text-center">
          <h2 className="text-xl md:text-3xl text-white font-bold drop-shadow-[2px_2px_0_rgba(0,0,0,1)] uppercase italic tracking-widest bg-red-600 inline-block px-4 py-2 border-4 border-black">
            Resultados Oficiais
          </h2>
        </div>
      )}

      {/* Seletor de Estágio */}
      <div className="mb-6 flex flex-wrap justify-center gap-1 md:gap-2">
        {stages.map(stage => (
          <PixelButton
            key={stage.id}
            variant={currentStage === stage.id ? (isOfficial ? 'danger' : 'action') : 'primary'}
            onClick={() => onStageChange(stage.id)}
            className="flex-grow md:flex-grow-0 min-w-[50px] text-[7px] md:text-xs text-center justify-center px-1 md:px-2 py-2"
          >
            {stage.label}
          </PixelButton>
        ))}
      </div>

      {/* ==================== DESKTOP VIEW (SPLIT TABLES) ==================== */}
      <div className="hidden md:block space-y-12">
        {sortedGroupEntries.map(([groupName, groupMatches]) => (
          <div key={groupName} className="flex flex-col gap-4">
            {groupName && (
              <h2 className="text-yellow-400 text-xl font-bold uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] px-2">
                {groupName}
              </h2>
            )}

            <div className="flex flex-row gap-6 items-start">
              {/* Lado Esquerdo: Planilha de Jogos */}
              <div className={currentStage === 'GROUPS' ? "w-[65%]" : "w-full"}>
                <PixelCard className="p-0 overflow-hidden bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]" colorClass="bg-white">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className={`${isOfficial ? 'bg-red-600' : 'bg-blue-600'} text-white text-[10px] uppercase font-bold border-b-4 border-black`}>
                        <th className="p-1 border-r border-black/20 w-[15%] text-center">Data</th>
                        <th className="p-1 border-r border-black/20 w-[30%] text-right">Time A</th>
                        <th className="p-1 border-r border-black/20 w-[20%] text-center">Placar</th>
                        <th className="p-1 text-left w-[30%]">Time B</th>
                        {!isOfficial && <th className="p-1 border-l border-black/20 w-[15%] text-center">Oficial</th>}
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold">
                      {groupMatches.map((match) => renderMatchRow(match, false))}
                    </tbody>
                  </table>
                </PixelCard>
              </div>

              {/* Lado Direito: Classificação */}
              {currentStage === 'GROUPS' && (
                <div className="w-[35%]">
                  <div className="mb-2 text-xs text-white/50 uppercase font-bold px-2">Classificação Simulada</div>
                  <StandingsTable stats={calculateGroupStandings(groupName, groupMatches)} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ==================== MOBILE VIEW (SINGLE TABLE) ==================== */}
      <div className="block md:hidden">
        <PixelCard className="p-0 overflow-hidden bg-white border-blue-600 shadow-none" colorClass="bg-white">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className={`${isOfficial ? 'bg-red-600' : 'bg-blue-600'} text-white text-[7px] uppercase font-bold border-b-2 border-black`}>
                <th className="p-1 border-r border-black/20 w-[20%] text-center">Data</th>
                <th className="p-1 border-r border-black/20 w-[25%] text-right">Time A</th>
                <th className="p-1 border-r border-black/20 w-[20%] text-center">Placar</th>
                <th className="p-1 text-left w-[25%]">Time B</th>
                {!isOfficial && <th className="p-1 border-l border-black/20 w-[15%] text-center">Fim</th>}
              </tr>
            </thead>
            <tbody className="text-[7px] font-bold">
              {(() => {
                let lastGroup = '';
                // Ordenar por grupo para mobile para ficar agrupado visualmente
                const mobileMatches = [...filteredMatches].sort((a, b) => a.group.localeCompare(b.group) || a.date.localeCompare(b.date));

                return mobileMatches.map((match) => {
                  const showHeader = match.group !== lastGroup;
                  if (showHeader) lastGroup = match.group;

                  return (
                    <React.Fragment key={match.id}>
                      {showHeader && currentStage === 'GROUPS' && (
                        <tr className="bg-gray-800 text-yellow-400 border-b border-black">
                          <td colSpan={5} className="p-1 text-[8px] font-bold text-center tracking-widest uppercase border-t border-black">
                            {match.group}
                          </td>
                        </tr>
                      )}
                      {renderMatchRow(match, false)}
                    </React.Fragment>
                  );
                });
              })()}
            </tbody>
          </table>
        </PixelCard>
      </div>

      <div className="mt-8 text-center text-white/50 text-[6px] md:text-[10px] uppercase font-bold bg-black/20 p-2 md:p-4 border border-white/10 mx-auto">
        💡 Seus palpites atualizam a classificação do grupo em tempo real no PC!
      </div>
    </div>
  );
};