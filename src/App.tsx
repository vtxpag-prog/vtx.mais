import React, { useState, useEffect } from 'react';
import { Offer, OfferReview, AdminUser, FilterType, CategoryName } from './types';
import { api, sessionService, favoritesService } from './services/api';
import { Header } from './components/Header';
import { WelcomeBanner } from './components/WelcomeBanner';
import { HeroBanner } from './components/HeroBanner';
import { CategoryBar } from './components/CategoryBar';
import { FilterTabs } from './components/FilterTabs';
import { OfferCard } from './components/OfferCard';
import { CouponModal } from './components/CouponModal';
import { VoucherModal } from './components/VoucherModal';
import { CepModal } from './components/CepModal';
import { Footer } from './components/Footer';
import { LegalModals } from './components/LegalModals';
import { NotificationToast } from './components/NotificationToast';
import { notificationService, AppNotification } from './services/notificationService';

// Admin Components
import { LoginModal } from './components/admin/LoginModal';
import { AdminLayout, AdminTab } from './components/admin/AdminLayout';
import { DashboardView } from './components/admin/DashboardView';
import { OffersView } from './components/admin/OffersView';
import { PartnersView } from './components/admin/PartnersView';
import { LeadsView } from './components/admin/LeadsView';
import { CrmView } from './components/admin/CrmView';
import { ReportsView } from './components/admin/ReportsView';
import { UserSavingsSummary } from './components/admin/UserSavingsSummary';
import { VoucherHistoryView } from './components/admin/VoucherHistoryView';
import { WeeklyPushSchedulerView } from './components/admin/WeeklyPushSchedulerView';
import { ReviewsReportView } from './components/admin/ReviewsReportView';
import { PointsFinancialModuleView } from './components/admin/PointsFinancialModuleView';
import { PointsWalletModal } from './components/PointsWalletModal';
import { PartnerPortalValidatorView } from './components/admin/PartnerPortalValidatorView';
import { PartnerSettlementsView } from './components/admin/PartnerSettlementsView';
import { AdvertiserKanbanView } from './components/admin/AdvertiserKanbanView';
import { RegisterCompanyModal } from './components/RegisterCompanyModal';

import { Sparkles, MapPin, Search, ArrowRight, Tag, ShieldCheck, Flame, Compass, Heart, RotateCcw } from 'lucide-react';
import { formatCep } from './utils/geo';

export default function App() {
  // Public state
  const [userCep, setUserCep] = useState<string>(() => sessionService.getSavedCep());
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('todos');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => favoritesService.getFavorites());
  const [isRegisterCompanyModalOpen, setIsRegisterCompanyModalOpen] = useState(false);

  // Auth & Admin state
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    try {
      const stored = localStorage.getItem('vtxmais_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isAdminView, setIsAdminView] = useState<boolean>(false);
  const [adminTab, setAdminTab] = useState<AdminTab>('dashboard');

  // Accessibility High Contrast state
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    try {
      return localStorage.getItem('vtxmais_high_contrast') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vtxmais_high_contrast', String(isHighContrast));
    } catch {}
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [isHighContrast]);

  const handleToggleHighContrast = () => {
    setIsHighContrast((prev) => !prev);
  };

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCepModalOpen, setIsCepModalOpen] = useState(false);
  const [isPointsWalletOpen, setIsPointsWalletOpen] = useState(false);
  const [claimingOffer, setClaimingOffer] = useState<Offer | null>(null);
  const [voucherModal, setVoucherModal] = useState<{
    isOpen: boolean;
    offer: Offer | null;
    couponCode: string;
    leadName: string;
  }>({
    isOpen: false,
    offer: null,
    couponCode: '',
    leadName: '',
  });
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'partner' | null>(null);

  // Active toast for regional notifications
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // Subscribe to real-time notification alerts (from Service Worker & local triggers)
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      setActiveToast(notification);
    });
    return () => unsubscribe();
  }, []);

  // When offers or userCep change, scan for nearby partner offers to alert user
  useEffect(() => {
    if (offers.length > 0 && userCep) {
      notificationService.checkNearbyOffers(offers, userCep);
    }
  }, [offers, userCep]);

  // Handler to open an offer directly from a notification or toast
  const handleOpenOfferFromNotification = async (offerId: string) => {
    if (isAdminView) {
      setIsAdminView(false);
    }

    const found = offers.find((o) => o.id === offerId);
    if (found) {
      setClaimingOffer(found);
      const el = document.getElementById(`offer-${offerId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      try {
        const fetched = await api.getOfferById(offerId);
        if (fetched) {
          setClaimingOffer(fetched);
        }
      } catch (err) {
        console.error('Failed to open offer from notification:', err);
      }
    }
  };

  // Check for shared offer and referral parameters in URL on mount
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sharedOfferId = params.get('offer');
      const refCode = params.get('ref');

      if (sharedOfferId) {
        api.getOfferById(sharedOfferId).then((sharedOffer) => {
          if (sharedOffer) {
            setClaimingOffer(sharedOffer);
            if (refCode) {
              notificationService.dispatchNotification({
                id: `ref_${Date.now()}`,
                title: '🎁 Oferta Compartilhada!',
                body: `Você acessou o benefício de ${sharedOffer.partnerName} (${sharedOffer.discountValue}) indicado por um amigo!`,
                type: 'system',
                offerId: sharedOffer.id,
                partnerName: sharedOffer.partnerName,
                partnerLogo: sharedOffer.partnerLogo,
                discountValue: sharedOffer.discountValue,
                createdAt: new Date().toISOString(),
                read: false,
              });
            }
          }
        }).catch(() => {});
      }
    } catch {}
  }, []);

  // Fetch offers whenever filters, search, or user CEP changes
  useEffect(() => {
    loadOffers();
  }, [searchTerm, selectedCategory, selectedFilter, userCep]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      const res = await api.getOffers({
        search: searchTerm || undefined,
        category: selectedCategory === 'Todos' ? undefined : selectedCategory,
        filter: selectedFilter === 'favoritos' ? 'todos' : selectedFilter,
        cep: userCep || undefined,
      });
      setOffers(res.offers);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = (offerId: string) => {
    const updated = favoritesService.toggleFavorite(offerId);
    setFavoriteIds(updated);
  };

  const handleSetCep = (newCep: string) => {
    setUserCep(newCep);
    sessionService.setSavedCep(newCep);
    notificationService.resetNotifiedCache();
  };

  const handleClearCep = () => {
    setUserCep('');
    sessionService.setSavedCep('');
    notificationService.resetNotifiedCache();
  };

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('Todos');
    setSelectedFilter('todos');
    setUserCep('');
    sessionService.setSavedCep('');
    notificationService.resetNotifiedCache();
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('vtxmais_admin_user', JSON.stringify(user));
    } catch {}
    setIsAdminView(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdminView(false);
    try {
      localStorage.removeItem('vtxmais_admin_user');
    } catch {}
  };

  // Open voucher card
  const handleOpenVoucher = (offer: Offer, couponCode: string, leadName: string) => {
    setClaimingOffer(null);
    setVoucherModal({
      isOpen: true,
      offer,
      couponCode,
      leadName,
    });
  };

  // Callback when a user evaluates an offer after redemption
  const handleReviewSubmitted = (_review: OfferReview, updatedOffer: Offer) => {
    setOffers((prev) =>
      prev.map((o) =>
        o.id === updatedOffer.id
          ? { ...o, rating: updatedOffer.rating, ratingCount: updatedOffer.ratingCount }
          : o
      )
    );
    loadOffers();
  };

  // Filtered subset for display
  const displayedOffers =
    selectedFilter === 'favoritos'
      ? offers.filter((o) => favoriteIds.includes(o.id))
      : offers;

  // Featured Offers subset
  const featuredOffers = offers.filter((o) => o.isFeatured);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* If in Admin View and Logged in */}
      {isAdminView && currentUser ? (
        <AdminLayout
          currentUser={currentUser}
          activeTab={adminTab}
          onSelectTab={setAdminTab}
          onExitAdmin={() => setIsAdminView(false)}
          onLogout={handleLogout}
          isHighContrast={isHighContrast}
          onToggleHighContrast={handleToggleHighContrast}
        >
          {adminTab === 'dashboard' && (
            <DashboardView currentUser={currentUser} onNavigate={setAdminTab} />
          )}
          {adminTab === 'my_savings' && (
            <UserSavingsSummary
              currentUser={currentUser}
              onExploreOffers={() => setIsAdminView(false)}
            />
          )}
          {adminTab === 'voucher_history' && (
            <VoucherHistoryView
              currentUser={currentUser}
              onExploreOffers={() => setIsAdminView(false)}
            />
          )}
          {adminTab === 'offers' && <OffersView currentUser={currentUser} />}
          {adminTab === 'partners' && <PartnersView currentUser={currentUser} />}
          {adminTab === 'partner_portal' && (
            <PartnerPortalValidatorView currentUser={currentUser} />
          )}
          {adminTab === 'partner_settlements' && (
            <PartnerSettlementsView currentUser={currentUser} />
          )}
          {adminTab === 'leads' && <LeadsView currentUser={currentUser} />}
          {adminTab === 'advertisers' && <AdvertiserKanbanView />}
          {adminTab === 'crm' && (
            <CrmView
              currentUser={currentUser}
              onNavigateToLeads={() => setAdminTab('leads')}
            />
          )}
          {adminTab === 'push_schedules' && (
            <WeeklyPushSchedulerView currentUser={currentUser} />
          )}
          {adminTab === 'reports' && <ReportsView currentUser={currentUser} />}
          {adminTab === 'reviews' && <ReviewsReportView currentUser={currentUser} />}
          {adminTab === 'points_financial' && (
            <PointsFinancialModuleView currentUser={currentUser} />
          )}
        </AdminLayout>
      ) : (
        /* ================= PUBLIC CLUB SITE ================= */
        <>
          <Header
            userCep={userCep}
            onOpenCepModal={() => setIsCepModalOpen(true)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            currentUser={currentUser}
            onOpenAdmin={() => setIsAdminView(true)}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onLogout={handleLogout}
            isAdminView={isAdminView}
            onToggleView={setIsAdminView}
            offers={offers}
            onOpenOffer={handleOpenOfferFromNotification}
            isHighContrast={isHighContrast}
            onToggleHighContrast={handleToggleHighContrast}
            onOpenPointsWallet={() => setIsPointsWalletOpen(true)}
            onOpenPartnerSignup={() => setIsRegisterCompanyModalOpen(true)}
            onOpenPartnerPortal={() => {
              setIsAdminView(true);
              setAdminTab('partner_portal');
            }}
          />

          <CategoryBar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Banner de Boas-Vindas Oficial VTXMais (inserido acima do quadro azul) */}
          <WelcomeBanner />

          {/* Quadro Azul de Descontos & Vantagens (largura reduzida) */}
          <HeroBanner
            userCep={userCep}
            onSetCep={handleSetCep}
            onSearch={setSearchTerm}
            onSelectFilter={setSelectedFilter}
          />

          <main id="vitrine-ofertas" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 scroll-mt-6">
            
            {/* Filter Tabs & Offer Count */}
            <FilterTabs
              currentFilter={selectedFilter}
              onSelectFilter={(f) => {
                if (f === 'perto_de_voce' && !userCep) {
                  setIsCepModalOpen(true);
                }
                setSelectedFilter(f);
              }}
              hasUserCep={!!userCep}
              totalOffers={displayedOffers.length}
              favoritesCount={favoriteIds.length}
            />

            {/* Active Filters Summary if filtering */}
            {(searchTerm || selectedCategory !== 'Todos' || userCep || selectedFilter !== 'todos') && (
              <div className="flex flex-wrap items-center gap-2 text-xs bg-slate-100/90 p-3 rounded-2xl border border-slate-200 shadow-2xs animate-fadeIn">
                <span className="font-bold text-slate-700">Filtros ativos:</span>

                {/* Keyword Search Filter Tag */}
                {searchTerm && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50/90 border border-blue-200 text-blue-900 flex items-center gap-1.5 font-medium shadow-2xs">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>Busca: "{searchTerm}"</span>
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer font-bold"
                      title="Remover busca"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {/* Category Filter Tag */}
                {selectedCategory !== 'Todos' && (
                  <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 flex items-center gap-1.5 font-medium shadow-2xs">
                    <span>Categoria: <strong>{selectedCategory}</strong></span>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('Todos')}
                      className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer font-bold"
                      title="Remover filtro de categoria"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {/* Tab Filter Tag */}
                {selectedFilter !== 'todos' && (
                  <span className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 font-medium shadow-2xs ${
                    selectedFilter === 'favoritos'
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  }`}>
                    {selectedFilter === 'favoritos' ? (
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
                    ) : (
                      <Tag className="w-3 h-3 text-indigo-600" />
                    )}
                    <span>
                      {selectedFilter === 'favoritos'
                        ? `Apenas Favoritos (${favoriteIds.length})`
                        : selectedFilter === 'perto_de_voce'
                        ? 'Perto de Você'
                        : selectedFilter === 'mais_resgatados'
                        ? 'Mais Resgatados'
                        : selectedFilter === 'mais_recentes'
                        ? 'Mais Recentes'
                        : 'Destaques do Clube'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedFilter('todos')}
                      className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer font-bold"
                      title="Remover este filtro"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {/* CEP Geolocation Filter Tag */}
                {userCep && (
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 flex items-center gap-1.5 font-medium shadow-2xs">
                    <MapPin className="w-3 h-3 text-blue-600" />
                    <span>Distância para CEP: <strong>{formatCep(userCep)}</strong></span>
                    <button
                      type="button"
                      onClick={() => setIsCepModalOpen(true)}
                      className="text-blue-600 underline font-semibold ml-1 cursor-pointer hover:text-blue-800"
                    >
                      Alterar
                    </button>
                    <button
                      type="button"
                      onClick={handleClearCep}
                      className="text-slate-400 hover:text-slate-700 ml-1 cursor-pointer font-bold"
                      title="Remover CEP ativo"
                    >
                      ✕
                    </button>
                  </span>
                )}

                {/* Clear All Filters Button */}
                <button
                  type="button"
                  onClick={handleClearAllFilters}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 font-bold ml-auto cursor-pointer transition shadow-2xs"
                  title="Limpar busca, categorias, aba e CEP"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar todos os filtros</span>
                </button>
              </div>
            )}

            {/* Section 1: Benefícios em Destaque (if no heavy search filter and featured offers exist and not viewing favorites only) */}
            {selectedFilter === 'todos' && !searchTerm && selectedCategory === 'Todos' && featuredOffers.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 font-heading">
                        Benefícios em Destaque
                      </h2>
                      <p className="text-xs text-slate-500">
                        As ofertas mais procuradas e bem avaliadas pelos membros do clube
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                  {featuredOffers.slice(0, 3).map((offer, index) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      index={index}
                      onClaim={setClaimingOffer}
                      userCep={userCep}
                      isFavorite={favoriteIds.includes(offer.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Section 2: All Filtered Offers */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 font-heading">
                    {selectedFilter === 'favoritos'
                      ? 'Meus Benefícios Favoritos'
                      : selectedFilter === 'perto_de_voce'
                      ? 'Ofertas Perto de Você (Ordenadas por Proximidade)'
                      : selectedFilter === 'mais_resgatados'
                      ? 'Ofertas Mais Resgatadas'
                      : selectedFilter === 'mais_recentes'
                      ? 'Últimos Cupons Lançados'
                      : selectedFilter === 'destaques'
                      ? 'Seleção Exclusiva de Destaques'
                      : selectedCategory !== 'Todos'
                      ? `Ofertas na Categoria: ${selectedCategory}`
                      : 'Todas as Ofertas Disponíveis'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedFilter === 'favoritos'
                      ? 'Ofertas salvas na sua lista para resgate e consulta rápida'
                      : 'Resgate seu voucher gratuito imediatamente sem taxas ou mensalidades'}
                  </p>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-80 bg-white rounded-2xl border border-slate-200 animate-pulse p-4 space-y-4"
                    >
                      <div className="h-40 bg-slate-200 rounded-xl" />
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : selectedFilter === 'favoritos' && displayedOffers.length === 0 ? (
                /* Empty state specific to Favorites */
                <div className="bg-white rounded-3xl border border-rose-100 p-12 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                    <Heart className="w-7 h-7 fill-rose-100 text-rose-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 font-heading">
                      Você ainda não tem ofertas favoritas salvas
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Clique no ícone de coração em qualquer card de oferta para salvá-la e acessá-la rapidamente aqui sempre que quiser.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedFilter('todos')}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-xs hover:bg-blue-700 transition cursor-pointer"
                  >
                    Explorar Todas as Ofertas
                  </button>
                </div>
              ) : displayedOffers.length === 0 ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                    <Compass className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 font-heading">
                      Nenhuma oferta encontrada
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Tente alterar os termos da busca, escolher outra categoria ou redefinir o CEP informado.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ver Todas as Ofertas (Limpar Todos os Filtros)</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                  {displayedOffers.map((offer, index) => (
                    <OfferCard
                      key={offer.id}
                      offer={offer}
                      index={index}
                      onClaim={setClaimingOffer}
                      userCep={userCep}
                      isFavorite={favoriteIds.includes(offer.id)}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  ))}
                </div>
              )}
            </section>

          </main>

          <Footer
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              window.scrollTo({ top: 400, behavior: 'smooth' });
            }}
            onOpenPrivacy={() => setLegalModalType('privacy')}
            onOpenTerms={() => setLegalModalType('terms')}
            onOpenPartnerSignup={() => setIsRegisterCompanyModalOpen(true)}
          />
        </>
      )}

      {/* ================= MODALS ================= */}

      {/* Register Company / Partner B2B Modal */}
      <RegisterCompanyModal
        isOpen={isRegisterCompanyModalOpen}
        onClose={() => setIsRegisterCompanyModalOpen(false)}
        onSuccess={() => {
          setIsRegisterCompanyModalOpen(false);
          alert('Proposta comercial recebida com sucesso! Nossa equipe entrará em contato em até 24h.');
        }}
      />

      {/* Coupon Modal with Lead Capture (THE CORE RULE) */}
      <CouponModal
        offer={claimingOffer}
        userCep={userCep}
        isOpen={!!claimingOffer}
        onClose={() => setClaimingOffer(null)}
        onOpenVoucher={handleOpenVoucher}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Printable / Downloadable Digital Voucher Card */}
      <VoucherModal
        isOpen={voucherModal.isOpen}
        offer={voucherModal.offer}
        couponCode={voucherModal.couponCode}
        leadName={voucherModal.leadName}
        onClose={() => setVoucherModal({ isOpen: false, offer: null, couponCode: '', leadName: '' })}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* CEP Location Setter Modal */}
      <CepModal
        isOpen={isCepModalOpen}
        currentCep={userCep}
        onClose={() => setIsCepModalOpen(false)}
        onSaveCep={handleSetCep}
      />

      {/* Admin Multi-Role Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      {/* Central Points Financial Wallet Modal */}
      <PointsWalletModal
        isOpen={isPointsWalletOpen}
        onClose={() => setIsPointsWalletOpen(false)}
        currentUser={currentUser}
        onSelectOfferToPay={(offer) => {
          setIsPointsWalletOpen(false);
          setClaimingOffer(offer);
        }}
      />

      {/* Legal Modals (Privacy, Terms, Partner Registration) */}
      <LegalModals
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      {/* Real-time Regional Notification Toast */}
      <NotificationToast
        notification={activeToast}
        onClose={() => setActiveToast(null)}
        onOpenOffer={handleOpenOfferFromNotification}
      />
    </div>
  );
}
