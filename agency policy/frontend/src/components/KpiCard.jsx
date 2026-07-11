import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const KpiCard = ({ title, value, icon: Icon, change, changeType, subtext }) => {
  const isPositive = changeType === 'positive';
  
  return (
    <div className="bg-[#121212] border border-[#27272A] rounded-xl p-6 hover:border-[#52525B] transition-colors duration-200 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-neutral-400">{title}</span>
        {Icon && (
          <div className="p-2 bg-[#1A1A1A] rounded-lg border border-[#27272A]">
            <Icon className="h-4.5 w-4.5 text-neutral-400 stroke-[1.5]" />
          </div>
        )}
      </div>

      <div>
        <h3 className="text-2xl md:text-3xl font-bold font-heading text-white leading-none mb-2">
          {value}
        </h3>
        
        <div className="flex items-center gap-1.5 mt-2">
          {change !== undefined && (
            <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded ${
              isPositive 
                ? 'bg-emerald-500/10 text-[#10B981]' 
                : 'bg-rose-500/10 text-[#EF4444]'
            }`}>
              {isPositive ? (
                <ArrowUpRight className="h-3.5 w-3.5 stroke-[2]" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 stroke-[2]" />
              )}
              {change}%
            </span>
          )}
          <span className="text-xs text-neutral-500">{subtext}</span>
        </div>
      </div>
    </div>
  );
};

export default KpiCard;
