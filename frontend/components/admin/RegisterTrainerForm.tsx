'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Nunito_Sans } from 'next/font/google';

const nunitoSans = Nunito_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
});

type Course = {
  _id: string;
  title: string;
};

type RegisterTrainerFormProps = {
  availableCourses: Course[];
  onSubmitNew: (data: {
    email: string;
    password: string;
    name?: string;
    assignedCourseIds: string[];
  }) => void;
  onSubmitUpdate: (data: {
    email: string;
    assignedCourseIds: string[];
  }) => void;
  isSubmitting: boolean;
  error: string | null;
  successMessage: string | null;
};

export default function RegisterTrainerForm({
  availableCourses,
  onSubmitNew,
  onSubmitUpdate,
  isSubmitting,
  error,
  successMessage,
}: RegisterTrainerFormProps) {
  const [activeTab, setActiveTab] = useState<'new' | 'update'>('new');

  // Common states
  const [email, setEmail] = useState('');
  const [assignedCourseIds, setAssignedCourseIds] = useState<string[]>([]);

  // New trainer specific
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (successMessage) {
      setEmail('');
      setPassword('');
      setName('');
      setAssignedCourseIds([]);
    }
  }, [successMessage]);

  const handleCheckboxChange = (courseId: string, isChecked: boolean) => {
    setAssignedCourseIds((prev) =>
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
    if (activeTab === 'new') {
      if (!allValid) return;
      onSubmitNew({ email, password, name, assignedCourseIds });
    } else {
      onSubmitUpdate({ email, assignedCourseIds });
    }
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
    <div
      className={`${nunitoSans.className} space-y-6 p-6 rounded-2xl bg-white shadow-md border border-gray-200`}
    >
      {/* Tabs */}
      <div className="flex space-x-2 mb-4">
        <Button
          type="button"
          onClick={() => setActiveTab('new')}
          className={`px-4 py-2 rounded-full font-semibold ${
            activeTab === 'new'
              ? 'bg-[#00404a] text-white hover:bg-[#005965]'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          New Trainer
        </Button>
        <Button
          type="button"
          onClick={() => setActiveTab('update')}
          className={`px-4 py-2 rounded-full font-semibold ${
            activeTab === 'update'
              ? 'bg-[#00404a] text-white hover:bg-[#005965]'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Update Trainer
        </Button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email always present */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
            Trainer Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="trainer@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isSubmitting}
            className="rounded-full bg-gray-50 text-gray-900 border border-gray-200 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] transition-colors"
          />
        </div>

        {activeTab === 'new' && (
          <>
            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700"
              >
                Trainer Name (Optional)
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSubmitting}
                className="rounded-full bg-gray-50 text-gray-900 border border-gray-200 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-gray-700"
              >
                Password (Required for new trainers)
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="rounded-full bg-gray-50 text-gray-900 border border-gray-200 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] transition-colors"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-[#00404a] rounded-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>

              {/* Password rules */}
              <div className="mt-2 space-y-1">
                <RuleItem valid={rules.length} text="At least 8 characters" />
                <RuleItem valid={rules.upper} text="At least 1 uppercase letter" />
                <RuleItem valid={rules.lower} text="At least 1 lowercase letter" />
                <RuleItem valid={rules.number} text="At least 1 number" />
                <RuleItem
                  valid={rules.special}
                  text="At least 1 special character (@$!%*?&)"
                />
              </div>
            </div>
          </>
        )}

        <Separator className="bg-gray-200" />

        {/* Course Assignment */}
        <div className="space-y-3">
          <Label className="text-base text-gray-900 font-bold">
            Assign Courses to Trainer
          </Label>
          {availableCourses.length === 0 ? (
            <p className="text-sm text-gray-500">No courses available.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
              {availableCourses.map((course) => (
                <div key={course._id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`course-${course._id}`}
                    checked={assignedCourseIds.includes(course._id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(course._id, !!checked)
                    }
                    disabled={isSubmitting}
                  />
                  <label
                    htmlFor={`course-${course._id}`}
                    className="text-sm font-medium leading-none text-gray-700"
                  >
                    {course.title}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error + Success Messages */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
            {error}
          </p>
        )}
        {successMessage && (
          <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
            {successMessage}
          </p>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full rounded-full font-bold text-white bg-[#00404a] hover:bg-[#005965] transition-all disabled:opacity-50"
          disabled={
            isSubmitting || (activeTab === 'new' ? !allValid : email === '')
          }
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
            </>
          ) : activeTab === 'new' ? (
            'Register Trainer'
          ) : (
            'Update Trainer'
          )}
        </Button>
      </form>
    </div>
  );
}
