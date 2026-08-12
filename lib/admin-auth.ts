import "server-only"

import { cookies } from "next/headers"
import { createHmac, timingSafeEqual } from "crypto"

const COOKIE_NAME = "cs2_admin_session"
const SESSION_MAX_AGE = 60 * 60 * 8 // 8 horas

function getAdminPassword(): string | null {
  return process.env.ADMIN_PASSWORD || null
}

/**
 * Gera o valor da sessão: HMAC(expiração) assinado com a senha de admin.
 * Como a senha é o segredo, o cookie não pode ser forjado sem conhecê-la.
 */
function signSession(expiresAt: number, password: string): string {
  const payload = String(expiresAt)
  const sig = createHmac("sha256", password).update(payload).digest("hex")
  return `${payload}.${sig}`
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/** Verifica a senha enviada no login (comparação em tempo constante). */
export function verifyPassword(input: string): boolean {
  const password = getAdminPassword()
  if (!password) return false
  return safeEqual(input, password)
}

/** Cria a sessão de admin e grava o cookie httpOnly. */
export async function createSession(): Promise<void> {
  const password = getAdminPassword()
  if (!password) throw new Error("ADMIN_PASSWORD não configurada")

  const expiresAt = Date.now() + SESSION_MAX_AGE * 1000
  const value = signSession(expiresAt, password)

  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  })
}

/** Remove a sessão de admin. */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/** Retorna true se o request atual tem uma sessão de admin válida. */
export async function isAuthenticated(): Promise<boolean> {
  const password = getAdminPassword()
  if (!password) return false

  const cookieStore = await cookies()
  const raw = cookieStore.get(COOKIE_NAME)?.value
  if (!raw) return false

  const [payload, sig] = raw.split(".")
  if (!payload || !sig) return false

  // Recalcula a assinatura esperada
  const expected = createHmac("sha256", password).update(payload).digest("hex")
  if (!safeEqual(sig, expected)) return false

  // Verifica expiração
  const expiresAt = Number(payload)
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false

  return true
}

/** True se a senha de admin foi configurada no ambiente. */
export function isAdminConfigured(): boolean {
  return Boolean(getAdminPassword())
}
