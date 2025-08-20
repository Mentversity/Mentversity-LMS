'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { coursesApi, videosApi, assignmentsApi, progressApi } from '@/lib/api';
import { Card, CardHeader, CardContent, CardDescription } from '@/components/ui/card'; // CardDescription added for richer course meta
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Upload, PlayCircle, ArrowRight, ArrowLeft, Loader2, CheckCircle, Download, Menu, X } from 'lucide-react'; // CheckCircle and Menu/X added for mobile menu
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea'; // Assuming you have a Textarea component
import { Inter, Manrope, Nunito_Sans } from 'next/font/google';
import { cn } from '@/lib/utils'; // FIXED: Added missing import for `cn`

// Use one of the specified fonts
const inter = Inter({ subsets: ['latin'] });

// Assuming your backend API base URL is set in an environment variable
// Use .replace('/api', '') to get the base domain for static assets like videos
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') : 'http://localhost:5000';

/**
 * Course detail page for students.
 *
 * This component fetches and displays a course, its modules, topics, and a video player.
 * It allows students to mark topics as complete and submit assignments.
 */

// Define the shape of our data types for better type safety and clarity.
type Topic = {
  _id?: string;
  id?: string;
  title?: string;
  content?: string;
  order?: number;
  video?: { url?: string; originalName?: string } | string | null;
  assignment?: {
    fileUrl?: string;
    title?: string;
    description?: string;
  } | null;
  isCompleted?: boolean; // Added for student progress
};

type Module = {
  _id?: string;
  id?: string;
  title?: string;
  order?: number;
  topics?: Topic[];
};

type CourseData = {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  instructor?: string;
  instructorAvatar?: string;
  price?: number;
  level?: string;
  rating?: number;
  duration?: string;
};

// Helper function to safely get an ID, prioritizing '_id' over 'id'.
function safeId(obj: any): string | null {
  return obj?._id || obj?.id || null;
}

// Helper function to unwrap API responses, assuming a common shape.
function getData<T = any>(resp: any): T | null {
  if (!resp) return null;
  return resp?.data ?? resp;
}

export default function CourseDetailPageClient() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const courseId = params?.id;

  // State variables for course data, modules, topics, and UI state.
  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [topicsByModule, setTopicsByModule] = useState<Record<string, Topic[]>>({});
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState<boolean>(false);
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isMarkingComplete, setIsMarkingComplete] = useState<boolean>(false); // State for mark complete button
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false); // State for mobile sidebar

  // Helper function to fetch all course data and progress
  const fetchCourseAndProgressData = async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);

    try {
      // Fetch course details, modules, and topics.
      const resp = await coursesApi.getById(courseId);
      const data = getData<any>(resp);

      if (!data) {
        setError('Course data not found.');
        setIsLoading(false);
        return;
      }

      // Extract and set course details.
      const courseObj: CourseData = data?.course || data;
      setCourse({
        _id: safeId(courseObj),
        id: safeId(courseObj),
        title: courseObj?.title || 'Untitled course',
        description: courseObj?.description || '',
        instructor: courseObj?.instructor || 'Instructor',
        price: courseObj?.price ?? 0,
        level: courseObj?.level || 'beginner',
        duration: courseObj?.duration || '—',
        rating: courseObj?.rating ?? 0,
      });

      const modulesFromApi: Module[] = data?.modules || [];
      const topicsFromApi: Topic[] = data?.topics || [];

      // Fetch course progress separately
      let completedTopicIds: string[] = [];
      try {
        const pResp = await progressApi.getCourseProgress(courseId);
        const pData = getData<any>(pResp);
        const value = typeof pData === 'number' ? pData : pData?.percentage ?? 0;
        completedTopicIds = pData?.completedTopics || [];
        setProgress(Number(value));
      } catch (e) {
        console.warn('Progress load failed:', e);
        // Do not set error, as course might still load fine
      }

      const map: Record<string, Topic[]> = {};
      modulesFromApi.forEach((m) => {
        const key = safeId(m) || `module-${Math.random()}`;
        map[key] = (m.topics || []).map(t => ({
          ...t,
          isCompleted: completedTopicIds.includes(safeId(t)!)
        })).filter(t => t); // Filter out any null/undefined topics
      });

      topicsFromApi.forEach((t: any) => {
        const mid = t?.module || t?.moduleId || 'no-module';
        const key = String(mid);
        if (!map[key]) map[key] = [];
        if (!map[key].some(existingT => safeId(existingT) === safeId(t))) {
          map[key].push({
            ...t,
            isCompleted: completedTopicIds.includes(safeId(t)!)
          });
        }
      });

      setModules(modulesFromApi);
      setTopicsByModule(map);

    } catch (e: any) {
      console.error('Course load error:', e);
      setError(e?.message || 'Failed to load course details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseAndProgressData();
  }, [courseId]);

  // useEffect to fetch video URL when a new topic is selected.
  useEffect(() => {
    if (!selectedTopic) {
      setVideoUrl(null);
      return;
    }

    const fetchVideo = async () => {
      const topicVideo = (selectedTopic as any).video;
      // Check if video URL is already present in the topic object.
      if (topicVideo) {
        const url = typeof topicVideo === 'string' ? topicVideo : (topicVideo?.url || null);
        setVideoUrl(url ? url : null);
        return;
      }

      // If not, try fetching it via a separate API call.
      const topicId = safeId(selectedTopic);
      if (!topicId) {
        setVideoUrl(null);
        return;
      }

      try {
        const vResp = await videosApi.get(topicId);
        const vData = getData<any>(vResp);
        const url = vData?.video?.url || vData?.videoUrl || vData?.url || null;
        setVideoUrl(url ? url : null);
      } catch (e) {
        console.warn('Failed to fetch video for topic:', topicId, e);
        setVideoUrl(null);
      }
    };

    fetchVideo();
  }, [selectedTopic]);

  // Memoized array of modules with their topics, sorted for consistent display.
  const resolvedModules = useMemo(() => {
    const sortedModules = [...modules].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return sortedModules.map((m) => {
      const moduleId = safeId(m);
      return {
        ...m,
        topics: (m.topics && m.topics.length > 0)
          ? [...m.topics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          : [...(moduleId ? topicsByModule[moduleId] || [] : [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      };
    });
  }, [modules, topicsByModule]);

  // Effect to auto-select the first available topic once the data is loaded.
  useEffect(() => {
    if (!isLoading && !selectedTopic && resolvedModules.length > 0) {
      const firstTopic = resolvedModules.find(m => m.topics?.length)?.topics?.[0];
      if (firstTopic) {
        setSelectedTopic(firstTopic);
      }
    }
  }, [isLoading, resolvedModules, selectedTopic]); // Added selectedTopic to dependencies to prevent re-select on every render

  // Handles the assignment submission process.
  const handleAssignmentSubmit = async () => {
    const topicId = safeId(selectedTopic);
    if (!topicId) {
      alert('Invalid topic selected.'); // Using alert for simplicity, consider a modal/toast
      return;
    }
    if (!assignmentFile) {
      alert('Please select a file to upload.'); // Using alert for simplicity, consider a modal/toast
      return;
    }

    try {
      setIsSubmittingAssignment(true);
      setSubmitMessage('Uploading assignment...');
      await assignmentsApi.submit(topicId, assignmentFile);
      setSubmitMessage('Assignment submitted successfully.');
      setAssignmentFile(null);
      // Optional: refresh topic assignment status if your API provides endpoint
      // optional: fetch assignmentsApi.getStatus(topicId)
    } catch (e: any) {
      console.error('Assignment submission failed:', e);
      setSubmitMessage(e?.message || 'Failed to upload assignment.');
      alert(e?.message || 'Failed to upload assignment'); // Using alert for simplicity
    } finally {
      setIsSubmittingAssignment(false);
      setTimeout(() => setSubmitMessage(null), 5000);
    }
  };

  // Handle marking a topic as complete
  const handleMarkComplete = async () => {
    const topicId = safeId(selectedTopic);
    if (!topicId) return;

    setIsMarkingComplete(true);
    try {
      await progressApi.markComplete(topicId);
      alert('Topic marked as complete!'); // Using alert for simplicity
      await fetchCourseAndProgressData(); // Re-fetch all data to update progress and topic completion status
    } catch (e: any) {
      alert('Failed to mark topic complete: ' + (e?.message || 'Unknown error')); // Using alert for simplicity
      console.error('Mark complete failed:', e);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  // Helper to navigate to the next or previous topic.
  const handleNavigation = (direction: 'prev' | 'next') => {
    const flatTopics = resolvedModules.flatMap(m => m.topics || []).filter(t => t);
    const currentIndex = flatTopics.findIndex(t => safeId(t) === safeId(selectedTopic));

    if (currentIndex === -1) return;

    if (direction === 'prev' && currentIndex > 0) {
      setSelectedTopic(flatTopics[currentIndex - 1]);
    } else if (direction === 'next' && currentIndex < flatTopics.length - 1) {
      setSelectedTopic(flatTopics[currentIndex + 1]);
    }
  };

  // UI rendering logic for various states (no ID, loading, error).
  if (!courseId) {
    return (
      <div className={`${inter.className} min-h-screen flex items-center justify-center p-6 bg-gray-50 text-gray-800`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">No Course Selected</h2>
          <p className="text-gray-500 mt-2">Please navigate to a specific course page.</p>
          <Button asChild className="mt-4 px-6 py-2 rounded-full font-semibold shadow-md bg-[#05d6ac] text-white hover:bg-[#04b895] transition-colors">
            <Link href="/student/courses">Browse Courses</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${inter.className} min-h-screen flex items-center justify-center p-6 bg-gray-50 text-gray-800`}>
        <Loader2 className="h-8 w-8 animate-spin text-[#05d6ac]" />
        <p className="ml-3 text-lg text-gray-600">Loading course data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${inter.className} min-h-screen flex items-center justify-center p-6 bg-gray-50 text-gray-800`}>
        <div className="space-y-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900">Error Loading Course</h2>
          <p className="text-gray-500">{error}</p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => window.location.reload()} className="px-6 py-2 rounded-full font-semibold shadow-md bg-[#05d6ac] text-white hover:bg-[#04b895] transition-colors">Retry</Button>
            <Button asChild variant="outline" className="px-6 py-2 rounded-full font-semibold text-gray-700 border-gray-300 hover:bg-gray-100 transition-colors"><Link href="/">Go Home</Link></Button>
          </div>
        </div>
      </div>
    );
  }

  const flatTopics = resolvedModules.flatMap(m => m.topics || []).filter(t => t);
  const currentTopicIndex = flatTopics.findIndex(t => safeId(t) === safeId(selectedTopic));
  const hasPrev = currentTopicIndex > 0;
  const hasNext = currentTopicIndex !== -1 && currentTopicIndex < flatTopics.length - 1;

  console.log('selectedTopic', selectedTopic);
  return (
    <div className={`${inter.className} flex flex-col h-screen bg-gray-50 text-gray-900`}>
      {/* Top Header Bar */}
      <Card className="rounded-none border-t-0 border-x-0 border-b border-gray-200 p-4 flex items-center justify-between shadow-sm bg-white">
        <div className="flex items-center gap-2">
          {/* BACK BUTTON FOR MOBILE */}
          <Link href="/student/courses" className="md:hidden">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100 transition-colors rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          {/* MOBILE SIDEBAR TOGGLE */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-gray-500 hover:bg-gray-100 transition-colors rounded-full"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {/* DESKTOP BACK BUTTON */}
          <Link href="/student/courses" className="hidden md:block hover:text-[#05d6ac] transition-colors duration-200">
            <Button variant="ghost" size="icon" className="text-gray-500 hover:bg-gray-100 transition-colors rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 truncate">
            {course?.title || 'Course Overview'}
          </h1>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="text-sm text-gray-500 uppercase tracking-tight hidden md:block">Progress</div>
          <Progress value={progress} className="h-2 w-24 md:w-32 bg-gray-200 rounded-full [&>div]:bg-[#05d6ac]" />
          <span className="font-semibold text-sm text-gray-700">{Math.round(progress)}%</span>
        </div>
      </Card>

      <div className="flex flex-grow overflow-hidden relative">
        {/* LEFT SIDEBAR: Modules and Topics List */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-full max-w-xs border-r border-gray-200 bg-white overflow-y-auto p-4 flex-shrink-0 transition-transform duration-300 ease-in-out transform",
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'md:relative md:translate-x-0'
          )}
        >
          <div className="flex justify-between items-center mb-4 md:hidden">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">Course Content</h2>
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500 hover:bg-gray-100 transition-colors rounded-full"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="space-y-3">
            {resolvedModules.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">No modules available.</div>
            ) : (
              resolvedModules.map((mod, mi) => (
                <details key={safeId(mod) || mi} className="group" open>
                  <summary className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="font-semibold text-base text-gray-800 tracking-wide">{mod.title || `Module ${mi + 1}`}</div>
                    <Badge className="bg-gray-200 text-gray-600 text-xs font-medium uppercase">{mod.topics?.length || 0} topics</Badge>
                  </summary>
                  <div className="pl-4 mt-2 space-y-1">
                    {(mod.topics || []).map((t, ti) => (
                      <Button
                        key={safeId(t) || ti}
                        variant="ghost"
                        onClick={() => { setSelectedTopic(t); setIsSidebarOpen(false); }}
                        className={`w-full justify-start text-left px-3 py-2 text-sm truncate rounded-lg transition-colors duration-200 hover:bg-gray-200 
                          ${safeId(t) === safeId(selectedTopic) ? 'bg-gray-200 text-[#05d6ac] font-bold' : 'text-gray-700'}
                          ${t.isCompleted ? 'opacity-70' : ''}`}
                      >
                        <PlayCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{t.title || `Topic ${ti + 1}`}</span>
                        {t.isCompleted && <CheckCircle className="h-4 w-4 ml-2 text-[#05d6ac] flex-shrink-0" />}
                      </Button>
                    ))}
                  </div>
                </details>
              ))
            )}
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-grow overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50">
          {selectedTopic ? (
            <div className="space-y-6 max-w-full lg:max-w-4xl mx-auto">
              {/* Video Player Card */}
              <Card className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                <div className="w-full bg-black aspect-video flex items-center justify-center">
                  {videoUrl ? (
                    <video key={videoUrl} src={videoUrl} controls className="w-full h-full" />
                  ) : (
                    <div className="text-center text-white/80 p-6">
                      <PlayCircle className="mx-auto h-16 w-16 mb-4 opacity-70" />
                      <div className="text-xl font-bold tracking-tight text-white">No video available</div>
                      <p className="text-sm text-white/60 mt-2">
                        This topic does not have a video.
                      </p>
                    </div>
                  )}
                </div>
                <div className="p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-grow">
                    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                      {selectedTopic?.title || 'Topic Details'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">{selectedTopic.assignment ? 'Video & Assignment' : 'Video'}</p>
                  </div>
                  <Button
                    onClick={handleMarkComplete}
                    disabled={selectedTopic.isCompleted || isMarkingComplete}
                    className="flex-shrink-0 w-full md:w-auto px-6 py-2 rounded-full font-semibold shadow-md bg-[#05d6ac] text-white hover:bg-[#04b895] transition-colors"
                  >
                    {isMarkingComplete ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    {selectedTopic.isCompleted ? 'Completed' : 'Mark as Complete'}
                  </Button>
                </div>
              </Card>

              {/* Topic Content & Assignment Card */}
              <Card className="rounded-xl border border-gray-200 bg-white shadow-lg">
                <CardHeader>
                  <h3 className="text-lg font-bold tracking-tight text-gray-900">Topic Notes</h3>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600">
                    {selectedTopic?.content || 'No notes or detailed content for this topic.'}
                  </div>

                  {selectedTopic?.assignment && (
                    <div className="mt-8 border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-bold tracking-tight mb-3 text-gray-900">Assignment: {selectedTopic.assignment.title || 'Untitled'}</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {selectedTopic.assignment.description || 'No description provided.'}
                      </p>
                      {selectedTopic.assignment.fileUrl && (
                        <Button asChild variant="outline" className="mb-4 w-full md:w-auto px-4 py-2 rounded-full font-semibold text-[#05d6ac] border-[#05d6ac] hover:bg-[#05d6ac]/10 transition-colors">
                          <a href={`${selectedTopic.assignment.fileUrl}`} target="_blank" rel="noreferrer" download>
                            <Download className="mr-2 h-4 w-4" /> Download Assignment Template
                          </a>
                        </Button>
                      )}
                      <Separator className="my-4 bg-gray-200" />

                      {/* Assignment Submission Form (Student) */}
                      <div className="space-y-4">
                        <Label htmlFor="assignment-file" className="text-sm font-semibold tracking-wide text-gray-500 uppercase">Submit Your Work</Label>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <Input
                            id="assignment-file"
                            type="file"
                            onChange={(e) => setAssignmentFile(e.target.files?.[0] || null)}
                            className="flex-grow rounded-lg border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#05d6ac] focus:ring-0"
                          />
                          <Button
                            onClick={handleAssignmentSubmit}
                            disabled={!assignmentFile || isSubmittingAssignment}
                            className="min-w-[120px] px-6 py-2 rounded-full font-semibold shadow-md bg-[#05d6ac] text-white hover:bg-[#04b895] transition-colors"
                          >
                            {isSubmittingAssignment ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="mr-2 h-4 w-4" />
                            )}
                            {isSubmittingAssignment ? 'Submitting...' : 'Submit'}
                          </Button>
                        </div>
                        {assignmentFile && (
                          <p className="text-sm text-gray-500">Selected file: {assignmentFile.name}</p>
                        )}
                        {submitMessage && (
                          <p className={`text-sm ${submitMessage.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
                            {submitMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Navigation Buttons */}
              <div className="flex justify-between pb-4">
                <Button
                  variant="outline"
                  onClick={() => handleNavigation('prev')}
                  disabled={!hasPrev}
                  className="px-4 py-2 rounded-full font-semibold text-gray-700 border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleNavigation('next')}
                  disabled={!hasNext}
                  className="px-4 py-2 rounded-full font-semibold text-gray-700 border-gray-300 hover:bg-gray-100 transition-colors"
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[40vh] items-center justify-center text-center">
              <p className="text-lg font-medium text-gray-500">Select a topic from the left sidebar to begin.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}