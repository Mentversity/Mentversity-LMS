'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
  Video,
  ClipboardList,
  Image,
} from 'lucide-react';
import { Inter } from 'next/font/google';

//--- API and Shadcn UI Components ---
import {
  coursesApi,
  modulesApi,
  videosApi,
  assignmentsApi,
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AlertModal from '@/components/Modal/AlertModal';

const inter = Inter({ subsets: ['latin'] });

//--- Type Definitions ---
type TopicForm = {
  title: string;
  order?: number;
  content?: string;
  videoFile?: File | null;
  assignment?: {
    title?: string;
    description?: string;
    points?: number;
    file?: File | null;
  } | null;
};

type ModuleForm = {
  title: string;
  order?: number;
  topics: TopicForm[];
};

type CourseForm = {
  title: string;
  description: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  thumbnailFile?: File | null;
  modules: ModuleForm[];
};

function getData<T = any>(resp: any): T {
  if (!resp) return resp;
  if (resp && typeof resp === 'object') {
    if ('data' in resp && resp.data && typeof resp.data === 'object') {
      return resp.data as T;
    }
  }
  return resp as T;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitProgress, setSubmitProgress] = useState<string>('');
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });
  const [form, setForm] = useState<CourseForm>({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    thumbnailFile: null,
    modules: [],
  });

  useEffect(() => {
    document.title = 'Admin Create Course - Mentversity';
  }, []);

  const steps = useMemo(
    () => [
      { id: 1, label: 'Basic Info' },
      { id: 2, label: 'Modules' },
      { id: 3, label: 'Topics & Media' },
      { id: 4, label: 'Review & Create' },
    ],
    []
  );

  const nextStep = () => setStep((s) => Math.min(s + 1, steps.length));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));
  const goToStep = (id: number) => setStep(id);

  const openModal = (
    title: string,
    message: string,
    type: 'success' | 'error' | 'info'
  ) => {
    setModalState({ isOpen: true, title, message, type });
  };

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  // ---------- Form helpers ----------
  const updateCourseField = <K extends keyof CourseForm>(
    key: K,
    value: CourseForm[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    // Handle thumbnail preview
    if (key === 'thumbnailFile' && value instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(value);
    } else if (key === 'thumbnailFile' && !value) {
      setThumbnailPreview(null);
    }
  };

  const addModule = () =>
    setForm((f) => ({
      ...f,
      modules: [
        ...f.modules,
        {
          title: '',
          order: (f.modules?.length || 0) + 1,
          topics: [],
        },
      ],
    }));

  const removeModule = (mIndex: number) =>
    setForm((f) => ({
      ...f,
      modules: f.modules.filter((_, i) => i !== mIndex),
    }));

  const updateModuleField = <K extends keyof ModuleForm>(
    mIndex: number,
    key: K,
    value: ModuleForm[K]
  ) =>
    setForm((f) => {
      const modules = [...f.modules];
      modules[mIndex] = { ...modules[mIndex], [key]: value };
      return { ...f, modules };
    });

  const addTopic = (mIndex: number) =>
    setForm((f) => {
      const modules = [...f.modules];
      const topics = modules[mIndex]?.topics || [];
      topics.push({
        title: '',
        order: topics.length + 1,
        content: '',
        videoFile: null,
        assignment: { title: '', description: '', points: 100, file: null },
      });
      modules[mIndex].topics = topics;
      return { ...f, modules };
    });

  const removeTopic = (mIndex: number, tIndex: number) =>
    setForm((f) => {
      const modules = [...f.modules];
      modules[mIndex].topics = modules[mIndex].topics.filter(
        (_, i) => i !== tIndex
      );
      return { ...f, modules };
    });

  const updateTopicField = <K extends keyof TopicForm>(
    mIndex: number,
    tIndex: number,
    key: K,
    value: TopicForm[K]
  ) =>
    setForm((f) => {
      const modules = [...f.modules];
      const topics = [...modules[mIndex].topics];
      topics[tIndex] = { ...topics[tIndex], [key]: value } as TopicForm;
      modules[mIndex].topics = topics;
      return { ...f, modules };
    });

  // ---------- Rollback helper (unchanged) ----------
  const rollbackCreated = async (created: {
    courseId?: string | null;
    moduleIds: string[];
    topicIds: string[];
    assignmentIds: string[];
  }) => {
    try {
      if (created.assignmentIds?.length) {
        for (const aid of created.assignmentIds) {
          try {
            await fetch(
              `${
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
              }/api/assignments/${aid}`,
              {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
              }
            );
          } catch (e) {
            console.warn('assignment delete failed', aid, e);
          }
        }
      }
      if (created.topicIds?.length) {
        for (const tid of created.topicIds) {
          try {
            await fetch(
              `${
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
              }/api/topics/${tid}`,
              {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
              }
            );
          } catch (e) {
            console.warn('topic delete failed', tid, e);
          }
        }
      }
      if (created.moduleIds?.length) {
        for (const mid of created.moduleIds) {
          try {
            await fetch(
              `${
                process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
              }/api/modules/${mid}`,
              {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
              }
            );
          } catch (e) {
            console.warn('module delete failed', mid, e);
          }
        }
      }
      if (created.courseId) {
        try {
          await coursesApi.delete(created.courseId);
        } catch (e) {
          console.warn('course delete failed', created.courseId, e);
        }
      }
    } catch (e) {
      console.error('Rollback failed', e);
    }
  };

  // ---------- Create flow - REFACTORED for multi-step ----------
  const handleCreate = async () => {
    if (!form.title.trim())
      return openModal('Validation Error', 'Please enter a course title.', 'error');
    if (!form.description.trim())
      return openModal('Validation Error', 'Please enter a description.', 'error');

    const created: {
      courseId?: string | null;
      moduleIds: string[];
      topicIds: string[];
      assignmentIds: string[];
    } = { courseId: null, moduleIds: [], topicIds: [], assignmentIds: [] };

    try {
      setSubmitting(true);
      setSubmitProgress('Creating course...');

      // Create FormData for course creation with thumbnail
      const courseFormData = new FormData();
      courseFormData.append('title', form.title);
      courseFormData.append('description', form.description);
      if (form.category) courseFormData.append('category', form.category);
      courseFormData.append('level', form.level || 'beginner');
      if (form.thumbnailFile) {
        courseFormData.append('thumbnail', form.thumbnailFile);
      }

      console.log('Course FormData:', Array.from(courseFormData.entries()));
      const createdCourseResp = await coursesApi.create(courseFormData);
      const createdCourseData = getData(createdCourseResp);
      const courseId =
        createdCourseData?.course?._id ||
        createdCourseData?.course?.id ||
        createdCourseData?._id ||
        createdCourseData?.id;

      if (!courseId) throw new Error('No course id returned from API.');

      created.courseId = courseId;

      for (let m = 0; m < form.modules.length; m++) {
        const mod = form.modules[m];
        setSubmitProgress(`Adding module ${m + 1}/${form.modules.length}...`);

        const createdModuleResp = await coursesApi.addModule(courseId, {
          title: mod.title,
          order: mod.order || m + 1,
        });

        const createdModuleData = getData(createdModuleResp);
        const moduleId =
          createdModuleData?.module?._id ||
          createdModuleData?.module?.id ||
          createdModuleData?._id ||
          createdModuleData?.id;

        if (!moduleId) throw new Error('No module id returned from API.');

        created.moduleIds.push(moduleId);

        for (let t = 0; t < (mod.topics || []).length; t++) {
          const top = mod.topics[t];
          setSubmitProgress(
            `Adding topic ${t + 1}/${mod.topics.length} in module ${m + 1}...`
          );

          const createdTopicResp = await modulesApi.addTopic(moduleId, {
            title: top.title,
            order: top.order || t + 1,
            content: top.content || '',
          });

          const createdTopicData = getData(createdTopicResp);
          const topicId =
            createdTopicData?.topic?._id ||
            createdTopicData?.topic?.id ||
            createdTopicData?._id ||
            createdTopicData?.id;

          if (!topicId) throw new Error('No topic id returned from API.');

          created.topicIds.push(topicId);

          if (top.videoFile instanceof File) {
            setSubmitProgress(`Uploading video for topic "${top.title}"...`);
            await videosApi.upload(topicId, top.videoFile);
          }

          const hasAssignmentMetaOrFile =
            top.assignment &&
            ((top.assignment.title?.trim() ||
              top.assignment.description?.trim() ||
              top.assignment.points) ||
              top.assignment?.file instanceof File);

          if (hasAssignmentMetaOrFile) {
            setSubmitProgress(
              `Creating assignment for topic "${top.title}"...`
            );
            const formData = new FormData();
            if (top.assignment?.title)
              formData.append('title', top.assignment.title);
            if (top.assignment?.description)
              formData.append('description', top.assignment.description);
            if (top.assignment?.points)
              formData.append('points', String(top.assignment.points));
            if (top.assignment?.file) {
              formData.append('file', top.assignment.file);
            }

            const assignmentResp = await assignmentsApi.create(
              topicId,
              formData
            );
            const assignmentData = getData(assignmentResp);
            const assignmentId =
              assignmentData?.assignment?._id ||
              assignmentData?.assignment?.id ||
              assignmentData?._id ||
              assignmentData?.id;
            if (assignmentId) {
              created.assignmentIds.push(assignmentId);
            }
          }
        }
      }

      setSubmitProgress('All done—redirecting...');
      router.push('/admin/courses');
    } catch (err: any) {
      console.error('Create flow failed:', err);
      setSubmitProgress('Error occurred—rolling back created data...');
      await rollbackCreated(created);
      openModal(
        'Creation Failed',
        err?.message ||
          'Failed to create course. Changes rolled back where possible.',
        'error'
      );
    } finally {
      setSubmitting(false);
      setSubmitProgress('');
    }
  };

  //--- UI - REDESIGNED with multi-step ---
  return (
    <div
      className={`${inter.className} p-6 md:p-10 bg-[#F4F6F9] min-h-screen text-gray-800`}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-gray-900">
            <BookOpen className="h-8 w-8 text-[#00404a]" />
            Create Course
          </h1>
          <p className="text-gray-500 font-light mt-1">
            Build a new course step by step.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* New "Go to Dashboard" Button */}
          <Button
            variant="outline"
            onClick={() => router.push('/admin/dashboard')}
            className="rounded-full bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:border-[#00404a] hover:text-[#00404a]"
          >
            Go to Dashboard
          </Button>
          {step > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={submitting}
              className="rounded-full bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:border-[#00404a] hover:text-[#00404a]"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
          {step < steps.length && (
            <Button
              onClick={nextStep}
              disabled={submitting}
              className="rounded-full bg-[#00404a] text-white font-semibold shadow-md hover:bg-[#005965] transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === steps.length && (
            <Button
              onClick={handleCreate}
              disabled={submitting}
              className="rounded-full bg-[#00404a] text-white font-semibold shadow-md hover:bg-[#005965] transition-colors"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Course'
              )}
            </Button>
          )}
        </div>
      </div>
      {/* Stepper */}
      <div className="relative w-full overflow-x-auto">
        <div className="flex items-center justify-center md:justify-between mb-8">
          {steps.map((s, idx) => {
            const active = s.id === step;
            const done = s.id < step;
            return (
              <React.Fragment key={s.id}>
                <div
                  className="flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  onClick={() => !submitting && goToStep(s.id)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                      active
                        ? 'bg-[#00404a] border-[#00404a] text-white shadow-lg'
                        : done
                        ? 'bg-[#e6f2f3] border-[#005965] text-[#005965]'
                        : 'bg-white border-gray-300 text-gray-500'
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                  </div>
                  <span
                    className={`text-sm font-medium tracking-wide ${
                      active ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-12 h-px bg-gray-300 mx-2" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      {/* Body */}
      <div className="grid grid-cols-1 gap-6">
        {step === 1 && (
          <Card className="bg-white rounded-xl shadow-md border-none">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900 font-bold tracking-tight">
                Basic Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-500 uppercase tracking-wide text-xs">
                    Course Title
                  </Label>
                  <Input
                    placeholder="e.g., Full-Stack Web Development"
                    value={form.title}
                    onChange={(e) =>
                      updateCourseField('title', e.target.value)
                    }
                    className="border-gray-300 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500 uppercase tracking-wide text-xs">
                    Category
                  </Label>
                  <Input
                    placeholder="e.g., Programming"
                    value={form.category || ''}
                    onChange={(e) =>
                      updateCourseField('category', e.target.value)
                    }
                    className="border-gray-300 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-500 uppercase tracking-wide text-xs">
                    Level
                  </Label>
                  <div className="flex gap-2">
                    {(['beginner', 'intermediate', 'advanced'] as const).map(
                      (lvl) => (
                        <Badge
                          key={lvl}
                          className={`cursor-pointer capitalize font-medium tracking-wide transition-all duration-300 text-sm py-1 px-3 ${
                            form.level === lvl
                              ? 'bg-[#00404a] text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          onClick={() => updateCourseField('level', lvl)}
                        >
                          {lvl}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              </div>
              {/* Thumbnail Upload Section */}
              <div className="space-y-4">
                <Label className="text-gray-500 uppercase tracking-wide text-xs">
                  Course Thumbnail
                </Label>
                <div className="grid md:grid-cols-2 gap-6 items-start">
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        updateCourseField(
                          'thumbnailFile',
                          e.target.files?.[0] || null
                        )
                      }
                      className="border-gray-300 rounded-lg text-gray-500 file:bg-gray-100 file:text-gray-700 file:border-none file:rounded-full file:px-4 file:py-2"
                    />
                    {form.thumbnailFile && (
                      <Badge className="bg-gray-100 text-gray-700 text-xs py-1 px-2 rounded-full border border-gray-200">
                        <Image className="h-3 w-3 mr-1" />
                        {form.thumbnailFile.name}
                      </Badge>
                    )}
                  </div>
                  {thumbnailPreview && (
                    <div className="space-y-2">
                      <Label className="text-gray-500 uppercase tracking-wide text-xs">
                        Preview
                      </Label>
                      <div className="relative w-full h-32 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                        <img
                          src={thumbnailPreview}
                          alt="Course thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-500 uppercase tracking-wide text-xs">
                  Description
                </Label>
                <Textarea
                  rows={6}
                  placeholder="What students will learn..."
                  value={form.description}
                  onChange={(e) =>
                    updateCourseField('description', e.target.value)
                  }
                  className="border-gray-300 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] rounded-lg"
                />
              </div>
            </CardContent>
          </Card>
        )}
        {step === 2 && (
          <Card className="bg-white rounded-xl shadow-md border-none">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-200">
              <CardTitle className="text-gray-900 font-bold tracking-tight">
                Modules
              </CardTitle>
              <Button
                type="button"
                onClick={addModule}
                size="sm"
                className="rounded-full bg-[#00404a] text-white hover:bg-[#005965] shadow-md transition-colors"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Module
              </Button>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {form.modules.length === 0 && (
                <div className="text-sm text-gray-500 font-light">
                  No modules yet—click "Add Module" to begin.
                </div>
              )}
              {form.modules.map((mod, mIndex) => (
                <div
                  key={`module-${mIndex}`}
                  className="border border-gray-200 rounded-xl p-4 space-y-4 bg-gray-50 shadow-sm"
                >
                  <div className="grid md:grid-cols-6 gap-4 items-end">
                    <div className="md:col-span-4 space-y-2">
                      <Label className="text-gray-500 uppercase tracking-wide text-xs">
                        Module Title
                      </Label>
                      <Input
                        placeholder={`Module ${mIndex + 1} title`}
                        value={mod.title}
                        onChange={(e) =>
                          updateModuleField(mIndex, 'title', e.target.value)
                        }
                        className="border-gray-300 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-1 space-y-2">
                      <Label className="text-gray-500 uppercase tracking-wide text-xs">
                        Order
                      </Label>
                      <Input
                        type="number"
                        min={1}
                        value={Number(mod.order || mIndex + 1)}
                        onChange={(e) =>
                          updateModuleField(
                            mIndex,
                            'order',
                            Number(e.target.value || 1)
                          )
                        }
                        className="border-gray-300 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        size="icon"
                        onClick={() => removeModule(mIndex)}
                        aria-label="Remove module"
                        className="bg-transparent border-none text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {step === 3 && (
          <Card className="bg-white rounded-xl shadow-md border-none">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900 font-bold tracking-tight">
                Topics & Media
              </CardTitle>
              <p className="text-sm text-gray-500 font-light mt-1">
                Add content and media for each topic.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              {form.modules.length === 0 ? (
                <div className="text-sm text-gray-500 font-light">
                  Please add at least one module in the previous step.
                </div>
              ) : (
                form.modules.map((mod, mIndex) => (
                  <div key={`mod-review-${mIndex}`} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold tracking-wide text-gray-800">
                        <span className="text-gray-500">Module {mIndex + 1}:</span>{' '}
                        {mod.title || '—'}
                      </div>
                      <Badge className="bg-gray-100 text-gray-600 font-light border border-gray-200">
                        Order {mod.order || mIndex + 1}
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium tracking-wide text-gray-700">
                          Topics
                        </h4>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => addTopic(mIndex)}
                          className="rounded-full border border-gray-300 text-gray-500 hover:text-[#00404a] hover:border-[#00404a] transition-colors"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Topic
                        </Button>
                      </div>
                      <div className="space-y-4">
                        {(mod.topics || []).length === 0 ? (
                          <div className="text-sm text-gray-500 font-light">
                            No topics yet—click "Add Topic" to begin.
                          </div>
                        ) : (
                          mod.topics.map((topic, tIndex) => (
                            <div
                              key={`topic-${mIndex}-${tIndex}`}
                              className="rounded-lg border border-gray-200 p-4 space-y-3 bg-gray-50 shadow-sm"
                            >
                              <div className="grid md:grid-cols-6 gap-4 items-end">
                                <div className="md:col-span-3 space-y-2">
                                  <Label className="text-gray-500 uppercase tracking-wide text-xs">
                                    Topic Title
                                  </Label>
                                  <Input
                                    placeholder={`Topic ${tIndex + 1} title`}
                                    value={topic.title}
                                    onChange={(e) =>
                                      updateTopicField(
                                        mIndex,
                                        tIndex,
                                        'title',
                                        e.target.value
                                      )
                                    }
                                    className="border-gray-300 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] rounded-lg"
                                  />
                                </div>
                                <div className="md:col-span-1 space-y-2">
                                  <Label className="text-gray-500 uppercase tracking-wide text-xs">
                                    Order
                                  </Label>
                                  <Input
                                    type="number"
                                    min={1}
                                    value={Number(topic.order || tIndex + 1)}
                                    onChange={(e) =>
                                      updateTopicField(
                                        mIndex,
                                        tIndex,
                                        'order',
                                        Number(e.target.value || 1)
                                      )
                                    }
                                    className="border-gray-300 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] rounded-lg"
                                  />
                                </div>
                                <div className="md:col-span-2 flex justify-end">
                                  <Button
                                    type="button"
                                    size="icon"
                                    onClick={() => removeTopic(mIndex, tIndex)}
                                    aria-label="Remove topic"
                                    className="bg-transparent border-none text-red-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                                  >
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-gray-500 uppercase tracking-wide text-xs">
                                  Content/Notes (optional)
                                </Label>
                                <Textarea
                                  rows={3}
                                  placeholder="Short description..."
                                  value={topic.content || ''}
                                  onChange={(e) =>
                                    updateTopicField(
                                      mIndex,
                                      tIndex,
                                      'content',
                                      e.target.value
                                    )
                                  }
                                  className="border-gray-300 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] rounded-lg"
                                />
                              </div>
                              <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-gray-500 uppercase tracking-wide text-xs">
                                    Upload Video (optional)
                                  </Label>
                                  <Input
                                    type="file"
                                    accept="video/*"
                                    onChange={(e) =>
                                      updateTopicField(
                                        mIndex,
                                        tIndex,
                                        'videoFile',
                                        e.target.files?.[0] || null
                                      )
                                    }
                                    className="border-gray-300 rounded-lg text-gray-500 file:bg-gray-100 file:text-gray-700 file:border-none file:rounded-full file:px-4 file:py-2"
                                  />
                                  {topic.videoFile && (
                                    <Badge className="bg-gray-100 text-gray-700 text-xs py-1 px-2 rounded-full border border-gray-200">
                                      <Video className="h-3 w-3 mr-1" />
                                      {topic.videoFile.name}
                                    </Badge>
                                  )}
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-gray-500 uppercase tracking-wide text-xs">
                                    Assignment (optional)
                                  </Label>
                                  <Input
                                    placeholder="Assignment Title"
                                    value={topic.assignment?.title || ''}
                                    onChange={(e) =>
                                      updateTopicField(mIndex, tIndex, 'assignment', {
                                        ...(topic.assignment || {}),
                                        title: e.target.value,
                                      })
                                    }
                                    className="border-gray-300 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] rounded-lg"
                                  />
                                  <Textarea
                                    rows={2}
                                    placeholder="Assignment Description"
                                    value={topic.assignment?.description || ''}
                                    onChange={(e) =>
                                      updateTopicField(mIndex, tIndex, 'assignment', {
                                        ...(topic.assignment || {}),
                                        description: e.target.value,
                                      })
                                    }
                                    className="border-gray-300 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] rounded-lg"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-gray-500 uppercase tracking-wide text-xs">
                                        Points
                                      </Label>
                                      <Input
                                        type="number"
                                        min={1}
                                        value={Number(topic.assignment?.points || 100)}
                                        onChange={(e) =>
                                          updateTopicField(
                                            mIndex,
                                            tIndex,
                                            'assignment',
                                            {
                                              ...(topic.assignment || {}),
                                              points: Number(e.target.value || 100),
                                            }
                                          )
                                        }
                                        className="border-gray-300 focus:border-[#00404a] focus:ring-1 focus:ring-[#00404a] rounded-lg"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-gray-500 uppercase tracking-wide text-xs">
                                        Assignment File
                                      </Label>
                                      <Input
                                        type="file"
                                        onChange={(e) =>
                                          updateTopicField(
                                            mIndex,
                                            tIndex,
                                            'assignment',
                                            {
                                              ...(topic.assignment || {}),
                                              file: e.target.files?.[0] || null,
                                            }
                                          )
                                        }
                                        className="border-gray-300 rounded-lg text-gray-500 file:bg-gray-100 file:text-gray-700 file:border-none file:rounded-full file:px-4 file:py-2"
                                      />
                                      {topic.assignment?.file && (
                                        <div className="text-xs text-gray-500 mt-1">
                                          Selected: {topic.assignment.file.name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    {mIndex < form.modules.length - 1 && (
                      <Separator className="bg-gray-200" />
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
        {step === 4 && (
          <Card className="bg-white rounded-xl shadow-md border-none">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-gray-900 font-bold tracking-tight">
                Review & Create
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-500 uppercase tracking-wide text-xs">
                    Title
                  </div>
                  <div className="font-semibold text-gray-800">
                    {form.title || '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500 uppercase tracking-wide text-xs">
                    Category
                  </div>
                  <div className="font-semibold text-gray-800">
                    {form.category || '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-gray-500 uppercase tracking-wide text-xs">
                    Level
                  </div>
                  <div className="font-semibold text-gray-800 capitalize">
                    {form.level}
                  </div>
                </div>
              </div>
              {/* Thumbnail Preview in Review */}
              {thumbnailPreview && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-500 uppercase tracking-wide text-xs">
                    Course Thumbnail
                  </div>
                  <div className="relative w-full max-w-md h-40 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                    <img
                      src={thumbnailPreview}
                      alt="Course thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <Badge className="bg-[#e6f2f3] text-[#005965] font-medium border border-[#005965] text-xs py-1">
                    <Image className="h-3 w-3 mr-1" />
                    Thumbnail Added
                  </Badge>
                </div>
              )}
              <div className="space-y-1">
                <div className="text-sm text-gray-500 uppercase tracking-wide text-xs">
                  Description
                </div>
                <div className="whitespace-pre-wrap text-gray-600">
                  {form.description}
                </div>
              </div>
              <Separator className="bg-gray-200" />
              <div className="space-y-3">
                <div className="font-bold tracking-wide text-lg text-gray-900">
                  Modules & Topics
                </div>
                {form.modules.length === 0 ? (
                  <div className="text-sm text-gray-500 font-light">
                    No modules or topics added.
                  </div>
                ) : (
                  form.modules.map((m, mi) => (
                    <div key={`review-final-${mi}`} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold tracking-wide text-gray-800">
                          <span className="text-gray-500">Module {mi + 1}:</span>{' '}
                          {m.title || '—'}
                        </div>
                        <Badge className="bg-gray-100 text-gray-600 font-light border border-gray-200">
                          Order {m.order || mi + 1}
                        </Badge>
                      </div>
                      <div className="space-y-2 pl-4">
                        {(m.topics || []).map((t, ti) => (
                          <div
                            key={`review-final-topic-${mi}-${ti}`}
                            className="p-3 rounded-lg border border-gray-200 bg-gray-50 shadow-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div className="font-medium tracking-wide text-gray-800">
                                <span className="text-gray-500">
                                  Topic {ti + 1}:
                                </span>{' '}
                                {t.title || '—'}
                              </div>
                              <div className="flex items-center gap-2">
                                {t.videoFile ? (
                                  <Badge className="bg-[#e6f2f3] text-[#005965] font-medium border border-[#005965] text-xs py-1">
                                    <Video className="h-3 w-3 mr-1" />
                                    Video
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-500 font-light text-xs py-1">
                                    No video
                                  </Badge>
                                )}
                                {t.assignment?.file ? (
                                  <Badge className="bg-[#e6f2f3] text-[#005965] font-medium border border-[#005965] text-xs py-1">
                                    <ClipboardList className="h-3 w-3 mr-1" />
                                    Assignment
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-500 font-light text-xs py-1">
                                    No assignment
                                  </Badge>
                                )}
                                <Badge className="bg-gray-100 text-gray-600 font-light border border-gray-200 text-xs py-1">
                                  Order {t.order || ti + 1}
                                </Badge>
                              </div>
                            </div>
                            {!!t.assignment?.title && (
                              <div className="text-sm mt-1 text-gray-600 font-light">
                                <span className="font-medium text-gray-800">
                                  Assignment:
                                </span>{' '}
                                {t.assignment.title}{' '}
                                <span className="text-gray-500">
                                  ({t.assignment.points || 100} pts)
                                </span>
                              </div>
                            )}
                            {t.content && (
                              <p className="text-sm text-gray-500 mt-1">
                                {t.content}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {submitting && submitProgress && (
                <div className="text-sm text-gray-500 font-light mt-4">
                  {submitProgress}
                </div>
              )}
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={submitting}
                  className="rounded-full bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:border-[#00404a] hover:text-[#00404a]"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={submitting}
                  className="rounded-full bg-[#00404a] text-white font-semibold shadow-md hover:bg-[#005965] transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Course'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      <AlertModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />
    </div>
  );
}
