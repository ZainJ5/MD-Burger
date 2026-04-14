"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function FoodItemList() {
  const [foodItems, setFoodItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    price: "",
    previousPrice: "",
    category: "",
    subcategory: "",
    branch: "",
    variations: [],
    extras: [],
    sideOrders: [],
    isAvailable: true,
  });
  const [editImage, setEditImage] = useState(null);
  const [originalItemData, setOriginalItemData] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [updatingAvailability, setUpdatingAvailability] = useState(null); // Track which item's availability is being updated
  const [expandedVariations, setExpandedVariations] = useState({}); // Track which items have expanded variations
  const [filters, setFilters] = useState({
    branch: "",
    category: "",
    subcategory: "",
    search: "",
  });
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [filterCategoriesForDisplay, setFilterCategoriesForDisplay] = useState([]);
  const [filterSubcategoriesForDisplay, setFilterSubcategoriesForDisplay] = useState([]);

  useEffect(() => {
    fetchBranches();
    fetchCategories();
    fetchSubcategories();
    fetchFoodItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, foodItems]);

  useEffect(() => {
    if (editData.branch) {
      const filtered = categories.filter(
        (cat) => extractValue(cat.branch?._id || cat.branch) === editData.branch
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories([]);
    }
  }, [editData.branch, categories]);

  useEffect(() => {
    if (editData.category) {
      const filtered = subcategories.filter(
        (sub) => extractValue(sub.category?._id || sub.category) === editData.category
      );
      setFilteredSubcategories(filtered);
    } else {
      setFilteredSubcategories([]);
    }
  }, [editData.category, subcategories]);

  // Filter categories for the main filter based on selected branch
  useEffect(() => {
    if (filters.branch) {
      const filtered = categories.filter((cat) => {
        const catBranchId =
          typeof cat.branch === "object" && cat.branch !== null
            ? extractValue(cat.branch._id)
            : extractValue(cat.branch);
        return catBranchId === filters.branch;
      });
      setFilterCategoriesForDisplay(filtered);
    } else {
      setFilterCategoriesForDisplay(categories);
    }
  }, [filters.branch, categories]);

  // Filter subcategories for the main filter based on selected category
  useEffect(() => {
    if (filters.category) {
      const filtered = subcategories.filter((sub) => {
        const subCategoryId =
          typeof sub.category === "object" && sub.category !== null
            ? extractValue(sub.category._id)
            : extractValue(sub.category);
        return subCategoryId === filters.category;
      });
      setFilterSubcategoriesForDisplay(filtered);
    } else if (filters.branch) {
      // If branch is selected but not category, show subcategories for all categories in that branch
      const branchCategories = categories.filter((cat) => {
        const catBranchId =
          typeof cat.branch === "object" && cat.branch !== null
            ? extractValue(cat.branch._id)
            : extractValue(cat.branch);
        return catBranchId === filters.branch;
      });
      const branchCategoryIds = branchCategories.map((cat) => extractValue(cat._id));
      const filtered = subcategories.filter((sub) => {
        const subCategoryId =
          typeof sub.category === "object" && sub.category !== null
            ? extractValue(sub.category._id)
            : extractValue(sub.category);
        return branchCategoryIds.includes(subCategoryId);
      });
      setFilterSubcategoriesForDisplay(filtered);
    } else {
      setFilterSubcategoriesForDisplay(subcategories);
    }
  }, [filters.category, filters.branch, subcategories, categories]);

  const fetchBranches = async () => {
    try {
      const res = await fetch("/api/branches");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setBranches(data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const res = await fetch("/api/subcategories");
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const data = await res.json();
      setSubcategories(data);
    } catch (error) {
      console.error("Error fetching subcategories:", error);
    }
  };

  const fetchFoodItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/fooditems");
      const data = await res.json();
      setFoodItems(data);
      setFilteredItems(data);
    } catch (error) {
      console.error("Error fetching food items:", error);
      toast.error("Error fetching food items");
    } finally {
      setLoading(false);
    }
  };

  // New function to toggle item availability
  const toggleItemAvailability = async (id, currentAvailability) => {
    setUpdatingAvailability(id);
    try {
      const formData = new FormData();
      formData.append("isAvailable", !currentAvailability);
      
      const res = await fetch(`/api/fooditems/${id}/toggle-availability`, {
        method: "PATCH",
        body: formData,
      });
      
      if (res.ok) {
        // Update the local state
        const updatedItems = foodItems.map(item => 
          extractValue(item._id) === id 
            ? { ...item, isAvailable: !currentAvailability }
            : item
        );
        setFoodItems(updatedItems);
        toast.success(`Item is now ${!currentAvailability ? "available" : "unavailable"}`);
      } else {
        const errorData = await res.json();
        toast.error(`Failed to update availability: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating availability:", error);
      toast.error("Error updating availability");
    } finally {
      setUpdatingAvailability(null);
    }
  };

  // New function to toggle variation availability
  const toggleVariationAvailability = async (itemId, variationIndex, currentAvailability) => {
    const toggleKey = `${itemId}-${variationIndex}`;
    setUpdatingAvailability(toggleKey);
    try {
      const item = foodItems.find(item => extractValue(item._id) === itemId);
      if (!item) {
        toast.error("Item not found");
        return;
      }

      // Create updated variations array
      const updatedVariations = item.variations.map((v, idx) => 
        idx === variationIndex 
          ? { ...v, isAvailable: !currentAvailability }
          : v
      );

      // Prepare form data
      const formData = new FormData();
      formData.append("title", item.title);
      formData.append("description", item.description);
      formData.append("category", extractValue(item.category?._id || item.category));
      formData.append("branch", extractValue(item.branch?._id || item.branch));
      formData.append("isAvailable", item.isAvailable);
      
      if (item.subcategory) {
        formData.append("subcategory", extractValue(item.subcategory?._id || item.subcategory));
      }

      // Add updated variations
      formData.append("variations", JSON.stringify(updatedVariations));

      // Add extras and side orders if they exist
      if (item.extras && item.extras.length > 0) {
        formData.append("extras", JSON.stringify(item.extras));
      }
      if (item.sideOrders && item.sideOrders.length > 0) {
        formData.append("sideOrders", JSON.stringify(item.sideOrders));
      }

      const res = await fetch(`/api/fooditems/${itemId}`, {
        method: "PATCH",
        body: formData,
      });
      
      if (res.ok) {
        // Update the local state
        const updatedItems = foodItems.map(item => 
          extractValue(item._id) === itemId 
            ? { ...item, variations: updatedVariations }
            : item
        );
        setFoodItems(updatedItems);
        toast.success(`Variation is now ${!currentAvailability ? "available" : "unavailable"}`);
      } else {
        const errorData = await res.json();
        toast.error(`Failed to update variation: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating variation availability:", error);
      toast.error("Error updating variation availability");
    } finally {
      setUpdatingAvailability(null);
    }
  };

  // Toggle expanded state for variations
  const toggleVariationsExpanded = (itemId) => {
    setExpandedVariations(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const applyFilters = () => {
    let filtered = [...foodItems];
    const { branch, category, subcategory, search } = filters;

    if (branch) {
      filtered = filtered.filter((item) => {
        const branchId =
          typeof item.branch === "object" && item.branch !== null
            ? extractValue(item.branch._id)
            : extractValue(item.branch);
        return branchId === branch;
      });
    }
    if (category) {
      filtered = filtered.filter((item) => {
        const categoryId =
          typeof item.category === "object" && item.category !== null
            ? extractValue(item.category._id)
            : extractValue(item.category);
        return categoryId === category;
      });
    }
    if (subcategory) {
      filtered = filtered.filter((item) => {
        const subcategoryId =
          typeof item.subcategory === "object" && item.subcategory !== null
            ? extractValue(item.subcategory._id)
            : extractValue(item.subcategory);
        return subcategoryId === subcategory;
      });
    }
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(searchLower) ||
          item.description.toLowerCase().includes(searchLower)
      );
    }

    setFilteredItems(filtered);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "branch") {
      // Reset category and subcategory when branch changes
      setFilters((prev) => ({ ...prev, branch: value, category: "", subcategory: "" }));
    } else if (name === "category") {
      // Reset subcategory when category changes
      setFilters((prev) => ({ ...prev, category: value, subcategory: "" }));
    } else {
      setFilters((prev) => ({ ...prev, [name]: value }));
    }
  };

  const resetFilters = () => {
    setFilters({ branch: "", category: "", subcategory: "", search: "" });
  };

  const deleteFoodItem = async (id) => {
    try {
      const res = await fetch(`/api/fooditems/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Item deleted successfully");
        setFoodItems((prev) =>
          prev.filter((item) => extractValue(item._id) !== id)
        );
        setShowDeleteConfirm(null);
      } else {
        toast.error("Failed to delete item");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Error deleting item");
    }
  };

  const extractValue = (field) => {
    if (typeof field === "object" && field !== null) {
      if (field.$numberInt) return parseInt(field.$numberInt, 10);
      if (field.$oid) return field.$oid;
    }
    return field;
  };

  const handleEditClick = (item) => {
    const categoryId =
      typeof item.category === "object" && item.category !== null
        ? extractValue(item.category._id)
        : extractValue(item.category);
    const subcategoryId =
      typeof item.subcategory === "object" && item.subcategory !== null
        ? extractValue(item.subcategory._id)
        : extractValue(item.subcategory);
    const branchId =
      typeof item.branch === "object" && item.branch !== null
        ? extractValue(item.branch._id)
        : extractValue(item.branch);
    setEditingItemId(extractValue(item._id));
    setEditData({
      title: item.title || "",
      description: item.description || "",
      price: item.price || "",
      previousPrice: item.previousPrice || "",
      category: categoryId || "",
      subcategory: subcategoryId || "",
      branch: branchId || "",
      variations: item.variations || [],
      extras: item.extras || [],
      sideOrders: item.sideOrders || [],
      isAvailable: item.isAvailable ?? true,
    });
    setOriginalItemData(item);
    setEditImage(null);
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;
    if (name === "branch") {
      setEditData((prev) => ({
        ...prev,
        branch: val,
        category: "",
        subcategory: "",
      }));
    } else if (name === "category") {
      setEditData((prev) => ({
        ...prev,
        category: val,
        subcategory: "",
      }));
    } else {
      setEditData((prev) => ({
        ...prev,
        [name]: val,
      }));
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setEditImage(e.target.files[0]);
    }
  };

  // Variation handlers
  const handleVariationChange = (index, field, value) => {
    setEditData((prev) => {
      const updatedVariations = [...prev.variations];
      updatedVariations[index] = {
        ...updatedVariations[index],
        [field]: field.includes("price") ? Number(value) : field === "isAvailable" ? value : value,
      };
      return {
        ...prev,
        variations: updatedVariations,
      };
    });
  };

  const addVariation = () => {
    setEditData((prev) => ({
      ...prev,
      variations: [...prev.variations, { name: "", price: 0, previousPrice: null, isAvailable: true }],
    }));
  };

  const removeVariation = (index) => {
    setEditData((prev) => {
      const updatedVariations = [...prev.variations];
      updatedVariations.splice(index, 1);
      return {
        ...prev,
        variations: updatedVariations,
      };
    });
  };

  // Extra handlers
  const handleExtraChange = (index, field, value) => {
    setEditData((prev) => {
      const updatedExtras = [...prev.extras];
      updatedExtras[index] = {
        ...updatedExtras[index],
        [field]: field === "price" ? Number(value) : value,
      };
      return {
        ...prev,
        extras: updatedExtras,
      };
    });
  };

  const addExtra = () => {
    setEditData((prev) => ({
      ...prev,
      extras: [...prev.extras, { name: "", description: "", price: 0, imageUrl: "" }],
    }));
  };

  const removeExtra = (index) => {
    setEditData((prev) => {
      const updatedExtras = [...prev.extras];
      updatedExtras.splice(index, 1);
      return {
        ...prev,
        extras: updatedExtras,
      };
    });
  };

  // Side Order handlers
  const handleSideOrderChange = (index, field, value) => {
    setEditData((prev) => {
      const updatedSideOrders = [...prev.sideOrders];
      updatedSideOrders[index] = {
        ...updatedSideOrders[index],
        [field]: field === "price" ? Number(value) : value,
      };
      return {
        ...prev,
        sideOrders: updatedSideOrders,
      };
    });
  };

  const addSideOrder = () => {
    setEditData((prev) => ({
      ...prev,
      sideOrders: [...prev.sideOrders, { name: "", description: "", price: 0, imageUrl: "", category: "other" }],
    }));
  };

  const removeSideOrder = (index) => {
    setEditData((prev) => {
      const updatedSideOrders = [...prev.sideOrders];
      updatedSideOrders.splice(index, 1);
      return {
        ...prev,
        sideOrders: updatedSideOrders,
      };
    });
  };

  const handleExtraImageChange = (index, e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Handle the file upload visually for now, will be sent in form data later
      setEditData((prev) => {
        const updatedExtras = [...prev.extras];
        updatedExtras[index] = {
          ...updatedExtras[index],
          _tempFile: file,
          _tempFileName: file.name
        };
        return {
          ...prev,
          extras: updatedExtras,
        };
      });
    }
  };

  const handleSideOrderImageChange = (index, e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Handle the file upload visually for now, will be sent in form data later
      setEditData((prev) => {
        const updatedSideOrders = [...prev.sideOrders];
        updatedSideOrders[index] = {
          ...updatedSideOrders[index],
          _tempFile: file,
          _tempFileName: file.name
        };
        return {
          ...prev,
          sideOrders: updatedSideOrders,
        };
      });
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingItemId) return;

    const formData = new FormData();
    formData.append("title", editData.title);
    formData.append("description", editData.description);

    if (!editData.variations || editData.variations.length === 0) {
      formData.append("price", editData.price);
      if (editData.previousPrice) {
        formData.append("previousPrice", editData.previousPrice);
      }
    }

    formData.append("category", editData.category);
    if (editData.subcategory) formData.append("subcategory", editData.subcategory);
    formData.append("branch", editData.branch);
    formData.append("isAvailable", editData.isAvailable);

    // Process variations
    if (editData.variations && editData.variations.length > 0) {
      const validVariations = editData.variations.filter(
        (v) => v.name && v.name.trim() !== "" && v.price !== null && v.price !== undefined
      );
      if (validVariations.length > 0) {
        formData.append("variations", JSON.stringify(validVariations));
      }
    }

    // Process extras
    if (editData.extras && editData.extras.length > 0) {
      const validExtras = editData.extras.filter(
        (e) => e.name && e.name.trim() !== "" && e.price !== null && e.price !== undefined
      );
      if (validExtras.length > 0) {
        // Remove temp file references before JSON conversion
        const cleanExtras = validExtras.map(({_tempFile, _tempFileName, ...rest}) => rest);
        formData.append("extras", JSON.stringify(cleanExtras));
        
        // Handle extra images
        validExtras.forEach((extra, index) => {
          if (extra._tempFile) {
            formData.append(`extraImage_${index}`, extra._tempFile);
          }
        });
      }
    }

    // Process side orders
    if (editData.sideOrders && editData.sideOrders.length > 0) {
      const validSideOrders = editData.sideOrders.filter(
        (s) => s.name && s.name.trim() !== "" && s.price !== null && s.price !== undefined
      );
      if (validSideOrders.length > 0) {
        // Remove temp file references before JSON conversion
        const cleanSideOrders = validSideOrders.map(({_tempFile, _tempFileName, ...rest}) => rest);
        formData.append("sideOrders", JSON.stringify(cleanSideOrders));
        
        // Handle side order images
        validSideOrders.forEach((sideOrder, index) => {
          if (sideOrder._tempFile) {
            formData.append(`sideOrderImage_${index}`, sideOrder._tempFile);
          }
        });
      }
    }

    if (editImage) formData.append("foodImage", editImage);

    try {
      const res = await fetch(`/api/fooditems/${editingItemId}`, {
        method: "PATCH",
        body: formData,
      });
      if (res.ok) {
        toast.success("Item updated successfully");
        setEditingItemId(null);
        setEditData({
          title: "",
          description: "",
          price: "",
          previousPrice: "",
          category: "",
          subcategory: "",
          branch: "",
          variations: [],
          extras: [],
          sideOrders: [],
          isAvailable: true,
        });
        setOriginalItemData(null);
        setEditImage(null);
        fetchFoodItems();
      } else {
        const errorData = await res.json();
        toast.error(`Failed to update item: ${errorData.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("Error updating item");
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditData({
      title: "",
      description: "",
      price: "",
      previousPrice: "",
      category: "",
      subcategory: "",
      branch: "",
      variations: [],
      extras: [],
      sideOrders: [],
      isAvailable: true,
    });
    setOriginalItemData(null);
    setEditImage(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg text-gray-600 animate-pulse">Loading food items...</p>
    </div>
  );
  if (foodItems.length === 0) return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-lg text-gray-600">No food items available.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Filters Section */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Filter Items</h2>
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by title or description"
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all duration-300"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            name="branch"
            value={filters.branch}
            onChange={handleFilterChange}
            className="flex-1 py-2 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all duration-300"
          >
            <option value="">All Branches</option>
            {branches.map((branch) => (
              <option key={extractValue(branch._id)} value={extractValue(branch._id)}>
                {branch.name}
              </option>
            ))}
          </select>
          <select
            name="category"
            value={filters.category}
            onChange={handleFilterChange}
            className="flex-1 py-2 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all duration-300"
          >
            <option value="">All Categories</option>
            {filterCategoriesForDisplay.map((category) => (
              <option key={extractValue(category._id)} value={extractValue(category._id)}>
                {category.name}
              </option>
            ))}
          </select>
          <select
            name="subcategory"
            value={filters.subcategory}
            onChange={handleFilterChange}
            className="flex-1 py-2 px-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all duration-300"
          >
            <option value="">All Subcategories</option>
            {filterSubcategoriesForDisplay.map((subcategory) => (
              <option key={extractValue(subcategory._id)} value={extractValue(subcategory._id)}>
                {subcategory.name}
              </option>
            ))}
          </select>
          <button
            onClick={resetFilters}
            className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-all duration-300 text-sm font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Food Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const id = extractValue(item._id);
          const price = extractValue(item.price);
          const previousPrice = extractValue(item.previousPrice);
          const isAvailable = item.isAvailable ?? true;

          if (editingItemId === id) {
            return (
              <div key={id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 col-span-full">
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Edit Food Item</h2>
                  
                  {/* Basic Info Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-md font-semibold text-gray-700 mb-3">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                          type="text"
                          name="title"
                          value={editData.title}
                          onChange={handleEditChange}
                          placeholder="Title"
                          className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm py-2 px-3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          name="description"
                          value={editData.description}
                          onChange={handleEditChange}
                          placeholder="Description"
                          className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm py-2 px-3"
                        ></textarea>
                      </div>
                      
                      {(!editData.variations || editData.variations.length === 0) && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Price</label>
                            <input
                              type="number"
                              name="price"
                              value={editData.price}
                              onChange={handleEditChange}
                              placeholder="Price"
                              className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm py-2 px-3"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Previous Price (Optional)</label>
                            <input
                              type="number"
                              name="previousPrice"
                              value={editData.previousPrice}
                              onChange={handleEditChange}
                              placeholder="Previous Price"
                              className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm py-2 px-3"
                            />
                          </div>
                        </>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Branch</label>
                        <select
                          name="branch"
                          value={editData.branch}
                          onChange={handleEditChange}
                          className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm py-2 px-3"
                        >
                          <option value="">Select Branch</option>
                          {branches.map((branch) => (
                            <option key={extractValue(branch._id)} value={extractValue(branch._id)}>
                              {branch.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <select
                          name="category"
                          value={editData.category}
                          onChange={handleEditChange}
                          className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm py-2 px-3"
                        >
                          <option value="">Select Category</option>
                          {filteredCategories.map((category) => (
                            <option key={extractValue(category._id)} value={extractValue(category._id)}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Subcategory (if applicable)</label>
                        <select
                          name="subcategory"
                          value={editData.subcategory}
                          onChange={handleEditChange}
                          className="mt-1 block w-full rounded-lg border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm py-2 px-3"
                        >
                          <option value="">Select Subcategory</option>
                          {filteredSubcategories.map((subcategory) => (
                            <option key={extractValue(subcategory._id)} value={extractValue(subcategory._id)}>
                              {subcategory.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Update Image (optional)
                        </label>
                        <input
                          type="file"
                          name="foodImage"
                          onChange={handleImageChange}
                          className="mt-1 block w-full rounded-lg border-gray-200 text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isAvailable"
                          name="isAvailable"
                          checked={editData.isAvailable}
                          onChange={handleEditChange}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
                          Item is Available
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Variations Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-semibold text-gray-700">Variations</h3>
                      <button
                        type="button"
                        onClick={addVariation}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm"
                      >
                        Add Variation
                      </button>
                    </div>
                    {editData.variations && editData.variations.length > 0 ? (
                      <div className="space-y-2">
                        {editData.variations.map((variation, index) => (
                          <div
                            key={index}
                            className="flex flex-wrap gap-2 items-center p-3 border rounded-lg bg-white"
                          >
                            <input
                              type="text"
                              value={variation.name || ""}
                              onChange={(e) => handleVariationChange(index, "name", e.target.value)}
                              placeholder="Variation Name"
                              className="flex-1 border p-2 rounded-lg min-w-[150px] text-sm"
                            />
                            <input
                              type="number"
                              value={variation.price || 0}
                              onChange={(e) =>
                                handleVariationChange(index, "price", e.target.value)
                              }
                              placeholder="Price"
                              className="w-24 border p-2 rounded-lg text-sm"
                            />
                            <input
                              type="number"
                              value={variation.previousPrice || ""}
                              onChange={(e) =>
                                handleVariationChange(index, "previousPrice", e.target.value)
                              }
                              placeholder="Previous Price"
                              className="w-28 border p-2 rounded-lg text-sm"
                            />
                            <div className="flex items-center gap-2 px-2">
                              <input
                                type="checkbox"
                                checked={variation.isAvailable ?? true}
                                onChange={(e) =>
                                  handleVariationChange(index, "isAvailable", e.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-xs text-gray-700">Available</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVariation(index)}
                              className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-all duration-300 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No variations added</p>
                    )}
                  </div>
                  
                  {/* Extras Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-semibold text-gray-700">Extras</h3>
                      <button
                        type="button"
                        onClick={addExtra}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm"
                      >
                        Add Extra
                      </button>
                    </div>
                    {editData.extras && editData.extras.length > 0 ? (
                      <div className="space-y-3">
                        {editData.extras.map((extra, index) => (
                          <div
                            key={index}
                            className="p-3 border rounded-lg bg-white"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                <input
                                  type="text"
                                  value={extra.name || ""}
                                  onChange={(e) => handleExtraChange(index, "name", e.target.value)}
                                  placeholder="Extra Name"
                                  className="w-full border p-2 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                                <input
                                  type="number"
                                  value={extra.price || 0}
                                  onChange={(e) => handleExtraChange(index, "price", e.target.value)}
                                  placeholder="Price"
                                  className="w-full border p-2 rounded-lg text-sm"
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                  value={extra.description || ""}
                                  onChange={(e) => handleExtraChange(index, "description", e.target.value)}
                                  placeholder="Description"
                                  className="w-full border p-2 rounded-lg text-sm"
                                  rows={2}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Image</label>
                                <input
                                  type="file"
                                  onChange={(e) => handleExtraImageChange(index, e)}
                                  className="w-full text-sm"
                                />
                                {(extra.imageUrl || extra._tempFileName) && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    Current: {extra._tempFileName || extra.imageUrl}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeExtra(index)}
                                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-all duration-300 text-sm"
                              >
                                Remove Extra
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No extras added</p>
                    )}
                  </div>
                  
                  {/* Side Orders Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-md font-semibold text-gray-700">Side Orders</h3>
                      <button
                        type="button"
                        onClick={addSideOrder}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm"
                      >
                        Add Side Order
                      </button>
                    </div>
                    {editData.sideOrders && editData.sideOrders.length > 0 ? (
                      <div className="space-y-3">
                        {editData.sideOrders.map((sideOrder, index) => (
                          <div
                            key={index}
                            className="p-3 border rounded-lg bg-white"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                                <input
                                  type="text"
                                  value={sideOrder.name || ""}
                                  onChange={(e) => handleSideOrderChange(index, "name", e.target.value)}
                                  placeholder="Side Order Name"
                                  className="w-full border p-2 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Price</label>
                                <input
                                  type="number"
                                  value={sideOrder.price || 0}
                                  onChange={(e) => handleSideOrderChange(index, "price", e.target.value)}
                                  placeholder="Price"
                                  className="w-full border p-2 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                                <select
                                  value={sideOrder.category || "other"}
                                  onChange={(e) => handleSideOrderChange(index, "category", e.target.value)}
                                  className="w-full border p-2 rounded-lg text-sm"
                                >
                                  <option value="drinks">Drinks</option>
                                  <option value="appetizers">Appetizers</option>
                                  <option value="desserts">Desserts</option>
                                  <option value="other">Other</option>
                                </select>
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                  value={sideOrder.description || ""}
                                  onChange={(e) => handleSideOrderChange(index, "description", e.target.value)}
                                  placeholder="Description"
                                  className="w-full border p-2 rounded-lg text-sm"
                                  rows={2}
                                />
                              </div>
                              <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Image</label>
                                <input
                                  type="file"
                                  onChange={(e) => handleSideOrderImageChange(index, e)}
                                  className="w-full text-sm"
                                />
                                {(sideOrder.imageUrl || sideOrder._tempFileName) && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    Current: {sideOrder._tempFileName || sideOrder.imageUrl}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeSideOrder(index)}
                                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-all duration-300 text-sm"
                              >
                                Remove Side Order
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No side orders added</p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-all duration-300 text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-300 text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            );
          }

          return (
            <div
              key={id}
              className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-32 object-cover rounded-lg mb-2"
                />
              ) : (
                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm mb-2">
                  No Image
                </div>
              )}
              <h3 className="text-base font-semibold text-gray-800 mb-1">{item.title}</h3>
              
              {/* Updated availability toggle */}
              <div className="flex items-center justify-between mb-2">
                <button 
                  onClick={() => toggleItemAvailability(id, isAvailable)}
                  disabled={updatingAvailability === id}
                  className={`relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ease-in-out ${
                    isAvailable ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                  aria-pressed={isAvailable}
                >
                  <span className="sr-only">
                    {isAvailable ? 'Available' : 'Unavailable'}
                  </span>
                  <span
                    className={`${
                      isAvailable ? 'translate-x-5' : 'translate-x-0'
                    } inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                      updatingAvailability === id ? 'animate-pulse' : ''
                    }`}
                  />
                </button>
                <span className={`text-xs font-medium ${isAvailable ? "text-green-600" : "text-red-600"}`}>
                  {updatingAvailability === id ? 'Updating...' : isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              
              {/* Price display with optional previous price */}
              {(!item.variations || item.variations.length === 0) && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-800">{price} Rs</span>
                  {previousPrice && (
                    <span className="text-xs text-gray-500 line-through">{previousPrice} Rs</span>
                  )}
                </div>
              )}
              
              {/* Show variations if available */}
              {item.variations && item.variations.length > 0 && (
                <div className="mb-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVariationsExpanded(id);
                    }}
                    className="w-full flex items-center justify-between px-2 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors duration-200"
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <svg 
                        className={`w-3.5 h-3.5 text-blue-600 transition-transform duration-200 ${expandedVariations[id] ? 'rotate-90' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="font-semibold text-blue-700">{item.variations.length}</span>
                      <span className="text-blue-600">variation{item.variations.length > 1 ? 's' : ''}</span>
                    </div>
                    <span className="text-xs text-blue-600 font-medium">
                      {expandedVariations[id] ? 'Hide' : 'Manage'}
                    </span>
                  </button>
                  
                  {expandedVariations[id] && (
                    <div className="grid grid-cols-1 gap-1 mt-1.5">
                      {item.variations.map((variation, idx) => {
                        const toggleKey = `${id}-${idx}`;
                        const isUpdating = updatingAvailability === toggleKey;
                        const isVariationAvailable = variation.isAvailable !== false;
                        
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center justify-between px-2 py-1 rounded-md text-xs border ${
                              isVariationAvailable 
                                ? 'bg-green-50 border-green-200' 
                                : 'bg-gray-100 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className={`font-medium truncate ${!isVariationAvailable ? "text-gray-400 line-through" : "text-gray-700"}`}>
                                {variation.name}
                              </span>
                              <span className="text-gray-500 flex-shrink-0">•</span>
                              <span className={`flex-shrink-0 ${!isVariationAvailable ? "text-gray-400" : "text-gray-600"}`}>
                                {extractValue(variation.price)} Rs
                              </span>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleVariationAvailability(id, idx, isVariationAvailable);
                              }}
                              disabled={isUpdating}
                              className={`relative inline-flex items-center h-3.5 rounded-full w-7 focus:outline-none transition-colors duration-200 ml-2 flex-shrink-0 ${
                                isVariationAvailable ? 'bg-green-500' : 'bg-gray-400'
                              }`}
                              aria-pressed={isVariationAvailable}
                              title={isVariationAvailable ? 'Available - Click to disable' : 'Unavailable - Click to enable'}
                            >
                              <span className="sr-only">
                                {isVariationAvailable ? 'Available' : 'Unavailable'}
                              </span>
                              <span
                                className={`${
                                  isVariationAvailable ? 'translate-x-3.5' : 'translate-x-0.5'
                                } inline-block w-2.5 h-2.5 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                                  isUpdating ? 'animate-pulse' : ''
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              {/* Branch, Category, Subcategory */}
              {item.branch &&
              typeof item.branch === "object" &&
              item.branch.name ? (
                <p className="text-xs text-gray-500 mb-0.5">Branch: {item.branch.name}</p>
              ) : (
                item.branch && (
                  <p className="text-xs text-gray-500 mb-0.5">
                    Branch: {extractValue(item.branch)}
                  </p>
                )
              )}
              
              {item.category &&
              typeof item.category === "object" &&
              item.category.name ? (
                <p className="text-xs text-gray-500 mb-0.5">Category: {item.category.name}</p>
              ) : (
                item.category && (
                  <p className="text-xs text-gray-500 mb-0.5">
                    Category: {extractValue(item.category)}
                  </p>
                )
              )}
              
              {item.subcategory &&
              typeof item.subcategory === "object" &&
              item.subcategory.name ? (
                <p className="text-xs text-gray-500 mb-0.5">
                  Subcategory: {item.subcategory.name}
                </p>
              ) : (
                item.subcategory && (
                  <p className="text-xs text-gray-500 mb-0.5">
                    Subcategory: {extractValue(item.subcategory)}
                  </p>
                )
              )}
              
              <div className="mt-auto flex gap-2 pt-2">
                <button
                  onClick={() => handleEditClick(item)}
                  className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm font-medium flex-1"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(id)}
                  className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-all duration-300 text-sm font-medium flex-1"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Are you sure you want to delete this item?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all duration-300 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteFoodItem(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-300 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}