'use client';

import React, { useEffect } from 'react';
import { useCourseStore } from '@/store/courseStore';
import { CourseList } from '@/components/course/CourseList';
import { Nunito_Sans } from 'next/font/google';
import { BookOpen } from 'lucide-react';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

export default function StudentCoursesPage() {
  const { courses, fetchCourses, isLoading } = useCourseStore();
  console.log(courses);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Mock progress data - ensure this logic aligns with your CourseList's expectation
  // This mock data is just for demonstration if real progress isn't available yet.
  const mockProgress: Record<string, number> = {
    // Example: Map courses to mock progress by their ID if available, otherwise use index
    ...(courses[0]?.id && { [courses[0].id]: 75 }),
    ...(courses[1]?.id && { [courses[1].id]: 45 }),
    ...(courses[2]?.id && { [courses[2].id]: 90 }),
  };

  if (isLoading) {
    return (
      <div className={`${nunitoSans.className} flex items-center justify-center h-screen bg-gray-100`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-500 font-semibold tracking-wide">
            Loading courses...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${nunitoSans.className} space-y-8 bg-gray-100 min-h-screen p-4 sm:p-6 md:p-8 lg:p-12`}> {/* Adjusted padding for all screen sizes */}
      {/* Page Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 rounded-2xl bg-white shadow-sm border border-gray-200"> {/* Adjusted padding */}
        <div className="mb-4 sm:mb-0"> {/* Added margin bottom for mobile */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900"> {/* Adjusted font size */}
            All Courses
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-normal mt-1"> {/* Adjusted font size */}
            Discover and enroll in courses to advance your skills
          </p>
        </div>
      </div>

      {/* Course List Section */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white shadow-sm border border-gray-200"> {/* Adjusted padding */}
        {courses.length > 0 ? (
          <CourseList
            courses={courses}
            userRole="student"
            progress={mockProgress}
          />
        ) : (
          <div className="text-center py-8 sm:py-12 text-gray-500"> {/* Adjusted padding */}
            <BookOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-3 sm:mb-4 text-gray-300" /> {/* Adjusted icon size */}
            <p className="font-semibold text-base sm:text-lg">No courses available at the moment.</p> {/* Adjusted font size */}
            <p className="text-sm">Please check back later!</p>
          </div>
        )}
      </div>
    </div>
  );
}
