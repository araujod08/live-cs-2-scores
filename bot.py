"""
CS2 Live Scores - Telegram Bot
Funcionalidades:
- Buscar times
- Favoritar / desfavoritar times
- Notificações automáticas de partidas dos times favoritos
- Placar ao vivo, próximos jogos e resultados
"""

import os
import json
import logging
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
    MessageHandler,
    filters,
)

load_dotenv(".env.local")

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
PANDASCORE_API_KEY = os.getenv("PANDASCORE_API_KEY")
PANDASCORE_BASE_URL = "https://api.pandascore.co"

# Arquivo local para persistir favoritos e estado de notificações
DATA_FILE = "favorites.json"

# Intervalo de verificação de notificações (em segundos)
NOTIFY_INTERVAL = 300  # 5 minutos

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────
#  Persistência de dados (JSON local)
# ─────────────────────────────────────────────

def load_data() -> dict:
    """Carrega dados do arquivo JSON."""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    return {}


def save_data(data: dict):
    """Salva dados no arquivo JSON."""
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def get_user_data(user_id: int) -> dict:
    """Retorna dados de um usuário específico."""
    data = load_data()
    uid = str(user_id)
    if uid not in data:
        data[uid] = {
            "favorites": {},       # {team_id: {"name": str, "slug": str}}
            "notifications": True, # notificações globais on/off
            "notified_matches": [] # IDs de partidas já notificadas
        }
        save_data(data)
    return data[uid]


def save_user_data(user_id: int, user_data: dict):
    """Salva dados de um usuário específico."""
    data = load_data()
    data[str(user_id)] = user_data
    save_data(data)


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


def search_teams(query: str) -> list:
    return pandascore_get("/csgo/teams", {"search[name]": query, "per_page": 8}) or []


def get_team_upcoming(team_id: int, per_page: int = 5) -> list:
    return pandascore_get("/csgo/matches/upcoming", {
        "filter[opponent_id]": team_id,
        "per_page": per_page,
        "sort": "begin_at"
    }) or []


def get_team_live(team_id: int) -> list:
    return pandascore_get("/csgo/matches/running", {
        "filter[opponent_id]": team_id,
    }) or []


def get_live_matches() -> list:
    return pandascore_get("/csgo/matches/running") or []


def get_upcoming_matches(per_page: int = 10) -> list:
    return pandascore_get("/csgo/matches/upcoming", {"per_page": per_page, "sort": "begin_at"}) or []


def get_past_matches(per_page: int = 10) -> list:
    return pandascore_get("/csgo/matches/past", {"per_page": per_page, "sort": "-begin_at"}) or []


def get_match_detail(match_id: int):
    return pandascore_get(f"/csgo/matches/{match_id}")


def get_all_upcoming_for_teams(team_ids: list) -> list:
    """Busca partidas futuras de múltiplos times."""
    matches = []
    for team_id in team_ids:
        team_matches = get_team_upcoming(int(team_id), per_page=3)
        for m in team_matches:
            if not any(x.get("id") == m.get("id") for x in matches):
                matches.append(m)
    matches.sort(key=lambda m: m.get("begin_at") or "")
    return matches


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


def format_datetime(begin_at: str) -> str:
    if not begin_at:
        return "A definir"
    try:
        dt = datetime.fromisoformat(begin_at.replace("Z", "+00:00"))
        return dt.strftime("%d/%m/%Y às %H:%Mh UTC")
    except Exception:
        return begin_at


def format_upcoming_match(match: dict, highlight_team_id: int = None) -> str:
    t1, t2 = _teams(match)
    n1, n2 = t1.get("name", "TBD"), t2.get("name", "TBD")

    # Destaca o time favorito em negrito
    if highlight_team_id:
        if t1.get("id") == highlight_team_id:
            n1 = f"*{n1}*"
        elif t2.get("id") == highlight_team_id:
            n2 = f"*{n2}*"

    league = match.get("league", {}).get("name", "")
    serie = match.get("serie", {}).get("full_name", "")
    tournament = match.get("tournament", {}).get("name", "")
    begin_at = format_datetime(match.get("begin_at", ""))
    match_type = match.get("match_type", "")
    n_games = match.get("number_of_games", "")
    mid = match.get("id", "")

    campeonato = " | ".join(filter(None, [league, serie]))

    lines = [
        f"🏆 {campeonato}",
        f"🎮 {n1} vs {n2}",
        f"📋 {tournament}" if tournament else None,
        f"📅 {begin_at}",
        f"🎯 Formato: {match_type} (MD{n_games})" if match_type else None,
        f"🆔 ID: `{mid}`",
    ]
    return "\n".join(filter(None, lines))


def format_live_match(match: dict) -> str:
    t1, t2 = _teams(match)
    s1, s2 = _scores(match, t1, t2)
    league = match.get("league", {}).get("name", "")
    serie = match.get("serie", {}).get("full_name", "")
    mid = match.get("id", "")
    campeonato = " | ".join(filter(None, [league, serie]))
    return (
        f"🔴 *AO VIVO* — {campeonato}\n"
        f"🎮 `{t1.get('name','TBD')}` *{s1}* — *{s2}* `{t2.get('name','TBD')}`\n"
        f"🆔 ID: `{mid}`"
    )


def format_past_match(match: dict) -> str:
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
#  Menu principal
# ─────────────────────────────────────────────

def main_menu_keyboard():
    return InlineKeyboardMarkup([
        [InlineKeyboardButton("🔴 Ao Vivo", callback_data="live"),
         InlineKeyboardButton("📅 Próximos", callback_data="upcoming")],
        [InlineKeyboardButton("📊 Resultados", callback_data="past"),
         InlineKeyboardButton("⭐ Favoritos", callback_data="favorites")],
        [InlineKeyboardButton("🔔 Notificações", callback_data="notifications"),
         InlineKeyboardButton("ℹ️ Ajuda", callback_data="help")],
    ])


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text(
        "🎮 *CS2 Live Scores Bot*\n\n"
        "Acompanhe partidas de CS2 e receba notificações dos seus times favoritos!\n\n"
        "Escolha uma opção:",
        parse_mode="Markdown",
        reply_markup=main_menu_keyboard(),
    )


# ─────────────────────────────────────────────
#  Busca de times
# ─────────────────────────────────────────────

async def cmd_search(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text(
            "🔍 *Buscar time*\n\nUse: /search <nome do time>\n\nEx: `/search FURIA`",
            parse_mode="Markdown",
        )
        return

    query = " ".join(context.args)
    await update.message.reply_text(f"🔍 Buscando times com *{query}*...", parse_mode="Markdown")

    teams = search_teams(query)
    if not teams:
        await update.message.reply_text(
            f"😕 Nenhum time encontrado para *{query}*.\n\nTente outro nome.",
            parse_mode="Markdown",
        )
        return

    user_data = get_user_data(update.effective_user.id)
    favorites = user_data.get("favorites", {})

    text = f"🔍 *Resultados para \"{query}\"* — {len(teams)} time(s)\n\n"
    keyboard = []

    for team in teams:
        tid = str(team.get("id", ""))
        name = team.get("name", "Desconhecido")
        acronym = team.get("acronym", "")
        location = team.get("location", "")

        is_fav = tid in favorites
        fav_icon = "⭐" if is_fav else "☆"

        info = f"*{name}*"
        if acronym:
            info += f" ({acronym})"
        if location:
            info += f" 🌍 {location}"

        text += f"{fav_icon} {info}\n"

        label = f"{'➖ Remover' if is_fav else '➕ Favoritar'} {name}"
        action = f"unfav_{tid}" if is_fav else f"fav_{tid}_{name[:20]}"
        keyboard.append([InlineKeyboardButton(label, callback_data=action)])

    keyboard.append([InlineKeyboardButton("🔙 Menu", callback_data="menu")])

    await update.message.reply_text(
        text,
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ─────────────────────────────────────────────
#  Favoritos
# ─────────────────────────────────────────────

async def show_favorites(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message or update.callback_query.message
    user_id = update.effective_user.id
    user_data = get_user_data(user_id)
    favorites = user_data.get("favorites", {})
    notif_on = user_data.get("notifications", True)

    if not favorites:
        keyboard = [
            [InlineKeyboardButton("🔍 Buscar times", callback_data="search_prompt")],
            [InlineKeyboardButton("🔙 Menu", callback_data="menu")],
        ]
        await msg.reply_text(
            "⭐ *Seus Times Favoritos*\n\n"
            "Você ainda não tem times favoritos.\n\n"
            "Use /search <nome> para buscar e favoritar times!",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return

    notif_status = "🔔 Ativadas" if notif_on else "🔕 Desativadas"
    text = f"⭐ *Seus Times Favoritos* | Notificações: {notif_status}\n\n"

    keyboard = []
    for tid, tdata in favorites.items():
        name = tdata.get("name", "Time")
        text += f"• *{name}*\n"
        keyboard.append([
            InlineKeyboardButton(f"📅 Próximos — {name}", callback_data=f"team_upcoming_{tid}"),
            InlineKeyboardButton(f"➖ Remover", callback_data=f"unfav_{tid}"),
        ])

    keyboard.append([
        InlineKeyboardButton("🔔 Gerenciar notificações", callback_data="notifications"),
        InlineKeyboardButton("🔍 Buscar", callback_data="search_prompt"),
    ])
    keyboard.append([InlineKeyboardButton("🔙 Menu", callback_data="menu")])

    await msg.reply_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))


async def show_team_upcoming(update: Update, context: ContextTypes.DEFAULT_TYPE, team_id: str):
    msg = update.callback_query.message
    user_data = get_user_data(update.effective_user.id)
    team_name = user_data["favorites"].get(team_id, {}).get("name", f"Time {team_id}")

    searching_msg = await msg.reply_text(
        f"Buscando proximas partidas de {team_name}..."
    )

    keyboard = [[InlineKeyboardButton("Voltar aos Favoritos", callback_data="favorites")]]

    matches = get_team_upcoming(int(team_id), per_page=5)
    live = get_team_live(int(team_id))

    logger.info(f"Time {team_id} ({team_name}): live={len(live)}, upcoming={len(matches)}")

    if not live and not matches:
        await searching_msg.edit_text(
            f"Nao ha partidas agendadas para {team_name} no momento.\n\n"
            f"Voce sera notificado quando uma partida for marcada.",
            reply_markup=InlineKeyboardMarkup(keyboard),
        )
        return

    lines = [f"Proximas partidas — {team_name}", ""]

    if live:
        lines.append("AO VIVO AGORA:")
        for m in live:
            t1, t2 = _teams(m)
            s1, s2 = _scores(m, t1, t2)
            league = m.get("league", {}).get("name", "")
            lines.append(f"[AO VIVO] {t1.get('name','TBD')} {s1} x {s2} {t2.get('name','TBD')} — {league}")
        lines.append("")

    if matches:
        lines.append("Agendados:")
        for m in matches:
            t1, t2 = _teams(m)
            league = m.get("league", {}).get("name", "")
            serie = m.get("serie", {}).get("full_name", "")
            tournament = m.get("tournament", {}).get("name", "")
            begin_at = format_datetime(m.get("begin_at", ""))
            campeonato = " | ".join(filter(None, [league, serie, tournament]))
            lines.append(f"")
            lines.append(f"{t1.get('name','TBD')} vs {t2.get('name','TBD')}")
            lines.append(f"Campeonato: {campeonato}")
            lines.append(f"Data: {begin_at}")
            lines.append(f"ID: {m.get('id','')}")

    await searching_msg.edit_text(
        "\n".join(lines),
        reply_markup=InlineKeyboardMarkup(keyboard),
    )


# ─────────────────────────────────────────────
#  Notificações
# ─────────────────────────────────────────────

async def show_notifications(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message or update.callback_query.message
    user_id = update.effective_user.id
    user_data = get_user_data(user_id)
    notif_on = user_data.get("notifications", True)
    favorites = user_data.get("favorites", {})

    status = "🔔 *Ativadas*" if notif_on else "🔕 *Desativadas*"
    fav_count = len(favorites)

    text = (
        f"🔔 *Configurações de Notificações*\n\n"
        f"Status atual: {status}\n"
        f"Times monitorados: *{fav_count}*\n\n"
        f"Quando ativadas, você receberá alertas:\n"
        f"• 🕐 24h antes de uma partida começar\n"
        f"• 🕐 1h antes de uma partida começar\n"
        f"• 🔴 Quando uma partida ao vivo começar\n\n"
        f"_Os alertas são verificados a cada 5 minutos._"
    )

    toggle_label = "🔕 Desativar notificações" if notif_on else "🔔 Ativar notificações"
    keyboard = [
        [InlineKeyboardButton(toggle_label, callback_data="toggle_notif")],
        [InlineKeyboardButton("⭐ Ver favoritos", callback_data="favorites")],
        [InlineKeyboardButton("🔙 Menu", callback_data="menu")],
    ]

    await msg.reply_text(text, parse_mode="Markdown", reply_markup=InlineKeyboardMarkup(keyboard))


# ─────────────────────────────────────────────
#  Comandos de texto
# ─────────────────────────────────────────────

async def cmd_live(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message or update.callback_query.message
    await msg.reply_text("⏳ Buscando partidas ao vivo...")
    matches = get_live_matches()
    if not matches:
        await msg.reply_text(
            "😴 Nenhuma partida ao vivo agora.\n\nUse /upcoming para ver os próximos jogos.",
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Menu", callback_data="menu")]]),
        )
        return
    text = f"🔴 *AO VIVO* — {len(matches)} partida(s)\n\n"
    text += "\n\n".join(format_live_match(m) for m in matches[:10])
    text += "\n\n_/match <ID> para detalhes_"
    await msg.reply_text(text, parse_mode="Markdown",
                         reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Menu", callback_data="menu")]]))


async def cmd_upcoming(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message or update.callback_query.message
    await msg.reply_text("⏳ Buscando próximas partidas...")
    matches = get_upcoming_matches(10)
    if not matches:
        await msg.reply_text("📭 Nenhuma partida futura encontrada.")
        return
    text = f"📅 *PRÓXIMAS PARTIDAS* — {len(matches)} encontradas\n\n"
    text += "\n\n".join(format_upcoming_match(m) for m in matches)
    text += "\n\n_/match <ID> para detalhes_"
    await msg.reply_text(text, parse_mode="Markdown",
                         reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Menu", callback_data="menu")]]))


async def cmd_past(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message or update.callback_query.message
    await msg.reply_text("⏳ Buscando resultados recentes...")
    matches = get_past_matches(10)
    if not matches:
        await msg.reply_text("📭 Nenhum resultado encontrado.")
        return
    text = f"📊 *RESULTADOS RECENTES* — {len(matches)} encontrados\n\n"
    text += "\n\n".join(format_past_match(m) for m in matches)
    await msg.reply_text(text, parse_mode="Markdown",
                         reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Menu", callback_data="menu")]]))


async def cmd_match(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("❌ Use: /match <ID>\nEx: /match 123456")
        return
    try:
        match_id = int(context.args[0])
    except ValueError:
        await update.message.reply_text("❌ ID inválido.")
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
    begin_at = format_datetime(match.get("begin_at", ""))

    text = (
        f"🎮 *DETALHES DA PARTIDA*\n\n"
        f"*Status:* {status_label}\n"
        f"*Data:* {begin_at}\n"
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
        "*/start* — Menu principal\n"
        "*/search <time>* — 🔍 Buscar e favoritar times\n"
        "*/favorites* — ⭐ Ver seus times favoritos\n"
        "*/notifications* — 🔔 Ativar/desativar notificações\n"
        "*/live* — 🔴 Partidas ao vivo\n"
        "*/upcoming* — 📅 Próximas partidas\n"
        "*/past* — 📊 Resultados recentes\n"
        "*/match <ID>* — 🔍 Detalhes de uma partida\n\n"
        "_Dados: PandaScore API_",
        parse_mode="Markdown",
        reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🔙 Menu", callback_data="menu")]]),
    )


# ─────────────────────────────────────────────
#  Handler de callbacks (botões inline)
# ─────────────────────────────────────────────

async def button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    user_id = update.effective_user.id

    # ── Menu principal
    if data == "menu":
        await query.message.reply_text(
            "🎮 *CS2 Live Scores Bot*\n\nEscolha uma opção:",
            parse_mode="Markdown",
            reply_markup=main_menu_keyboard(),
        )

    # ── Partidas
    elif data == "live":
        await cmd_live(update, context)
    elif data == "upcoming":
        await cmd_upcoming(update, context)
    elif data == "past":
        await cmd_past(update, context)

    # ── Favoritos
    elif data == "favorites":
        await show_favorites(update, context)

    elif data == "search_prompt":
        await query.message.reply_text(
            "🔍 Use o comando abaixo para buscar times:\n\n`/search <nome do time>`\n\nEx: `/search FURIA`",
            parse_mode="Markdown",
        )

    elif data.startswith("fav_"):
        # fav_<team_id>_<team_name>
        parts = data.split("_", 2)
        tid = parts[1]
        tname = parts[2] if len(parts) > 2 else f"Time {tid}"

        user_data = get_user_data(user_id)
        user_data["favorites"][tid] = {"name": tname}
        save_user_data(user_id, user_data)

        await query.message.reply_text(
            f"⭐ *{tname}* adicionado aos favoritos!\n\n"
            f"Você receberá notificações das partidas deste time.\n"
            f"Use /notifications para gerenciar alertas.",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("📅 Ver próximas partidas", callback_data=f"team_upcoming_{tid}")],
                [InlineKeyboardButton("⭐ Ver favoritos", callback_data="favorites")],
            ]),
        )

    elif data.startswith("unfav_"):
        tid = data.replace("unfav_", "")
        user_data = get_user_data(user_id)
        tname = user_data["favorites"].get(tid, {}).get("name", f"Time {tid}")
        user_data["favorites"].pop(tid, None)
        save_user_data(user_id, user_data)

        await query.message.reply_text(
            f"➖ *{tname}* removido dos favoritos.",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("⭐ Ver favoritos", callback_data="favorites")],
                [InlineKeyboardButton("🔙 Menu", callback_data="menu")],
            ]),
        )

    elif data.startswith("team_upcoming_"):
        tid = data.replace("team_upcoming_", "")
        await show_team_upcoming(update, context, tid)

    # ── Notificações
    elif data == "notifications":
        await show_notifications(update, context)

    elif data == "toggle_notif":
        user_data = get_user_data(user_id)
        current = user_data.get("notifications", True)
        user_data["notifications"] = not current
        save_user_data(user_id, user_data)

        new_status = "🔔 *Ativadas*" if not current else "🔕 *Desativadas*"
        await query.message.reply_text(
            f"✅ Notificações {new_status}!",
            parse_mode="Markdown",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("🔔 Configurações", callback_data="notifications")],
                [InlineKeyboardButton("🔙 Menu", callback_data="menu")],
            ]),
        )

    # ── Ajuda
    elif data == "help":
        await cmd_help(update, context)


# ─────────────────────────────────────────────
#  Job de notificações automáticas
# ─────────────────────────────────────────────

async def check_and_notify(context: ContextTypes.DEFAULT_TYPE):
    """Verifica partidas dos times favoritos e envia alertas."""
    logger.info("🔔 Verificando notificações...")
    all_data = load_data()
    now = datetime.now(timezone.utc)

    for user_id_str, user_data in all_data.items():
        if not user_data.get("notifications", True):
            continue
        favorites = user_data.get("favorites", {})
        if not favorites:
            continue

        notified = set(user_data.get("notified_matches", []))
        new_notified = set(notified)
        team_ids = list(favorites.keys())

        # Verificar partidas ao vivo
        for tid in team_ids:
            live_matches = get_team_live(int(tid))
            for match in live_matches:
                mid = match.get("id")
                notif_key = f"live_{mid}"
                if notif_key not in notified:
                    t1, t2 = _teams(match)
                    league = match.get("league", {}).get("name", "")
                    serie = match.get("serie", {}).get("full_name", "")
                    campeonato = " | ".join(filter(None, [league, serie]))
                    team_name = favorites[tid].get("name", "")

                    msg = (
                        f"🔴 *PARTIDA AO VIVO!*\n\n"
                        f"⭐ Seu time favorito *{team_name}* está jogando!\n\n"
                        f"🏆 {campeonato}\n"
                        f"🎮 `{t1.get('name','TBD')}` vs `{t2.get('name','TBD')}`\n\n"
                        f"Use /match {mid} para ver detalhes e placar ao vivo!"
                    )
                    try:
                        await context.bot.send_message(
                            chat_id=int(user_id_str),
                            text=msg,
                            parse_mode="Markdown",
                        )
                        new_notified.add(notif_key)
                    except Exception as e:
                        logger.error(f"Erro ao notificar {user_id_str}: {e}")

        # Verificar partidas futuras (24h e 1h antes)
        upcoming = get_all_upcoming_for_teams(team_ids)
        for match in upcoming:
            begin_at = match.get("begin_at")
            if not begin_at:
                continue
            try:
                match_dt = datetime.fromisoformat(begin_at.replace("Z", "+00:00"))
            except Exception:
                continue

            diff_hours = (match_dt - now).total_seconds() / 3600
            mid = match.get("id")
            t1, t2 = _teams(match)
            league = match.get("league", {}).get("name", "")
            serie = match.get("serie", {}).get("full_name", "")
            tournament = match.get("tournament", {}).get("name", "")
            campeonato = " | ".join(filter(None, [league, serie]))
            time_str = match_dt.strftime("%d/%m às %H:%Mh UTC")

            # Descobre qual time favorito está nessa partida
            team_in_match = None
            for tid in team_ids:
                if t1.get("id") == int(tid) or t2.get("id") == int(tid):
                    team_in_match = favorites[tid].get("name", "")
                    break

            if not team_in_match:
                continue

            # Alerta 24h antes
            if 23 <= diff_hours <= 25:
                notif_key = f"24h_{mid}"
                if notif_key not in notified:
                    msg = (
                        f"📅 *LEMBRETE — 24h para o jogo!*\n\n"
                        f"⭐ *{team_in_match}* joga amanhã!\n\n"
                        f"🏆 {campeonato}\n"
                        f"📋 {tournament}\n"
                        f"🎮 `{t1.get('name','TBD')}` vs `{t2.get('name','TBD')}`\n"
                        f"⏰ {time_str}\n\n"
                        f"Use /match {mid} para mais detalhes."
                    )
                    try:
                        await context.bot.send_message(
                            chat_id=int(user_id_str), text=msg, parse_mode="Markdown"
                        )
                        new_notified.add(notif_key)
                    except Exception as e:
                        logger.error(f"Erro ao notificar {user_id_str}: {e}")

            # Alerta 1h antes
            elif 0.75 <= diff_hours <= 1.25:
                notif_key = f"1h_{mid}"
                if notif_key not in notified:
                    msg = (
                        f"⚡ *LEMBRETE — 1h para o jogo!*\n\n"
                        f"⭐ *{team_in_match}* joga em breve!\n\n"
                        f"🏆 {campeonato}\n"
                        f"📋 {tournament}\n"
                        f"🎮 `{t1.get('name','TBD')}` vs `{t2.get('name','TBD')}`\n"
                        f"⏰ {time_str}\n\n"
                        f"Use /match {mid} para mais detalhes."
                    )
                    try:
                        await context.bot.send_message(
                            chat_id=int(user_id_str), text=msg, parse_mode="Markdown"
                        )
                        new_notified.add(notif_key)
                    except Exception as e:
                        logger.error(f"Erro ao notificar {user_id_str}: {e}")

        # Salva IDs notificados (mantém só os últimos 200 para não crescer infinito)
        user_data["notified_matches"] = list(new_notified)[-200:]
        save_user_data(int(user_id_str), user_data)


# ─────────────────────────────────────────────
#  Main
# ─────────────────────────────────────────────

def main():
    if not TELEGRAM_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN não definido no .env.local")
    if not PANDASCORE_API_KEY:
        raise ValueError("PANDASCORE_API_KEY não definido no .env.local")

    app = Application.builder().token(TELEGRAM_TOKEN).build()

    # Comandos
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("search", cmd_search))
    app.add_handler(CommandHandler("favorites", show_favorites))
    app.add_handler(CommandHandler("notifications", show_notifications))
    app.add_handler(CommandHandler("live", cmd_live))
    app.add_handler(CommandHandler("upcoming", cmd_upcoming))
    app.add_handler(CommandHandler("past", cmd_past))
    app.add_handler(CommandHandler("match", cmd_match))
    app.add_handler(CommandHandler("help", cmd_help))

    # Botões inline
    app.add_handler(CallbackQueryHandler(button_handler))

    # Job de notificações automáticas (a cada 5 minutos)
    app.job_queue.run_repeating(check_and_notify, interval=NOTIFY_INTERVAL, first=30)

    logger.info("🤖 CS2 Bot iniciado! Pressione Ctrl+C para parar.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()