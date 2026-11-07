import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CreditCard,
  User,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { AdminUser } from '../../types';
import { api } from '../../services/api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AdminUser) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Wizard steps: 'login' | 'complete_profile' | 'change_password'
  const [step, setStep] = useState<'login' | 'complete_profile' | 'change_password'>('login');
  const [tempUser, setTempUser] = useState<AdminUser | null>(null);

  // Login inputs
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  // Complete profile inputs
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpf, setCpf] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [emailProfile, setEmailProfile] = useState('');

  // Change password inputs
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Mask CPF as 000.000.000-00
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) {
      v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
    } else if (v.length > 6) {
      v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
    } else if (v.length > 3) {
      v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
    }
    setCpf(v);
  };

  // Password rules validation
  const ruleMinLength = newPassword.length >= 8;
  const ruleHasNumber = /[0-9]/.test(newPassword);
  const ruleHasUpper = /[A-Z]/.test(newPassword);
  const ruleHasLower = /[a-z]/.test(newPassword);
  const ruleHasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`§¬¢£]/.test(newPassword);
  const ruleMatchesConfirm = newPassword === confirmPassword && confirmPassword.length > 0;
  const isPasswordValid =
    ruleMinLength &&
    ruleHasNumber &&
    ruleHasUpper &&
    ruleHasLower &&
    ruleHasSymbol &&
    ruleMatchesConfirm;

  // Handle Initial Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMsg('Informe o usuário ou e-mail de acesso.');
      return;
    }
    if (!password) {
      setErrorMsg('Informe a senha.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.login(identifier, password);
      const user = res.user;
      setTempUser(user);

      // Check if user requires profile completion or password change
      const missingFields = !user.name || !user.cpf || !user.dataNascimento || !user.email;
      if (user.mustCompleteProfile || missingFields || user.isFirstLogin) {
        // Pre-fill existing data
        if (user.name) setNomeCompleto(user.name);
        if (user.cpf) setCpf(user.cpf);
        if (user.dataNascimento) setDataNascimento(user.dataNascimento);
        if (user.email) setEmailProfile(user.email);

        setStep('complete_profile');
        setSuccessMsg('Primeiro login identificado! Preencha seus dados para continuar.');
      } else if (user.mustChangePassword) {
        setStep('change_password');
        setSuccessMsg('Por segurança, defina uma nova senha para sua conta.');
      } else {
        onSuccess(user);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Credenciais inválidas.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Complete Profile Submission
  const handleCompleteProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;

    if (!nomeCompleto.trim() || nomeCompleto.trim().split(' ').length < 2) {
      setErrorMsg('Informe o Nome Completo com nome e sobrenome.');
      return;
    }
    if (cpf.replace(/\D/g, '').length !== 11) {
      setErrorMsg('Informe um CPF válido com 11 dígitos.');
      return;
    }
    if (!dataNascimento) {
      setErrorMsg('Informe a Data de Nascimento.');
      return;
    }
    if (!emailProfile.trim() || !emailProfile.includes('@')) {
      setErrorMsg('Informe um e-mail válido.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.completeProfile(tempUser.id, {
        name: nomeCompleto.trim(),
        cpf: cpf.trim(),
        dataNascimento: dataNascimento.trim(),
        email: emailProfile.trim(),
      });

      setTempUser(res.user);
      setSuccessMsg('Dados cadastrais salvos com sucesso! Agora configure sua nova senha.');
      setStep('change_password');
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao salvar dados cadastrais.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Change Password Submission
  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;

    if (!isPasswordValid) {
      setErrorMsg('A nova senha não atende a todos os critérios de segurança requeridos.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const res = await api.changePassword(tempUser.id, newPassword);
      setSuccessMsg('Senha alterada com sucesso! Acessando painel administrativo com plenos poderes...');
      setTimeout(() => {
        onSuccess(res.user);
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickLogin = (userLogin: string, userPass: string) => {
    setIdentifier(userLogin);
    setPassword(userPass);
    setErrorMsg('');
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
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs cursor-pointer"
          />

          {/* Animated Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-5"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

        {/* STEP 1: LOGIN */}
        {step === 'login' && (
          <>
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center shadow-md shrink-0">
                <ShieldCheck className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  Acesso ao Painel de Gestão
                </h3>
                <p className="text-xs text-slate-500">
                  Autenticação segura de administradores do Clube VTXMais
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Usuário ou E-mail
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="claudiobh02 ou admin@vtxmais.com.br"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-slate-800 text-white transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4 text-blue-400" />
                <span>{loading ? 'Autenticando...' : 'Entrar no Painel'}</span>
              </button>
            </form>

            {/* Quick Access Presets */}
            <div className="pt-2 border-t border-slate-200 space-y-2">
              <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                <span>Contas configuradas para acesso:</span>
                <span className="text-[10px] text-blue-600 font-bold">Clique para preencher</span>
              </div>

              {/* Claudiobh02 - Main requested user */}
              <button
                type="button"
                onClick={() => fillQuickLogin('claudiobh02', '12345')}
                className="w-full text-left p-3 rounded-2xl border-2 border-indigo-300 bg-gradient-to-r from-indigo-50/80 to-blue-50/80 hover:bg-indigo-100/80 transition flex items-center justify-between cursor-pointer shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-indigo-950">👑 claudiobh02</span>
                    <span className="text-[9px] bg-indigo-600 text-white px-2 py-0.2 rounded-full font-bold uppercase tracking-wider">
                      Plenos Poderes (1º Acesso)
                    </span>
                  </div>
                  <span className="text-[11px] text-indigo-700 font-medium block">
                    Senha inicial: <span className="font-mono font-bold">12345</span> • Cadastro + Troca de senha
                  </span>
                </div>
                <span className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-xl font-bold">
                  Usar
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fillQuickLogin('admin@vtxmais.com.br', 'senha123')}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left cursor-pointer transition"
                >
                  <span className="text-[11px] font-bold text-slate-800 block">Carlos (Admin)</span>
                  <span className="text-[10px] text-slate-500 truncate block">admin@vtxmais.com.br</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickLogin('gestor@vtxmais.com.br', 'senha123')}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left cursor-pointer transition"
                >
                  <span className="text-[11px] font-bold text-slate-800 block">Mariana (Gestor)</span>
                  <span className="text-[10px] text-slate-500 truncate block">gestor@vtxmais.com.br</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* STEP 2: COMPLETE OBLIGATORY PROFILE */}
        {step === 'complete_profile' && (
          <>
            {/* Header with step progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-600">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Passo 1 de 2: Cadastro Obrigatório
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Usuário: {tempUser?.username || tempUser?.id}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-blue-600 rounded-full transition-all duration-300" />
              </div>

              <div className="pt-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  Preenchimento Cadastral Obrigatório
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Para novos administradores no primeiro acesso, é obrigatório informar os dados completos para validação de segurança e conformidade LGPD.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleCompleteProfileSubmit} className="space-y-3.5">
              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Ex: Cláudio Meireles Silva"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>

              {/* CPF */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CPF <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Data de Nascimento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data de Nascimento <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail Oficial / Pessoal <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={emailProfile}
                    onChange={(e) => setEmailProfile(e.target.value)}
                    placeholder="seu.email@empresa.com.br"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{loading ? 'Salvando dados...' : 'Avançar para Alteração de Senha'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        {/* STEP 3: OBLIGATORY PASSWORD CHANGE */}
        {step === 'change_password' && (
          <>
            {/* Header with step progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-600">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  Passo 2 de 2: Nova Senha Obrigatória
                </span>
                <span className="text-[11px] text-slate-400 font-normal">Usuário: {tempUser?.username || tempUser?.id}</span>
              </div>

              {/* Progress bar full */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="w-full h-full bg-emerald-600 rounded-full transition-all duration-300" />
              </div>

              <div className="pt-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 font-heading">
                  Criação da Nova Senha Segura
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A senha temporária (12345) deve ser substituída agora por uma nova senha forte que atenda a todas as regras da política de segurança.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Checklist of required password rules */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="font-bold text-slate-700 text-[11px] uppercase tracking-wider mb-1">
                Requisitos obrigatórios da nova senha:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${ruleMinLength ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${ruleMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Mínimo de 8 caracteres</span>
                </div>

                <div className={`flex items-center gap-1.5 ${ruleHasNumber ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${ruleHasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Ao menos um número (0-9)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${ruleHasUpper ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${ruleHasUpper ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Letra maiúscula (A-Z)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${ruleHasLower ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${ruleHasLower ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Letra minúscula (a-z)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${ruleHasSymbol ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${ruleHasSymbol ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Um símbolo especial (!@#$...)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${ruleMatchesConfirm ? 'text-emerald-700 font-bold' : 'text-slate-500'}`}>
                  <CheckCircle2 className={`w-3.5 h-3.5 ${ruleMatchesConfirm ? 'text-emerald-600' : 'text-slate-300'}`} />
                  <span>Senhas conferem</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha segura"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nova Senha */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isPasswordValid}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Salvando nova senha...' : 'Salvar Senha e Acessar com Plenos Poderes'}</span>
              </button>
            </form>
          </>
        )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
