'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Home,
  Users,
  BarChart3,
  Settings,
  GraduationCap,
  FileText,
  LogOut,
  X,
  Menu,
} from 'lucide-react';
import { Nunito_Sans } from 'next/font/google';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

interface SidebarItem {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string;
}

interface SidebarProps {
  userRole: 'admin' | 'student' | 'trainer';
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const adminItems: SidebarItem[] = [
    { title: 'Dashboard', icon: Home, href: '/admin/dashboard' },
    { title: 'Courses', icon: BookOpen, href: '/admin/courses' },
    { title: 'Students', icon: Users, href: '/admin/students' },
    { title: 'Trainers', icon: GraduationCap, href: '/admin/trainers' },
    { title: 'Registrations', icon: Users, href: '/admin/registrations' },
  ];

  const studentItems: SidebarItem[] = [
    { title: 'Dashboard', icon: Home, href: '/student/dashboard' },
    { title: 'My Courses', icon: GraduationCap, href: '/student/courses' },
    { title: 'Assignments', icon: FileText, href: '/student/assignments' },
  ];

  const trainerItems: SidebarItem[] = [
    { title: 'Dashboard', icon: Home, href: '/trainer/dashboard' },
    { title: 'My Courses', icon: GraduationCap, href: '/trainer/courses' },
    { title: 'Students', icon: Users, href: '/trainer/students' },
    { title: 'Assignments', icon: FileText, href: '/trainer/assignments' },
  ];

  const items =
    userRole === 'admin'
      ? adminItems
      : userRole === 'trainer'
      ? trainerItems
      : studentItems;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      {/* Mobile Hamburger */}
      <div className="lg:hidden fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full bg-[#00404a] text-white shadow-md hover:bg-emerald-600 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          `${nunitoSans.className} bg-[#00404a] border-r border-gray-200 h-full shadow-lg transition-all duration-300 ease-in-out flex flex-col`,
          'fixed inset-y-0 left-0 z-40 lg:relative lg:block',
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0',
          'lg:translate-x-0',
          isHovered ? 'lg:w-64' : 'lg:w-20'
        )}
        style={{ overflowX: isOpen ? 'visible' : 'hidden' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo Section */}
        <div className="p-4 flex items-center justify-between border-b border-gray-600">
          <div className="w-full flex items-center">
            <Image
              src="/logo.png"
              alt="Mentversity logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            {(isHovered || isOpen) && (
              <span className="ml-3 text-xl font-bold text-white">Mentversity</span>
            )}
          </div>
          {/* Mobile Close Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 rounded-full text-gray-200 hover:bg-gray-700 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Profile: avatar only when collapsed, full card when expanded */}
        <div className="p-4 flex items-center justify-center transition-opacity duration-300">
          {(isHovered || isOpen) ? (
            <div className="flex items-center space-x-3 w-full">
              <Avatar className="h-12 w-12 border-2 border-white rounded-full shadow-lg">
                {user?.avatar ? (
                  <AvatarImage src={user.avatar} alt={user.name || ''} />
                ) : (
                  <AvatarFallback className="bg-[#05d6ac]/20 text-[#05d6ac] font-semibold text-lg">
                    {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex flex-col truncate">
                <p className="text-white font-semibold text-sm truncate">{user?.name || 'Guest User'}</p>
                <p className="text-[#05d6ac] text-xs truncate capitalize">{user?.role || ''}</p>
              </div>
            </div>
          ) : (
            // collapsed sidebar: only show circular avatar centered
            <Avatar className="h-12 w-12 border-2 border-white rounded-full shadow-lg">
              {user?.avatar ? (
                <AvatarImage src={user.avatar} alt={user.name || ''} />
              ) : (
                <AvatarFallback className="bg-[#05d6ac]/20 text-[#05d6ac] font-semibold text-lg">
                  {user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow p-2 space-y-1 overflow-auto">
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center px-4 py-3 rounded-[16px] text-base font-semibold transition-all duration-300 group',
                  isActive
                    ? 'bg-white text-black shadow-sm'
                    : 'text-gray-300 hover:bg-gray-500/30 hover:text-white'
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon
                  className={cn(
                    'h-6 w-6 transition-all duration-300',
                    isActive ? 'text-[#05d6ac]' : 'text-gray-300 group-hover:text-[#05d6ac]'
                  )}
                />
                <span
                  className={cn(
                    'ml-4 whitespace-nowrap transition-opacity duration-300 select-none',
                    isHovered || isOpen ? 'opacity-100' : 'opacity-0 lg:hidden'
                  )}
                >
                  {item.title}
                </span>
                {item.badge && (isHovered || isOpen) && (
                  <span className="ml-auto bg-[#05d6ac] text-white text-xs font-bold rounded-full px-2 py-1 shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Animated Logout Button at Bottom */}
        <div className="mt-auto p-4 mb-2 flex justify-center items-end">
          <button
            onClick={handleLogout}
            className={cn(
              'transition-all duration-300 flex items-center justify-center space-x-2 shadow focus:outline-none bg-red-500 text-white',
              isHovered || isOpen
                ? 'w-full px-4 py-2 rounded-md font-semibold hover:bg-red-600'
                : 'w-12 h-12 rounded-full hover:bg-red-600'
            )}
            aria-label="Logout"
            title="Logout"
          >
            <LogOut className="h-6 w-6" />
            {(isHovered || isOpen) && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};
