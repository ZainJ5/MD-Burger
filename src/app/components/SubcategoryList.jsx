"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function SubcategoryList() {
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <p>Loading subcategories...</p>;
  if (!subcategories.length) return <p>No subcategories available.</p>;

  return (
    <div className="space-y-4">
      {subcategories.map((sub) => (
        <div
          key={sub._id}
          className="flex items-center justify-between border p-4 rounded"
        >
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
          <button
            onClick={() => deleteSubcategory(sub._id)}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
