"""
Servidor de controle HTTP do CS2 Bot.

Roda numa thread separada junto com o bot e expõe endpoints protegidos por
token para monitoramento e reinício remoto (usado pelo painel admin web).

Endpoints:
    GET  /status   -> retorna status/uptime do bot (JSON)
    POST /restart  -> reinicia o processo do bot (os.execv)

Autenticação:
    Todos os endpoints exigem o header:  Authorization: Bearer <BOT_CONTROL_TOKEN>
"""

import os
import sys
import json
import time
import logging
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

logger = logging.getLogger(__name__)

# Momento em que o processo iniciou (para calcular uptime)
_START_TIME = time.time()

CONTROL_TOKEN = os.getenv("BOT_CONTROL_TOKEN")
CONTROL_PORT = int(os.getenv("BOT_CONTROL_PORT", "8080"))
CONTROL_HOST = os.getenv("BOT_CONTROL_HOST", "0.0.0.0")


def _format_uptime(seconds: float) -> str:
    seconds = int(seconds)
    days, seconds = divmod(seconds, 86400)
    hours, seconds = divmod(seconds, 3600)
    minutes, seconds = divmod(seconds, 60)
    parts = []
    if days:
        parts.append(f"{days}d")
    if hours:
        parts.append(f"{hours}h")
    if minutes:
        parts.append(f"{minutes}m")
    parts.append(f"{seconds}s")
    return " ".join(parts)


class _ControlHandler(BaseHTTPRequestHandler):
    # Silencia o log padrão barulhento do http.server
    def log_message(self, format, *args):
        logger.debug("control_server: " + format, *args)

    def _send_json(self, status_code: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _authorized(self) -> bool:
        if not CONTROL_TOKEN:
            # Sem token configurado, recusa por segurança
            return False
        auth = self.headers.get("Authorization", "")
        expected = f"Bearer {CONTROL_TOKEN}"
        # Comparação simples; tokens são de uso interno
        return auth == expected

    def do_GET(self):
        if self.path.rstrip("/") == "/status":
            if not self._authorized():
                self._send_json(401, {"error": "unauthorized"})
                return
            uptime = time.time() - _START_TIME
            self._send_json(
                200,
                {
                    "status": "online",
                    "uptime_seconds": int(uptime),
                    "uptime_human": _format_uptime(uptime),
                    "pid": os.getpid(),
                    "started_at": int(_START_TIME),
                },
            )
            return
        self._send_json(404, {"error": "not_found"})

    def do_POST(self):
        if self.path.rstrip("/") == "/restart":
            if not self._authorized():
                self._send_json(401, {"error": "unauthorized"})
                return
            self._send_json(200, {"status": "restarting"})
            logger.info("control_server: reinício solicitado via painel admin")
            # Dá tempo para a resposta ser enviada antes de re-executar o processo
            threading.Thread(target=_do_restart, daemon=True).start()
            return
        self._send_json(404, {"error": "not_found"})


def _do_restart():
    time.sleep(0.5)
    logger.info("control_server: reiniciando processo do bot...")
    # Re-executa o mesmo processo Python, substituindo a imagem atual.
    # Funciona sem supervisor externo. Com systemd/run.sh, prefira sys.exit.
    os.execv(sys.executable, [sys.executable] + sys.argv)


def start_control_server():
    """Inicia o servidor de controle numa thread daemon (não bloqueia o bot)."""
    if not CONTROL_TOKEN:
        logger.warning(
            "control_server: BOT_CONTROL_TOKEN não definido — servidor de controle DESATIVADO."
        )
        return None

    server = ThreadingHTTPServer((CONTROL_HOST, CONTROL_PORT), _ControlHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    logger.info(
        f"control_server: escutando em {CONTROL_HOST}:{CONTROL_PORT} (endpoints /status e /restart)"
    )
    return server
