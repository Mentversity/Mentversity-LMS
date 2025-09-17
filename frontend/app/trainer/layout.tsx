'use client'; // This directive is crucial for using hooks like useParams and usePathname

import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Sidebar } from '@/components/common/Sidebar';

export default function TrainerLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ProtectedRoute requiredRole="trainer">
      <div className="h-screen flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          {/* Conditionally render the Sidebar: it will be hidden if it's a course detail page */}
          <Sidebar userRole="trainer"/>
          {/* The main content area. It will expand to full width when the sidebar is hidden. */}
          <main className='`flex-1 overflow-auto bg-gray-50 p-6 w-full'>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
