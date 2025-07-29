"use client";
import { useState, useRef, useEffect } from "react";
import NextImage from "next/image"; 

export default function AddCategoryForm({ branches, addCategory }) {
  const [name, setName] = useState("");
  const [selectedBranchId, setSelectedBranchId] = useState(
    branches[0]?._id || ""
  );
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isValidDimensions, setIsValidDimensions] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const checkImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new window.Image(); 
      img.onload = () => {
        // Check if the aspect ratio is approximately 1500:287
        const aspectRatio = img.width / img.height;
        const targetAspectRatio = 1500 / 287;
        const isValid = Math.abs(aspectRatio - targetAspectRatio) < 0.1; // Allow small tolerance
        setIsValidDimensions(isValid);
        resolve(isValid);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    await checkImageDimensions(file);
    
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedImage(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !selectedBranchId) return;
    if (!selectedImage) {
      alert("Please select a banner image");
      return;
    }
    if (!isValidDimensions) {
      alert("Please use an image with aspect ratio close to 1500:287");
      return;
    }
    
    const formData = new FormData();
    formData.append('name', name.trim());
    formData.append('branch', selectedBranchId);
    formData.append('image', selectedImage);
    
    await addCategory(formData);
    setName("");
    setSelectedBranchId("");
    setSelectedImage(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block font-medium mb-1">Select Branch</label>
        <select
          value={selectedBranchId}
          onChange={(e) => setSelectedBranchId(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="">-- Select Branch --</option>
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1">Category Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border rounded p-2"
          placeholder="Enter category name"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Category Banner (1500x287)</label>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/*"
          className="w-full border rounded p-2"
        />
        <p className="text-xs text-gray-500 mt-1">
          Please upload an image with dimensions 1500x287 pixels or similar ratio
        </p>
      </div>
      
      {previewUrl && (
        <div className="mt-4">
          <p className="font-medium mb-1">Preview:</p>
          <div className="relative w-full h-40 border rounded overflow-hidden">
            <NextImage 
              src={previewUrl} 
              alt="Preview" 
              fill 
              style={{ objectFit: 'cover' }} 
              className={!isValidDimensions ? "border-2 border-red-500" : ""}
            />
          </div>
          {!isValidDimensions && (
            <p className="text-red-500 text-xs mt-1">
              Warning: Image doesn't match the required aspect ratio (1500:287)
            </p>
          )}
        </div>
      )}
      
      <button
        type="submit"
        className="bg-[#ba0000] text-white px-4 py-2 rounded hover:bg-[#cb3939] transition"
        disabled={!isValidDimensions || !selectedImage}
      >
        Add Category
      </button>
    </form>
  );
}