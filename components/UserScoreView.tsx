
import React from 'react';
import { PixelCard } from './PixelComponents';
import { MyRankingData } from '../services/rankingService';

interface UserScoreViewProps {
  userRank: number;
  myRanking: MyRankingData;
}

export const UserScoreView: React.FC<UserScoreViewProps> = ({ userRank, myRanking }) => {




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

      {/* Stage Breakdown */}
      <PixelCard className="bg-gray-100 text-gray-900 border-gray-900">
        <h3 className="text-xs md:text-base font-bold uppercase mb-4 flex items-center gap-2">
            Pontos por Fase
        </h3>
        <div className="space-y-2">
          {Object.keys(stageLabels).map((stageKey, idx) => {
            const pts = (myRanking.pointsByStage || {})[stageKey] || 0;
            return (
              <React.Fragment key={stageKey}>
                <div className="flex justify-between items-center bg-white border-2 border-gray-300 p-3 hover:border-gray-900 transition-colors">
                  <span className="text-[9px] md:text-xs font-bold uppercase">{stageLabels[stageKey]}</span>
                  <span className={`text-xs md:text-base font-bold ${getPointColor(pts)} px-3 py-1 border-2 border-black`}>
                    {pts} pts
                  </span>
                </div>
                {/* Insert qualified teams row right after Fase de Grupos (idx 0) */}
                {idx === 0 && (
                  <div className="flex justify-between items-center bg-white border-2 border-yellow-400 p-3 hover:border-gray-900 transition-colors">
                    <span className="text-[9px] md:text-xs font-bold uppercase">
                      🏆 Times Classificados
                      <span className="ml-1 text-gray-400 font-normal normal-case">({myRanking.qualifiedTeamsCount}/32)</span>
                    </span>
                    <span className={`text-xs md:text-base font-bold ${getPointColor(myRanking.qualifiedTeamsCount * 100)} px-3 py-1 border-2 border-black`}>
                      {myRanking.qualifiedTeamsCount * 100} pts
                    </span>
                  </div>
                )}
              </React.Fragment>
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