"use client"

import { Share2, MessageCircle, Twitter, Link as LinkIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ShareButtonProps {
  title: string
  text: string
  url: string
  size?: "sm" | "md"
  className?: string
}

export function ShareButton({ title, text, url, size = "sm", className }: ShareButtonProps) {
  const handleCopy = async (e: Event) => {
    e.preventDefault()
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copiado")
    } catch {
      toast.error("Não foi possível copiar")
    }
  }

  const handleNativeShare = async (e: React.MouseEvent) => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      e.preventDefault()
      try {
        await navigator.share({ title, text, url })
      } catch {
        // user cancelled
      }
    }
  }

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`

  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"
  const buttonSize = size === "sm" ? "h-8 w-8" : "h-9 w-9"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          onClick={handleNativeShare}
          aria-label="Compartilhar"
          className={cn(
            "flex items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground",
            buttonSize,
            className,
          )}
        >
          <Share2 className={iconSize} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <MessageCircle className="mr-2 h-4 w-4" />
            WhatsApp
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
            <Twitter className="mr-2 h-4 w-4" />
            Twitter / X
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={handleCopy}>
          <LinkIcon className="mr-2 h-4 w-4" />
          Copiar link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
