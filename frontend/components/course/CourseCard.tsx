'use client';

import React from 'react';
import Link from 'next/link';
import { Course } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Clock,
  Users,
  Star,
  PlayCircle,
  BookOpen,
} from 'lucide-react';
import { Nunito_Sans } from 'next/font/google';
import Image from 'next/image';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

interface CourseCardProps {
  course: Partial<Course>; // allow partial so missing fields won't break
  userRole: 'admin' | 'student';
  progress?: number;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  course,
  userRole,
  progress,
}) => {
  const getLevelColor = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-500 text-white';
      case 'intermediate':
        return 'bg-yellow-500 text-white';
      case 'advanced':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  console.log('CourseCard course:', course);  
  console.log('CourseCard userRole:', userRole);  
  console.log('CourseCard progress:', progress);

  const baseUrl = userRole === 'admin' ? '/admin/courses' : '/student/courses';

  // Fallback values
  const title = course?.title || 'Untitled Course';
  const description = course?.description || 'No description available.';
  const level = course?.level || 'Unknown';
  const rating = course?.rating ?? 0;
  const duration = course?.duration || 'N/A';
  const studentsCount = course?.enrolledStudents.length ?? 0;
  const modulesCount = course?.modules?.length ?? 0;
  const instructor = course?.instructor || 'Unknown Instructor';
  const price = course?.price ?? 0;
  const courseId = course?._id || 'unknown-id';

  // Avatar initials
  const avatarInitials = instructor
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'NA';

  return (
    <Card className={`${nunitoSans.className} group bg-white text-gray-900 border border-gray-200 shadow-sm rounded-2xl hover:shadow-lg transition-all duration-300 overflow-hidden hover:-translate-y-1`}>
      {/* Course Thumbnail / Icon */}
      <div className="relative">
        <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-t-2xl">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail.url || '/placeholder-course.png'} // Fallback image if no thumbnail
              alt={title} 
              width={640}
              height={360}  
              priority  

            />
          ) : (
            <BookOpen className="h-16 w-16 text-gray-400" />
          )}
        </div>
        {progress !== undefined && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-emerald-100 text-emerald-600 font-semibold tracking-wide">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
        )}
      </div>

      {/* Course Info */}
      <CardHeader className="p-5 pb-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Badge className={`rounded-full px-3 py-1 text-xs font-semibold ${getLevelColor(level)}`}>
              {level}
            </Badge>
            <div className="flex items-center space-x-1 text-sm text-gray-500">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{rating}</span>
            </div>
          </div>
          <h3 className="font-bold tracking-tight text-xl line-clamp-2 text-gray-900">
            {title}
          </h3>
          <p className="text-sm text-gray-500 font-normal line-clamp-2">
            {description}
          </p>
        </div>
      </CardHeader>

      {/* Course Stats */}
      <CardContent className="px-5 pb-3">
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600 font-medium">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span>{duration}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span>{studentsCount.toLocaleString()} Students</span>
          </div>
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-gray-400" />
            <span>{modulesCount} Modules</span>
          </div>
        </div>

        {/* Instructor */}
        <div className="flex items-center space-x-3 mt-4">
          <Avatar className="h-10 w-10">
            {course?.instructorImage ? (
              <AvatarImage src={course.instructorImage} alt={instructor} />
            ) : (
              <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-semibold rounded-full">{avatarInitials}</AvatarFallback>
            )}
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-gray-900">{instructor}</p>
            <p className="text-xs text-gray-500">Instructor</p>
          </div>
        </div>

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 font-medium">Progress</span>
              <span className="font-semibold text-emerald-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer Buttons */}
      <CardFooter className="p-5 pt-0">
        <div className="flex items-center justify-between w-full">

          <div className="ml-auto">
            <Link href={`${baseUrl}/${courseId}`}>
              <Button
                className="font-semibold rounded-full px-5 py-3 shadow-md transition-transform hover:scale-105"
                variant={userRole === 'admin' ? 'default' : 'outline'}
                style={userRole === 'admin' ? { backgroundColor: 'transparent', borderColor: 'transparent', color: 'white' } : { backgroundColor: 'transparent', borderColor: 'transparent', color: 'transparent' }} // Keep this as a placeholder, actual styling is applied via Tailwind classes below
              >
                {/* Visual styling applied here */}
                {userRole === 'admin' ? (
                  <span className="bg-emerald-500 text-white rounded-full px-5 py-3 hover:bg-emerald-600 transition-colors">Manage</span>
                ) : progress !== undefined ? (
                  <span className="bg-emerald-500 text-white rounded-full px-5 py-3 hover:bg-emerald-600 transition-colors">Continue</span>
                ) : (
                  <span className="bg-emerald-500 text-white rounded-full px-5 py-3 hover:bg-emerald-600 transition-colors">Start Learning</span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};