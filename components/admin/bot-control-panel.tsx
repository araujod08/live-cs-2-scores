"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCw, Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { restartBotAction } from "@/app/admin/actions"
import type { BotStatus } from "@/lib/bot-control"
import { cn } from "@/lib/utils"

interface BotControlPanelProps {
  status: BotStatus
  configured: boolean
}

export function BotControlPanel({ status, configured }: BotControlPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [restarting, setRestarting] = useState(false)
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [confirming, setConfirming] = useState(false)

  const handleRestart = () => {
    setFeedback(null)
    setRestarting(true)
    startTransition(async () => {
      const result = await restartBotAction()
      setFeedback(result)
      setRestarting(false)
      setConfirming(false)
      // Atualiza o status após alguns segundos (bot reiniciando)
      setTimeout(() => router.refresh(), 4000)
    })
  }

  const online = status.online

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "relative flex h-3 w-3",
              online ? "text-live" : "text-muted-foreground",
            )}
          >
            {online && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-live opacity-60" />
            )}
            <span
              className={cn(
                "relative inline-flex h-3 w-3 rounded-full",
                online ? "bg-live" : "bg-muted-foreground",
              )}
            />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Bot do Telegram</h2>
            <p className="text-xs text-muted-foreground">
              {online ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.refresh()}
          className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="Atualizar status"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Atualizar
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-4 px-5 py-4">
        {!configured ? (
          <p className="rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm text-muted-foreground">
            O servidor de controle do bot não está configurado. Defina{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">BOT_CONTROL_URL</code>{" "}
            e{" "}
            <code className="rounded bg-secondary px-1 py-0.5 text-xs">BOT_CONTROL_TOKEN</code>{" "}
            no projeto.
          </p>
        ) : (
          <>
            {/* Métricas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/40 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">Uptime</p>
                <p className="text-sm font-semibold text-foreground">
                  {online ? status.uptimeHuman || "—" : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-secondary/40 px-3 py-2.5">
                <p className="text-xs text-muted-foreground">PID</p>
                <p className="text-sm font-semibold text-foreground">
                  {online ? status.pid ?? "—" : "—"}
                </p>
              </div>
            </div>

            {!online && status.error && (
              <p className="rounded-lg border border-live/40 bg-live/10 px-3 py-2 text-xs text-live">
                {status.error === "timeout"
                  ? "O servidor do bot não respondeu (timeout)."
                  : status.error === "unauthorized"
                    ? "Token de controle inválido."
                    : status.error === "unreachable"
                      ? "Não foi possível conectar ao servidor do bot."
                      : `Erro: ${status.error}`}
              </p>
            )}

            {/* Feedback do reinício */}
            {feedback && (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                  feedback.ok
                    ? "border border-primary/40 bg-primary/10 text-primary"
                    : "border border-live/40 bg-live/10 text-live",
                )}
              >
                {feedback.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0" />
                )}
                {feedback.message}
              </div>
            )}

            {/* Botão de reinício com confirmação */}
            {confirming ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-foreground">
                  Tem certeza que deseja reiniciar o bot? Ele ficará indisponível por
                  alguns segundos.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleRestart}
                    disabled={isPending || restarting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-live px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-live/90 disabled:opacity-50"
                  >
                    {restarting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Reiniciando...
                      </>
                    ) : (
                      "Confirmar reinício"
                    )}
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={isPending || restarting}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setFeedback(null)
                  setConfirming(true)
                }}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <RotateCw className="h-4 w-4" />
                Reiniciar bot
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
