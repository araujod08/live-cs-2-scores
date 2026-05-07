#!/bin/bash
# ─────────────────────────────────────────────
# CS2 Live Scores — Telegram Bot Setup
# Roda no GitHub Codespaces / Ubuntu / Debian
# ─────────────────────────────────────────────

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}"
echo "  ██████╗███████╗██████╗      ██████╗  ██████╗ ████████╗"
echo " ██╔════╝██╔════╝╚════██╗     ██╔══██╗██╔═══██╗╚══██╔══╝"
echo " ██║     ███████╗ █████╔╝     ██████╔╝██║   ██║   ██║   "
echo " ██║     ╚════██║██╔═══╝      ██╔══██╗██║   ██║   ██║   "
echo " ╚██████╗███████║███████╗     ██████╔╝╚██████╔╝   ██║   "
echo "  ╚═════╝╚══════╝╚══════╝     ╚═════╝  ╚═════╝    ╚═╝   "
echo -e "${NC}"
echo -e "${YELLOW}  Telegram Bot — live-cs-2-scores${NC}"
echo ""

# ── 1. Instalar dependências Python ──────────────────────────
echo -e "${GREEN}[1/4] Instalando dependências Python...${NC}"
pip install -q python-telegram-bot==21.3 requests==2.32.3 python-dotenv==1.0.1
echo "  ✅ Dependências instaladas."

# ── 2. Criar bot.py ──────────────────────────────────────────
echo -e "${GREEN}[2/4] Criando bot.py...${NC}"

cat > bot.py << 'BOTEOF'
"""
CS2 Live Scores - Telegram Bot
Integração com a PandaScore API (mesmo backend do live-cs-2-scores)
"""

import os
import logging
import requests
from datetime import datetime
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
)

load_dotenv()

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
PANDASCORE_API_KEY = os.getenv("PANDASCORE_API_KEY")
PANDASCORE_BASE_URL = "https://api.pandascore.co"

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
#  Helpers PandaScore
# ─────────────────────────────────────────────

def pandascore_get(endpoint: str, params: dict = None):
    headers = {"Authorization": f"Bearer {PANDASCORE_API_KEY}"}
    url = f"{PANDASCORE_BASE_URL}{endpoint}"
    try:
        resp = requests.get(url, headers=headers, params=params or {}, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        logger.error(f"Erro na PandaScore API: {e}")
        return None


def get_live_matches():
    return pandascore_get("/csgo/matches/running") or []

def get_upcoming_matches(per_page: int = 10):
    return pandascore_get("/csgo/matches/upcoming", {"per_page": per_page, "sort": "begin_at"}) or []

def get_past_matches(per_page: int = 10):
    return pandascore_get("/csgo/matches/past", {"per_page": per_page, "sort": "-begin_at"}) or []

def get_match_detail(match_id: int):
    return pandascore_get(f"/csgo/matches/{match_id}")


# ─────────────────────────────────────────────
#  Formatação
# ─────────────────────────────────────────────

def _teams(match):
    opps = match.get("opponents", [])
    t1 = opps[0].get("opponent", {}) if len(opps) > 0 else {}
    t2 = opps[1].get("opponent", {}) if len(opps) > 1 else {}
    return t1, t2

def _scores(match, t1, t2):
    results = match.get("results", [])
    s1 = next((r.get("score", 0) for r in results if r.get("team_id") == t1.get("id")), 0)
    s2 = next((r.get("score", 0) for r in results if r.get("team_id") == t2.get("id")), 0)
    return s1, s2

def format_score(match):
    t1, t2 = _teams(match)
    s1, s2 = _scores(match, t1, t2)
    league = match.get("league", {}).get("name", "")
    serie = match.get("serie", {}).get("full_name", "")
    mid = match.get("id", "")
    header = f"🔴 *AO VIVO* — {league}" + (f" | {serie}" if serie else "")
    return f"{header}\n🎮 `{t1.get('name','TBD')}` *{s1}* — *{s2}* `{t2.get('name','TBD')}`\n🆔 ID: `{mid}`"

def format_upcoming(match):
    t1, t2 = _teams(match)
    begin_at = match.get("begin_at", "")
    try:
        dt = datetime.fromisoformat(begin_at.replace("Z", "+00:00"))
        time_str = dt.strftime("%d/%m %H:%Mh UTC")
    except Exception:
        time_str = begin_at or "A definir"
    league = match.get("league", {}).get("name", "")
    serie = match.get("serie", {}).get("full_name", "")
    mid = match.get("id", "")
    header = f"📅 {league}" + (f" | {serie}" if serie else "")
    return f"{header}\n🏆 `{t1.get('name','TBD')}` vs `{t2.get('name','TBD')}`\n⏰ {time_str}\n🆔 ID: `{mid}`"

def format_past(match):
    t1, t2 = _teams(match)
    s1, s2 = _scores(match, t1, t2)
    winner_id = match.get("winner_id")
    n1, n2 = t1.get("name", "TBD"), t2.get("name", "TBD")
    if winner_id == t1.get("id"):
        line = f"✅ `{n1}` *{s1}* — *{s2}* `{n2}`"
    elif winner_id == t2.get("id"):
        line = f"`{n1}` *{s1}* — *{s2}* ✅ `{n2}`"
    else:
        line = f"`{n1}` *{s1}* — *{s2}* `{n2}`"
    league = match.get("league", {}).get("name", "")
    mid = match.get("id", "")
    return f"📊 {league}\n{line}\n🆔 ID: `{mid}`"


# ─────────────────────────────────────────────
#  Comandos
# ─────────────────────────────────────────────

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("🔴 Ao Vivo", callback_data="live"),
         InlineKeyboardButton("📅 Próximos", callback_data="upcoming")],
        [InlineKeyboardButton("📊 Resultados", callback_data="past"),
         InlineKeyboardButton("ℹ️ Ajuda", callback_data="help")],
    ]
    await update.message.reply_text(
        "🎮 *CS2 Live Scores Bot*\n\nAcompanhe partidas de CS2 em tempo real!\n\nEscolha uma opção:",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )

async def cmd_live(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message or update.callback_query.message
    await msg.reply_text("⏳ Buscando partidas ao vivo...")
    matches = get_live_matches()
    if not matches:
        await msg.reply_text("😴 Nenhuma partida ao vivo agora.\n\nTente /upcoming para ver os próximos jogos.")
        return
    text = f"🔴 *AO VIVO* — {len(matches)} partida(s)\n\n"
    text += "\n\n".join(format_score(m) for m in matches[:10])
    text += "\n\n_/match <ID> para detalhes_"
    await msg.reply_text(text, parse_mode="Markdown")

async def cmd_upcoming(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message or update.callback_query.message
    await msg.reply_text("⏳ Buscando próximas partidas...")
    matches = get_upcoming_matches(10)
    if not matches:
        await msg.reply_text("📭 Nenhuma partida futura encontrada.")
        return
    text = f"📅 *PRÓXIMAS PARTIDAS* — {len(matches)} encontradas\n\n"
    text += "\n\n".join(format_upcoming(m) for m in matches)
    text += "\n\n_/match <ID> para detalhes_"
    await msg.reply_text(text, parse_mode="Markdown")

async def cmd_past(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message or update.callback_query.message
    await msg.reply_text("⏳ Buscando resultados recentes...")
    matches = get_past_matches(10)
    if not matches:
        await msg.reply_text("📭 Nenhum resultado encontrado.")
        return
    text = f"📊 *RESULTADOS RECENTES* — {len(matches)} encontrados\n\n"
    text += "\n\n".join(format_past(m) for m in matches)
    await msg.reply_text(text, parse_mode="Markdown")

async def cmd_match(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("❌ Use: /match <ID>\nEx: /match 123456")
        return
    try:
        match_id = int(context.args[0])
    except ValueError:
        await update.message.reply_text("❌ ID inválido. Use um número inteiro.")
        return
    await update.message.reply_text(f"⏳ Buscando detalhes da partida {match_id}...")
    match = get_match_detail(match_id)
    if not match:
        await update.message.reply_text("❌ Partida não encontrada.")
        return

    status = match.get("status", "unknown")
    status_label = {"running": "🔴 Ao Vivo", "not_started": "📅 Agendada", "finished": "✅ Encerrada"}.get(status, status)
    t1, t2 = _teams(match)
    s1, s2 = _scores(match, t1, t2)
    league = match.get("league", {}).get("name", "")
    serie = match.get("serie", {}).get("full_name", "")
    tournament = match.get("tournament", {}).get("name", "")
    match_type = match.get("match_type", "")
    n_games = match.get("number_of_games", "")

    text = (
        f"🎮 *DETALHES DA PARTIDA*\n\n"
        f"*Status:* {status_label}\n"
        f"*Liga:* {league}\n"
        f"*Série:* {serie}\n"
        f"*Torneio:* {tournament}\n"
        f"*Formato:* {match_type} (MD{n_games})\n\n"
        f"🏆 `{t1.get('name','TBD')}` *{s1}* — *{s2}* `{t2.get('name','TBD')}`\n"
    )

    streams = match.get("streams_list", [])
    if streams:
        links = [f"[{s.get('language','?').upper()}]({s.get('raw_url','')})" for s in streams[:3] if s.get("raw_url")]
        if links:
            text += f"\n📺 *Streams:* {' | '.join(links)}"

    games = match.get("games", [])
    if games:
        text += f"\n\n*Mapas ({len(games)}):*"
        for g in games:
            gs = g.get("status", "")
            gname = g.get("map", {}).get("name", f"Jogo {g.get('position','?')}")
            if gs == "finished":
                w = g.get("winner") or {}
                text += f"\n  • {gname} → {w.get('name','')} ✅"
            elif gs == "running":
                text += f"\n  • {gname} 🔴"
            else:
                text += f"\n  • {gname} ⏳"

    await update.message.reply_text(text, parse_mode="Markdown", disable_web_page_preview=True)

async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message or update.callback_query.message
    await msg.reply_text(
        "ℹ️ *CS2 Live Scores Bot — Comandos*\n\n"
        "/live — 🔴 Partidas ao vivo\n"
        "/upcoming — 📅 Próximas partidas\n"
        "/past — 📊 Resultados recentes\n"
        "/match <ID> — 🔍 Detalhes de uma partida\n"
        "/help — ℹ️ Esta ajuda\n\n"
        "_Dados: PandaScore API_",
        parse_mode="Markdown",
    )

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    handlers = {"live": cmd_live, "upcoming": cmd_upcoming, "past": cmd_past, "help": cmd_help}
    handler = handlers.get(query.data)
    if handler:
        await handler(update, context)


# ─────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────

def main():
    if not TELEGRAM_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN não definido no .env")
    if not PANDASCORE_API_KEY:
        raise ValueError("PANDASCORE_API_KEY não definido no .env")

    app = Application.builder().token(TELEGRAM_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("live", cmd_live))
    app.add_handler(CommandHandler("upcoming", cmd_upcoming))
    app.add_handler(CommandHandler("past", cmd_past))
    app.add_handler(CommandHandler("match", cmd_match))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(CallbackQueryHandler(button_handler))

    logger.info("🤖 Bot CS2 iniciado! Pressione Ctrl+C para parar.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == "__main__":
    main()
BOTEOF

echo "  ✅ bot.py criado."

# ── 3. Criar .env ─────────────────────────────────────────────
echo -e "${GREEN}[3/4] Configurando variáveis de ambiente...${NC}"

if [ -f ".env" ]; then
    echo -e "  ${YELLOW}⚠️  .env já existe — pulando criação.${NC}"
else
    cat > .env << 'ENVEOF'
TELEGRAM_BOT_TOKEN=seu_token_aqui
PANDASCORE_API_KEY=sua_chave_aqui
ENVEOF
    echo "  ✅ .env criado."
fi

# ── 4. Verificar se as chaves foram preenchidas ───────────────
echo -e "${GREEN}[4/4] Verificando configuração...${NC}"

TOKEN_VAL=$(grep "TELEGRAM_BOT_TOKEN" .env | cut -d= -f2)
KEY_VAL=$(grep "PANDASCORE_API_KEY" .env | cut -d= -f2)

echo ""
echo -e "────────────────────────────────────────"

if [ "$TOKEN_VAL" = "seu_token_aqui" ] || [ "$KEY_VAL" = "sua_chave_aqui" ]; then
    echo -e "${YELLOW}⚠️  Configure as chaves no arquivo .env antes de rodar:${NC}"
    echo ""
    echo -e "  ${YELLOW}TELEGRAM_BOT_TOKEN${NC} → crie um bot com @BotFather no Telegram"
    echo -e "  ${YELLOW}PANDASCORE_API_KEY${NC}  → chave gratuita em https://pandascore.co"
    echo ""
    echo "  Edite o arquivo:"
    echo -e "  ${GREEN}nano .env${NC}"
    echo ""
    echo "  Depois rode:"
    echo -e "  ${GREEN}python bot.py${NC}"
else
    echo -e "${GREEN}✅ Tudo pronto! Rodando o bot...${NC}"
    echo ""
    python bot.py
fi

echo -e "────────────────────────────────────────"
