"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useMenuStore } from '../../store/menu';

const DEFAULT_BANNER = "Hot Deals";

const preloadImage = (src) => {
  const img = new Image();
  img.src = src;
};

export default function Banner() {
  const activeCategory = useMenuStore((state) => state.activeCategory);
  const activeCategoryName = useMenuStore((state) => state.activeCategoryName);
  const activeSubcategory = useMenuStore((state) => state.activeSubcategory);
  const setActiveCategoryName = useMenuStore((state) => state.setActiveCategoryName);

  const [activeSubcategoryName, setActiveSubcategoryName] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [bannerData, setBannerData] = useState({
    src: `/${DEFAULT_BANNER}.webp`,
    alt: `${DEFAULT_BANNER} banner`,
    isLoading: false,
    hasError: false
  });

  const categoriesCache = useRef(null);
  const subcategoriesCache = useRef(null);
  const imageCache = useRef(new Map());
  const prevBannerName = useRef(DEFAULT_BANNER);

  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    
    let resizeObserver;
    try {
      resizeObserver = new ResizeObserver(checkIsMobile);
      resizeObserver.observe(document.body);
    } catch (e) {
      window.addEventListener('resize', checkIsMobile);
    }
    
    preloadImage(`/${DEFAULT_BANNER}.webp`);
    
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', checkIsMobile);
      }
    };
  }, []);

  const getId = useCallback((idField) => {
    if (!idField) return null;
    if (typeof idField === 'object' && idField !== null) {
      return idField.$oid || (idField._id ? getId(idField._id) : idField);
    }
    return idField;
  }, []);

  const fetchDataOnce = useCallback(async (type) => {
    const cacheRef = type === 'categories' ? categoriesCache : subcategoriesCache;
    
    if (cacheRef.current) {
      return cacheRef.current;
    }
    
    try {
      const controller = new AbortController();
      const signal = controller.signal;
      
      const promise = fetch(`/api/${type}`, { signal })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch ${type}`);
          return res.json();
        });
      
      cacheRef.current = promise;
      return promise;
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(`Error fetching ${type}:`, error);
      }
      cacheRef.current = null;
      return [];
    }
  }, []);

  const bannerName = useMemo(() => {
    return activeSubcategoryName || activeCategoryName || DEFAULT_BANNER;
  }, [activeSubcategoryName, activeCategoryName]);

  const bannerAlt = useMemo(() => {
    return activeSubcategoryName
      ? `${activeSubcategoryName} subcategory banner`
      : activeCategoryName 
        ? `${activeCategoryName} category banner` 
        : `${DEFAULT_BANNER} banner`;
  }, [activeSubcategoryName, activeCategoryName]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    async function updateBannerData() {
      if (!activeCategory) {
        if (isMounted) {
          setActiveCategoryName(null);
          setActiveSubcategoryName(null);
          
          if (!isMobile) {
            setBannerData({
              src: `/${DEFAULT_BANNER}.webp`,
              alt: `${DEFAULT_BANNER} banner`,
              isLoading: false,
              hasError: false
            });
          }
        }
        return;
      }

      try {
        const [categoriesData, subcategoriesData] = await Promise.all([
          fetchDataOnce('categories'),
          fetchDataOnce('subcategories')
        ]);

        if (!isMounted) return;

        const activeCatId = getId(activeCategory);
        const matchedCategory = categoriesData?.find(cat => getId(cat._id) === activeCatId);
        const catName = matchedCategory ? matchedCategory.name : null;
        
        if (isMounted) {
          setActiveCategoryName(catName);
        }

        if (activeSubcategory && subcategoriesData) {
          const activeSubcatId = getId(activeSubcategory);
          const matchedSubcategory = subcategoriesData.find(
            sub => getId(sub._id) === activeSubcatId
          );
          
          if (isMounted) {
            setActiveSubcategoryName(matchedSubcategory?.name || null);
          }
        } else if (isMounted) {
          setActiveSubcategoryName(null);
        }
      } catch (error) {
        console.error("Error processing data:", error);
        if (isMounted) {
          setActiveCategoryName(null);
          setActiveSubcategoryName(null);
        }
      }
    }

    updateBannerData();
    
    return () => { 
      isMounted = false; 
      controller.abort();
    };
  }, [activeCategory, activeSubcategory, setActiveCategoryName, fetchDataOnce, getId, isMobile]);

  useEffect(() => {
    if (bannerName && bannerName !== prevBannerName.current) {
      if (!imageCache.current.has(bannerName)) {
        const img = new Image();
        
        img.onload = () => {
          imageCache.current.set(bannerName, true);
          if (bannerName === prevBannerName.current) {
            setBannerData({
              src: `/${bannerName}.webp`,
              alt: bannerAlt,
              isLoading: false,
              hasError: false
            });
          }
        };
        
        img.onerror = () => {
          imageCache.current.set(bannerName, false);
          if (bannerName === prevBannerName.current) {
            setBannerData(prev => ({
              ...prev,
              hasError: true
            }));
          }
        };
        
        img.src = `/${bannerName}.webp`;
        
        setBannerData(prev => ({
          ...prev,
          src: `/${bannerName}.webp`,
          alt: bannerAlt,
          isLoading: true,
          hasError: false
        }));
      } else {
        setBannerData({
          src: `/${bannerName}.webp`,
          alt: bannerAlt,
          isLoading: false,
          hasError: imageCache.current.get(bannerName) === false
        });
      }
      
      prevBannerName.current = bannerName;
    }
  }, [bannerName, bannerAlt]);

  if (isMobile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 mt-4">
        <div className="relative w-full">
          <img
            src={`/${bannerName}.webp`}
            alt={bannerAlt}
            className="w-full h-auto rounded-md object-contain"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            onError={(e) => {
              console.error(`Failed to load banner image: ${bannerName}.webp`);
              const parent = e.target.parentNode;
              if (parent) {
                const fallback = document.createElement('div');
                fallback.className = 'h-32 w-full flex items-center justify-center bg-gray-200 rounded-md';
                fallback.innerHTML = `<span class="text-black font-bold">${bannerName}</span>`;
                
                parent.replaceChild(fallback, e.target);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 mt-4">
      <div className="relative w-full h-auto min-h-[180px] bg-gray-200 rounded-md overflow-hidden">
        {bannerData.hasError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-black font-bold">
              {bannerName}
            </span>
          </div>
        ) : (
          <img
            src={bannerData.src}
            alt={bannerData.alt}
            className="w-full h-auto object-contain rounded-md"
            loading="eager"
            fetchpriority="high"
            decoding="async"
            onError={(e) => {
              console.error(`Failed to load banner image: ${bannerData.src}`);
              imageCache.current.set(bannerName, false);
              setBannerData(prev => ({
                ...prev,
                hasError: true
              }));
            }}
          />
        )}
      </div>
    </div>
  );
}