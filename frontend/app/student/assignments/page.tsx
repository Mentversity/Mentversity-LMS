'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  FileText,
  LayoutList,
  Download,
} from 'lucide-react';
import { Nunito_Sans } from 'next/font/google';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts';
import { assignmentsApi } from '@/lib/api';

const nunitoSans = Nunito_Sans({ subsets: ['latin'] });

// --- Types ---
type StudentAssignment = {
  id: string;
  title: string;
  modules: {
    id: string;
    title: string;
    topics: {
      id: string;
      title: string;
      assignment?: {
        fileUrl?: string;
        title?: string;
        description?: string;
        studentSubmission?: {
          status: string;
          fileUrl?: string;
          grade?: number;
          feedback?: string;
          submittedAt?: string;
        } | null;
      } | null;
    }[];
  }[];
};

// API base for file downloads
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
  : 'http://localhost:5000';

// --- Assignments Page Component ---
const AssignmentsPage = () => {
  const [studentCourses, setStudentCourses] = useState<StudentAssignment[]>([]);
  const [completionRates, setCompletionRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  // Fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      try {
        const data = await assignmentsApi.getStudentAssignmentsStructured();
        console.log('Fetched structured assignments:', data);
        setStudentCourses(data);

        // Fetch completion % for each course
        const rates: Record<string, number> = {};
        for (const c of data) {
          try {
            const res = await assignmentsApi.getAssignmentsCompletion(c._id);
            console.log(`Completion for course ${c._id}:`, res.data.student.completionRate);
            rates[c._id] = res.data.student.completionRate;
          } catch {
            rates[c._id] = 0;
          }
        }
        setCompletionRates(rates);
      } catch (err: any) {
        console.error('Failed to fetch structured assignments:', err);
        setError(err.message || 'Failed to load assignments.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  // Status badges
  const getStatusClass = (status: string | undefined) => {
    switch (status) {
      case 'Submitted':
        return 'bg-green-100 text-green-600';
      case 'graded':
        return 'bg-blue-100 text-blue-600';
      case 'Not Submitted':
      case 'pending':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Semi-circle chart renderer
  const renderProgressChart = (value: number) => {
    const data = [{ name: 'Completion', value, fill: '#00C49F' }];
    return (
      <RadialBarChart
        width={180}
        height={100}
        innerRadius="70%"
        outerRadius="100%"
        data={data}
        startAngle={180}
        endAngle={0}
      >
        <PolarAngleAxis
          type="number"
          domain={[0, 100]}
          tick={false}
        />
        <RadialBar
          minAngle={15}
          clockWise
          dataKey="value"
          cornerRadius={10}
        />
        <text
          x={90}
          y={60}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-gray-800 font-bold text-lg"
        >
          {value}%
        </text>
      </RadialBarChart>
    );
  };

  // --- UI States ---
  if (isLoading) {
    return (
      <div
        className={`${nunitoSans.className} min-h-screen bg-gray-50 text-gray-800 flex items-center justify-center`}
      >
        <p className="text-xl font-medium">Loading assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${nunitoSans.className} min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center justify-center p-6 text-center`}
      >
        <FileText size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Error Loading Assignments
        </h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-full font-semibold text-white transition-colors bg-[#00404a] hover:bg-[#04b895] shadow-md"
        >
          Retry
        </button>
      </div>
    );
  }

  // --- Main UI ---
  return (
    <div
      className={`${nunitoSans.className} min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10`}
    >
      <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center">
        🎓 My Assignments Dashboard
      </h1>
      <p className="text-center text-gray-600 mb-10">
        Track your progress and manage all assignments from one place.
      </p>

      {studentCourses?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-gray-400">
          <FileText size={48} className="mb-4" />
          <p className="text-lg">
            No assignments available at this time or you are not enrolled in
            any courses with assignments.
          </p>
          <Link href="/student/courses" passHref>
            <button className="mt-6 px-6 py-2 rounded-full font-semibold text-white transition-colors bg-[#00404a] hover:bg-[#04b895] shadow-md">
              Browse Courses
            </button>
          </Link>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto space-y-8">
          {studentCourses?.map((course) => (
            <div
              key={course.id}
              className="bg-white shadow rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-6">
                {/* Left: Course Title */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {course.title}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Completion overview of your assignments.
                  </p>
                </div>

                {/* Right: Semi-circle progress */}
                <div>{renderProgressChart(completionRates[course._id] || 0)}</div>
              </div>

              {/* Expandable Assignments */}
              <details
                open={expandedCourse === course.id}
                onToggle={(e) =>
                  setExpandedCourse(e.currentTarget.open ? course.id : null)
                }
                className="group border-t border-gray-200"
              >
                <summary className="flex justify-between items-center px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="font-semibold text-gray-800">
                    View Assignments
                  </span>
                  <ChevronDown className="h-5 w-5 text-gray-500 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="bg-gray-50 p-6 space-y-4">
                  {course.modules.flatMap((module) =>
                    module.topics
                      .filter((t) => t.assignment)
                      .map((topic) => (
                        <div
                          key={topic.id}
                          className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">
                              {topic.assignment?.title || topic.title}
                            </p>
                            {topic.assignment?.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {topic.assignment.description}
                              </p>
                            )}
                            <span
                              className={`text-xs mt-2 inline-block px-2 py-1 rounded-full font-medium ${getStatusClass(
                                topic.assignment?.studentSubmission?.status
                              )}`}
                            >
                              Status:{' '}
                              {topic.assignment?.studentSubmission?.status ||
                                'Not Submitted'}
                            </span>
                            {topic.assignment?.studentSubmission?.grade && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full font-medium">
                                Grade:{' '}
                                {topic.assignment.studentSubmission.grade}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                            {topic.assignment?.fileUrl && (
                              <a
                                href={`${API_BASE_URL}${topic.assignment.fileUrl}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-4 py-2 rounded-full font-semibold text-[#00404a] border border-[#00404a] hover:bg-[#00404a]/10 transition-colors text-sm"
                              >
                                <Download className="h-4 w-4 mr-1" /> Template
                              </a>
                            )}
                            <Link
                              href={`/student/courses/${course.id}?topicId=${topic.id}`}
                              passHref
                            >
                              <button className="px-6 py-2 rounded-full font-semibold text-white bg-[#00404a] hover:bg-[#04b895] shadow-md text-sm transition-all duration-300 hover:scale-105">
                                View Details
                              </button>
                            </Link>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;
