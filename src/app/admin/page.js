'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import AdminPortal from '../components/AdminPortal';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    const adminAuth = Cookies.get('adminAuth');
    if (!adminAuth) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleLogout = () => {
    Cookies.remove('adminAuth');
    router.push('/admin/login');
  };

  return <AdminPortal onLogout={handleLogout} />;
}