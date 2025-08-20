'use client';

import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  Home,
  Users,
  BarChart3,
  Settings,
  GraduationCap,
  FileText,
  Award,
  X, // Added for close button icon
  Menu, // Added for hamburger menu icon
} from 'lucide-react';
import { Nunito_Sans } from 'next/font/google';

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
  userRole: 'admin' | 'student';
}

export const Sidebar: React.FC<SidebarProps> = ({ userRole }) => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false); // State to manage sidebar visibility on mobile

  // Close sidebar on route change for mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const adminItems: SidebarItem[] = [
    { title: 'Dashboard', icon: Home, href: '/admin/dashboard' },
    { title: 'Courses', icon: BookOpen, href: '/admin/courses' },
    { title: 'Students', icon: Users, href: '/admin/students' },
    { title: 'Register Students', icon: Users, href: '/admin/register-students' },
    { title: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
    { title: 'Settings', icon: Settings, href: '/admin/settings' },
  ];

  const studentItems: SidebarItem[] = [
    { title: 'Dashboard', icon: Home, href: '/student/dashboard' },
    { title: 'My Courses', icon: GraduationCap, href: '/student/courses' },
    { title: 'Assignments', icon: FileText, href: '/student/assignments' },
    // { title: 'Certificates', icon: Award, href: '/student/certificates' },
    // { title: 'Settings', icon: Settings, href: '/student/settings' },
  ];

  const items = userRole === 'admin' ? adminItems : studentItems;

  return (
    <>
      {/* Mobile Hamburger Menu Button */}
      {/* This button toggles the sidebar on small screens */}
      <div className="lg:hidden fixed top-4 right-4 z-50"> {/* Changed left-4 to right-4 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full bg-emerald-500 text-white shadow-md hover:bg-emerald-600 transition-colors"
          aria-label="Toggle sidebar"
          aria-expanded={isOpen} // Accessibility: indicates if sidebar is open
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar Container */}
      <aside
        className={cn(
          `${nunitoSans.className} bg-[#fafafa] border-r border-gray-200 h-full shadow-lg transition-all duration-300 ease-in-out`,
          'fixed inset-y-0 left-0 z-40 lg:relative lg:block', // Fixed on mobile, relative/block on large screens
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full w-0', // Mobile: slide in/out and collapse width
          'lg:w-64 lg:translate-x-0' // Large screens: always full width and visible
        )}
        // Added overflow-hidden to prevent content bleed when collapsed
        style={{ overflowX: isOpen ? 'visible' : 'hidden' }}
      >
        {/* Mobile Header (inside sidebar) */}
        <div className="p-4 flex items-center justify-between lg:hidden">
          <span className="text-xl font-bold text-gray-900">Mentversity</span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex items-center space-x-4 px-4 py-3 rounded-[16px] text-base font-semibold transition-all duration-300 group',
                  isActive
                    ? 'bg-white text-[#121926] shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100/70 hover:text-gray-800'
                )}
                onClick={() => setIsOpen(false)} // Close sidebar on link click for mobile
              >
                <item.icon
                  className={cn(
                    'h-6 w-6 transition-all duration-300',
                    isActive
                      ? 'text-[#05d6ac]'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                />
                <span className="font-semibold">{item.title}</span>
                {item.badge && (
                  <span className="ml-auto bg-[#05d6ac] text-white text-xs font-bold rounded-full px-2 py-1 tracking-wider shadow-sm">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true" // Accessibility: hides overlay from screen readers
        ></div>
      )}
    </>
  );
};
