"use client";

import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function FooterEditor() {
  const [footerContent, setFooterContent] = useState({
    restaurant: {
      name: "",
      address: "",
      description: "",
      establishedYear: new Date().getFullYear(),
      mapsLink: ""
    },
    contact: {
      uanNumber: "",
      whatsappNumbers: [],
      openingHours: ""
    },
    appLinks: {
      appStore: "",
      googlePlay: ""
    },
    developer: {
      name: "",
      contact: ""
    },
    sliderImages: [],
    updatedAt: new Date()
  });
  
  const [activeSection, setActiveSection] = useState('restaurant');
  const [sliderImageFiles, setSliderImageFiles] = useState([]);
  const [newSliderPreviews, setNewSliderPreviews] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newWhatsappNumber, setNewWhatsappNumber] = useState("");
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  useEffect(() => {
    const fetchFooterData = async () => {
      setIsLoadingData(true);
      try {
        const response = await fetch('/api/footer');
        if (response.ok) {
          const data = await response.json();
          setFooterContent(data);
        }
      } catch (error) {
        console.error("Error fetching footer data:", error);
        toast.error("Failed to load footer information", {
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
    
    fetchFooterData();
  }, []);

  const handleInputChange = (section, field, value) => {
    setFooterContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSliderImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSliderImageFiles(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(newPreviews).then(results => {
        setNewSliderPreviews(prev => [...prev, ...results]);
      });
    }
  };

  const removeNewSliderImage = (index) => {
    const newPreviews = [...newSliderPreviews];
    newPreviews.splice(index, 1);
    setNewSliderPreviews(newPreviews);
    
    const newFiles = [...sliderImageFiles];
    newFiles.splice(index, 1);
    setSliderImageFiles(newFiles);
  };

  const deleteExistingSliderImage = async (imagePath, index) => {
    setIsDeletingImage(true);
    try {
      const response = await fetch('/api/footer', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imagePath })
      });

      if (response.ok) {
        const updatedData = await response.json();
        setFooterContent(updatedData);
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
  };

  const addWhatsappNumber = () => {
    if (newWhatsappNumber.trim()) {
      setFooterContent(prev => ({
        ...prev,
        contact: {
          ...prev.contact,
          whatsappNumbers: [...prev.contact.whatsappNumbers, newWhatsappNumber]
        }
      }));
      setNewWhatsappNumber("");
    }
  };

  const removeWhatsappNumber = (index) => {
    const updatedNumbers = [...footerContent.contact.whatsappNumbers];
    updatedNumbers.splice(index, 1);
    handleInputChange('contact', 'whatsappNumbers', updatedNumbers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      
      formData.append('footerData', JSON.stringify(footerContent));
      
      sliderImageFiles.forEach(file => {
        formData.append('sliderImages', file);
      });
      
      const response = await fetch('/api/footer', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const updatedData = await response.json();
        
        setFooterContent(updatedData);
        
        setSliderImageFiles([]);
        setNewSliderPreviews([]);
        
        toast.success("Footer information updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update footer");
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
          <p className="mt-4 text-gray-600">Loading footer information...</p>
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
        <h2 className="text-xl font-bold text-gray-800">Footer Editor</h2>
        <p className="text-gray-500 mt-1">Customize the footer section of your website</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="flex overflow-x-auto space-x-4 mb-6 py-1">
          <button
            type="button"
            onClick={() => setActiveSection('restaurant')}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeSection === 'restaurant' ? 'bg-red-50 text-red-700 shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Restaurant Info
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('contact')}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeSection === 'contact' ? 'bg-red-50 text-red-700 shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Contact Details
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('appLinks')}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeSection === 'appLinks' ? 'bg-red-50 text-red-700 shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            App Links
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('developer')}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeSection === 'developer' ? 'bg-red-50 text-red-700 shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Developer Info
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('sliderImages')}
            className={`px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-all ${
              activeSection === 'sliderImages' ? 'bg-red-50 text-red-700 shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Slider Images
          </button>
        </div>
        
        <div className="w-full space-y-6">
          {activeSection === 'restaurant' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                <input 
                  type="text" 
                  value={footerContent.restaurant.name}
                  onChange={(e) => handleInputChange('restaurant', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input 
                  type="text" 
                  value={footerContent.restaurant.address}
                  onChange={(e) => handleInputChange('restaurant', 'address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  rows={4}
                  value={footerContent.restaurant.description}
                  onChange={(e) => handleInputChange('restaurant', 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Established Year</label>
                <input 
                  type="number" 
                  value={footerContent.restaurant.establishedYear}
                  onChange={(e) => handleInputChange('restaurant', 'establishedYear', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Maps Link</label>
                <input 
                  type="url" 
                  value={footerContent.restaurant.mapsLink}
                  onChange={(e) => handleInputChange('restaurant', 'mapsLink', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            </div>
          )}
          
          {activeSection === 'contact' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UAN Number</label>
                <input 
                  type="text" 
                  value={footerContent.contact.uanNumber}
                  onChange={(e) => handleInputChange('contact', 'uanNumber', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">WhatsApp Numbers</label>
                </div>
                <div className="space-y-2">
                  {footerContent.contact.whatsappNumbers.map((number, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input 
                        type="text" 
                        value={number}
                        onChange={(e) => {
                          const newNumbers = [...footerContent.contact.whatsappNumbers];
                          newNumbers[index] = e.target.value;
                          handleInputChange('contact', 'whatsappNumbers', newNumbers);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeWhatsappNumber(index)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2 mt-2">
                    <input 
                      type="text" 
                      value={newWhatsappNumber}
                      onChange={(e) => setNewWhatsappNumber(e.target.value)}
                      placeholder="Add new WhatsApp number"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={addWhatsappNumber}
                      className="inline-flex items-center p-2 border border-transparent rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label>
                <input 
                  type="text" 
                  value={footerContent.contact.openingHours}
                  onChange={(e) => handleInputChange('contact', 'openingHours', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                  placeholder="e.g. Monday - Friday: 9:00 AM - 10:00 PM"
                />
              </div>
            </div>
          )}
          
          {activeSection === 'appLinks' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">App Store Link</label>
                <input 
                  type="url" 
                  value={footerContent.appLinks.appStore}
                  onChange={(e) => handleInputChange('appLinks', 'appStore', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Play Store Link</label>
                <input 
                  type="url" 
                  value={footerContent.appLinks.googlePlay}
                  onChange={(e) => handleInputChange('appLinks', 'googlePlay', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                />
              </div>
            </div>
          )}
          
          {activeSection === 'developer' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Developer Name</label>
                <input 
                  type="text" 
                  value={footerContent.developer.name}
                  onChange={(e) => handleInputChange('developer', 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Developer Contact</label>
                <input 
                  type="text" 
                  value={footerContent.developer.contact}
                  onChange={(e) => handleInputChange('developer', 'contact', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          )}
          
          {activeSection === 'sliderImages' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Slider Images</label>
                <input 
                  type="file" 
                  onChange={handleSliderImageChange}
                  accept="image/png,image/jpeg,image/gif"
                  multiple
                  className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                />
              </div>
              
              {newSliderPreviews.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">New Images (To Be Uploaded)</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                    {newSliderPreviews.map((image, index) => (
                      <div key={`new-${index}`} className="relative h-32 border rounded-md overflow-hidden group">
                        <img 
                          src={image} 
                          alt={`New slider image ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => removeNewSliderImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {footerContent.sliderImages && footerContent.sliderImages.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Slider Images</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-2">
                    {footerContent.sliderImages.map((imagePath, index) => (
                      <div key={`existing-${index}`} className="relative h-32 border rounded-md overflow-hidden group">
                        <img 
                          src={`${imagePath}?v=${new Date(footerContent.updatedAt).getTime()}`} 
                          alt={`Footer slider image ${index + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => deleteExistingSliderImage(imagePath, index)}
                          disabled={isDeletingImage}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {footerContent.sliderImages?.length === 0 && newSliderPreviews.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <p className="text-gray-500">No slider images yet. Upload some images to display in the footer.</p>
                </div>
              )}
            </div>
          )}
          
          <div className="pt-5 mt-6 border-t border-gray-200">
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
        </div>
      </form>
    </div>
  );
}