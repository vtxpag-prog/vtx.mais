# Clube VTXMais - Plataforma de Benefícios, Cupons & Gestão de Leads

Plataforma web completa de clube de vantagens e descontos inspirada no modelo do site **VTXMais**, composta por:
1. **Frontend Público** com busca, 13 categorias, cálculo de distância em km via CEP, e fluxo de cupom com captura obrigatória de leads.
2. **Painel Administrativo** multicargo (Administrador, Gestor, Visualizador), gestão de parceiros, ofertas, leads capturados, relatórios de conversão e integração com CRM via Webhooks.

---

## 1. Credenciais de Teste para o Painel Administrativo

| Nível de Acesso | E-mail | Senha | Permissões |
|---|---|---|---|
| **👑 Administrador** | `admin@vtxmais.com.br` | `admin123` (ou qualquer senha) | Acesso irrestrito (CRUD ofertas, parceiros, CRM, leads, relatórios) |
| **🛠️ Gestor** | `gestor@vtxmais.com.br` | `gestor123` | Gestão de conteúdo (ofertas e parceiros), visualização de leads |
| **📊 Visualizador** | `visualizador@vtxmais.com.br` | `viewer123` | Somente leitura de relatórios e métricas de conversão |

*Dica: Na tela de login, há botões de 1-clique para entrar diretamente com cada perfil.*

---

## 2. Requisitos & Instalação

### Pré-requisitos
- Node.js 18+ ou 20+
- npm ou yarn

### Instalação Passo a Passo

```bash
# 1. Clonar ou navegar até a pasta raiz
cd vtxmais-club

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env

# 4. Iniciar servidor de desenvolvimento (Fullstack Express + Vite na porta 3000)
npm run dev

# 5. Para build de produção
npm run build
npm start
```

O sistema estará acessível em `http://localhost:3000`.

---

## 3. As 13 Categorias Oficiais

1. **Promoções do Mês**
2. **Cashback**
3. **Comer e Beber**
4. **Compras e Presentes**
5. **Cultura e Entretenimento**
6. **Educação**
7. **Eletrodomésticos e Eletrônicos**
8. **Mobilidade**
9. **Moda Calçados e Acessórios**
10. **Saúde e Beleza**
11. **Serviços**
12. **Variedades**
13. **Viagens e Experiências**

---

## 4. Busca e Geolocalização por CEP

- O usuário digita qualquer CEP brasileiro (com ou sem máscara, ex: `01310-100` ou `01310100`).
- O sistema consulta os dados geográficos e calcula a distância em linha reta (fórmula de Haversine) entre o usuário e o endereço das ofertas cadastradas.
- Cada card exibe a distância em destaque (ex: `📍 1.2 km de você`).
- Ao clicar no filtro **"Perto de Você"**, as ofertas são automaticamente ordenadas pela menor distância.

---

## 5. Fluxo de Cupom com Captura de Lead (Regra Principal)

Ao clicar em **"Ver Cupom"** ou **"Utilizar Benefício"**:
1. Abre um **Modal sem sair da página** solicitando:
   - **Nome Completo \*** (obrigatório, com validação de sobrenome)
   - **Telefone / WhatsApp \*** (máscara brasileira com validação de DDD e 9 dígitos)
   - **E-mail \*** (validação de formato de e-mail)
   - **Caixa de seleção \***: *"Li e concordo com a Política de Privacidade"*
2. Ao submeter com sucesso:
   - O lead é registrado na base interna;
   - Os dados são disparados para o CRM externo via Webhook POST;
   - Uma animação de confetes é exibida;
   - **O Código do Cupom é exibido em destaque** (ex: `VTX-OUTBACK26`);
   - Botões de ação imediata:
     - 📋 **Copiar Código** (com feedback visual);
     - ⬇️ **Baixar Cupom** (abre o voucher digital para impressão ou download em PDF com QR Code e código de barras);
3. **Persistência de Sessão**: Na mesma sessão, o usuário não precisa redigitar seus dados; o sistema oferece resgate com 1 clique.

---

## 6. Endpoints da API REST para Integração CRM

### `POST /api/leads`
Recebe o formulário de captura e aciona o webhook configurado.
**Body JSON:**
```json
{
  "name": "Juliana Mendonça",
  "phone": "(11) 98765-4321",
  "email": "juliana@email.com",
  "offerId": "off_outback_bloomin",
  "userCep": "01310-100"
}
```

### `GET /api/leads/export/csv`
Gera e baixa o arquivo CSV compatível com Microsoft Excel e importadores de CRM.

### `POST /api/crm/test`
Dispara um payload de teste para homologação de endpoint receptor (ex: Webhook.site, RD Station, Zapier).

### Payload Enviado pelo Webhook ao CRM
```json
{
  "nome_completo": "Juliana Mendonça",
  "email_contato": "juliana@email.com",
  "telefone_whatsapp": "(11) 98765-4321",
  "codigo_cupom_resgatado": "VTX-OUTBACK26",
  "oferta_titulo": "Ganhe 1 Bloomin’ Onion na compra de 1 prato principal",
  "categoria_interesse": "Comer e Beber",
  "cep_usuario": "01310-100",
  "data_resgate": "2026-09-29T14:22:10.000Z",
  "origem_captura": "Site Público VTXMais",
  "metadata": {
    "partner": "Outback Steakhouse",
    "distanceKm": 0.8,
    "userCity": "São Paulo",
    "userState": "SP"
  }
}
```
