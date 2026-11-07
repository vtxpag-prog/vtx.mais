import React, { useEffect, useState } from 'react';
import { Partner, AdminUser, CategoryName } from '../../types';
import { api } from '../../services/api';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  ExternalLink,
  MapPin,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
} from 'lucide-react';
import { CATEGORIES_LIST } from '../CategoryBar';
import { formatCep, isValidCep, lookupCep } from '../../utils/geo';

interface PartnersViewProps {
  currentUser: AdminUser;
}

export const PartnersView: React.FC<PartnersViewProps> = ({ currentUser }) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const [formData, setFormData] = useState<{
    name: string;
    logo: string;
    description: string;
    website: string;
    category: CategoryName;
    address: string;
    cep: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    status: 'ativo' | 'inativo';
  }>({
    name: '',
    logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=160&q=80',
    description: '',
    website: 'https://',
    category: 'Comer e Beber' as CategoryName,
    address: 'Av. Paulista, 1000 - Bela Vista',
    cep: '01310-100',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5615,
    longitude: -46.6558,
    status: 'ativo',
  });

  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = currentUser.role !== 'visualizador';

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const data = await api.getPartners();
      setPartners(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    if (!canEdit) return;
    setEditingPartner(null);
    setFormData({
      name: '',
      logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=160&q=80',
      description: '',
      website: 'https://',
      category: 'Comer e Beber',
      address: 'Av. Paulista, 1000 - Bela Vista',
      cep: '01310-100',
      city: 'São Paulo',
      state: 'SP',
      latitude: -23.5615,
      longitude: -46.6558,
      status: 'ativo',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (partner: Partner) => {
    if (!canEdit) return;
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      logo: partner.logo,
      description: partner.description,
      website: partner.website,
      category: partner.category,
      address: partner.address,
      cep: partner.cep,
      city: partner.city,
      state: partner.state,
      latitude: partner.latitude,
      longitude: partner.longitude,
      status: partner.status,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    if (confirm('Tem certeza que deseja remover este parceiro e todas as suas ofertas vinculadas?')) {
      try {
        await api.deletePartner(id);
        setPartners(partners.filter((p) => p.id !== id));
      } catch (err: any) {
        alert(err.message || 'Erro ao deletar parceiro');
      }
    }
  };

  const handleCepBlur = async () => {
    if (isValidCep(formData.cep)) {
      const geo = await lookupCep(formData.cep);
      if (geo) {
        setFormData((prev) => ({
          ...prev,
          city: geo.city,
          state: geo.state,
          latitude: geo.latitude,
          longitude: geo.longitude,
          address: geo.street ? `${geo.street}, ${geo.neighborhood || ''}` : prev.address,
        }));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('O nome do parceiro é obrigatório.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (editingPartner) {
        const updated = await api.updatePartner(editingPartner.id, formData);
        setPartners(partners.map((p) => (p.id === editingPartner.id ? updated : p)));
      } else {
        const created = await api.createPartner(formData as any);
        setPartners([created, ...partners]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar parceiro.');
    } finally {
      setSaving(false);
    }
  };

  const filtered = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome do parceiro, cidade ou categoria..."
            className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Parceiro</span>
          </button>
        )}
      </div>

      {/* Partners Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Parceiro & Logo</th>
                <th className="py-3 px-4">Categoria Principal</th>
                <th className="py-3 px-4">Endereço & CEP</th>
                <th className="py-3 px-4">Website</th>
                <th className="py-3 px-4">Status</th>
                {canEdit && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900 leading-snug">{partner.name}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 max-w-xs">
                          {partner.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{partner.category}</td>
                  <td className="py-3 px-4 text-slate-600">
                    <span className="block truncate max-w-xs">{partner.address}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      CEP: {partner.cep} ({partner.city}/{partner.state})
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span className="truncate max-w-[120px]">{partner.website.replace('https://', '')}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        partner.status === 'ativo'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {partner.status === 'ativo' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {partner.status.toUpperCase()}
                    </span>
                  </td>
                  {canEdit && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(partner)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(partner.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Partner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                {editingPartner ? 'Editar Parceiro' : 'Cadastrar Novo Parceiro'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Estabelecimento / Empresa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Outback Steakhouse"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as CategoryName })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-hidden"
                >
                  {CATEGORIES_LIST.filter((c) => c.name !== 'Todas as Categorias').map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição Curta
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Restaurante com culinária autêntica e chopp artesanal."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Website / Link
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL da Logo
                  </label>
                  <input
                    type="url"
                    value={formData.logo}
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-hidden"
                  />
                </div>
              </div>

              {/* CEP & Address */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Endereço Completo & CEP (Geocodificação)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={formData.cep}
                      onBlur={handleCepBlur}
                      onChange={(e) => setFormData({ ...formData, cep: formatCep(e.target.value) })}
                      placeholder="01310-100"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Endereço (Rua, Número, Bairro)
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Av. Paulista, 1000 - Bela Vista"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={formData.status === 'ativo'}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.checked ? 'ativo' : 'inativo' })
                  }
                  className="w-4 h-4 rounded text-emerald-600"
                />
                <span>Parceiro Ativo na Plataforma</span>
              </label>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingPartner ? 'Atualizar Parceiro' : 'Cadastrar Parceiro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
