import type { Metadata } from 'next'
import './globals.css'
import { ToastContainer } from '@/components/ToastContainer'

export const metadata: Metadata = {
  title: 'Repository Visualizer',
  description: 'Visualize repo structure and detect architectural drift',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}
