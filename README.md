<p align="center">
  <img width="35" height="35" alt="logo" src="https://github.com/user-attachments/assets/7c7af5ab-96f5-4cba-9349-ee84f0421c97" />
</p>
<h1 align="center">Live CS2 Scores</h1>
<p align="center">
  Aplicação para acompanhar <strong>placares ao vivo de partidas de Counter-Strike 2 (CS2)</strong> em tempo real.
</p>

<p align="center">
  🔴 Live • 📊 Estatísticas • 📅 Jogos futuros • ⚡ Tempo real
</p>

---

## 🚀 Sobre o projeto

O **Live CS2 Scores** é um projeto desenvolvido para fornecer dados atualizados de partidas de CS2, permitindo:

- 🔴 Acompanhar partidas ao vivo  
- 📅 Visualizar jogos futuros  
- 📈 Consultar resultados recentes  
- 🧠 Integrar dados para dashboards, bots ou aplicações web  

Plataformas de live score atualizam dados constantemente com estatísticas detalhadas e eventos — e este projeto segue essa mesma proposta.

---

## 🛠️ Tecnologias utilizadas

- Node.js  
- TypeScript
- Axios / Fetch (requisições HTTP)  
- PandaScore API
- Next.js 16

## Pré-requisitos

- Node.js 18+ instalado
- Gerenciador de pacotes (npm, pnpm ou yarn)
- Uma chave de API gratuita da [PandaScore](https://pandascore.co/)

## Clone o repositório:
```bash
git clone https://github.com/araujod08/live-cs-2-scores.git
```
## Acesse a pasta do projeto:
```bash
cd live-cs-2-scores
```
▶️ Como usar

## Instale as dependências

```bash
npm install
# ou
pnpm install
# ou
yarn install
```
Configure as variáveis de ambiente

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
---
> [!warning]
> Nunca commit o arquivo `.env.local` ou qualquer arquivo com credenciais reais.
O `.gitignore` já está configurado para proteger esses arquivos.
Apenas o `.env.example` (sem valores reais) deve ser versionado.
---
Execute o projeto:
---
```bash
npm run dev
```
Deploy
---
O projeto está hospedado na Vercel:

[https://vercel.com/hunters-projects-7ac189d1/v0-live-cs-2-scores](https://vercel.com/hunters-projects-7ac189d1/v0-live-cs-2-scores)

Para fazer deploy do seu próprio fork, configure a variável `PANDASCORE_API_KEY` nas Environment Variables do projeto Vercel.


🔌 Exemplo de uso
---
```typeScript
import { getLiveMatches } from "./services/cs2";

async function main() {
  const matches = await getLiveMatches();
  console.log(matches);
}

main();
```
### 📊 Funcionalidades
*   ✅ Listar partidas ao vivo
*   ✅ Exibir placares atualizados
*   ✅ Consultar próximos jogos
*   ✅ Histórico de partidas
*   🔄 Atualização em tempo real (ou intervalos)
```text
📁 Estrutura do projeto
📦 live-cs-2-scores
 ┣ 📂 src
 ┃ ┣ 📂 services
 ┃ ┣ 📂 controllers
 ┃ ┣ 📂 utils
 ┃ ┗ index.js
 ┣ package.json
 ┗ README.md
```
### 🌐 Possíveis melhorias
* Integração com Discord bot
* Notificações em tempo real
---
🤝 Contribuição
---

Contribuições são sempre bem-vindas!

1.Faça um fork do projeto

2.Crie uma branch:
```bash
git checkout -b feature/minha-feature
```
Faça commit das alterações:
```bash
git commit -m "feat: minha nova feature"
```
Faça push:
```bash
git push origin feature/minha-feature
```
Abra um Pull Request 🚀

---
📄 Licença
---
Este projeto está sob a licença MIT.

> [!WARNING]
Este projeto não é afiliado à Valve ou ao Counter-Strike.
Os dados utilizados são provenientes de fontes públicas.
---
👨‍💻 Autor
---
Desenvolvido por <a href="https://github.com/araujod08">araujod08<a/>

Feito com 💻 e ☕ para a comunidade de CS2
