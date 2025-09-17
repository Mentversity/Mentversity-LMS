'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Nunito_Sans } from 'next/font/google';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

// Define types for Course
type Course = {
  _id: string;
  title: string;
};

type RegisterStudentFormProps = {
  availableCourses: Course[];
  onSubmit: (data: {
    email: string;
    password?: string;
    name?: string;
    selectedCourseIds: string[];
    mode: 'new' | 'update';
  }) => void;
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
};

export default function RegisterStudentForm({
  availableCourses,
  onSubmit,
  isSubmitting,
  error,
  successMessage,
}: RegisterStudentFormProps) {
  const [tab, setTab] = useState<'new' | 'update'>('new');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  // Reset form after success
  useEffect(() => {
    if (successMessage) {
      setEmail('');
      setPassword('');
      setName('');
      setSelectedCourseIds([]);
    }
  }, [successMessage]);

  const handleCheckboxChange = (courseId: string, isChecked: boolean) => {
    setSelectedCourseIds((prev) =>
      isChecked ? [...prev, courseId] : prev.filter((id) => id !== courseId)
    );
  };

  // Password validation rules
  const rules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password),
  };
  const allValid = Object.values(rules).every(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'new' && !allValid) return;
    onSubmit({ email, password, name, selectedCourseIds, mode: tab });
  };

  const RuleItem = ({ valid, text }: { valid: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {valid ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-400" />
      )}
      <span className={valid ? 'text-green-600' : 'text-gray-500'}>{text}</span>
    </div>
  );

  return (
    <div className={`${nunitoSans.className} p-6 rounded-2xl bg-white shadow-md border border-gray-200`}>
      <Tabs defaultValue="new" value={tab} onValueChange={(val) => setTab(val as 'new' | 'update')}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="new" className="data-[state=active]:bg-[#00404a] data-[state=active]:text-white">New Student</TabsTrigger>
          <TabsTrigger value="update" className="data-[state=active]:bg-[#00404a] data-[state=active]:text-white">Update Student</TabsTrigger>
        </TabsList>
        

        {/* NEW STUDENT FORM */}
        <TabsContent value="new">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email + Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Student Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="student@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="rounded-full bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Student Name (Optional)
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-full bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors duration-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                Password (Required for new students)
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-full bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors duration-300"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-emerald-500 transition-colors duration-200 rounded-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>

              {/* Inline password rules */}
              <div className="mt-2 space-y-1">
                <RuleItem valid={rules.length} text="At least 8 characters" />
                <RuleItem valid={rules.upper} text="At least 1 uppercase letter" />
                <RuleItem valid={rules.lower} text="At least 1 lowercase letter" />
                <RuleItem valid={rules.number} text="At least 1 number" />
                <RuleItem valid={rules.special} text="At least 1 special character (@$!%*?&)" />
              </div>

              <p className="text-xs text-gray-500 font-light">
                Leave blank to keep current password for existing users. Required for new registrations.
              </p>
            </div>

            <Separator className="bg-gray-200" />

            {/* Courses */}
            <CourseSelection
              availableCourses={availableCourses}
              selectedCourseIds={selectedCourseIds}
              handleCheckboxChange={handleCheckboxChange}
              isSubmitting={isSubmitting}
            />

            {/* Error & Success */}
            <Feedback error={error} successMessage={successMessage} />

            {/* Submit */}
            <SubmitButton isSubmitting={isSubmitting} disabled={!allValid} />
          </form>
        </TabsContent>

        {/* UPDATE STUDENT FORM */}
        <TabsContent value="update">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email only */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                Student Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className="rounded-full bg-gray-50 text-gray-900 placeholder:text-gray-400 border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors duration-300"
              />
            </div>

            <Separator className="bg-gray-200" />

            {/* Courses */}
            <CourseSelection
              availableCourses={availableCourses}
              selectedCourseIds={selectedCourseIds}
              handleCheckboxChange={handleCheckboxChange}
              isSubmitting={isSubmitting}
            />

            {/* Error & Success */}
            <Feedback error={error} successMessage={successMessage} />

            {/* Submit */}
            <SubmitButton isSubmitting={isSubmitting} disabled={false} />
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Reusable components
function CourseSelection({
  availableCourses,
  selectedCourseIds,
  handleCheckboxChange,
  isSubmitting,
}: {
  availableCourses: Course[];
  selectedCourseIds: string[];
  handleCheckboxChange: (courseId: string, isChecked: boolean) => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="space-y-3">
      <Label className="text-base text-gray-900 font-bold">Enroll in Courses</Label>
      {availableCourses.length === 0 ? (
        <p className="text-sm text-gray-500 font-light">
          No courses available for enrollment.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
          {availableCourses.map((course) => (
            <div key={course._id} className="flex items-center space-x-2">
              <Checkbox
                id={`course-${course._id}`}
                checked={selectedCourseIds.includes(course._id)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(course._id, !!checked)
                }
                disabled={isSubmitting}
                className="rounded-md border border-gray-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:text-white transition-all duration-200"
              />
              <label
                htmlFor={`course-${course._id}`}
                className="text-sm font-medium leading-none text-gray-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {course.title}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Feedback({ error, successMessage }: { error: string | null; successMessage: string | null }) {
  return (
    <>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200 shadow-sm">
          {error}
        </p>
      )}
      {successMessage && (
        <p className="text-sm text-emerald-600 bg-emerald-50 p-3 rounded-md border border-emerald-200 shadow-sm">
          {successMessage}
        </p>
      )}
    </>
  );
}

function SubmitButton({ isSubmitting, disabled }: { isSubmitting: boolean; disabled: boolean }) {
  return (
    <Button
      type="submit"
      className="w-full rounded-full font-bold text-white bg-[#00404a] transition-all duration-300 hover:scale-[1.01] hover:bg-[#005965] shadow-md"
      disabled={isSubmitting || disabled}
    >
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        'Submit'
      )}
    </Button>
  );
}
