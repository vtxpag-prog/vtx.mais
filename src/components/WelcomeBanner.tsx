import React from 'react';

interface WelcomeBannerProps {
  onCtaClick?: () => void;
}

export const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ onCtaClick }) => {
  const handleScroll = () => {
    if (onCtaClick) {
      onCtaClick();
      return;
    }
    const target = document.getElementById('vitrine-ofertas') || document.getElementById('calculadora-cep');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
      <div
        onClick={handleScroll}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleScroll();
          }
        }}
        className="relative group rounded-2xl sm:rounded-3xl overflow-hidden shadow-md sm:shadow-lg border border-slate-200/90 bg-white cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-blue-300/80"
        title="Bem-vindo ao VTXMais de Benefícios - Clique para explorar os descontos"
      >
        {/* Banner Graphic */}
        <img
          src="/banner_vtxmais_welcome.jpg"
          alt="Bem-vindo ao VTXMais de Benefícios - Além das suas expectativas: Aproveite os melhores descontos"
          className="w-full h-auto aspect-[1376/384] object-cover object-center transition-transform duration-500 group-hover:scale-[1.008]"
          referrerPolicy="no-referrer"
          loading="eager"
        />

        {/* Soft interactive hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/15 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>
    </section>
  );
};
