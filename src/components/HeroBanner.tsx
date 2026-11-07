import React, { useState, useEffect } from 'react';
import { Search, MapPin, Sparkles, CheckCircle2, TrendingUp, Percent, ArrowRight } from 'lucide-react';
import { formatCep, isValidCep } from '../utils/geo';

interface HeroBannerProps {
  userCep: string;
  onSetCep: (cep: string) => void;
  onSearch: (term: string) => void;
  onSelectFilter: (filter: any) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  userCep,
  onSetCep,
  onSearch,
  onSelectFilter,
}) => {
  const [inputCep, setInputCep] = useState(userCep || '');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep input in sync with external userCep state (especially when cleared)
  useEffect(() => {
    setInputCep(userCep || '');
  }, [userCep]);

  const handleApplyCep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCep.trim()) {
      setErrorMsg('Digite um CEP válido com 8 dígitos.');
      return;
    }
    if (!isValidCep(inputCep)) {
      setErrorMsg('Formato de CEP inválido. Ex: 01310-100');
      return;
    }
    setErrorMsg('');
    onSetCep(inputCep);
    onSelectFilter('perto_de_voce');
  };

  return (
    <section id="calculadora-cep" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-4 sm:my-5">
      <div className="relative bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 text-white overflow-hidden rounded-2xl sm:rounded-3xl px-5 sm:px-8 py-5 sm:py-6 border border-blue-800/40 shadow-lg shadow-blue-950/20">
        {/* Subtle glow accents */}
        <div className="absolute -top-12 left-1/4 w-72 h-36 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 right-1/4 w-72 h-36 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6">
          
          {/* Coluna 1: Título e Identidade Compacta */}
          <div className="w-full lg:w-5/12 space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/25">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Economia e vantagens perto de você</span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight font-heading leading-tight">
              Seu Clube Exclusivo de{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                Descontos & Vantagens
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
              Cupons gratuitos nas melhores marcas e parceiros. Digite seu CEP para calcular distâncias e economizar em tempo real.
            </p>
          </div>

          {/* Coluna 2: Calculadora de CEP Rápida (Centro) */}
          <div className="w-full lg:w-4/12">
            <form onSubmit={handleApplyCep} className="w-full">
              <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 flex flex-col sm:flex-row gap-1.5 shadow-md">
                <div className="relative flex-1">
                  <MapPin className="w-4 h-4 text-amber-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={inputCep}
                    onChange={(e) => {
                      setInputCep(formatCep(e.target.value));
                      setErrorMsg('');
                    }}
                    placeholder="Digite seu CEP (Ex: 01310-100)"
                    maxLength={9}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/95 text-slate-900 placeholder:text-slate-500 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Calcular Distância</span>
                </button>
              </div>

              {errorMsg ? (
                <p className="text-[11px] text-rose-300 font-medium mt-1 pl-1">{errorMsg}</p>
              ) : userCep ? (
                <p className="text-[11px] text-emerald-300 font-medium mt-1 pl-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>CEP {formatCep(userCep)} aplicado • Ofertas ordenadas por proximidade</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1 pl-1">
                  Dica: digite seu CEP para ver a distância exata de cada parceiro.
                </p>
              )}
            </form>
          </div>

          {/* Coluna 3: Pílulas de Destaques Rápidos (Compacta) */}
          <div className="w-full lg:w-3/12 grid grid-cols-2 gap-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Percent className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white font-heading leading-none">Até 50%</div>
                <div className="text-[10px] text-slate-300 truncate">Descontos Reais</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white font-heading leading-none">100% Grátis</div>
                <div className="text-[10px] text-slate-300 truncate">Sem Adesão</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white font-heading leading-none">Raio em KM</div>
                <div className="text-[10px] text-slate-300 truncate">Geolocalizado</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white font-heading leading-none">+15.000</div>
                <div className="text-[10px] text-slate-300 truncate">Cupons Salvos</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
