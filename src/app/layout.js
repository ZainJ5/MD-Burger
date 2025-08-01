import { Inter } from 'next/font/google'
import './globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { SocketProvider } from './context/SocketContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'King Ice Restaurant - Landhi Branch',
  description: 'King Ice offers an exclusive range of Fast Foot | BBQ and Ice Cream at Korangi and Landi Town.',
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
