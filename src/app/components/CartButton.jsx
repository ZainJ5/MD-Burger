'use client'
import { FaShoppingCart, FaCreditCard } from 'react-icons/fa'
import { useCartStore } from '../../store/cart'
import CartDrawer from './Cart'
import { useState } from 'react'

export default function CartButton() {
  const { items, total } = useCartStore()
  const [isCartOpen, setIsCartOpen] = useState(false)

  if (items.length === 0) return null

  return (
    <>
      <div className="hidden sm:flex fixed bottom-0 left-0 right-0 z-[200] justify-center">
        <button
          onClick={() => setIsCartOpen(true)}
          className="
            bg-brand-600 text-white 
            px-6 py-4
            flex items-center justify-center 
            shadow-[0_-4px_12px_rgba(0,0,0,0.15)]
            text-base font-semibold
            rounded-t-2xl
            transition-all duration-300
            hover:bg-brand-700
            border-2 border-white border-b-0
          "
        >
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="bg-white text-brand-600 rounded-full w-9 h-9 flex items-center justify-center font-bold text-base">
                {items.length}
              </div>
              <span className="text-lg font-semibold">View Cart</span>
            </div>
            <div className="h-8 w-px bg-white/40"></div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">Rs.</span>
              <span className="text-2xl font-bold">{total}</span>
            </div>
          </div>
        </button>
      </div>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-[200] bg-white p-2 shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => setIsCartOpen(true)}
          className="
            w-full
            bg-brand-600 text-white 
            px-4 py-3 
            flex items-center justify-center 
            shadow-lg 
            text-xs
            rounded-lg
            font-semibold
          "
        >
          <FaShoppingCart className="mr-2 text-sm" />
          <span>{items.length}</span>
          <div className="mx-3 h-4 w-px bg-white"></div>
          <FaCreditCard className="mr-2 text-sm" />
          <span>Rs. {total}</span>
        </button>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </>
  )
}