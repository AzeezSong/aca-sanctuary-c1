import React, { useState } from 'react';
import { Subject, Material, MaterialType } from '../types';
import { Download, Eye, Plus, Search, BookOpen, FileCheck, CheckCircle2 } from 'lucide-react';

interface SubjectDetailViewProps {
  subject: Subject;
  materials: Material[];
  onOpenUpload: (subjectId?: string) => void;
  onPreviewMaterial: (material: Material) => void;
  onDownloadMaterial: (material: Material) => void;
}

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({
  subject,
  materials,
  onOpenUpload,
  onPreviewMaterial,
  onDownloadMaterial,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'notes', label: 'Notes' },
    { id: 'slides', label: 'Slides' },
    { id: 'pyqs', label: 'PYQs' },
    { id: 'important_questions', label: 'Important Qs' },
  ];

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

  // Filter and arrange materials based on current active tab, search query, and which was uploaded first
  const sortedMaterials = [...materials]
    .filter((m) => {
      const matchesSubject = m.subjectId === subject.id || m.subjectCode === subject.code;
      if (!matchesSubject) return false;

      if (activeTab === 'notes' && m.type !== 'notes') return false;
      if (
        activeTab === 'slides' &&
        m.type !== 'slides' &&
        m.type !== 'materials' &&
        m.fileFormat !== 'PPTX'
      )
        return false;
      if (activeTab === 'pyqs' && m.type !== 'pyqs') return false;
      if (activeTab === 'important_questions' && m.type !== 'important_questions')
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.title.toLowerCase().includes(q) ||
          (m.description && m.description.toLowerCase().includes(q)) ||
          (m.tags && m.tags.some((t) => t.toLowerCase().includes(q)))
        );
      }
      return true;
    })
    // Arranged based on which is uploaded first (earliest uploaded first)
    .sort((a, b) => getMaterialUploadTime(a) - getMaterialUploadTime(b));

  return (
    <main className="w-full max-w-[1280px] mx-auto px-4 md:px-16 pt-6 md:pt-8 pb-32 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <span className="bg-[#b2beb5]/25 text-[#434844] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-[#b2beb5]/40">
            {subject.code}
          </span>
          <span className="text-[#434844] text-sm font-medium">
            {subject.professor}
          </span>
          {subject.creditHours && (
            <span className="text-xs text-[#737874] bg-[#F0EDED] px-2.5 py-0.5 rounded-md">
              {subject.creditHours} Credits
            </span>
          )}
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1b1c1c] tracking-tight mb-3">
          {subject.name}
        </h1>

        <p className="text-base md:text-lg text-[#434844] max-w-3xl leading-relaxed">
          {subject.description}
        </p>
      </div>

      {/* Pill tabs matching user screenshot */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8 bg-[#FEFEFA] border border-[#E5E4E2] p-4 rounded-2xl shadow-xs">
        <div className="bg-[#F0EDED] p-1 rounded-full border border-[#E5E4E2] inline-flex items-center gap-1 shadow-2xs overflow-x-auto hide-scrollbar self-start">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-[#1b1c1c] shadow-xs'
                    : 'text-[#737874] hover:text-[#1b1c1c]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#737874] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topic or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="paper-input text-xs pl-9 pr-3 py-1.5 rounded-xl w-full text-[#1b1c1c]"
            />
          </div>
        </div>
      </div>

      {/* Content Area: Notes List (Matching exact cards from screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedMaterials.map((item, index) => (
          <div
            key={item.id}
            className="bg-[#FEFEFA] border border-[#E5E4E2] rounded-2xl p-6 flex flex-col gap-3 hover:border-[#bdc9c0] transition-all group relative shadow-[0_4px_20px_rgba(51,51,51,0.02)] hover:shadow-md"
          >
            {/* Top metadata */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="material-symbols-outlined text-[#b2beb5]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  description
                </span>
                <span className="text-[11px] font-bold text-[#434844] bg-[#F0EDED] px-2 py-0.5 rounded">
                  {item.fileFormat}
                </span>
                <span className="bg-[#56615a]/10 text-[#56615a] border border-[#56615a]/20 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-tight">
                  #{index + 1} Uploaded
                </span>
                {item.unit && (
                  <span className="text-[11px] font-medium text-[#737874]">
                    {item.unit}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-[#737874]">{item.fileSize}</span>
            </div>

            {/* Note title */}
            <h3 className="text-xl font-bold text-[#1b1c1c] leading-snug mt-1 group-hover:text-[#56615a] transition-colors">
              {item.title}
            </h3>

            {item.description && (
              <p className="text-xs text-[#434844] line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            )}

            {/* Author and Date Footer */}
            <div className="flex items-center gap-2.5 mt-auto pt-4 border-t border-[#E4E2E1]">
              <div className="w-7 h-7 rounded-full bg-[#F0EDED] overflow-hidden flex-shrink-0 border border-[#C3C8C3]/50">
                <img
                  src={item.uploadedBy.avatar}
                  alt={item.uploadedBy.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-xs text-[#434844] font-medium flex-grow truncate">
                Uploaded by {item.uploadedBy.name}
              </span>
              <span className="text-xs text-[#737874] whitespace-nowrap">{item.uploadedDate}</span>
            </div>

            {/* Hover Action Overlay */}
            <div className="absolute inset-0 bg-[#F6F3F2]/90 backdrop-blur-[2px] flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-2xl p-4">
              <button
                onClick={() => onPreviewMaterial(item)}
                className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-[#56615a] hover:bg-[#F0EDED] hover:scale-105 transition-all cursor-pointer"
                title="Preview Document & Notes"
              >
                <span className="material-symbols-outlined text-[24px]">visibility</span>
              </button>
              <button
                onClick={() => onDownloadMaterial(item)}
                className="w-12 h-12 bg-[#56615a] text-white rounded-full shadow-md flex items-center justify-center hover:bg-[#434d46] hover:scale-105 transition-all cursor-pointer"
                title="Download Study Material"
              >
                <span className="material-symbols-outlined text-[24px]">download</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {sortedMaterials.length === 0 && (
        <div className="text-center py-16 bg-white border border-[#E5E4E2] rounded-2xl p-8">
          <div className="w-16 h-16 rounded-full bg-[#F0EDED] flex items-center justify-center mx-auto text-[#737874] mb-3">
            <span className="material-symbols-outlined text-3xl">folder_off</span>
          </div>
          <h4 className="text-lg font-bold text-[#1b1c1c]">No materials found in this section</h4>
          <p className="text-xs text-[#737874] mt-1 max-w-sm mx-auto">
            Be the first student to upload lecture notes or past papers for this topic!
          </p>
          <button
            onClick={() => onOpenUpload(subject.id)}
            className="mt-4 px-5 py-2.5 bg-[#56615a] hover:bg-[#434d46] text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            + Upload First Note
          </button>
        </div>
      )}

      {/* Floating Action Button (Exact match from screenshot) */}
      <button
        onClick={() => onOpenUpload(subject.id)}
        className="fixed bottom-[84px] md:bottom-10 right-4 md:right-16 bg-[#56615a] hover:bg-[#434d46] text-white rounded-[16px] px-6 py-3.5 sm:py-4 flex items-center gap-2 shadow-[0_4px_20px_rgba(51,51,51,0.2)] transition-all z-40 group cursor-pointer hover:scale-105"
      >
        <span className="material-symbols-outlined group-hover:rotate-90 transition-transform text-[20px]">
          add
        </span>
        <span className="text-sm font-bold tracking-tight">Upload Material</span>
      </button>
    </main>
  );
};
