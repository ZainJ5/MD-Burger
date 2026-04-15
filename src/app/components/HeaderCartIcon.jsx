'use client'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '../../store/cart'
import CartDrawer from './Cart'
import { useState } from 'react'

export default function HeaderCartIcon() {
  const { items } = useCartStore()
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsCartOpen(true)}
        className="relative bg-brand-600 hover:bg-brand-700 text-white rounded-lg px-3 py-2 transition-colors shadow-sm"
        aria-label="Shopping Cart"
      >
        <ShoppingCart className="h-5 w-5" />
        {items.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-white text-brand-600 text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-brand-600">
            {items.length}
          </span>
        )}
      </button>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}
