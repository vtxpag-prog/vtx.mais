import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { CategoryName } from '../types';
import {
  Building2,
  X,
  CheckCircle2,
  Send,
  Sparkles,
  Phone,
  Mail,
  User,
  Tag,
  MapPin,
  FileText,
  Percent,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface RegisterCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: CategoryName[] = [
  'Comer e Beber',
  'Compras e Presentes',
  'Cultura e Entretenimento',
  'Educação',
  'Eletrodomésticos e Eletrônicos',
  'Mobilidade',
  'Moda Calçados e Acessórios',
  'Saúde e Beleza',
  'Serviços',
  'Variedades',
  'Viagens e Experiências',
];

export const RegisterCompanyModal: React.FC<RegisterCompanyModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    companyName: '',
    tradeName: '',
    cnpj: '',
    contactName: '',
    email: '',
    phone: '',
    category: 'Comer e Beber' as CategoryName,
    city: 'São Paulo',
    state: 'SP',
    discountProposal: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.companyName.trim()) {
      setError('Informe a Razão Social ou Nome da Empresa.');
      return;
    }
    if (!formData.contactName.trim()) {
      setError('Informe o Nome do Responsável pelo contato.');
      return;
    }
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Informe um E-mail comercial válido.');
      return;
    }
    if (formData.phone.replace(/\D/g, '').length < 8) {
      setError('Informe um Telefone ou WhatsApp com DDD.');
      return;
    }

    try {
      setLoading(true);
      await api.submitAdvertiser({
        companyName: formData.companyName.trim(),
        tradeName: formData.tradeName.trim() || formData.companyName.trim(),
        cnpj: formData.cnpj.trim(),
        contactName: formData.contactName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        category: formData.category,
        city: formData.city.trim(),
        state: formData.state.trim().toUpperCase(),
        discountProposal: formData.discountProposal.trim() || 'A definir em reunião com a equipe VTXMais',
      });

      setSubmitted(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0052cc', '#10b981', '#f59e0b'],
        });
      } catch {}

      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={handleResetAndClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
          />

          {/* Animated Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white p-6 relative">
          <button
            type="button"
            onClick={handleResetAndClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                Parcerias Comerciais VTXMais
              </span>
              <h2 className="text-xl font-bold font-heading text-white">
                Cadastrar Minha Empresa
              </h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Apresente sua marca para milhares de associados do clube e atraia clientes qualificados com ofertas exclusivas.
          </p>
        </div>

        {/* Form Body or Success State */}
        <div className="p-6">
          {submitted ? (
            <div className="text-center py-6 space-y-4 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Proposta Recebida com Sucesso!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Sua empresa foi cadastrada no CRM comercial do Clube VTXMais. Nossa equipe entrará em contato em até <strong>24 horas</strong> via WhatsApp ou E-mail para estruturar sua oferta de boas-vindas.
                </p>
              </div>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-md cursor-pointer"
                >
                  Concluir e Voltar ao Site
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {error}
                </div>
              )}

              {/* Row 1: Company Name & Trade Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Razão Social / Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="Ex: Restaurante Sabor Paulista Ltda"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    placeholder="Ex: Sabor Paulista"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row 2: CNPJ & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    CNPJ (Opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0001-00"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Categoria de Atuação *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryName })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Contact Name & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nome do Responsável *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formData.contactName}
                      onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                      placeholder="Seu nome completo"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Telefone / WhatsApp Comercial *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="(11) 98765-4321"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 4: Email & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    E-mail Comercial *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contato@empresa.com.br"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Cidade / UF
                  </label>
                  <input
                    type="text"
                    value={`${formData.city} - ${formData.state}`}
                    onChange={(e) => {
                      const parts = e.target.value.split('-');
                      setFormData({
                        ...formData,
                        city: parts[0]?.trim() || 'São Paulo',
                        state: parts[1]?.trim() || 'SP',
                      });
                    }}
                    placeholder="São Paulo - SP"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Row 5: Discount Proposal */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Proposta Inicial de Benefício / Desconto para os Associados</span>
                  <span className="text-[10px] text-slate-400 font-normal">Ex: 20% OFF, Cortesia, etc.</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.discountProposal}
                  onChange={(e) => setFormData({ ...formData, discountProposal: e.target.value })}
                  placeholder="Descreva o desconto ou vantagem que deseja conceder aos membros do Clube VTXMais..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs transition shadow-md shadow-blue-900/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Cadastrando empresa...' : 'Enviar Cadastro para Análise Comercial'}</span>
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center">
                Ao enviar este cadastro, sua solicitação entrará automaticamente no Kanban do nosso CRM com SLA de 24h para retorno.
              </p>
            </form>
          )}
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
