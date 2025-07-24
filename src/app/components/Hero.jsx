'use client'
import { useState, useEffect } from 'react'

function BannerSwiper() {
  const banners = [
    'Welcome Tipu Burger & Broast',
    'Flat 10% Off on all Items',
    'Discover Our Special Dishes',
  ]
  const [currentBanner, setCurrentBanner] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [banners.length])

  return (
    <div className="bg-white py-1 flex justify-center items-center w-full">
      <h2 className="text-red-600 text-sm md:text-xl font-semibold px-4 mx-auto max-w-full text-center">
        {banners[currentBanner]}
      </h2>
    </div>
  )
}

export default function Hero() {
  const images = ['/hero.jpg', '/hero-2.jpg', '/hero-3.jpg']
  const [current, setCurrent] = useState(0)
  const [previous, setPrevious] = useState(images.length - 1)
  const [isAnimating, setIsAnimating] = useState(false)
  const [touchStartX, setTouchStartX] = useState(null)
  const [touchEndX, setTouchEndX] = useState(null)

  const nextImage = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setPrevious(current)
    setCurrent((prev) => (prev + 1) % images.length)
    setTimeout(() => setIsAnimating(false), 1000) 
  }

  const prevImage = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setPrevious(current)
    setCurrent((prev) => (prev - 1 + images.length) % images.length)
    setTimeout(() => setIsAnimating(false), 1000) 
  }

  useEffect(() => {
    const interval = setInterval(() => {
      nextImage()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleTouchStart = (e) => {
    setTouchStartX(e.changedTouches[0].clientX)
  }

  const handleTouchMove = (e) => {
    setTouchEndX(e.changedTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (touchStartX !== null && touchEndX !== null) {
      const diff = touchStartX - touchEndX
      if (Math.abs(diff) > 50) {
        diff > 0 ? nextImage() : prevImage()
      }
    }
    setTouchStartX(null)
    setTouchEndX(null)
  }

  return (
    <section className="relative">
      <BannerSwiper />

      <div
        className="relative w-full aspect-[750/250] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`absolute w-full h-full transition-transform duration-1000 ease-in-out ${
            isAnimating ? 'translate-x-0' : ''
          }`}
        >
          <img
            src={images[current]}
            alt="Hero"
            style={{ width: '100%', height: '100%'}}
          />
        </div>

        {isAnimating && (
          <div
            className="absolute w-full h-full transform -translate-x-full transition-transform duration-1000 ease-in-out"
          >
            <img
              src={images[previous]}
              alt="Previous"
              className="object-cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        <div className="absolute bottom-4 left-0 right-0 hidden md:flex justify-center space-x-2">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (isAnimating) return;
                setPrevious(current);
                setCurrent(idx);
                setIsAnimating(true);
                setTimeout(() => setIsAnimating(false), 1000); 
              }}
              className={`w-3 h-3 rounded-full focus:outline-none ${
                idx === current ? 'bg-red-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
