"use client";

import { useEffect, useRef, useState, useMemo } from 'react';
import { useMenuStore } from '../../store/menu';
import { useCartStore } from '../../store/cart';
import { toast } from 'react-toastify';

export default function MenuSection({ category, subcategories, items, onSectionVisible }) {
  const sectionRef = useRef(null);
  const { setActiveCategory, setActiveCategoryName } = useMenuStore();
  const imageCache = useRef(new Map());
  const [isMounted, setIsMounted] = useState(false);
  
  const getId = (idField) => {
    if (typeof idField === 'object' && idField !== null) {
      if (idField.$oid) return idField.$oid;
      if (idField._id) return getId(idField._id);
    }
    return idField;
  };

  // Track mount state
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const getCacheBustedUrl = (url) => {
    if (!url) return "";
    return url;
  };

  const hasActiveSubcategories = subcategories && subcategories.length > 0 && 
    subcategories.some(sub => {
      return items.some(item => getId(item.subcategory) === getId(sub._id));
    });

  const itemCount = items.length;

  useEffect(() => {
    if (!window.menuSectionTracker) {
      window.menuSectionTracker = {
        sections: new Map(),
        activeId: null,
        updateActiveSection: function() {
          let bestSection = null;
          let bestScore = -1;
          
          this.sections.forEach((sectionData, id) => {
            const { ratio, rect, timestamp } = sectionData;
            if (!ratio || ratio <= 0) return;
            
            const viewportHeight = window.innerHeight;
            const sectionCenter = rect.top + (rect.height / 2);
            const viewportCenter = viewportHeight / 2;
            const distanceFromCenter = Math.abs(sectionCenter - viewportCenter) / (viewportHeight / 2);
            const centeringFactor = 1 - Math.min(1, distanceFromCenter);
            
            const recencyBonus = (Date.now() - timestamp) < 500 ? 0.05 : 0;
            const score = (ratio * 0.6) + (centeringFactor * 0.4) + recencyBonus;
            
            if (score > bestScore) {
              bestScore = score;
              bestSection = sectionData;
            }
          });
          
          if (bestSection && bestSection.id !== this.activeId) {
            this.activeId = bestSection.id;
            if (bestSection.callback) {
              bestSection.callback(bestSection.category);
            }
          }
        }
      };
    }
  }, []);

  useEffect(() => {
    if (!sectionRef.current || !window.menuSectionTracker) return;
    
    const categoryId = getId(category._id);
    
    const activateCallback = (cat) => {
      setActiveCategory(categoryId);
      setActiveCategoryName(category.name);
      onSectionVisible(cat);
    };
    
    window.menuSectionTracker.sections.set(categoryId, {
      id: categoryId,
      category,
      ratio: 0,
      rect: null,
      timestamp: Date.now(),
      callback: activateCallback
    });
    
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        const tracker = window.menuSectionTracker;
        if (!tracker) return;
        
        const sectionData = tracker.sections.get(categoryId);
        if (!sectionData) return;
        
        sectionData.ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
        sectionData.rect = entry.boundingClientRect;
        sectionData.timestamp = Date.now();
        
        if (!entry.isIntersecting && tracker.activeId === categoryId) {
          sectionData.ratio = 0;
        }
        
        tracker.updateActiveSection();
      });
    };
    
    const observer = new IntersectionObserver(
      observerCallback,
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        rootMargin: '-10% 0px -20% 0px'
      }
    );
    
    observer.observe(sectionRef.current);
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
      
      if (window.menuSectionTracker) {
        window.menuSectionTracker.sections.delete(categoryId);
      }
    };
  }, [category, setActiveCategory, setActiveCategoryName, onSectionVisible]);

  return (
    <div 
      ref={sectionRef} 
      id={`category-${getId(category._id)}`} 
      className="pt-4 pb-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
        {!hasActiveSubcategories && (
          <div className="bg-gradient-to-r from-red-700 to-red-800 text-white rounded-lg overflow-hidden sm:h-32 h-24 mb-8 flex items-center justify-center shadow-lg border-2 border-red-400 relative">
            <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10"></div>
            <div className="z-10 text-center px-6">
              <h2 className="text-3xl sm:text-6xl font-bold mb-2">{category.name}</h2>
            </div>
          </div>
        )}
        
        {hasActiveSubcategories ? (
          subcategories.map(subcategory => {
            const subcategoryItems = items.filter(item => 
              getId(item.subcategory) === getId(subcategory._id)
            );
            
            if (subcategoryItems.length === 0) return null;
            
            return (
              <div 
                key={getId(subcategory._id)} 
                id={`subcategory-${getId(subcategory._id)}`} 
                className="mb-12"
              >
                <div className="bg-gradient-to-r from-red-700 to-red-800 text-white rounded-lg overflow-hidden h-24 sm:h-32 mb-8 flex items-center justify-center shadow-lg border-2 border-red-400 relative">
                  <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10"></div>
                  <div className="z-10 text-center px-6">
                    <h3 className="text-4xl sm:text-5xl font-bold mb-2">{subcategory.name}</h3>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {subcategoryItems.map(item => (
                    <MenuItemCard 
                      key={getId(item._id)} 
                      item={item}
                      getCacheBustedUrl={getCacheBustedUrl}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
            {items.map(item => (
              <MenuItemCard 
                key={getId(item._id)} 
                item={item}
                getCacheBustedUrl={getCacheBustedUrl}
              />
            ))}
          </div>
        )}
        
        {hasActiveSubcategories && (
          (() => {
            const uncategorizedItems = items.filter(item => 
              !subcategories.some(sub => getId(item.subcategory) === getId(sub._id))
            );
            
            if (uncategorizedItems.length === 0) return null;
            
            return (
              <div className="mt-12">
                <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white rounded-lg overflow-hidden h-24 sm:h-32 mb-8 flex items-center justify-center shadow-lg border-2 border-gray-500 relative">
                  <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10"></div>
                  <div className="z-10 text-center px-6">
                    <h3 className="text-3xl sm:text-4xl font-bold mb-1">Other Items</h3>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
                  {uncategorizedItems.map(item => (
                    <MenuItemCard 
                      key={getId(item._id)} 
                      item={item}
                      getCacheBustedUrl={getCacheBustedUrl}
                    />
                  ))}
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

function MenuItemCard({ item, getCacheBustedUrl }) {
  console.log("Item is: ",item)
  const { addToCart } = useCartStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState("");
  const [selectedExtras, setSelectedExtras] = useState({});
  const [selectedSideOrders, setSelectedSideOrders] = useState([]);
  const [imageError, setImageError] = useState(false);
  const modalRef = useRef(null);
  
  const getId = (idField) => {
    if (typeof idField === 'object' && idField !== null) {
      if (idField.$oid) return idField.$oid;
      if (idField._id) return getId(idField._id);
    }
    return idField;
  };

  const getPrice = (priceField) => {
    if (typeof priceField === 'object' && priceField !== null) {
      if (priceField.$numberInt) return priceField.$numberInt;
      if (priceField.$numberDouble) return priceField.$numberDouble;
    }
    return priceField;
  };

  const hasVariations = item.variations && item.variations.length > 0;
  const hasExtras = item.extras && item.extras.length > 0;
  const hasSideOrders = item.sideOrders && item.sideOrders.length > 0;
  
  const groupedExtras = useMemo(() => {
    if (!item.extras) return {};
    
    return item.extras.reduce((groups, extra, index) => {
      const nameParts = extra.name.split(' - ');
      const baseName = nameParts.length > 1 ? nameParts[0] : extra.name;
      const size = nameParts.length > 1 ? nameParts[1] : null;
      
      if (!groups[baseName]) {
        groups[baseName] = [];
      }
      
      groups[baseName].push({
        ...extra,
        index,
        baseName,
        size
      });
      
      return groups;
    }, {});
  }, [item.extras]);

  const variationPrices = hasVariations 
    ? item.variations.map(v => {
        const price = Number(getPrice(v.price));
        const previousPrice = v.previousPrice ? Number(getPrice(v.previousPrice)) : null;
        return { price, previousPrice, hasDiscount: previousPrice && previousPrice > price };
      }) 
    : [];
  
  const lowestPriceVariation = variationPrices.length > 0
    ? variationPrices.reduce((lowest, current) => 
        current.price < lowest.price ? current : lowest, 
        variationPrices[0])
    : null;
  
  const hasMainItemDiscount = item.previousPrice && Number(getPrice(item.previousPrice)) > Number(getPrice(item.price));
  const hasAnyDiscount = hasMainItemDiscount || (hasVariations && variationPrices.some(v => v.hasDiscount));

  useEffect(() => {
    if (!isModalOpen) return;
    
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsModalOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);
  
  const selectExtra = (baseExtraName, selectedSize) => {
    setSelectedExtras(prev => {
      const newExtras = { ...prev };
      if (newExtras[baseExtraName] === selectedSize) {
        delete newExtras[baseExtraName];
      } else {
        newExtras[baseExtraName] = selectedSize;
      }
      return newExtras;
    });
  };

  const toggleSideOrder = (sideOrderIndex) => {
    setSelectedSideOrders(prev => {
      const isSelected = prev.includes(sideOrderIndex);
      if (isSelected) {
        return prev.filter(idx => idx !== sideOrderIndex);
      } else {
        return [...prev, sideOrderIndex];
      }
    });
  };

  const handleCardClick = () => {
    setIsModalOpen(true);
    if (hasVariations) {
      // Find the first available variation
      const firstAvailableIndex = item.variations.findIndex(v => v.isAvailable !== false);
      setSelectedVariation(firstAvailableIndex >= 0 ? String(firstAvailableIndex) : "0");
    }
    setSelectedExtras({});
    setSelectedSideOrders([]);
    
    document.body.style.overflow = 'hidden';
  };

  const handleAddDirectly = (e) => {
    e.stopPropagation();
    const cartItemId = `${getId(item._id)}-${Date.now()}`;
    const itemToAdd = { ...item, cartItemId };
    addToCart(itemToAdd);
    toast.success("Item added to cart!", { autoClose: 2000 });
  };

  const handleAddToCart = () => {
    const cartItemId = `${getId(item._id)}-${Date.now()}`;
    let itemToAdd = { ...item, cartItemId };
    let additionalPrice = 0;
    let selectedModifications = [];

    if (hasVariations && selectedVariation !== "") {
      const variationIndex = Number(selectedVariation);
      const selectedVar = item.variations[variationIndex];
      if (selectedVar && selectedVar.name) {
        // Check if variation is available
        if (selectedVar.isAvailable === false) {
          toast.error("This variation is currently unavailable");
          return;
        }
        itemToAdd = { 
          ...itemToAdd, 
          price: selectedVar.price, 
          previousPrice: selectedVar.previousPrice,
          type: selectedVar.name
        };
        selectedModifications.push(`Variation: ${selectedVar.name}`);
      } else {
        toast.error("Please select a valid variation");
        return;
      }
    }

    const selectedExtrasList = [];
    Object.entries(selectedExtras).forEach(([baseName, selectedSize]) => {
      if (!selectedSize && selectedSize !== '') return;
      
      const extraGroup = groupedExtras[baseName];
      // Handle both sized extras and regular extras
      const selectedExtra = extraGroup.find(extra => 
        (selectedSize === '' && !extra.size) || extra.size === selectedSize
      );
      
      if (selectedExtra) {
        additionalPrice += Number(getPrice(selectedExtra.price));
        selectedExtrasList.push({
          name: selectedExtra.name,
          price: Number(getPrice(selectedExtra.price))
        });
        
        // Display appropriate message based on whether it has a size or not
        if (selectedSize === '') {
          selectedModifications.push(`${baseName}`);
        } else {
          selectedModifications.push(`${baseName}: ${selectedSize}`);
        }
      }
    });
    
    if (selectedExtrasList.length > 0) {
      itemToAdd.selectedExtras = selectedExtrasList;
    }

    if (selectedSideOrders.length > 0) {
      const sideOrdersData = selectedSideOrders.map(index => {
        const sideOrder = item.sideOrders[index];
        additionalPrice += Number(getPrice(sideOrder.price));
        return {
          name: sideOrder.name,
          price: Number(getPrice(sideOrder.price)),
          category: sideOrder.category
        };
      });
      
      itemToAdd.selectedSideOrders = sideOrdersData;
      selectedModifications.push(`Side Orders: ${sideOrdersData.map(s => s.name).join(', ')}`);
    }

    if (additionalPrice > 0) {
      const basePrice = Number(getPrice(itemToAdd.price));
      itemToAdd.totalPrice = basePrice + additionalPrice;
    }

    addToCart(itemToAdd);
    
    if (selectedModifications.length > 0) {
      toast.success(
        <div>
          <p>Added to cart:</p>
          <p className="font-bold">{item.title}</p>
          <ul className="text-xs mt-1">
            {selectedModifications.map((mod, idx) => (
              <li key={idx}>{mod}</li>
            ))}
          </ul>
        </div>, 
        { autoClose: 3000 }
      );
    } else {
      toast.success("Item added to cart!", { autoClose: 2000 });
    }
    
    closeModal();
  };
  
  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
  };

  const imageUrl = item.imageUrl && item.imageUrl !== '' 
    ? getCacheBustedUrl(item.imageUrl)
    : '';

  const calculateDiscountPercentage = (currentPrice, originalPrice) => {
    if (!originalPrice || originalPrice <= currentPrice) return null;
    return Math.round((1 - (currentPrice / originalPrice)) * 100);
  };

  const mainItemDiscount = calculateDiscountPercentage(
    Number(getPrice(item.price)), 
    item.previousPrice ? Number(getPrice(item.previousPrice)) : null
  );

  const calculateTotalPrice = () => {
    let total = 0;
    
    if (hasVariations && selectedVariation !== "") {
      const variation = item.variations[Number(selectedVariation)];
      if (variation) {
        total += Number(getPrice(variation.price));
      }
    } else {
      total += Number(getPrice(item.price));
    }
    
    Object.entries(selectedExtras).forEach(([baseName, selectedSize]) => {
      if (!selectedSize && selectedSize !== '') return;
      
      const extraGroup = groupedExtras[baseName];
      const selectedExtra = extraGroup.find(extra => 
        (selectedSize === '' && !extra.size) || extra.size === selectedSize
      );
      
      if (selectedExtra) {
        total += Number(getPrice(selectedExtra.price));
      }
    });
    
    selectedSideOrders.forEach(index => {
      const sideOrder = item.sideOrders[index];
      if (sideOrder) {
        total += Number(getPrice(sideOrder.price));
      }
    });
    
    return total;
  };

  const groupedSideOrders = () => {
    if (!item.sideOrders || !item.sideOrders.length) return {};
    
    return item.sideOrders.reduce((groups, sideOrder, index) => {
      const category = sideOrder.category || 'other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push({ ...sideOrder, index });
      return groups;
    }, {});
  };

  const formatCategoryName = (category) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <>
      <div 
        className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow 
                    ${!item.isAvailable ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                    ${hasAnyDiscount ? 'border-2 border-red-500' : ''}`}
        onClick={item.isAvailable ? handleCardClick : null}
      >
        <div className="h-48 w-full relative">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={item.title}
              className="object-cover w-full h-full"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm">No Image</span>
            </div>
          )}
          
          {hasAnyDiscount && (
            <div className="absolute top-0 right-0 bg-red-600 text-white px-2 py-1 text-xs font-bold">
              {hasMainItemDiscount ? 
                `${mainItemDiscount}% OFF` : 
                `UP TO ${Math.max(...variationPrices.map(v => 
                  calculateDiscountPercentage(v.price, v.previousPrice) || 0
                ))}% OFF`
              }
            </div>
          )}

          {!item.isAvailable && (
            <div className="absolute top-0 left-0 bg-gray-600 text-white px-2 py-1 text-xs font-bold">
              Unavailable
            </div>
          )}
        </div>
        <div className="p-2 sm:p-3 md:p-4">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold">{item.title}</h3>
          {item.description && (
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 line-clamp-2">
              {item.description}
            </p>
          )}
          {Array.isArray(item.items) && item.items.length > 0 && (
            <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 line-clamp-1">
              {item.items.join(', ')}
            </p>
          )}
          <div className="mt-2 sm:mt-4 flex justify-between items-center">
            {hasVariations ? (
              <div className="flex flex-col">
                {lowestPriceVariation && lowestPriceVariation.hasDiscount ? (
                  <>
                    <span className="text-xs text-gray-500 line-through">
                      Rs.{lowestPriceVariation.previousPrice}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-red-600">
                      Rs.{lowestPriceVariation.price}
                    </span>
                  </>
                ) : (
                  <span className="text-lg sm:text-xl font-bold">
                    From Rs.{lowestPriceVariation ? lowestPriceVariation.price : ''}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                {item.previousPrice && Number(getPrice(item.previousPrice)) > Number(getPrice(item.price)) ? (
                  <>
                    <span className="text-xs text-gray-500 line-through">
                      Rs.{getPrice(item.previousPrice)}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-red-600">
                      Rs.{getPrice(item.price)}
                    </span>
                  </>
                ) : (
                  <span className="text-lg sm:text-xl font-bold">
                    Rs.{getPrice(item.price)}
                  </span>
                )}
              </div>
            )}
            {item.isAvailable ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasVariations || hasExtras || hasSideOrders) {
                    handleCardClick();
                  } else {
                    handleAddDirectly(e);
                  }
                }}
                className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Add
              </button>
            ) : (
              <span className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-gray-400 text-white rounded-md">
                Unavailable
              </span>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            ref={modalRef}
            className="bg-white rounded-xl shadow-xl w-full max-w-md mx-auto overflow-hidden animate-fadeIn"
          >
            <div className="relative h-48 sm:h-56 w-full">
              {imageUrl && !imageError ? (
                <img
                  src={imageUrl}
                  alt={item.title}
                  className="object-cover w-full h-full"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full bg-gray-100">
                  <span className="text-gray-500 font-medium">No Image Available</span>
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
              
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 bg-white/80 hover:bg-white text-gray-800 rounded-full p-1 transition-colors shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
              
              {hasAnyDiscount && (
                <div className="absolute top-3 left-3 bg-red-600 text-white px-2 py-1 text-xs font-bold rounded-md shadow-md">
                  {hasMainItemDiscount ? 
                    `${mainItemDiscount}% OFF` : 
                    `UP TO ${Math.max(...variationPrices.map(v => 
                      calculateDiscountPercentage(v.price, v.previousPrice) || 0
                    ))}% OFF`
                  }
                </div>
              )}
              
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <h2 className="text-xl sm:text-2xl font-bold leading-tight">{item.title}</h2>
                {!hasVariations && (
                  <div className="mt-1 flex items-center">
                    {item.previousPrice && Number(getPrice(item.previousPrice)) > Number(getPrice(item.price)) ? (
                      <>
                        <span className="text-white/70 line-through mr-2">Rs.{getPrice(item.previousPrice)}</span>
                        <span className="text-lg font-bold">Rs.{getPrice(item.price)}</span>
                      </>
                    ) : (
                      <span className="text-lg font-bold">Rs.{getPrice(item.price)}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="px-4 py-4 max-h-[calc(75vh-14rem)] overflow-y-auto">
              {item.description && (
                <div className="mb-4">
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              )}
              
              {hasVariations && (
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Choose Variation</h4>
                  <div className="space-y-2">
                    {item.variations.map((variation, index) => {
                      const price = Number(getPrice(variation.price));
                      const previousPrice = variation.previousPrice ? Number(getPrice(variation.previousPrice)) : null;
                      const hasDiscount = previousPrice && previousPrice > price;
                      const discountPercentage = hasDiscount ? calculateDiscountPercentage(price, previousPrice) : null;
                      const isVariationAvailable = variation.isAvailable !== false;

                      return (
                        <div 
                          key={index}
                          className={`flex items-center justify-between p-3 border rounded-lg transition-all ${
                            !isVariationAvailable 
                              ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                              : selectedVariation === String(index)
                              ? 'border-red-500 bg-red-50 cursor-pointer'
                              : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                          }`}
                          onClick={() => isVariationAvailable && setSelectedVariation(String(index))}
                        >
                          <div className="flex items-center">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                              !isVariationAvailable 
                                ? 'border-gray-300' 
                                : selectedVariation === String(index) ? 'border-red-600' : 'border-gray-400'
                            }`}>
                              {selectedVariation === String(index) && isVariationAvailable && (
                                <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                              )}
                            </div>
                            <div className="ml-2">
                              <span className={`text-sm font-medium ${!isVariationAvailable ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {variation.name}
                              </span>
                              {!isVariationAvailable && (
                                <span className="ml-2 text-xs text-red-600 font-semibold">(Unavailable)</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {hasDiscount ? (
                              <div>
                                <span className="text-xs text-gray-400 line-through block">Rs.{previousPrice}</span>
                                <span className={`text-sm font-semibold ${!isVariationAvailable ? 'text-gray-400' : 'text-red-600'}`}>
                                  Rs.{price}
                                </span>
                              </div>
                            ) : (
                              <span className={`text-sm font-semibold ${!isVariationAvailable ? 'text-gray-400' : ''}`}>
                                Rs.{price}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {hasExtras && (
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Extras & Toppings</h4>
                  
                  {Object.entries(groupedExtras).map(([baseName, extraGroup]) => {
                    const hasSizes = extraGroup.some(extra => extra.size);
                    
                    return (
                      <div key={baseName} className="mb-4">
                        {/* Only show headers for items with sizes */}
                        {hasSizes && (
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-gray-800">{baseName}</h5>
                            {selectedExtras[baseName] && (
                              <span className="text-xs text-red-600 font-medium">
                                Selected: {selectedExtras[baseName]}
                              </span>
                            )}
                          </div>
                        )}
                        
                        {hasSizes ? (
                          // Display horizontal layout for sized extras
                          <div className="flex flex-wrap gap-2">
                            {extraGroup
                              .filter(extra => extra.size) 
                              .sort((a, b) => {
                                return Number(getPrice(a.price)) - Number(getPrice(b.price));
                              })
                              .map((extra) => (
                                <div
                                  key={extra.index}
                                  onClick={() => selectExtra(baseName, extra.size)}
                                  className={`py-3 px-5 border rounded-md cursor-pointer transition text-center ${
                                    selectedExtras[baseName] === extra.size
                                      ? 'border-red-500 bg-red-50 text-red-700'
                                      : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div className="text-xs font-medium">{extra.size}</div>
                                  <div className="text-xs mt-0.5">Rs.{getPrice(extra.price)}</div>
                                </div>
                              ))
                            }
                          </div>
                        ) : (
                          // Display original vertical layout for non-sized extras
                          <div className="space-y-2">
                            {extraGroup.map((extra) => (
                              <div 
                                key={extra.index}
                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-all ${
                                  selectedExtras[baseName] === ''
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => selectExtra(baseName, '')}
                              >
                                <div className="flex items-center">
                                  <div className={`w-4 h-4 rounded-sm flex items-center justify-center border ${
                                    selectedExtras[baseName] === '' ? 'bg-red-600' : 'border-gray-400'
                                  }`}>
                                    {selectedExtras[baseName] === '' && (
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                      </svg>
                                    )}
                                  </div>
                                  <span className="ml-2 text-sm font-medium text-gray-800">{extra.name}</span>
                                </div>
                                <span className="text-sm font-semibold">+Rs.{getPrice(extra.price)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {hasSideOrders && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Side Orders</h4>
                  {Object.entries(groupedSideOrders()).map(([category, sideOrdersInCategory]) => (
                    <div key={category} className="mb-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">{formatCategoryName(category)}</p>
                      
                      <div className="overflow-x-auto pb-3 -mx-1">
                        <div className="flex space-x-3 px-1">
                          {sideOrdersInCategory.map((sideOrder) => {
                            const isSelected = selectedSideOrders.includes(sideOrder.index);
                            const sideOrderImageUrl = sideOrder.imageUrl 
                              ? getCacheBustedUrl(sideOrder.imageUrl) 
                              : '';
                            
                            return (
                              <div 
                                key={sideOrder.index}
                                className={`flex-shrink-0 w-36 border rounded-lg overflow-hidden cursor-pointer transition-all
                                          ${isSelected 
                                            ? 'border-red-500 ring-1 ring-red-500 shadow-md' 
                                            : 'border-gray-200 hover:border-gray-300'}`}
                                onClick={() => toggleSideOrder(sideOrder.index)}
                              >
                                <div className="h-24 w-full relative bg-gray-100">
                                  {sideOrderImageUrl ? (
                                    <img
                                      src={sideOrderImageUrl}
                                      alt={sideOrder.name}
                                      className="object-cover h-full w-full"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23ccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                                      }}
                                    />
                                  ) 
                                   : (
                                    <div className="flex items-center justify-center h-full">
                                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                
                                <div className={`p-2 ${isSelected ? 'bg-red-50' : 'bg-white'}`}>
                                  <div className="flex items-center mb-1">
                                    <div className={`w-4 h-4 rounded-sm flex items-center justify-center flex-shrink-0 ${
                                      isSelected ? 'bg-red-600' : 'border border-gray-400'
                                    }`}>
                                      {isSelected && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                      )}
                                    </div>
                                    <span className="ml-1 text-xs font-medium text-gray-800 truncate">{sideOrder.name}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-xs font-medium text-red-600">+Rs.{getPrice(sideOrder.price)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Price</p>
                  <p className="text-xl font-bold text-gray-900">Rs.{calculateTotalPrice()}</p>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={hasVariations && selectedVariation !== "" && item.variations[Number(selectedVariation)]?.isAvailable === false}
                  className={`px-5 py-2 font-medium rounded-md transition-colors shadow-sm ${
                    hasVariations && selectedVariation !== "" && item.variations[Number(selectedVariation)]?.isAvailable === false
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {hasVariations && selectedVariation !== "" && item.variations[Number(selectedVariation)]?.isAvailable === false
                    ? 'Unavailable'
                    : 'Add to Cart'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}