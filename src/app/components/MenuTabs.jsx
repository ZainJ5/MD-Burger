"use client";

import { useState, useEffect, useRef } from 'react';
import { useMenuStore } from '../../store/menu';

export default function MenuTabs({ categories = [], visibleCategory }) {
  const [isSticky, setIsSticky] = useState(false);
  const [tabHeight, setTabHeight] = useState(0);
  const { activeCategory, setActiveCategory } = useMenuStore();
  const categoriesContainerRef = useRef(null);
  const menuTabsRef = useRef(null);
  const originalPositionRef = useRef(null);
  const ticking = useRef(false);

  const getId = (idField) => {
    if (typeof idField === 'object' && idField !== null) {
      if (idField.$oid) return idField.$oid;
      if (idField._id) return getId(idField._id);
    }
    return idField;
  };

  const scrollCategories = (direction) => {
    if (categoriesContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      categoriesContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const updateHeightAndPosition = () => {
    if (menuTabsRef.current) {
      setTabHeight(menuTabsRef.current.offsetHeight);
      originalPositionRef.current = menuTabsRef.current.getBoundingClientRect().top + window.scrollY;
    }
  };

  useEffect(() => {
    updateHeightAndPosition();

    const handleScroll = () => {
      if (!ticking.current && originalPositionRef.current !== null) {
        window.requestAnimationFrame(() => {
          const shouldBeSticky = window.scrollY >= originalPositionRef.current;
          
          if (shouldBeSticky !== isSticky) {
            setIsSticky(shouldBeSticky);
          }
          
          ticking.current = false;
        });
        
        ticking.current = true;
      }
    };

    const handleResize = () => {
      updateHeightAndPosition();
      handleScroll(); 
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [isSticky]);

  const handleCategoryClick = (categoryId) => {
    setActiveCategory(categoryId);
    
    const sectionElement = document.getElementById(`category-${categoryId}`);
    if (sectionElement) {
      const yOffset = -70; 
      const y = sectionElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (visibleCategory) {
      const categoryId = getId(visibleCategory._id);
      setActiveCategory(categoryId);
      
      if (categoriesContainerRef.current && isSticky) {
        const activeButton = categoriesContainerRef.current.querySelector(`[data-category="${categoryId}"]`);
        if (activeButton) {
          const containerRect = categoriesContainerRef.current.getBoundingClientRect();
          const buttonRect = activeButton.getBoundingClientRect();
          const container = categoriesContainerRef.current;
          const scrollLeft = container.scrollLeft;
          const offset = buttonRect.left - containerRect.left - (containerRect.width / 2) + (buttonRect.width / 2);
          container.scrollTo({
            left: scrollLeft + offset,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [visibleCategory, setActiveCategory, isSticky]);

  return (
    <div 
      ref={menuTabsRef}
      className={`bg-brand-700 w-full sticky top-0 z-[60] ${isSticky ? 'shadow-md' : ''}`}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="absolute right-4 top-[-29px] hidden md:flex items-center gap-[2px] z-10">
          <button 
            onClick={() => scrollCategories('left')} 
            className="bg-brand-700 rounded-full p-2 shadow-md focus:outline-none"
            aria-label="Scroll left"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="white"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={() => scrollCategories('right')} 
            className="bg-brand-700 rounded-full p-2 shadow-md focus:outline-none"
            aria-label="Scroll right"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="white"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div
          className="relative flex items-center overflow-x-auto py-2 no-scrollbar"
          ref={categoriesContainerRef}
        >
          <style jsx global>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          
          <div className="flex items-center gap-3 mx-auto">
            <button className="text-white shrink-0 focus:outline-none p-1">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {categories.map((cat) => {
              const catId = getId(cat._id);
              return (
                <button
                  key={catId}
                  data-category={catId}
                  onClick={() => handleCategoryClick(catId)}
                  className={
                    activeCategory === catId
                      ? 'bg-white text-black font-semibold px-4 py-1 rounded-lg whitespace-nowrap text-sm sm:text-base shrink-0 shadow-sm'
                      : 'border border-white text-white font-semibold px-4 py-1 rounded-lg whitespace-nowrap text-sm sm:text-base shrink-0 hover:bg-white/10 transition-colors'
                  }
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}