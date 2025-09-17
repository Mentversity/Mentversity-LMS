'use client';

import React from 'react';
import Link from 'next/link';
import { Course } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Users, Star, BookOpen, Tag } from 'lucide-react';
import { Nunito } from 'next/font/google';
import Image from 'next/image';

const nunitoSans = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

interface CourseCardProps {
  course: Partial<Course>;
  userRole: 'admin' | 'student' | 'trainer';
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
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-700 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const url =
    userRole === 'student'
      ? `/student/courses/${course._id}`
      : userRole === 'trainer'
      ? `/trainer/courses/${course._id}`
      : `/admin/courses/${course._id}`;

  const title = course?.title || 'Untitled Course';
  const description = course?.description || 'No description available.';
  const studentsCount = course?.enrolledStudents?.length ?? 0;
  const category = course?.category || 'Uncategorized';
  const level = course?.level || 'N/A';

  const trainers = Array.isArray(course.trainers) ? course.trainers : [];

  return (
    <Card
      className={`${nunitoSans.className} group bg-white text-gray-900 border border-gray-200 shadow-sm rounded-2xl hover:shadow-lg transition-all duration-300 overflow-hidden hover:-translate-y-1`}
    >
      {/* Thumbnail */}
      <div className="relative">
        <div className="aspect-video bg-gray-100 flex items-center justify-center rounded-t-2xl overflow-hidden">
          {course.thumbnail ? (
            <Image
              src={course.thumbnail.url || '/placeholder-course.png'}
              alt={title}
              width={640}
              height={360}
              className="object-cover w-full h-full"
              priority
            />
          ) : (
            <BookOpen className="h-16 w-16 text-gray-400" />
          )}
        </div>

        {/* Progress Badge */}
        {progress !== undefined && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-emerald-100 text-emerald-700 font-semibold tracking-wide shadow-md">
              {Math.round(progress)}% Complete
            </Badge>
          </div>
        )}
      </div>

      {/* Info */}
      <CardHeader className="p-5 pb-3">
        <div className="space-y-3">
          <h3 className="font-bold tracking-tight text-xl line-clamp-2 text-gray-900">
            {title}
          </h3>
          <p className="text-sm text-gray-500 font-normal line-clamp-2">
            {description}
          </p>

          {/* Category + Level */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-blue-100 text-blue-700 border border-blue-200">
              <Tag className="h-3 w-3 mr-1" />
              {category}
            </Badge>
            <Badge className={getLevelColor(level)}>{level}</Badge>
          </div>
        </div>
      </CardHeader>

      {/* Stats */}
      <CardContent className="px-5 pb-3">
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm text-gray-600 font-medium">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-gray-400" />
            <span>{studentsCount.toLocaleString()} Students</span>
          </div>
        </div>

        {/* Trainers */}
        {trainers.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">Trainers</p>
            <div className="flex flex-wrap gap-3">
              {trainers.map((t: any, idx: number) => {
                const initials =
                  t?.name
                    ?.split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase() || 'NA';
                return (
                  <div key={idx} className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      {t?.profilePic ? (
                        <AvatarImage src={t.profilePic} alt={t.name} />
                      ) : (
                        <AvatarFallback className="bg-gray-200 text-gray-600 text-xs font-semibold rounded-full">
                          {initials}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <span className="text-sm text-gray-700">{t?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600 font-medium">Progress</span>
              <span className="font-semibold text-emerald-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#00404a] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="p-5 pt-0">
        <div className="flex items-center justify-between w-full">
          <div className="ml-auto">
            <Link href={url}>
              <Button className="font-semibold rounded-full px-5 py-3 shadow-md transition-transform hover:scale-105 bg-[#00404a] text-white hover:bg-[#005965]">
                {userRole === 'admin' || userRole === 'trainer' ? (
                  <span>Manage</span>
                ) : progress !== undefined ? (
                  <span>Continue</span>
                ) : (
                  <span>Start Learning</span>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};
