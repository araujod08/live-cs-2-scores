#!/usr/bin/env bash
# Supervisor simples: mantém o bot rodando e o reinicia caso ele saia.
# Uso: ./run.sh
#
# Para rodar como serviço permanente numa VPS, prefira o systemd
# (veja bot/README.md), mas este loop funciona sem configuração extra.

set -u
cd "$(dirname "$0")"

while true; do
  echo "[run.sh] Iniciando o bot em $(date)"
  python3 bot.py
  EXIT_CODE=$?
  echo "[run.sh] Bot encerrou com código $EXIT_CODE. Reiniciando em 3s..."
  sleep 3
done
