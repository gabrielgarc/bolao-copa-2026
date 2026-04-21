
import React from 'react';
import { Match } from '../types';
import { PixelCard, PixelFlag } from './PixelComponents';

interface OfficialMatchCardProps {
  match: Match;
}

export const OfficialMatchCard: React.FC<OfficialMatchCardProps> = ({ match }) => {
  const hasRealResult = match.realHomeScore !== undefined && match.realAwayScore !== undefined;

  return (
    <PixelCard 
      className="mb-3 relative overflow-hidden" 
      colorClass="bg-red-50"
    >
      <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-900 z-10"></div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-900 z-10"></div>
      
      <div className="flex justify-between items-center mb-2 text-[8px] md:text-[10px] uppercase tracking-widest border-b-2 border-red-100 pb-1 text-red-900 font-bold">
        <span>{match.group}</span>
        <span>{match.date.split('/')[0]}/{match.date.split('/')[1]} {match.time}</span>
        <span className="truncate max-w-[80px]">{match.stadium}</span>
      </div>

      <div className="flex items-center justify-between gap-1 md:gap-2">
        <div className="flex flex-col items-center gap-1 w-[35%] overflow-hidden">
          <PixelFlag team={match.homeTeam} className="w-8 h-5 md:w-12 md:h-8" />
          <span className="text-[8px] md:text-xs font-bold text-black text-center uppercase truncate w-full">{match.homeTeam.namePt || match.homeTeam.name}</span>
        </div>

        <div className="flex flex-col items-center justify-center w-[30%] min-w-fit shrink-0">
          {hasRealResult ? (
            <div className="bg-white text-red-900 px-2 py-1.5 md:px-5 md:py-2 border-2 border-red-900 font-bold text-base md:text-2xl shadow-[2px_2px_0_rgba(0,0,0,0.1)] whitespace-nowrap">
              {match.realHomeScore} - {match.realAwayScore}
            </div>
          ) : (
            <div className="text-[10px] md:text-lg text-red-200 font-bold uppercase tracking-widest whitespace-nowrap">
              VS
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 w-[35%] overflow-hidden">
          <PixelFlag team={match.awayTeam} className="w-8 h-5 md:w-12 md:h-8" />
          <span className="text-[8px] md:text-xs font-bold text-black text-center uppercase truncate w-full">{match.awayTeam.namePt || match.awayTeam.name}</span>
        </div>
      </div>
    </PixelCard>
  );
};