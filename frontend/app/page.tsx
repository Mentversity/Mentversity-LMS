'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';
import { Inter, Manrope, Nunito_Sans } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });
const manrope = Manrope({ subsets: ['latin'] });
const nunito_sans = Nunito_Sans({ subsets: ['latin'] });

export default function Home() {
  const { isAuthenticated, user, checkAuth, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    } else if (!isLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/student/dashboard');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  return (
    <div className={`${inter.className} min-h-screen flex items-center justify-center bg-[#0A0F1E] text-white`}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#00E5FF] hover:text-[#39FF14] transition-colors duration-300" />
        <p className={`${nunito_sans.className} text-white/60 font-light uppercase tracking-tight`}>Loading...</p>
      </div>
    </div>
  );
}