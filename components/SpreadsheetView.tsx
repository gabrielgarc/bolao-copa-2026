import React, { useState, useMemo, useEffect } from 'react';
import { Match, MatchStage, TeamStats } from '../types';
import { PixelCard, PixelInput, PixelFlag, PixelButton } from './PixelComponents';
import { StandingsTable } from './StandingsTable';

import { StandingsResponse } from '../types';
import { AdminService } from '../services/adminService';
import { isMatchStarted } from '../utils/dateUtils';

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
  qualifiedTeamStatuses?: Record<string, string>;
  qualificationBonusByGroup?: Record<string, number>;
  onRefresh?: () => Promise<void>;
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
  correctQualifiedTeamIds = [],
  qualifiedTeamStatuses = {},
  qualificationBonusByGroup = {},
  onRefresh
}) => {
  const [localPredictions, setLocalPredictions] = useState<Record<string, { home: string; away: string }>>(predictions);
  const [saveStatus, setSaveStatus] = useState<Record<string, 'saving' | 'error' | 'saved'>>({});
  const [errorModalOpen, setErrorModalOpen] = useState(false);
  const [errorDetail, setErrorDetail] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [expandedStandings, setExpandedStandings] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<'GROUP' | 'DATE'>('GROUP');
  const effectiveViewMode = currentStage === 'GROUPS' ? viewMode : 'GROUP';

  // Garante que se o App carregar os dados atrasado, a tela puxe!
  React.useEffect(() => {
    setLocalPredictions(predictions);
  }, [predictions]);

  const stages: { id: string, label: string }[] = [
    { id: 'GROUPS', label: 'Grupos' },
    { id: 'R32', label: '2ª Fase' },
    { id: 'R16', label: 'Oitavas' },
    { id: 'QF', label: 'Quartas' },
    { id: 'SF', label: 'Semi' },
    { id: 'THIRD_PLACE', label: '3º Lugar' },
    { id: 'FINAL', label: '🏆 Final' },
  ];

  const stageMultipliers: Record<string, number> = {
    'GROUPS': 1,
    'R32': 3,
    'R16': 5,
    'QF': 7,
    'SF': 9,
    'THIRD_PLACE': 10,
    'FINAL': 15
  };

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

  const getBrasiliaTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return { date: dateStr, time: timeStr, dayOfWeek: '', fullDate: dateStr };
    try {
      let year = 2026, month = 1, day = 1;
      if (dateStr.includes('-')) {
        const [y, m, d] = dateStr.split('-').map(Number);
        year = y; month = m; day = d;
      } else {
        const [d, m, y] = dateStr.split('/').map(Number);
        day = d; month = m; year = y || 2026;
      }
      const [hour, min] = timeStr.split(':').map(Number);
      
      const utcDate = new Date(Date.UTC(year, month - 1, day, hour, min));
      
      const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const weekdayFormatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'long'
      });
      const weekdayShortFormatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'short'
      });

      const date = dateFormatter.format(utcDate);
      const shortDate = date.substring(0, 5); // "DD/MM"
      const time = timeFormatter.format(utcDate);
      let dayOfWeek = weekdayFormatter.format(utcDate);
      dayOfWeek = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
      
      let dayOfWeekShort = weekdayShortFormatter.format(utcDate);
      dayOfWeekShort = dayOfWeekShort.charAt(0).toUpperCase() + dayOfWeekShort.slice(1).replace('.', '');

      return { 
        date, 
        shortDate, 
        time, 
        dayOfWeek, 
        dayOfWeekShort,
        fullDate: `${shortDate} (${dayOfWeek})` 
      };
    } catch {
      return { date: dateStr, time: timeStr, dayOfWeek: '', fullDate: dateStr };
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

      const matchDate = new Date(Date.UTC(year, month - 1, day, hour, min));
      if (isNaN(matchDate.getTime())) return false;
      return new Date() >= matchDate;
    } catch {
      return false;
    }
  };

  const filteredMatches = useMemo(() => {
    return matches.filter(m => m.stage === currentStage);
  }, [matches, currentStage]);

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

  // --- LOGIC FOR DATE VIEW ---
  const matchesByDate = useMemo(() => {
    const dates: Record<string, Match[]> = {};
    filteredMatches.forEach(m => {
      const brInfo = getBrasiliaTime(m.date, m.time);
      const dateKey = brInfo.date;
      if (!dates[dateKey]) dates[dateKey] = [];
      dates[dateKey].push(m);
    });
    return dates;
  }, [filteredMatches]);

  const sortedDateEntries = useMemo(() => {
    return Object.entries(matchesByDate).sort((a, b) => {
      const parseDate = (d: string) => {
        const [day, month, year] = d.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      };
      return parseDate(a[0]).localeCompare(parseDate(b[0]));
    });
  }, [matchesByDate]);

  // Helper render row for Match (Reused logic ideally, but separated for strict layout control)
  const renderMatchRow = (match: Match, showGroup: boolean = false) => {
    const pred = localPredictions[match.id] || { home: '', away: '' };
    const started = isMatchStarted(match);
    const hasRealScore = match.realHomeScore !== undefined && match.realHomeScore !== null;
    const isLocked = match.isLocked || hasRealScore || started || match.homeTeam.name === 'Unknown' || match.awayTeam.name === 'Unknown';
    const status = saveStatus[match.id];
    const isFinal = currentStage === 'FINAL';

    const br = getBrasiliaTime(match.date, match.time);

    return (
      <tr key={match.id} className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${isLocked ? 'bg-gray-50' : ''} ${isFinal ? 'bg-gradient-to-r from-yellow-50 to-amber-100 hover:from-yellow-100 hover:to-amber-200' : ''}`}>
        <td className="p-1 md:p-2 border-r border-gray-200 text-center leading-none">
          <div className="text-[8px] md:text-sm text-gray-800 font-semibold flex flex-wrap items-center justify-center gap-x-1 gap-y-0.5">
            {effectiveViewMode === 'DATE' ? (
              <span className="whitespace-nowrap">{br.time}</span>
            ) : (
              <span className="whitespace-nowrap">{br.dayOfWeekShort} {br.shortDate} - {br.time}</span>
            )}
          </div>
          {showGroup && effectiveViewMode !== 'DATE' && <div className="text-[7px] md:text-[9px] text-blue-600 font-bold uppercase mt-1">{match.group.replace('Grupo ', 'GP ')}</div>}
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
              ) : isFinal ? (
                <div className="flex flex-col items-center mx-1">
                  <img
                    src="https://www.clipartmax.com/png/small/135-1350795_fifa-world-cup-trophy-vector-2014-fifa-world-cup-squads.png"
                    alt="Trophy"
                    className="w-6 h-8 md:w-8 md:h-12 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] animate-pulse"
                  />
                </div>
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
            {hasRealScore ? (
              (() => {
                const total = pointsByMatch[match.id] || 0;
                const mult = stageMultipliers[currentStage] || 1;
                const base = mult > 0 ? total / mult : 0;
                
                return (
                  <span className={`px-1 py-0.5 font-bold text-[9px] md:text-[10px] border inline-block whitespace-nowrap min-w-[28px] md:min-w-[40px] text-center ${base >= 120 ? 'bg-blue-100 text-blue-700 border-blue-400' :
                    base >= 90 ? 'bg-green-100 text-green-700 border-green-400' :
                      base >= 60 ? 'bg-yellow-100 text-yellow-700 border-yellow-400' :
                        base >= 30 ? 'bg-gray-100 text-gray-500 border-gray-300' :
                          'bg-red-100 text-red-700 border-red-400'
                    }`}>
                    {total}
                  </span>
                );
              })()
            ) : (
              <span className="text-gray-300">-</span>
            )}
          </td>
        )}
      </tr>
    );
  };

  const findGroupStandings = (groupName: string, source: StandingsResponse | undefined) => {
    if (!source) return [];
    const letter = groupName.replace('Grupo ', '').replace('Group ', '').replace('GROUP_', '').trim().toUpperCase();
    const possibleKeys = [`GROUP_${letter}`, `Group ${letter}`, `Grupo ${letter}`];
    for (const key of possibleKeys) {
      if (source.groups[key]?.length) return source.groups[key];
    }
    return [];
  };

  const extractGroupLetter = (groupName: string) => {
    return groupName.replace('Grupo ', '').replace('Group ', '').replace('GROUP_', '').trim().toUpperCase();
  };

  const getGroupTotalScore = (groupName: string, groupMatches: Match[]) => {
    if (isOfficial) return { groupMatchPts: 0, qualBonusPts: 0, groupTotal: 0, qualifiedTeams: [] as any[] };

    const groupStandings = findGroupStandings(groupName, standings);
    const groupMatchIds = groupMatches.map(m => m.id);
    const groupMatchPts = groupMatchIds.reduce((sum, id) => sum + (pointsByMatch[id] || 0), 0);
    const qualifiedTeams = groupStandings.filter(t => t.isQualified);

    // Bônus vem direto do backend
    const letter = extractGroupLetter(groupName);
    const qualBonusPts = qualificationBonusByGroup[letter] || 0;

    return { groupMatchPts, qualBonusPts, groupTotal: groupMatchPts + qualBonusPts, qualifiedTeams };
  };

  const renderScoreSummary = (groupName: string, groupMatches: Match[]) => {
    if (isOfficial) return null;

    const { groupMatchPts, qualBonusPts, groupTotal, qualifiedTeams } = getGroupTotalScore(groupName, groupMatches);

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
              // Status vem direto do backend
              const status = qualifiedTeamStatuses[team.teamId] || 'waiting';
              return (
                <div key={team.teamId} className="flex justify-between items-center mb-0.5 pl-1">
                  <div className="flex items-center gap-1.5">
                    {status === 'waiting' && <span className="text-yellow-400 text-[10px] w-3 flex justify-center">⏳</span>}
                    {status === 'correct' && <span className="text-green-400 w-3 flex justify-center">✓</span>}
                    {status === 'wrong' && <span className="text-red-400 w-3 flex justify-center">✗</span>}

                    <PixelFlag team={team.team} className="w-4 h-3 md:w-5 md:h-3.5 border-black shrink-0" />
                    <span className={`uppercase text-[9px] md:text-[11px] ${status === 'waiting' ? 'text-gray-300' :
                      status === 'correct' ? 'text-green-300' : 'text-red-300'
                      }`}>
                      <span className="md:hidden">{team.team.code}</span>
                      <span className="hidden md:inline">{team.team.namePt || team.team.name}</span>
                    </span>
                  </div>
                  <span className={`text-[9px] md:text-[11px] ${status === 'waiting' ? 'text-gray-400' :
                    status === 'correct' ? 'text-green-400' : 'text-red-400/50'
                    }`}>
                    {status === 'waiting' ? '?' : (status === 'correct' ? '+50' : '+0')}
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

  const renderMobileStandings = (groupName: string, groupMatchList: Match[] = []) => {
    if (currentStage !== 'GROUPS') return null;
    const groupStats = findGroupStandings(groupName, standings);
    if (!groupStats.length) return null;

    const key = `standings-${groupName}`;
    const isExpanded = expandedStandings[key];
    const isSaving = groupMatchList.some(m => saveStatus[m.id] === 'saving');

    return (
      <tr key={key} className="bg-gray-900/50">
        <td colSpan={isOfficial ? 4 : 6} className="p-1.5">
          <button
            onClick={() => setExpandedStandings(prev => ({ ...prev, [key]: !prev[key] }))}
            className={`w-full text-[9px] bg-indigo-900 hover:bg-indigo-800 text-white px-2 py-1.5 font-bold uppercase border border-indigo-500/50 flex justify-between items-center transition-all ${isSaving ? 'animate-pulse' : ''}`}
          >
            <span>
              {isSaving ? '⏳' : '📊'} Classificação
              {isSaving && <span className="ml-1 text-yellow-300 text-[8px]">atualizando...</span>}
            </span>
            <span>{isExpanded ? '▲' : '▼'}</span>
          </button>
          {isExpanded && (
            <div className="animate-fadeIn mt-1 relative">
              {isSaving && (
                <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="flex items-center gap-1 bg-blue-600 text-white px-2 py-1 text-[9px] font-bold border border-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    <span className="inline-block w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Atualizando...
                  </div>
                </div>
              )}
              <StandingsTable stats={groupStats} className="shadow-none border border-white/10" />
            </div>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="max-w-full mx-auto pb-20 px-0.5 md:px-4">
      {/* Titulo extra se for Resultados Oficiais */}
      {isOfficial && (
        <div className="mb-6 text-center flex flex-col items-center gap-4">
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
            onClick={() => onStageChange(stage.id as MatchStage)}
            className={`flex-grow md:flex-grow-0 min-w-[50px] text-[7px] md:text-xs text-center justify-center px-1 md:px-2 py-2`}
          >
            {stage.label}
          </PixelButton>
        ))}
      </div>

      {/* Toggle de Visualização - Apenas na fase de grupos */}
      {currentStage === 'GROUPS' && (
        <div className="mb-8 flex justify-center">
          <div className="bg-gray-800 p-1 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex">
            <button
              onClick={() => setViewMode('GROUP')}
              className={`px-4 py-1.5 text-[9px] md:text-[11px] uppercase font-bold transition-all ${effectiveViewMode === 'GROUP' ? (isOfficial ? 'bg-red-600 text-white' : 'bg-yellow-400 text-black') : 'text-gray-400 hover:text-white'}`}
            >
              Por Grupo
            </button>
            <button
              onClick={() => setViewMode('DATE')}
              className={`px-4 py-1.5 text-[9px] md:text-[11px] uppercase font-bold transition-all ${viewMode === 'DATE' ? (isOfficial ? 'bg-red-600 text-white' : 'bg-yellow-400 text-black') : 'text-gray-400 hover:text-white'}`}
            >
              Por Dia
            </button>
          </div>
        </div>
      )}

      {/* ==================== EPIC FINAL VIEW ==================== */}
      {currentStage === 'FINAL' && (() => {
        const finalMatch = filteredMatches[0];
        if (!finalMatch) return (
          <div className="text-center text-white/40 py-20 text-lg uppercase font-bold">Final ainda não definida</div>
        );
        const pred = localPredictions[finalMatch.id] || { home: '', away: '' };
        const hasRealScore = finalMatch.realHomeScore !== undefined && finalMatch.realHomeScore !== null;
        const started = isMatchStarted(finalMatch);
        const isLocked = finalMatch.isLocked || hasRealScore || started;
        const status = saveStatus[finalMatch.id];
        const pts = pointsByMatch[finalMatch.id];
        const homeUnknown = finalMatch.homeTeam.name === 'Unknown';
        const awayUnknown = finalMatch.awayTeam.name === 'Unknown';
        return (
          <div className="relative overflow-hidden rounded-none border-4 border-yellow-400 shadow-[0_0_60px_rgba(250,204,21,0.4)] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 py-10 px-4 md:px-12 flex flex-col items-center gap-6">
            {/* Glow background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,204,21,0.08)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />

            {/* Header */}
            <div className="text-center z-10">
              <p className="text-yellow-400 text-[10px] md:text-xs uppercase font-bold tracking-[0.4em] opacity-80 mb-1">Copa do Mundo 2026</p>
              <h2 className="text-3xl md:text-6xl font-black text-white drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] uppercase tracking-wider">GRANDE FINAL</h2>
              <p className="text-yellow-400/60 text-[10px] md:text-xs uppercase tracking-widest mt-1">{finalMatch.date} · {finalMatch.time}</p>
            </div>

            {/* ── Teams + Score Row ── */}
            {/* The names are positioned absolutely below the flags so they don't break the perfect vertical centering of flags vs trophy */}
            <div className="z-10 w-full max-w-4xl flex items-center justify-between gap-1 md:gap-8 mb-8 md:mb-16">

              {/* Home */}
              <div className="flex-1 flex justify-end">
                {!homeUnknown ? (
                  <div className="relative flex flex-col items-center">
                    <PixelFlag team={finalMatch.homeTeam} className="w-20 h-[3.33rem] md:w-48 md:h-32 border-2 md:border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                    <div className="absolute top-full mt-2 md:mt-3 w-[200%] text-center">
                      <span className="text-white font-black text-[10px] md:text-2xl uppercase tracking-wide drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        <span className="md:hidden">{finalMatch.homeTeam.code}</span>
                        <span className="hidden md:block">{finalMatch.homeTeam.namePt || finalMatch.homeTeam.name}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-white/30 text-[10px] md:text-sm uppercase font-bold">A definir</div>
                )}
              </div>

              {/* Score inputs + trophy */}
              <div className="flex items-center gap-1 md:gap-4 shrink-0">
                <PixelInput
                  type="number"
                  value={isOfficial ? (hasRealScore ? finalMatch.realHomeScore : '') : pred.home}
                  onChange={(e) => !isOfficial && handleInputChange(finalMatch.id, 'home', e.target.value)}
                  disabled={isLocked || isOfficial}
                  className={`w-10 h-10 md:w-20 md:h-20 text-center p-0 font-black text-xl md:text-4xl bg-gray-900 text-yellow-400 border-[3px] md:border-4 border-yellow-400 shadow-none
                    ${(isLocked && !isOfficial) ? 'opacity-70 cursor-not-allowed' : ''}
                    ${isOfficial ? 'text-blue-400 border-blue-400' : ''}
                  `}
                  placeholder="?"
                />
                
                {/* Trophy with overlay */}
                <div className="relative flex items-center justify-center shrink-0 mx-1 md:mx-6">
                  <img src="/trophy-world-cup.svg" alt="Trophy"
                    className="w-16 h-24 md:w-40 md:h-56 object-contain drop-shadow-[0_0_15px_rgba(250,204,21,0.9)] md:scale-110" />
                  {status === 'saving' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                      <div className="w-8 h-8 md:w-12 md:h-12 border-4 border-yellow-400 border-t-transparent animate-spin rounded-full" />
                    </div>
                  )}
                  {status === 'saved' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                      <span className="text-green-400 text-3xl md:text-5xl font-black drop-shadow-[0_0_8px_rgba(0,255,0,0.8)]">✓</span>
                    </div>
                  )}
                </div>

                <PixelInput
                  type="number"
                  value={isOfficial ? (hasRealScore ? finalMatch.realAwayScore : '') : pred.away}
                  onChange={(e) => !isOfficial && handleInputChange(finalMatch.id, 'away', e.target.value)}
                  disabled={isLocked || isOfficial}
                  className={`w-10 h-10 md:w-20 md:h-20 text-center p-0 font-black text-xl md:text-4xl bg-gray-900 text-yellow-400 border-[3px] md:border-4 border-yellow-400 shadow-none
                    ${(isLocked && !isOfficial) ? 'opacity-70 cursor-not-allowed' : ''}
                    ${isOfficial ? 'text-blue-400 border-blue-400' : ''}
                  `}
                  placeholder="?"
                />
              </div>

              {/* Away */}
              <div className="flex-1 flex justify-start">
                {!awayUnknown ? (
                  <div className="relative flex flex-col items-center">
                    <PixelFlag team={finalMatch.awayTeam} className="w-20 h-[3.33rem] md:w-48 md:h-32 border-2 md:border-4 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                    <div className="absolute top-full mt-2 md:mt-3 w-[200%] text-center">
                      <span className="text-white font-black text-[10px] md:text-2xl uppercase tracking-wide drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
                        <span className="md:hidden">{finalMatch.awayTeam.code}</span>
                        <span className="hidden md:block">{finalMatch.awayTeam.namePt || finalMatch.awayTeam.name}</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-white/30 text-[10px] md:text-sm uppercase font-bold">A definir</div>
                )}
              </div>
            </div>

            {/* ── Real score + points + hint ── all centered below */}
            {hasRealScore && (
              <div className="z-10 flex flex-col items-center gap-1">
                <p className="text-yellow-400/50 text-[9px] uppercase tracking-widest font-bold">Placar Real</p>
                <span className="bg-gray-900 text-yellow-400 px-3 py-1 font-black border-2 border-yellow-400 text-base md:text-xl">
                  {finalMatch.realHomeScore} – {finalMatch.realAwayScore}
                </span>
                {!isOfficial && pts !== undefined && (
                  <span className={`px-3 py-1 font-black text-sm md:text-base border-2 border-black ${pts >= 840 ? 'bg-blue-600 text-white' :
                    pts >= 630 ? 'bg-green-600 text-white' :
                      pts >= 420 ? 'bg-yellow-500 text-black' :
                        pts >= 210 ? 'bg-gray-500 text-white' :
                          'bg-red-600 text-white'
                    }`}>{pts} PTS</span>
                )}
              </div>
            )}
            {!isLocked && !isOfficial && (
              <p className="z-10 text-yellow-400/50 text-[9px] uppercase tracking-widest font-bold animate-pulse">Digite seu palpite</p>
            )}

            {/* Footer sparkle */}
            <div className="z-10 text-center">
              <p className="text-yellow-400/40 text-[9px] md:text-[11px] uppercase tracking-[0.3em] font-bold">O jogo mais importante do mundo</p>
            </div>

          </div>
        );
      })()}

      {/* ==================== DESKTOP VIEW (SPLIT TABLES) ==================== */}
      {currentStage !== 'FINAL' && (
        <div className="hidden md:block space-y-12">
          {effectiveViewMode === 'GROUP' ? (
            sortedGroupEntries.map(([groupName, groupMatches]) => (
              <div key={groupName} className="flex flex-col gap-2 mb-8">
                {/* Headers alinhados horizontalmente */}
                <div className="flex flex-row gap-6 items-end px-2">
                  <div className={currentStage === 'GROUPS' ? "w-[58%]" : "w-full"}>
                    {groupName && (
                      <h2 className="text-yellow-400 text-xl font-bold uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] leading-none">
                        {groupName}
                      </h2>
                    )}
                  </div>
                  {currentStage === 'GROUPS' && (
                    <div className="w-[42%]">
                      <div className="text-xs text-white/50 uppercase font-bold leading-none">Classificação Simulada</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-row gap-6 items-stretch">
                  <div className={currentStage === 'GROUPS' ? "w-[58%] flex flex-col" : "w-full flex flex-col"}>
                    <PixelCard className="p-0 overflow-hidden bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] h-full" colorClass="bg-white">
                      <table className="w-full h-full text-left border-collapse table-fixed">
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
                    <div className="w-[42%] flex flex-col relative">
                      {groupMatches.some(m => saveStatus[m.id] === 'saving') && (
                        <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[1px] transition-opacity">
                          <div className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 text-xs font-bold border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] animate-pulse">
                            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Atualizando...
                          </div>
                        </div>
                      )}
                      <StandingsTable stats={findGroupStandings(groupName, standings)} className="h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]" />
                    </div>
                  )}
                </div>

                {currentStage === 'GROUPS' && !isOfficial && (
                  <div className="mt-2 w-full">
                    <button
                      onClick={() => setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }))}
                      className="w-full text-[10px] md:text-xs bg-gray-800 hover:bg-gray-700 text-yellow-400 px-3 py-2 font-bold uppercase border-2 border-black shadow-[3px_3px_0_rgba(0,0,0,1)] flex justify-between items-center transition-all group"
                    >
                      <span>Resumo de Pontuação ({getGroupTotalScore(groupName, groupMatches).groupTotal} PTS)</span>
                      <span className="text-white group-hover:scale-125 transition-transform">
                        {expandedGroups[groupName] ? '▲' : '▼'}
                      </span>
                    </button>
                    {expandedGroups[groupName] && (
                      <div className="animate-fadeIn mt-2">
                        {renderScoreSummary(groupName, groupMatches)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="space-y-12">
              {sortedDateEntries.map(([date, dateMatches]) => (
                <div key={date} className="flex flex-col gap-2 mb-8">
                  <h2 className="text-yellow-400 text-xl font-bold uppercase drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] leading-none px-2">
                    {getBrasiliaTime(dateMatches[0].date, dateMatches[0].time).fullDate}
                  </h2>
                  <PixelCard className="p-0 overflow-hidden bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]" colorClass="bg-white">
                    <table className="w-full text-left border-collapse table-fixed">
                      <thead>
                        <tr className={`${isOfficial ? 'bg-red-600' : 'bg-blue-600'} text-white text-[10px] uppercase font-bold border-b-4 border-black`}>
                          <th className="p-1 border-r border-black/20 w-[15%] text-center">Horário</th>
                          <th className="p-1 border-r border-black/20 w-[30%] text-right">Time A</th>
                          <th className="p-1 border-r border-black/20 w-[18%] text-center">Placar</th>
                          <th className="p-1 text-left w-[30%]">Time B</th>
                          {!isOfficial && <th className="p-1 border-l border-black/20 w-[10%] text-center">Oficial</th>}
                          {!isOfficial && <th className="p-1 border-l border-black/20 w-[7%] text-center">Pts</th>}
                        </tr>
                      </thead>
                      <tbody className="text-xs font-bold">
                        {dateMatches.map((match) => renderMatchRow(match, true))}
                      </tbody>
                    </table>
                  </PixelCard>
                </div>
              ))}
            </div>
          )}

          {currentStage === 'GROUPS' && effectiveViewMode === 'GROUP' && standings.overallThirds.length > 0 && (
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
      )}

      {currentStage !== 'FINAL' && (
        <div className="block md:hidden">
          <PixelCard className="p-0 overflow-hidden bg-white border-blue-600 !border-2 shadow-none" colorClass="bg-white">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className={`${isOfficial ? 'bg-red-600' : 'bg-blue-600'} text-white text-[8px] uppercase font-bold border-b-2 border-black`}>
                  <th className="p-1 border-r border-black/20 w-[21%] text-center">{effectiveViewMode === 'DATE' ? 'Hora' : 'Data'}</th>
                  <th className="p-1 border-r border-black/20 w-[18%] text-right">Casa</th>
                  <th className="p-1 border-r border-black/20 w-[22%] text-center">Placar</th>
                  <th className="p-1 text-left w-[18%]">Fora</th>
                  {!isOfficial && <th className="p-1 border-l border-black/20 w-[11%] text-center">Real</th>}
                  {!isOfficial && <th className="p-1 border-l border-black/20 w-[10%] text-center">Pts</th>}
                </tr>
              </thead>
              <tbody className="text-[9px] font-bold">
                {(() => {
                  if (effectiveViewMode === 'DATE') {
                    return sortedDateEntries.map(([date, dateMatches]) => {
                      const dayElements = [];
                      dayElements.push(
                        <tr key={`${date}-header`} className="bg-gray-800 text-yellow-400 border-b border-black">
                          <td colSpan={isOfficial ? 4 : 6} className="p-1.5 text-[10px] font-bold text-center tracking-widest uppercase border-t border-black">
                            {getBrasiliaTime(dateMatches[0].date, dateMatches[0].time).fullDate}
                          </td>
                        </tr>
                      );
                      dateMatches.forEach(match => {
                        dayElements.push(renderMatchRow(match, true));
                      });
                      return dayElements;
                    });
                  }

                  const groupMatches = [...filteredMatches].sort((a, b) => a.group.localeCompare(b.group) || a.date.localeCompare(b.date));
                  const elements: React.ReactNode[] = [];
                  let currentGroup = "";
                  let groupMatchList: Match[] = [];

                  groupMatches.forEach((match, idx) => {
                    if (match.group !== currentGroup) {
                      // Classificação + Resumo do grupo anterior
                      if (currentGroup && currentStage === 'GROUPS') {
                        const prevGroup = currentGroup;
                        elements.push(renderMobileStandings(prevGroup, [...groupMatchList]));

                        if (!isOfficial) {
                          const groupToSummarize = prevGroup;
                          const matchesToSummarize = [...groupMatchList];
                          elements.push(
                            <tr key={`${groupToSummarize}-summary`} className="bg-gray-100">
                              <td colSpan={6} className="p-2">
                                <button
                                  onClick={() => setExpandedGroups(prev => ({ ...prev, [groupToSummarize]: !prev[groupToSummarize] }))}
                                  className="w-full text-[9px] bg-gray-800 text-yellow-400 px-2 py-1.5 font-bold uppercase border border-black flex justify-between items-center"
                                >
                                  <span>Resumo de Pontos ({getGroupTotalScore(groupToSummarize, matchesToSummarize).groupTotal} PTS)</span>
                                  <span className="text-white">{expandedGroups[groupToSummarize] ? '▲' : '▼'}</span>
                                </button>
                                {expandedGroups[groupToSummarize] && (
                                  <div className="animate-fadeIn mt-1">
                                    {renderScoreSummary(groupToSummarize, matchesToSummarize)}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        }
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

                    // Last item: classificação + summary
                    if (idx === groupMatches.length - 1 && currentGroup && currentStage === 'GROUPS') {
                      elements.push(renderMobileStandings(currentGroup, [...groupMatchList]));

                      if (!isOfficial) {
                        const groupToSummarize = currentGroup;
                        const matchesToSummarize = [...groupMatchList];
                        elements.push(
                          <tr key={`${groupToSummarize}-summary-last`} className="bg-gray-100">
                            <td colSpan={6} className="p-2">
                              <button
                                onClick={() => setExpandedGroups(prev => ({ ...prev, [groupToSummarize]: !prev[groupToSummarize] }))}
                                className="w-full text-[9px] bg-gray-800 text-yellow-400 px-2 py-1.5 font-bold uppercase border border-black flex justify-between items-center"
                              >
                                <span>Resumo de Pontos ({getGroupTotalScore(groupToSummarize, matchesToSummarize).groupTotal} PTS)</span>
                                <span className="text-white">{expandedGroups[groupToSummarize] ? '▲' : '▼'}</span>
                              </button>
                              {expandedGroups[groupToSummarize] && (
                                <div className="animate-fadeIn mt-1">
                                  {renderScoreSummary(groupToSummarize, matchesToSummarize)}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    }
                  });

                  return elements;
                })()}
              </tbody>
            </table>
          </PixelCard>
        </div>
      )}



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