"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { Inter } from "next/font/google";
import { assignmentsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

/* ---------- Types ---------- */
type TrainerTopic = {
  topicId: string;
  topicTitle: string;
  assignment?: {
    title?: string;
    description?: string;
    fileUrl?: string;
  } | null;
  submission?: {
    status?: string;
    fileUrl?: string;
    grade?: number;
    feedback?: string;
    submittedAt?: string;
    _id?: string;
  } | null;
};

type TrainerStudent = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  assignments: TrainerTopic[];
};

type TrainerCourse = {
  id: string;
  title: string;
};

/* ---------- Constants ---------- */
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const BRAND_COLOR = "#00404a";

/* ---------- Component ---------- */
export default function TrainerAssignmentsPage() {
  const [courses, setCourses] = useState<TrainerCourse[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const [students, setStudents] = useState<TrainerStudent[]>([]);
  const [totalStudents, setTotalStudents] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [studentsPerPage, setStudentsPerPage] = useState<number>(10);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeStudent, setActiveStudent] = useState<TrainerStudent | null>(
    null
  );
  const [editGrades, setEditGrades] = useState<
    Record<string, { grade?: number; feedback?: string }>
  >({});

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalStudents / studentsPerPage)),
    [totalStudents, studentsPerPage]
  );

  /* ---------- Fetch overview ---------- */
  const fetchOverview = async (courseId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await assignmentsApi.getTrainerAssignmentsOverview(
        courseId ? { courseId } : {}
      );
      const data = res?.data || res;

      const fetchedCourses: TrainerCourse[] = data?.courses || [];
      setCourses(fetchedCourses);

      if (!selectedCourseId && fetchedCourses.length > 0) {
        setSelectedCourseId(data.selectedCourseId || fetchedCourses[0].id);
      }

      if (data?.students) {
        setStudents(data.students);
        setTotalStudents(data.students.length);
      } else {
        setStudents([]);
        setTotalStudents(0);
      }
    } catch (err: any) {
      console.error("Failed to load overview", err);
      setError("Failed to load assignments overview.");
      setStudents([]);
      setTotalStudents(0);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Initial load ---------- */
  useEffect(() => {
    fetchOverview();
  }, []);

  /* ---------- Refetch on course change ---------- */
  useEffect(() => {
    if (selectedCourseId) {
      fetchOverview(selectedCourseId);
      setCurrentPage(1);
      setActiveStudent(null);
      setEditGrades({});
    }
  }, [selectedCourseId]);

  /* ---------- Pagination slice ---------- */
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * studentsPerPage;
    const end = start + studentsPerPage;
    return students.slice(start, end);
  }, [students, currentPage, studentsPerPage]);

  /* ---------- Handlers ---------- */
  const handleOpenStudent = (student: TrainerStudent) => {
    setActiveStudent(student);
    const initial: Record<string, { grade?: number; feedback?: string }> = {};
    (student.assignments || []).forEach((a) => {
      if (a.topicId) {
        initial[a.topicId] = {
          grade: a.submission?.grade,
          feedback: a.submission?.feedback,
        };
      }
    });
    setEditGrades(initial);
  };

  const handleCloseStudent = () => {
    setActiveStudent(null);
    setEditGrades({});
  };

  const handleGradeChange = (topicId: string, grade: number | "") => {
    setEditGrades((prev) => ({
      ...prev,
      [topicId]: {
        ...(prev[topicId] || {}),
        grade: grade === "" ? undefined : grade,
      },
    }));
  };

  const handleFeedbackChange = (topicId: string, feedback: string) => {
    setEditGrades((prev) => ({
      ...prev,
      [topicId]: { ...(prev[topicId] || {}), feedback },
    }));
  };

  const handleSave = async (
    topicId: string,
    submissionId?: string,
    studentId?: string
  ) => {
    const edits = editGrades[topicId];
    if (!edits) {
      alert("No changes to save.");
      return;
    }
    setSaving(true);
    try {
      // Call API - allow grading even if submissionId doesn't exist
      await assignmentsApi.grade(
        submissionId || topicId, // fallback to topicId if no submissionId
        edits.grade ?? 0,
        edits.feedback ?? "",
        studentId // pass student id if needed
      );

      setActiveStudent((prev) =>
        prev
          ? {
              ...prev,
              assignments: prev.assignments.map((a) =>
                a.topicId === topicId
                  ? {
                      ...a,
                      submission: {
                        ...(a.submission || {}),
                        _id: submissionId || topicId,
                        grade: edits.grade ?? 0,
                        feedback: edits.feedback ?? "",
                        status: "graded",
                      },
                    }
                  : a
              ),
            }
          : prev
      );

      setStudents((prev) =>
        prev.map((s) =>
          activeStudent && s.id === activeStudent.id
            ? {
                ...s,
                assignments: s.assignments.map((a) =>
                  a.topicId === topicId
                    ? {
                        ...a,
                        submission: {
                          ...(a.submission || {}),
                          _id: submissionId || topicId,
                          grade: edits.grade ?? 0,
                          feedback: edits.feedback ?? "",
                          status: "graded",
                        },
                      }
                    : a
                ),
              }
            : s
        )
      );
    } catch (err) {
      console.error("Failed to save grade", err);
      alert("Failed to save grade/feedback. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getStatusClass = (status?: string) => {
    switch ((status || "").toLowerCase()) {
      case "submitted":
        return "text-green-700 bg-green-100";
      case "graded":
        return "text-blue-700 bg-blue-100";
      default:
        return "text-yellow-700 bg-yellow-100";
    }
  };

  /* ---------- Render ---------- */
  return (
    <div className={`${inter.className} p-6 md:p-10 bg-gray-50 min-h-screen`}>
      <h1
        className="text-3xl font-bold mb-6 text-center"
        style={{ color: BRAND_COLOR }}
      >
        Trainer Assignments Dashboard
      </h1>

      {/* Filters */}
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Select
          onValueChange={(v) => setSelectedCourseId(v || null)}
          value={selectedCourseId || ""}
          disabled={loading || courses.length === 0}
        >
          <SelectTrigger>
            <SelectValue
              placeholder={loading ? "Loading courses..." : "Select a course"}
            />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          onValueChange={(v) => setStudentsPerPage(Number(v))}
          value={String(studentsPerPage)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading / error / empty */}
      {loading ? (
        <div className="text-center py-20 text-gray-600">
          <FileText className="mx-auto mb-4 animate-spin" size={48} />
          Loading students...
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-600">
          <p>{error}</p>
          <Button
            style={{ backgroundColor: BRAND_COLOR, color: "white" }}
            onClick={() => fetchOverview(selectedCourseId || undefined)}
          >
            Retry
          </Button>
        </div>
      ) : !selectedCourseId ? (
        <div className="text-center py-20 text-gray-600">
          Please select a course
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 text-gray-600">
          No students or assignments found
        </div>
      ) : (
        <>
          {/* Students table */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Students</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{student.name}</td>
                      <td className="px-6 py-4">{student.email}</td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() => handleOpenStudent(student)}
                          size="sm"
                          style={{
                            backgroundColor: BRAND_COLOR,
                            color: "white",
                          }}
                          className="hover:opacity-90"
                        >
                          View assignments
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalStudents > studentsPerPage && (
            <div className="flex justify-center mb-6 items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} /> Prev
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight size={16} />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Drawer for student */}
      {activeStudent && (
        <div className="fixed top-0 right-0 h-full w-full md:w-[60%] bg-white shadow-2xl p-6 z-50 overflow-y-auto transition-transform">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-white z-10 pb-2 border-b">
            <h2 className="text-2xl font-semibold">
              {activeStudent.name} — Assignments
            </h2>
            <Button onClick={handleCloseStudent} variant="outline">
              Close
            </Button>
          </div>

          <Card>
            <CardContent className="p-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2">Topic</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Grade</th>
                    <th className="px-3 py-2">Feedback</th>
                    <th className="px-3 py-2">File</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStudent.assignments.map((assn) => {
                    const { topicId, topicTitle, submission } = assn;
                    const edited = editGrades[topicId] ?? {};
                    return (
                      <tr key={topicId} className="border-b">
                        <td className="px-3 py-2">{topicTitle}</td>
                        <td className="px-3 py-2">
                          <span
                            className={cn(
                              "px-2 py-1 rounded-full text-xs",
                              getStatusClass(submission?.status)
                            )}
                          >
                            {submission?.status || "Not Submitted"}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={edited.grade ?? submission?.grade ?? ""}
                            onChange={(e) =>
                              handleGradeChange(
                                topicId,
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value)
                              )
                            }
                            className="w-20 p-1 border rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <textarea
                            rows={1}
                            value={edited.feedback ?? submission?.feedback ?? ""}
                            onChange={(e) =>
                              handleFeedbackChange(topicId, e.target.value)
                            }
                            className="w-full p-1 border rounded"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {submission?.fileUrl ? (
                            <a
                              href={submission.fileUrl}
                              target="_blank"
                              className="text-blue-600 underline"
                            >
                              Download
                            </a>
                          ) : (
                            "No file"
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            onClick={() =>
                              handleSave(
                                topicId,
                                submission?._id,
                                activeStudent.id
                              )
                            }
                            disabled={saving}
                            size="sm"
                            style={{
                              backgroundColor: BRAND_COLOR,
                              color: "white",
                            }}
                            className="hover:opacity-90"
                          >
                            {saving ? "Saving..." : "Save"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
