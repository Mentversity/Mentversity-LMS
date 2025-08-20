'use client'; // This directive is crucial for using hooks like useParams and usePathname

import React from 'react';
import { usePathname } from 'next/navigation'; // Import usePathname to get the current URL path
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Header } from '@/components/common/Header';
import { Sidebar } from '@/components/common/Sidebar';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get the current URL path

  // Determine if the current page is a course detail page.
  // We assume course detail pages have a URL structure like '/courses/[courseId]'.
  // We check if the path starts with '/courses/' AND has more than 2 segments (e.g., ['', 'courses', 'id']).
  const isCourseDetailPage = pathname.startsWith('/student/courses/') && pathname.split('/').length > 2;

  return (
    <ProtectedRoute requiredRole="student">
      <div className="h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          {/* Conditionally render the Sidebar: it will be hidden if it's a course detail page */}
          {!isCourseDetailPage && <Sidebar userRole="student" />}
          
          {/* The main content area. It will expand to full width when the sidebar is hidden. */}
          <main className={`flex-1 overflow-auto bg-gray-50 p-6 ${isCourseDetailPage ? 'w-full' : ''}`}>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
