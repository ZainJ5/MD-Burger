'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import Image from 'next/image';

export default function Login() {
  const router = useRouter();
  const predefinedUsername = "admin";
  const predefinedPassword = "admin123";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [logoData, setLogoData] = useState({
    logo: "/logo.png",
    updatedAt: new Date()
  });
  const [isLogoLoading, setIsLogoLoading] = useState(true);

  useEffect(() => {
    async function getLogoData() {
      setIsLogoLoading(true);
      try {
        const res = await fetch('/api/logo', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setLogoData(data);
        }
      } catch (err) {
        console.error("Failed to fetch logo:", err);
      } finally {
        setIsLogoLoading(false);
      }
    };

    getLogoData();
  }, []);

  // Get timestamp for logo cache busting
  const getLogoTimestamp = () => {
    return logoData?.updatedAt ? new Date(logoData.updatedAt).getTime() : Date.now();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username === predefinedUsername && password === predefinedPassword) {
      Cookies.set('adminAuth', 'true', { expires: 3, path: '/' });
      router.push('/admin');
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center text-black justify-center bg-gradient-to-br from-red-100 via-white to-red-100 p-4">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-md transform transition-all hover:shadow-xl">
        <div className="flex justify-center mb-6">
          {!isLogoLoading && (
            <Image
              src={`${logoData.logo || "/logo.png"}?v=${getLogoTimestamp()}`}
              alt="Restaurant Logo"
              width={120}
              height={120}
              className="object-contain"
            />
          )}
        </div>
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          Admin Portal
        </h2>
        <p className="text-center text-gray-500 mb-8">
          Welcome to Restaurant Admin
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors bg-gray-50"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors bg-gray-50"
            />
          </div>
          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-lg">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Sign In
          </button>
        </form>
        <p className="mt-6 text-center text-gray-500 text-sm">
          Restaurant Admin Dashboard &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}