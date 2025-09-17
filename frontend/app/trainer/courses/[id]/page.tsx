'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { coursesApi, videosApi, assignmentsApi, progressApi, modulesApi } from '@/lib/api';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Upload, PlayCircle, ArrowLeft, Pencil, Trash, PlusCircle, Save } from 'lucide-react';
import { Nunito_Sans } from 'next/font/google';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const nunitoSans = Nunito_Sans({ subsets: ['latin'] });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type Topic = {
  _id?: string;
  id?: string;
  title?: string;
  content?: string;
  order?: number;
  video?: { url?: string } | string | null;
  assignment?: {
    fileUrl?: string;
    title?: string;
    description?: string;
  } | null;
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
  level?: string;
  category?: string; // Add category here
  rating?: number;
  duration?: string;
  thumbnail?: { url?: string, publicId?: string };
};

function safeId(obj: any) {
  return obj?._id || obj?.id || null;
}

function getData<T = any>(resp: any): T | null {
  if (!resp) return null;
  if (typeof resp === 'object') {
    if ('data' in resp && resp.data !== undefined) return resp.data as T;
  }
  return resp as T;
}

// --- NEW CUSTOM MODAL COMPONENT AND HOOKS ---
type ModalState = {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm?: () => void;
  isConfirmation: boolean;
};

const defaultModalState: ModalState = {
  isOpen: false,
  title: '',
  message: '',
  isConfirmation: false,
};

const CustomModal = ({ state, onClose, onConfirm }: { state: ModalState, onClose: () => void, onConfirm?: () => void }) => {
  if (!state.isOpen) return null;
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm mx-4">
        <h3 className="text-xl font-bold mb-2">{state.title}</h3>
        <p className="text-gray-600 mb-4">{state.message}</p>
        <div className="flex justify-end space-x-2">
          {state.isConfirmation && (
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          )}
          <Button onClick={state.isConfirmation ? handleConfirm : onClose} className="bg-[#005965] hover:bg-[#00404a]">
            {state.isConfirmation ? 'Confirm' : 'OK'}
          </Button>
        </div>
      </div>
    </div>
  );
};
// --- END NEW CUSTOM MODAL COMPONENT ---

export default function CourseDetailPageAdmin() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const courseId = params?.id;
  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [topicsByModule, setTopicsByModule] = useState<Record<string, Topic[]>>({});
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingCourse, setIsEditingCourse] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState<string | null>(null);
  const [newTopicContent, setNewTopicContent] = useState('');
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentDescription, setNewAssignmentDescription] = useState('');
  const [newAssignmentFile, setNewAssignmentFile] = useState<File | null>(null);
  const [isSubmittingAssignment, setIsSubmittingAssignment] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState<string>('');
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicTitle, setEditingTopicTitle] = useState<string>('');
  const [editingTopicContent, setEditingTopicContent] = useState<string>('');
  const [modalState, setModalState] = useState<ModalState>(defaultModalState);

  const showModal = (title: string, message: string, isConfirmation = false, onConfirm?: () => void) => {
    setModalState({ isOpen: true, title, message, isConfirmation, onConfirm });
  };
  const closeModal = () => setModalState(defaultModalState);

  useEffect(() => {
    document.title = "Admin Course Detail - Mentversity";
  });

  const fetchCourseData = async () => {
    if (!courseId) return;
    setIsLoading(true);
    setError(null);
    try {
      const resp = await coursesApi.getById(courseId);
      const data = getData<any>(resp) || resp;
      const courseObj: CourseData = data?.course || data;
      const modulesFromApi: Module[] = data?.modules || [];
      const topicsFromApi: Topic[] = data?.topics || [];
      setCourse({
        _id: safeId(courseObj),
        id: safeId(courseObj),
        title: courseObj?.title || 'Untitled course',
        description: courseObj?.description || '',
        instructor: courseObj?.instructor || courseObj?.author || 'Instructor',
        level: courseObj?.level || 'beginner',
        category: courseObj?.category || '', // Initialize category
        thumbnail: courseObj?.thumbnail || { url: '', publicId: '' },
      });
      const map: Record<string, Topic[]> = {};
      (modulesFromApi || []).forEach((m) => {
        const key = safeId(m) || 'no-module';
        map[key] = (m.topics || []).map((t) => ({ ...t, module: key }));
      });
      (topicsFromApi || []).forEach((t: any) => {
        const mid = t?.module || t?.moduleId || 'no-module';
        const key = String(mid);
        if (!map[key]) map[key] = [];
        map[key].push(t);
      });
      setModules(modulesFromApi || []);
      setTopicsByModule(map);
    } catch (e: any) {
      console.error('Course load error', e);
      setError(e?.message || 'Failed to load course');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  useEffect(() => {
    if (!selectedTopic) {
      setVideoUrl(null);
      return;
    }
    const tv = (selectedTopic as any).video;
    if (tv) {
      const url = typeof tv === 'string' ? tv : (tv.url || tv?.url);
      setVideoUrl(url ? url : null);
      return;
    }
    const tid = safeId(selectedTopic);
    if (!tid) {
      setVideoUrl(null);
      return;
    }
    const fetchVideo = async () => {
      try {
        const vResp = await videosApi.get(tid);
        const vData = getData<any>(vResp) || vResp;
        const url = vData?.video?.url || vData?.videoUrl || vData?.url;
        setVideoUrl(url ? url : null);
      } catch (e) {
        console.warn('Failed to fetch video for topic', tid, e);
        setVideoUrl(null);
      }
    };
    fetchVideo();
  }, [selectedTopic]);

  useEffect(() => {
    if (thumbnailFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(thumbnailFile);
    } else {
      setThumbnailPreviewUrl(null);
    }
  }, [thumbnailFile]);

  const resolvedModules = useMemo(() => {
    let sortedModules = [];
    if (!modules || modules.length === 0) {
      sortedModules = Object.keys(topicsByModule).map((k, idx) => ({
        _id: k,
        id: k,
        title: `Module ${idx + 1}`,
        order: idx + 1,
        topics: topicsByModule[k] || [],
      }));
    } else {
      sortedModules = modules.map((m) => ({
        ...m,
        topics: (m.topics && m.topics.length > 0) ? m.topics : (topicsByModule[safeId(m) || m._id || m.id] || []),
      }));
    }
    sortedModules.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    
    sortedModules.forEach(mod => {
      if (mod.topics) {
        mod.topics.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      }
    });
    return sortedModules;
  }, [modules, topicsByModule]);

  useEffect(() => {
    if (!isLoading && !selectedTopic && resolvedModules.length > 0) {
      for (const m of resolvedModules) {
        if (m.topics && m.topics.length) {
          setSelectedTopic(m.topics[0]);
          break;
        }
      }
    }
  }, [isLoading, resolvedModules.length]);

  const handleUpdateCourse = async () => {
    if (!courseId || !course) return;

    const formData = new FormData();
    formData.append('title', course.title || '');
    formData.append('description', course.description || '');
    if (course.level !== undefined) {
      formData.append('level', course.level);
    }
    if (course.category !== undefined) {
      formData.append('category', course.category);
    }
    if (thumbnailFile) {
      formData.append('thumbnail', thumbnailFile);
    }

    try {
      await coursesApi.update(courseId, formData);
      setIsEditingCourse(false);
      setThumbnailFile(null);
      showModal('Success', 'Course updated successfully!');
      await fetchCourseData();
    } catch (e: any) {
      showModal('Error', 'Failed to update course: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleAddModule = async () => {
    if (!courseId || !newModuleTitle) return;
    try {
      const newOrder = resolvedModules.length > 0 
        ? Math.max(...resolvedModules.map(m => m.order ?? 0)) + 1 
        : 1;
        
      await coursesApi.addModule(courseId, { title: newModuleTitle, order: newOrder });
      setNewModuleTitle('');
      setIsAddingModule(false);
      showModal('Success', 'Module added successfully!');
      await fetchCourseData();
    } catch (e) {
      showModal('Error', 'Failed to add module');
    }
  };

  const handleUpdateModule = async (moduleId: string) => {
    const moduleToUpdate = resolvedModules.find(m => safeId(m) === moduleId);
    if (!moduleToUpdate || !editingModuleTitle) return;
    try {
      await coursesApi.updateModule(moduleId, { 
        title: editingModuleTitle, 
        order: moduleToUpdate.order 
      });
      setEditingModuleId(null);
      setEditingModuleTitle('');
      showModal('Success', 'Module updated successfully!');
      await fetchCourseData();
    } catch (e) {
      showModal('Error', 'Failed to update module.');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    showModal(
      'Confirm Deletion',
      'Are you sure you want to delete this module and all its topics?',
      true,
      async () => {
        try {
          await modulesApi.delete(moduleId);
          if (selectedTopic && resolvedModules.find(m => safeId(m) === moduleId)?.topics?.some(t => safeId(t) === safeId(selectedTopic))) {
            setSelectedTopic(null);
          }
          showModal('Success', 'Module deleted successfully!');
          await fetchCourseData();
        } catch (e) {
          showModal('Error', 'Failed to delete module.');
        }
      }
    );
  };

  const handleAddTopic = async (moduleId: string) => {
    if (!newTopicTitle) return; 
    try {
      const module = resolvedModules.find(m => safeId(m) === moduleId);
      const newOrder = module?.topics?.length > 0
        ? Math.max(...module.topics.map(t => t.order ?? 0)) + 1
        : 1;
      await modulesApi.addTopic(moduleId, { title: newTopicTitle, content: '', order: newOrder });
      setNewTopicTitle('');
      setIsAddingTopic(null);
      showModal('Success', 'Topic added successfully!');
      await fetchCourseData();
    } catch (e) {
      showModal('Error', 'Failed to add topic');
    }
  };

  const handleUpdateTopic = async (topicId: string) => {
    const topicToUpdate = resolvedModules.flatMap(m => m.topics || []).find(t => safeId(t) === topicId);
    if (!topicToUpdate || !editingTopicTitle) return;
    try {
      await modulesApi.updateTopic(topicId, {
        title: editingTopicTitle,
        content: editingTopicContent,
        order: topicToUpdate.order
      });
      setEditingTopicId(null);
      setEditingTopicTitle('');
      setEditingTopicContent('');
      showModal('Success', 'Topic updated successfully!');
      await fetchCourseData();
    } catch (e) {
      showModal('Error', 'Failed to update topic.');
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    showModal(
      'Confirm Deletion',
      'Are you sure you want to delete this topic?',
      true,
      async () => {
        try {
          await modulesApi.deleteTopic(topicId);
          if (selectedTopic && safeId(selectedTopic) === topicId) {
            setSelectedTopic(null);
          }
          showModal('Success', 'Topic deleted successfully!');
          await fetchCourseData();
        } catch (e) {
          showModal('Error', 'Failed to delete topic.');
        }
      }
    );
  };

  const handleVideoUpload = async (topicId: string) => {
    if (!videoFile) return;
    setIsUploadingVideo(true);
    try {
      await videosApi.upload(topicId, videoFile);
      setVideoFile(null);
      showModal('Success', 'Video uploaded successfully!');
      await fetchCourseData();
    } catch (e: any) {
      showModal('Error', 'Failed to upload video: ' + (e?.message || 'Unknown error'));
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleAssignmentCreate = async (topicId: string) => {
    if (!newAssignmentTitle || !newAssignmentFile) {
      return showModal('Error', 'Assignment title and file are required.');
    }
    setIsSubmittingAssignment(true);
    const formData = new FormData();
    formData.append('title', newAssignmentTitle);
    formData.append('description', newAssignmentDescription);
    formData.append('file', newAssignmentFile);
    try {
      await assignmentsApi.create(topicId, formData);
      showModal('Success', 'Assignment created successfully!');
      await fetchCourseData();
    } catch (e) {
      console.error('Create flow failed:', e);
      showModal('Error', 'Failed to create assignment');
    } finally {
      setIsSubmittingAssignment(false);
    }
  };

  const handleEditModuleClick = (mod: Module) => {
    setEditingModuleId(safeId(mod));
    setEditingModuleTitle(mod.title || '');
  };

  const handleEditTopicClick = (topic: Topic) => {
    setEditingTopicId(safeId(topic));
    setEditingTopicTitle(topic.title || '');
    setEditingTopicContent(topic.content || '');
  };

  if (!courseId) {
    return (
      <div className={`${nunitoSans.className} min-h-screen flex items-center justify-center bg-gray-50 text-gray-700`}>
        <p className="text-lg font-medium">No course selected</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${nunitoSans.className} min-h-screen flex items-center justify-center bg-gray-50 text-gray-700`}>
        <p className="text-lg font-medium">Loading course...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${nunitoSans.className} min-h-screen flex flex-col items-center justify-center text-center bg-gray-50 text-gray-700`}>
        <p className="text-lg font-medium">Failed to load course</p>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <Button onClick={() => router.refresh()} className="bg-[#005965] text-white rounded-lg px-6 py-2 transition-transform duration-300 hover:scale-105 shadow-md hover:shadow-lg">Retry</Button>
      </div>
    );
  }

  const nextModuleOrder = resolvedModules.length > 0
    ? Math.max(...resolvedModules.map(m => m.order ?? 0)) + 1
    : 1;

  return (
    <div className={`${nunitoSans.className} p-6 bg-gray-50 min-h-screen text-gray-800`}>
      <CustomModal state={modalState} onClose={closeModal} onConfirm={modalState.onConfirm} />
      
      <div className="flex items-center mb-6">
        <Button onClick={() => router.back()} size="icon" className="h-10 w-10 rounded-full bg-white text-gray-600 shadow-md hover:bg-gray-100 hover:text-gray-800 transition-all group">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div className="text-gray-700 text-lg font-medium ml-4">Back to Courses</div>
      </div>
      <div className="grid lg:grid-cols-[7fr_3fr] grid-cols-1 gap-6">
        <div className="space-y-6">
          <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between p-6">
              <CardTitle className="font-bold text-gray-800 tracking-tight">Modules</CardTitle>
              <Button onClick={() => setIsAddingModule(!isAddingModule)} size="icon" className="h-9 w-9 rounded-full text-white bg-[#00404a] hover:bg-[#005965] transition-all">
                <PlusCircle className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-auto pr-2">
              {isAddingModule && (
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder={`New module title (Order: ${nextModuleOrder})`}
                    value={newModuleTitle}
                    onChange={(e) => setNewModuleTitle(e.target.value)}
                    className="flex-grow rounded-lg border border-gray-300 bg-gray-50 text-gray-700"
                  />
                  <Button onClick={handleAddModule} className="bg-[#005965] text-white rounded-lg font-bold px-4 py-2 hover:bg-[#00404a]">Add</Button>
                </div>
              )}
              {resolvedModules.length === 0 ? (
                <div className="text-sm text-gray-500 p-4">No modules available.</div>
              ) : (
                resolvedModules.map((mod, mi) => (
                  <details key={safeId(mod) || mi} className="mb-2 group" open>
                    <summary className="list-none cursor-pointer flex items-center justify-between p-3 rounded-lg transition-colors duration-200 hover:bg-gray-100">
                      {editingModuleId === safeId(mod) ? (
                        <Input
                          value={editingModuleTitle}
                          onChange={(e) => setEditingModuleTitle(e.target.value)}
                          placeholder="Module title"
                          className="w-full text-base font-medium rounded-lg border border-gray-300 bg-gray-50 text-gray-700"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.stopPropagation();
                              handleUpdateModule(safeId(mod)!);
                            }
                          }}
                        />
                      ) : (
                        <div className="font-medium text-gray-700 tracking-wide">
                          {mod.order}. {mod.title || `Module ${mod.order}`}
                        </div>
                      )}
                      <div className="flex gap-1">
                        {editingModuleId === safeId(mod) ? (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpdateModule(safeId(mod)!); }} className="h-8 w-8 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all">
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditModuleClick(mod); }} className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100 transition-all">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsAddingTopic(safeId(mod) || ''); }} className="h-8 w-8 rounded-full text-gray-500 hover:bg-[#f2fffb] hover:text-[#005965] transition-all">
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteModule(safeId(mod)!); }} className="h-8 w-8 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </summary>
                    <div className="mt-2 pl-3 space-y-2 border-l-2 border-gray-200">
                      {isAddingTopic === safeId(mod) && (
                        <div className="space-y-2 border-l-2 pl-2 border-gray-200">
                          <Input placeholder="New topic title" value={newTopicTitle} onChange={(e) => setNewTopicTitle(e.target.value)} className="rounded-lg border border-gray-300 bg-gray-50 text-gray-700" />
                          <Button onClick={() => handleAddTopic(safeId(mod)!)} size="sm" className="w-full bg-[#005965] text-white rounded-lg font-bold hover:bg-[#00404a]">Add Topic</Button>
                        </div>
                      )}
                      {(mod.topics || []).length === 0 ? (
                        <div className="text-xs text-gray-500 pl-2">No topics</div>
                      ) : (
                        (mod.topics || []).map((t) => (
                          <div key={safeId(t)} className={`relative flex items-center justify-between pl-4 pr-2 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 cursor-pointer ${safeId(selectedTopic) === safeId(t) ? 'bg-gray-100 before:content-[""] before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:bg-[#005965] before:rounded-l-sm' : ''}`}
                            onClick={() => setSelectedTopic(t)}>
                            {editingTopicId === safeId(t) ? (
                              <div className="flex flex-grow items-center gap-2">
                                <Input
                                  value={editingTopicTitle}
                                  onChange={(e) => setEditingTopicTitle(e.target.value)}
                                  placeholder="Topic title"
                                  className="w-full text-sm rounded-lg border border-gray-300 bg-gray-50 text-gray-700"
                                  onClick={(e) => e.stopPropagation()}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.stopPropagation();
                                      handleUpdateTopic(safeId(t)!);
                                    }
                                  }}
                                />
                                <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpdateTopic(safeId(t)!); }} className="h-8 w-8 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all">
                                  <Save className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm font-medium tracking-wide text-gray-700">
                                {t.order}. {t.title || 'Untitled topic'}
                              </span>
                            )}
                            <div className="flex gap-1">
                                {editingTopicId !== safeId(t) && (
                                    <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditTopicClick(t); }} className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100 transition-all">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteTopic(safeId(t)!); }} className="h-8 w-8 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </details>
                ))
              )}
            </CardContent>
          </Card>
          <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between p-6">
              <CardTitle className="font-bold text-gray-800 tracking-tight">Topic Details</CardTitle>
              <div className="flex gap-2">
                {editingTopicId === safeId(selectedTopic) ? (
                  <Button onClick={() => handleUpdateTopic(safeId(selectedTopic)!)} size="icon" className="h-9 w-9 rounded-full bg-green-500 text-white hover:bg-green-600 transition-all">
                    <Save className="h-5 w-5" />
                  </Button>
                ) : (
                  <Button onClick={() => selectedTopic && handleEditTopicClick(selectedTopic)} variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-500 hover:bg-gray-100 transition-all">
                    <Pencil className="h-5 w-5" />
                  </Button>
                )}
                <Button onClick={() => selectedTopic && handleDeleteTopic(safeId(selectedTopic)!)} variant="ghost" size="icon" className="h-9 w-9 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                  <Trash className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {editingTopicId === safeId(selectedTopic) ? (
                <div className="space-y-4">
                  <Input
                    value={editingTopicTitle}
                    onChange={(e) => setEditingTopicTitle(e.target.value)}
                    placeholder="Topic Title"
                    className="rounded-lg border border-gray-300 bg-gray-50 text-gray-700"
                  />
                  <textarea
                    value={editingTopicContent}
                    onChange={(e) => setEditingTopicContent(e.target.value)}
                    placeholder="Topic Content"
                    className="flex w-full rounded-lg border border-gray-300 bg-gray-50 text-gray-700 min-h-[100px] p-2 resize-y"
                  />
                </div>
              ) : (
                <div className="text-base text-gray-600 whitespace-pre-wrap">
                  {selectedTopic?.content || 'No content/notes for this topic.'}
                </div>
              )}
              <Separator className="bg-gray-200" />
              <div className="space-y-4">
                <Label className="text-gray-800 font-semibold text-lg">Upload Video</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="flex-grow rounded-lg border border-gray-300 bg-gray-50 text-gray-700"
                  />
                  <Button onClick={() => selectedTopic && handleVideoUpload(safeId(selectedTopic)!)} disabled={!videoFile || isUploadingVideo}
                    className="bg-[#005965] text-white rounded-lg font-bold px-6 py-2 shadow-md hover:bg-[#00404a] disabled:bg-gray-300">
                    {isUploadingVideo ? 'Uploading...' : 'Upload Video'}
                  </Button>
                </div>
                {videoFile && <div className="text-sm text-gray-500 mt-2">Selected: {videoFile.name}</div>}
              </div>
              <Separator className="bg-gray-200" />
              <div className="space-y-4">
                <Label className="text-gray-800 font-semibold text-lg">Manage Assignment</Label>
                <Input
                  placeholder="Assignment Title"
                  value={newAssignmentTitle}
                  onChange={(e) => setNewAssignmentTitle(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-gray-50 text-gray-700 placeholder:text-gray-500"
                />
                <Input
                  placeholder="Assignment Description"
                  value={newAssignmentDescription}
                  onChange={(e) => setNewAssignmentDescription(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-gray-50 text-gray-700 placeholder:text-gray-500"
                />
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    onChange={(e) => setNewAssignmentFile(e.target.files?.[0] || null)}
                    className="flex-grow rounded-lg border border-gray-300 bg-gray-50 text-gray-700"
                  />
                  <Button onClick={() => selectedTopic && handleAssignmentCreate(safeId(selectedTopic)!)} disabled={!newAssignmentTitle || isSubmittingAssignment}
                    className="bg-[#005965] text-white rounded-lg font-bold px-6 py-2 shadow-md hover:bg-[#00404a] disabled:bg-gray-300">
                    {isSubmittingAssignment ? 'Submitting...' : 'Create/Update Assignment'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-6">
          <Card className="bg-white w-full h-96 rounded-xl shadow-lg border border-gray-200">
            <CardContent className="p-0 rounded-xl overflow-hidden">
              <div className="bg-black aspect-video flex items-center justify-center">
                {videoUrl ? (
                  <video
                    key={videoUrl}
                    src={videoUrl}
                    controls
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/80 p-6 bg-gray-900">
                    <div className="text-center">
                      <PlayCircle className="mx-auto mb-2 h-12 w-12 text-[#005965] drop-shadow-[0_0_8px_#005965]" />
                      <div className="text-lg font-bold tracking-tight text-white">No video available</div>
                      <div className="text-sm text-gray-300 mt-1 font-light uppercase tracking-tight">Select a topic to view its content or upload a video.</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardHeader className="py-4 px-6 border-t border-gray-200">
              <div className="w-full flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold tracking-tight text-gray-800">{selectedTopic?.title || 'Select a topic'}</div>
                  <div className="text-sm text-gray-500 font-light uppercase tracking-tight">{course?.title || 'Untitled course'}</div>
                </div>
              </div>
            </CardHeader>
          </Card>
          <Card className="bg-white rounded-xl shadow-lg border border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between p-6">
              <CardTitle className="font-bold text-gray-800 tracking-tight">
                Course Details
              </CardTitle>
              <Button
                onClick={() => setIsEditingCourse(!isEditingCourse)}
                size="icon"
                className="h-9 w-9 rounded-full text-white bg-[#00404a] hover:bg-[#005965] transition-all"
              >
                <Pencil className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              {isEditingCourse ? (
                <div className="space-y-4">
                  {/* Thumbnail Upload */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">
                      Thumbnail
                    </Label>
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative bg-gray-50 overflow-hidden">
                      {thumbnailPreviewUrl || course?.thumbnail?.url ? (
                        <img
                          src={thumbnailPreviewUrl || course?.thumbnail?.url}
                          alt="Course thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-center text-sm text-gray-400">
                          <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p>Upload Thumbnail</p>
                        </div>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                  {/* Title */}
                  <Input
                    value={course?.title || ''}
                    onChange={(e) => setCourse({ ...course, title: e.target.value })}
                    placeholder="Course Title"
                    className="rounded-lg border border-gray-300 bg-gray-50 text-gray-700"
                  />
                  {/* Description */}
                  <Input
                    value={course?.description || ''}
                    onChange={(e) => setCourse({ ...course, description: e.target.value })}
                    placeholder="Course Description"
                    className="rounded-lg border border-gray-300 bg-gray-50 text-gray-700"
                  />
                  {/* Category */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Category</Label>
                    <Input
                      value={course?.category || ''}
                      onChange={(e) => setCourse({ ...course, category: e.target.value })}
                      placeholder="Course Category"
                      className="rounded-lg border border-gray-300 bg-gray-50 text-gray-700"
                    />
                  </div>
                  {/* Level */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-600">Level</Label>
                    <Select
                      value={course?.level || ''}
                      onValueChange={(value) => setCourse({ ...course, level: value })}
                    >
                      <SelectTrigger className="rounded-lg border border-gray-300 bg-gray-50 text-gray-700">
                        <SelectValue placeholder="Select Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Save */}
                  <Button onClick={handleUpdateCourse} className="w-full bg-[#005965] text-white rounded-lg font-bold px-6 py-2 shadow-md hover:bg-[#00404a]">Save Changes</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Thumbnail Display */}
                  {course?.thumbnail?.url && (
                    <img src={course.thumbnail.url} alt={`${course.title} thumbnail`} className="rounded-lg mb-2 w-full h-auto object-cover" />
                  )}
                  {/* Title & Desc */}
                  <div className="text-lg font-bold text-gray-800">{course?.title}</div>
                  <div className="text-gray-500 text-sm">{course?.description}</div>
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700">Category: </span>
                    {course?.category || 'Uncategorized'}
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700">Level: </span>
                    {course?.level || 'N/A'}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}