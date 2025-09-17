'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCourseStore } from '@/store/courseStore';
import { CourseList } from '@/components/course/CourseList';
import { Loader2 } from 'lucide-react';
import { Inter } from 'next/font/google';
import { Button } from '@/components/ui/button';

const inter = Inter({ subsets: ['latin'] });

export default function AdminCoursesPage() {
  const { courses, fetchCourses, isLoading } = useCourseStore();
  const router = useRouter();

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  useEffect(()=> {
    document.title = "Admin Course Management - Mentversity";
  })

  const handleCreateCourse = () => {
    router.push('/admin/courses/create');
  };

  if (isLoading) {
    return (
      <div className={`${inter.className} flex items-center justify-center h-screen bg-gray-50 text-gray-800`}>
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#00404a] mx-auto mb-4" />
          <p className="text-gray-500 font-light">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${inter.className} space-y-6 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen text-gray-900`}>
      {/* Updated header for responsive layout */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Course Management</h1>
          <p className="text-gray-500">
            Create, edit, and manage your courses.
          </p>
        </div>
      </div>
      <CourseList
        courses={courses}
        userRole="admin"
        onCreateCourse={handleCreateCourse}
      />
    </div>
  );
}