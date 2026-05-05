# Live CS2 Scores

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/hunters-projects-7ac189d1/v0-live-cs-2-scores)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/dCiWKqcHn4t)

## Sobre o Projeto

Aplicação web para acompanhar partidas de Counter-Strike 2 (CS2) em tempo real. Permite visualizar partidas ao vivo, próximas e encerradas, com filtros por time e campeonato, além de favoritar times para acompanhamento rápido.

### Funcionalidades

- Partidas ao vivo, próximas e encerradas em tempo real
- Busca por nome do time (ex: FURIA, NAVI, Vitality)
- Busca por nome do campeonato (ex: IEM, ESL, BLAST)
- Sistema de favoritos para acompanhar seus times preferidos
- Atualização automática dos placares
- Interface responsiva (mobile e desktop)

## Tecnologias

- **[Next.js 16](https://nextjs.org/)** - Framework React com App Router
- **[React 19](https://react.dev/)** - Biblioteca de UI
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Estilização
- **[shadcn/ui](https://ui.shadcn.com/)** - Componentes de UI
- **[SWR](https://swr.vercel.app/)** - Data fetching e cache
- **[PandaScore API](https://pandascore.co/)** - Dados de partidas de esports

## Como contribuir

### Pré-requisitos

- Node.js 18+ instalado
- Gerenciador de pacotes (npm, pnpm ou yarn)
- Uma chave de API gratuita da [PandaScore](https://pandascore.co/)

### 1. Clone o repositório

```bash
git clone https://github.com/araujod08/live-cs-2-scores.git
cd live-cs-2-scores
```

### 2. Instale as dependências

```bash
npm install
# ou
pnpm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente

Copie o arquivo de exemplo e crie o seu `.env.local`:

```bash
cp .env.example .env.local
```

Edite o `.env.local` e adicione sua chave da PandaScore API:

```env
PANDASCORE_API_KEY=sua_chave_aqui
```

> Para obter uma chave da PandaScore API:
> 1. Crie uma conta gratuita em [pandascore.co](https://pandascore.co/)
> 2. Acesse o dashboard e copie sua API token
> 3. O plano gratuito tem limites suficientes para desenvolvimento

### 4. Execute o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `PANDASCORE_API_KEY` | Sim | Chave de API da PandaScore para buscar dados de partidas |

> **Importante:** Nunca commit o arquivo `.env.local` ou qualquer arquivo com credenciais reais. O `.gitignore` já está configurado para proteger esses arquivos. Apenas o `.env.example` (sem valores reais) deve ser versionado.

## Estrutura do Projeto

```
.
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── matches/       # Endpoint de partidas
│   │   └── teams/         # Endpoint de times
│   ├── layout.tsx         # Layout raiz
│   └── page.tsx           # Página inicial
├── components/            # Componentes React
│   ├── ui/               # Componentes shadcn/ui
│   ├── match-card.tsx    # Card de partida
│   ├── matches-list.tsx  # Lista de partidas
│   ├── team-search.tsx   # Busca por time
│   └── tournament-search.tsx # Busca por campeonato
├── hooks/                 # React hooks customizados
├── lib/                   # Utilitários e tipos
└── public/                # Arquivos estáticos
```

## Deploy

O projeto está hospedado na Vercel:

**[https://vercel.com/hunters-projects-7ac189d1/v0-live-cs-2-scores](https://vercel.com/hunters-projects-7ac189d1/v0-live-cs-2-scores)**

Para fazer deploy do seu próprio fork, configure a variável `PANDASCORE_API_KEY` nas Environment Variables do projeto Vercel.

## Continue construindo

Continue desenvolvendo este app no v0:

**[https://v0.app/chat/dCiWKqcHn4t](https://v0.app/chat/dCiWKqcHn4t)**

## Como funciona o sync com v0

1. Crie e modifique o projeto usando [v0.app](https://v0.app)
2. Faça deploy dos chats pela interface do v0
3. As mudanças são automaticamente enviadas para este repositório
4. A Vercel faz o deploy da última versão a partir deste repositório
