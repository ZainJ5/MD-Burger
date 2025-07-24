import { useCartStore } from '../../store/cart';
import { useMenuStore } from '../../store/menu';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';

export default function SuperDeals({ searchQuery }) {
  const [items, setItems] = useState([]);
  const { addToCart } = useCartStore();
  const activeCategory = useMenuStore((state) => state.activeCategory);
  const activeSubcategory = useMenuStore((state) => state.activeSubcategory);

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalSelectedVariation, setModalSelectedVariation] = useState("");

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

  const getLowestPrice = (variations) => {
    if (Array.isArray(variations) && variations.length > 0) {
      const prices = variations.map((v) => Number(getPrice(v.price)));
      return Math.min(...prices);
    }
    return null;
  };

  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch('/api/fooditems');
        const data = await res.json();
        setItems(data);
      } catch (error) {
      }
    }
    fetchItems();
  }, []);

  const lowerQuery = searchQuery.toLowerCase();

  const filteredItems = items.filter((item) => {
    // Check for category match - required if activeCategory is set
    const itemCategory = getId(item.category);
    const categoryMatch = activeCategory ? itemCategory === activeCategory : true;
    
    // Check for subcategory match - only required if activeSubcategory is set
    const itemSubcategory = getId(item.subcategory);
    const subcategoryMatch = activeSubcategory ? itemSubcategory === activeSubcategory : true;
    
    // Search query matching
    const titleMatch = item.title.toLowerCase().includes(lowerQuery);
    const itemsMatch =
      item.items &&
      Array.isArray(item.items) &&
      item.items.some((i) => i.toLowerCase().includes(lowerQuery));
    
    return categoryMatch && subcategoryMatch && (titleMatch || itemsMatch);
  });

  const openModal = (item) => {
    setSelectedItem(item);
    if (item.variations && item.variations.length > 0) {
      setModalSelectedVariation("0"); 
    } else {
      setModalSelectedVariation("");
    }
  };

  const handleAddDirectly = (item, e) => {
    e.stopPropagation();
    const cartItemId = `${getId(item._id)}-${Date.now()}`;
    const itemToAdd = { ...item, cartItemId };
    addToCart(itemToAdd);
    toast.success("Item added to cart!", { autoClose: 2000 });
  };

  const handleAddWithVariations = (item, e) => {
    e.stopPropagation();
    openModal(item);
  };

  const handleCardClick = (item) => {
    openModal(item);
  };

  const handleModalAddToCart = () => {
    if (selectedItem.variations && selectedItem.variations.length > 0) {
      const variationIndex = Number(modalSelectedVariation);
      const selectedVar = selectedItem.variations[variationIndex];
      if (
        !selectedVar ||
        !selectedVar.name ||
        selectedVar.name.trim().length === 0
      ) {
        toast.error("Selected variation data is invalid. Please select a valid variation.");
        return;
      }
      const cartItemId = `${getId(selectedItem._id)}-${selectedVar.name}-${Date.now()}`;
      const itemToAdd = { 
        ...selectedItem, 
        price: selectedVar.price, 
        type: selectedVar.name,  
        cartItemId 
      };
      addToCart(itemToAdd);
      toast.success("Item added to cart!", { autoClose: 2000 });
    } else {
      const cartItemId = `${getId(selectedItem._id)}-${Date.now()}`;
      const itemToAdd = { ...selectedItem, cartItemId };
      addToCart(itemToAdd);
      toast.success("Item added to cart!", { autoClose: 2000 });
    }
    setSelectedItem(null);
    setModalSelectedVariation("");
  };

  const closeModal = () => {
    setSelectedItem(null);
    setModalSelectedVariation("");
  };

  useEffect(() => {
    if (!selectedItem) {
      setModalSelectedVariation("");
    }
  }, [selectedItem]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-8 mb-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
          {filteredItems.map((item) => {
            const hasVariations = item.variations && item.variations.length > 0;
            const lowestPrice = hasVariations ? getLowestPrice(item.variations) : null;
            return (
              <div
                key={getId(item._id)}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleCardClick(item)}
              >
                <div
                  className="h-48 w-full"
                  style={{ position: 'relative' }}
                >
                  {item.imageUrl && item.imageUrl !== '' ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Image</span>
                    </div>
                  )}
                </div>
                <div className="p-2 sm:p-3 md:p-4">
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold">
                    {item.title}
                  </h3>
                  {item.description && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                      {item.description}
                    </p>
                  )}
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">
                    {Array.isArray(item.items) ? item.items.join(', ') : ''}
                  </p>
                  <div className="mt-2 sm:mt-4 flex justify-between items-center">
                    <span className="text-lg sm:text-xl md:text-2xl font-bold">
                      {hasVariations
                        ? `Rs.${lowestPrice}`
                        : `Rs.${getPrice(item.price)}`}
                    </span>
                    <button
                      onClick={(e) => {
                        if (hasVariations) {
                          handleAddWithVariations(item, e);
                        } else {
                          handleAddDirectly(item, e);
                        }
                      }}
                      className="px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                    >
                      Add 
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedItem && (
        <div
          key={getId(selectedItem._id)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg p-6 relative mx-4">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
            >
              ×
            </button>
            <div className="flex flex-col items-center">
              <div
                className="w-full h-48 mb-4"
                style={{ position: 'relative' }}
              >
                {selectedItem.imageUrl && selectedItem.imageUrl !== '' ? (
                  <img
                    src={selectedItem.imageUrl}
                    alt={selectedItem.title}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    className="rounded"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-sm">No Image</span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">
                {selectedItem.title}
              </h2>
              {selectedItem.description && (
                <p className="text-gray-700 mb-4 text-center">
                  {selectedItem.description}
                </p>
              )}
              {selectedItem.variations &&
              selectedItem.variations.length > 0 ? (
                <div className="w-full mb-4">
                  <label className="block text-gray-700 mb-1">
                    Select Variation:
                  </label>
                  <select
                    value={modalSelectedVariation}
                    onChange={(e) => setModalSelectedVariation(e.target.value)}
                    className="w-full border rounded p-2"
                  >
                    {selectedItem.variations.map((variation, index) => (
                      <option key={index} value={index}>
                        {variation.name} - Rs.{getPrice(variation.price)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="w-full mb-4 text-center">
                  <p className="text-lg font-bold">
                    Price: Rs.{getPrice(selectedItem.price)}
                  </p>
                </div>
              )}
              <button
                onClick={handleModalAddToCart}
                className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
