
import React, { useMemo } from 'react';
import { Match } from '../types';
import { PixelCard } from './PixelComponents';
import { MyRankingData } from '../services/rankingService';

interface UserScoreViewProps {
  matches: Match[];
  predictions: Record<string, { home: string; away: string }>;
  userRank: number;
  myRanking: MyRankingData;
}

export const UserScoreView: React.FC<UserScoreViewProps> = ({ matches, predictions, userRank, myRanking }) => {
  const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  
  // Compute per-group points
  const groupData = useMemo(() => {
    const data: Record<string, { matches: number, bonus: number }> = {};
    groupLetters.forEach(letter => { data[letter] = { matches: 0, bonus: 0 }; });

    // Match points
    matches.forEach(match => {
      if (match.stage === 'GROUPS') {
        const pts = (myRanking.pointsByMatch || {})[match.id] || 0;
        const letter = match.group.replace('Grupo ', '');
        if (data[letter]) data[letter].matches += pts;
      }
    });

    // Qualified bonus (requires knowing which team belongs to which group)
    // We can infer the group from the matches prop
    const teamToGroup: Record<string, string> = {};
    matches.forEach(m => {
        if (m.stage === 'GROUPS') {
            const letter = m.group.replace('Grupo ', '');
            teamToGroup[m.homeTeam.id] = letter;
            teamToGroup[m.awayTeam.id] = letter;
        }
    });

    (myRanking.correctQualifiedTeamIds || []).forEach(teamId => {
        const letter = teamToGroup[teamId];
        if (letter && data[letter]) {
            data[letter].bonus += 100;
        }
    });

    return data;
  }, [matches, myRanking, groupLetters]);

  const stageLabels: Record<string, string> = {
    'GROUP_STAGE': 'Fase de Grupos',
    'LAST_32': '2ª Fase (32 times)',
    'LAST_16': 'Oitavas de Final',
    'QUARTER_FINALS': 'Quartas de Final',
    'SEMI_FINALS': 'Semifinais',
    'THIRD_PLACE': 'Disputa de 3º Lugar',
    'FINAL': 'Grande Final'
  };

  const getPointColor = (pts: number) => {
    if (pts >= 120) return 'bg-green-500 text-white';
    if (pts >= 90) return 'bg-pink-500 text-white';
    if (pts >= 60) return 'bg-cyan-500 text-white';
    if (pts >= 30) return 'bg-yellow-500 text-black';
    return 'bg-gray-200 text-gray-400';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Total Score Header */}
      <PixelCard className="bg-yellow-400 text-black text-center py-6 border-b-8 border-yellow-600">
        <h2 className="text-[10px] md:text-sm uppercase font-bold mb-2">Pontuação Total</h2>
        <div className="text-4xl md:text-6xl font-bold drop-shadow-[4px_4px_0_rgba(255,255,255,0.5)]">
          {myRanking.totalPoints}
        </div>
        <p className="text-[10px] md:text-xs mt-2 opacity-80 uppercase font-bold tracking-widest bg-black/10 inline-block px-3 py-1">
          Posição no Ranking: #{userRank}
        </p>
      </PixelCard>

      {/* Group Breakdown */}
      <PixelCard className="bg-gray-800 text-white border-blue-500">
        <h3 className="text-xs md:text-base font-bold uppercase mb-4 text-blue-400 flex items-center gap-2">
            Pontos por Grupo (Jogos + Bônus)
        </h3>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {groupLetters.map(letter => {
            const { matches, bonus } = groupData[letter] || { matches: 0, bonus: 0 };
            const total = matches + bonus;
            return (
              <div key={letter} className="bg-gray-900 border-2 border-gray-700 p-2 text-center relative overflow-hidden">
                <div className="text-[10px] text-gray-400 mb-1">{letter}</div>
                <div className={`text-sm md:text-lg font-bold ${total > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                  {total}
                </div>
                {bonus > 0 && <div className="text-[8px] text-green-300/50 mt-1">+{bonus} bônus</div>}
              </div>
            );
          })}
        </div>
      </PixelCard>

      {/* Stage Breakdown */}
      <PixelCard className="bg-gray-100 text-gray-900 border-gray-900">
        <h3 className="text-xs md:text-base font-bold uppercase mb-4 flex items-center gap-2">
            Pontos por Fase
        </h3>
        <div className="space-y-2">
          {Object.keys(stageLabels).map(stageKey => {
            const pts = (myRanking.pointsByStage || {})[stageKey] || 0;
            return (
              <div key={stageKey} className="flex justify-between items-center bg-white border-2 border-gray-300 p-3 hover:border-gray-900 transition-colors">
                <span className="text-[9px] md:text-xs font-bold uppercase">{stageLabels[stageKey]}</span>
                <span className={`text-xs md:text-base font-bold ${getPointColor(pts)} px-3 py-1 border-2 border-black`}>
                  {pts} pts
                </span>
              </div>
            );
          })}
        </div>
      </PixelCard>

      {/* Motivation Text */}
      <div className="text-center py-4">
        <p className="text-yellow-400 text-sm md:text-xl animate-bounce font-bold uppercase tracking-widest drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
          BOLÃO É VIDA
        </p>
      </div>
    </div>
  );
};