import React, { useState, useMemo } from 'react';
import { Material, ChatGroup, Member, User } from '../../types';
import {
  X,
  Search,
  Check,
  Send,
  Users,
  MessageSquare,
  BookOpen,
  FileText,
  Presentation,
  FileQuestion,
  HelpCircle,
  CheckCheck,
} from 'lucide-react';

interface ForwardMaterialMultiModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  groups: ChatGroup[];
  classMembers: Member[];
  currentUser: User;
  onForwardComplete: (forwardedGroupIds: string[]) => void;
}

export const ForwardMaterialMultiModal: React.FC<ForwardMaterialMultiModalProps> = ({
  isOpen,
  onClose,
  material,
  groups,
  classMembers,
  currentUser,
  onForwardComplete,
}) => {
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'groups' | 'direct'>('all');
  const [note, setNote] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Group list excluding direct chats if we separate, or include all
  // Direct chats that are already created:
  const directGroups = useMemo(() => groups.filter((g) => g.isDirect), [groups]);
  const channelGroups = useMemo(() => groups.filter((g) => !g.isDirect), [groups]);

  // Cohort members excluding current user
  const otherMembers = useMemo(
    () => classMembers.filter((m) => m.id !== currentUser.id),
    [classMembers, currentUser.id]
  );

  // Filtered items based on search query
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return channelGroups;
    const q = search.toLowerCase();
    return channelGroups.filter((g) => g.name.toLowerCase().includes(q));
  }, [channelGroups, search]);

  // Classmates and Direct Chats: Map member to their existing direct chat if any
  const memberItems = useMemo(() => {
    return otherMembers.map((member) => {
      // Find if an existing DM group exists
      const existingDm = directGroups.find((g) => g.memberIds.includes(member.id));
      return {
        member,
        existingGroupId: existingDm?.id || null,
      };
    });
  }, [otherMembers, directGroups]);

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return memberItems;
    const q = search.toLowerCase();
    return memberItems.filter(
      (item) =>
        item.member.name.toLowerCase().includes(q) ||
        item.member.email.toLowerCase().includes(q) ||
        item.member.rollNumber.toLowerCase().includes(q)
    );
  }, [memberItems, search]);

  if (!isOpen || !material) return null;

  const totalSelected = selectedGroupIds.length + selectedUserIds.length;

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const toggleMember = (memberId: string, existingGroupId: string | null) => {
    if (existingGroupId) {
      // If direct group exists, toggle via selectedGroupIds
      toggleGroup(existingGroupId);
    } else {
      // Otherwise toggle via selectedUserIds
      setSelectedUserIds((prev) =>
        prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
      );
    }
  };

  const isMemberSelected = (memberId: string, existingGroupId: string | null) => {
    if (existingGroupId) {
      return selectedGroupIds.includes(existingGroupId);
    }
    return selectedUserIds.includes(memberId);
  };

  const handleSelectAll = () => {
    const allGids = filteredGroups.map((g) => g.id);
    const allUids: string[] = [];
    const directGids: string[] = [];

    filteredMembers.forEach((item) => {
      if (item.existingGroupId) {
        directGids.push(item.existingGroupId);
      } else {
        allUids.push(item.member.id);
      }
    });

    setSelectedGroupIds(Array.from(new Set([...selectedGroupIds, ...allGids, ...directGids])));
    setSelectedUserIds(Array.from(new Set([...selectedUserIds, ...allUids])));
  };

  const handleClearAll = () => {
    setSelectedGroupIds([]);
    setSelectedUserIds([]);
  };

  const handleConfirmForward = async () => {
    if (totalSelected === 0) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/chat/materials/forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material,
          targetGroupIds: selectedGroupIds,
          targetUserIds: selectedUserIds,
          note: note.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onForwardComplete(data.groupIds || selectedGroupIds);
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to forward material');
      }
    } catch (err) {
      console.error('Error forwarding material:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPresentation = material.type === 'slides' || material.fileFormat === 'PPTX';
  const isPyq = material.type === 'pyqs';
  const isImportant = material.type === 'important_questions';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="forward-material-multi-modal"
        className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E5E4E2] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E4E2] bg-[#F9F8F6] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#008069]/15 text-[#008069] flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[#008069]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b1c1c] leading-tight">
                Forward Study Material
              </h3>
              <p className="text-xs text-[#737874] mt-0.5">
                Send to multiple classmates or groups simultaneously
              </p>
            </div>
          </div>
          <button
            id="close-forward-multi-modal-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#737874] hover:bg-[#E5E4E2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Material Preview Banner */}
        <div className="p-3.5 bg-[#FAF9F7] border-b border-[#E5E4E2]">
          <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-white border border-[#E5E4E2] shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-[#F6F4F0] border border-[#E5E4E2] flex flex-col items-center justify-center flex-shrink-0">
              {isPresentation ? (
                <Presentation className="w-4 h-4 text-amber-700" />
              ) : isPyq ? (
                <FileQuestion className="w-4 h-4 text-indigo-700" />
              ) : isImportant ? (
                <HelpCircle className="w-4 h-4 text-rose-700" />
              ) : (
                <FileText className="w-4 h-4 text-[#56615a]" />
              )}
              <span className="text-[8px] font-black uppercase text-[#737874] mt-0.5">
                {material.fileFormat || 'PDF'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-[#1b1c1c] truncate">
                {material.title}
              </h4>
              <div className="flex items-center gap-2 text-[11px] text-[#737874] mt-0.5 flex-wrap">
                <span className="font-semibold text-[#56615a] bg-[#56615a]/10 px-1.5 py-0.2 rounded">
                  {material.subjectCode}
                </span>
                <span>&bull;</span>
                <span className="capitalize">{material.type.replace('_', ' ')}</span>
                <span>&bull;</span>
                <span>{material.fileSize}</span>
              </div>
            </div>
          </div>

          {/* Optional Note / Message Input */}
          <div className="mt-2.5">
            <input
              id="forward-note-input"
              type="text"
              placeholder="Add an optional message note (e.g. 'Must-read for unit 3 exam')..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-[#E5E4E2] rounded-xl text-xs text-[#1b1c1c] focus:outline-none focus:border-[#008069] placeholder:text-[#919692]"
            />
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="p-3 border-b border-[#E5E4E2] bg-white space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-[#737874] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="search-forward-recipients"
              type="text"
              placeholder="Search groups or classmates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-[#F6F4F0] border border-[#E5E4E2] rounded-xl text-xs text-[#1b1c1c] focus:outline-none focus:border-[#008069] placeholder:text-[#919692]"
            />
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            {/* Filter Tabs */}
            <div className="inline-flex items-center gap-1 bg-[#F0EDED] p-1 rounded-full text-xs">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  filterTab === 'all'
                    ? 'bg-white text-[#1b1c1c] shadow-2xs'
                    : 'text-[#737874] hover:text-[#1b1c1c]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterTab('groups')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  filterTab === 'groups'
                    ? 'bg-white text-[#1b1c1c] shadow-2xs'
                    : 'text-[#737874] hover:text-[#1b1c1c]'
                }`}
              >
                Groups ({channelGroups.length})
              </button>
              <button
                onClick={() => setFilterTab('direct')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  filterTab === 'direct'
                    ? 'bg-white text-[#1b1c1c] shadow-2xs'
                    : 'text-[#737874] hover:text-[#1b1c1c]'
                }`}
              >
                Direct / Classmates ({otherMembers.length})
              </button>
            </div>

            {/* Quick Select Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleSelectAll}
                className="text-[11px] font-bold text-[#008069] hover:underline cursor-pointer"
              >
                Select All
              </button>
              {totalSelected > 0 && (
                <>
                  <span className="text-[#C3C8C3]">&bull;</span>
                  <button
                    onClick={handleClearAll}
                    className="text-[11px] font-bold text-[#737874] hover:text-rose-600 cursor-pointer"
                  >
                    Clear
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Recipients List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-[#F0EDED]">
          {/* Section: Groups */}
          {(filterTab === 'all' || filterTab === 'groups') && filteredGroups.length > 0 && (
            <div className="space-y-1.5 pt-1 first:pt-0">
              <div className="px-2 text-[11px] font-bold text-[#737874] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#56615a]" />
                <span>Group Chats</span>
              </div>
              <div className="space-y-1">
                {filteredGroups.map((grp) => {
                  const isSelected = selectedGroupIds.includes(grp.id);
                  return (
                    <div
                      key={grp.id}
                      id={`select-group-${grp.id}`}
                      onClick={() => toggleGroup(grp.id)}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#008069]/10 border-[#008069]/50 shadow-2xs'
                          : 'border-transparent hover:bg-[#F6F4F0]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={grp.avatar}
                            alt={grp.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#E5E4E2]"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute -bottom-0.5 -right-0.5 bg-[#56615a] text-white p-0.5 rounded-full ring-2 ring-white">
                            <Users className="w-2.5 h-2.5" />
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-[#1b1c1c] truncate">{grp.name}</h5>
                          <p className="text-[11px] text-[#737874] truncate">
                            {grp.memberIds.length} members &bull; {grp.description || 'Cohort Discussion'}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#008069] border-[#008069] text-white'
                            : 'border-[#C3C8C3] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Classmates / Direct DMs */}
          {(filterTab === 'all' || filterTab === 'direct') && filteredMembers.length > 0 && (
            <div className="space-y-1.5 pt-3 first:pt-0">
              <div className="px-2 text-[11px] font-bold text-[#737874] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#56615a]" />
                <span>Classmates & Direct Chats</span>
              </div>
              <div className="space-y-1">
                {filteredMembers.map(({ member, existingGroupId }) => {
                  const isSelected = isMemberSelected(member.id, existingGroupId);
                  return (
                    <div
                      key={member.id}
                      id={`select-member-${member.id}`}
                      onClick={() => toggleMember(member.id, existingGroupId)}
                      className={`p-3 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-[#008069]/10 border-[#008069]/50 shadow-2xs'
                          : 'border-transparent hover:bg-[#F6F4F0]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-10 h-10 rounded-full object-cover border border-[#E5E4E2]"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h5 className="text-xs font-bold text-[#1b1c1c] truncate">
                              {member.name}
                            </h5>
                            {existingGroupId && (
                              <span className="text-[10px] text-[#008069] bg-[#008069]/10 font-bold px-1.5 py-0.2 rounded-full">
                                Active DM
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#737874] truncate">
                            {member.rollNumber} &bull; {member.email}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center flex-shrink-0 transition-colors ${
                          isSelected
                            ? 'bg-[#008069] border-[#008069] text-white'
                            : 'border-[#C3C8C3] bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredGroups.length === 0 && filteredMembers.length === 0 && (
            <div className="p-8 text-center text-[#737874]">
              <Users className="w-8 h-8 mx-auto text-[#C3C8C3] mb-2" />
              <p className="text-xs font-medium">No recipients found</p>
              <p className="text-[11px] text-[#919692] mt-0.5">
                Try searching with a different name or clear the filter
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#E5E4E2] bg-[#F9F8F6] flex items-center justify-between gap-3">
          <div className="text-xs text-[#56615a] font-medium">
            <span className="font-bold text-[#1b1c1c]">{totalSelected}</span> recipient
            {totalSelected === 1 ? '' : 's'} selected
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#737874] hover:bg-[#E5E4E2] transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              id="confirm-forward-material-btn"
              disabled={totalSelected === 0 || isSubmitting}
              onClick={handleConfirmForward}
              className="px-5 py-2.5 bg-[#008069] hover:bg-[#006a57] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-40 cursor-pointer shadow-sm disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'Forwarding...'
                  : totalSelected > 1
                  ? `Forward to ${totalSelected} Chats`
                  : 'Forward Material'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
