"use client";

import { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function NavbarEditor() {
  const [navbarData, setNavbarData] = useState({
    restaurant: {
      name: "Tipu Burger & Broast",
      openingHours: "11:30 am to 3:30 am",
      logo: "/logo.png"
    },
    delivery: {
      time: "30-45 mins",
      minimumOrder: "Rs. 500 Only"
    },
    socialLinks: [
      { platform: "menu", icon: "/download.webp", isMenu: true, menuFile: "/tipu-menu-update-feb-25.pdf" },
      { platform: "whatsapp", icon: "/whatsapp-logo.webp", url: "https://wa.me/923332245706" },
      { platform: "phone", icon: "/phone.webp", url: "tel:+92111822111" },
      { platform: "facebook", icon: "/facebook.webp", url: "https://www.facebook.com/tipuburgerbroast" },
      { platform: "tiktok", icon: "/instagram.png", url: "https://www.tiktok.com/tipuburger" }
    ]
  });

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [socialIconFiles, setSocialIconFiles] = useState({});
  const [socialIconPreviews, setSocialIconPreviews] = useState({});
  const [menuFiles, setMenuFiles] = useState({});
  const [menuFilePreviews, setMenuFilePreviews] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const fetchNavbarData = async () => {
      setIsLoadingData(true);
      try {
        const response = await fetch('/api/navbar');
        if (response.ok) {
          const data = await response.json();

          if (data.socialLinks) {
            data.socialLinks = data.socialLinks.map(link => {
              const cleanedLink = { ...link };

              if (cleanedLink.isMenu) {
                delete cleanedLink.url;
                if (!cleanedLink.menuFile) cleanedLink.menuFile = "";
              } else {
                delete cleanedLink.menuFile;
                if (!cleanedLink.url) cleanedLink.url = "";
              }

              return cleanedLink;
            });
          }

          setNavbarData(data);

          if (data.restaurant?.logo) {
            setLogoPreview(data.restaurant.logo);
          }
        }
      } catch (error) {
        console.error("Error fetching navbar data:", error);
        toast.error("Failed to load navbar information", {
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

    fetchNavbarData();
  }, []);

  const handleInputChange = (section, field, value) => {
    setNavbarData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSocialLinkChange = (index, field, value) => {
    setNavbarData(prev => {
      const updatedLinks = [...prev.socialLinks];
      updatedLinks[index] = { ...updatedLinks[index], [field]: value };
      return {
        ...prev,
        socialLinks: updatedLinks
      };
    });
  };

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

  const handleSocialIconChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      setSocialIconFiles(prev => ({
        ...prev,
        [index]: file
      }));

      const reader = new FileReader();
      reader.onload = () => {
        setSocialIconPreviews(prev => ({
          ...prev,
          [index]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMenuFileChange = (e, index) => {
    const file = e.target.files[0];
    if (file) {
      setMenuFiles(prev => ({
        ...prev,
        [index]: file
      }));

      setMenuFilePreviews(prev => ({
        ...prev,
        [index]: file.name
      }));

      setNavbarData(prev => {
        const updatedLinks = [...prev.socialLinks];
        updatedLinks[index] = {
          ...updatedLinks[index],
          isMenu: true,
          url: undefined
        };
        return {
          ...prev,
          socialLinks: updatedLinks
        };
      });
    }
  };

  const addSocialLink = () => {
    setNavbarData(prev => ({
      ...prev,
      socialLinks: [
        ...prev.socialLinks,
        { platform: "", icon: "", isMenu: false, url: "" }
      ]
    }));
  };

  const removeSocialLink = (index) => {
    setNavbarData(prev => {
      const updatedLinks = [...prev.socialLinks];
      updatedLinks.splice(index, 1);
      return {
        ...prev,
        socialLinks: updatedLinks
      };
    });

    if (socialIconFiles[index]) {
      const updatedFiles = { ...socialIconFiles };
      delete updatedFiles[index];
      setSocialIconFiles(updatedFiles);

      const updatedPreviews = { ...socialIconPreviews };
      delete updatedPreviews[index];
      setSocialIconPreviews(updatedPreviews);
    }

    if (menuFiles[index]) {
      const updatedFiles = { ...menuFiles };
      delete updatedFiles[index];
      setMenuFiles(updatedFiles);

      const updatedPreviews = { ...menuFilePreviews };
      delete updatedPreviews[index];
      setMenuFilePreviews(updatedPreviews);
    }
  };

  const toggleMenuType = (index) => {
    setNavbarData(prev => {
      const updatedLinks = [...prev.socialLinks];
      const currentLink = { ...updatedLinks[index] };

      currentLink.isMenu = !currentLink.isMenu;

      if (currentLink.isMenu) {
        currentLink.url = undefined;
        if (!currentLink.menuFile) currentLink.menuFile = "";
      } else {
        currentLink.menuFile = undefined;
        if (!currentLink.url) currentLink.url = "";
      }

      updatedLinks[index] = currentLink;

      return {
        ...prev,
        socialLinks: updatedLinks
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const cleanedData = { ...navbarData };
      cleanedData.socialLinks = cleanedData.socialLinks.map(link => {
        const cleanedLink = { ...link };

        if (cleanedLink.isMenu) {
          delete cleanedLink.url;
        } else {
          delete cleanedLink.menuFile;
        }

        return cleanedLink;
      });

      const formData = new FormData();

      formData.append('navbarData', JSON.stringify(cleanedData));

      if (logoFile) {
        formData.append('logo', logoFile);
      }

      Object.entries(socialIconFiles).forEach(([index, file]) => {
        formData.append('socialIcons', file);
        formData.append('socialIconIndexes', index);
      });

      Object.entries(menuFiles).forEach(([index, file]) => {
        formData.append('menuFiles', file);
        formData.append('menuIndexes', index);
      });

      const response = await fetch('/api/navbar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const updatedData = await response.json();

        if (updatedData.socialLinks) {
          updatedData.socialLinks = updatedData.socialLinks.map(link => {
            const cleanedLink = { ...link };

            if (cleanedLink.isMenu) {
              delete cleanedLink.url;
            } else {
              delete cleanedLink.menuFile;
            }

            return cleanedLink;
          });
        }

        setNavbarData(updatedData);

        setLogoFile(null);
        setSocialIconFiles({});
        setSocialIconPreviews({});
        setMenuFiles({});
        setMenuFilePreviews({});

        toast.success("Navbar information updated successfully!", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update navbar");
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
          <p className="mt-4 text-gray-600">Loading navbar information...</p>
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
        <h2 className="text-xl font-bold text-gray-800">Navbar Editor</h2>
        <p className="text-gray-500 mt-1">Customize the top navigation bar of your website</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-700">Restaurant Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
              <input
                type="text"
                value={navbarData.restaurant.name}
                onChange={(e) => handleInputChange('restaurant', 'name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label>
              <input
                type="text"
                value={navbarData.restaurant.openingHours}
                onChange={(e) => handleInputChange('restaurant', 'openingHours', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Logo</label>
            <div className="flex items-center space-x-4">
              {(logoPreview || navbarData.restaurant.logo) && (
                <div className="relative h-20 w-20 border rounded-full overflow-hidden">
                  <img
                    src={logoPreview || navbarData.restaurant.logo}
                    alt="Restaurant logo"
                    className="w-full h-full object-cover"
                  />

                </div>
              )}
              <input
                type="file"
                onChange={handleLogoChange}
                accept="image/png,image/jpeg,image/gif"
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-700">Delivery Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
              <input
                type="text"
                value={navbarData.delivery.time}
                onChange={(e) => handleInputChange('delivery', 'time', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order</label>
              <input
                type="text"
                value={navbarData.delivery.minimumOrder}
                onChange={(e) => handleInputChange('delivery', 'minimumOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-700">Social Links & Menu</h3>
            <button
              type="button"
              onClick={addSocialLink}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
            >
              Add Link
            </button>
          </div>

          {navbarData.socialLinks.map((link, index) => (
            <div key={index} className="p-4 border border-gray-200 rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700">
                  {link.isMenu ? "Menu Item" : "Social Link"} #{index + 1}
                </h4>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => toggleMenuType(index)}
                    className={`px-2 py-1 text-xs font-medium rounded ${link.isMenu
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {link.isMenu ? "Menu Item" : "Social Link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSocialLink(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform Name</label>
                  <input
                    type="text"
                    value={link.platform || ""}
                    onChange={(e) => handleSocialLinkChange(index, 'platform', e.target.value)}
                    placeholder="e.g. facebook, whatsapp, menu"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {link.isMenu ? "Menu PDF" : "URL"}
                  </label>
                  {link.isMenu ? (
                    <div className="flex items-center">
                      <div className="flex-grow">
                        <input
                          type="file"
                          onChange={(e) => handleMenuFileChange(e, index)}
                          accept="application/pdf"
                          className="w-full text-sm file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                        />
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={link.url || ""}
                      onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      required={!link.isMenu}
                    />
                  )}
                </div>
              </div>

              {link.isMenu && link.menuFile && (
                <div className="flex items-center text-sm text-gray-600 mt-1 ml-2">
                  <span>Current file: </span>
                  <a
                    href={link.menuFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:underline truncate max-w-xs"
                  >
                    {menuFilePreviews[index] || link.menuFile.split('/').pop()}
                  </a>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icon Image</label>
                <div className="flex items-center space-x-2">
                  {(socialIconPreviews[index] || link.icon) && (
                    <div className="relative h-8 w-8 border rounded overflow-hidden">
                      <img
                        src={socialIconPreviews[index] || link.icon}
                        alt={`${link.platform} icon`}
                        className="w-full h-full object-contain"
                      />

                    </div>
                  )}
                  <input
                    type="file"
                    onChange={(e) => handleSocialIconChange(e, index)}
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    className="flex-1 text-sm file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                  />
                </div>
              </div>
            </div>
          ))}

          {navbarData.socialLinks.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <p className="text-gray-500">No social links or menu items added yet.</p>
            </div>
          )}
        </div>

        <div className="pt-5 border-t border-gray-200">
          <button
            type="submit"
            disabled={isLoading}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${isLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}