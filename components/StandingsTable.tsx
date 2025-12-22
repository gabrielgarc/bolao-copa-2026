
import React from 'react';
import { TeamStats } from '../types';
import { PixelCard, PixelFlag } from './PixelComponents';

interface StandingsTableProps {
  stats: TeamStats[];
}

export const StandingsTable: React.FC<StandingsTableProps> = ({ stats }) => {
  return (
    <PixelCard className="mb-6 p-0 overflow-hidden" colorClass="bg-white">
      <div className="w-full">
        <table className="w-full text-center border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-300 border-b-4 border-gray-900 text-[8px] md:text-xs font-bold text-black">
              <th className="p-1 w-[8%] border-r border-gray-500">#</th>
              <th className="p-1 w-[32%] border-r border-gray-500 text-left pl-2">TIME</th>
              <th className="p-1 w-[10%] border-r border-gray-500 bg-yellow-300">P</th>
              <th className="p-1 w-[10%] border-r border-gray-500">J</th>
              <th className="p-1 w-[10%] border-r border-gray-500">V</th>
              <th className="p-1 w-[10%] border-r border-gray-500">E</th>
              <th className="p-1 w-[10%] border-r border-gray-500">D</th>
              <th className="p-1 w-[10%]">SG</th>
            </tr>
          </thead>
          <tbody className="text-[10px] md:text-sm font-bold text-gray-950">
            {stats.map((row, index) => {
              const isQualifying = index < 2;
              return (
                <tr 
                  key={row.teamId} 
                  className={`border-b-2 border-gray-300 h-10 md:h-12 ${isQualifying ? 'bg-green-100' : 'bg-white'}`}
                >
                  <td className={`border-r border-gray-300 ${isQualifying ? 'text-green-800' : 'text-gray-700'}`}>
                    {index + 1}
                  </td>
                  <td className="border-r border-gray-300 text-left px-1 md:px-2">
                    <div className="flex items-center gap-1 md:gap-2 overflow-hidden">
                      <PixelFlag 
                        team={row.team} 
                        className="w-5 h-3.5 md:w-6 md:h-4 shrink-0 border-black" 
                      />
                      <span className="truncate text-black uppercase">
                        <span className="md:hidden">{row.team.code}</span>
                        <span className="hidden md:inline">{row.team.name}</span>
                      </span>
                    </div>
                  </td>
                  <td className="border-r border-gray-300 bg-yellow-100 text-black">{row.points}</td>
                  <td className="border-r border-gray-300 text-black">{row.played}</td>
                  <td className="border-r border-gray-300 text-green-900">{row.won}</td>
                  <td className="border-r border-gray-300 text-gray-800">{row.drawn}</td>
                  <td className="border-r border-gray-300 text-red-900">{row.lost}</td>
                  <td className={`font-bold ${row.goalDiff > 0 ? 'text-blue-900' : row.goalDiff < 0 ? 'text-red-900' : 'text-gray-800'}`}>
                    {row.goalDiff > 0 ? `+${row.goalDiff}` : row.goalDiff}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PixelCard>
  );
};