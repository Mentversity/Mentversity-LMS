'use client';

import React, { useEffect, useState } from 'react';
import { useCourseStore } from '@/store/courseStore';
import { useAuthStore } from '@/store/authStore';
import { studentsApi } from '@/lib/api'; // This is kept for consistency but not used for trainers
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Users,
  TrendingUp,
  Star,
  CheckCircle,
  Plus,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

// Custom Tailwind classes for colors and styles
const levelBadgeColors = {
  beginner: 'bg-[#00404a]/20 text-[#00404a] font-medium',
  intermediate: 'bg-yellow-500/20 text-yellow-700 font-medium',
  advanced: 'bg-red-500/20 text-red-700 font-medium',
  default: 'bg-gray-500/20 text-gray-700 font-medium',
};

// Main Trainer Dashboard component
export default function TrainerDashboard() {
  const {
    courses: rawCourses,
    fetchCourses,
    isLoading,
    error,
  } = useCourseStore();
  const { user, isLoading: isUserLoading } = useAuthStore();

  // The totalStudentsCount state and its fetching logic is removed for trainers
  const courses = Array.isArray(rawCourses) ? rawCourses : [];
  
  // Filter courses to show only those assigned to the current trainer
  const trainerCourses = courses.filter(
    (course) => course.trainerId === user?.id
  );

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Combined loading check: waits for both user and courses to load
  if (isUserLoading || isLoading) {
    return (
      <div className={`${inter.className} min-h-screen flex items-center justify-center bg-gray-50 text-gray-900`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#00404a]" />
      </div>
    );
  }

  // If user is not logged in after loading, show a message
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-900">
        <h1 className="text-xl font-bold">Please log in to view this page.</h1>
      </div>
    );
  }

  // If there's an error fetching courses, show an error message
  if (error) {
    return (
      <div className={`${inter.className} min-h-screen flex flex-col items-center justify-center text-center bg-gray-50 text-gray-900`}>
        <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-xl font-bold tracking-tight mb-2">Failed to load courses</h2>
        <p className="text-gray-500 mb-4">
          Something went wrong while fetching your courses. Please try again.
        </p>
        <Button onClick={fetchCourses} className="rounded-full bg-[#00404a] text-white font-semibold shadow-[0_4px_8px_rgba(0,0,0,0.05)] transition-transform hover:scale-[1.02]">
          Retry
        </Button>
      </div>
    );
  }

  // Stats for the trainer dashboard
  const stats = {
    totalCourses: trainerCourses.length,
    avgCompletionRate: '78%',
    avgStudentRating: '4.5/5',
  };

  const recentCourses = trainerCourses.slice(0, 5);

  return (
    <div className={`${inter.className} space-y-8 p-8 bg-gray-50 min-h-screen text-gray-900`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome back, {user.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 font-normal mt-1">
            Here's an overview of your assigned courses.
          </p>
        </div>
      </div>

      {/* Stats Cards for Trainer */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon={<BookOpen className="h-5 w-5 text-[#00404a]" />}
          change="+2 from last month"
        />
        <StatCard
          title="Avg. Completion Rate"
          value={stats.avgCompletionRate}
          icon={<CheckCircle className="h-5 w-5 text-[#00404a]" />}
          change="Consistent"
        />
        <StatCard
          title="Avg. Student Rating"
          value={stats.avgStudentRating}
          icon={<Star className="h-5 w-5 text-[#00404a]" />}
          change="Last 30 days"
        />
      </div>

      {/* Recent Courses + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white rounded-2xl shadow-sm transition-shadow duration-200 hover:shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between px-6 py-4">
            <CardTitle className="text-gray-900 font-bold tracking-tight text-lg">Recent Courses</CardTitle>
            <Link href="/admin/courses">
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-[#00404a] hover:bg-gray-100 transition-colors duration-200 rounded-full">
                View all
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            {recentCourses.length > 0 ? (
              recentCourses.map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-xl transition-colors duration-200 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 border border-gray-200">
                      <BookOpen className="h-5 w-5 text-[#00404a]" />
                    </div>
                    <div>
                      <p className="font-semibold tracking-wide text-gray-900 leading-tight">{course.title}</p>
                      <p className="text-xs text-gray-500 font-normal">
                        {course.studentsCount} students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={levelBadgeColors[course.level?.toLowerCase() || 'default']}
                    >
                      {course.level}
                    </Badge>
                    <Link href={`/admin/courses/${course.id}`}>
                      <Button variant="ghost" size="icon" className="text-gray-500 hover:text-[#00404a] hover:bg-gray-100 transition-colors duration-200 rounded-full">
                        <Eye className="h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-light mb-2">No courses created yet</p>
                <Link href="/admin/courses/create">
                  <Button variant="outline" className="rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100">Create Your First Course</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white rounded-2xl shadow-sm transition-shadow duration-200 hover:shadow-lg">
          <CardHeader className="px-6 py-4">
            <CardTitle className="text-gray-900 font-bold tracking-tight text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-6 pb-6">
            <Link href="/admin/analytics" className="block">
              <QuickAction
                icon={<TrendingUp className="h-5 w-5 text-[#00404a]" />}
                title="View Analytics"
                description="Check performance metrics"
              />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const QuickAction = ({
  icon,
  title,
  description,
}) => (
  <div className="p-4 border border-gray-200 rounded-xl transition-colors duration-200 cursor-pointer hover:bg-gray-50 group">
    <div className="flex items-center space-x-4">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 border border-gray-200`}
      >
        {icon}
      </div>
      <div>
        <p className="font-semibold tracking-wide text-gray-900 leading-tight">{title}</p>
        <p className="text-sm text-gray-500 font-normal">{description}</p>
      </div>
    </div>
  </div>
);

const StatCard = ({
  title,
  value,
  icon,
  change,
}) => (
  <Card className="bg-white rounded-2xl shadow-sm transition-shadow duration-200 hover:shadow-lg">
    <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
      <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent className="p-6 pt-2">
      <div className="text-3xl font-bold tracking-tight text-gray-900">{value}</div>
      <p className="text-xs text-gray-400 font-normal mt-1">{change}</p>
    </CardContent>
  </Card>
);