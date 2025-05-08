"use client"

import { SessionProvider } from "next-auth/react"
import { AuthProvider } from "@/components/providers/auth-provider"
import { PublicNav } from "@/components/public-nav"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <PublicNav />
        {children}
      </AuthProvider>
    </SessionProvider>
  )
} 