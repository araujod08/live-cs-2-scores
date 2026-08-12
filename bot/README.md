# CS2 Live Scores - Telegram Bot

Bot de Telegram que acompanha partidas de CS2 (times favoritos, notificações,
placar ao vivo, próximos jogos e resultados). É um processo Python de longa
duração e roda **separado** do site Next.js — normalmente numa VPS/servidor.

## Estrutura

```
bot/
├── bot.py             # Lógica principal do bot (comandos, notificações)
├── control_server.py  # Servidor HTTP de controle (status/restart)
├── requirements.txt   # Dependências Python
├── run.sh             # Supervisor simples (reinicia o bot se ele cair)
├── .env.example       # Modelo de variáveis de ambiente
└── README.md
```

## Configuração

1. Crie e ative um ambiente virtual (recomendado):

   ```bash
   cd bot
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Instale as dependências:

   ```bash
   pip install -r requirements.txt
   ```

3. Copie `.env.example` para `.env.local` e preencha os valores:

   ```bash
   cp .env.example .env.local
   ```

   | Variável             | Descrição                                                        |
   | -------------------- | ---------------------------------------------------------------- |
   | `TELEGRAM_BOT_TOKEN` | Token do bot obtido com o [@BotFather](https://t.me/BotFather)   |
   | `PANDASCORE_API_KEY` | Chave da PandaScore API (a mesma usada pelo site)                |
   | `BOT_CONTROL_TOKEN`  | Token compartilhado com o painel admin do site (gere com openssl)|
   | `BOT_CONTROL_PORT`   | Porta do servidor de controle (padrão: 8080)                     |
   | `BOT_CONTROL_HOST`   | Host de bind do servidor de controle (padrão: 0.0.0.0)           |

   Gere um token de controle forte:

   ```bash
   openssl rand -hex 32
   ```

## Rodando o bot

```bash
python3 bot.py
```

Ou, com reinício automático caso o processo caia:

```bash
./run.sh
```

## Servidor de controle (reinício remoto)

Ao iniciar, o bot sobe um pequeno servidor HTTP na porta `BOT_CONTROL_PORT`,
usado pelo **painel admin** do site para monitorar e reiniciar o bot.

| Método | Rota       | Descrição                          |
| ------ | ---------- | ---------------------------------- |
| GET    | `/status`  | Retorna status e uptime do bot     |
| POST   | `/restart` | Reinicia o processo do bot         |

Ambos exigem o header `Authorization: Bearer <BOT_CONTROL_TOKEN>`.

O reinício usa `os.execv`, que substitui o processo atual — funciona sem
supervisor externo. Se você usa `run.sh` ou systemd, o reinício também
funciona normalmente.

> **Importante:** exponha a porta de controle apenas para o painel admin.
> Em produção, use HTTPS (por trás de um reverse proxy como Nginx/Caddy) e
> mantenha o `BOT_CONTROL_TOKEN` em segredo.

### Configuração no site (Vercel)

No projeto do site, defina estas variáveis de ambiente:

| Variável            | Exemplo                          | Descrição                          |
| ------------------- | -------------------------------- | ---------------------------------- |
| `ADMIN_PASSWORD`    | uma senha forte                  | Senha de acesso ao painel `/admin` |
| `BOT_CONTROL_URL`   | `https://seu-servidor.com:8080`  | URL pública do servidor de controle|
| `BOT_CONTROL_TOKEN` | mesmo valor do bot               | Token compartilhado                |

## Rodando como serviço (systemd)

Exemplo de unit em `/etc/systemd/system/cs2-bot.service`:

```ini
[Unit]
Description=CS2 Telegram Bot
After=network.target

[Service]
Type=simple
WorkingDirectory=/caminho/para/bot
ExecStart=/caminho/para/bot/venv/bin/python bot.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Depois:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now cs2-bot
```
