import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, FileText, Building2, CheckCircle2 } from 'lucide-react';
import { CATEGORIES_LIST } from './CategoryBar';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'partner' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);
  const [partnerData, setPartnerData] = useState({
    companyName: '',
    cnpj: '',
    contactName: '',
    email: '',
    phone: '',
    category: 'Comer e Beber',
    cityState: '',
  });

  return (
    <AnimatePresence>
      {type && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs cursor-pointer"
          />

          {/* Animated Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 space-y-4 max-h-[85vh] overflow-y-auto"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

        {/* ================= PRIVACY POLICY ================= */}
        {type === 'privacy' && (
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Política de Privacidade & Proteção de Dados (LGPD)
              </h3>
            </div>

            <p>
              A <strong>VTXMais Clube de Benefícios</strong> preza pela segurança, transparência e confidencialidade dos dados de seus usuários, em total conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).
            </p>

            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              1. Dados Coletados na Liberação do Cupom
            </h4>
            <p>
              Ao solicitar a liberação de um cupom ou oferta exclusiva, solicitamos: Nome Completo, Número de Telefone / WhatsApp, E-mail e Código de Endereçamento Postal (CEP).
            </p>

            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              2. Finalidade do Tratamento
            </h4>
            <p>
              Os dados coletados têm as seguintes finalidades exclusivas:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Validação da autenticidade do resgate do voucher de desconto;</li>
              <li>Envio do código do cupom e instruções de utilização;</li>
              <li>Cálculo de distância em quilômetros até as filiais dos parceiros;</li>
              <li>Sincronização com o CRM das marcas parceiras para controle de utilização do benefício.</li>
            </ul>

            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              3. Seus Direitos como Titular
            </h4>
            <p>
              Você poderá a qualquer momento solicitar a confirmação da existência de tratamento, acesso, correção ou eliminação dos seus dados entrando em contato pelo e-mail <strong>privacidade@vtxmais.com.br</strong>.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Compreendi
              </button>
            </div>
          </div>
        )}

        {/* ================= TERMS OF USE ================= */}
        {type === 'terms' && (
          <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Termos e Condições de Uso do Clube VTXMais
              </h3>
            </div>

            <p>
              Bem-vindo ao <strong>Clube de Benefícios VTXMais</strong>. O acesso e resgate de qualquer oferta nesta plataforma implica na aceitação plena destes termos.
            </p>

            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              1. Gratuidade do Acesso
            </h4>
            <p>
              O resgate de cupons no Clube VTXMais é gratuito para os usuários finais. Não cobramos taxas de emissão de cupom nem assinaturas mensais.
            </p>

            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              2. Validade e Regras das Ofertas
            </h4>
            <p>
              Cada cupom possui regras e prazos de validade estabelecidos pelo parceiro comercial credenciado. O usuário deve apresentar o código do voucher gerado diretamente no estabelecimento ou digitá-lo no checkout do parceiro antes da data limite expressa no voucher.
            </p>

            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
              3. Responsabilidade sobre Produtos e Serviços
            </h4>
            <p>
              A entrega, qualidade, garantia e faturamento dos produtos e serviços são de responsabilidade exclusiva de cada empresa parceira credenciada.
            </p>

            <div className="pt-2 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* ================= PARTNER REGISTRATION ================= */}
        {type === 'partner' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-3">
              <Building2 className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Cadastre sua Empresa como Parceira
                </h3>
                <p className="text-xs text-slate-500">
                  Divulgue suas ofertas para milhares de clientes na sua cidade
                </p>
              </div>
            </div>

            {partnerSubmitted ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-slate-900 font-heading">
                  Proposta Recebida com Sucesso!
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Nossa equipe de credenciamento do Clube VTXMais analisará seus dados e entrará em contato em até 24 horas úteis.
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setPartnerSubmitted(true);
                }}
                className="space-y-3 text-xs"
              >
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nome Fantasia da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerData.companyName}
                    onChange={(e) =>
                      setPartnerData({ ...partnerData, companyName: e.target.value })
                    }
                    placeholder="Ex: Pizzaria Bella Napoli"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      CNPJ *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Categoria
                    </label>
                    <select
                      value={partnerData.category}
                      onChange={(e) =>
                        setPartnerData({ ...partnerData, category: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    >
                      {CATEGORIES_LIST.filter((c) => c.name !== 'Todas as Categorias').map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Nome do Responsável *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nome completo"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      WhatsApp Comercial *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="(11) 99999-9999"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="contato@empresa.com.br"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                  >
                    Enviar Solicitação de Parceria
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
