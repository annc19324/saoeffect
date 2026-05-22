
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Provider from '@/components/Provider'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sao Effect',
  description: 'Download and listen to sound effects',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className + " bg-slate-900 text-white min-h-screen flex flex-col"}>
        <Provider>
          <Navbar />
          <main className="flex-grow max-w-7xl mx-auto w-full p-4">
            {children}
          </main>
        </Provider>
      </body>
    </html>
  )
}
