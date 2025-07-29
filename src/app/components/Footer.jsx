'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

export default function Footer() {
  const [footerData, setFooterData] = useState({
    restaurant: {
      name: "Tipu Burger & Broast",
      logo: "/logo.png",
      address: "Clifton Center، Shop No 1, Clifton Shopping Arcade، Bank Road, Block 5 Clifton, Karachi, 75600",
      description: "The best food in Town! Established in 1993. At the time of opening we started with the bun kabab's but now we have opened the complete FAST FOOD and BAR-B-Q. Just all pure are being used here.",
      establishedYear: 1993,
      mapsLink: "https://maps.app.goo.gl/iLFtzPRK4iR1Yc9P9"
    },
    contact: {
      uanNumber: "021 - 111 822 111",
      whatsappNumbers: ["0333 2245706", "0346 3332682"],
      openingHours: "11:30 am to 3:30 am"
    },
    appLinks: {
      appStore: "https://restaurant-website-pi-rouge.vercel.app/",
      googlePlay: "https://restaurant-website-pi-rouge.vercel.app/"
    },
    developer: {
      name: "ZABS Creatives",
      contact: "923142300331"
    },
    sliderImages: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const response = await fetch('/api/footer');
        if (response.ok) {
          const data = await response.json();
          setFooterData(data);
        } else {
          console.error("Failed to fetch footer data");
        }
      } catch (error) {
        console.error("Error fetching footer data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFooterData();
  }, []);

  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8 relative">
        <Link href="/">
          <div className="relative rounded-full border-4 border-yellow-400 w-32 h-32  bg-white left-1/2 top-[0px] transform -translate-x-1/2 -translate-y-1/2 z-10 overflow-hidden">
            <img 
              src={footerData.restaurant.logo || "/logo.png"} 
              alt={footerData.restaurant.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
        </Link>

        <div className="text-center mt-[-50px]">
          <h2 className="text-2xl font-bold">{footerData.restaurant.name}</h2>

          <p className="mt-2">
            <Link
              href={footerData.restaurant.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {footerData.restaurant.address}
            </Link>
          </p>

          <p className="mt-4 text-gray-900 max-w-2xl mx-auto">
            {footerData.restaurant.description}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-12">
            <div>
              <h3 className="font-semibold">UAN Number</h3>
              <p>
                <a href={`tel:${footerData.contact.uanNumber}`} className="font-bold text-black hover:underline">
                  {footerData.contact.uanNumber}
                </a>
              </p>
            </div>

            <div className="sm:border-x sm:px-8 sm:border-x-gray-500">
              <h3 className="font-semibold">WhatsApp</h3>
              <div className="flex items-center space-x-1">
                {footerData.contact.whatsappNumbers.length > 0 && (
                  <a
                    href={`https://wa.me/${footerData.contact.whatsappNumbers[0].replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-black hover:underline"
                  >
                    {footerData.contact.whatsappNumbers[0]}
                  </a>
                )}
                {footerData.contact.whatsappNumbers.length > 1 && (
                  <>
                    <span>/</span>
                    <a
                      href={`https://wa.me/${footerData.contact.whatsappNumbers[1].replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-black hover:underline"
                    >
                      {footerData.contact.whatsappNumbers[1]}
                    </a>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Timing</h3>
              <p className="font-bold text-black">{footerData.contact.openingHours}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <Swiper
          spaceBetween={0}
          slidesPerView={2}
          breakpoints={{
            768: {
              slidesPerView: 4,
            },
          }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            pauseOnMouseEnter: false,
          }}
          loop={true}
          loopAdditionalSlides={4}
          modules={[Autoplay]}
          speed={1000}
          allowTouchMove={true}
        >
          {footerData.sliderImages && footerData.sliderImages.length > 0 ? (
            footerData.sliderImages.map((image, index) => (
              <SwiperSlide key={`api-${index}`}>
                <div className="relative w-full h-58 object-cover">
                  <img src={image} alt={`Image ${index+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </SwiperSlide>
            ))
          ) : (
            Array.from({ length: 17 }, (_, i) => i + 1)
              .filter((num) => num !== 4)
              .map((num) => (
                <SwiperSlide key={`static-${num}`}>
                  <div className="relative w-full h-58 object-cover">
                    <img src={`/${num}.webp`} alt={`Image ${num}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                </SwiperSlide>
              ))
          )}
        </Swiper>
      </div>

      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center py-12 sm:px-6 lg:px-8 text-center space-y-8 sm:space-y-0">
        <h3 className="text-3xl pl-8 font-bold">Download Our App!</h3>

        <div className="flex justify-center space-x-4">
          <Link
            href={footerData.appLinks.appStore}
            target="_blank"
            rel="noopener noreferrer"
            title="Download on the App Store"
            className="relative inline-block m-[5px] pt-[15px] pr-[16px] pb-[5px] pl-[40px] text-lg leading-[1.33] rounded-md whitespace-nowrap cursor-pointer select-none border border-black font-semibold bg-[#111] text-white no-underline hover:bg-[#2c2b2b] focus:bg-[#555] active:bg-[#555] focus:outline-none"
          >
            <span
              className="absolute left-[6px] top-1/2 -translate-y-1/2 w-[30px] h-[30px] bg-cover bg-no-repeat"
              style={{ backgroundImage: "url('/apple.png')" }}
            ></span>
            <span className="absolute top-[5px] left-[40px] text-[10px] font-normal">
              Download on the
            </span>
            App Store
          </Link>

          <Link
            href={footerData.appLinks.googlePlay}
            target="_blank"
            rel="noopener noreferrer"
            title="Google Play"
            className="relative inline-block m-[5px] pt-[15px] pr-[16px] pb-[5px] pl-[40px] text-lg leading-[1.33] rounded-md whitespace-nowrap cursor-pointer select-none border border-black font-semibold bg-[#111] text-white no-underline hover:bg-[#2c2b2b] focus:bg-[#555] active:bg-[#555] focus:outline-none"
          >
            <span
              className="absolute left-[6px] top-1/2 -translate-y-1/2 w-[30px] h-[30px] bg-cover bg-no-repeat"
              style={{
                backgroundImage:
                  "url('https://4.bp.blogspot.com/-52U3eP2JDM4/WSkIT1vbUxI/AAAAAAAArQA/iF1BeARv2To-2FGQU7V6UbNPivuv_lccACLcB/s30/nexus2cee_ic_launcher_play_store_new-1.png')",
              }}
            ></span>
            <span className="absolute top-[5px] left-[40px] text-[10px] font-normal">
              GET IT ON
            </span>
            Google Play
          </Link>
        </div>
      </div>

      <div className="bg-[rgb(76,76,76)] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between text-sm text-white space-y-4 sm:space-y-0">
            <p>
              © {new Date().getFullYear()} {footerData.restaurant.name}. All Rights Reserved. Develop by{" "}
              <a
                href={`https://wa.me/${footerData.developer.contact?.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {footerData.developer.name}
              </a>
            </p>
            <div className="space-x-4">
              <Link href="/terms" className="hover:underline">
                Terms &amp; Conditions
              </Link>
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/refund-policy" className="hover:underline">
                Returns &amp; Refund
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}