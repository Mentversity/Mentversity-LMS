'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, FileText, LayoutList, Download } from 'lucide-react';
import { Nunito_Sans } from 'next/font/google';
import { assignmentsApi } from '@/lib/api'; 

const nunitoSans = Nunito_Sans({ subsets: ['latin'] });

// Assuming your backend API base URL is set in an environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5000';

// Define the shape of our data types for better type safety and clarity.
// These types should match the structure returned by your new backend API.
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

// --- Assignments Page Component ---
const AssignmentsPage = () => {
  const [studentCourses, setStudentCourses] = useState<StudentAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Call the new API to get structured assignments
        const data = await assignmentsApi.getStudentAssignmentsStructured();
        setStudentCourses(data);
      } catch (err: any) {
        console.error('Failed to fetch structured assignments:', err);
        setError(err.message || 'Failed to load assignments.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  const getStatusClass = (status: string | undefined) => {
    switch (status) {
      case 'Submitted':
        return 'text-green-600 bg-green-100';
      case 'graded':
        return 'text-blue-600 bg-blue-100';
      case 'Not Submitted':
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className={`${nunitoSans.className} min-h-screen bg-gray-50 text-gray-800 flex items-center justify-center`}>
        <p className="text-xl font-medium">Loading assignments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${nunitoSans.className} min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center justify-center p-6 text-center`}>
        <FileText size={48} className="mb-4 text-red-500" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Assignments</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 rounded-full font-semibold text-white transition-colors bg-[#05d6ac] hover:bg-[#04b895] shadow-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`${nunitoSans.className} min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10`}>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-8 text-center text-gray-900">My Assignments</h1>
      <p className="text-center text-gray-600 mb-10">
        Review assignments across all your enrolled courses.
      </p>

      {studentCourses?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-gray-400">
          <FileText size={48} className="mb-4" />
          <p className="text-lg">No assignments available at this time or you are not enrolled in any courses with assignments.</p>
          <Link href="/student/courses" passHref>
            <button className="mt-6 px-6 py-2 rounded-full font-semibold text-white transition-colors bg-[#05d6ac] hover:bg-[#04b895] shadow-md">
              Browse Courses
            </button>
          </Link>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto space-y-6">
          {studentCourses?.map((course) => (
            <details
              key={course.id}
              open={expandedCourse === course.id}
              onToggle={(e) => setExpandedCourse(e.currentTarget.open ? course.id : null)}
              className="group transition-all duration-300 rounded-xl overflow-hidden shadow-sm hover:shadow-lg bg-white border border-gray-200"
            >
              <summary className="flex justify-between items-center p-4 md:p-6 cursor-pointer">
                <h2 className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-[#05d6ac] transition-colors">
                  {course.title}
                </h2>
                <ChevronDown className="h-6 w-6 text-gray-400 group-hover:text-[#05d6ac] transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <div className="p-4 md:p-6 bg-gray-50 space-y-4">
                {course.modules.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No modules with assignments in this course.</div>
                ) : (
                  course.modules.map((module) => {
                    const assignmentsInModule = module.topics.filter(t => t.assignment);
                    if (assignmentsInModule.length === 0) return null;

                    return (
                      <details key={module.id} className="group transition-all duration-300 rounded-lg overflow-hidden border border-gray-200 bg-white">
                        <summary className="flex justify-between items-center p-3 cursor-pointer">
                          <h3 className="text-lg font-medium tracking-wide text-gray-800 group-hover:text-[#05d6ac] transition-colors">
                            <LayoutList className="inline-block h-5 w-5 mr-2 text-gray-500" />
                            {module.title}
                          </h3>
                          <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-[#05d6ac] transition-transform duration-300 group-open:rotate-180" />
                        </summary>
                        <div className="p-3 bg-gray-100 space-y-3">
                          {assignmentsInModule.map((topic) => topic.assignment && (
                            <div key={topic.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                              <div>
                                <p className="font-semibold text-gray-800">{topic.assignment.title || topic.title}</p>
                                {topic.assignment.description && (
                                  <p className="text-sm text-gray-600 mt-1">{topic.assignment.description}</p>
                                )}
                                <span
                                  className={`text-xs uppercase font-medium tracking-tight mt-2 inline-block py-1 px-2 rounded-full ${getStatusClass(topic.assignment.studentSubmission?.status)}`}
                                >
                                  Status: {topic.assignment.studentSubmission?.status || 'Not Submitted'}
                                </span>
                                {topic.assignment.studentSubmission?.grade && (
                                  <span className="text-xs uppercase font-medium tracking-tight mt-2 ml-2 inline-block py-1 px-2 rounded-full bg-blue-100 text-blue-600">
                                    Grade: {topic.assignment.studentSubmission.grade}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
                                {topic.assignment.fileUrl && (
                                  <a
                                    href={`${API_BASE_URL}${topic.assignment.fileUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center px-4 py-2 rounded-full font-semibold text-[#05d6ac] border border-[#05d6ac] hover:bg-[#05d6ac]/10 transition-colors text-sm whitespace-nowrap"
                                  >
                                    <Download className="h-4 w-4 mr-1" /> Template
                                  </a>
                                )}
                                <Link href={`/student/courses/${course.id}?topicId=${topic.id}`} passHref>
                                  <button className="px-6 py-2 rounded-full font-semibold text-white transition-all duration-300 hover:scale-105 bg-[#05d6ac] hover:bg-[#04b895] shadow-md text-sm whitespace-nowrap">
                                    View Details
                                  </button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    );
                  })
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignmentsPage;