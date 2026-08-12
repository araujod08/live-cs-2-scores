import "server-only"

const BOT_CONTROL_URL = process.env.BOT_CONTROL_URL
const BOT_CONTROL_TOKEN = process.env.BOT_CONTROL_TOKEN

export interface BotStatus {
  online: boolean
  uptimeHuman?: string
  uptimeSeconds?: number
  pid?: number
  startedAt?: number
  error?: string
}

export function isBotControlConfigured(): boolean {
  return Boolean(BOT_CONTROL_URL && BOT_CONTROL_TOKEN)
}

function authHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${BOT_CONTROL_TOKEN}`,
    "Content-Type": "application/json",
  }
}

/** Busca o status do bot no servidor de controle. */
export async function fetchBotStatus(): Promise<BotStatus> {
  if (!isBotControlConfigured()) {
    return { online: false, error: "not_configured" }
  }

  try {
    const res = await fetch(`${BOT_CONTROL_URL!.replace(/\/$/, "")}/status`, {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
      // Evita travar o painel caso o servidor esteja fora do ar
      signal: AbortSignal.timeout(5000),
    })

    if (res.status === 401) return { online: false, error: "unauthorized" }
    if (!res.ok) return { online: false, error: `http_${res.status}` }

    const data = await res.json()
    return {
      online: data.status === "online",
      uptimeHuman: data.uptime_human,
      uptimeSeconds: data.uptime_seconds,
      pid: data.pid,
      startedAt: data.started_at,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown"
    return { online: false, error: message.includes("timeout") ? "timeout" : "unreachable" }
  }
}

/** Solicita o reinício do bot. */
export async function restartBot(): Promise<{ ok: boolean; error?: string }> {
  if (!isBotControlConfigured()) {
    return { ok: false, error: "not_configured" }
  }

  try {
    const res = await fetch(`${BOT_CONTROL_URL!.replace(/\/$/, "")}/restart`, {
      method: "POST",
      headers: authHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })

    if (res.status === 401) return { ok: false, error: "unauthorized" }
    if (!res.ok) return { ok: false, error: `http_${res.status}` }

    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown"
    return { ok: false, error: message.includes("timeout") ? "timeout" : "unreachable" }
  }
}
