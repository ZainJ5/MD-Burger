import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { MapPin, Phone, ChevronDown, ClipboardList } from 'lucide-react'
import HeaderCartIcon from './HeaderCartIcon' 
import { useBranchStore } from '../../store/branchStore' 
import { useCartStore } from '../../store/cart'
import Link from 'next/link'

function Header() {
  const [logo, setLogo] = useState('/logo/logo-1753880016916.png')
  const [branches, setBranches] = useState([])
  const { branch, setBranch } = useBranchStore()
  const { clearCart } = useCartStore()
  const [loading, setLoading] = useState(true)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const [hasOrders, setHasOrders] = useState(false)

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/logo')
        if (!response.ok) throw new Error('Failed to fetch logo')
        const data = await response.json()
        setLogo(data.logo)
      } catch (err) {
        console.error('Error fetching logo:', err)
      }
    }

    const fetchBranches = async () => {
      try {
        const response = await fetch('/api/branches')
        if (!response.ok) throw new Error('Failed to fetch branches')
        const data = await response.json()
        setBranches(data)
        // Set default branch or first branch if no branch is selected
        if (!branch && data && data.length > 0) {
          const defaultBranch = data.find(b => b.isDefault)
          setBranch(defaultBranch || null)
        }
      } catch (err) {
        console.error('Error fetching branches:', err)
      } finally {
        setLoading(false)
      }
    }    // Check if orders exist in localStorage
    const checkOrderHistory = () => {
      const orderHistory = localStorage.getItem('orderHistory')
      if (orderHistory && JSON.parse(orderHistory).length > 0) {
        setHasOrders(true)
      }
    }

    fetchLogo()
    fetchBranches()
    checkOrderHistory()
  }, [branch, setBranch]) 

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleBranchChange = (selectedBranch) => {
    clearCart()
    setBranch(selectedBranch) 
    setDropdownOpen(false)
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <header className="w-full bg-white text-black  sm:py-3  sm:px-4 relative shadow-sm">
      {hasOrders && (
        <Link 
          href="/order" 
          className="sm:hidden block w-full bg-green-600 hover:bg-green-700 text-white  text-center font-bold text-sm shadow-sm"
        >
          <div className="flex items-center py-1 justify-center">
            <ClipboardList className="h-4 w-4 mr-1" />
            View Order Status
          </div>
        </Link>
      )}
      <div className="container mx-auto flex justify-between px-2 py-1 items-center">
        <div className="flex items-center space-x-1 sm:space-x-2 relative" ref={dropdownRef}>
          <button 
            className="flex items-center bg-black rounded-lg text-white px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <MapPin className="h-4 w-4 sm:h-5 w-5 mr-1 text-white" />
            <span className="font-medium mr-1  text-xs sm:text-sm">
              {branch ? branch.name : 'Select Branch'}
            </span>
            <ChevronDown className="h-3 w-3 sm:h-4 w-4 text-white" />
          </button>
          
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded shadow-lg z-20">
              <div className="py-1 max-h-56 overflow-y-auto">
                {branches.map((b) => (
                  <button
                    key={b._id}
                    className={`block px-4 py-2 text-sm w-full text-left  ${
                      branch && branch._id === b._id ? 'bg-gray-200' : ''
                    }`}
                    onClick={() => handleBranchChange(b)}
                  >
                    {b.name}
                  </button>
                ))}
                {branches.length === 0 && (
                  <div className="px-4 py-2 text-sm text-gray-500">No branches available</div>
                )}
              </div>
            </div>
          )}

          <a 
            href={`tel:${branch?.phone || '021 - 111 822 111'}`}
            className="hidden sm:flex items-center bg-black text-white rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
          >
            <Phone className="h-4 w-4 sm:h-5 w-5 mr-1 text-white" />
            <span className="font-medium text-xs sm:text-sm">{branch?.phone || '021 - 111 822 111'}</span>
          </a>
        </div>

        <div className="absolute left-1/2 transform -translate-x-1/2 sm:top-0 top-[0px] z-10">
          <div className="bg-white rounded-full p-2 sm:w-28 sm:h-28 w-20 h-20 flex items-center justify-center shadow-md">
            <img 
              src={logo}
              alt="Restaurant Logo" 
              className="rounded-full object-contain"
            />
          </div>
        </div>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {hasOrders && (
            <div className="hidden sm:block absolute sm:right-32 right-3">
              <Link href="/order">
                <button className="bg-green-600 hover:bg-green-700 text-white font-bold px-2 sm:px-3 py-1 sm:py-2 rounded-lg text-xs sm:text-sm flex items-center shadow-sm">
                  <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                  <span className="font-medium">View Order Status</span>
                </button>
              </Link>
            </div>
          )}
          
          <a 
            href={`tel:${branch?.phone || '021 - 111 822 111'}`}
            className="flex sm:hidden items-center bg-black text-white rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm"
          >
            <Phone className="h-4 w-4 sm:h-5 w-5 mr-1 text-white" />
            <span className="font-medium text-xs sm:text-sm">{branch?.phone || '021 - 111 822 111'}</span>
          </a>
          
          {/* Desktop Header Cart Icon */}
          <div className="hidden sm:block">
            <HeaderCartIcon />
          </div>
        </div>
      </div>
    </header>
  )
}

export default function Hero() {
  const [heroData, setHeroData] = useState({
    banners: ['Welcome to Tipu Burger & Broast'],
    images: ['/hero.jpg'],
    settings: {
      bannerRotationSpeed: 3000,
      imageRotationSpeed: 5000
    },
    updatedAt: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const [current, setCurrent] = useState(0)
  const [previous, setPrevious] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [touchStartX, setTouchStartX] = useState(null)
  const [touchEndX, setTouchEndX] = useState(null)
  const autoRotateRef = useRef(null);
  const isAnimatingRef = useRef(false);

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
    if (isAnimatingRef.current || images.length <= 1) return
    isAnimatingRef.current = true;
    setIsAnimating(true)
    setPrevious(current)
    setCurrent((prev) => (prev + 1) % images.length)
    setTimeout(() => {
      setIsAnimating(false);
      isAnimatingRef.current = false;
    }, 1000)
  }

  const prevImage = () => {
    if (isAnimatingRef.current || images.length <= 1) return
    isAnimatingRef.current = true;
    setIsAnimating(true)
    setPrevious(current)
    setCurrent((prev) => (prev - 1 + images.length) % images.length)
    setTimeout(() => {
      setIsAnimating(false);
      isAnimatingRef.current = false;
    }, 1000)
  }

  useEffect(() => {
    if (images.length <= 1) return;

    if (autoRotateRef.current) {
      clearInterval(autoRotateRef.current);
    }

    autoRotateRef.current = setInterval(() => {
      if (!isAnimatingRef.current) {
        nextImage();
      }
    }, heroData.settings.imageRotationSpeed);

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current);
      }
    };
  }, [current, heroData.settings.imageRotationSpeed, images.length]);

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
      <Header />

      <div
        className="relative w-full aspect-[750/250] sm:aspect-[16/6] overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={`absolute w-full h-full transition-transform duration-1000 ease-in-out ${isAnimating ? 'translate-x-0' : ''
            }`}
        >
          <img
            src={`${images[current]}${heroData.updatedAt ? `?v=${new Date(heroData.updatedAt).getTime()}` : ''}`}
            alt="Hero"
            className="w-full h-full object-cover"
          />
        </div>

        {isAnimating && (
          <div
            className="absolute w-full h-full transform -translate-x-full transition-transform duration-1000 ease-in-out"
          >
            <img
              src={`${images[previous]}${heroData.updatedAt ? `?v=${new Date(heroData.updatedAt).getTime()}` : ''}`}
              alt="Previous"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 focus:outline-none z-10"
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/70 hover:bg-white rounded-full p-2 focus:outline-none z-10"
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
    </section>
  )
}