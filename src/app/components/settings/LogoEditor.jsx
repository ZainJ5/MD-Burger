"use client";

import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function LogoEditor() {
  const [logoData, setLogoData] = useState({
    logo: "/logo.png",
    updatedAt: new Date()
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchLogoData = async () => {
      setIsLoadingData(true);
      try {
        const response = await fetch('/api/logo');
        if (response.ok) {
          const data = await response.json();
          setLogoData(data);
          setLogoPreview(data.logo);
        }
      } catch (error) {
        console.error("Error fetching logo data:", error);
        toast.error("Failed to load logo information", {
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
    
    fetchLogoData();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!logoFile) {
      toast.info("Please select a logo image to update", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await fetch('/api/logo', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const updatedData = await response.json();
        setLogoData(updatedData);
        
        toast.success("Logo updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
        
        setLogoFile(null);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update logo");
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

  const getTimestamp = () => {
    return logoData?.updatedAt ? new Date(logoData.updatedAt).getTime() : Date.now();
  };

  if (isLoadingData) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading logo information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
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
        <h2 className="text-xl font-bold text-gray-800">Logo Editor</h2>
        <p className="text-gray-500 mt-1">Update your restaurant's logo</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-gray-50 p-8 rounded-lg border border-gray-200 flex flex-col items-center">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Current Logo</h3>
              <div className="relative h-40 w-40 border rounded-md overflow-hidden bg-white shadow-sm">
                <img
                  src={`${logoPreview || logoData.logo}?v=${getTimestamp()}`}
                  alt="Restaurant logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload New Logo</label>
            <div className="flex flex-col space-y-4">
              <input
                type="file"
                onChange={handleLogoChange}
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
              <p className="text-xs text-gray-500">
                Recommended size: 200x200 pixels. Supported formats: PNG, JPEG, GIF, WEBP, SVG
              </p>
            </div>
          </div>
        </div>
        
        <div className="pt-5 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading || !logoFile}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
              isLoading || !logoFile ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}