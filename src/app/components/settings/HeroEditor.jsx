"use client";

import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";

export default function HeroEditor() {
  const [heroData, setHeroData] = useState({
    banners: ['Welcome to Tipu Burger & Broast', 'Flat 10% Off on all Items', 'Discover Our Special Dishes'],
    images: [],
    settings: {
      bannerRotationSpeed: 3000,
      imageRotationSpeed: 5000
    }
  });
  
  const [newBanner, setNewBanner] = useState("");
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  // Fetch current hero data on component mount
  useEffect(() => {
    const fetchHeroData = async () => {
      setIsLoadingData(true);
      try {
        const response = await fetch('/api/hero');
        if (response.ok) {
          const data = await response.json();
          setHeroData(data);
          
          // Set image previews from existing images
          if (data.images && data.images.length > 0) {
            setImagePreviews(data.images);
          }
        }
      } catch (error) {
        console.error("Error fetching hero data:", error);
        toast.error("Failed to load hero section information", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    
    fetchHeroData();
  }, []);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setNewImageFiles(prev => [...prev, ...files]);
      
      // Generate previews for new files
      const newPreviews = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(newPreviews).then(results => {
        setImagePreviews(prev => [...prev, ...results]);
      });
    }
  };

  const removeImage = async (index, isExisting = false) => {
    if (isExisting) {
      // This is an existing image from the database
      const imagePath = heroData.images[index];
      setIsDeletingImage(true);
      
      try {
        const response = await fetch('/api/hero', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imagePath })
        });

        if (response.ok) {
          // Update state
          setHeroData(prev => {
            const updatedImages = [...prev.images];
            updatedImages.splice(index, 1);
            return {
              ...prev,
              images: updatedImages
            };
          });
          
          // Update previews
          setImagePreviews(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
          });
          
          toast.success("Image deleted successfully", {
            position: "top-right",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          });
        } else {
          throw new Error("Failed to delete image");
        }
      } catch (error) {
        console.error("Error deleting image:", error);
        toast.error(error.message || "Failed to delete image", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setIsDeletingImage(false);
      }
    } else {
      // This is a new image being uploaded
      setNewImageFiles(prev => {
        const updated = [...prev];
        updated.splice(index - heroData.images.length, 1);
        return updated;
      });
      
      setImagePreviews(prev => {
        const updated = [...prev];
        updated.splice(index, 1);
        return updated;
      });
    }
  };

  const addBanner = () => {
    if (newBanner.trim()) {
      setHeroData(prev => ({
        ...prev,
        banners: [...prev.banners, newBanner]
      }));
      setNewBanner("");
    }
  };

  const removeBanner = (index) => {
    setHeroData(prev => {
      const updatedBanners = [...prev.banners];
      updatedBanners.splice(index, 1);
      return {
        ...prev,
        banners: updatedBanners
      };
    });
  };

  const handleSettingChange = (setting, value) => {
    setHeroData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [setting]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      
      // Append hero data as JSON
      formData.append('heroData', JSON.stringify(heroData));
      
      // Append new images if any
      newImageFiles.forEach(file => {
        formData.append('images', file);
      });
      
      // Make API request
      const response = await fetch('/api/hero', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const updatedData = await response.json();
        
        // Update state with response data
        setHeroData(updatedData);
        setImagePreviews(updatedData.images);
        
        // Reset file states
        setNewImageFiles([]);
        
        toast.success("Hero section updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update hero section");
      }
    } catch (error) {
      toast.error(error.message || "An error occurred while saving", {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hero section information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Add ToastContainer for react-toastify */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        toastStyle={{ 
          backgroundColor: "#fff", 
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          borderRadius: "8px"
        }}
        progressStyle={{ backgroundColor: "#ef4444" }}
      />
      
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-800">Hero Section Editor</h2>
        <p className="text-gray-500 mt-1">Customize the hero banners and slider images</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Banner Messages */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">Banner Messages</h3>
          <p className="text-sm text-gray-500">These messages will rotate at the top of your page</p>
          
          <div className="space-y-2">
            {heroData.banners.map((banner, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input 
                  type="text" 
                  value={banner}
                  onChange={(e) => {
                    const updatedBanners = [...heroData.banners];
                    updatedBanners[index] = e.target.value;
                    setHeroData(prev => ({ ...prev, banners: updatedBanners }));
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <button
                  type="button"
                  onClick={() => removeBanner(index)}
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <div className="flex items-center space-x-2 mt-4">
              <input 
                type="text" 
                value={newBanner}
                onChange={(e) => setNewBanner(e.target.value)}
                placeholder="Enter new banner message"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <button
                type="button"
                onClick={addBanner}
                className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Hero Images */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">Hero Slider Images</h3>
          <p className="text-sm text-gray-500">Upload images for the main slider (recommended aspect ratio: 3:1)</p>
          
          <div>
            <input 
              type="file" 
              onChange={handleImageChange}
              accept="image/png,image/jpeg,image/gif,image/webp"
              multiple
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {imagePreviews.map((image, index) => (
              <div key={index} className="relative rounded-md overflow-hidden group">
                <div className="relative aspect-[3/1] w-full bg-gray-100">
                  <Image 
                    src={image} 
                    alt={`Hero image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index, index < heroData.images.length)}
                  disabled={isDeletingImage}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          
          {imagePreviews.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No hero images uploaded yet. Add images to create a slider.</p>
            </div>
          )}
        </div>
        
        {/* Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-700">Animation Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Banner Rotation Speed (ms)</label>
              <input 
                type="number" 
                min="1000"
                max="10000"
                step="500"
                value={heroData.settings.bannerRotationSpeed}
                onChange={(e) => handleSettingChange('bannerRotationSpeed', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="mt-1 text-xs text-gray-500">How quickly the banner messages change (in milliseconds)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image Rotation Speed (ms)</label>
              <input 
                type="number"
                min="2000" 
                max="15000"
                step="1000"
                value={heroData.settings.imageRotationSpeed}
                onChange={(e) => handleSettingChange('imageRotationSpeed', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="mt-1 text-xs text-gray-500">How quickly the hero images change (in milliseconds)</p>
            </div>
          </div>
        </div>
        
        <div className="pt-5 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}