# SILO — Organizador de Keywords

Sistema para montar e gerenciar estruturas de SILO para SEO. Organize suas palavras-chave em silos com palavras principais e secundárias, acompanhe o score de cada SILO em tempo real e importe listas via CSV.

---

## 🚀 Deploy com um clique

### ▶ Railway (recomendado — SQLite persistente, gratuito)

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/new/template?template=https://github.com/8linksapp-maker/silo)

**Passos:**
1. Clique no botão acima e faça login com GitHub
2. Em **Variables**, adicione: `JWT_SECRET` → qualquer texto secreto (ex: `minha-chave-super-secreta-2024`)
3. Aguarde o deploy (~2 min) e acesse a URL gerada
4. Login: **admin** / **admin123** ← **troque a senha depois!**

### ▶ Vercel

> ⚠️ **Atenção:** O Vercel usa serverless functions com filesystem efêmero — o SQLite funciona, mas os dados podem ser perdidos em reinicializações frias.  
> Para uso em produção no Vercel, recomendo migrar o banco para **[Neon Postgres](https://neon.tech)** ou **[Turso](https://turso.tech)**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/8linksapp-maker/silo&env=JWT_SECRET&envDescription=Chave%20secreta%20para%20autenticação%20JWT&envLink=https://github.com/8linksapp-maker/silo%23variaveis-de-ambiente)

---

## 💻 Rodando localmente

**Pré-requisitos:** [Bun](https://bun.sh) ou Node.js 18+

```bash
# 1. Clone o repositório
git clone https://github.com/8linksapp-maker/silo.git
cd silo

# 2. Instale as dependências
bun install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env e coloque uma JWT_SECRET forte

# 4. Inicie o servidor de desenvolvimento
bun dev
```

Acesse **http://localhost:4321** — login: `admin` / `admin123`

---

## 🔑 Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `JWT_SECRET` | Sim | Chave secreta para assinar os tokens de autenticação |

---

## 📋 Funcionalidades

- **Login** seguro com JWT
- **Drag & drop** de keywords entre SILOs e o pool
- **Palavra principal** (⭐) — slot exclusivo por SILO
- **Palavras secundárias** — múltiplas por SILO
- **Score por SILO** (0–100) calculado em tempo real:
  - `Vazio` → `Fraco` → `Regular` → `Bom` → `Ótimo` → `Perfeito`
- **Importação em massa via CSV**
- **Download de modelo CSV** com dados de exemplo
- **Tabela de keywords** em `/dashboard/keywords`

### Algoritmo de Score

| Componente | Pontos |
|---|---|
| 1 palavra principal | +25 |
| Cada palavra secundária (máx. 10) | +5 cada |
| Bônus estrutura (1 principal + 3–15 secundárias) | +25 |
| **Máximo** | **100** |

---

## 📄 Formato do CSV

```csv
keyword,tipo,volume,dificuldade
marketing digital,primary,5000,45
seo local,secondary,2000,30
palavra simples
```

| Coluna | Obrigatório | Valores aceitos |
|---|---|---|
| `keyword` | ✅ | Texto da palavra-chave |
| `tipo` | ❌ | `primary` / `p` / `principal` → Principal; qualquer outro → Secundária |
| `volume` | ❌ | Número inteiro |
| `dificuldade` | ❌ | 0–100 |

- Separador: vírgula `,` ou ponto-e-vírgula `;`
- Header opcional (detectado automaticamente)
- Baixe o modelo dentro do app: **Importar CSV → Baixar modelo**

---

## 🛠 Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Astro 5](https://astro.build) |
| UI interativa | [React 18](https://react.dev) |
| Estilos | [Tailwind CSS 3](https://tailwindcss.com) |
| Banco de dados | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Autenticação | JWT via [jose](https://github.com/panva/jose) |
| Drag & Drop | [@dnd-kit](https://dndkit.com) |
| Runtime | [Bun](https://bun.sh) / Node.js |

---

## 🔒 Segurança pós-deploy

1. **Troque a senha do admin** — o banco é SQLite local, use um cliente como [TablePlus](https://tableplus.com) ou rode diretamente no servidor:
   ```bash
   # No servidor, gere o hash com Node.js:
   node -e "const b=require('bcryptjs'); console.log(b.hashSync('nova-senha', 10))"
   # Depois atualize no banco: UPDATE users SET password_hash='...' WHERE username='admin'
   ```
2. **JWT_SECRET forte** — use pelo menos 32 caracteres aleatórios
3. **HTTPS** — Railway e Vercel provisionam automaticamente

---

## 📁 Estrutura

```
src/
├── components/
│   ├── LoginForm.tsx       # Formulário de login
│   └── SiloBoard.tsx       # Board principal (drag & drop, modais, CSV)
├── layouts/
│   ├── BaseLayout.astro
│   └── DashboardLayout.astro
├── lib/
│   ├── db.ts               # SQLite — CRUD de users, silos e keywords
│   ├── auth.ts             # JWT com jose
│   └── scoring.ts          # Algoritmo de pontuação dos SILOs
├── middleware.ts            # Guard de autenticação
└── pages/
    ├── login.astro
    ├── dashboard/
    │   ├── index.astro     # Board principal
    │   └── keywords.astro  # Tabela de keywords
    └── api/
        ├── auth/           # login, logout
        ├── silos/          # CRUD de SILOs
        └── keywords/       # CRUD + importação em massa
```

---

## 📝 Licença

MIT — use, modifique e distribua livremente.
