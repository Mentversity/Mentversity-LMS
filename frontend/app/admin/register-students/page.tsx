'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi, authApi } from '@/lib/api'; // Import authApi and coursesApi
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, ArrowLeft } from 'lucide-react';
import RegisterStudentForm from '@/components/admin/RegisterStudentForm'; // Import the form component
import { Nunito_Sans } from 'next/font/google';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

// Define types for Course and User (ensure these match your backend models)
type Course = {
  _id: string;
  title: string;
};

type UserResponse = {
  id: string;
  name: string;
  email: string;
  role: string;
  enrolledCourses?: string[];
};

export default function AdminRegisterStudentPage() {
  const router = useRouter();
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch all available courses for the multi-select dropdown
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesApi.getAll();
        // Assuming response.data contains the array of courses
        setAvailableCourses(response.data.courses || response.data || []);
      } catch (err: any) {
        console.error('Failed to fetch courses:', err);
        setError('Failed to load courses for enrollment. Please try again.');
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  const handleSubmit = async ({ email, password, name, selectedCourseIds }: {
    email: string;
    password?: string;
    name?: string;
    selectedCourseIds: string[];
  }) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response: { user: UserResponse; message: string } = await authApi.registerStudent(
        email,
        password,
        name,
        selectedCourseIds
      );
      setSuccessMessage(response.message || 'Student registered/enrolled successfully!');
      // Optionally redirect or clear form after success
      // router.push('/admin/students'); // Or wherever your student list is
    } catch (err: any) {
      console.error('Registration/Enrollment failed:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to register/enroll student.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        setError(null);
        setSuccessMessage(null);
      }, 5000); // Clear messages after 5 seconds
    }
  };

  return (
    <div className={`${nunitoSans.className} container mx-auto p-4 md:p-6 lg:p-8 bg-gray-100 min-h-screen text-gray-900`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 bg-emerald-500 rounded-full shadow-md">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          Register New Student
        </h1>
        <Button onClick={() => router.push('/admin/dashboard')} variant="ghost" className="rounded-full px-6 py-2 border border-gray-200 text-gray-600 hover:bg-gray-200 hover:border-gray-300 transition-colors duration-300">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
        </Button>
      </div>

      <Card className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">Student Information & Enrollment</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCourses ? (
            <div className="flex items-center justify-center py-8 text-gray-500 font-normal">
              <Loader2 className="h-6 w-6 animate-spin mr-3 text-gray-400" />
              Loading courses...
            </div>
          ) : (
            <RegisterStudentForm
              availableCourses={availableCourses}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              error={error}
              successMessage={successMessage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}