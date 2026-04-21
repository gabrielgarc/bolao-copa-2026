import React, { useState, useMemo } from 'react';
import { Match, MatchStage, TeamStats } from '../types';
import { PixelCard, PixelInput, PixelFlag, PixelButton } from './PixelComponents';
import { StandingsTable } from './StandingsTable';

import { StandingsResponse } from '../types';

interface SpreadsheetViewProps {
  matches: Match[];
  predictions: Record<string, { home: string; away: string }>;
  standings: StandingsResponse;
  onPredict: (matchId: string, home: string, away: string) => Promise<void>;
  currentStage: MatchStage;
  onStageChange: (stage: MatchStage) => void;
  isOfficial?: boolean;
  pointsByMatch?: Record<string, number>;
  qualifiedTeamsCount?: number;
  correctQualifiedTeamIds?: string[];
}

export const SpreadsheetView: React.FC<SpreadsheetViewProps> = ({
  matches,
  predictions,
  standings,
  onPredict,
  currentStage,
  onStageChange,
  isOfficial = false,
  pointsByMatch = {},
  qualifiedTeamsCount = 0,
  correctQualifiedTeamIds = []
}) => {
  const [localPredictions, setLocalPredictions] = useState<Record<string, { home: string; away: string }>>(predictions);
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'error' | 'saved'>>({});
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorDetail, setErrorDetail] = useState('');

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
        } catch (err: any) {
          console.error(err);
          const msg = err?.response?.data || err?.message || 'Erro ao salvar';
          setSaveStatus(prev => ({ ...prev, [matchId]: 'error' }));
          setErrorDetail(typeof msg === 'string' ? msg : JSON.stringify(msg));
          setErrorModalOpen(true);
        }
      }
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length === 2) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/2026`;
      }
      if (parts.length === 3) {
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
    }
    return dateStr;
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

  // Helper render row for Match (Reused logic ideally, but separated for strict layout control)
  const renderMatchRow = (match: Match, showGroup: boolean = false) => {
    const pred = localPredictions[match.id] || { home: '', away: '' };
    const started = isMatchStarted(match);
    const hasRealScore = match.realHomeScore !== undefined && match.realHomeScore !== null;
    const isLocked = match.isLocked || hasRealScore || started || match.homeTeam.name === 'Unknown' || match.awayTeam.name === 'Unknown';
    const status = saveStatus[match.id];

    return (
      <tr key={match.id} className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${isLocked ? 'bg-gray-50' : ''}`}>
        <td className="p-1 md:p-2 border-r border-gray-200 text-center leading-none">
          <div className="text-[10px] md:text-sm text-gray-800 font-semibold flex flex-col items-center">
            <span>{formatDisplayDate(match.date)}</span>
            <span className="text-[9px] md:hidden text-gray-500 font-normal">{match.time}</span>
          </div>
          {showGroup && <div className="text-[7px] md:text-[9px] text-blue-600 font-bold uppercase mt-1">{match.group.replace('Grupo ', 'GP ')}</div>}
          <div className="hidden md:block text-[8px] text-gray-400 uppercase mt-0.5">{match.time}</div>
        </td>
        <td className="p-0.5 md:p-2 border-r border-gray-200 text-right overflow-hidden">
          <div className="flex items-center justify-end gap-0.5 md:gap-3">
            <span className={`uppercase truncate font-bold text-[11px] md:text-[15px] ${isLocked ? 'text-gray-400' : 'text-black'}`}>
              <span className="md:hidden">{match.homeTeam.code}</span>
              <span className="hidden md:inline">{match.homeTeam.namePt || match.homeTeam.name}</span>
            </span>
            <PixelFlag team={match.homeTeam} className="w-5 h-3.5 md:w-8 md:h-5 border-black shrink-0" />
          </div>
        </td>
        <td className="p-0.5 md:p-1 border-r border-gray-200">
          <div className="flex items-center justify-center gap-0.5 relative">
            <PixelInput
              type="number"
              value={isOfficial ? (hasRealScore ? match.realHomeScore : '') : pred.home}
              onChange={(e) => !isOfficial && handleInputChange(match.id, 'home', e.target.value)}
              disabled={isLocked || isOfficial}
              className={`w-7 h-7 md:w-10 md:h-10 text-center p-0 font-bold bg-white text-[11px] md:text-base border shadow-none 
                ${isOfficial ? 'text-blue-600 bg-blue-50' : ''} 
                ${(isLocked && !isOfficial) ? 'bg-gray-200 text-gray-500 opacity-80 cursor-not-allowed border-gray-400' : ''}
                ${status === 'error' ? 'border-red-500 bg-red-50' : ''}
              `}
              placeholder="-"
            />

            <span className="text-[8px] md:text-xs text-gray-400 w-3 md:w-4 flex justify-center items-center">
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
              className={`w-7 h-7 md:w-10 md:h-10 text-center p-0 font-bold bg-white text-[11px] md:text-base border shadow-none 
                ${isOfficial ? 'text-blue-600 bg-blue-50' : ''} 
                ${(isLocked && !isOfficial) ? 'bg-gray-200 text-gray-500 opacity-80 cursor-not-allowed border-gray-400' : ''}
                ${status === 'error' ? 'border-red-500 bg-red-50' : ''}
              `}
              placeholder="-"
            />
          </div>
        </td>
        <td className="p-0.5 md:p-2 text-left overflow-hidden">
          <div className="flex items-center gap-0.5 md:gap-3">
            <PixelFlag team={match.awayTeam} className="w-5 h-3.5 md:w-8 md:h-5 border-black shrink-0" />
            <span className={`uppercase truncate font-bold text-[11px] md:text-[15px] ${isLocked && !isOfficial ? 'text-gray-400' : 'text-black'}`}>
              <span className="md:hidden">{match.awayTeam.code}</span>
              <span className="hidden md:inline">{match.awayTeam.namePt || match.awayTeam.name}</span>
            </span>
          </div>
        </td>
        {!isOfficial && (
          <td className="p-0.5 md:p-1 text-center border-l border-gray-200">
            {hasRealScore ? (
              <span className="bg-gray-900 text-yellow-400 px-1 py-0.5 font-bold border border-black text-[9px] md:text-[10px] whitespace-nowrap">
                {match.realHomeScore}-{match.realAwayScore}
              </span>
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </td>
        )}
        {!isOfficial && (
          <td className="p-0.5 md:p-1 text-center border-l border-gray-200">
            {hasRealScore && pointsByMatch[match.id] !== undefined ? (
              <span className={`px-1.5 py-0.5 font-bold text-[9px] md:text-[10px] border ${
                pointsByMatch[match.id] === 120 ? 'bg-green-100 text-green-700 border-green-400' :
                pointsByMatch[match.id] === 90 ? 'bg-pink-100 text-pink-700 border-pink-400' :
                pointsByMatch[match.id] === 60 ? 'bg-cyan-100 text-cyan-700 border-cyan-400' :
                pointsByMatch[match.id] === 30 ? 'bg-yellow-100 text-yellow-700 border-yellow-400' :
                'bg-gray-100 text-gray-500 border-gray-300'
              }`}>
                {pointsByMatch[match.id]}
              </span>
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </td>
        )}
      </tr>
    );
  };

  const renderScoreSummary = (groupName: string, groupMatches: Match[]) => {
    if (isOfficial) return null;
    
    const groupKey = groupName.replace('Grupo ', 'GROUP_');
    const groupStandings = standings.groups[groupKey] || [];
    const groupMatchIds = groupMatches.map(m => m.id);
    const groupMatchPts = groupMatchIds.reduce((sum, id) => sum + (pointsByMatch[id] || 0), 0);
    
    const qualifiedTeams = groupStandings.filter(t => t.isQualified);
    const groupQualifiedMatchedCount = qualifiedTeams
      .filter(t => correctQualifiedTeamIds.includes(t.teamId))
      .length;
    
    const qualBonusPts = groupQualifiedMatchedCount * 100;
    const groupTotal = groupMatchPts + qualBonusPts;

    return (
      <div className="mt-2 bg-black/40 border border-white/20 px-3 py-2 text-[10px] md:text-xs font-bold text-white">
        <div className="flex justify-between items-center mb-1">
          <span className="text-white/70">Pontos Jogos:</span>
          <span className="text-yellow-400">{groupMatchPts}</span>
        </div>
        {qualifiedTeams.length > 0 && (
          <div className="mb-1">
            <div className="text-white/50 text-[8px] md:text-[10px] uppercase tracking-wider mb-1 mt-1">Classificados:</div>
            {qualifiedTeams.map(team => {
              const isCorrect = correctQualifiedTeamIds.includes(team.teamId);
              return (
                <div key={team.teamId} className="flex justify-between items-center mb-0.5 pl-1">
                  <div className="flex items-center gap-1.5">
                    <span className={isCorrect ? 'text-green-400' : 'text-red-400'}>{isCorrect ? '✓' : '✗'}</span>
                    <PixelFlag team={team.team} className="w-4 h-3 md:w-5 md:h-3.5 border-black shrink-0" />
                    <span className={`uppercase text-[9px] md:text-[11px] ${isCorrect ? 'text-green-300' : 'text-red-300'}`}>
                      <span className="md:hidden">{team.team.code}</span>
                      <span className="hidden md:inline">{team.team.namePt || team.team.name}</span>
                    </span>
                  </div>
                  <span className={`text-[9px] md:text-[11px] ${isCorrect ? 'text-green-400' : 'text-red-400/50'}`}>
                    {isCorrect ? '+100' : '+0'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {qualBonusPts > 0 && (
          <div className="flex justify-between items-center mb-1 border-t border-white/10 pt-1">
            <span className="text-white/70">Bônus Classificados:</span>
            <span className="text-green-400">+{qualBonusPts}</span>
          </div>
        )}
        <div className="flex justify-between items-center border-t border-white/20 pt-1 mt-1">
          <span className="text-white uppercase tracking-wider">Total Grupo:</span>
          <span className="text-blue-400 text-sm">{groupTotal}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full mx-auto pb-20 px-0.5 md:px-4">
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
              <div className={currentStage === 'GROUPS' ? "w-[58%]" : "w-full"}>
                <PixelCard className="p-0 overflow-hidden bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]" colorClass="bg-white">
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className={`${isOfficial ? 'bg-red-600' : 'bg-blue-600'} text-white text-[10px] uppercase font-bold border-b-4 border-black`}>
                        <th className="p-1 border-r border-black/20 w-[15%] text-center">Data</th>
                        <th className="p-1 border-r border-black/20 w-[30%] text-right">Time A</th>
                        <th className="p-1 border-r border-black/20 w-[18%] text-center">Placar</th>
                        <th className="p-1 text-left w-[30%]">Time B</th>
                        {!isOfficial && <th className="p-1 border-l border-black/20 w-[10%] text-center">Oficial</th>}
                        {!isOfficial && <th className="p-1 border-l border-black/20 w-[7%] text-center">Pts</th>}
                      </tr>
                    </thead>
                    <tbody className="text-xs font-bold">
                      {groupMatches.map((match) => renderMatchRow(match, false))}
                    </tbody>
                  </table>
                </PixelCard>
              </div>

                  {currentStage === 'GROUPS' && (
                    <div className="w-[42%]">
                      <div className="mb-2 text-xs text-white/50 uppercase font-bold px-2">Classificação Simulada</div>
                      <StandingsTable stats={standings.groups[groupName.replace('Grupo ', 'GROUP_')] || []} />
                      {renderScoreSummary(groupName, groupMatches)}
                    </div>
                  )}
            </div>
          </div>
        ))}

        {currentStage === 'GROUPS' && standings.overallThirds.length > 0 && (
          <div className="flex flex-col gap-4 mt-8">
            <h2 className="text-yellow-400 text-xl font-bold uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] px-2">
              Repescagem (Melhores 3º Colocados)
            </h2>
            <div className="w-full md:w-[60%] mx-auto">
              <StandingsTable stats={standings.overallThirds} />
              <p className="text-center text-xs text-white/70 mt-2">
                Os 8 melhores terceiros colocados avançam para a 2ª Fase junto com os dois melhores de cada grupo.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="block md:hidden">
        <PixelCard className="p-0 overflow-hidden bg-white border-blue-600 !border-2 shadow-none" colorClass="bg-white">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className={`${isOfficial ? 'bg-red-600' : 'bg-blue-600'} text-white text-[8px] uppercase font-bold border-b-2 border-black`}>
                <th className="p-1 border-r border-black/20 w-[21%] text-center">Data</th>
                <th className="p-1 border-r border-black/20 w-[18%] text-right">Casa</th>
                <th className="p-1 border-r border-black/20 w-[22%] text-center">Placar</th>
                <th className="p-1 text-left w-[18%]">Fora</th>
                {!isOfficial && <th className="p-1 border-l border-black/20 w-[11%] text-center">Real</th>}
                {!isOfficial && <th className="p-1 border-l border-black/20 w-[10%] text-center">Pts</th>}
              </tr>
            </thead>
            <tbody className="text-[9px] font-bold">
              {(() => {
                const groupMatches = [...filteredMatches].sort((a, b) => a.group.localeCompare(b.group) || a.date.localeCompare(b.date));
                const elements: React.ReactNode[] = [];
                let currentGroup = "";
                let groupMatchList: Match[] = [];

                groupMatches.forEach((match, idx) => {
                  if (match.group !== currentGroup) {
                    if (currentGroup && currentStage === 'GROUPS') {
                        elements.push(
                            <tr key={`${currentGroup}-summary`} className="bg-gray-100">
                                <td colSpan={6} className="p-2 pt-0">
                                    {renderScoreSummary(currentGroup, groupMatchList)}
                                </td>
                            </tr>
                        );
                    }
                    currentGroup = match.group;
                    groupMatchList = [];
                    if (currentStage === 'GROUPS') {
                      elements.push(
                        <tr key={`${currentGroup}-header`} className="bg-gray-800 text-yellow-400 border-b border-black">
                          <td colSpan={isOfficial ? 4 : 6} className="p-1.5 text-[10px] font-bold text-center tracking-widest uppercase border-t border-black">
                            {match.group}
                          </td>
                        </tr>
                      );
                    }
                  }
                  groupMatchList.push(match);
                  elements.push(renderMatchRow(match, false));

                  // Last item summary
                  if (idx === groupMatches.length - 1 && currentGroup && currentStage === 'GROUPS') {
                    elements.push(
                        <tr key={`${currentGroup}-summary-last`} className="bg-gray-100">
                            <td colSpan={6} className="p-2 pt-0">
                                {renderScoreSummary(currentGroup, groupMatchList)}
                            </td>
                        </tr>
                    );
                  }
                });

                return elements;
              })()}
            </tbody>
          </table>
        </PixelCard>
      </div>

      <div className="mt-8 text-center text-white/50 text-[6px] md:text-[10px] uppercase font-bold bg-black/20 p-2 md:p-4 border border-white/10 mx-auto">
        💡 Seus palpites atualizam a classificação do grupo em tempo real no PC!
      </div>

      {errorModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-red-600 border-4 border-black p-4 md:p-6 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-white">
            <h2 className="text-xl md:text-2xl font-bold uppercase mb-4 drop-shadow-[2px_2px_0_rgba(0,0,0,1)] text-yellow-400">
              Ocorreu um problema!
            </h2>
            <p className="text-sm md:text-base font-bold mb-4 leading-relaxed">
              Não foi possível salvar o seu palpite. Por favor, tire um print desta tela e entre em contato com o suporte (Gabriel) pelo telefone/WhatsApp:
              <span className="text-yellow-400 block mt-2 text-xl">+55 (11) 98765-4321</span>
            </p>
            <div className="bg-black/50 border-2 border-black p-3 mb-4 overflow-y-auto max-h-32">
              <span className="text-[10px] md:text-xs text-gray-400 font-bold uppercase block mb-1">ERRO:</span>
              <p className="text-xs font-mono break-all text-red-200">
                {errorDetail}
              </p>
            </div>
            <div className="flex justify-end">
              <PixelButton onClick={() => setErrorModalOpen(false)} variant="primary">
                Entendi
              </PixelButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};