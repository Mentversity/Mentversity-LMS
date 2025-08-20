'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi, studentsApi } from '@/lib/api'; // Import your API functions
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // For pagination page input
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'; // For course dropdown
import { Loader2, User, BookOpen, ChevronLeft, ChevronRight, Badge } from 'lucide-react';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils'; // Assuming cn utility for conditional class names

const inter = Inter({ subsets: ['latin'] });

// Re-defining types here for clarity, assuming they match lib/api.ts
type UserData = {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'student';
  enrolledCourses?: string[];
};

type CourseData = {
  _id: string;
  title: string;
};

export default function AdminStudentPage() {
  const router = useRouter();

  const [students, setStudents] = useState<UserData[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [studentsPerPage, setStudentsPerPage] = useState<number>(10);
  const [totalStudents, setTotalStudents] = useState<number>(0);

  // Filter states
  const [viewMode, setViewMode] = useState<'all' | 'course'>('all'); // 'all' or 'course'
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    return Math.ceil(totalStudents / studentsPerPage);
  }, [totalStudents, studentsPerPage]);

  // Fetch courses on component mount
  useEffect(() => {
    const fetchCoursesData = async () => {
      try {
        const response = await coursesApi.getAll();
        setCourses(response.data.courses);
      } catch (err: any) {
        console.error('Failed to fetch courses:', err);
        setError('Failed to load courses for filtering.');
      }
    };
    fetchCoursesData();
  }, []);

  // Fetch students based on current filters and pagination
  useEffect(() => {
    const fetchStudentsData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let response;
        if (viewMode === 'all') {
          response = await studentsApi.getAll(currentPage, studentsPerPage);
        } else if (viewMode === 'course' && selectedCourseId) {
          response = await studentsApi.getByCourseId(selectedCourseId, currentPage, studentsPerPage);
        } else {
          setStudents([]); // Clear students if course mode selected but no course is chosen
          setTotalStudents(0);
          setIsLoading(false);
          return;
        }

        setStudents(response.data);
        setTotalStudents(response.totalCount);
      } catch (err: any) {
        console.error('Failed to fetch students:', err);
        setError(err?.message || 'Failed to load student data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentsData();
  }, [currentPage, studentsPerPage, viewMode, selectedCourseId]);

  // Reset page to 1 when filter or view mode changes
  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, selectedCourseId, studentsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  const handlePrevPage = () => {
    handlePageChange(currentPage - 1);
  };

  const handleViewModeChange = (mode: 'all' | 'course') => {
    setViewMode(mode);
    if (mode === 'all') {
      setSelectedCourseId(null); // Clear selected course when viewing all
    }
  };

  if (isLoading && students.length === 0) {
    return (
      <div className={`${inter.className} flex items-center justify-center h-screen bg-gray-50 text-gray-800`}>
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#05d6ac] mx-auto mb-4" />
          <p className="text-gray-500 font-light">Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${inter.className} min-h-screen flex flex-col items-center justify-center text-center bg-gray-50 text-gray-700 p-6`}>
        <p className="text-lg font-medium">Error loading students</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-[#05d6ac] text-white rounded-full px-6 py-2 shadow-md hover:bg-[#04b895]">
          Retry
        </Button>
      </div>
    );
  }

  console.log('Students:', students);
  console.log('Courses:', courses);
  return (
    <div className={`${inter.className} space-y-6 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen text-gray-900`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Student Management</h1>
          <p className="text-gray-500">View and manage student enrollments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* View Mode Toggle */}
        <Card className="rounded-xl shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">View Mode</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleViewModeChange('all')}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-semibold",
                viewMode === 'all' ? "bg-[#05d6ac] text-white shadow-md hover:bg-[#04b895]" : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
              )}
            >
              <User className="w-4 h-4 mr-2" /> All Students
            </Button>
            <Button
              onClick={() => handleViewModeChange('course')}
              className={cn(
                "flex-1 px-4 py-2 rounded-lg font-semibold",
                viewMode === 'course' ? "bg-[#05d6ac] text-white shadow-md hover:bg-[#04b895]" : "bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200"
              )}
            >
              <BookOpen className="w-4 h-4 mr-2" /> By Course
            </Button>
          </CardContent>
        </Card>

        {/* Course Filter */}
        <Card className={cn("rounded-xl shadow-sm border-gray-200", viewMode === 'course' ? 'block' : 'hidden md:block')}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Filter by Course</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={(value) => setSelectedCourseId(value === "" ? null : value)}
              value={selectedCourseId || ""}
              disabled={viewMode === 'all' || courses.length === 0}
            >
              <SelectTrigger className="w-full rounded-lg border-gray-300 bg-white text-gray-700 focus:ring-[#05d6ac] focus:border-[#05d6ac]">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value=" ">All Courses (when in 'By Course' mode)</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {viewMode === 'course' && !selectedCourseId && courses.length > 0 && (
              <p className="text-sm text-red-500 mt-2">Please select a course to filter students.</p>
            )}
            {courses.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">No courses available to filter.</p>
            )}
          </CardContent>
        </Card>

        {/* Students Per Page */}
        <Card className="rounded-xl shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Students Per Page</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={(value) => setStudentsPerPage(Number(value))}
              value={String(studentsPerPage)}
            >
              <SelectTrigger className="w-full rounded-lg border-gray-300 bg-white text-gray-700 focus:ring-[#05d6ac] focus:border-[#05d6ac]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Student List */}
      <Card className="rounded-xl shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold tracking-tight text-gray-900">
            {viewMode === 'all' ? 'All Students' : `Students in ${courses.find(c => c._id === selectedCourseId)?.title || 'Selected Course'}`}
            <span className="text-gray-500 text-sm font-normal ml-2">({totalStudents} total)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {students.length === 0 && !isLoading ? (
            <div className="p-6 text-center text-gray-500">
              No students found matching your criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        <Badge className="bg-[#D3F5E7] text-[#05d6ac] font-medium border border-[#05d6ac] text-xs">
                          {student.role}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Page {currentPage} of {totalPages} (Showing {students.length} of {totalStudents} students)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={handlePrevPage}
              disabled={currentPage === 1 || isLoading}
              variant="outline"
              className="rounded-full px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  variant={currentPage === pageNumber ? 'default' : 'outline'}
                  className={cn(
                    "rounded-full h-8 w-8 text-sm",
                    currentPage === pageNumber ? "bg-[#05d6ac] text-white hover:bg-[#04b895]" : "text-gray-700 border-gray-300 hover:bg-gray-100"
                  )}
                >
                  {pageNumber}
                </Button>
              ))}
            </div>
            <Button
              onClick={handleNextPage}
              disabled={currentPage === totalPages || isLoading}
              variant="outline"
              className="rounded-full px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-100 disabled:opacity-50"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
