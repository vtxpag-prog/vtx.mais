import React from 'react';
import { FilterType } from '../types';
import { Flame, Clock, Sparkles, MapPin, LayoutGrid, Heart } from 'lucide-react';

interface FilterTabsProps {
  currentFilter: FilterType;
  onSelectFilter: (filter: FilterType) => void;
  hasUserCep: boolean;
  totalOffers: number;
  favoritesCount?: number;
}

export const FilterTabs: React.FC<FilterTabsProps> = ({
  currentFilter,
  onSelectFilter,
  hasUserCep,
  totalOffers,
  favoritesCount = 0,
}) => {
  const tabs: Array<{ id: FilterType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'todos', label: 'Todos os Benefícios', icon: LayoutGrid },
    { id: 'mais_resgatados', label: 'Mais Resgatados', icon: Flame },
    { id: 'destaques', label: 'Destaques do Clube', icon: Sparkles },
    { id: 'mais_recentes', label: 'Mais Recentes', icon: Clock },
    { id: 'perto_de_voce', label: 'Perto de Você', icon: MapPin },
    { id: 'favoritos', label: 'Favoritos', icon: Heart },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200">
      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentFilter === tab.id;
          const isPerto = tab.id === 'perto_de_voce';
          const isFav = tab.id === 'favoritos';

          return (
            <button
              key={tab.id}
              onClick={() => onSelectFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive
                    ? isFav
                      ? 'text-rose-400 fill-rose-400'
                      : isPerto
                      ? 'text-amber-400'
                      : 'text-blue-400'
                    : isFav
                    ? 'text-rose-500'
                    : isPerto
                    ? 'text-amber-600'
                    : 'text-slate-400'
                }`}
              />
              <span>{tab.label}</span>
              {isFav && favoritesCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                    isActive ? 'bg-rose-500 text-white' : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {favoritesCount}
                </span>
              )}
              {isPerto && hasUserCep && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="CEP Ativo" />
              )}
            </button>
          );
        })}
      </div>

      {/* Counter */}
      <div className="text-xs text-slate-500 font-medium">
        Exibindo <span className="font-bold text-slate-800">{totalOffers}</span> {totalOffers === 1 ? 'oferta disponível' : 'ofertas disponíveis'}
      </div>
    </div>
  );
};
