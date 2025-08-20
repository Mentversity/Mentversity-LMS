'use client';

import React, { useState, useMemo } from 'react';
import { Course } from '@/types';
import { CourseCard } from './CourseCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, SortAsc, Plus } from 'lucide-react'; // Added Plus icon
import { Nunito_Sans } from 'next/font/google';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

interface CourseListProps {
  courses?: Course[] | null; // Allow undefined/null
  userRole: 'admin' | 'student';
  progress?: Record<string, number>;
  onCreateCourse?: () => void;
}

export const CourseList: React.FC<CourseListProps> = ({
  courses,
  userRole,
  progress = {},
  onCreateCourse,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Ensure we always work with an array
  const courseArray = Array.isArray(courses) ? courses : [];

  const filteredAndSortedCourses = useMemo(() => {
    return courseArray
      .filter((course) => {
        const matchesSearch =
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.instructor.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesLevel = levelFilter === 'all' || course.level === levelFilter;

        return matchesSearch && matchesLevel;
      })
      .sort((a, b) => {
        // Ensure createdAt exists for sorting
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        switch (sortBy) {
          case 'newest':
            return dateB - dateA;
          case 'oldest':
            return dateA - dateB;
          case 'rating':
            return (b.rating || 0) - (a.rating || 0); // Handle undefined ratings
          case 'students':
            return (b.studentsCount || 0) - (a.studentsCount || 0); // Handle undefined student counts
          case 'alphabetical':
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
  }, [courseArray, searchTerm, levelFilter, sortBy]);

  return (
    <div className={`${nunitoSans.className} space-y-6`}>
      {/* Search and Filters */}
      {/* Flex container for responsiveness: stacks vertically on small, row on sm+ */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between p-4 bg-gray-50 rounded-[16px] shadow-sm">
        {/* Search Input and Selects - wrapped in a flex container that can wrap */}
        <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full sm:w-auto"> {/* Stacks selects on mobile, row on sm+ */}
          <div className="relative flex-1 min-w-[180px] sm:max-w-md"> {/* Adjusted min-width for mobile */}
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 bg-white rounded-full text-gray-800 placeholder:text-gray-400 border border-gray-200 focus:border-[#05d6ac] transition-colors duration-300 shadow-sm w-full"
            />
          </div>

          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-40 bg-white rounded-full text-gray-600 border border-gray-200 focus:ring-1 focus:ring-[#05d6ac] transition-colors duration-300 shadow-sm">
              <Filter className="h-5 w-5 mr-2 text-gray-400" />
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 text-gray-700 shadow-md rounded-[16px]">
              <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100">All Levels</SelectItem>
              <SelectItem value="beginner" className="hover:bg-gray-100 focus:bg-gray-100">Beginner</SelectItem>
              <SelectItem value="intermediate" className="hover:bg-gray-100 focus:bg-gray-100">Intermediate</SelectItem>
              <SelectItem value="advanced" className="hover:bg-gray-100 focus:bg-gray-100">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-40 bg-white rounded-full text-gray-600 border border-gray-200 focus:ring-1 focus:ring-[#05d6ac] transition-colors duration-300 shadow-sm">
              <SortAsc className="h-5 w-5 mr-2 text-gray-400" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 text-gray-700 shadow-md rounded-[16px]">
              <SelectItem value="newest" className="hover:bg-gray-100 focus:bg-gray-100">Newest</SelectItem>
              <SelectItem value="oldest" className="hover:bg-gray-100 focus:bg-gray-100">Oldest</SelectItem>
              <SelectItem value="rating" className="hover:bg-gray-100 focus:bg-gray-100">Rating</SelectItem>
              <SelectItem value="students" className="hover:bg-gray-100 focus:bg-gray-100">Students</SelectItem>
              <SelectItem value="alphabetical" className="hover:bg-gray-100 focus:bg-gray-100">A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Course Button - full width on mobile, auto on sm+ */}
        {userRole === 'admin' && onCreateCourse && (
          <Button
            onClick={onCreateCourse}
            className="w-full sm:w-auto rounded-full px-6 py-3 font-semibold text-white bg-[#05d6ac] shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" /> {/* Added Plus icon */}
            Create Course
          </Button>
        )}
      </div>

      {/* Course Grid */}
      {filteredAndSortedCourses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2 font-semibold tracking-wide">No courses found</div>
          <p className="text-gray-500 font-normal">
            {searchTerm || levelFilter !== 'all'
              ? 'Try adjusting your search or filters'
              : 'No courses available at the moment'}
          </p>
          {userRole === 'admin' && onCreateCourse && (
            <Button
              onClick={onCreateCourse}
              className="mt-6 rounded-full px-6 py-3 font-semibold text-white bg-[#05d6ac] shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg flex items-center justify-center"
            >
              <Plus className="h-5 w-5 mr-2" /> {/* Added Plus icon */}
              Create Your First Course
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"> {/* Adjusted grid for responsiveness */}
          {filteredAndSortedCourses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              userRole={userRole}
              progress={progress[course._id]}
            />
          ))}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-500 text-center font-normal">
        Showing {filteredAndSortedCourses.length} of {courseArray.length} courses
      </div>
    </div>
  );
};
