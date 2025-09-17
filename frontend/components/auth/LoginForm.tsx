'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BookOpen, Mail, Lock, Loader2 } from 'lucide-react';
import { Nunito_Sans } from 'next/font/google';

// Logo image path - make sure /public/logo.png exists
const LOGO_SRC = '/logo.png';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

const Bubble = ({ x, y, r, color, onClick, active }) => (
  <circle
    cx={x}
    cy={y}
    r={active ? r * 1.6 : r}
    fill={color}
    opacity={0.13}
    style={{
      transition: 'r 0.35s cubic-bezier(0.39, 0.57, 0.56, 1), fill 0.3s',
      cursor: 'pointer'
    }}
    onClick={onClick}
  />
);

function AnimatedBackground() {
  const [bubbles, setBubbles] = useState([
    { x: 120, y: 180, r: 38, color: '#16a34a', id: 1, active: false },
    { x: 360, y: 80, r: 30, color: '#2563eb', id: 2, active: false },
    { x: 260, y: 250, r: 42, color: '#db2777', id: 3, active: false },
    { x: 430, y: 180, r: 36, color: '#f59e42', id: 4, active: false },
    { x: 90, y: 310, r: 25, color: '#eab308', id: 5, active: false },
    { x: 390, y: 320, r: 33, color: '#14b8a6', id: 6, active: false },
    { x: 500, y: 320, r: 30, color: '#38bdf8', id: 7, active: false }
  ]);
  // Animate the bubbles floating in smooth loop
  useEffect(() => {
    const interval = setInterval(() => {
      setBubbles(b =>
        b.map(bubble => {
          let dy = Math.sin(Date.now() / 1400 + bubble.x) * 7;
          let dx = Math.cos(Date.now() / 700 + bubble.y) * 6;
          return { ...bubble, x: bubble.x + dx * 0.05, y: bubble.y + dy * 0.05 };
        })
      );
    }, 36);
    return () => clearInterval(interval);
  }, []);
  // Bubble click handler to grow
  const handleBubbleClick = id => {
    setBubbles(b => b.map(bu => bu.id === id ? { ...bu, active: !bu.active } : bu));
  };
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <svg width="100%" height="100vh" viewBox="0 0 600 400" preserveAspectRatio="none" className="fixed w-full h-full">
        {bubbles.map(bubble =>
          <Bubble key={bubble.id}
                  {...bubble}
                  onClick={() => handleBubbleClick(bubble.id)}
                  />
        )}
      </svg>
      {/* Subtle animated gradient overlay */}
      <div className="fixed inset-0 bg-gradient-to-tr from-teal-100 via-violet-100 to-sky-100 opacity-50 pointer-events-none" />
    </div>
  );
}

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    document.title = 'Login - Mentversity LMS';
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') router.push('/admin/dashboard');
      else if (user.role === 'trainer') router.push('/trainer/dashboard');
      else if (user.role === 'student') router.push('/student/courses');
      else setError('Unknown user role. Please contact support.');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isProd = process.env.NODE_ENV === 'production';
  return (
    <div className={`${nunitoSans.className} min-h-screen flex items-center justify-center px-4 relative`}>
      {/* Animated Bubble Background */}
      <AnimatedBackground />
      {/* Form Card */}
      <Card className="w-full max-w-md shadow-2xl bg-white/80 border border-[#00404a] rounded-2xl text-gray-900 relative z-10 backdrop-blur-sm">
        <CardHeader className="space-y-0 pb-0 pt-6 text-center">
          {/* Logo */}
          <div className="flex flex-col items-center justify-center mb-3">
            <div className="bg-white border-4 border-[#00404a] rounded-full p-1.5 shadow-lg mb-0 animate-bounce">
              <img src={LOGO_SRC} alt="Mentversity Logo" className="h-16 w-16 object-contain rounded-full" />
            </div>
            <div className="mt-2 flex items-center justify-center gap-1">
              <BookOpen className="h-5 w-5 text-[#00404a]" />
              <span className="text-lg font-semibold text-[#00404a] tracking-wide">Mentversity</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight mt-1">Welcome Back</CardTitle>
          <CardDescription className="text-gray-500 font-normal">
            Sign in to your account to continue learning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-3 pb-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#00404a]" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 transition-colors duration-300"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#00404a]" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="pl-10 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400 transition-colors duration-300"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-[#00404a] text-white font-semibold rounded-xl py-2 shadow-lg hover:bg-emerald-600 hover:scale-105 transition-transform duration-300 text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
          {
            isProd ? (
              <p className="text-xs text-gray-500 text-center mt-2">
                Forgot your password? Please contact support to reset it.
              </p>
            ) : (   <div className="text-center text-xs text-gray-500 mt-4 font-mono space-y-1">
            <p>Demo credentials for testing:</p>
            <p className="font-semibold">Admin: <span className="underline">admin@lms.com</span> / Admin@123</p>
            <p className="font-semibold">Trainer: <span className="underline">trainer@lms.com</span> / Trainer@123</p>
            <p className="font-semibold">Student: <span className="underline">student@lms.com</span> / Student@123</p>
          </div>)
          }
        </CardContent>
      </Card>
    </div>
  );
};

