"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useMenuStore } from '../../store/menu';

export default function Banner() {
  const activeCategory = useMenuStore((state) => state.activeCategory);
  const activeCategoryName = useMenuStore((state) => state.activeCategoryName);
  const activeSubcategory = useMenuStore((state) => state.activeSubcategory);
  const setActiveCategoryName = useMenuStore((state) => state.setActiveCategoryName);

  const [activeSubcategoryName, setActiveSubcategoryName] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [bannerData, setBannerData] = useState({
    src: "",
    alt: "Menu banner",
    isLoading: true,
    hasError: false
  });

  const categoriesCache = useRef(null);
  const subcategoriesCache = useRef(null);
  const imageCache = useRef(new Map());
  const currentBannerSrc = useRef("");

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

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    
    async function updateBannerData() {
      if (!activeCategory) {
        if (isMounted) {
          setActiveCategoryName(null);
          setActiveSubcategoryName(null);
          setBannerData({
            src: "",
            alt: "Menu banner",
            isLoading: false,
            hasError: true
          });
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
        
        if (matchedCategory) {
          setActiveCategoryName(matchedCategory.name);
          
          // If we have an active subcategory, prioritize its banner
          if (activeSubcategory && subcategoriesData) {
            const activeSubcatId = getId(activeSubcategory);
            const matchedSubcategory = subcategoriesData.find(
              sub => getId(sub._id) === activeSubcatId
            );
            
            if (matchedSubcategory) {
              setActiveSubcategoryName(matchedSubcategory.name || null);
              
              if (matchedSubcategory.image && currentBannerSrc.current !== matchedSubcategory.image) {
                currentBannerSrc.current = matchedSubcategory.image;
                setBannerData({
                  src: matchedSubcategory.image,
                  alt: `${matchedSubcategory.name} subcategory banner`,
                  isLoading: false,
                  hasError: false
                });
              }
            } else {
              setActiveSubcategoryName(null);
              
              // Fallback to category banner
              if (matchedCategory.image && currentBannerSrc.current !== matchedCategory.image) {
                currentBannerSrc.current = matchedCategory.image;
                setBannerData({
                  src: matchedCategory.image,
                  alt: `${matchedCategory.name} category banner`,
                  isLoading: false,
                  hasError: false
                });
              }
            }
          } else {
            setActiveSubcategoryName(null);
            
            // No active subcategory, use category banner
            if (matchedCategory.image && currentBannerSrc.current !== matchedCategory.image) {
              currentBannerSrc.current = matchedCategory.image;
              setBannerData({
                src: matchedCategory.image,
                alt: `${matchedCategory.name} category banner`,
                isLoading: false,
                hasError: false
              });
            }
          }
        } else {
          // No matched category
          setActiveCategoryName(null);
          setActiveSubcategoryName(null);
          setBannerData({
            src: "",
            alt: "Menu banner",
            isLoading: false,
            hasError: true
          });
        }
      } catch (error) {
        console.error("Error processing data:", error);
        if (isMounted) {
          setActiveCategoryName(null);
          setActiveSubcategoryName(null);
          setBannerData({
            src: "",
            alt: "Menu banner",
            isLoading: false,
            hasError: true
          });
        }
      }
    }

    updateBannerData();
    
    return () => { 
      isMounted = false; 
      controller.abort();
    };
  }, [activeCategory, activeSubcategory, setActiveCategoryName, fetchDataOnce, getId, isMobile]);

  // Display a placeholder if no banner image is available
  if (!bannerData.src || bannerData.hasError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 mt-4">
        <div className="w-full h-auto min-h-[180px] bg-gray-200 rounded-md flex items-center justify-center">
          <span className="text-black font-bold">
            {activeCategoryName || activeSubcategoryName || 'Menu'}
          </span>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 mt-4">
        <div className="relative w-full">
          <img
            src={bannerData.src}
            alt={bannerData.alt}
            className="w-full h-auto rounded-md object-contain"
            loading="eager"
            decoding="async"
            onError={() => {
              setBannerData(prev => ({
                ...prev,
                hasError: true
              }));
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 mt-4">
      <div className="relative w-full h-auto min-h-[180px] bg-gray-200 rounded-md overflow-hidden">
        <img
          src={bannerData.src}
          alt={bannerData.alt}
          className="w-full h-auto object-contain rounded-md"
          loading="eager"
          decoding="async"
          onError={() => {
            imageCache.current.set(bannerData.src, false);
            setBannerData(prev => ({
              ...prev,
              hasError: true
            }));
          }}
        />
      </div>
    </div>
  );
}