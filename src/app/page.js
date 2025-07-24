"use client";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/NavBar";
import Hero from "./components/Hero";
import StickyCartButton from "./components/CartButton";
import MenuTabs from "./components/MenuTabs";
import SuperDeals from "./components/SuperDeals";
import Footer from "./components/Footer";
import Banner from "./components/Banner";
import SearchBar from "./components/SearchBar";
import DeliveryPickupModal from "./components/DeliveryPickupModal";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleWhatsAppClick = () => {
    window.open(
      "https://wa.me/923463332682",
      "_blank"
    );
  };

  return (
    <>
      <DeliveryPickupModal />

      <main className="min-h-screen bg-white text-black relative pb-20 sm:pb-0">
        <StickyCartButton className="fixed" />
        <Hero />
        <Navbar />
        <MenuTabs />
        <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <Banner />
        <SuperDeals searchQuery={searchQuery} />
        <Footer />

        <div className="fixed bottom-24 sm:bottom-6 right-6 z-[101]">
          <button
            onClick={handleWhatsAppClick}
            className="w-16 h-16 bg-[rgb(42,168,26)] rounded-full shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow"
            aria-label="WhatsApp"
          >
            <img
              src="/whatsapp.png"
              alt="WhatsApp"
              className="w-10 h-10 object-contain"
            />
          </button>
        </div>
      </main>

      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
}