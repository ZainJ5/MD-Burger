"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoLoading, setIsLogoLoading] = useState(true);
  const [navbarData, setNavbarData] = useState({
    restaurant: {
      name: "MD Burger & Broast",
      openingHours: "05:00 PM to 3:00 AM"
    },
    delivery: {
      time: "30-45 mins",
      minimumOrder: "Rs. 500 Only"
    },
    socialLinks: [],
    updatedAt: new Date()
  });
  const [logoData, setLogoData] = useState({
    logo: "/logo.png",
    updatedAt: new Date()
  });

  useEffect(() => {
    async function getNavbarData() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/navbar");
        if (res.ok) {
          const data = await res.json();
          setNavbarData(data);
        }
      } catch (error) {
        console.error("Error fetching navbar data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    getNavbarData();
  }, []);

  useEffect(() => {
    async function getLogoData() {
      setIsLogoLoading(true);
      try {
        const res = await fetch("/api/logo");
        if (res.ok) {
          const data = await res.json();
          setLogoData(data);
        }
      } catch (error) {
        console.error("Error fetching logo data:", error);
      } finally {
        setIsLogoLoading(false);
      }
    }
    getLogoData();
  }, []);

  const getLogoTimestamp = () => {
    return logoData?.updatedAt ? new Date(logoData.updatedAt).getTime() : Date.now();
  };

  const getNavbarTimestamp = () => {
    return navbarData?.updatedAt ? new Date(navbarData.updatedAt).getTime() : Date.now();
  };

  const socialItems = isLoading || !navbarData.socialLinks || navbarData.socialLinks.length === 0
    ? []
    : navbarData.socialLinks
      .filter(link => {
        if (link.isMenu) return !!link.menuFile;
        return !!link.url;
      })
      .map(link => ({
        src: link.icon || "/download.webp",
        href: link.isMenu ? link.menuFile : link.url,
        isMenu: link.isMenu,
        platform: link.platform
      }));

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-16">
      <div className="py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row sm:flex-wrap justify-between items-center gap-4 sm:gap-6">
          <div className="flex flex-col text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl pt-4 md:text-3xl font-bold mb-1 sm:mb-2">
              {navbarData.restaurant.name}
            </h1>
            <div className="flex flex-col gap-1.5">
              <div className="text-brand-600 text-xs sm:text-sm md:text-base">
                <span>Open: </span>
                <span className="font-normal text-black">
                  {navbarData.restaurant.openingHours}
                </span>
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <div className="bg-white rounded-md px-3 py-2 sm:px-4 sm:py-3 md:px-6 md:py-3 shadow-md">
              <div className="grid grid-cols-2 sm:flex sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-col items-center">
                  <span className="text-black font-semibold text-sm sm:text-base">
                    {navbarData.delivery.time}
                  </span>
                  <span className="text-gray-600 text-[11px] sm:text-xs">
                    Delivery Time
                  </span>
                </div>
                <div className="hidden sm:block w-px h-8 bg-gray-300"></div>
                <div className="flex flex-col items-center">
                  <span className="text-black font-semibold text-sm sm:text-base">
                    {navbarData.delivery.minimumOrder}
                  </span>
                  <span className="text-gray-600 text-[11px] sm:text-xs">
                    Minimum Order
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-start gap-2">
            {socialItems.map((item, index) => {
              if (item.isMenu) {
                return (
                  <a
                    key={index}
                    href={`${item.href}?v=${getNavbarTimestamp()}`}
                    download={`${item.platform || 'menu'}.pdf`}
                    className="rounded-[9px] relative hover:opacity-90 transition-opacity w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
                  >
                    <img
                      src={`${item.src}?v=${getNavbarTimestamp()}`}
                      alt="Download Menu"
                      className="w-full h-full object-contain rounded-[7px]"
                    />
                  </a>
                );
              }

              return (
                <Link
                  key={index}
                  href={item.href || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded relative hover:opacity-90 transition-opacity w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center"
                >
                  <img
                    src={`${item.src}?v=${getNavbarTimestamp()}`}
                    alt={`${item.platform} icon`}
                    className="w-full h-full object-contain"
                  />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}