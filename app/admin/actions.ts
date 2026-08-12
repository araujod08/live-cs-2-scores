"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import {
  verifyPassword,
  createSession,
  destroySession,
  isAuthenticated,
} from "@/lib/admin-auth"
import { restartBot } from "@/lib/bot-control"

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const password = String(formData.get("password") || "")

  if (!password) {
    return { error: "Digite a senha." }
  }

  if (!verifyPassword(password)) {
    return { error: "Senha incorreta." }
  }

  await createSession()
  redirect("/admin")
}

export async function logoutAction(): Promise<void> {
  await destroySession()
  redirect("/admin/login")
}

export async function restartBotAction(): Promise<{
  ok: boolean
  message: string
}> {
  // Só permite reiniciar se estiver autenticado
  if (!(await isAuthenticated())) {
    return { ok: false, message: "Não autorizado." }
  }

  const result = await restartBot()

  if (result.ok) {
    revalidatePath("/admin")
    return { ok: true, message: "Reinício solicitado com sucesso." }
  }

  const messages: Record<string, string> = {
    not_configured: "Servidor de controle do bot não configurado.",
    unauthorized: "Token de controle inválido.",
    timeout: "O servidor do bot não respondeu (timeout).",
    unreachable: "Não foi possível conectar ao servidor do bot.",
  }

  return {
    ok: false,
    message: messages[result.error || ""] || `Falha ao reiniciar (${result.error}).`,
  }
}
