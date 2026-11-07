import React, { useEffect, useState } from 'react';
import { Offer, Partner, AdminUser, CategoryName } from '../../types';
import { api, sessionService } from '../../services/api';
import { notificationService } from '../../services/notificationService';
import {
  Tag,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calendar,
  Flame,
  X,
  AlertCircle,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { CATEGORIES_LIST } from '../CategoryBar';
import { formatCep, isValidCep, lookupCep } from '../../utils/geo';

interface OffersViewProps {
  currentUser: AdminUser;
}

export const OffersView: React.FC<OffersViewProps> = ({ currentUser }) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    discountValue: string;
    discountType: 'percentage' | 'fixed' | 'cashback' | 'gift';
    couponCode: string;
    category: CategoryName;
    partnerId: string;
    validUntil: string;
    image: string;
    address: string;
    cep: string;
    city: string;
    state: string;
    latitude: number;
    longitude: number;
    isFeatured: boolean;
    status: 'ativo' | 'inativo';
    terms: string;
  }>({
    title: '',
    description: '',
    discountValue: '',
    discountType: 'percentage',
    couponCode: '',
    category: 'Promoções do Mês' as CategoryName,
    partnerId: '',
    validUntil: '2026-12-31',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    address: 'Av. Paulista, 1000 - Bela Vista',
    cep: '01310-100',
    city: 'São Paulo',
    state: 'SP',
    latitude: -23.5615,
    longitude: -46.6558,
    isFeatured: false,
    status: 'ativo',
    terms: 'Válido para 1 resgate por CPF. Apresentar o código no caixa.',
  });

  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = currentUser.role !== 'visualizador';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [offersData, partnersData] = await Promise.all([
        api.getAllOffersAdmin(),
        api.getPartners(),
      ]);
      setOffers(offersData);
      setPartners(partnersData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    if (!canEdit) return;
    setEditingOffer(null);
    setFormData({
      title: '',
      description: '',
      discountValue: '25% OFF',
      discountType: 'percentage',
      couponCode: 'VTX-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
      category: 'Promoções do Mês',
      partnerId: partners[0]?.id || '',
      validUntil: '2026-12-31',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      address: partners[0]?.address || 'Av. Paulista, 1842 - Bela Vista',
      cep: partners[0]?.cep || '01310-200',
      city: partners[0]?.city || 'São Paulo',
      state: partners[0]?.state || 'SP',
      latitude: partners[0]?.latitude || -23.5615,
      longitude: partners[0]?.longitude || -46.6558,
      isFeatured: false,
      status: 'ativo',
      terms: 'Válido até a data limite indicada.',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (offer: Offer) => {
    if (!canEdit) return;
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      discountValue: offer.discountValue,
      discountType: offer.discountType || 'percentage',
      couponCode: offer.couponCode,
      category: offer.category,
      partnerId: offer.partnerId,
      validUntil: offer.validUntil,
      image: offer.image,
      address: offer.address,
      cep: offer.cep,
      city: offer.city,
      state: offer.state,
      latitude: offer.latitude,
      longitude: offer.longitude,
      isFeatured: offer.isFeatured,
      status: offer.status,
      terms: offer.terms,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) return;
    if (confirm('Tem certeza que deseja remover esta oferta?')) {
      try {
        await api.deleteOffer(id);
        setOffers(offers.filter((o) => o.id !== id));
      } catch (err: any) {
        alert(err.message || 'Erro ao deletar oferta');
      }
    }
  };

  const handlePartnerChange = (pId: string) => {
    const selected = partners.find((p) => p.id === pId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        partnerId: pId,
        address: selected.address,
        cep: selected.cep,
        city: selected.city,
        state: selected.state,
        latitude: selected.latitude,
        longitude: selected.longitude,
      }));
    } else {
      setFormData((prev) => ({ ...prev, partnerId: pId }));
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
    if (!formData.title.trim()) {
      setFormError('O título da oferta é obrigatório.');
      return;
    }
    if (!formData.couponCode.trim()) {
      setFormError('O código do cupom é obrigatório.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const selectedPartner = partners.find((p) => p.id === formData.partnerId);

      const payload = {
        ...formData,
        partnerName: selectedPartner?.name || 'Parceiro Credenciado',
        partnerLogo: selectedPartner?.logo || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=160&q=80',
      };

      if (editingOffer) {
        const updated = await api.updateOffer(editingOffer.id, payload);
        setOffers(offers.map((o) => (o.id === editingOffer.id ? updated : o)));
      } else {
        const created = await api.createOffer(payload as any);
        setOffers([created, ...offers]);

        // Alert regional users about new partner offer
        const savedCep = sessionService.getSavedCep() || '01310-100';
        notificationService.dispatchNotification({
          id: `notif_new_${created.id}_${Date.now()}`,
          title: `🎉 Nova Oferta Publicada: ${created.partnerName}!`,
          body: `${created.title} (${created.discountValue}) adicionada para a sua região.`,
          offerId: created.id,
          partnerName: created.partnerName,
          partnerLogo: created.partnerLogo,
          discountValue: created.discountValue,
          distanceKm: created.distanceKm || 1.2,
          userCep: savedCep,
          createdAt: new Date().toISOString(),
          read: false,
          type: 'nearby_offer',
        });
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Falha ao salvar oferta.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered list
  const filteredOffers = offers.filter((o) => {
    const matchesSearch =
      o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.couponCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Todas' || o.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, parceiro ou código..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer focus:outline-hidden"
          >
            <option value="Todas">Todas as Categorias</option>
            {CATEGORIES_LIST.filter((c) => c.name !== 'Todas as Categorias').map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Oferta</span>
          </button>
        )}
      </div>

      {/* Offers Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Oferta & Imagem</th>
                <th className="py-3 px-4">Parceiro</th>
                <th className="py-3 px-4">Desconto / Cupom</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Endereço / CEP</th>
                <th className="py-3 px-4">Resgates</th>
                <th className="py-3 px-4">Status</th>
                {canEdit && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOffers.map((offer) => (
                <tr key={offer.id} className="hover:bg-slate-50/80 transition">
                  {/* Title & Image */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={offer.image}
                        alt={offer.title}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug line-clamp-1">
                          {offer.title}
                        </div>
                        {offer.isFeatured && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900">
                            ★ DESTAQUE
                          </span>
                        )}
                        <span className="block text-[10px] text-slate-400">
                          Validade: {new Date(offer.validUntil).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Partner */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <img
                        src={offer.partnerLogo}
                        alt={offer.partnerName}
                        className="w-6 h-6 rounded-md object-cover border border-slate-200"
                      />
                      <span className="font-semibold text-slate-700">{offer.partnerName}</span>
                    </div>
                  </td>

                  {/* Discount & Code */}
                  <td className="py-3 px-4">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] block w-fit mb-0.5">
                      {offer.discountValue}
                    </span>
                    <span className="font-mono font-bold text-blue-700 text-[11px]">
                      {offer.couponCode}
                    </span>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {offer.category}
                  </td>

                  {/* Address */}
                  <td className="py-3 px-4 text-slate-500 max-w-xs">
                    <span className="block truncate text-[11px]">{offer.address}</span>
                    <span className="text-[10px] text-slate-400 font-mono">CEP: {offer.cep}</span>
                  </td>

                  {/* Saves */}
                  <td className="py-3 px-4 font-bold text-slate-800">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>{offer.savesCount}</span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        offer.status === 'ativo'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {offer.status === 'ativo' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {offer.status.toUpperCase()}
                    </span>
                  </td>

                  {/* Actions */}
                  {canEdit && (
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(offer)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(offer.id)}
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

      {/* Add / Edit Offer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 font-heading">
                {editingOffer ? 'Editar Oferta & Cupom' : 'Cadastrar Nova Oferta'}
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

            <form onSubmit={handleSave} className="space-y-4">
              {/* Partner & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parceiro Vinculado *
                  </label>
                  <select
                    value={formData.partnerId}
                    onChange={(e) => handlePartnerChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-hidden"
                  >
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city}/{p.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoria *
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
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Título da Oferta *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: 30% OFF em Todos os Produtos da Linha Premium"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm font-medium focus:outline-hidden"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Descrição Completa *
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva as vantagens e detalhes do benefício..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-hidden"
                />
              </div>

              {/* Discount Value & Coupon Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Valor do Desconto (Texto Exibido) *
                  </label>
                  <input
                    type="text"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder="Ex: 30% OFF, R$ 150 OFF, Cortesia"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código do Cupom *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.couponCode}
                      onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                      placeholder="Ex: VTX-PROMO30"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold focus:outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          couponCode: 'VTX-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
                        })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-semibold text-slate-700 cursor-pointer"
                    >
                      Gerar
                    </button>
                  </div>
                </div>
              </div>

              {/* Validity & Image */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Período de Validade (Até) *
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL da Imagem da Oferta
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-hidden"
                  />
                </div>
              </div>

              {/* CEP & Address for Geolocation */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Localização para Cálculo de Distância por CEP</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      CEP do Estabelecimento
                    </label>
                    <input
                      type="text"
                      value={formData.cep}
                      onBlur={handleCepBlur}
                      onChange={(e) => setFormData({ ...formData, cep: formatCep(e.target.value) })}
                      placeholder="01310-100"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Av. Paulista, 1842 - Bela Vista"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Terms of use */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Regras e Termos de Uso
                </label>
                <input
                  type="text"
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Ex: Não cumulativo com outras promoções. Válido de segunda a sexta."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:outline-hidden"
                />
              </div>

              {/* Toggles: Featured & Active */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <span>Destacar Oferta na Página Inicial</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.status === 'ativo'}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.checked ? 'ativo' : 'inativo' })
                    }
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <span>Oferta Ativa</span>
                </label>
              </div>

              {/* Submit Buttons */}
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
                  {saving ? 'Salvando...' : editingOffer ? 'Atualizar Oferta' : 'Criar Oferta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
