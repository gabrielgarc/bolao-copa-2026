import React, { useMemo } from 'react';
import { Match, MatchStage } from '../types';
import { PixelCard } from './PixelComponents';
import { calculatePoints } from '../utils/scoring';

interface UserScoreViewProps {
  matches: Match[];
  predictions: Record<string, { home: string; away: string }>;
  userRank: number;
}

export const UserScoreView: React.FC<UserScoreViewProps> = ({ matches, predictions, userRank }) => {
  const scoreData = useMemo(() => {
    let total = 0;
    const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const groupPoints: Record<string, number> = {};
    
    // Initialize all groups with 0
    groupLetters.forEach(letter => {
      groupPoints[letter] = 0;
    });

    const stagePoints: Record<string, number> = {
        'GROUPS': 0,
        'R32': 0,
        'R16': 0,
        'QF': 0,
        'SF': 0,
        'FINAL': 0
    };

    matches.forEach(match => {
      const pred = predictions[match.id];
      const hasRealResult = match.realHomeScore !== undefined && match.realAwayScore !== undefined;

      if (pred && pred.home !== '' && pred.away !== '' && hasRealResult) {
        const pHome = parseInt(pred.home);
        const pAway = parseInt(pred.away);
        
        if (!isNaN(pHome) && !isNaN(pAway)) {
          const points = calculatePoints(pHome, pAway, match.realHomeScore!, match.realAwayScore!);
          total += points;
          
          // Agrega por Fase
          stagePoints[match.stage] += points;

          // Agrega por Grupo se for fase de grupos
          if (match.stage === 'GROUPS') {
            const letter = match.group.replace('Grupo ', '');
            groupPoints[letter] = (groupPoints[letter] || 0) + points;
          }
        }
      }
    });

    return { total, groupPoints, stagePoints };
  }, [matches, predictions]);

  const stageLabels: Record<string, string> = {
    'GROUPS': 'Fase de Grupos',
    'R32': '2ª Fase (32 times)',
    'R16': 'Oitavas de Final',
    'QF': 'Quartas de Final',
    'SF': 'Semifinais',
    'FINAL': 'Grande Final'
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Total Score Header */}
      <PixelCard className="bg-yellow-400 text-black text-center py-6 border-b-8 border-yellow-600">
        <h2 className="text-[10px] md:text-sm uppercase font-bold mb-2">Pontuação Total</h2>
        <div className="text-4xl md:text-6xl font-bold drop-shadow-[4px_4px_0_rgba(255,255,255,0.5)]">
          {scoreData.total}
        </div>
        <p className="text-[10px] md:text-xs mt-2 opacity-80 uppercase font-bold tracking-widest bg-black/10 inline-block px-3 py-1">
          Posição no Ranking: #{userRank}
        </p>
      </PixelCard>

      {/* Group Breakdown */}
      <PixelCard className="bg-gray-800 text-white border-blue-500">
        <h3 className="text-xs md:text-base font-bold uppercase mb-4 text-blue-400 flex items-center gap-2">
            Grupos
        </h3>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {Object.entries(scoreData.groupPoints).sort().map(([letter, pts]) => (
              <div key={letter} className="bg-gray-900 border-2 border-gray-700 p-2 text-center">
                  <div className="text-[10px] text-gray-400 mb-1">{letter}</div>
                  {/* FIX: Cast pts to number to resolve TypeScript unknown operator error on line 90 */}
                  <div className={`text-sm md:text-lg font-bold ${(pts as number) > 0 ? 'text-green-400' : 'text-gray-600'}`}>
                      {pts as number}
                  </div>
              </div>
          ))}
        </div>
      </PixelCard>

      {/* Stage Breakdown */}
      <PixelCard className="bg-gray-100 text-gray-900 border-gray-900">
        <h3 className="text-xs md:text-base font-bold uppercase mb-4 flex items-center gap-2">
            Por Fases
        </h3>
        <div className="space-y-2">
          {Object.keys(stageLabels).map((stageKey) => {
            const pts = scoreData.stagePoints[stageKey] || 0;
            return (
              <div key={stageKey} className="flex justify-between items-center bg-white border-2 border-gray-300 p-3 hover:border-gray-900 transition-colors">
                <span className="text-[9px] md:text-xs font-bold uppercase">{stageLabels[stageKey]}</span>
                <span className={`text-xs md:text-base font-bold ${pts > 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'} px-3 py-1 border-2 border-black`}>
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
