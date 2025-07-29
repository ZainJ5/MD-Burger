'use client'

import { useState, useEffect } from 'react'

function BannerSwiper({ banners, rotationSpeed }) {
  const [currentBanner, setCurrentBanner] = useState(0)

  useEffect(() => {
    if (!banners || banners.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, rotationSpeed || 3000)
    
    return () => clearInterval(interval)
  }, [banners, rotationSpeed])

  if (!banners || banners.length === 0) return null;

  return (
    <div className="bg-white py-1 flex justify-center items-center w-full">
      <h2 className="text-red-600 text-sm md:text-xl font-semibold px-4 mx-auto max-w-full text-center">
        {banners[currentBanner]}
      </h2>
    </div>
  )
}

export default function Hero() {
  const [heroData, setHeroData] = useState({
    banners: ['Welcome to Tipu Burger & Broast'],
    images: ['/hero.jpg'],
    settings: {
      bannerRotationSpeed: 3000,
      imageRotationSpeed: 5000
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState(0)
  const [previous, setPrevious] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [touchStartX, setTouchStartX] = useState(null)
  const [touchEndX, setTouchEndX] = useState(null)

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const response = await fetch('/api/hero');
        if (response.ok) {
          const data = await response.json();
          setHeroData(data);
        }
      } catch (error) {
        console.error("Error fetching hero data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHeroData();
  }, []);

  const images = heroData.images.length > 0 ? heroData.images : ['/hero.jpg'];
  
  const nextImage = () => {
    if (isAnimating || images.length <= 1) return
    setIsAnimating(true)
    setPrevious(current)
    setCurrent((prev) => (prev + 1) % images.length)
    setTimeout(() => setIsAnimating(false), 1000) 
  }

  const prevImage = () => {
    if (isAnimating || images.length <= 1) return
    setIsAnimating(true)
    setPrevious(current)
    setCurrent((prev) => (prev - 1 + images.length) % images.length)
    setTimeout(() => setIsAnimating(false), 1000) 
  }

  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      nextImage()
    }, heroData.settings.imageRotationSpeed)
    
    return () => clearInterval(interval)
  }, [current, heroData.settings.imageRotationSpeed])

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
      <BannerSwiper 
        banners={heroData.banners} 
        rotationSpeed={heroData.settings.bannerRotationSpeed} 
      />

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
              style={{ width: '100%', height: '100%'}}
            />
          </div>
        )}

        {images.length > 1 && (
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
        )}
      </div>
    </section>
  )
}