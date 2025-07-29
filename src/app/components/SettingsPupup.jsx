"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import HeroEditor from "./settings/HeroEditor";
import FooterEditor from "./settings/FooterEditor";
import NavbarEditor from "./settings/NavbarEditor";

export default function SettingsPopup({ isOpen, onClose }) {
  const popupRef = useRef(null);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const contentSections = [
    { id: "hero", label: "Hero Section", icon: "layout" },
    { id: "navbar", label: "NavBar Details", icon: "menu" },
    { id: "footer", label: "Footer", icon: "menu" }
  ];

  const renderContentEditor = () => {
    switch (activeSection) {
      case "hero":
        return <HeroEditor />;
      case "navbar":
        return <NavbarEditor />;
      case "footer":
        return <FooterEditor />;
      default:
        return <div className="p-8 text-center text-gray-500 font-medium">Select a section to edit</div>;
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black bg-opacity-40 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <motion.div 
          ref={popupRef}
          className="bg-white rounded-3xl shadow-xl w-full max-w-6xl max-h-[85vh] overflow-hidden flex flex-col"
          initial={{ scale: 0.95, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 30, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 250 }}
        >
          <div className="bg-gradient-to-r from-[#ba0000] to-[#930000] text-white px-8 py-5 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <h2 className="text-xl font-semibold tracking-tight">Content Editor</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-red-800 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
              aria-label="Close editor"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            <div className="w-full md:w-60 bg-gray-50 border-r border-gray-200 p-5">
              <div className="mb-6">
                <h3 className="text-xs uppercase tracking-widest text-gray-500 font-medium mb-4 px-3">Content Sections</h3>
                <div className="flex flex-col space-y-1.5">
                  {contentSections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                        activeSection === section.id 
                          ? "bg-red-50 text-red-700 font-medium shadow-sm border-l-4 border-red-600" 
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <span className={`w-5 h-5 flex items-center justify-center ${activeSection === section.id ? "text-red-600" : "text-gray-500"}`}>
                        {getIcon(section.icon)}
                      </span>
                      <span className="text-sm font-medium">{section.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-white">
              {renderContentEditor()}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function getIcon(name) {
  switch (name) {
    case "layout":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      );
    case "menu":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      );
    default:
      return null;
  }
}