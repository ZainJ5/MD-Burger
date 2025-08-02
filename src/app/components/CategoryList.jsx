"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import Image from "next/image";

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast.error("Error fetching categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const deleteCategory = async (id) => {
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Category deleted successfully");
        setCategories((prev) => prev.filter((cat) => cat._id !== id));
      } else {
        toast.error("Failed to delete category");
      }
    } catch (error) {
      toast.error("Error deleting category");
    }
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setImagePreview(category.image || "");
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCategory(null);
    setCategoryName("");
    setImageFile(null);
    setImagePreview("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", categoryName);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/categories/${editingCategory._id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        const updatedCategory = await res.json();
        setCategories((prev) =>
          prev.map((cat) =>
            cat._id === editingCategory._id ? updatedCategory : cat
          )
        );
        toast.success("Category updated successfully");
        closeEditModal();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to update category");
      }
    } catch (error) {
      toast.error("Error updating category");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !categories.length) return <p>Loading categories...</p>;
  if (!categories.length) return <p>No categories available.</p>;

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat._id} className="flex items-center justify-between border p-4 rounded">
          <div className="flex items-center">
            {cat.image && (
              <div className="mr-3">
                <Image 
                  src={cat.image} 
                  alt={cat.name} 
                  width={50} 
                  height={50} 
                  className="rounded object-cover"
                />
              </div>
            )}
            <div>
              <span className="font-bold">{cat.name}</span>
              {cat.branch && typeof cat.branch === "object" && (
                <span className="ml-2 text-sm text-gray-600">
                  (Branch: {cat.branch.name})
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => openEditModal(cat)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
            >
              Edit
            </button>
            <button
              onClick={() => deleteCategory(cat._id)}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Category</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Category Name</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Category Image</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="w-full border rounded px-3 py-2"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <Image
                      src={imagePreview}
                      alt="Category preview"
                      width={100}
                      height={100}
                      className="rounded object-cover"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}