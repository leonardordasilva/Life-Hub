import React from 'react';
import { SectionCardProps } from '../types';
import { ArrowRight } from 'lucide-react';

export const MenuCard: React.FC<SectionCardProps> = ({ title, description, icon, onClick, colorClass }) => {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-white/10 bg-white/5 backdrop-blur-md ${colorClass}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="mb-6 inline-block rounded-xl bg-white/10 p-3 w-fit text-white backdrop-blur-sm group-hover:bg-white/20 transition-colors">
          {icon}
        </div>
        
        <div>
          <h3 className="mb-2 text-2xl font-bold text-white tracking-tight">
            {title}
          </h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {description}
          </p>
          
          <div className="flex items-center text-sm font-semibold text-white/70 group-hover:text-white transition-colors">
            <span>Acessar Módulo</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </div>
      
      {/* Decorative gradient orb in background */}
      <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-current opacity-20 blur-3xl group-hover:opacity-30 transition-opacity" />
    </button>
  );
};
