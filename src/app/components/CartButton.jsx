'use client'
import { FaShoppingCart, FaCreditCard } from 'react-icons/fa'
import { useCartStore } from '../../store/cart'
import CartDrawer from './Cart'
import { useState, useEffect, useRef } from 'react'

export default function CartButton() {
  const { items, total } = useCartStore()
  const [isCartOpen, setIsCartOpen] = useState(false)
  const prevItemsCount = useRef(items.length)

  useEffect(() => {
    if (items.length > prevItemsCount.current) {
      setIsCartOpen(true)
    }
    prevItemsCount.current = items.length
  }, [items])

  return (
    <>
      <div className="hidden sm:block sticky top-16 right-4 z-50 self-end mt-[-40px] float-right">
        <button
          onClick={() => setIsCartOpen(true)}
          className="
            bg-red-500 text-white 
            px-4 py-3 
            flex items-center justify-center 
            shadow-lg 
            text-sm md:text-base 
            rounded-md
            transition-transform hover:scale-105
          "
        >
          <FaShoppingCart className="mr-2 text-base md:text-lg" />
          <span>{items.length}</span>
          <div className="mx-3 h-5 w-px bg-white"></div>
          <FaCreditCard className="mr-2 text-base md:text-lg" />
          <span>Rs. {total}</span>
        </button>
      </div>

      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white p-2">
        <button
          onClick={() => setIsCartOpen(true)}
          className="
            w-full
            bg-red-500 text-white 
            px-4 py-3 
            flex items-center justify-center 
            shadow-lg 
            text-xs
            rounded-md
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