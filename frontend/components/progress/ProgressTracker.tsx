'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Course, Progress as ProgressType } from '@/types';
import {
  CheckCircle,
  Clock,
  BookOpen,
  TrendingUp,
  Award,
  Target,
} from 'lucide-react';
import { Inter, Manrope, Nunito_Sans } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

interface ProgressTrackerProps {
  course: Course;
  progress: ProgressType;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  course,
  progress,
}) => {
  const totalModules = course.modules.length;
  const completedModules = course.modules.filter((module) =>
    module.topics.every((topic) => progress.completedTopics.includes(topic.id))
  ).length;

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className={`${inter.className} space-y-6`}>
      {/* Overall Progress */}
      <Card className="w-full bg-white shadow-[0_4px_8px_rgba(0,0,0,0.05)] border border-gray-200 rounded-[16px] text-gray-900">
        <CardHeader className="px-6 py-4">
          <CardTitle className="flex items-center space-x-2 text-gray-900 font-bold tracking-tight">
            <TrendingUp className="h-5 w-5 text-[#05d6ac]" />
            <span className="text-lg">Course Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <div className="flex items-end justify-between">
            <span className="text-4xl font-bold text-gray-900 leading-none">
              {Math.round(progress.completionPercentage)}%
            </span>
            <Badge
              className={
                progress.completionPercentage === 100
                  ? 'bg-[#05d6ac] text-white font-semibold px-3 py-1 rounded-full'
                  : 'bg-gray-100 text-gray-600 font-medium px-3 py-1 rounded-full'
              }
            >
              {progress.completionPercentage === 100 ? 'Completed' : 'In Progress'}
            </Badge>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300 ease-out"
              style={{
                width: `${progress.completionPercentage}%`,
                backgroundColor: '#05d6ac',
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm font-normal">
            <div className="flex items-center space-x-2 text-gray-500">
              <CheckCircle className="h-4 w-4 text-[#05d6ac]" />
              <span>{progress.completedTopics.length} of {progress.totalTopics} lessons</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-500">
              <Clock className="h-4 w-4 text-[#05d6ac]" />
              <span>{formatTime(progress.timeSpent)} spent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Module Progress */}
      <Card className="w-full bg-white shadow-[0_4px_8px_rgba(0,0,0,0.05)] border border-gray-200 rounded-[16px] text-gray-900">
        <CardHeader className="px-6 py-4">
          <CardTitle className="flex items-center space-x-2 text-gray-900 font-bold tracking-tight">
            <BookOpen className="h-5 w-5 text-[#05d6ac]" />
            <span className="text-lg">Module Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          {course.modules.map((module) => {
            const moduleTopics = module.topics;
            const completedInModule = moduleTopics.filter((topic) =>
              progress.completedTopics.includes(topic.id)
            ).length;
            const moduleProgress = (completedInModule / moduleTopics.length) * 100;
            const isCompleted = moduleProgress === 100;

            return (
              <div key={module.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-[#05d6ac]" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                    <span className="font-semibold">{module.title}</span>
                  </div>
                  <span className="text-sm text-gray-500 font-light">
                    {completedInModule}/{moduleTopics.length}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${moduleProgress}%`,
                      backgroundColor: '#05d6ac',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Achievements */}
      {progress.completionPercentage >= 25 && (
        <Card className="w-full bg-white shadow-[0_4px_8px_rgba(0,0,0,0.05)] border border-gray-200 rounded-[16px] text-gray-900">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center space-x-2 text-gray-900 font-bold tracking-tight">
              <Award className="h-5 w-5 text-[#05d6ac]" />
              <span className="text-lg">Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progress.completionPercentage >= 25 && (
                <div className="flex items-center space-x-3 text-sm">
                  <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                    <Target className="h-5 w-5 text-[#05d6ac]" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">Getting Started</p>
                    <p className="text-gray-500 text-xs">25% Complete</p>
                  </div>
                </div>
              )}
              {progress.completionPercentage >= 50 && (
                <div className="flex items-center space-x-3 text-sm">
                  <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                    <TrendingUp className="h-5 w-5 text-[#05d6ac]" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">Halfway There</p>
                    <p className="text-gray-500 text-xs">50% Complete</p>
                  </div>
                </div>
              )}
              {progress.completionPercentage >= 75 && (
                <div className="flex items-center space-x-3 text-sm">
                  <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                    <Award className="h-5 w-5 text-[#05d6ac]" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">Almost Done</p>
                    <p className="text-gray-500 text-xs">75% Complete</p>
                  </div>
                </div>
              )}
              {progress.completionPercentage === 100 && (
                <div className="flex items-center space-x-3 text-sm">
                  <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                    <CheckCircle className="h-5 w-5 text-[#05d6ac]" />
                  </div>
                  <div>
                    <p className="font-semibold leading-tight">Course Complete!</p>
                    <p className="text-gray-500 text-xs">100% Complete</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};