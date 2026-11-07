import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { formatCep, isValidCep } from '../utils/geo';
import { api } from '../services/api';

interface CepModalProps {
  isOpen: boolean;
  currentCep: string;
  onClose: () => void;
  onSaveCep: (cep: string) => void;
}

export const CepModal: React.FC<CepModalProps> = ({
  isOpen,
  currentCep,
  onClose,
  onSaveCep,
}) => {
  const [cepInput, setCepInput] = useState(currentCep || '');
  const [loading, setLoading] = useState(false);
  const [locationPreview, setLocationPreview] = useState<{
    city?: string;
    state?: string;
    neighborhood?: string;
    street?: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLookup = async (cepVal: string) => {
    if (!isValidCep(cepVal)) {
      setErrorMsg('Informe um CEP válido com 8 números.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const data = await api.getCep(cepVal);
      setLocationPreview({
        city: data.city,
        state: data.state,
        neighborhood: data.neighborhood,
        street: data.street,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Não foi possível encontrar o CEP.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!isValidCep(cepInput)) {
      setErrorMsg('Digite um CEP válido com 8 números.');
      return;
    }
    onSaveCep(cepInput);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs cursor-pointer"
          />

          {/* Animated Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 p-6 space-y-4"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 font-heading">
                  Sua Localização por CEP
                </h3>
                <p className="text-xs text-slate-500">
                  Calcule a distância exata em km até os parceiros e lojas
                </p>
              </div>
            </div>

        {/* Form */}
        <div className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Digite seu CEP
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cepInput}
                onChange={(e) => {
                  const formatted = formatCep(e.target.value);
                  setCepInput(formatted);
                  setErrorMsg('');
                  if (isValidCep(formatted)) {
                    handleLookup(formatted);
                  }
                }}
                placeholder="Ex: 01310-100"
                maxLength={9}
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleLookup(cepInput)}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Buscando...' : 'Verificar'}
              </button>
            </div>
            {errorMsg && (
              <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </p>
            )}
          </div>

          {/* Quick example presets */}
          <div className="pt-1">
            <div className="text-[11px] text-slate-400 font-medium mb-1.5">
              Exemplos de capitais para teste:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'São Paulo (Paulista)', cep: '01310-100' },
                { name: 'Rio de Janeiro (Copacabana)', cep: '22041-001' },
                { name: 'Belo Horizonte (Savassi)', cep: '30140-071' },
                { name: 'Curitiba (Batel)', cep: '80420-000' },
                { name: 'Brasília (Asa Sul)', cep: '70340-000' },
              ].map((ex) => (
                <button
                  key={ex.cep}
                  type="button"
                  onClick={() => {
                    setCepInput(ex.cep);
                    handleLookup(ex.cep);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer font-medium"
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>

          {/* Preview result */}
          {locationPreview && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Endereço Localizado:</span>
              </div>
              <p className="pl-5 text-emerald-700">
                {locationPreview.street ? `${locationPreview.street}, ` : ''}
                {locationPreview.neighborhood ? `${locationPreview.neighborhood} - ` : ''}
                <strong>{locationPreview.city}/{locationPreview.state}</strong>
              </p>
            </div>
          )}

          {/* Confirm and Clear Buttons */}
          <div className="pt-2 flex items-center justify-between gap-2">
            {currentCep ? (
              <button
                type="button"
                onClick={() => {
                  onSaveCep('');
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              >
                Remover CEP
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition cursor-pointer"
              >
                Confirmar e Atualizar Distâncias
              </button>
            </div>
          </div>
        </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
