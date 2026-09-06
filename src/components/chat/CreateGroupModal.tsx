import React, { useState } from 'react';
import { Member } from '../../types';
import { X, Users, Search, Check, Image, Sparkles, Shield, Camera } from 'lucide-react';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentUserId: string;
  onCreateGroup: (groupData: {
    name: string;
    avatar: string;
    description: string;
    memberIds: string[];
  }) => Promise<void>;
}

const PRESET_AVATARS = [
  {
    label: 'General Cohort',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=150&auto=format&fit=crop&q=80',
  },
  {
    label: 'Study Squad',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
  },
  {
    label: 'Algorithms & Code',
    url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=150&auto=format&fit=crop&q=80',
  },
  {
    label: 'Exam Revision',
    url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=150&auto=format&fit=crop&q=80',
  },
  {
    label: 'Laboratory Team',
    url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=150&auto=format&fit=crop&q=80',
  },
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUserId,
  onCreateGroup,
}) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState(PRESET_AVATARS[0].url);
  const [customAvatarInput, setCustomAvatarInput] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter out current user from selectable members (creator is already admin/member)
  const selectableMembers = members.filter((m) => m.id !== currentUserId);

  const filteredMembers = selectableMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const handleSelectAll = () => {
    if (selectedMemberIds.length === selectableMembers.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(selectableMembers.map((m) => m.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateGroup({
        name: groupName.trim(),
        avatar: customAvatarInput.trim() || avatar,
        description: description.trim(),
        memberIds: selectedMemberIds,
      });
      // Reset form
      setGroupName('');
      setDescription('');
      setSelectedMemberIds([]);
      onClose();
    } catch (err) {
      console.error('Failed to create group:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="create-group-modal"
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E5E4E2] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E2] bg-[#F9F8F6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d9e6dc] text-[#344037] flex items-center justify-center">
              <Users className="w-5 h-5 text-[#56615a]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1b1c1c]">Create New Group</h3>
              <p className="text-xs text-[#737874]">You will be designated as the Group Admin</p>
            </div>
          </div>
          <button
            id="close-create-group-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#737874] hover:bg-[#E5E4E2] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Group Picture & Name */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[#56615a] shadow-xs flex-shrink-0 bg-[#F0EDED]">
                <img
                  src={customAvatarInput.trim() || avatar}
                  alt="Group icon"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            <div className="flex-1 space-y-1">
              <label className="text-xs font-bold text-[#1b1c1c]">
                Group Name <span className="text-red-500">*</span>
              </label>
              <input
                id="group-name-input"
                type="text"
                required
                placeholder="e.g. Operating Systems Lab Squad"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#F6F4F0] border border-[#E5E4E2] rounded-xl text-xs text-[#1b1c1c] focus:outline-none focus:border-[#56615a]"
              />
            </div>
          </div>

          {/* Avatar Presets Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#1b1c1c]">Group Profile Picture</label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_AVATARS.map((p) => (
                <button
                  type="button"
                  key={p.url}
                  onClick={() => {
                    setAvatar(p.url);
                    setCustomAvatarInput('');
                  }}
                  className={`relative p-0.5 rounded-full transition-all flex-shrink-0 ${
                    avatar === p.url && !customAvatarInput
                      ? 'ring-2 ring-[#56615a] scale-105'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title={p.label}
                >
                  <img
                    src={p.url}
                    alt={p.label}
                    className="w-9 h-9 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {avatar === p.url && !customAvatarInput && (
                    <span className="absolute -bottom-1 -right-1 bg-[#56615a] text-white rounded-full p-0.5 shadow-xs">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#1b1c1c]">Group Description (Optional)</label>
            <input
              id="group-description-input"
              type="text"
              placeholder="e.g. For coordinating lab practicals and homework solutions"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-[#F6F4F0] border border-[#E5E4E2] rounded-xl text-xs text-[#1b1c1c] focus:outline-none focus:border-[#56615a]"
            />
          </div>

          {/* Member Selection */}
          <div className="space-y-2 pt-2 border-t border-[#E5E4E2]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1b1c1c]">
                Select Members ({selectedMemberIds.length} chosen)
              </label>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[11px] font-semibold text-[#56615a] hover:underline cursor-pointer"
              >
                {selectedMemberIds.length === selectableMembers.length
                  ? 'Deselect All'
                  : 'Select All Classmates'}
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#737874] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search classmates by name or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#F6F4F0] border border-[#E5E4E2] rounded-lg text-xs text-[#1b1c1c] focus:outline-none focus:border-[#56615a]"
              />
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1 border border-[#E5E4E2] rounded-xl p-2 bg-[#FAFAF8] divide-y divide-[#F0EDED]">
              {filteredMembers.map((m) => {
                const isSelected = selectedMemberIds.includes(m.id);
                return (
                  <div
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className="pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-lg hover:bg-[#F0EDED] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={m.avatar}
                        alt={m.name}
                        className="w-8 h-8 rounded-full object-cover border border-[#E5E4E2]"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="text-xs font-bold text-[#1b1c1c]">{m.name}</div>
                        <div className="text-[10px] text-[#737874]">
                          {m.rollNumber} • {m.role.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#56615a] border-[#56615a] text-white'
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

          {/* Footer Submit Button */}
          <div className="pt-3 border-t border-[#E5E4E2] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#434844] hover:bg-[#F0EDED] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="confirm-create-group-btn"
              type="submit"
              disabled={!groupName.trim() || isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#56615a] hover:bg-[#434d46] text-white transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
            >
              {isSubmitting ? 'Creating Group...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
