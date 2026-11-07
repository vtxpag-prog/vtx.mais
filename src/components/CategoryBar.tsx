import React from 'react';
import {
  Sparkles,
  Coins,
  Utensils,
  Gift,
  Film,
  GraduationCap,
  Tv,
  Car,
  Shirt,
  HeartPulse,
  Wrench,
  Boxes,
  Plane,
  Grid,
} from 'lucide-react';
import { CategoryName } from '../types';

interface CategoryBarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

interface CategoryItem {
  name: CategoryName | 'Todas as Categorias';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export const CATEGORIES_LIST: CategoryItem[] = [
  { name: 'Todas as Categorias', icon: Grid, color: 'text-slate-700 bg-slate-100' },
  { name: 'Promoções do Mês', icon: Sparkles, color: 'text-amber-600 bg-amber-50' },
  { name: 'Cashback', icon: Coins, color: 'text-emerald-600 bg-emerald-50' },
  { name: 'Comer e Beber', icon: Utensils, color: 'text-orange-600 bg-orange-50' },
  { name: 'Compras e Presentes', icon: Gift, color: 'text-pink-600 bg-pink-50' },
  { name: 'Cultura e Entretenimento', icon: Film, color: 'text-purple-600 bg-purple-50' },
  { name: 'Educação', icon: GraduationCap, color: 'text-blue-600 bg-blue-50' },
  { name: 'Eletrodomésticos e Eletrônicos', icon: Tv, color: 'text-cyan-600 bg-cyan-50' },
  { name: 'Mobilidade', icon: Car, color: 'text-indigo-600 bg-indigo-50' },
  { name: 'Moda Calçados e Acessórios', icon: Shirt, color: 'text-rose-600 bg-rose-50' },
  { name: 'Saúde e Beleza', icon: HeartPulse, color: 'text-teal-600 bg-teal-50' },
  { name: 'Serviços', icon: Wrench, color: 'text-stone-600 bg-stone-100' },
  { name: 'Variedades', icon: Boxes, color: 'text-violet-600 bg-violet-50' },
  { name: 'Viagens e Experiências', icon: Plane, color: 'text-sky-600 bg-sky-50' },
];

export const CategoryBar: React.FC<CategoryBarProps> = ({
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="bg-white border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto py-3 no-scrollbar scroll-smooth">
          {CATEGORIES_LIST.map((item) => {
            const Icon = item.icon;
            const isSelected =
              (item.name === 'Todas as Categorias' && selectedCategory === 'Todos') ||
              selectedCategory === item.name;

            return (
              <button
                key={item.name}
                onClick={() =>
                  onSelectCategory(item.name === 'Todas as Categorias' ? 'Todos' : item.name)
                }
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs scale-[1.02]'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                    isSelected ? 'bg-white/20 text-white' : item.color
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span>{item.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
