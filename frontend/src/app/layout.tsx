import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import Navbar from "@/components/layout/Navbar"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "RAG Optimizer",
  description: "Compare RAG pipelines. Stop guessing which one works best.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Navbar />
        <main>{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}