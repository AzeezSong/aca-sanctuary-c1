import React, { useState, useMemo } from 'react';
import { Exam, Material } from '../types';
import {
  Calendar,
  Clock,
  Tag,
  Plus,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Archive,
  Layers,
  ChevronRight,
  Eye,
  Download,
  Upload,
  BookOpen,
  Filter,
} from 'lucide-react';

interface ExamsScheduleViewProps {
  exams: Exam[];
  materials?: Material[];
  onAddExam: (examData: any) => void;
  onToggleComplete?: (examId: string, currentCompleted?: boolean) => void;
  onNavigateToSubject: (subjectCode: string) => void;
  onPreviewMaterial?: (material: Material) => void;
  onDownloadMaterial?: (material: Material) => void;
  onOpenUpload?: (subjectId?: string, examType?: string) => void;
}

export const ExamsScheduleView: React.FC<ExamsScheduleViewProps> = ({
  exams,
  materials = [],
  onAddExam,
  onToggleComplete,
  onNavigateToSubject,
  onPreviewMaterial,
  onDownloadMaterial,
  onOpenUpload,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [selectedAssessmentFilter, setSelectedAssessmentFilter] = useState<string>('all');
  const [onlyWithMaterials, setOnlyWithMaterials] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form states
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [date, setDate] = useState('2026-09-25');
  const [time, setTime] = useState('10:00 AM - 01:00 PM');
  const [examType, setExamType] = useState('IAT 1');
  const [isCompletedInput, setIsCompletedInput] = useState(false);

  // Simulated current date
  const todayStr = '2026-09-05';

  const computeDays = (targetDate: string): number => {
    try {
      const today = new Date(todayStr + 'T00:00:00');
      const target = new Date(targetDate + 'T00:00:00');
      const diff = target.getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch {
      return 10;
    }
  };

  const formatDateDisplay = (dateStr: string): string => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Helper to find recommended study materials for an exam based on subject & exam type
  const getRecommendedMaterials = (exam: Exam, currentGroupType?: string): Material[] => {
    if (!materials || materials.length === 0) return [];
    const examSubCode = (exam.subjectCode || '').trim().toLowerCase();
    const examSubName = (exam.subjectName || '').trim().toLowerCase();
    const targetExamType = (currentGroupType || exam.examType || exam.venue || '').trim().toLowerCase();

    return materials.filter((m) => {
      // 1. Must match the subject
      const matchesSubject =
        (m.subjectCode && m.subjectCode.trim().toLowerCase() === examSubCode) ||
        (m.subjectName && m.subjectName.trim().toLowerCase() === examSubName);
      if (!matchesSubject) return false;

      // 2. Must match the recommended assessment
      const recExam = (m.recommendedExam || '').trim().toLowerCase();
      if (!recExam) {
        if (
          targetExamType &&
          (m.tags?.some((t) => t.toLowerCase() === targetExamType) ||
            m.unit?.toLowerCase() === targetExamType)
        ) {
          return true;
        }
        return false;
      }

      if (
        recExam === 'all' ||
        recExam === 'all exams' ||
        recExam === 'general preparation' ||
        recExam === 'general'
      ) {
        return true;
      }

      if (recExam === targetExamType) return true;
      if (targetExamType && (recExam.includes(targetExamType) || targetExamType.includes(recExam))) {
        return true;
      }

      return false;
    });
  };

  const getSubjectMaterialsTotal = (exam: Exam): number => {
    if (!materials) return 0;
    const examSubCode = (exam.subjectCode || '').trim().toLowerCase();
    const examSubName = (exam.subjectName || '').trim().toLowerCase();
    return materials.filter(
      (m) =>
        (m.subjectCode && m.subjectCode.trim().toLowerCase() === examSubCode) ||
        (m.subjectName && m.subjectName.trim().toLowerCase() === examSubName)
    ).length;
  };

  // Check if exam is completed
  const isExamCompleted = (exam: Exam): boolean => {
    if (typeof exam.isCompleted === 'boolean') {
      return exam.isCompleted;
    }
    const days = exam.daysRemaining !== undefined ? exam.daysRemaining : computeDays(exam.date);
    return days < 0;
  };

  // Split into upcoming and completed
  const upcomingExams = exams.filter((e) => !isExamCompleted(e));
  const completedExams = exams.filter((e) => isExamCompleted(e));

  // Group upcoming exams by examType
  const groupsMap: { [type: string]: Exam[] } = {};
  upcomingExams.forEach((exam) => {
    const rawType = (exam.examType || exam.venue || 'General Assessment').trim();
    if (!groupsMap[rawType]) {
      groupsMap[rawType] = [];
    }
    groupsMap[rawType].push(exam);
  });

  // Sort subjects within each group chronologically by date and time
  Object.keys(groupsMap).forEach((type) => {
    groupsMap[type].sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.time || '').localeCompare(b.time || '');
    });
  });

  // Order groups themselves based on which assessment commences first
  const allUpcomingGroups = Object.keys(groupsMap)
    .map((type) => {
      const subjectList = groupsMap[type];
      const earliestDate = subjectList[0]?.date || '9999-99-99';
      const earliestDays = computeDays(earliestDate);
      return {
        type,
        exams: subjectList,
        earliestDate,
        earliestDays,
        subjectCount: subjectList.length,
      };
    })
    .sort((g1, g2) => g1.earliestDate.localeCompare(g2.earliestDate));

  // Filter groups according to user selection
  const sortedUpcomingGroups = allUpcomingGroups
    .filter((g) => {
      if (selectedAssessmentFilter !== 'all' && g.type !== selectedAssessmentFilter) {
        return false;
      }
      return true;
    })
    .map((g) => {
      if (!onlyWithMaterials) return g;
      const filteredExams = g.exams.filter(
        (ex) => getRecommendedMaterials(ex, g.type).length > 0
      );
      return {
        ...g,
        exams: filteredExams,
        subjectCount: filteredExams.length,
      };
    })
    .filter((g) => g.exams.length > 0);

  // Available assessment types
  const availableAssessmentTypes = useMemo(() => {
    const types = new Set<string>();
    exams.forEach((e) => {
      const t = (e.examType || e.venue || '').trim();
      if (t) types.add(t);
    });
    return Array.from(types);
  }, [exams]);

  // Overall count of recommended materials linked in upcoming schedule
  const totalRecommendedCount = useMemo(() => {
    let count = 0;
    upcomingExams.forEach((e) => {
      count += getRecommendedMaterials(e).length;
    });
    return count;
  }, [upcomingExams, materials]);

  // Sort completed exams with most recent first
  const sortedCompletedExams = [...completedExams].sort((a, b) => {
    const dateA = a.date || '';
    const dateB = b.date || '';
    return dateB.localeCompare(dateA);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;
    
    onAddExam({
      subjectName,
      subjectCode: subjectCode || 'CS300',
      date,
      time,
      examType: examType.trim() || 'IAT 1',
      isCompleted: isCompletedInput,
    });

    setSubjectName('');
    setSubjectCode('');
    setExamType('IAT 1');
    setIsCompletedInput(false);
    setShowAddModal(false);
  };

  return (
    <main className="w-full max-w-[1280px] mx-auto px-4 md:px-16 py-8 md:py-10 pb-32 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="text-xs font-bold text-[#737874] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#56615a]" /> Examination Schedule & Timetable
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1b1c1c] tracking-tight mt-1">
            Exam Assessment Timetable
          </h1>
          <p className="text-sm text-[#434844] mt-1 max-w-2xl">
            Subjects are categorized by assessment type (IAT 1, IAT 2, SEM) and arranged in chronological order by commencement date.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#56615a] hover:bg-[#424d46] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Exam Schedule
        </button>
      </div>

      {/* Filter Tabs and Assessment Filters */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E4E2E1] pb-4">
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#56615a] text-white shadow-xs'
                  : 'bg-[#FEFEFA] text-[#56615a] hover:bg-[#F3EFE6] border border-[#E5E4E2]'
              }`}
            >
              All Schedules ({exams.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'bg-[#56615a] text-white shadow-xs'
                  : 'bg-[#FEFEFA] text-[#56615a] hover:bg-[#F3EFE6] border border-[#E5E4E2]'
              }`}
            >
              <span>Upcoming Assessments</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'upcoming'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#56615a]/10 text-[#56615a]'
                }`}
              >
                {upcomingExams.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-[#56615a] text-white shadow-xs'
                  : 'bg-[#FEFEFA] text-[#56615a] hover:bg-[#F3EFE6] border border-[#E5E4E2]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Completed Exams</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'completed'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#56615a]/10 text-[#56615a]'
                }`}
              >
                {completedExams.length}
              </span>
            </button>
          </div>

          {/* Recommended Materials Indicator */}
          <div className="flex items-center gap-2">
            <span className="text-xs bg-[#EAF1EA] text-[#2A6E3B] border border-[#B5DEC0] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#e5a93c]" />
              <span>{totalRecommendedCount} Study Documents Linked to Timetable</span>
            </span>
          </div>
        </div>

        {/* Assessment and Material Filters Bar */}
        {(activeTab === 'all' || activeTab === 'upcoming') && availableAssessmentTypes.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-[#F9F7F4] p-3 rounded-2xl border border-[#E5E4E2]">
            <span className="text-[11px] font-bold text-[#737874] uppercase tracking-wider flex items-center gap-1 mr-1">
              <Filter className="w-3 h-3 text-[#56615a]" /> Filter Assessment:
            </span>
            <button
              onClick={() => setSelectedAssessmentFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedAssessmentFilter === 'all'
                  ? 'bg-[#56615a] text-white shadow-2xs'
                  : 'bg-white text-[#56615a] hover:bg-[#F0EDED] border border-[#D1D5DB]'
              }`}
            >
              All Types
            </button>
            {availableAssessmentTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedAssessmentFilter(type)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedAssessmentFilter === type
                    ? 'bg-[#56615a] text-white shadow-2xs'
                    : 'bg-white text-[#56615a] hover:bg-[#F0EDED] border border-[#D1D5DB]'
                }`}
              >
                {type}
              </button>
            ))}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setOnlyWithMaterials(!onlyWithMaterials)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  onlyWithMaterials
                    ? 'bg-[#2A6E3B] text-white border-[#2A6E3B]'
                    : 'bg-white text-[#434844] hover:text-[#1b1c1c] border-[#D1D5DB]'
                }`}
              >
                <Sparkles className="w-3 h-3 text-[#e5a93c]" />
                <span>With Recommended Material Only</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* UPCOMING EXAMS SECTION (GROUPED BY TYPE AND ORDERED BY COMMENCEMENT DATE) */}
      {(activeTab === 'all' || activeTab === 'upcoming') && (
        <div className="space-y-12 mb-16">
          {sortedUpcomingGroups.length === 0 ? (
            <div className="bg-[#FEFEFA] border border-[#E5E4E2] rounded-2xl p-10 text-center">
              <div className="w-12 h-12 rounded-full bg-[#56615a]/10 text-[#56615a] flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#1b1c1c]">No Matching Exams Found</h3>
              <p className="text-xs text-[#737874] mt-1 max-w-sm mx-auto">
                {onlyWithMaterials
                  ? 'No upcoming exams currently have recommended materials matching this filter.'
                  : 'All scheduled assessments have concluded or no exams match your filter!'}
              </p>
              {onlyWithMaterials && (
                <button
                  onClick={() => setOnlyWithMaterials(false)}
                  className="mt-3 px-3 py-1.5 bg-[#56615a] text-white text-xs font-bold rounded-xl"
                >
                  Show All Exams
                </button>
              )}
            </div>
          ) : (
            sortedUpcomingGroups.map((group, groupIdx) => {
              const daysLeft = group.earliestDays;
              const countdownLabel =
                daysLeft === 0
                  ? 'Commencing Today'
                  : daysLeft === 1
                  ? 'Commencing Tomorrow'
                  : daysLeft > 1
                  ? `Commencing in ${daysLeft} days`
                  : 'In Progress';

              return (
                <section
                  key={group.type}
                  id={`section-${group.type.toLowerCase().replace(/\s+/g, '-')}`}
                  className="space-y-4"
                >
                  {/* Assessment Type Header */}
                  <div className="bg-gradient-to-r from-[#F6F3F2] via-[#FAF8F5] to-transparent p-5 rounded-2xl border border-[#E5E4E2] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-[#56615a] text-white flex items-center justify-center font-black text-sm shadow-xs">
                        #{groupIdx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-2xl font-extrabold text-[#1b1c1c] tracking-tight">
                            {group.type}
                          </h2>
                          <span className="bg-[#56615a]/10 text-[#2c332e] px-2.5 py-0.5 rounded-full text-xs font-bold border border-[#56615a]/20">
                            {group.subjectCount} {group.subjectCount === 1 ? 'Subject' : 'Subjects'}
                          </span>
                        </div>
                        <p className="text-xs text-[#56615a] font-medium mt-0.5 flex items-center gap-1.5">
                          <span>First Exam Starts:</span>
                          <strong>{formatDateDisplay(group.earliestDate)}</strong>
                          <span className="text-[#737874]">• Recommended materials for this assessment shown below</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 bg-white rounded-xl border border-[#E5E4E2] text-xs font-bold text-[#1b1c1c] shadow-2xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#56615a]" />
                        {countdownLabel}
                      </span>
                    </div>
                  </div>

                  {/* Subject Timetable Cards for this Group in Chronological Order */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {group.exams.map((exam, examIdx) => {
                      const daysRemaining =
                        exam.daysRemaining !== undefined ? exam.daysRemaining : computeDays(exam.date);
                      const recommendedMats = getRecommendedMaterials(exam, group.type);
                      const subjectTotalCount = getSubjectMaterialsTotal(exam);

                      return (
                        <div
                          key={exam.id}
                          className="bg-[#FEFEFA] border border-[#E5E4E2] rounded-2xl p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(51,51,51,0.02)] hover:border-[#b2beb5] transition-all relative group"
                        >
                          <div>
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-[#b2beb5]/25 text-[#434844] px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border border-[#b2beb5]/30">
                                  {exam.subjectCode}
                                </span>
                                <span className="text-[11px] font-bold text-[#737874] bg-[#F6F3F2] px-2 py-0.5 rounded-md border border-[#E5E4E2]">
                                  Exam {examIdx + 1} of {group.subjectCount}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="text-xl font-black text-[#1b1c1c] block leading-none">
                                  {daysRemaining >= 0 ? daysRemaining : 0}
                                </span>
                                <span className="text-[9px] uppercase font-bold text-[#737874] tracking-wider">
                                  Days left
                                </span>
                              </div>
                            </div>

                            {/* Subject Title */}
                            <h3 className="text-lg font-bold text-[#1b1c1c] mb-3 leading-snug">
                              {exam.subjectName}
                            </h3>

                            {/* Date and Time Details */}
                            <div className="space-y-2 text-xs text-[#434844] bg-[#F9F7F5] p-3 rounded-xl border border-[#ECEAE7]">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-[#56615a] flex-shrink-0" />
                                <span>
                                  Date:{' '}
                                  <strong className="text-[#1b1c1c]">
                                    {formatDateDisplay(exam.date)}
                                  </strong>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-[#56615a] flex-shrink-0" />
                                <span>
                                  Time: <strong className="text-[#1b1c1c]">{exam.time}</strong>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Tag className="w-3.5 h-3.5 text-[#56615a] flex-shrink-0" />
                                <span>
                                  Assessment: <strong className="text-[#1b1c1c]">{group.type}</strong>
                                </span>
                              </div>
                            </div>

                            {/* RECOMMENDED STUDY MATERIAL FOR THIS EXAM & SUBJECT */}
                            <div className="mt-4 pt-3.5 border-t border-[#ECEAE7] space-y-2">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 text-[#e5a93c]" />
                                  <span className="text-xs font-extrabold text-[#1b1c1c] tracking-tight">
                                    Recommended Material
                                  </span>
                                </div>
                                {recommendedMats.length > 0 && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EBF3ED] text-[#2A6E3B] border border-[#B5DEC0]">
                                    {recommendedMats.length} {recommendedMats.length === 1 ? 'doc' : 'docs'}
                                  </span>
                                )}
                              </div>

                              {recommendedMats.length > 0 ? (
                                <div className="space-y-1.5">
                                  {recommendedMats.slice(0, 2).map((mat) => (
                                    <div
                                      key={mat.id}
                                      className="bg-[#FAF9F7] hover:bg-[#F3EFEA] border border-[#E5E4E2] hover:border-[#b2beb5] rounded-xl p-2.5 transition-all flex items-center justify-between gap-2.5 group/item"
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-6 h-6 rounded-md bg-[#56615a]/10 text-[#56615a] flex items-center justify-center text-[9px] font-black uppercase flex-shrink-0">
                                          {mat.fileFormat || 'PDF'}
                                        </span>
                                        <div className="min-w-0">
                                          <h4
                                            className="text-xs font-bold text-[#1b1c1c] truncate leading-tight group-hover/item:text-[#56615a] transition-colors"
                                            title={mat.title}
                                          >
                                            {mat.title}
                                          </h4>
                                          <div className="flex items-center gap-1.5 text-[10px] text-[#737874] mt-0.5 truncate">
                                            <span className="font-semibold text-[#56615a]">
                                              🎯 {mat.recommendedExam || group.type}
                                            </span>
                                            {mat.unit && (
                                              <>
                                                <span>•</span>
                                                <span>{mat.unit}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {onPreviewMaterial && (
                                          <button
                                            type="button"
                                            onClick={() => onPreviewMaterial(mat)}
                                            className="px-2 py-1 bg-white hover:bg-[#56615a] text-[#434844] hover:text-white rounded-md text-[11px] font-bold transition-all border border-[#DCDAD6] hover:border-[#56615a] flex items-center gap-1 cursor-pointer shadow-2xs"
                                            title="Preview document notes"
                                          >
                                            <Eye className="w-3 h-3" />
                                            <span className="hidden sm:inline">Preview</span>
                                          </button>
                                        )}
                                        {onDownloadMaterial && (
                                          <button
                                            type="button"
                                            onClick={() => onDownloadMaterial(mat)}
                                            className="p-1 text-[#737874] hover:text-[#1b1c1c] hover:bg-white rounded-md transition-colors cursor-pointer"
                                            title="Download file"
                                          >
                                            <Download className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                  {recommendedMats.length > 2 && (
                                    <div className="pt-0.5 flex items-center justify-between text-[11px] px-1">
                                      <span className="text-[#737874] font-medium">
                                        +{recommendedMats.length - 2} more materials
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => onNavigateToSubject(exam.subjectCode)}
                                        className="font-bold text-[#56615a] hover:underline cursor-pointer"
                                      >
                                        View all in Notes →
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="bg-[#FAF9F7] border border-dashed border-[#DCDAD6] rounded-xl p-2.5 text-center">
                                  <p className="text-[11px] text-[#737874] mb-1.5 font-medium">
                                    No material tagged for <strong className="font-semibold text-[#434844]">{group.type}</strong> yet.
                                  </p>
                                  <div className="flex items-center justify-center gap-2 flex-wrap">
                                    {onOpenUpload && (
                                      <button
                                        type="button"
                                        onClick={() => onOpenUpload(exam.id, group.type)}
                                        className="px-2.5 py-1 bg-white hover:bg-[#F0EDED] text-[#56615a] hover:text-[#1b1c1c] rounded-lg text-[11px] font-bold border border-[#D1D5DB] transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                                      >
                                        <Upload className="w-3 h-3" /> + Upload for {group.type}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => onNavigateToSubject(exam.subjectCode)}
                                      className="text-[11px] font-bold text-[#56615a] hover:underline cursor-pointer"
                                    >
                                      All {exam.subjectCode} Notes ({subjectTotalCount})
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer */}
                          <div className="mt-5 pt-4 border-t border-[#E4E2E1] flex items-center justify-between gap-3">
                            {onToggleComplete && (
                              <button
                                onClick={() => onToggleComplete(exam.id, false)}
                                className="px-2.5 py-1.5 bg-[#F6F3F2] hover:bg-[#E8F3EB] text-[#56615a] hover:text-[#2A6E3B] text-xs font-bold rounded-lg transition-colors border border-[#E5E4E2] hover:border-[#B5DEC0] flex items-center gap-1.5 cursor-pointer"
                                title="Mark this exam as concluded/completed"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Done</span>
                              </button>
                            )}

                            <button
                              onClick={() => onNavigateToSubject(exam.subjectCode)}
                              className="text-xs font-bold text-[#56615a] hover:text-[#1b1c1c] flex items-center gap-1 cursor-pointer ml-auto whitespace-nowrap"
                            >
                              Browse All {exam.subjectCode} Notes <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      )}

      {/* COMPLETED EXAMS SECTION */}
      {(activeTab === 'all' || activeTab === 'completed') && (
        <section className="mt-12 pt-8 border-t-2 border-dashed border-[#E4E2E1]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2A6E3B]/10 text-[#2A6E3B] flex items-center justify-center">
                  <Archive className="w-4 h-4" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#1b1c1c] tracking-tight">
                  Completed Exams
                </h2>
                <span className="bg-[#2A6E3B]/10 text-[#2A6E3B] px-2.5 py-0.5 rounded-full text-xs font-bold border border-[#2A6E3B]/20">
                  {sortedCompletedExams.length} Concluded
                </span>
              </div>
              <p className="text-xs text-[#737874] mt-1">
                Archived timetable of exams that were successfully concluded or marked as finished.
              </p>
            </div>
          </div>

          {sortedCompletedExams.length === 0 ? (
            <div className="bg-[#FEFEFA] border border-[#E5E4E2] rounded-2xl p-8 text-center">
              <p className="text-xs text-[#737874]">
                No completed exams recorded yet. Once an assessment date passes or you click &quot;Mark Done&quot;, it will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedCompletedExams.map((exam) => {
                const recMats = getRecommendedMaterials(exam, exam.examType);

                return (
                  <div
                    key={exam.id}
                    className="bg-[#FAF9F7] border border-[#E5E4E2] rounded-2xl p-6 flex flex-col justify-between shadow-2xs opacity-90 hover:opacity-100 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-[#E4E2E1] text-[#56615a] px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                            {exam.subjectCode}
                          </span>
                          <span className="bg-[#2A6E3B]/10 text-[#2A6E3B] px-2.5 py-0.5 rounded-full text-xs font-extrabold flex items-center gap-1 border border-[#2A6E3B]/20">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        </div>

                        <span className="px-2 py-0.5 bg-white rounded-md text-[11px] font-bold text-[#56615a] border border-[#E5E4E2]">
                          {exam.examType || exam.venue || 'IAT 1'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#1b1c1c] mb-2 line-through decoration-[#737874]/40">
                        {exam.subjectName}
                      </h3>

                      <div className="space-y-1.5 text-xs text-[#737874] bg-white p-3 rounded-xl border border-[#E5E4E2]">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[#737874]" />
                          <span>
                            Held on: <strong>{formatDateDisplay(exam.date)}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#737874]" />
                          <span>
                            Time: <strong>{exam.time}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Completed exam study materials recap */}
                      {recMats.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-[#E5E4E2]">
                          <span className="text-[11px] font-semibold text-[#56615a] block mb-1">
                            Materials studied ({recMats.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {recMats.slice(0, 2).map((m) => (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => onPreviewMaterial && onPreviewMaterial(m)}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white hover:bg-[#F0EDED] text-[#1b1c1c] border border-[#D1D5DB] truncate max-w-[200px] cursor-pointer"
                                title={m.title}
                              >
                                {m.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-[#E5E4E2] flex items-center justify-between gap-2">
                      {onToggleComplete && (
                        <button
                          onClick={() => onToggleComplete(exam.id, true)}
                          className="text-[11px] font-bold text-[#737874] hover:text-[#1b1c1c] flex items-center gap-1 cursor-pointer transition-colors"
                          title="Move back to upcoming schedule"
                        >
                          <RotateCcw className="w-3 h-3" /> Mark as Upcoming
                        </button>
                      )}

                      <button
                        onClick={() => onNavigateToSubject(exam.subjectCode)}
                        className="text-xs font-bold text-[#56615a] hover:text-[#1b1c1c] flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        Subject Archive <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Add Exam Timetable Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E5E4E2] shadow-2xl">
            <h3 className="text-xl font-bold text-[#1b1c1c] mb-1">Add Exam Timetable Entry</h3>
            <p className="text-xs text-[#737874] mb-4">
              Post an upcoming assessment (e.g. IAT 1, IAT 2, SEM). Timetables will automatically group by assessment type and order chronologically.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#434844] block mb-1">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Operating Systems"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="paper-input w-full p-2.5 rounded-lg text-xs font-medium text-[#1b1c1c]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[#434844] block mb-1">Course Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS302"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="paper-input w-full p-2.5 rounded-lg text-xs font-medium text-[#1b1c1c]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#434844] block mb-1">Exam Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="paper-input w-full p-2.5 rounded-lg text-xs font-medium text-[#1b1c1c]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[#434844] block mb-1">Time Range</label>
                <input
                  type="text"
                  placeholder="10:00 AM - 01:00 PM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="paper-input w-full p-2.5 rounded-lg text-xs font-medium text-[#1b1c1c]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#434844] block mb-1">
                  Assessment / Exam Type *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IAT 1, IAT 2, SEM, Model Exam"
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="paper-input w-full p-2.5 rounded-lg text-xs font-medium text-[#1b1c1c]"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-[#737874] font-medium">Presets:</span>
                  {['IAT 1', 'IAT 2', 'SEM', 'Model Exam', 'Quiz'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExamType(preset)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                        examType === preset
                          ? 'bg-[#56615a] text-white border-[#56615a] shadow-xs'
                          : 'bg-[#F6F3F2] text-[#56615a] border-[#E4E2E1] hover:bg-[#EAE7E6]'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="markCompletedCheckbox"
                  checked={isCompletedInput}
                  onChange={(e) => setIsCompletedInput(e.target.checked)}
                  className="rounded border-[#E4E2E1] text-[#56615a] focus:ring-[#56615a] cursor-pointer"
                />
                <label htmlFor="markCompletedCheckbox" className="text-xs text-[#434844] cursor-pointer">
                  This exam is already completed (add directly to Completed Archive)
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#737874] hover:bg-[#F0EDED] rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#56615a] hover:bg-[#424d46] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Add to Timetable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
