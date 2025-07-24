"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function CategoryList() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      console.log("Fetched categories:", data); 
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

  if (loading) return <p>Loading categories...</p>;
  if (!categories.length) return <p>No categories available.</p>;

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat._id} className="flex items-center justify-between border p-4 rounded">
          <div>
            <span className="font-bold">{cat.name}</span>
            {cat.branch && typeof cat.branch === "object" && (
              <span className="ml-2 text-sm text-gray-600">
                (Branch: {cat.branch.name})
              </span>
            )}
          </div>
          <button
            onClick={() => deleteCategory(cat._id)}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
