import React, { useState } from 'react';
import { Sparkles, Shield, Heart, HelpCircle, FileText, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { CATEGORIES_LIST } from './CategoryBar';

interface FooterProps {
  onSelectCategory: (cat: string) => void;
  onOpenPrivacy: () => void;
  onOpenTerms: () => void;
  onOpenPartnerSignup: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenPrivacy,
  onOpenTerms,
  onOpenPartnerSignup,
}) => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
      {/* Top Banner inside footer */}
      <div className="border-b border-slate-900 bg-slate-900/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-base font-bold text-white font-heading">
              Tem um comércio, restaurante ou serviço? Seja um Parceiro VTXMais
            </h4>
            <p className="text-slate-400 max-w-xl text-xs">
              Conecte sua empresa a milhares de novos clientes na sua região sem custo inicial e aumente o fluxo da sua loja.
            </p>
          </div>
          <button
            onClick={onOpenPartnerSignup}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold text-xs transition shadow-lg shadow-blue-500/10 cursor-pointer shrink-0"
          >
            Cadastrar Minha Empresa
          </button>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden border border-slate-700/50 shadow-xs">
                <img
                  src="/logo_vtx_mais.png"
                  alt="Logo VTXMais"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-lg font-bold text-white tracking-tight font-heading">
                VTX<span className="text-blue-500">MAIS</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Plataforma líder em clube de benefícios, cupons de descontos inteligentes, cashback e geração qualificada de leads para empresas parceiras.
            </p>
            <div className="flex items-center gap-3 text-slate-400 pt-1">
              <div className="flex items-center gap-1.5 text-[11px]">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>LGPD Compliance</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1.5 text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <span>Geolocalização Ativa</span>
              </div>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Categorias Populares
            </h5>
            <ul className="space-y-2">
              {['Promoções do Mês', 'Comer e Beber', 'Eletrodomésticos e Eletrônicos', 'Moda Calçados e Acessórios', 'Saúde e Beleza'].map((c) => (
                <li key={c}>
                  <button
                    onClick={() => onSelectCategory(c)}
                    className="hover:text-white transition cursor-pointer text-left"
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* More Categories */}
          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Outras Categorias
            </h5>
            <ul className="space-y-2">
              {['Cashback', 'Viagens e Experiências', 'Cultura e Entretenimento', 'Educação', 'Mobilidade', 'Serviços'].map((c) => (
                <li key={c}>
                  <button
                    onClick={() => onSelectCategory(c)}
                    className="hover:text-white transition cursor-pointer text-left"
                  >
                    {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional & Contact */}
          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">
              Institucional
            </h5>
            <ul className="space-y-2">
              <li>
                <button onClick={onOpenTerms} className="hover:text-white transition cursor-pointer">
                  Termos e Condições de Uso
                </button>
              </li>
              <li>
                <button onClick={onOpenPrivacy} className="hover:text-white transition cursor-pointer">
                  Política de Privacidade
                </button>
              </li>
              <li>
                <button onClick={onOpenPartnerSignup} className="hover:text-white transition cursor-pointer">
                  Portal do Parceiro
                </button>
              </li>
              <li className="pt-2 text-slate-300 flex items-center gap-1.5 text-[11px]">
                <Phone className="w-3 h-3 text-emerald-400" />
                <span>(11) 4004-9800</span>
              </li>
              <li className="text-slate-300 flex items-center gap-1.5 text-[11px]">
                <Mail className="w-3 h-3 text-blue-400" />
                <span>contato@vtxmais.com.br</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-900 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} VTXMais Clube de Benefícios Ltda. CNPJ: 34.567.890/0001-12. Todos os direitos reservados.
          </div>
          <div className="flex items-center gap-4">
            <span>Desenvolvido com tecnologia e geolocalização nacional</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
