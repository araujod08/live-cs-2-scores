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
- JavaScript  
- Axios / Fetch (requisições HTTP)  
- API ou scraping de dados de CS2  

---

## 📦 Instalação

Clone o repositório:

```bash
git clone https://github.com/araujod08/live-cs-2-scores.git
Acesse a pasta do projeto:

cd live-cs-2-scores

Instale as dependências:

npm install
▶️ Como usar

Inicie o projeto:

npm start

Modo desenvolvimento:

npm run dev

🔌 Exemplo de uso
import { getLiveMatches } from "./services/cs2";

async function main() {
  const matches = await getLiveMatches();
  console.log(matches);
}

main();
📊 Funcionalidades
✅ Listar partidas ao vivo
✅ Exibir placares atualizados
✅ Consultar próximos jogos
✅ Histórico de partidas
🔄 Atualização em tempo real (ou intervalos)

📁 Estrutura do projeto
📦 live-cs-2-scores
 ┣ 📂 src
 ┃ ┣ 📂 services
 ┃ ┣ 📂 controllers
 ┃ ┣ 📂 utils
 ┃ ┗ index.js
 ┣ package.json
 ┗ README.md

🌐 Possíveis melhorias
 Interface web (dashboard)
 Integração com Discord bot
 Notificações em tempo real
 API REST (Express/Fastify)
 WebSocket (tempo real)

🤝 Contribuição

Contribuições são sempre bem-vindas!

Faça um fork do projeto

Crie uma branch:

git checkout -b feature/minha-feature

Faça commit das alterações:

git commit -m "feat: minha nova feature"

Faça push:

git push origin feature/minha-feature
Abra um Pull Request 🚀

📄 Licença

Este projeto está sob a licença MIT.

⚠️ Aviso

Este projeto não é afiliado à Valve ou ao Counter-Strike.
Os dados utilizados são provenientes de fontes públicas.
```
👨‍💻 Autor

Desenvolvido por <a href="https://github.com/araujod08">araujod08<a/>

Feito com 💻 e ☕ para a comunidade de CS2
