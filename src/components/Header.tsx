import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, MapPin, ShieldCheck, UserCheck, LogOut, ArrowRight, Tag, Sparkles, PiggyBank, Building2, Store, Trophy, Users, ExternalLink, Contrast, Wallet } from 'lucide-react';
import { AdminUser, Offer } from '../types';
import { formatCep } from '../utils/geo';
import { userCouponsService } from '../services/api';
import { getUserGamificationState } from '../utils/userLevels';
import { NotificationCenter } from './NotificationCenter';
import Fuse from 'fuse.js';

// URL externa configurável para os Grupos Oficiais de Ofertas (defina o link futuro aqui)
export const OFFICIAL_GROUPS_URL = '#';

interface HeaderProps {
  userCep: string;
  onOpenCepModal: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  currentUser: AdminUser | null;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  isAdminView: boolean;
  onToggleView: (toAdmin: boolean) => void;
  offers?: Offer[];
  onOpenOffer?: (offerId: string) => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  onOpenPointsWallet?: () => void;
  onOpenPartnerSignup?: () => void;
  onOpenPartnerPortal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userCep,
  onOpenCepModal,
  searchTerm,
  onSearchChange,
  currentUser,
  onOpenAdmin,
  onOpenLogin,
  onLogout,
  isAdminView,
  onToggleView,
  offers = [],
  onOpenOffer = () => {},
  isHighContrast = false,
  onToggleHighContrast = () => {},
  onOpenPointsWallet = () => {},
  onOpenPartnerSignup = () => {},
  onOpenPartnerPortal = () => {},
}) => {
  const userKey = currentUser?.username || currentUser?.email || currentUser?.id || 'admin';
  const userCoupons = currentUser ? userCouponsService.getRedeemedCoupons(userKey) : [];
  const personalSavings = userCouponsService.calculateTotalSavings(userCoupons);
  const gamification = useMemo(() => {
    return getUserGamificationState(userCoupons, personalSavings);
  }, [userCoupons, personalSavings]);

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Configure Fuse.js index for offers
  const fuse = useMemo(() => {
    if (!offers || offers.length === 0) return null;
    return new Fuse(offers, {
      keys: [
        { name: 'partnerName', weight: 0.4 },
        { name: 'category', weight: 0.25 },
        { name: 'title', weight: 0.25 },
        { name: 'description', weight: 0.1 },
      ],
      threshold: 0.45, // Tolerates minor typos like 'outbak', 'samsug', 'cinem'
      ignoreLocation: true,
      minMatchCharLength: 2,
    });
  }, [offers]);

  // Compute fuzzy suggestions when searchTerm has at least 2 chars
  const fuzzySuggestions = useMemo(() => {
    if (!fuse || !searchTerm || searchTerm.trim().length < 2) return [];
    return fuse.search(searchTerm.trim()).slice(0, 5).map((r) => r.item);
  }, [fuse, searchTerm]);

  // Extract unique partner names matched
  const matchedPartners = useMemo(() => {
    const set = new Set<string>();
    fuzzySuggestions.forEach((o) => set.add(o.partnerName));
    return Array.from(set).slice(0, 3);
  }, [fuzzySuggestions]);

  // Extract unique categories matched
  const matchedCategories = useMemo(() => {
    const set = new Set<string>();
    fuzzySuggestions.forEach((o) => set.add(o.category));
    return Array.from(set).slice(0, 2);
  }, [fuzzySuggestions]);

  // Handler para redirecionamento ao site externo de grupos
  const handleOpenOfficialGroups = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (OFFICIAL_GROUPS_URL === '#' || !OFFICIAL_GROUPS_URL) {
      e.preventDefault();
      alert('Em breve: Você será redirecionado para os Grupos Oficiais de Ofertas (WhatsApp / Telegram).');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white text-xs py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
              NOVIDADE
            </span>
            <span>Clube de Vantagens Oficial VTXMais: Cupons exclusivos com até 50% de desconto</span>
          </div>

          <div className="flex items-center gap-3 text-slate-300">
            {/* Link para cadastro de parceiro/empresa */}
            <button
              type="button"
              onClick={onOpenPartnerSignup}
              className="hidden lg:inline-flex items-center gap-1 hover:text-white transition cursor-pointer font-medium text-[11px] text-blue-200 hover:underline"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Seja um Parceiro</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-3">
                {/* Meus Pontos badge */}
                <button
                  type="button"
                  onClick={onOpenPointsWallet}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/25 hover:bg-blue-500/40 text-blue-300 font-bold border border-blue-500/40 transition cursor-pointer text-[11px]"
                  title="Abrir Carteira Digital de Pontos VTXMais"
                >
                  <Wallet className="w-3.5 h-3.5 text-blue-400" />
                  <span>Meus Pontos</span>
                </button>

                {/* Personal savings badge */}
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/25 hover:bg-emerald-500/40 text-emerald-300 font-bold border border-emerald-500/40 transition cursor-pointer text-[11px]"
                  title="Ver extrato completo de economia dos seus cupons resgatados"
                >
                  <PiggyBank className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Economia: R$ {personalSavings.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </button>

                {/* Gamification Level Badge */}
                <button
                  type="button"
                  onClick={onOpenAdmin}
                  className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border transition cursor-pointer hover:brightness-110 ${gamification.currentLevel.tagClass}`}
                  title={`Nível do Clube: ${gamification.currentLevel.badgeTitle} (${gamification.couponsCount} cupons)`}
                >
                  <span>{gamification.currentLevel.badgeEmoji}</span>
                  <span>{gamification.currentLevel.name}</span>
                </button>

                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  {currentUser.name || currentUser.username} ({currentUser.role.toUpperCase()})
                </span>
                <button
                  onClick={onLogout}
                  className="hover:text-white underline cursor-pointer text-[11px]"
                  title="Sair da sessão administrativa"
                >
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="hover:text-white transition flex items-center gap-1 cursor-pointer font-medium"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
                Acesso Administrativo
              </button>
            )}

            {/* Botão de Acessibilidade: Alto Contraste no Topo */}
            <button
              type="button"
              onClick={onToggleHighContrast}
              aria-pressed={isHighContrast}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                isHighContrast
                  ? 'bg-yellow-400 text-black border-yellow-300 ring-2 ring-yellow-400'
                  : 'bg-white/10 hover:bg-white/20 text-slate-200 border-white/20'
              }`}
              title={isHighContrast ? 'Desativar Modo de Alto Contraste' : 'Ativar Modo de Alto Contraste (Acessibilidade Visual)'}
            >
              <Contrast className="w-3.5 h-3.5" />
              <span>{isHighContrast ? 'Contraste: ON' : 'Alto Contraste'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Platform Title */}
          <div className="flex items-center justify-between">
            <div 
              onClick={() => onToggleView(false)}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 p-1 shadow-sm group-hover:scale-105 transition-transform flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src="/logo_vtx_mais.png"
                  alt="Logo VTXMais Clube de Benefícios"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-slate-900 font-heading">
                    VTX<span className="text-blue-600">MAIS</span>
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase tracking-wider">
                    Clube
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Benefícios, Cupons & Cashback
                </p>
              </div>
            </div>

            {/* Mobile View Toggle & Notifications */}
            <div className="md:hidden flex items-center gap-1.5 sm:gap-2">
              {/* Botão Mobile Alto Contraste */}
              <button
                type="button"
                onClick={onToggleHighContrast}
                aria-pressed={isHighContrast}
                className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold border transition shrink-0 ${
                  isHighContrast
                    ? 'bg-yellow-400 text-black border-yellow-400 font-extrabold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title={isHighContrast ? 'Desativar Modo de Alto Contraste' : 'Ativar Modo de Alto Contraste'}
              >
                <Contrast className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{isHighContrast ? 'Contraste ON' : 'Contraste'}</span>
              </button>

              <a
                href={OFFICIAL_GROUPS_URL}
                onClick={handleOpenOfficialGroups}
                target={OFFICIAL_GROUPS_URL !== '#' ? '_blank' : undefined}
                rel={OFFICIAL_GROUPS_URL !== '#' ? 'noopener noreferrer' : undefined}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition shrink-0 shadow-xs"
                title="Grupos Oficiais de Ofertas"
              >
                <Users className="w-3.5 h-3.5 text-emerald-100" />
                <span className="hidden xs:inline">Grupos</span>
              </a>

              {/* Botão Mobile Carteira de Pontos */}
              <button
                type="button"
                onClick={onOpenPointsWallet}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition shrink-0 shadow-xs cursor-pointer"
                title="Minha Carteira de Pontos VTXMais"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Pontos</span>
              </button>

              <NotificationCenter
                userCep={userCep}
                onOpenCepModal={onOpenCepModal}
                onOpenOffer={onOpenOffer}
                offers={offers}
              />
              {isAdminView ? (
                <button
                  onClick={() => onToggleView(false)}
                  className="text-xs bg-slate-100 px-2.5 py-1.5 rounded-lg font-medium text-slate-700"
                >
                  Ver Site
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (currentUser) {
                      onToggleView(true);
                    } else {
                      onOpenLogin();
                    }
                  }}
                  className="text-xs bg-blue-600 text-white px-2.5 py-1.5 rounded-lg font-medium"
                >
                  Admin
                </button>
              )}
            </div>
          </div>

          {/* Search Bar & CEP Locator */}
          {!isAdminView && (
            <div className="flex-1 max-w-2xl flex flex-col sm:flex-row items-stretch gap-2">
              {/* CEP Button */}
              <button
                type="button"
                onClick={onOpenCepModal}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition text-left cursor-pointer shrink-0 ${
                  userCep
                    ? 'bg-blue-50/80 border-blue-200 text-blue-800 hover:bg-blue-100'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900 hover:bg-amber-100'
                }`}
                title="Alterar CEP para calcular distância das ofertas"
              >
                <MapPin className={`w-4 h-4 shrink-0 ${userCep ? 'text-blue-600' : 'text-amber-600'}`} />
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider leading-none">
                    Sua Localização
                  </div>
                  <div className="font-semibold leading-tight">
                    {userCep ? `CEP ${formatCep(userCep)}` : 'Informar CEP'}
                  </div>
                </div>
              </button>

              {/* Keyword Search with Fuse.js Fuzzy Suggestions */}
              <div ref={searchContainerRef} className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  placeholder="Buscar marcas, parceiros, tecnologia, restaurantes (busca fuzzy)..."
                  className="w-full pl-10 pr-8 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      onSearchChange('');
                      setIsDropdownOpen(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                  >
                    ✕
                  </button>
                )}

                {/* Fuzzy Search Suggestions Dropdown */}
                {isDropdownOpen && searchTerm.trim().length >= 2 && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200/90 z-50 overflow-hidden divide-y divide-slate-100 animate-fadeIn">
                    {/* Header with Fuzzy Badge */}
                    <div className="px-3.5 py-2 bg-slate-50 flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        Busca Inteligente (Tolerante a erros)
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full">
                        {fuzzySuggestions.length} {fuzzySuggestions.length === 1 ? 'resultado' : 'resultados'}
                      </span>
                    </div>

                    {/* Matched Partners quick pills */}
                    {matchedPartners.length > 0 && (
                      <div className="p-2.5 bg-blue-50/40 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mr-1">
                          Parceiros:
                        </span>
                        {matchedPartners.map((partner) => (
                          <button
                            key={partner}
                            type="button"
                            onClick={() => {
                              onSearchChange(partner);
                              setIsDropdownOpen(false);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-blue-900 text-xs font-bold hover:bg-blue-600 hover:text-white transition cursor-pointer shadow-2xs"
                          >
                            <Building2 className="w-3 h-3" />
                            <span>{partner}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Matched Offers list */}
                    {fuzzySuggestions.length > 0 ? (
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {fuzzySuggestions.map((offer) => (
                          <button
                            key={offer.id}
                            type="button"
                            onClick={() => {
                              onSearchChange(offer.partnerName);
                              setIsDropdownOpen(false);
                            }}
                            className="w-full text-left p-3 hover:bg-slate-50 transition flex items-center justify-between gap-3 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={offer.partnerLogo}
                                alt={offer.partnerName}
                                className="w-9 h-9 rounded-xl object-cover border border-slate-100 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition truncate">
                                  {offer.partnerName}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  {offer.title}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg shrink-0">
                              {offer.discountValue}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        Nenhum resultado aproximado para "{searchTerm}". Tente outro termo.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Botão de Acessibilidade: Modo de Alto Contraste */}
            <button
              type="button"
              onClick={onToggleHighContrast}
              aria-pressed={isHighContrast}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border shrink-0 ${
                isHighContrast
                  ? 'bg-yellow-400 text-black border-yellow-400 ring-2 ring-yellow-400 font-extrabold'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300/80 hover:border-slate-400'
              }`}
              title={
                isHighContrast
                  ? 'Desativar Modo de Alto Contraste'
                  : 'Ativar Modo de Alto Contraste (Acessibilidade para Usuários com Deficiência Visual)'
              }
            >
              <Contrast className={`w-3.5 h-3.5 ${isHighContrast ? 'text-black' : 'text-slate-700'}`} />
              <span>{isHighContrast ? 'Alto Contraste: ON' : 'Alto Contraste'}</span>
            </button>

            {/* Botão Grupos Oficiais de Ofertas (Link externo futuro) */}
            <a
              href={OFFICIAL_GROUPS_URL}
              onClick={handleOpenOfficialGroups}
              target={OFFICIAL_GROUPS_URL !== '#' ? '_blank' : undefined}
              rel={OFFICIAL_GROUPS_URL !== '#' ? 'noopener noreferrer' : undefined}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs hover:shadow-md cursor-pointer group shrink-0"
              title="Acessar os Grupos Oficiais de Ofertas e Descontos VTXMais"
            >
              <Users className="w-3.5 h-3.5 text-emerald-100 group-hover:scale-110 transition-transform" />
              <span>Grupos Oficiais de Ofertas</span>
              <ExternalLink className="w-3 h-3 text-emerald-200 opacity-80" />
            </a>

            {/* Botão Desktop Carteira de Pontos */}
            <button
              type="button"
              onClick={onOpenPointsWallet}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all shadow-xs hover:shadow-md cursor-pointer shrink-0"
              title="Acessar Minha Carteira de Pontos VTXMais"
            >
              <Wallet className="w-3.5 h-3.5 text-blue-100" />
              <span>Pontos</span>
            </button>

            {/* Botão Desktop Portal do Lojista (Validador POS) */}
            <button
              type="button"
              onClick={onOpenPartnerPortal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all shadow-xs cursor-pointer shrink-0"
              title="Acessar Terminal de Validação de Cupons do Estabelecimento (POS)"
            >
              <Store className="w-3.5 h-3.5 text-blue-600" />
              <span>Portal Lojista (POS)</span>
            </button>

            {/* Regional Notification Center */}
            <NotificationCenter
              userCep={userCep}
              onOpenCepModal={onOpenCepModal}
              onOpenOffer={onOpenOffer}
              offers={offers}
            />

            {isAdminView ? (
              <button
                onClick={() => onToggleView(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-800 hover:bg-slate-200 transition cursor-pointer border border-slate-300/80"
              >
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                Ver Clube Público
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (currentUser) {
                      onToggleView(true);
                    } else {
                      onOpenLogin();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  Painel de Gestão
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
