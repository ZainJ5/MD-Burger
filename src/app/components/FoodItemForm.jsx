"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export default function AddFoodItemForm({
  branches,
  categories,
  subcategories,
  addFoodItem,
}) {
  const [selectedBranchId, setSelectedBranchId] = useState("");
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [foodImageFile, setFoodImageFile] = useState(null);

  const [variations, setVariations] = useState([]);
  const [variationName, setVariationName] = useState("");
  const [variationPrice, setVariationPrice] = useState("");
  
  const [categoryHasSubcategories, setCategoryHasSubcategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (variations.length > 0) {
      setPrice("");
    }
  }, [variations]);

  useEffect(() => {
    if (selectedBranchId) {
      const filtered = categories.filter((cat) => {
        const branchId =
          typeof cat.branch === "object" ? cat.branch._id : cat.branch;
        return String(branchId) === String(selectedBranchId);
      });
      setFilteredCategories(filtered);
      setSelectedCategoryId("");
      setFilteredSubcategories([]);
      setSelectedSubcategoryId("");
      setCategoryHasSubcategories(false);
    } else {
      setFilteredCategories([]);
      setSelectedCategoryId("");
      setFilteredSubcategories([]);
      setSelectedSubcategoryId("");
      setCategoryHasSubcategories(false);
    }
  }, [selectedBranchId, categories]);

  useEffect(() => {
    if (selectedCategoryId) {
      const filtered = subcategories.filter((sub) => {
        const categoryId =
          typeof sub.category === "object" ? sub.category._id : sub.category;
        return String(categoryId) === String(selectedCategoryId);
      });
      setFilteredSubcategories(filtered);
      setSelectedSubcategoryId("");
      
      setCategoryHasSubcategories(filtered.length > 0);
    } else {
      setFilteredSubcategories([]);
      setSelectedSubcategoryId("");
      setCategoryHasSubcategories(false);
    }
  }, [selectedCategoryId, subcategories]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFoodImageFile(e.target.files[0]);
    }
  };

  const addVariation = () => {
    if (!variationName.trim() || !variationPrice) {
      toast.error("Please provide both variation name and price.");
      return;
    }
    setVariations((prev) => [
      ...prev,
      { name: variationName.trim(), price: parseFloat(variationPrice) },
    ]);
    setVariationName("");
    setVariationPrice("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (categoryHasSubcategories && !selectedSubcategoryId) {
      toast.error("This category has subcategories. Please select a subcategory.");
      return;
    }

    const missingMandatory = !selectedBranchId || 
                             !selectedCategoryId || 
                             !title.trim() || 
                             !foodImageFile || 
                             (variations.length === 0 && !price);

    if (missingMandatory) {
      let errorMsg = "Please fill in all mandatory fields: ";
      const missing = [];
      if (!selectedBranchId) missing.push("Branch");
      if (!selectedCategoryId) missing.push("Category");
      if (!title.trim()) missing.push("Item Title");
      if (!foodImageFile) missing.push("Food Image");
      if (variations.length === 0 && !price) missing.push("Price");
      
      errorMsg += missing.join(", ");
      toast.error(errorMsg);
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("branch", selectedBranchId);
    formData.append("category", selectedCategoryId);
    if (selectedSubcategoryId) {
      formData.append("subcategory", selectedSubcategoryId);
    }
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    if (variations.length === 0) {
      formData.append("price", price);
    }
    formData.append("foodImage", foodImageFile);
    if (variations.length > 0) {
      formData.append("variations", JSON.stringify(variations));
    }

    try {
      await addFoodItem(formData);
      toast.success("Food item added successfully!");
      setSelectedBranchId("");
      setSelectedCategoryId("");
      setSelectedSubcategoryId("");
      setTitle("");
      setDescription("");
      setPrice("");
      setFoodImageFile(null);
      setVariations([]);
    } catch (error) {
      toast.error("Error adding food item: " + error.message);
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1">Select Branch</label>
        <select
          required
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">-- Select Branch --</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium mb-1">Select Category</label>
        <select
          required
          value={selectedCategoryId}
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          className="w-full border rounded p-2"
          disabled={!selectedBranchId}
        >
          <option value="">-- Select Category --</option>
          {filteredCategories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block font-medium mb-1">
          {categoryHasSubcategories 
            ? "Select Subcategory (Required)" 
            : "Select Subcategory (Optional)"}
        </label>
        <select
          value={selectedSubcategoryId}
          onChange={(e) => setSelectedSubcategoryId(e.target.value)}
          className="w-full border rounded p-2"
          disabled={!selectedCategoryId}
          required={categoryHasSubcategories}
        >
          <option value="">
            {categoryHasSubcategories 
              ? "-- Select Subcategory --" 
              : "-- Select Subcategory (Optional) --"}
          </option>
          {filteredSubcategories.map((sub) => (
            <option key={sub._id} value={sub._id}>
              {sub.name}
            </option>
          ))}
        </select>
        {categoryHasSubcategories && (
          <p className="text-sm text-red-600">
            This category has subcategories. You must select one.
          </p>
        )}
      </div>

      <div>
        <label className="block font-medium mb-1">Item Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="Enter item title"
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="Enter description (optional)"
        ></textarea>
      </div>

      <div>
        <label className="block font-medium mb-1">
          Price{" "}
          {variations.length > 0 &&
            "(Disabled because variations determine the price)"}
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="Enter price"
          disabled={variations.length > 0}
          required={variations.length === 0}
        />
        {variations.length > 0 && (
          <p className="text-sm text-gray-600">
            Price is determined by the selected variation.
          </p>
        )}
      </div>

      <div>
        <label className="block font-medium mb-1">Upload Image</label>
        <input
          type="file"
          required
          onChange={handleFileChange}
          className="w-full border rounded p-2"
          accept="image/*"
        />
      </div>

      <div>
        <label className="block font-medium mb-1">Variations (optional)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={variationName}
            onChange={(e) => setVariationName(e.target.value)}
            placeholder="Variation Name (e.g., Small)"
            className="w-1/2 border rounded p-2"
          />
          <input
            type="number"
            value={variationPrice}
            onChange={(e) => setVariationPrice(e.target.value)}
            placeholder="Price"
            className="w-1/2 border rounded p-2"
          />
          <button
            type="button"
            onClick={addVariation}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Add Variation
          </button>
        </div>
        {variations.length > 0 && (
          <ul className="list-disc pl-5">
            {variations.map((v, index) => (
              <li key={index}>
                {v.name}: {v.price} Rs
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
      >
        {isSubmitting ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Adding...
          </div>
        ) : (
          "Add Food Item"
        )}
      </button>
    </form>
  );
}