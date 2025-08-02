"use client";

import { useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import Image from "next/image";

export default function SubcategoryList() {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [subcategoryName, setSubcategoryName] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);

  const fetchSubcategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/subcategories");
      const data = await res.json();
      setSubcategories(data);
    } catch (error) {
      toast.error("Error fetching subcategories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubcategories();
  }, []);

  const deleteSubcategory = async (id) => {
    try {
      const res = await fetch(`/api/subcategories/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Subcategory deleted successfully");
        setSubcategories((prev) => prev.filter((sub) => sub._id !== id));
      } else {
        toast.error("Failed to delete subcategory");
      }
    } catch (error) {
      toast.error("Error deleting subcategory");
    }
  };

  const openEditModal = (subcategory) => {
    setEditingSubcategory(subcategory);
    setSubcategoryName(subcategory.name);
    setImagePreview(subcategory.image || "");
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingSubcategory(null);
    setSubcategoryName("");
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
    if (!subcategoryName.trim()) {
      toast.error("Subcategory name is required");
      return;
    }

    const formData = new FormData();
    formData.append("name", subcategoryName);
    if (imageFile) {
      formData.append("image", imageFile);
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/subcategories/${editingSubcategory._id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        const updatedSubcategory = await res.json();
        setSubcategories((prev) =>
          prev.map((sub) =>
            sub._id === editingSubcategory._id ? updatedSubcategory : sub
          )
        );
        toast.success("Subcategory updated successfully");
        closeEditModal();
      } else {
        const error = await res.json();
        toast.error(error.message || "Failed to update subcategory");
      }
    } catch (error) {
      toast.error("Error updating subcategory");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !subcategories.length) return <p>Loading subcategories...</p>;
  if (!subcategories.length) return <p>No subcategories available.</p>;

  return (
    <div className="space-y-4">
      {subcategories.map((sub) => (
        <div
          key={sub._id}
          className="flex items-center justify-between border p-4 rounded"
        >
          <div className="flex items-center">
            {sub.image && (
              <div className="mr-3">
                <Image
                  src={sub.image}
                  alt={sub.name}
                  width={50}
                  height={50}
                  className="rounded object-cover"
                />
              </div>
            )}
            <div>
              <span className="font-bold">{sub.name}</span>
              {sub.category && typeof sub.category === "object" && (
                <span className="ml-2 text-sm text-gray-600">
                  (Category: {sub.category.name})
                </span>
              )}
              {sub.branch && typeof sub.branch === "object" && (
                <span className="ml-2 text-sm text-gray-600">
                  (Branch: {sub.branch.name})
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => openEditModal(sub)}
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
            >
              Edit
            </button>
            <button
              onClick={() => deleteSubcategory(sub._id)}
              className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Subcategory</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Subcategory Name</label>
                <input
                  type="text"
                  value={subcategoryName}
                  onChange={(e) => setSubcategoryName(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Subcategory Image</label>
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
                      alt="Subcategory preview"
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