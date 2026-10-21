import type React from "react"
import type { Metadata } from "next"
import { Courier_Prime, Inter, JetBrains_Mono, Press_Start_2P } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { withBasePath } from "@/lib/base-path"
import "./globals.css"

// The YASS website's fonts.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-jetbrains-mono" })
const courierPrime = Courier_Prime({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-courier-prime" })
const pressStart = Press_Start_2P({ subsets: ["latin"], weight: "400", variable: "--font-press-start" })

export const metadata: Metadata = {
  title: "Swerve Drive Config Generator",
  description: "Generate and manage swerve drive configurations for robotics",
  generator: "v0.app",
  icons: {
    icon: withBasePath("/logo.png"),
    apple: withBasePath("/logo.png"),
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${courierPrime.variable} ${pressStart.variable}`}
      suppressHydrationWarning
    >
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          {children}
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
