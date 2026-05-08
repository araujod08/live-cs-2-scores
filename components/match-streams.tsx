"use client"

import { ExternalLink, Video, Star } from "lucide-react"
import type { MatchStream } from "@/lib/types"
import { cn } from "@/lib/utils"

interface MatchStreamsProps {
  streams: MatchStream[]
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "Inglês",
  pt: "Português",
  br: "Português (BR)",
  es: "Espanhol",
  fr: "Francês",
  de: "Alemão",
  ru: "Russo",
  cn: "Chinês",
  zh: "Chinês",
  ja: "Japonês",
  ko: "Coreano",
}

export function MatchStreams({ streams }: MatchStreamsProps) {
  if (streams.length === 0) return null

  const sorted = [...streams].sort((a, b) => {
    if (a.main && !b.main) return -1
    if (!a.main && b.main) return 1
    if (a.official && !b.official) return -1
    if (!a.official && b.official) return 1
    return 0
  })

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-secondary/40 px-4 py-3">
        <Video className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">Onde assistir</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {streams.length} {streams.length === 1 ? "stream" : "streams"}
        </span>
      </div>
      <ul className="divide-y divide-border">
        {sorted.slice(0, 8).map((stream, idx) => {
          const lang = stream.language?.toLowerCase() || ""
          const langName = LANGUAGE_NAMES[lang] || stream.language?.toUpperCase() || "Stream"
          let host = ""
          try {
            host = new URL(stream.url).hostname.replace("www.", "")
          } catch {
            host = stream.url
          }
          return (
            <li key={`${stream.url}-${idx}`}>
              <a
                href={stream.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/30",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg",
                    stream.main ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground",
                  )}
                >
                  {stream.main ? (
                    <Star className="h-4 w-4 fill-current" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate">
                      {host}
                    </span>
                    {stream.main && (
                      <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        PRINCIPAL
                      </span>
                    )}
                    {stream.official && !stream.main && (
                      <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
                        OFICIAL
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{langName}</span>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </a>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
