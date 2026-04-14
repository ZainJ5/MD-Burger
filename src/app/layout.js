import { Inter } from 'next/font/google'
import './globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { SocketProvider } from './context/SocketContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Tipu Burger & Broast',
  description: `The best food in Town! Established in 1993. At the time of opening we started with the bun kabab's but now we have opened the complete FAST FOOD and BAR-B-Q.`,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SocketProvider>
          {children}
        </SocketProvider>
          <ToastContainer />
      </body>
    </html>
  )
}
