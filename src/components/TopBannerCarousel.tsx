import React, { useState, useEffect } from 'react';
import { TopBanner } from '../types';
import { api } from '../services/api';
import { ChevronLeft, ChevronRight, Sparkles, Building2, Tag, ArrowRight, ShieldCheck, Gift } from 'lucide-react';

interface TopBannerCarouselProps {
  onRegisterCompany?: () => void;
  onExploreOffers?: () => void;
}

export const TopBannerCarousel: React.FC<TopBannerCarouselProps> = ({
  onRegisterCompany,
  onExploreOffers,
}) => {
  const [banners, setBanners] = useState<TopBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const data = await api.getBanners();
      if (data && data.length > 0) {
        setBanners(data.filter((b) => b.active));
      }
    } catch {
      // Fallback handled in store
    }
  };

  // Autoplay timer
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  const handleCtaClick = () => {
    if (currentBanner.ctaLink === '#cadastrar-empresa') {
      if (onRegisterCompany) onRegisterCompany();
    } else {
      if (onExploreOffers) {
        onExploreOffers();
      } else {
        const el = document.getElementById('ofertas');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-slate-950 border-b border-slate-800"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Banner Slide */}
      <div className="relative min-h-[380px] sm:min-h-[440px] md:min-h-[480px] flex items-center">
        {/* Background Layer */}
        {currentBanner.isImageBanner && currentBanner.imageUrl ? (
          <div className="absolute inset-0 z-0 overflow-hidden">
            <img
              src={currentBanner.imageUrl}
              alt={currentBanner.title}
              className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
            />
            {/* Gradient Overlays for high legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent z-10" />
            <div className="absolute inset-0 bg-blue-950/20 mix-blend-multiply z-10" />
          </div>
        ) : (
          /* Formas e cores do sistema para frases e propagandas do administrador */
          <div
            className={`absolute inset-0 bg-gradient-to-r ${
              currentBanner.bgGradient || 'from-blue-700 via-indigo-800 to-blue-950'
            } z-0 overflow-hidden`}
          >
            {/* Hexagonal and geometric background shapes matching VTXMais branding */}
            <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl" />
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
          </div>
        )}

        {/* Content Container */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="max-w-2xl space-y-4 sm:space-y-5 animate-fadeIn">
            {/* Badge */}
            {currentBanner.badge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-300 font-extrabold text-xs uppercase tracking-wider border border-white/20 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{currentBanner.badge}</span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight font-heading drop-shadow-md">
              {currentBanner.title}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-slate-200 font-medium leading-relaxed drop-shadow-sm max-w-xl">
              {currentBanner.subtitle}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCtaClick}
                className="py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/30 flex items-center gap-2 cursor-pointer hover:scale-102 active:scale-98"
              >
                <span>{currentBanner.ctaText || 'Saiba Mais'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onRegisterCompany}
                className="py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold text-sm border border-white/20 transition flex items-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-blue-300" />
                <span>Cadastrar Minha Empresa</span>
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Controls: Arrows */}
        {banners.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition cursor-pointer shadow-md"
              title="Banner anterior"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition cursor-pointer shadow-md"
              title="Próximo banner"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Carousel Indicators / Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          {banners.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                currentIndex === index
                  ? 'w-7 bg-amber-400 shadow-xs'
                  : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
              title={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
