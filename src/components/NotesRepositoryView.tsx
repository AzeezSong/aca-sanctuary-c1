import React, { useState, useMemo } from 'react';
import { Material, Subject } from '../types';
import {
  Search,
  Download,
  Eye,
  Upload,
  FileText,
  ArrowLeft,
  ArrowUpDown,
  Clock,
  Calendar,
  BookOpen,
  ChevronRight,
  Presentation,
  FileQuestion,
  HelpCircle,
  FolderCheck,
} from 'lucide-react';

interface NotesRepositoryViewProps {
  materials: Material[];
  subjects: Subject[];
  onPreviewMaterial: (material: Material) => void;
  onDownloadMaterial: (material: Material) => void;
  onOpenUpload: (subjectId?: string) => void;
}

type CategoryType = 'all' | 'notes' | 'slides' | 'pyqs' | 'important_questions';
type SortOption = 'uploaded-first' | 'uploaded-latest' | 'name' | 'popular';

export const NotesRepositoryView: React.FC<NotesRepositoryViewProps> = ({
  materials,
  subjects,
  onPreviewMaterial,
  onDownloadMaterial,
  onOpenUpload,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryType>('all');
  const [search, setSearch] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('uploaded-first');

  // Helper to extract numeric timestamp of upload
  const getMaterialUploadTime = (m: Material): number => {
    if (m.createdAt) return m.createdAt;
    if (m.uploadedDate) {
      const parsed = Date.parse(m.uploadedDate);
      if (!isNaN(parsed)) return parsed;
    }
    if (m.id && m.id.startsWith('mat-')) {
      const num = parseInt(m.id.replace('mat-', ''), 10);
      if (!isNaN(num) && num > 1000) return num;
      if (!isNaN(num)) return num * 100000;
    }
    return 0;
  };

  // Compute materials count and breakdown for each subject
  const subjectStats = useMemo(() => {
    const statsMap = new Map<
      string,
      {
        total: number;
        notes: number;
        slides: number;
        pyqs: number;
        importantQs: number;
        earliestDate?: string;
        materials: Material[];
      }
    >();

    subjects.forEach((sub) => {
      const subMaterials = materials.filter(
        (m) => m.subjectId === sub.id || m.subjectCode === sub.code
      );
      const sortedByTime = [...subMaterials].sort(
        (a, b) => getMaterialUploadTime(a) - getMaterialUploadTime(b)
      );

      const notesCount = subMaterials.filter((m) => m.type === 'notes').length;
      const slidesCount = subMaterials.filter(
        (m) => m.type === 'slides' || m.type === 'materials' || m.fileFormat === 'PPTX'
      ).length;
      const pyqsCount = subMaterials.filter((m) => m.type === 'pyqs').length;
      const importantQsCount = subMaterials.filter(
        (m) => m.type === 'important_questions'
      ).length;

      statsMap.set(sub.id, {
        total: subMaterials.length,
        notes: notesCount,
        slides: slidesCount,
        pyqs: pyqsCount,
        importantQs: importantQsCount,
        earliestDate: sortedByTime[0]?.uploadedDate,
        materials: sortedByTime,
      });
    });

    return statsMap;
  }, [subjects, materials]);

  // Selected subject object
  const currentSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId) || null;
  }, [subjects, selectedSubjectId]);

  // Filtered available subjects for the directory view
  const filteredSubjects = useMemo(() => {
    return subjects.filter((sub) => {
      if (subjectSearch.trim()) {
        const q = subjectSearch.toLowerCase();
        return (
          sub.name.toLowerCase().includes(q) ||
          sub.code.toLowerCase().includes(q) ||
          sub.professor.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [subjects, subjectSearch]);

  // Materials for the active selected subject
  const subjectMaterials = useMemo(() => {
    if (!currentSubject) return [];
    return materials.filter(
      (m) => m.subjectId === currentSubject.id || m.subjectCode === currentSubject.code
    );
  }, [materials, currentSubject]);

  // Global upload sequence ranking for selected subject (Earliest upload = #1)
  const uploadOrderMap = useMemo(() => {
    const allSorted = [...subjectMaterials].sort(
      (a, b) => getMaterialUploadTime(a) - getMaterialUploadTime(b)
    );
    const map = new Map<string, number>();
    allSorted.forEach((item, index) => {
      map.set(item.id, index + 1);
    });
    return map;
  }, [subjectMaterials]);

  // Filter materials for selected subject based on category & search
  const filteredMaterials = useMemo(() => {
    return subjectMaterials.filter((m) => {
      // Category filter matching the screenshot tabs
      if (activeCategory === 'notes' && m.type !== 'notes') return false;
      if (
        activeCategory === 'slides' &&
        m.type !== 'slides' &&
        m.type !== 'materials' &&
        m.fileFormat !== 'PPTX'
      )
        return false;
      if (activeCategory === 'pyqs' && m.type !== 'pyqs') return false;
      if (activeCategory === 'important_questions' && m.type !== 'important_questions')
        return false;

      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.unit && m.unit.toLowerCase().includes(q)) ||
          (m.tags && m.tags.some((t) => t.toLowerCase().includes(q)))
        );
      }
      return true;
    });
  }, [subjectMaterials, activeCategory, search]);

  // Sort materials - By default arranged by which was uploaded first (earliest upload first)
  const sortedMaterials = useMemo(() => {
    return [...filteredMaterials].sort((a, b) => {
      if (sortBy === 'uploaded-first') {
        return getMaterialUploadTime(a) - getMaterialUploadTime(b);
      }
      if (sortBy === 'uploaded-latest') {
        return getMaterialUploadTime(b) - getMaterialUploadTime(a);
      }
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'popular') {
        return b.downloadsCount - a.downloadsCount;
      }
      return 0;
    });
  }, [filteredMaterials, sortBy]);

  // Exact categories as seen in user's uploaded image:
  // [ All ]   [ Notes ]   [ Slides ]   [ PYQs ]   [ Important Qs ]
  const categories: { id: CategoryType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'notes', label: 'Notes' },
    { id: 'slides', label: 'Slides' },
    { id: 'pyqs', label: 'PYQs' },
    { id: 'important_questions', label: 'Important Qs' },
  ];

  // ==========================================
  // VIEW 1: AVAILABLE SUBJECTS DIRECTORY
  // ==========================================
  if (!currentSubject) {
    return (
      <main className="w-full max-w-[1280px] mx-auto px-4 md:px-16 py-8 md:py-10 pb-32 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#56615a] uppercase tracking-wider bg-[#56615a]/10 px-2.5 py-0.5 rounded-full border border-[#56615a]/20">
                <BookOpen className="w-3 h-3 text-[#56615a]" /> Available Course Notes
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1c] tracking-tight">
              Subject Notes & Study Directory
            </h1>
            <p className="text-sm text-[#434844] mt-1 max-w-2xl">
              Choose a subject below to browse its complete repository of lecture notes, presentation slides, solved PYQs, and high-yield exam questions.
            </p>
          </div>

          <button
            onClick={() => onOpenUpload()}
            className="inline-flex items-center gap-2 bg-[#56615a] hover:bg-[#434d46] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer self-start md:self-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Material</span>
          </button>
        </div>

        {/* Search and Summary Bar */}
        <div className="bg-[#FEFEFA] border border-[#E5E4E2] rounded-2xl p-4 md:p-5 mb-8 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-[#737874] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search available subjects by name or code (e.g. CS301)..."
              value={subjectSearch}
              onChange={(e) => setSubjectSearch(e.target.value)}
              className="paper-input text-xs pl-9 pr-4 py-2.5 rounded-xl w-full text-[#1b1c1c] placeholder:text-[#737874]"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-[#737874] px-1">
            <FolderCheck className="w-4 h-4 text-[#56615a]" />
            <span>
              <strong>{subjects.length}</strong> Courses registered &bull; <strong>{materials.length}</strong> Total documents uploaded
            </span>
          </div>
        </div>

        {/* Available Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubjects.map((sub) => {
            const stats = subjectStats.get(sub.id) || {
              total: 0,
              notes: 0,
              slides: 0,
              pyqs: 0,
              importantQs: 0,
              earliestDate: undefined,
              materials: [],
            };

            const hasNotes = stats.total > 0;

            return (
              <div
                key={sub.id}
                onClick={() => {
                  setSelectedSubjectId(sub.id);
                  setActiveCategory('all');
                  setSearch('');
                }}
                className="bg-[#FEFEFA] border border-[#E5E4E2] rounded-2xl p-6 flex flex-col justify-between hover:border-[#56615a] hover:shadow-md transition-all group cursor-pointer relative overflow-hidden"
              >
                {/* Accent top line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#56615a] to-[#8c9e92] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Top badges */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="bg-[#b2beb5]/25 text-[#434844] px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wide">
                      {sub.code}
                    </span>

                    {hasNotes ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#56615a] bg-[#56615a]/10 px-2.5 py-0.5 rounded-full border border-[#56615a]/15">
                        <FolderCheck className="w-3 h-3" />
                        {stats.total} {stats.total === 1 ? 'Material' : 'Materials'} Available
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#737874] bg-[#F0EDED] px-2 py-0.5 rounded">
                        No uploads yet
                      </span>
                    )}
                  </div>

                  {/* Title & Professor */}
                  <h3 className="text-xl font-bold text-[#1b1c1c] group-hover:text-[#56615a] transition-colors leading-tight">
                    {sub.name}
                  </h3>
                  <p className="text-xs text-[#737874] mt-1 font-medium flex items-center gap-1.5">
                    <span>Instructor: {sub.professor}</span>
                  </p>

                  {sub.description && (
                    <p className="text-xs text-[#434844] mt-3 line-clamp-2 leading-relaxed">
                      {sub.description}
                    </p>
                  )}

                  {/* Category counts pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t border-[#F0EDED]">
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        stats.notes > 0
                          ? 'bg-[#F0EDED] text-[#1b1c1c] font-semibold'
                          : 'bg-transparent text-[#737874]/60'
                      }`}
                    >
                      {stats.notes} Notes
                    </span>
                    <span className="text-[#C3C8C3] text-xs">&bull;</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        stats.slides > 0
                          ? 'bg-[#F0EDED] text-[#1b1c1c] font-semibold'
                          : 'bg-transparent text-[#737874]/60'
                      }`}
                    >
                      {stats.slides} Slides
                    </span>
                    <span className="text-[#C3C8C3] text-xs">&bull;</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        stats.pyqs > 0
                          ? 'bg-[#F0EDED] text-[#1b1c1c] font-semibold'
                          : 'bg-transparent text-[#737874]/60'
                      }`}
                    >
                      {stats.pyqs} PYQs
                    </span>
                    <span className="text-[#C3C8C3] text-xs">&bull;</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-medium ${
                        stats.importantQs > 0
                          ? 'bg-[#F0EDED] text-[#1b1c1c] font-semibold'
                          : 'bg-transparent text-[#737874]/60'
                      }`}
                    >
                      {stats.importantQs} Important Qs
                    </span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-5 pt-3 border-t border-[#E5E4E2] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#56615a] group-hover:underline flex items-center gap-1">
                    Open Subject Notes <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </span>

                  {stats.earliestDate && (
                    <span className="text-[11px] text-[#737874] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> First: {stats.earliestDate}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredSubjects.length === 0 && (
          <div className="text-center py-16 bg-white border border-[#E5E4E2] rounded-2xl p-8 mt-6">
            <BookOpen className="w-12 h-12 text-[#737874] mx-auto mb-2" />
            <h4 className="text-lg font-bold text-[#1b1c1c]">No subjects matched "{subjectSearch}"</h4>
            <p className="text-xs text-[#737874] mt-1">Try searching by course code like CS301 or course title.</p>
          </div>
        )}
      </main>
    );
  }

  // =========================================================================
  // VIEW 2: SUBJECT NOTES VIEW (Chronologically arranged by uploaded first)
  // With exact category bar: [ All ] [ Notes ] [ Slides ] [ PYQs ] [ Important Qs ]
  // =========================================================================
  return (
    <main className="w-full max-w-[1280px] mx-auto px-4 md:px-16 py-8 md:py-10 pb-32 min-h-screen">
      {/* Top Navigation & Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setSelectedSubjectId(null)}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#56615a] hover:text-[#1b1c1c] bg-[#F6F3F2] hover:bg-[#EAE6E4] px-3.5 py-2 rounded-xl border border-[#E5E4E2] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Available Subjects</span>
        </button>

        {/* Quick subject switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#737874] font-medium hidden sm:inline">Switch Subject:</span>
          <select
            value={currentSubject.id}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setActiveCategory('all');
              setSearch('');
            }}
            className="bg-[#FEFEFA] border border-[#E5E4E2] text-xs font-bold text-[#1b1c1c] rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject Header Banner */}
      <div className="bg-[#FEFEFA] border border-[#E5E4E2] rounded-2xl p-6 md:p-8 mb-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#b2beb5]/25 text-[#434844] px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                {currentSubject.code}
              </span>
              <span className="text-xs text-[#737874] font-semibold">
                Instructor: {currentSubject.professor}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#1b1c1c] tracking-tight">
              {currentSubject.name}
            </h1>
            <p className="text-xs md:text-sm text-[#434844] mt-1.5 max-w-3xl leading-relaxed">
              {currentSubject.description ||
                `Study materials, notes, presentations, and past exam questions for ${currentSubject.name}. All documents below are chronologically ordered by initial upload.`}
            </p>
          </div>

          <button
            onClick={() => onOpenUpload(currentSubject.id)}
            className="inline-flex items-center gap-2 bg-[#56615a] hover:bg-[#434d46] text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer self-start md:self-auto shrink-0"
          >
            <Upload className="w-4 h-4" />
            <span>Upload for {currentSubject.code}</span>
          </button>
        </div>
      </div>

      {/* ======================================================= */}
      {/* EXACT SECTION REQUESTED:                                */}
      {/* [ All ]   [ Notes ]   [ Slides ]   [ PYQs ]   [ Important Qs ] */}
      {/* ======================================================= */}
      <div className="bg-[#FEFEFA] border border-[#E5E4E2] rounded-2xl p-4 md:p-5 mb-6 shadow-xs flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {/* Exact pill group from user screenshot */}
          <div className="bg-[#F0EDED] p-1 rounded-full border border-[#E5E4E2] inline-flex items-center gap-1 shadow-2xs overflow-x-auto hide-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-white text-[#1b1c1c] shadow-xs'
                      : 'text-[#737874] hover:text-[#1b1c1c]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Sort selector defaulting to uploaded first */}
          <div className="flex items-center gap-1.5 bg-[#F6F3F2] px-3 py-1.5 rounded-full border border-[#E5E4E2]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#56615a]" />
            <span className="text-[11px] font-bold text-[#737874]">Order:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-xs font-bold text-[#1b1c1c] focus:outline-none cursor-pointer pr-1"
            >
              <option value="uploaded-first">Uploaded First (Earliest)</option>
              <option value="uploaded-latest">Uploaded Last (Newest)</option>
              <option value="name">Title (A - Z)</option>
              <option value="popular">Most Downloaded</option>
            </select>
          </div>
        </div>

        {/* Search inside this subject's materials */}
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 text-[#737874] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${currentSubject.code} notes or topics...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="paper-input text-xs pl-9 pr-4 py-2 rounded-xl w-full text-[#1b1c1c] placeholder:text-[#737874]"
          />
        </div>
      </div>

      {/* Sorting Status Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 px-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#56615a]/10 text-[#434844] text-xs font-bold border border-[#56615a]/15">
            <Clock className="w-3.5 h-3.5 text-[#56615a]" />
            {sortBy === 'uploaded-first' ? (
              <span>Arranged by Upload Order: <strong>Uploaded First (Earliest)</strong></span>
            ) : sortBy === 'uploaded-latest' ? (
              <span>Arranged by Upload Order: <strong>Uploaded Last (Newest)</strong></span>
            ) : sortBy === 'name' ? (
              <span>Arranged Alphabetically (A - Z)</span>
            ) : (
              <span>Arranged by Most Downloaded</span>
            )}
          </span>
          <span className="text-xs text-[#737874]">
            ({sortedMaterials.length} {sortedMaterials.length === 1 ? 'document' : 'documents'})
          </span>
        </div>

        {sortBy !== 'uploaded-first' && (
          <button
            onClick={() => setSortBy('uploaded-first')}
            className="text-xs text-[#56615a] hover:underline font-bold cursor-pointer"
          >
            ← Reset to Uploaded First
          </button>
        )}
      </div>

      {/* Materials Grid for the Selected Subject */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedMaterials.map((item) => {
          const uploadRank = uploadOrderMap.get(item.id);
          const isPresentation = item.type === 'slides' || item.fileFormat === 'PPTX';
          const isPyq = item.type === 'pyqs';
          const isImportant = item.type === 'important_questions';

          return (
            <div
              key={item.id}
              className="bg-[#FEFEFA] border border-[#E5E4E2] rounded-2xl p-6 flex flex-col justify-between hover:border-[#56615a] transition-all group relative shadow-[0_4px_20px_rgba(51,51,51,0.02)] hover:shadow-md"
            >
              <div>
                {/* Header info */}
                <div className="flex justify-between items-start mb-2 gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#b2beb5]/25 text-[#434844] px-2.5 py-0.5 rounded text-[11px] font-bold uppercase">
                      {item.subjectCode}
                    </span>
                    <span className="text-[11px] font-semibold text-[#737874] bg-[#F0EDED] px-2 py-0.5 rounded">
                      {item.fileFormat}
                    </span>
                    {item.unit && (
                      <span className="text-[11px] font-semibold text-[#56615a] bg-[#56615a]/10 px-2 py-0.5 rounded">
                        {item.unit}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {uploadRank && (
                      <span
                        className="bg-[#56615a]/10 text-[#56615a] border border-[#56615a]/20 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight"
                        title={`Uploaded #${uploadRank} in ${currentSubject.name}`}
                      >
                        #{uploadRank} Uploaded
                      </span>
                    )}
                    <span className="text-xs font-medium text-[#737874]">{item.fileSize}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-lg md:text-xl font-bold text-[#1b1c1c] group-hover:text-[#56615a] transition-colors leading-snug mt-2">
                  {item.title}
                </h3>

                {/* Category Type Badge */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  {isPresentation ? (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Presentation className="w-3 h-3" /> Slides
                    </span>
                  ) : isPyq ? (
                    <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FileQuestion className="w-3 h-3" /> PYQs
                    </span>
                  ) : isImportant ? (
                    <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <HelpCircle className="w-3 h-3" /> Important Qs
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#434844] bg-[#F0EDED] border border-[#E5E4E2] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Notes
                    </span>
                  )}

                  <span className="text-xs text-[#737874] truncate">{item.subjectName}</span>
                </div>

                {item.description && (
                  <p className="text-xs text-[#434844] mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-6 pt-4 border-t border-[#E4E2E1] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#F0EDED] overflow-hidden border border-[#C3C8C3]/50">
                    <img
                      src={item.uploadedBy.avatar}
                      alt={item.uploadedBy.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-xs text-[#737874]">{item.uploadedBy.name}</span>
                </div>

                <div className="flex items-center gap-1 text-xs text-[#737874]">
                  <Calendar className="w-3 h-3 text-[#737874]" />
                  <span>{item.uploadedDate}</span>
                </div>
              </div>

              {/* Hover quick action overlay */}
              <div className="absolute inset-0 bg-[#F6F3F2]/90 backdrop-blur-[2px] flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all rounded-2xl p-4">
                <button
                  onClick={() => onPreviewMaterial(item)}
                  className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-[#56615a] hover:bg-[#F0EDED] transition-colors cursor-pointer"
                  title="Read / Preview"
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onDownloadMaterial(item)}
                  className="w-12 h-12 bg-[#56615a] text-white rounded-full shadow-md flex items-center justify-center hover:bg-[#434d46] transition-colors cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {sortedMaterials.length === 0 && (
        <div className="text-center py-16 bg-white border border-[#E5E4E2] rounded-2xl p-8 mt-4">
          <FileText className="w-12 h-12 text-[#737874] mx-auto mb-2" />
          <h4 className="text-lg font-bold text-[#1b1c1c]">No materials in this category</h4>
          <p className="text-xs text-[#737874] mt-1 max-w-md mx-auto">
            There are currently no documents matching "{activeCategory}" for {currentSubject.name}.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveCategory('all')}
              className="text-xs font-bold text-[#56615a] hover:underline"
            >
              Show All Materials
            </button>
            <span className="text-[#C3C8C3]">&bull;</span>
            <button
              onClick={() => onOpenUpload(currentSubject.id)}
              className="text-xs font-bold bg-[#56615a] text-white px-3 py-1.5 rounded-lg hover:bg-[#434d46]"
            >
              Upload Material Now
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
