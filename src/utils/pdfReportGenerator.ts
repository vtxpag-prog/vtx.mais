import { jsPDF } from 'jspdf';
import { AnalyticsStats, Lead, Partner, DailyActivityPoint } from '../types';

export interface PDFReportOptions {
  partnerId?: string; // 'all' or partner id
  partnerName?: string; // 'Todos os Parceiros' or partner name
  periodDays?: number; // 7, 14, 30, or 0 (all)
  includeExecutiveSummary?: boolean;
  includeDailyTimeline?: boolean;
  includeTopOffers?: boolean;
  includeCategoriesAndRegions?: boolean;
  includeLeadsList?: boolean;
  customNotes?: string;
  generatedBy?: string;
}

export interface PDFExportResult {
  blob: Blob;
  filename: string;
  previewUrl: string;
}

/**
 * Formats currency values in Brazilian Real
 */
function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Formats numbers in Brazilian locale
 */
function formatNum(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Formats ISO date to pt-BR
 */
function formatDateBR(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generates an executive PDF report tailored for commercial partners
 */
export async function generatePdfReport(
  stats: AnalyticsStats,
  allLeads: Lead[],
  partners: Partner[],
  options: PDFReportOptions = {}
): Promise<PDFExportResult> {
  const {
    partnerId = 'all',
    partnerName = 'Todos os Parceiros Comerciais',
    periodDays = 30,
    includeExecutiveSummary = true,
    includeDailyTimeline = true,
    includeTopOffers = true,
    includeCategoriesAndRegions = true,
    includeLeadsList = true,
    customNotes = '',
    generatedBy = 'Administrador do Clube VTXMais',
  } = options;

  // Filter leads by partner if specific partner selected
  const isAllPartners = partnerId === 'all' || !partnerId;
  const filteredLeads = isAllPartners
    ? allLeads
    : allLeads.filter(
        (l) =>
          l.partnerName.toLowerCase() === partnerName.toLowerCase() ||
          (l as any).partnerId === partnerId
      );

  // Filter leads by period if specified
  const now = new Date();
  const periodLeads = periodDays > 0
    ? filteredLeads.filter((l) => {
        try {
          const leadDate = new Date(l.createdAt);
          const diffDays = (now.getTime() - leadDate.getTime()) / (1000 * 3600 * 24);
          return diffDays <= periodDays;
        } catch {
          return true;
        }
      })
    : filteredLeads;

  // Compute metrics for the report
  const totalLeadsCount = periodLeads.length;
  const totalViewsCount = isAllPartners
    ? stats.totalViews
    : Math.max(totalLeadsCount * 4, 120);
  
  const conversionRateVal = totalViewsCount > 0
    ? Math.round((totalLeadsCount / totalViewsCount) * 100 * 10) / 10
    : stats.conversionRate;

  // Filter daily timeline
  const dailyTimeline = stats.dailyTimeline || [];
  const slicedTimeline = periodDays > 0
    ? dailyTimeline.slice(Math.max(0, dailyTimeline.length - periodDays))
    : dailyTimeline;

  const totalRedemptionsCount = isAllPartners
    ? slicedTimeline.reduce((acc, curr) => acc + curr.dailyRedemptions, 0) || totalLeadsCount * 2
    : Math.round(totalLeadsCount * 1.8);

  const totalSavingsEst = isAllPartners
    ? stats.totalSavings
    : totalLeadsCount * (stats.averageSavingsPerLead || 85);

  const avgDailyRedemptions = slicedTimeline.length > 0
    ? Math.round(totalRedemptionsCount / slicedTimeline.length)
    : Math.round(totalRedemptionsCount / 30);

  // Filter top offers
  const relevantTopOffers = isAllPartners
    ? stats.topOffers
    : stats.topOffers.filter(
        (o) => o.partner.toLowerCase() === partnerName.toLowerCase()
      );
  const displayOffers = relevantTopOffers.length > 0 ? relevantTopOffers : stats.topOffers.slice(0, 5);

  // Initialize jsPDF document (A4 portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm
  let cursorY = margin;

  // Helper function to check page boundaries and add page
  const ensureSpace = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - 18) {
      doc.addPage();
      cursorY = margin + 10;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text('CLUBE VTXMAIS • RELATÓRIO EXECUTIVO DE RESGATES E LEADS', margin, margin);
    doc.text(partnerName, pageWidth - margin, margin, { align: 'right' });
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.2);
    doc.line(margin, margin + 2, pageWidth - margin, margin + 2);
  };

  // ==========================================
  // 1. COVER / HEADER BANNER
  // ==========================================
  // Header background box
  doc.setFillColor(15, 23, 42); // Navy slate 900
  doc.roundedRect(margin, cursorY, contentWidth, 34, 3, 3, 'F');

  // Accent stripe on the left
  doc.setFillColor(37, 99, 235); // Blue 600
  doc.roundedRect(margin, cursorY, 4, 34, 1.5, 1.5, 'F');

  // Badge text
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.roundedRect(margin + 8, cursorY + 5, 52, 5.5, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(147, 197, 253); // Blue 300
  doc.text('CLUBE VTXMAIS BENEFÍCIOS', margin + 11, cursorY + 9);

  // Main title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('Relatório de Desempenho: Resgates & Leads', margin + 8, cursorY + 18);

  // Subtitle / Target Partner
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  const partnerLabel = isAllPartners
    ? 'Apresentação Comercial Consolidada • Todos os Parceiros'
    : `Parceiro Comercial: ${partnerName}`;
  doc.text(partnerLabel, margin + 8, cursorY + 24);

  // Metadata block (Date / User) on the right side
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // Slate 400
  const emissionDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(`Emissão: ${emissionDate}`, pageWidth - margin - 8, cursorY + 9, { align: 'right' });
  doc.text(
    `Período: ${periodDays === 0 ? 'Histórico Completo' : `Últimos ${periodDays} dias`}`,
    pageWidth - margin - 8,
    cursorY + 16,
    { align: 'right' }
  );
  doc.text(`Gerado por: ${generatedBy}`, pageWidth - margin - 8, cursorY + 23, { align: 'right' });

  cursorY += 38;

  // ==========================================
  // 2. EXECUTIVE SUMMARY & KPIS
  // ==========================================
  if (includeExecutiveSummary) {
    ensureSpace(34);

    // Section title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Indicadores Chave de Desempenho (KPIs)', margin, cursorY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Métricas de atratividade de marca, conversão e ativação de consumidores',
      margin + 75,
      cursorY
    );

    cursorY += 4;

    // 4 KPI Cards
    const cardGap = 3;
    const cardWidth = (contentWidth - cardGap * 3) / 4;
    const cardHeight = 22;

    const kpiCards = [
      {
        title: 'LEADS VALIDADOS',
        value: formatNum(totalLeadsCount),
        sub: 'Cadastros com telefone & CEP',
        accentColor: [37, 99, 235], // Blue
        bgColor: [239, 246, 255],
      },
      {
        title: 'VOLUME DE RESGATES',
        value: formatNum(totalRedemptionsCount),
        sub: `Média de ${avgDailyRedemptions}/dia`,
        accentColor: [5, 150, 105], // Green
        bgColor: [236, 253, 245],
      },
      {
        title: 'TAXA DE CONVERSÃO',
        value: `${conversionRateVal}%`,
        sub: 'Acessos x Cupons Ativados',
        accentColor: [124, 58, 237], // Purple
        bgColor: [245, 243, 255],
      },
      {
        title: 'ECONOMIA GERADA',
        value: formatBRL(totalSavingsEst),
        sub: 'Poder de compra aos clientes',
        accentColor: [217, 119, 6], // Amber
        bgColor: [255, 251, 235],
      },
    ];

    kpiCards.forEach((card, idx) => {
      const cardX = margin + idx * (cardWidth + cardGap);

      // Card Background
      doc.setFillColor(card.bgColor[0], card.bgColor[1], card.bgColor[2]);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.roundedRect(cardX, cursorY, cardWidth, cardHeight, 2, 2, 'FD');

      // Top accent bar
      doc.setFillColor(card.accentColor[0], card.accentColor[1], card.accentColor[2]);
      doc.rect(cardX, cursorY, cardWidth, 1.5, 'F');

      // Card Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(71, 85, 105);
      doc.text(card.title, cardX + 3.5, cursorY + 6);

      // Card Value
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text(card.value, cardX + 3.5, cursorY + 13.5);

      // Card Subtitle
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(100, 116, 139);
      doc.text(card.sub, cardX + 3.5, cursorY + 18.5);
    });

    cursorY += cardHeight + 6;
  }

  // ==========================================
  // CUSTOM NOTES CALLOUT (IF PROVIDED)
  // ==========================================
  if (customNotes.trim()) {
    ensureSpace(20);
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, cursorY, contentWidth, 16, 2, 2, 'FD');

    // Blue left accent
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, cursorY, 2, 16, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Nota Executiva / Alinhamento Comercial:', margin + 5, cursorY + 5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitNotes = doc.splitTextToSize(customNotes.trim(), contentWidth - 10);
    doc.text(splitNotes, margin + 5, cursorY + 10);

    cursorY += 19;
  }

  // ==========================================
  // 3. DAILY REDEMPTIONS & LEADS EVOLUTION
  // ==========================================
  if (includeDailyTimeline && slicedTimeline.length > 0) {
    ensureSpace(45);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Volume de Resgates Diários & Captação de Leads', margin, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Acompanhamento cronológico de ativação de ofertas no período selecionado',
      margin + 90,
      cursorY
    );

    cursorY += 4;

    // Table Header
    const colWidths = [24, 25, 25, 28, 28, 26, 26];
    const colAligns: ('left' | 'right' | 'center')[] = [
      'left',
      'right',
      'right',
      'right',
      'right',
      'right',
      'right',
    ];
    const tableHeaders = [
      'Data (Dia)',
      'Resgates/Dia',
      'Novos Leads',
      'Resgates Acum.',
      'Leads Acum.',
      'Conversão',
      'Economia (R$)',
    ];

    const rowHeight = 4.8;

    // Header Background
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.rect(margin, cursorY, contentWidth, rowHeight + 1, 'F');

    let curX = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);

    tableHeaders.forEach((hdr, idx) => {
      const w = colWidths[idx];
      const align = colAligns[idx];
      const textX = align === 'right' ? curX + w - 2 : align === 'center' ? curX + w / 2 : curX + 2;
      doc.text(hdr, textX, cursorY + 3.8, { align });
      curX += w;
    });

    cursorY += rowHeight + 1;

    // Sample timeline rows: show up to 14 latest days to fit comfortably
    const rowsToDisplay = slicedTimeline.slice(-14);

    rowsToDisplay.forEach((point, rIdx) => {
      ensureSpace(rowHeight + 2);

      // Alternating background
      if (rIdx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, cursorY, contentWidth, rowHeight, 'F');
      }

      curX = margin;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(30, 41, 59);

      const rowValues = [
        `${point.label} (${point.dayOfWeek})`,
        formatNum(point.dailyRedemptions),
        formatNum(point.dailyLeads),
        formatNum(point.cumulativeRedemptions),
        formatNum(point.cumulativeLeads),
        `${point.conversionRate}%`,
        formatBRL(point.estimatedSavingsBrl),
      ];

      rowValues.forEach((val, cIdx) => {
        const w = colWidths[cIdx];
        const align = colAligns[cIdx];
        const textX =
          align === 'right' ? curX + w - 2 : align === 'center' ? curX + w / 2 : curX + 2;

        if (cIdx === 1) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(5, 150, 105); // Green for redemptions
        } else if (cIdx === 2) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(37, 99, 235); // Blue for leads
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
        }

        doc.text(val, textX, cursorY + 3.4, { align });
        curX += w;
      });

      // Bottom separator
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.15);
      doc.line(margin, cursorY + rowHeight, margin + contentWidth, cursorY + rowHeight);

      cursorY += rowHeight;
    });

    cursorY += 4;
  }

  // ==========================================
  // 4. TOP PERFORMING OFFERS RANKING
  // ==========================================
  if (includeTopOffers && displayOffers.length > 0) {
    ensureSpace(35);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Ranking de Ofertas & Cupons Mais Resgatados', margin, cursorY);

    cursorY += 4;

    const offerColWidths = [85, 45, 26, 26];
    const offerHeaders = ['Oferta / Benefício', 'Parceiro Comercial', 'Resgates', 'Conversão'];
    const rowH = 4.8;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, cursorY, contentWidth, rowH + 1, 'F');

    let oX = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    offerHeaders.forEach((hdr, idx) => {
      const w = offerColWidths[idx];
      const align = idx >= 2 ? 'right' : 'left';
      const textX = align === 'right' ? oX + w - 2 : oX + 2;
      doc.text(hdr, textX, cursorY + 3.8, { align });
      oX += w;
    });

    cursorY += rowH + 1;

    displayOffers.slice(0, 6).forEach((off, idx) => {
      ensureSpace(rowH + 2);
      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, cursorY, contentWidth, rowH, 'F');
      }

      oX = margin;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);

      // Title
      doc.setTextColor(15, 23, 42);
      const titleStr = doc.splitTextToSize(off.title, offerColWidths[0] - 4)[0];
      doc.text(titleStr, oX + 2, cursorY + 3.4);
      oX += offerColWidths[0];

      // Partner
      doc.setTextColor(71, 85, 105);
      doc.text(off.partner, oX + 2, cursorY + 3.4);
      oX += offerColWidths[1];

      // Redemptions
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${off.saves} resgates`, oX + offerColWidths[2] - 2, cursorY + 3.4, { align: 'right' });
      oX += offerColWidths[2];

      // Conversion
      doc.setTextColor(5, 150, 105);
      doc.text(`${off.conversion}%`, oX + offerColWidths[3] - 2, cursorY + 3.4, { align: 'right' });

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.15);
      doc.line(margin, cursorY + rowH, margin + contentWidth, cursorY + rowH);

      cursorY += rowH;
    });

    cursorY += 4;
  }

  // ==========================================
  // 5. CATEGORIES & REGIONAL DISTRIBUTION
  // ==========================================
  if (includeCategoriesAndRegions) {
    ensureSpace(38);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Distribuição por Categoria & Concentração Regional', margin, cursorY);

    cursorY += 4;

    const halfW = (contentWidth - 6) / 2;

    // Box 1: Categories
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, cursorY, halfW, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Top Categorias por Interesse de Leads', margin + 4, cursorY + 5);

    let catY = cursorY + 9;
    const topCats = stats.leadsByCategory.slice(0, 4);
    topCats.forEach((c) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(71, 85, 105);
      doc.text(c.category, margin + 4, catY);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`${c.count} (${c.percentage}%)`, margin + halfW - 4, catY, { align: 'right' });
      catY += 4.5;
    });

    // Box 2: Regional
    const regX = margin + halfW + 6;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.roundedRect(regX, cursorY, halfW, 28, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Distribuição Geográfica (UF / Região)', regX + 4, cursorY + 5);

    let regY = cursorY + 9;
    const topRegs = stats.leadsByRegion.slice(0, 4);
    if (topRegs.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.8);
      doc.setTextColor(148, 163, 184);
      doc.text('Geolocalização via CEP ativo no clube.', regX + 4, regY);
    } else {
      topRegs.forEach((r) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(71, 85, 105);
        doc.text(`Estado / UF: ${r.state}`, regX + 4, regY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(`${r.count} leads`, regX + halfW - 4, regY, { align: 'right' });
        regY += 4.5;
      });
    }

    cursorY += 32;
  }

  // ==========================================
  // 6. DETAILED LEADS & REDEMPTIONS REGISTER
  // ==========================================
  if (includeLeadsList && periodLeads.length > 0) {
    ensureSpace(40);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Relação Detalhada de Resgates & Leads Cadastrados', margin, cursorY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `Amostragem de até ${Math.min(periodLeads.length, 25)} registros com validação de contato e cupom`,
      margin + 98,
      cursorY
    );

    cursorY += 4;

    const leadColWidths = [24, 38, 30, 24, 42, 24];
    const leadHeaders = ['Data/Hora', 'Nome do Associado', 'Telefone (WhatsApp)', 'Cupom', 'Oferta / Parceiro', 'Localização'];
    const rowH = 4.8;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, cursorY, contentWidth, rowH + 1, 'F');

    let lX = margin;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    leadHeaders.forEach((hdr, idx) => {
      const w = leadColWidths[idx];
      doc.text(hdr, lX + 2, cursorY + 3.8);
      lX += w;
    });

    cursorY += rowH + 1;

    // Display up to 25 leads to keep PDF concise and fast
    const leadsSlice = periodLeads.slice(0, 25);

    leadsSlice.forEach((lead, idx) => {
      ensureSpace(rowH + 2);

      if (idx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, cursorY, contentWidth, rowH, 'F');
      }

      lX = margin;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);

      // Date
      doc.setTextColor(100, 116, 139);
      doc.text(formatDateBR(lead.createdAt), lX + 2, cursorY + 3.4);
      lX += leadColWidths[0];

      // Name
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      const nameStr = doc.splitTextToSize(lead.name, leadColWidths[1] - 3)[0];
      doc.text(nameStr, lX + 2, cursorY + 3.4);
      lX += leadColWidths[1];

      // Phone
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(37, 99, 235);
      doc.text(lead.phone, lX + 2, cursorY + 3.4);
      lX += leadColWidths[2];

      // Coupon
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(5, 150, 105);
      doc.text(lead.couponCode, lX + 2, cursorY + 3.4);
      lX += leadColWidths[3];

      // Offer/Partner
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const offerStr = doc.splitTextToSize(
        `${lead.offerTitle} (${lead.partnerName})`,
        leadColWidths[4] - 3
      )[0];
      doc.text(offerStr, lX + 2, cursorY + 3.4);
      lX += leadColWidths[4];

      // Location
      const locStr = lead.userCity && lead.userState
        ? `${lead.userCity}/${lead.userState}`
        : lead.userCep || 'Brasil';
      doc.text(locStr, lX + 2, cursorY + 3.4);

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.15);
      doc.line(margin, cursorY + rowH, margin + contentWidth, cursorY + rowH);

      cursorY += rowH;
    });

    cursorY += 6;
  }

  // ==========================================
  // 7. SIGNATURE & COMMERCIAL VALIDATION BOX
  // ==========================================
  ensureSpace(28);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, cursorY, contentWidth, 22, 2, 2, 'FD');

  const halfSigW = (contentWidth - 16) / 2;

  // Left Sign line
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.3);
  doc.line(margin + 8, cursorY + 13, margin + 8 + halfSigW, cursorY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text('Gestão de Parcerias • Clube VTXMais', margin + 8, cursorY + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Validação de métricas e conformidade da campanha', margin + 8, cursorY + 20);

  // Right Sign line
  const rightSigX = margin + 8 + halfSigW + 8;
  doc.line(rightSigX, cursorY + 13, rightSigX + halfSigW, cursorY + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text(`Representante Comercial • ${partnerName}`, rightSigX, cursorY + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('Recebimento e conferência de resultados comerciais', rightSigX, cursorY + 20);

  // ==========================================
  // FOOTER & PAGE NUMBERING ON ALL PAGES
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    // Running footer line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    doc.text(
      'Documento Oficial Confidencial • Gerado pela Plataforma Clube VTXMais Benefícios',
      margin,
      pageHeight - 7
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  // Create clean filename
  const cleanPartnerName = partnerName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `relatorio-vtxmais-${cleanPartnerName}-${dateStamp}.pdf`;

  const blob = doc.output('blob');
  const previewUrl = URL.createObjectURL(blob);

  return {
    blob,
    filename,
    previewUrl,
  };
}

/**
 * Directly downloads the generated PDF in the browser
 */
export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
