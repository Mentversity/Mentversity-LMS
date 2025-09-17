'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { coursesApi, authApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus, Users } from 'lucide-react';
import RegisterStudentForm from '@/components/admin/RegisterStudentForm';
import RegisterTrainerForm from '@/components/admin/RegisterTrainerForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Nunito } from 'next/font/google';

const nunitoSans = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

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
  assignedCourses?: string[];
};

export default function AdminRegisterPage() {
  const router = useRouter();
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Admin User Registration - Mentversity";
  })

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await coursesApi.getAll();
        setAvailableCourses(response.data.courses || response.data || []);
      } catch (err: any) {
        console.error('Failed to fetch courses:', err);
        setError('Failed to load courses. Please try again.');
      } finally {
        setIsLoadingCourses(false);
      }
    };
    fetchCourses();
  }, []);

  // Handle student registration
  const handleStudentSubmit = async ({ email, password, name, selectedCourseIds }: {
    email: string; password?: string; name?: string; selectedCourseIds: string[];
  }) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response: { user: UserResponse; message: string } =
        await authApi.registerStudent(email, password, name, selectedCourseIds);
      setSuccessMessage(response.message || 'Student registered successfully!');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to register student.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => { setError(null); setSuccessMessage(null); }, 5000);
    }
  };

  // Handle trainer registration
  const handleTrainerSubmit = async ({ email, password, name, assignedCourseIds }: {
    email: string; password?: string; name?: string; assignedCourseIds: string[];
  }) => {
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const response: { user: UserResponse; message: string } =
        await authApi.registerTrainer(email, password, name, assignedCourseIds);
      setSuccessMessage(response.message || 'Trainer registered successfully!');
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to register trainer.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => { setError(null); setSuccessMessage(null); }, 5000);
    }
  };

  return (
    <div className={`${nunitoSans.className} container mx-auto p-6 bg-gray-100 min-h-screen`}>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <UserPlus className="h-6 w-6 text-[#00404a]" />
          Register Users
        </h1>
        <Button onClick={() => router.push('/admin/dashboard')} variant="ghost">
          Back to Dashboard
        </Button>
      </div>

      <Card className="max-w-3xl mx-auto bg-white shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-gray-900">Manage Registrations</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCourses ? (
            <div className="flex justify-center items-center py-8 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading courses...
            </div>
          ) : (
            <Tabs defaultValue="student" className="w-full">
              <TabsList className="grid grid-cols-2 w-full mb-6">
                <TabsTrigger value="student" className="data-[state=active]:bg-[#00404a] data-[state=active]:text-white">Register Student</TabsTrigger>
                <TabsTrigger value="trainer" className="data-[state=active]:bg-[#00404a] data-[state=active]:text-white">Register Trainer</TabsTrigger>
              </TabsList>
              <TabsContent value="student">
                <RegisterStudentForm
                  availableCourses={availableCourses}
                  onSubmit={handleStudentSubmit}
                  isSubmitting={isSubmitting}
                  error={error}
                  successMessage={successMessage}
                />
              </TabsContent>
              <TabsContent value="trainer">
                <RegisterTrainerForm
                  availableCourses={availableCourses}
                  onSubmit={handleTrainerSubmit}
                  isSubmitting={isSubmitting}
                  error={error}
                  successMessage={successMessage}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
