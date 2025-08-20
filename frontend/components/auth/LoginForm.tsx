'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BookOpen, Mail, Lock, Loader2 } from 'lucide-react';
import { Nunito_Sans } from 'next/font/google';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(email, password);
      console.log('Logged in user:', user.role);

      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'student') {
        router.push('/student/courses');
      } else {
        setError('Unknown user role. Please contact support.');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${nunitoSans.className} min-h-screen flex items-center justify-center bg-gray-100 px-4`}>
      <Card className="w-full max-w-md shadow-lg bg-white border border-gray-200 rounded-2xl text-gray-900">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-emerald-500 rounded-full p-4 shadow-md">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
          <CardDescription className="text-gray-500 font-normal">
            Sign in to your account to continue learning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-600">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-50 border border-gray-200 rounded-full text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors duration-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-600">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-50 border border-gray-200 rounded-full text-gray-800 placeholder:text-gray-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors duration-300"
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
              className="w-full bg-emerald-500 text-white font-semibold rounded-full py-2 shadow-md hover:bg-emerald-600 hover:scale-[1.01] transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="text-center text-xs text-gray-500 mt-4 font-mono">
            <p>Demo credentials:</p>
            <p className="font-semibold">Admin: admin@demo.com / admin123</p>
            <p className="font-semibold">Student: student@demo.com / student123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};