import { useState, useEffect, useMemo, useRef } from 'react';
import { useMenuStore } from '../../store/menu';
import { useBranchStore } from '../../store/branchStore';

export default function MenuTabs() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const { activeCategory, activeSubcategory, setActiveCategory, setActiveSubcategory } = useMenuStore();
  const { branch } = useBranchStore(); 
  const categoriesContainerRef = useRef(null);

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

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching categories. Branch:', branch);
        const categoriesRes = await fetch('/api/categories');
        const categoriesData = await categoriesRes.json();
        console.log('Fetched categories:', categoriesData);

        const filteredCategoriesData = categoriesData.filter((cat) => {
          if (cat.branch) {
            const catBranch = typeof cat.branch === 'object' ? getId(cat.branch) : cat.branch;
            console.log(`Category "${cat.name}" branch:`, catBranch, 'Comparing with branch:', getId(branch));
            return catBranch === getId(branch);
          }
          console.log(`Category "${cat.name}" has no branch. Excluding.`);
          return false;
        });
        console.log('Filtered categories:', filteredCategoriesData);
        setCategories(filteredCategoriesData);
        if (filteredCategoriesData.length > 0) {
          const firstCatId = getId(filteredCategoriesData[0]._id);
          console.log('Automatically setting active category to first button:', firstCatId);
          setActiveCategory(firstCatId);
        } else {
          setActiveCategory(null);
        }

        console.log('Fetching subcategories. Branch:', branch);
        const subcategoriesRes = await fetch('/api/subcategories');
        const subcategoriesData = await subcategoriesRes.json();
        console.log('Fetched subcategories:', subcategoriesData);

        const filteredSubcategoriesData = subcategoriesData.filter((sub) => {
          if (sub.branch) {
            const subBranch = typeof sub.branch === 'object' ? getId(sub.branch) : sub.branch;
            console.log(`Subcategory "${sub.name}" branch:`, subBranch, 'Comparing with branch:', getId(branch));
            return subBranch === getId(branch);
          }
          console.log(`Subcategory "${sub.name}" has no branch. Excluding.`);
          return false;
        });
        console.log('Filtered subcategories by branch:', filteredSubcategoriesData);
        setSubcategories(filteredSubcategoriesData);
      } catch (error) {
        console.error("Error fetching categories/subcategories:", error);
      }
    }
    if (branch) {
      fetchData();
    }
  }, [branch, setActiveCategory]);

  const filteredSubcategories = useMemo(() => {
    const filtered = subcategories.filter((sub) => {
      let subCatId = null;
      if (sub.category && typeof sub.category === 'object') {
        subCatId = getId(sub.category);
      } else {
        subCatId = sub.category;
      }
      console.log(`Subcategory "${sub.name}" category id:`, subCatId, ' activeCategory:', activeCategory);
      return subCatId === activeCategory;
    });
    console.log('Subcategories after filtering by active category:', filtered);
    return filtered;
  }, [activeCategory, subcategories]);

  useEffect(() => {
    if (filteredSubcategories.length > 0) {
      const firstSubId = getId(filteredSubcategories[0]._id);
      console.log('Setting active subcategory to:', firstSubId);
      setActiveSubcategory(firstSubId);
    } else {
      console.log('No filtered subcategories found. Setting active subcategory to null.');
      setActiveSubcategory(null);
    }
  }, [filteredSubcategories, setActiveSubcategory]);

  return (
    <>
      <div className="bg-red-700 relative">
        <div className="absolute right-4 top-[-29px] hidden md:flex items-center gap-[2px] z-10">
          <button 
            onClick={() => scrollCategories('left')} 
            className="bg-red-700 rounded-full p-2 shadow-md focus:outline-none"
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
            className="bg-red-700 rounded-full p-2 shadow-md focus:outline-none"
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

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="relative flex items-center overflow-x-auto py-3"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            ref={categoriesContainerRef}
          >
            <style jsx>{`
              .no-scroll::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <div className="flex items-center gap-3 mx-auto no-scroll">
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
                    onClick={() => {
                      console.log('User selected active category:', catId);
                      setActiveCategory(catId);
                    }}
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
      {filteredSubcategories.length > 0 && (
        <div className="bg-white py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div 
              className="relative flex overflow-x-auto"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div className="flex items-center gap-3 sm:gap-4 mx-auto no-scroll">
                {filteredSubcategories.map((sub) => {
                  const subId = getId(sub._id);
                  return (
                    <button
                      key={subId}
                      onClick={() => {
                        console.log('User selected active subcategory:', subId);
                        setActiveSubcategory(subId);
                      }}
                      className={`${
                        activeSubcategory === subId
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'border border-black text-black hover:bg-gray-50'
                      } px-5 sm:px-6 py-1 rounded-2xl font-medium text-sm sm:text-[15px] transition-colors whitespace-nowrap shrink-0`}
                    >
                      {sub.name.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}