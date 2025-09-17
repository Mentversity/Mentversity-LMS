'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi, trainersApi } from '@/lib/api'; // Import your API functions
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, BookOpen, ChevronLeft, ChevronRight, Badge } from 'lucide-react';
import { Inter } from 'next/font/google';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'] });

// Re-defining types for clarity
type TrainerData = {
  _id: string;
  name: string;
  email: string;
  role: 'trainer';
  teachingCourses?: string[];
};

type CourseData = {
  _id: string;
  title: string;
};

export default function AdminTrainerPage() {
  const router = useRouter();

  const [trainers, setTrainers] = useState<TrainerData[]>([]);
  const [courses, setCourses] = useState<CourseData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [trainersPerPage, setTrainersPerPage] = useState<number>(10);
  const [totalTrainers, setTotalTrainers] = useState<number>(0);

  // Filter states
  const [viewMode, setViewMode] = useState<'all' | 'course'>('all');
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const totalPages = useMemo(() => {
    return Math.ceil(totalTrainers / trainersPerPage);
  }, [totalTrainers, trainersPerPage]);

  useEffect(() => {
    document.title = 'Admin Trainer Management - Mentversity';
  }, []);

  // Fetch courses on mount
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

  // Fetch trainers
  useEffect(() => {
    const fetchTrainersData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let response;
        if (viewMode === 'all') {
          response = await trainersApi.getAll();
          setTrainers(response.trainers);
          const countRes = await trainersApi.getTotalCount();
          setTotalTrainers(countRes.totalCount);
        } else if (viewMode === 'course' && selectedCourseId) {
          response = await trainersApi.getByCourseId(selectedCourseId);
          setTrainers(response.trainers);
          setTotalTrainers(response.trainers.length);
        } else {
          setTrainers([]);
          setTotalTrainers(0);
        }
      } catch (err: any) {
        console.error('Failed to fetch trainers:', err);
        setError(err?.message || 'Failed to load trainer data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrainersData();
  }, [currentPage, trainersPerPage, viewMode, selectedCourseId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, selectedCourseId, trainersPerPage]);

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
      setSelectedCourseId(null);
    }
  };

  if (isLoading && trainers.length === 0) {
    return (
      <div className={`${inter.className} flex items-center justify-center h-screen bg-gray-50 text-gray-800`}>
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 text-[#00404a] mx-auto mb-4" />
          <p className="text-gray-500 font-light">Loading trainer data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${inter.className} min-h-screen flex flex-col items-center justify-center text-center bg-gray-50 text-gray-700 p-6`}>
        <p className="text-lg font-medium">Error loading trainers</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} className="bg-[#00404a] text-white rounded-full px-6 py-2 shadow-md hover:bg-[#04b895]">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`${inter.className} space-y-6 p-6 md:p-8 lg:p-10 bg-gray-50 min-h-screen text-gray-900`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="flex flex-col space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Trainer Management</h1>
          <p className="text-gray-500">View and manage trainer assignments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* View Mode */}
        <Card className="rounded-xl shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">View Mode</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => handleViewModeChange('all')}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg font-semibold',
                viewMode === 'all'
                  ? 'bg-[#00404a] text-white shadow-md hover:bg-[#005965]'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              )}
            >
              <Users className="w-4 h-4 mr-2" /> All Trainers
            </Button>
            <Button
              onClick={() => handleViewModeChange('course')}
              className={cn(
                'flex-1 px-4 py-2 rounded-lg font-semibold',
                viewMode === 'course'
                  ? 'bg-[#00404a] text-white shadow-md hover:bg-[#005965]'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              )}
            >
              <BookOpen className="w-4 h-4 mr-2" /> By Course
            </Button>
          </CardContent>
        </Card>

        {/* Course Filter */}
        <Card className={cn('rounded-xl shadow-sm border-gray-200', viewMode === 'course' ? 'block' : 'hidden md:block')}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Filter by Course</CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              onValueChange={(value) => setSelectedCourseId(value === '' ? null : value)}
              value={selectedCourseId || ''}
              disabled={viewMode === 'all' || courses.length === 0}
            >
              <SelectTrigger className="w-full rounded-lg border-gray-300 bg-white text-gray-700 focus:ring-[#00404a] focus:border-[#00404a]">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {courses.map((course) => (
                  <SelectItem key={course._id} value={course._id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {viewMode === 'course' && !selectedCourseId && courses.length > 0 && (
              <p className="text-sm text-red-500 mt-2">Please select a course to filter trainers.</p>
            )}
            {courses.length === 0 && <p className="text-sm text-gray-500 mt-2">No courses available to filter.</p>}
          </CardContent>
        </Card>

        {/* Trainers Per Page */}
        <Card className="rounded-xl shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">Trainers Per Page</CardTitle>
          </CardHeader>
          <CardContent>
            <Select onValueChange={(value) => setTrainersPerPage(Number(value))} value={String(trainersPerPage)}>
              <SelectTrigger className="w-full rounded-lg border-gray-300 bg-white text-gray-700 focus:ring-[#00404a] focus:border-[#00404a]">
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

      {/* Trainer List */}
      <Card className="rounded-xl shadow-lg border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold tracking-tight text-gray-900">
            {viewMode === 'all' ? 'All Trainers' : `Trainers in ${courses.find((c) => c._id === selectedCourseId)?.title || 'Selected Course'}`}
            <span className="text-gray-500 text-sm font-normal ml-2">({totalTrainers} total)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {trainers.length === 0 && !isLoading ? (
            <div className="p-6 text-center text-gray-500">No trainers found matching your criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trainers.map((trainer) => (
                    <tr key={trainer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{trainer.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{trainer.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        <Badge className="bg-[#E7F0FD] text-[#00404a] font-medium border border-[#00404a] text-xs">
                          {trainer.role}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 bg-white rounded-xl shadow-md border border-gray-200">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Page {currentPage} of {totalPages} (Showing {trainers.length} of {totalTrainers} trainers)
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
                    'rounded-full h-8 w-8 text-sm',
                    currentPage === pageNumber
                      ? 'bg-[#00404a] text-white hover:bg-[#04b895]'
                      : 'text-gray-700 border-gray-300 hover:bg-gray-100'
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
