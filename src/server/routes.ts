import { Router, Request, Response } from 'express';
import path from 'path';
import { appStore } from './store';
import { crmService } from './crmService';
import { lookupCep, isValidCep } from '../utils/geo';
import { FilterType, AdminUser } from '../types';
import { getDatabaseSchemaMetadata } from './db/schema';

export const apiRouter = Router();

// ===================== CEP RESOLUTION =====================
apiRouter.get('/cep/:cep', async (req: Request, res: Response) => {
  const { cep } = req.params;
  if (!isValidCep(cep)) {
    return res.status(400).json({ error: 'CEP inválido. Deve conter 8 dígitos.' });
  }

  const result = await lookupCep(cep);
  if (!result) {
    return res.status(404).json({ error: 'CEP não encontrado.' });
  }

  return res.json(result);
});

// ===================== OFFERS =====================
apiRouter.get('/offers', async (req: Request, res: Response) => {
  try {
    const { search, category, filter, cep, lat, lng } = req.query;

    let userLat: number | undefined = lat ? parseFloat(lat as string) : undefined;
    let userLng: number | undefined = lng ? parseFloat(lng as string) : undefined;

    if (cep && (!userLat || !userLng)) {
      try {
        const cepInfo = await lookupCep(cep as string);
        if (cepInfo) {
          userLat = cepInfo.latitude;
          userLng = cepInfo.longitude;
        }
      } catch (cepErr) {
        console.warn('CEP lookup error in /offers:', cepErr);
      }
    }

    const offers = appStore.getOffers({
      search: search as string,
      category: category as string,
      filter: filter as FilterType,
      userCep: cep as string,
      userLat,
      userLng,
    });

    return res.json({
      total: offers.length,
      userLocation: userLat && userLng ? { lat: userLat, lng: userLng, cep } : null,
      offers,
    });
  } catch (err: any) {
    console.error('Error fetching offers in apiRouter:', err);
    return res.status(500).json({ error: 'Erro ao carregar ofertas', details: err?.message });
  }
});

apiRouter.get('/offers/all', (req: Request, res: Response) => {
  const offers = appStore.getAllOffersAdmin();
  return res.json(offers);
});

apiRouter.get('/offers/:id', (req: Request, res: Response) => {
  const offer = appStore.getOfferById(req.params.id);
  if (!offer) return res.status(404).json({ error: 'Oferta não encontrada.' });
  return res.json(offer);
});

apiRouter.post('/offers/:id/view', (req: Request, res: Response) => {
  appStore.incrementView(req.params.id);
  return res.json({ success: true });
});

apiRouter.post('/offers', (req: Request, res: Response) => {
  try {
    const newOffer = appStore.addOffer(req.body);
    return res.status(201).json(newOffer);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/offers/:id', (req: Request, res: Response) => {
  const updated = appStore.updateOffer(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Oferta não encontrada.' });
  return res.json(updated);
});

apiRouter.delete('/offers/:id', (req: Request, res: Response) => {
  const success = appStore.deleteOffer(req.params.id);
  if (!success) return res.status(404).json({ error: 'Oferta não encontrada.' });
  return res.json({ success: true });
});

// ===================== PARTNERS =====================
apiRouter.get('/partners', (req: Request, res: Response) => {
  const partners = appStore.getPartners();
  return res.json(partners);
});

apiRouter.get('/partners/:id', (req: Request, res: Response) => {
  const partner = appStore.getPartnerById(req.params.id);
  if (!partner) return res.status(404).json({ error: 'Parceiro não encontrado.' });
  return res.json(partner);
});

apiRouter.post('/partners', (req: Request, res: Response) => {
  try {
    const newPartner = appStore.addPartner(req.body);
    return res.status(201).json(newPartner);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/partners/:id', (req: Request, res: Response) => {
  const updated = appStore.updatePartner(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Parceiro não encontrado.' });
  return res.json(updated);
});

apiRouter.delete('/partners/:id', (req: Request, res: Response) => {
  const success = appStore.deletePartner(req.params.id);
  if (!success) return res.status(404).json({ error: 'Parceiro não encontrado.' });
  return res.json({ success: true });
});

// ===================== LEADS & COUPON CLAIM =====================
apiRouter.post('/leads', async (req: Request, res: Response) => {
  const { name, phone, email, offerId, userCep } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Nome completo é obrigatório.' });
  }
  if (!phone || !phone.trim() || phone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ error: 'Telefone/WhatsApp válido é obrigatório.' });
  }
  if (!email || !email.includes('@') || !email.includes('.')) {
    return res.status(400).json({ error: 'E-mail válido é obrigatório.' });
  }
  if (!offerId) {
    return res.status(400).json({ error: 'Identificador da oferta não informado.' });
  }

  try {
    const result = await appStore.captureLead({
      name,
      phone,
      email,
      offerId,
      userCep,
    });

    return res.status(201).json({
      success: true,
      message: 'Obrigado! Seu cupom foi liberado com sucesso.',
      lead: result.lead,
      couponCode: result.offer.couponCode,
      offer: result.offer,
      crmStatus: result.crmResult,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Falha ao resgatar cupom.' });
  }
});

apiRouter.get('/leads', (req: Request, res: Response) => {
  const { search, category, couponCode, period } = req.query;
  const periodDays = period ? parseInt(period as string, 10) : undefined;

  const leads = appStore.getLeads({
    search: search as string,
    category: category as string,
    couponCode: couponCode as string,
    periodDays,
  });

  return res.json(leads);
});

apiRouter.get('/leads/export/csv', (req: Request, res: Response) => {
  const { search, category, couponCode, period } = req.query;
  const periodDays = period ? parseInt(period as string, 10) : undefined;

  const leads = appStore.getLeads({
    search: search as string,
    category: category as string,
    couponCode: couponCode as string,
    periodDays,
  });

  const csv = appStore.exportLeadsCSV(leads);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=leads-vtxmais-${Date.now()}.csv`);
  return res.send('\uFEFF' + csv); // Include BOM for Excel UTF-8 support
});

apiRouter.patch('/leads/:id/stage', (req: Request, res: Response) => {
  const { id } = req.params;
  const { stage, note, author } = req.body;
  if (!stage) {
    return res.status(400).json({ error: 'Fase do contato obrigatória.' });
  }

  try {
    const updated = appStore.updateLeadStage(id, stage, note, author);
    return res.json(updated);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'Lead não encontrado.' });
  }
});

apiRouter.post('/leads/:id/notes', (req: Request, res: Response) => {
  const { id } = req.params;
  const { text, author } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Texto da nota é obrigatório.' });
  }

  try {
    const updated = appStore.addLeadNote(id, text, author);
    return res.json(updated);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'Lead não encontrado.' });
  }
});

// ===================== CRM CONFIG & TEST =====================
apiRouter.get('/crm/config', (req: Request, res: Response) => {
  return res.json(crmService.getConfig());
});

apiRouter.post('/crm/config', (req: Request, res: Response) => {
  const updated = crmService.updateConfig(req.body);
  return res.json(updated);
});

apiRouter.post('/crm/test', async (req: Request, res: Response) => {
  const { webhookUrl, apiKey } = req.body;
  const result = await crmService.testConnection(webhookUrl, apiKey);
  return res.json(result);
});

// Diagnóstico e Status de Saúde do Webhook CRM (.env)
apiRouter.get('/crm/health', async (_req: Request, res: Response) => {
  const report = await crmService.getHealthReport();
  return res.json(report);
});

apiRouter.post('/crm/health/test', async (req: Request, res: Response) => {
  const { customUrl, customKey } = req.body || {};
  const report = await crmService.runHealthCheck(customUrl, customKey);
  return res.json(report);
});

apiRouter.get('/crm/logs', (req: Request, res: Response) => {
  return res.json(crmService.getLogs());
});

// ===================== AVALIAÇÕES & RATINGS =====================
apiRouter.get('/reviews', (req: Request, res: Response) => {
  const { offerId, rating, status } = req.query;
  const reviews = appStore.getReviews({
    offerId: offerId as string,
    rating: rating ? parseInt(rating as string, 10) : undefined,
    status: status as string,
  });
  return res.json(reviews);
});

apiRouter.post('/reviews', (req: Request, res: Response) => {
  try {
    const { offerId, rating, comment, userName, userEmail, userCity, couponCode, verifiedRedemption, userId } = req.body;
    if (!offerId) {
      return res.status(400).json({ error: 'ID da oferta é obrigatório para avaliar.' });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Classificação de estrelas deve ser entre 1 e 5.' });
    }

    const result = appStore.addReview({
      offerId,
      rating,
      comment,
      userName,
      userEmail,
      userCity,
      couponCode,
      verifiedRedemption,
      userId,
    });
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao registrar avaliação.' });
  }
});

apiRouter.get('/reviews/report', (_req: Request, res: Response) => {
  const report = appStore.getReviewsReport();
  return res.json(report);
});

// ===================== ANALYTICS =====================
apiRouter.get('/analytics', (req: Request, res: Response) => {
  const stats = appStore.getAnalytics();
  return res.json(stats);
});

// ===================== AUTH =====================
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, username, password } = req.body;
  const identifier = username || email;
  if (!identifier) {
    return res.status(400).json({ error: 'Informe o usuário ou e-mail de acesso.' });
  }

  const result = appStore.login(identifier, password || '');
  if (!result) {
    return res.status(401).json({ error: 'Usuário não encontrado. Verifique seu login.' });
  }

  if ('error' in result) {
    return res.status(401).json({ error: result.error });
  }

  return res.json(result);
});

apiRouter.post('/auth/complete-profile', (req: Request, res: Response) => {
  const { userId, name, cpf, dataNascimento, email } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'ID do usuário não fornecido.' });
  }

  try {
    const updated = appStore.completeProfile(userId, { name, cpf, dataNascimento, email });
    return res.json({ success: true, user: updated });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao completar cadastro.' });
  }
});

apiRouter.post('/auth/change-password', (req: Request, res: Response) => {
  const { userId, newPassword } = req.body;
  if (!userId || !newPassword) {
    return res.status(400).json({ error: 'Informe a nova senha.' });
  }

  try {
    const updated = appStore.changePassword(userId, newPassword);
    return res.json({ success: true, user: updated, message: 'Senha atualizada com sucesso!' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao alterar senha.' });
  }
});

apiRouter.get('/auth/users', (req: Request, res: Response) => {
  return res.json(appStore.getUsers());
});

// ===================== CUSTOMERS RECOGNITION DATABASE =====================
apiRouter.post('/customers/lookup', (req: Request, res: Response) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'Informe e-mail, telefone ou CPF para identificação.' });
  }

  const customer = appStore.findCustomer(identifier);
  if (!customer) {
    return res.status(404).json({ error: 'Cadastro não localizado. Faça seu cadastro rápido para baixar o cupom.' });
  }

  return res.json({ success: true, customer });
});

apiRouter.post('/customers/register', (req: Request, res: Response) => {
  const { name, email, phone, cpf, userCep, offerId } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'E-mail válido é obrigatório.' });
  }
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Nome completo é obrigatório.' });
  }
  if (!phone || phone.replace(/\D/g, '').length < 8) {
    return res.status(400).json({ error: 'Telefone/WhatsApp válido é obrigatório.' });
  }

  try {
    const customer = appStore.registerOrUpdateCustomer({
      name,
      email,
      phone,
      cpf,
      userCep,
      offerId,
    });
    return res.status(201).json({ success: true, customer });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Falha ao registrar cliente.' });
  }
});

apiRouter.get('/customers', (_req: Request, res: Response) => {
  return res.json(appStore.getCustomers());
});

// ===================== ADVERTISERS & CRM KANBAN =====================
apiRouter.post('/advertisers', (req: Request, res: Response) => {
  const {
    companyName,
    tradeName,
    cnpj,
    contactName,
    email,
    phone,
    category,
    city,
    state,
    discountProposal,
  } = req.body;

  if (!companyName || !contactName || !email || !phone) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios da empresa e contato.' });
  }

  try {
    const advertiser = appStore.addAdvertiser({
      companyName,
      tradeName: tradeName || companyName,
      cnpj,
      contactName,
      email,
      phone,
      category: category || 'Serviços',
      city: city || 'São Paulo',
      state: state || 'SP',
      discountProposal: discountProposal || 'Proposta de benefício aos associados VTXMais',
    });

    return res.status(201).json({
      success: true,
      message: 'Cadastro da sua empresa recebido com sucesso! Nossa equipe entrará em contato em breve.',
      advertiser,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao cadastrar empresa.' });
  }
});

apiRouter.get('/advertisers', (_req: Request, res: Response) => {
  return res.json(appStore.getAdvertisers());
});

apiRouter.put('/advertisers/:id/stage', (req: Request, res: Response) => {
  const { stage } = req.body;
  if (!stage) return res.status(400).json({ error: 'Estágio do Kanban não informado.' });

  const updated = appStore.updateAdvertiserStage(req.params.id, stage);
  if (!updated) return res.status(404).json({ error: 'Anunciante não encontrado.' });
  return res.json(updated);
});

apiRouter.post('/advertisers/:id/notes', (req: Request, res: Response) => {
  const { note } = req.body;
  if (!note) return res.status(400).json({ error: 'Nota não pode ser vazia.' });

  const updated = appStore.addAdvertiserNote(req.params.id, note);
  if (!updated) return res.status(404).json({ error: 'Anunciante não encontrado.' });
  return res.json(updated);
});

apiRouter.delete('/advertisers/:id', (req: Request, res: Response) => {
  const success = appStore.deleteAdvertiser(req.params.id);
  if (!success) return res.status(404).json({ error: 'Anunciante não encontrado.' });
  return res.json({ success: true });
});

// ===================== TOP CAROUSEL BANNERS =====================
apiRouter.get('/banners', (_req: Request, res: Response) => {
  return res.json(appStore.getBanners());
});

apiRouter.post('/banners', (req: Request, res: Response) => {
  try {
    const banner = appStore.addBanner(req.body);
    return res.status(201).json(banner);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.put('/banners/:id', (req: Request, res: Response) => {
  const updated = appStore.updateBanner(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Banner não encontrado.' });
  return res.json(updated);
});

apiRouter.delete('/banners/:id', (req: Request, res: Response) => {
  const success = appStore.deleteBanner(req.params.id);
  if (!success) return res.status(404).json({ error: 'Banner não encontrado.' });
  return res.json({ success: true });
});

// ===================== MEDIA / PHOTO DATABASE =====================
apiRouter.get('/media', (_req: Request, res: Response) => {
  return res.json(appStore.getMediaItems());
});

apiRouter.get('/media/stats', (_req: Request, res: Response) => {
  return res.json(appStore.getMediaStats());
});

// ===================== PUSH NOTIFICATIONS & SLA ALERTS =====================
apiRouter.get('/notifications', (_req: Request, res: Response) => {
  return res.json(appStore.getNotifications());
});

apiRouter.put('/notifications/:id/read', (req: Request, res: Response) => {
  const success = appStore.markNotificationAsRead(req.params.id);
  return res.json({ success });
});

apiRouter.post('/notifications/read-all', (_req: Request, res: Response) => {
  appStore.markAllNotificationsAsRead();
  return res.json({ success: true });
});

// ===================== WEEKLY PUSH SCHEDULES =====================
apiRouter.get('/push-schedules', (_req: Request, res: Response) => {
  return res.json(appStore.getPushSchedules());
});

apiRouter.get('/push-schedules/history', (_req: Request, res: Response) => {
  return res.json(appStore.getPushHistory());
});

apiRouter.post('/push-schedules', (req: Request, res: Response) => {
  const { title, body, targetAudience, daysOfWeek, timeOfDay, offerId, active, createdBy } = req.body;
  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Título da notificação é obrigatório.' });
  }
  if (!body || !body.trim()) {
    return res.status(400).json({ error: 'Corpo/Mensagem da notificação é obrigatório.' });
  }

  try {
    const created = appStore.createPushSchedule({
      title,
      body,
      targetAudience: targetAudience || 'todos_cadastrados',
      daysOfWeek: daysOfWeek || [5],
      timeOfDay: timeOfDay || '18:00',
      active,
      offerId,
      createdBy,
    });
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao criar agendamento push.' });
  }
});

apiRouter.put('/push-schedules/:id', (req: Request, res: Response) => {
  try {
    const updated = appStore.updatePushSchedule(req.params.id, req.body);
    return res.json(updated);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'Agendamento não encontrado.' });
  }
});

apiRouter.patch('/push-schedules/:id/toggle', (req: Request, res: Response) => {
  try {
    const updated = appStore.togglePushSchedule(req.params.id);
    return res.json(updated);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'Agendamento não encontrado.' });
  }
});

apiRouter.delete('/push-schedules/:id', (req: Request, res: Response) => {
  const success = appStore.deletePushSchedule(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Agendamento não encontrado.' });
  }
  return res.json({ success: true });
});

apiRouter.post('/push-schedules/:id/trigger', (req: Request, res: Response) => {
  try {
    const result = appStore.triggerPushScheduleNow(req.params.id);
    return res.json(result);
  } catch (err: any) {
    return res.status(404).json({ error: err.message || 'Agendamento não encontrado.' });
  }
});

// ===================== FRONTPAGE HTML DOWNLOAD (ADMIN ONLY) =====================
apiRouter.get('/download/frontpage', (req: Request, res: Response) => {
  const userId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
  const authHeader = req.headers.authorization;

  let isAdmin = false;

  if (userId) {
    const user = appStore.getUserById(userId);
    if (user && user.role === 'admin') {
      isAdmin = true;
    }
  } else if (authHeader && authHeader.startsWith('Bearer token_')) {
    const parts = authHeader.replace('Bearer ', '').split('_');
    const uId = parts[1];
    if (uId) {
      const user = appStore.getUserById(uId);
      if (user && user.role === 'admin') {
        isAdmin = true;
      }
    }
  }

  if (!isAdmin) {
    return res.status(403).json({
      error: 'Acesso negado. Apenas administradores do Clube VTXMais têm permissão para baixar este arquivo.',
    });
  }

  const filePath = path.join(process.cwd(), 'src', 'server', 'assets', 'frontpage-clube-vtxmais.html');
  return res.download(filePath, 'frontpage-clube-vtxmais.html');
});

// =========================================================================
// MÓDULO CENTRAL DE PONTOS FINANCEIROS (ROTAS /api/points)
// =========================================================================
import { pointsEngine } from './pointsEngine';

// Carteira do Usuário (Sessão Atual)
apiRouter.get('/points/wallet', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || (req.headers['x-user-id'] as string) || 'usr_admin_01';
  const name = (req.query.name as string) || 'Associado VTXMais';
  const email = (req.query.email as string) || 'associado@vtxmais.com.br';
  const cpf = (req.query.cpf as string) || '';

  const wallet = pointsEngine.getOrCreateWallet({ id: userId, name, email, cpf });
  return res.json(wallet);
});

// Iniciar Compra de Pontos via PIX
apiRouter.post('/points/buy-pix', (req: Request, res: Response) => {
  const { userId, name, email, cpf, valorReais, idempotencyKey } = req.body;
  if (!valorReais || valorReais <= 0) {
    return res.status(400).json({ error: 'Informe um valor válido em Reais.' });
  }

  const idempKey = idempotencyKey || `idemp_pix_${Date.now()}_${Math.random()}`;
  try {
    const result = pointsEngine.initiateBuyPointsPix(
      { id: userId || 'usr_admin_01', name, email, cpf },
      Number(valorReais),
      idempKey
    );
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao gerar PIX.' });
  }
});

// Confirmar Pagamento PIX (Webhook / Simulação no Painel)
apiRouter.post('/points/confirm-pix', (req: Request, res: Response) => {
  const { requestId, idempotencyKey } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: 'Informe o ID da solicitação PIX.' });
  }

  try {
    const result = pointsEngine.confirmPixPayment(requestId, idempotencyKey);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao confirmar pagamento PIX.' });
  }
});

// Pagamento de Oferta em Parceiro com Pontos
apiRouter.post('/points/pay-partner', (req: Request, res: Response) => {
  const { userId, name, email, partnerId, partnerName, offerId, offerTitle, discountValue, pontosValor, idempotencyKey } = req.body;
  if (!pontosValor || pontosValor <= 0) {
    return res.status(400).json({ error: 'Valor em pontos inválido.' });
  }

  const idempKey = idempotencyKey || `idemp_pay_${Date.now()}`;
  try {
    const result = pointsEngine.payPartnerWithPoints(
      { id: userId || 'usr_admin_01', name, email },
      { id: partnerId || 'partner_01', name: partnerName || 'Parceiro Oficial' },
      { id: offerId || 'off_01', title: offerTitle || 'Oferta', discountValue: discountValue || 'Desconto' },
      Number(pontosValor),
      idempKey
    );
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao processar pagamento com pontos.' });
  }
});

// Solicitação de Liquidação Financeira (Saque PIX)
apiRouter.post('/points/redeem-pix', (req: Request, res: Response) => {
  const { userId, name, email, cpf, pontosValor, chavePix, idempotencyKey } = req.body;
  if (!pontosValor || pontosValor <= 0) {
    return res.status(400).json({ error: 'Informe a quantidade de pontos para resgate.' });
  }
  if (!chavePix || !chavePix.chave) {
    return res.status(400).json({ error: 'Informe a chave PIX de destino.' });
  }

  const idempKey = idempotencyKey || `idemp_saque_${Date.now()}`;
  try {
    const result = pointsEngine.requestPixWithdrawal(
      { id: userId || 'usr_admin_01', name, email, cpf },
      Number(pontosValor),
      chavePix,
      idempKey
    );
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao solicitar saque PIX.' });
  }
});

// Emissão de Cartão Pré-Pago (Virtual ou Físico)
apiRouter.post('/points/prepaid-card', (req: Request, res: Response) => {
  const { userId, name, email, cpf, tipo, valorCarga, enderecoEntrega, idempotencyKey } = req.body;
  if (tipo !== 'virtual' && tipo !== 'fisico') {
    return res.status(400).json({ error: 'Tipo de cartão deve ser "virtual" ou "fisico".' });
  }

  try {
    const result = pointsEngine.issuePrepaidCard(
      { id: userId || 'usr_admin_01', name, email, cpf },
      tipo,
      Number(valorCarga || 0),
      enderecoEntrega,
      idempotencyKey
    );
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao emitir cartão.' });
  }
});

// ================= ADMIN & GESTÃO DA CONTA MÃE =================

// Estado da Conta Mãe e Conciliação em Tempo Real
apiRouter.get('/points/admin/mother-account', (_req: Request, res: Response) => {
  const state = pointsEngine.getMotherAccountState();
  return res.json(state);
});

// Fila de Aprovações Pendentes (Alçadas)
apiRouter.get('/points/admin/approvals', (_req: Request, res: Response) => {
  const pending = pointsEngine.getPendingApprovals();
  return res.json(pending);
});

// Decisão de Aprovação de Saque PIX
apiRouter.post('/points/admin/approvals/:id/decide', (req: Request, res: Response) => {
  const { id } = req.params;
  const { approver, decision, motivo } = req.body;

  if (decision !== 'aprovado' && decision !== 'rejeitado') {
    return res.status(400).json({ error: 'Decisão deve ser "aprovado" ou "rejeitado".' });
  }

  const approverUser: AdminUser = approver || {
    id: 'usr_admin_01',
    name: 'Diretor Financeiro',
    email: 'diretoria@vtxmais.com.br',
    role: 'diretor',
  };

  try {
    const result = pointsEngine.decideWithdrawalApproval(id, approverUser, decision, motivo);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao processar decisão.' });
  }
});

// Ledger Imutável
apiRouter.get('/points/admin/ledger', (req: Request, res: Response) => {
  const usuario_id = req.query.usuario_id as string;
  const operacao = req.query.operacao as string;
  const limit = req.query.limit ? Number(req.query.limit) : 100;

  const entries = pointsEngine.getLedger({ usuario_id, operacao, limit });
  return res.json(entries);
});

// Time Travel Financeiro (Auditoria Histórica de Saldos por Data/Hora)
apiRouter.post('/points/admin/time-travel', (req: Request, res: Response) => {
  const { targetDate, usuarioId } = req.body;
  if (!targetDate) {
    return res.status(400).json({ error: 'Informe a data para consulta histórica.' });
  }

  try {
    const snapshot = pointsEngine.getTimeTravelSnapshot(targetDate, usuarioId);
    return res.json(snapshot);
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro no Time Travel.' });
  }
});

// Replay de Produção Anonimizado (Sandbox)
apiRouter.post('/points/admin/replay', (_req: Request, res: Response) => {
  const result = pointsEngine.runAnonymizedReplay();
  return res.json(result);
});

// Atualização de Taxa de Paridade
apiRouter.post('/points/admin/update-rate', (req: Request, res: Response) => {
  const { usuarioId, novaTaxa, motivo, executor } = req.body;
  if (novaTaxa === undefined || novaTaxa === null) {
    return res.status(400).json({ error: 'Informe a nova taxa.' });
  }

  const exec: AdminUser = executor || {
    id: 'usr_admin_01',
    name: 'Admin Master',
    email: 'admin@vtxmais.com.br',
    role: 'admin',
  };

  try {
    const history = pointsEngine.updatePointsRate(usuarioId, Number(novaTaxa), motivo || 'Ajuste administrativo', exec);
    return res.json({ success: true, history });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao atualizar taxa.' });
  }
});

// Alertas de Risco & Incidentes
apiRouter.get('/points/admin/risk-alerts', (_req: Request, res: Response) => {
  return res.json(pointsEngine.getRiskAlerts());
});

// Log de Auditoria
apiRouter.get('/points/admin/audit', (_req: Request, res: Response) => {
  return res.json(pointsEngine.getAuditLog());
});

// Lista consolidada de todas as carteiras de usuários
apiRouter.get('/points/admin/wallets', (_req: Request, res: Response) => {
  return res.json(pointsEngine.getAllWallets());
});

// ===================== ESTRUTURA DO BANCO DE DADOS (MÓDULO 10) =====================
apiRouter.get('/points/admin/database-schema', (_req: Request, res: Response) => {
  const schemaInfo = getDatabaseSchemaMetadata();
  const stats = pointsEngine.getDatabaseTableStats();
  return res.json({
    ...schemaInfo,
    runtimeStats: stats,
  });
});

apiRouter.get('/points/admin/database-schema/sql', (_req: Request, res: Response) => {
  const schemaInfo = getDatabaseSchemaMetadata();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="vtxmais_modulo10_schema.sql"');
  return res.send(schemaInfo.rawSql);
});

// ===================== FASE 12: PORTAL DO LOJISTA & VALIDAÇÃO POS =====================

// Listar validações de cupons (com filtros por parceiro, status e busca)
apiRouter.get('/partner/validations', (req: Request, res: Response) => {
  const { partnerId, status, dateFrom, dateTo, search } = req.query;
  const list = appStore.getValidations({
    partnerId: partnerId as string,
    status: status as string,
    dateFrom: dateFrom as string,
    dateTo: dateTo as string,
    search: search as string,
  });
  return res.json(list);
});

// Realizar validação de cupom no Caixa/Terminal do Lojista (POS)
apiRouter.post('/partner/validate-coupon', (req: Request, res: Response) => {
  const { couponCode, partnerId, billAmount, pointsUsed, operatorName, notes } = req.body;

  if (!couponCode) {
    return res.status(400).json({ error: 'Código de cupom obrigatório.' });
  }

  try {
    const result = appStore.validateCoupon({
      couponCode,
      partnerId,
      billAmount: billAmount ? parseFloat(billAmount) : undefined,
      pointsUsed: pointsUsed ? parseInt(pointsUsed, 10) : undefined,
      operatorName,
      notes,
    });

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao validar cupom no POS.' });
  }
});

// Estornar validação de cupom (caso de desistência ou erro de digitação no caixa)
apiRouter.post('/partner/validations/:id/cancel', (req: Request, res: Response) => {
  const success = appStore.cancelValidation(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Validação não encontrada para estorno.' });
  }
  return res.json({ success: true, message: 'Validação de cupom estornada com sucesso.' });
});

// Estatísticas do Lojista / Terminal POS
apiRouter.get('/partner/stats/:partnerId', (req: Request, res: Response) => {
  const stats = appStore.getPartnerPOSStats(req.params.partnerId);
  return res.json(stats);
});

// ===================== FASE 12: CLEARING HOUSE & REPASSES B2B =====================

// Listar fechamentos/faturas de repasses aos parceiros
apiRouter.get('/settlements', (req: Request, res: Response) => {
  const { partnerId, status } = req.query;
  const settlements = appStore.getSettlements({
    partnerId: partnerId as string,
    status: status as string,
  });
  return res.json(settlements);
});

// Gerar novo fechamento de faturas (Clearing House)
apiRouter.post('/settlements/generate', (req: Request, res: Response) => {
  const { partnerId, periodStart, periodEnd } = req.body;
  if (!partnerId) {
    return res.status(400).json({ error: 'Parceiro obrigatório para gerar fechamento.' });
  }

  const start = periodStart || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const end = periodEnd || new Date().toISOString().slice(0, 10);

  try {
    const settlement = appStore.generateSettlement(partnerId, start, end);
    return res.status(201).json({
      success: true,
      message: `Fatura ${settlement.id} gerada com sucesso!`,
      settlement,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao gerar fechamento.' });
  }
});

// Liquidar repasse via PIX Conta Mãe
apiRouter.post('/settlements/:id/settle', (req: Request, res: Response) => {
  const { approverName, pixTransactionId } = req.body;
  try {
    const settlement = appStore.settlePayout(
      req.params.id,
      approverName || 'Gestor Financeiro VTXMais',
      pixTransactionId
    );
    return res.json({
      success: true,
      message: `Repasse ${settlement.id} liquidado com sucesso via PIX Conta Mãe!`,
      settlement,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao liquidar repasse.' });
  }
});

// Converter Anunciante B2B em Parceiro Oficial Ativo do Clube VTXMais
apiRouter.post('/advertisers/:id/convert-to-partner', (req: Request, res: Response) => {
  try {
    const result = appStore.convertAdvertiserToPartner(req.params.id);
    return res.status(201).json({
      success: true,
      message: `Empresa "${result.partner.name}" convertida em Parceiro Ativo com sucesso! Oferta inaugural criada.`,
      ...result,
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Erro ao converter anunciante.' });
  }
});


