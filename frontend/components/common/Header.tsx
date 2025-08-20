'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookOpen, LogOut, Settings, User } from 'lucide-react';
import { Nunito_Sans } from 'next/font/google'; // Importing Nunito_Sans for typography
import Image from 'next/image';

// Initialize Nunito_Sans font
const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  console.log('Header user:', user);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <header className={`${nunitoSans.className} bg-white shadow-sm sticky top-0 z-50 px-8 py-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            {/* Mentversity Icon with primary accent color */}
            <div className="relative w-12 h-12">
              <Image 
                src='/logo.png' 
                alt='Mentversity logo' 
                fill 
                className="object-contain"
              />
            </div>
            <div>
              {/* Mentversity Title: Bold, slightly condensed, high contrast */}
              <span className="text-2xl font-extrabold text-[#121926] tracking-tight">Mentversity</span>
              {/* Small label: Lighter weight, uppercase, tight letter-spacing */}
              <p className="text-xs text-gray-500 font-normal uppercase tracking-widest">Education Platform</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-12 w-12 rounded-full p-0 transition-all duration-200 hover:bg-gray-100/50"
              >
                <div className="relative">
                  {/* Avatar styling with soft border and rounded corners */}
                  <Avatar className="h-10 w-10 border-2 border-white drop-shadow-sm">
                    <AvatarImage src={user?.avatar} alt={user?.name || ''} />
                    <AvatarFallback className="bg-[#05d6ac]/20 text-[#05d6ac] font-semibold text-base">
                      {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online status dot */}
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#39FF14] rounded-full border-2 border-white" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            {/* Dropdown menus: Clean, rounded, with soft shadow */}
            <DropdownMenuContent
              className="w-64 bg-white rounded-2xl p-4 border border-gray-200 shadow-lg text-[#121926]"
              align="end"
            >
              <DropdownMenuLabel className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12 border-2 border-gray-100 rounded-full">
                    <AvatarImage src={user?.avatar} alt={user?.name || ''} />
                    <AvatarFallback className="bg-[#05d6ac]/20 text-[#05d6ac] font-semibold text-base">
                      {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-1">
                    {/* User Name: Bold, high contrast */}
                    <p className="text-sm font-bold leading-none text-[#121926]">{user?.name}</p>
                    {/* User Email: Lighter weight, gray text */}
                    <p className="text-xs leading-none text-gray-500">{user?.email}</p>
                    {/* User Role: Medium weight, primary accent color */}
                    <p className="text-xs leading-none text-[#05d6ac] capitalize font-medium">
                      {user?.role}
                    </p>
                  </div>
                </div>
              </DropdownMenuLabel>
              {/* Dividers: Thin gray lines */}
              <DropdownMenuSeparator className="bg-gray-200" />
              {/* Menu items: Medium weight, with clean hover effects */}
              <DropdownMenuItem className="text-gray-700 cursor-pointer transition-colors duration-200 rounded-lg hover:bg-gray-100 focus:bg-gray-100 p-2 my-1">
                {/* Icons: Gray fill, primary accent color on hover */}
                <User className="mr-3 h-4 w-4 text-gray-400 transition-colors duration-200 group-hover:text-[#05d6ac]" />
                <span className="font-medium">Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="text-gray-700 cursor-pointer transition-colors duration-200 rounded-lg hover:bg-gray-100 focus:bg-gray-100 p-2 my-1">
                {/* Icons: Gray fill, primary accent color on hover */}
                <Settings className="mr-3 h-4 w-4 text-gray-400 transition-colors duration-200 group-hover:text-[#05d6ac]" />
                <span className="font-medium">Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-red-500 cursor-pointer transition-colors duration-200 rounded-lg hover:bg-red-50 focus:bg-red-50 p-2 my-1"
              >
                {/* Icons: Red fill */}
                <LogOut className="mr-3 h-4 w-4 text-red-400 transition-colors duration-200" />
                <span className="font-medium">Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};