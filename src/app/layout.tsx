import "./globals.css"
import type { Metadata, Viewport } from "next";
import { Navigation } from "@/components/navigation"
import { Provider as SessionProvider } from "@/components/session-provider";

export const metadata: Metadata = {
  title: "Pothpath",
  description: "An open library and blog.",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SessionProvider>
          <Navigation />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}