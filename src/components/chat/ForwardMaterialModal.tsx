import React, { useState } from 'react';
import { Material, ForwardedMaterialInfo } from '../../types';
import { X, Search, FileText, Send, BookOpen, Filter } from 'lucide-react';

interface ForwardMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  materials: Material[];
  onForward: (materialInfo: ForwardedMaterialInfo) => void;
}

export const ForwardMaterialModal: React.FC<ForwardMaterialModalProps> = ({
  isOpen,
  onClose,
  materials,
  onForward,
}) => {
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  if (!isOpen) return null;

  const subjectsList = Array.from(new Set(materials.map((m) => m.subjectName)));

  const filteredMaterials = materials.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      m.subjectCode.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || m.subjectName === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  const handleSelect = (mat: Material) => {
    const forwardedInfo: ForwardedMaterialInfo = {
      id: mat.id,
      title: mat.title,
      subjectCode: mat.subjectCode,
      subjectName: mat.subjectName,
      type: mat.type,
      fileFormat: mat.fileFormat,
      fileSize: mat.fileSize,
      snippet: mat.contentSnippet || `${mat.title} - Shared from Academic Sanctuary Library.`,
    };
    onForward(forwardedInfo);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="forward-material-modal"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E5E4E2] overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E2] bg-[#F9F8F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d9e6dc] text-[#344037] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#56615a]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b1c1c]">Forward Study Material</h3>
              <p className="text-xs text-[#737874]">Select notes, slides, or PYQs to share in chat</p>
            </div>
          </div>
          <button
            id="close-forward-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#737874] hover:bg-[#E5E4E2] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 border-b border-[#E5E4E2] bg-white flex flex-col gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#737874] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-materials-input"
              type="text"
              placeholder="Search by title, subject or course code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#F6F4F0] border border-[#E5E4E2] rounded-xl text-xs text-[#1b1c1c] focus:outline-none focus:border-[#56615a] placeholder:text-[#919692]"
            />
          </div>

          {subjectsList.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <button
                onClick={() => setSelectedSubject('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                  selectedSubject === 'all'
                    ? 'bg-[#56615a] text-white'
                    : 'bg-[#F0EDED] text-[#434844] hover:bg-[#E4E2E1]'
                }`}
              >
                All Subjects
              </button>
              {subjectsList.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                    selectedSubject === sub
                      ? 'bg-[#56615a] text-white'
                      : 'bg-[#F0EDED] text-[#434844] hover:bg-[#E4E2E1]'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Materials List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-[#F0EDED]">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-[#737874]">
              <FileText className="w-10 h-10 mx-auto text-[#b2beb5] mb-2" />
              <p className="text-sm font-medium">No study materials found</p>
              <p className="text-xs mt-1">Try another search keyword or subject filter</p>
            </div>
          ) : (
            filteredMaterials.map((mat) => (
              <div
                key={mat.id}
                className="pt-2.5 first:pt-0 flex items-center justify-between gap-3 group hover:bg-[#F9F8F6] p-2.5 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F0EDED] flex items-center justify-center flex-shrink-0 text-[#56615a] font-bold text-xs border border-[#E5E4E2]">
                    {mat.fileFormat}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#1b1c1c] truncate">{mat.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-[#737874] mt-0.5">
                      <span className="font-semibold text-[#56615a]">{mat.subjectCode}</span>
                      <span>•</span>
                      <span>{mat.fileSize}</span>
                      <span>•</span>
                      <span className="capitalize">{mat.type}</span>
                    </div>
                  </div>
                </div>

                <button
                  id={`forward-material-${mat.id}`}
                  onClick={() => handleSelect(mat)}
                  className="px-3 py-1.5 rounded-lg bg-[#56615a] hover:bg-[#434d46] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Forward</span>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
