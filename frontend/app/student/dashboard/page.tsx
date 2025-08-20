'use client';

import React, { useEffect } from 'react';
import { useCourseStore } from '@/store/courseStore';
import { useProgressStore } from '@/store/progressStore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  BookOpen,
  Clock,
  PlayCircle,
  Sparkles,
  Award,
  Star,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { Nunito_Sans } from 'next/font/google';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

export default function StudentDashboard() {
  const { courses, fetchCourses } = useCourseStore();
  const { fetchAllProgress } = useProgressStore();
  const { user } = useAuthStore();
  console.log('courses', courses);

  useEffect(() => {
    fetchCourses();
    fetchAllProgress();
  }, [fetchCourses, fetchAllProgress]);

  const coursesArray = Array.isArray(courses) ? courses : [];
  const enrolledCourses = coursesArray.slice(0, 3);

  // Mock data for progress - used to render the Progress bar
  const mockProgress: Record<string, number> = {
    'course-1': 75,
    'course-2': 45,
    'course-3': 90,
  };

  return (
    <div className={`${nunitoSans.className} space-y-8 bg-gray-100 p-8 rounded-2xl`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
            Welcome back, {user?.name ? user.name.split(' ')[0] : 'Learner'}!
          </h1>
          <p className="text-gray-500 font-normal mt-1">
            Continue your learning journey with Mentversity
          </p>
        </div>
        <Link href="/student/courses">
          <Button className="bg-emerald-500 text-white font-semibold rounded-full px-6 py-3 shadow-md transition-transform hover:scale-105 hover:bg-emerald-600">
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Courses
          </Button>
        </Link>
      </div>

      {/* Stats - This section is simplified to look good without backend data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Courses"
          value={enrolledCourses.length.toString()}
          icon={<BookOpen />}
          subtitle="Enrolled"
        />
        <StatCard
          title="Last Logged In"
          value="Today"
          icon={<Clock />}
          subtitle="Keep going!"
        />
        <StatCard
          title="New Feature"
          value="Quizzes"
          icon={<Sparkles />}
          subtitle="Test your knowledge"
        />
        {/* New motivational card */}
        <StatCard
          title="Student of the Month"
          value="Alex R."
          icon={<Trophy />}
          subtitle="Keep up the great work!"
        />
      </div>

      {/* Courses + Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Courses */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-5 flex items-center gap-2">
            <PlayCircle className="h-6 w-6 text-emerald-500" /> My Courses
          </h2>
          <div className="space-y-4">
            {enrolledCourses.length > 0 ? (
              enrolledCourses.map((course, index) => {
                const courseProgress = mockProgress[`course-${index + 1}`] || 0;
                return (
                  <div
                    key={course.id || `course-${index}`}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-center space-x-4 w-full sm:w-auto mb-4 sm:mb-0">
                      <div className="w-16 h-12 rounded-lg flex items-center justify-center bg-emerald-100 overflow-hidden">
                        <img
                          src={course.thumbnail.url || '/placeholder-course.png'}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold tracking-wide text-gray-900">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {course.instructor || 'Unknown Instructor'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                      <div className="w-full sm:w-40 flex-shrink-0">
                        <Progress
                          value={courseProgress}
                          className="h-2 rounded-full bg-gray-200"
                          indicatorClassName="bg-emerald-500"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-600 w-10 text-right">
                        {courseProgress}%
                      </span>
                      <Link href={`/student/courses/${course.id}`}>
                        <Button
                          size="sm"
                          className="bg-emerald-500 text-white font-semibold rounded-full px-4 py-2 transition-transform hover:scale-105 hover:bg-emerald-600"
                        >
                          Continue
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">No enrolled courses yet</p>
                <Link href="/student/courses">
                  <Button className="mt-4 bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100">
                    Browse Courses
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Highlights Section */}
        <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-5 flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" /> Highlights
          </h2>
          <div className="space-y-4">
            <HighlightItem
              title="Welcome to Mentversity!"
              subtitle="Your new learning journey starts now."
              icon={<Star />}
            />
            <HighlightItem
              title="New Courses Added"
              subtitle="Discover the latest topics and skills."
              icon={<Sparkles />}
            />
            <HighlightItem
              title="Support Center"
              subtitle="Need help? We're here for you 24/7."
              icon={<Clock />}
            />
          </div>
          <div className="pt-6 border-t border-gray-200 mt-6">
            <Link href="/student/support">
              <Button className="w-full bg-white border border-gray-300 text-gray-700 rounded-full hover:bg-gray-100">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 mb-5">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            href="/student/courses"
            icon={<BookOpen />}
            title="Browse Courses"
            subtitle="Discover new learning paths"
          />
          <QuickAction
            href="/student/assignments"
            icon={<Clock />}
            title="Assignments"
            subtitle="View pending work"
          />
          <QuickAction
            href="/student/certificates"
            icon={<Award />}
            title="Certificates"
            subtitle="Download achievements"
          />
        </div>
      </div>
    </div>
  );
}

// Reusable component for the static stat cards
function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-white border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 group">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-gray-500 text-sm font-medium uppercase tracking-wide">
            {title}
          </span>
          <div className="text-4xl font-extrabold tracking-tight text-gray-900 mt-2">
            {value}
          </div>
        </div>
        <div className="p-3 rounded-full bg-emerald-100 transition-colors group-hover:bg-emerald-200">
          {React.cloneElement(icon as React.ReactElement, {
            className: 'h-6 w-6 text-emerald-500 transition-colors',
          })}
        </div>
      </div>
      <p className="text-sm text-gray-500 mt-2">{subtitle}</p>
    </div>
  );
}

// Updated HighlightItem component with icon prop
function HighlightItem({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center space-x-4">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
        {React.cloneElement(icon as React.ReactElement, {
          className: 'h-6 w-6 text-emerald-500',
        })}
      </div>
      <div>
        <p className="font-semibold tracking-wide text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

// Reusable component for quick actions
function QuickAction({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link href={href}>
      <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-300 cursor-pointer flex items-center space-x-4 shadow-sm hover:shadow-md">
        <div className="p-3 rounded-full bg-emerald-100 transition-colors group-hover:bg-emerald-200">
          {React.cloneElement(icon as React.ReactElement, {
            className: 'h-6 w-6 text-emerald-500 transition-colors',
          })}
        </div>
        <div>
          <p className="font-semibold tracking-wide text-gray-900">{title}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}