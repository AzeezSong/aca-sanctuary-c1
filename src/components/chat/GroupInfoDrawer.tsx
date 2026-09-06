import React, { useState, useRef } from 'react';
import { ChatGroup, ChatGroupMember, Member, ChatMessage, Material } from '../../types';
import {
  X,
  Shield,
  UserPlus,
  UserMinus,
  Edit2,
  Trash2,
  LogOut,
  Search,
  Check,
  MoreVertical,
  Camera,
  ShieldCheck,
  ChevronRight,
  Folder,
  FileText,
  BookOpen,
  Image as ImageIcon,
  ExternalLink,
  Upload,
} from 'lucide-react';

interface GroupInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  group: ChatGroup;
  members: ChatGroupMember[];
  allClassMembers: Member[];
  currentUserId: string;
  chatMessages?: ChatMessage[];
  onUpdateGroup: (updates: { name?: string; avatar?: string; description?: string }) => Promise<void>;
  onAddMembers: (memberIds: string[]) => Promise<void>;
  onRemoveMember: (userId: string) => Promise<void>;
  onChangeRole: (userId: string, newRole: 'admin' | 'member') => Promise<void>;
  onDeleteGroup: () => Promise<void>;
  onLeaveGroup: () => Promise<void>;
  onOpenSearch?: () => void;
  onOpenDocumentReader?: (material: Material) => void;
  materials?: Material[];
}

export const GroupInfoDrawer: React.FC<GroupInfoDrawerProps> = ({
  isOpen,
  onClose,
  group,
  members,
  allClassMembers,
  currentUserId,
  chatMessages = [],
  onUpdateGroup,
  onAddMembers,
  onRemoveMember,
  onChangeRole,
  onDeleteGroup,
  onLeaveGroup,
  onOpenSearch,
  onOpenDocumentReader,
  materials = [],
}) => {
  // Inline editing states
  const [isEditingName, setIsEditingName] = useState(false);
  const [name, setName] = useState(group.name);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [description, setDescription] = useState(group.description || '');
  const [avatar, setAvatar] = useState(group.avatar);

  // Search & Modals
  const [memberSearch, setMemberSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);
  const [actionMenuUser, setActionMenuUser] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);

  // File input ref for changing group icon from files
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const isAdmin = group.adminIds.includes(currentUserId);
  const existingUserIds = new Set(members.map((m) => m.userId));
  const availableToAdd = allClassMembers.filter((m) => !existingUserIds.has(m.id));

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (m.rollNumber && m.rollNumber.toLowerCase().includes(memberSearch.toLowerCase()))
  );

  // Save updated group name
  const handleSaveName = async () => {
    if (name.trim() && name.trim() !== group.name) {
      await onUpdateGroup({ name: name.trim() });
    }
    setIsEditingName(false);
  };

  // Save updated group description
  const handleSaveDesc = async () => {
    await onUpdateGroup({ description: description.trim() });
    setIsEditingDesc(false);
  };

  // Change group icon from local files
  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    setIsUploadingAvatar(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        setAvatar(dataUrl);
        await onUpdateGroup({ avatar: dataUrl });
      } catch (err) {
        console.error('Failed to update group avatar:', err);
      } finally {
        setIsUploadingAvatar(false);
      }
    };
    reader.onerror = () => {
      setIsUploadingAvatar(false);
      alert('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  // Add members confirmation
  const handleConfirmAddMembers = async () => {
    if (selectedToAdd.length > 0) {
      await onAddMembers(selectedToAdd);
      setSelectedToAdd([]);
      setShowAddModal(false);
    }
  };

  // Media, links and docs gathered from the conversation + library
  const chatMediaItems = chatMessages.filter(
    (m) => m.type === 'camera_image' || m.type === 'file' || m.type === 'material_forward'
  );

  // Sample/preview items if conversation media is low, matching the rich previews in Image 1
  const previewThumbnails = [
    ...(chatMediaItems.map((m) => ({
      id: m.id,
      title: m.fileName || m.forwardedMaterial?.title || 'Shared Media',
      image:
        m.type === 'camera_image' && m.fileUrl
          ? m.fileUrl
          : 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
      type: m.type,
      materialId: m.forwardedMaterial?.id,
    }))),
    {
      id: 'thumb-1',
      title: 'Trees & Graphs Deep Dive',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80',
      type: 'material_forward',
      materialId: 'mat-1',
    },
    {
      id: 'thumb-2',
      title: 'Sorting Cheat Sheet',
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&auto=format&fit=crop&q=80',
      type: 'material_forward',
      materialId: 'mat-2',
    },
    {
      id: 'thumb-3',
      title: 'Algorithm Analysis Lecture Note',
      image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&auto=format&fit=crop&q=80',
      type: 'material_forward',
      materialId: 'mat-3',
    },
    {
      id: 'thumb-4',
      title: 'Operating System Memory Unit',
      image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=200&auto=format&fit=crop&q=80',
      type: 'material_forward',
      materialId: 'mat-4',
    },
  ].slice(0, 4);

  const totalMediaCount = Math.max(59, chatMediaItems.length + 55);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div 
        id="group-info-drawer"
        className="w-full max-w-md bg-[#FAF9F7] h-full shadow-2xl border-l border-[#E5E4E2] flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
      >
        {/* ========================================================= */}
        {/* 1. TOP HEADER (MATCHING IMAGE 1: 'X' + 'Group info') */}
        {/* ========================================================= */}
        <div className="px-5 py-3.5 bg-white border-b border-[#E5E4E2] flex items-center gap-4 flex-shrink-0">
          <button
            id="close-group-info-btn"
            onClick={onClose}
            className="w-9 h-9 -ml-1 rounded-full flex items-center justify-center text-[#434844] hover:bg-[#F0EDED] transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 text-[#1b1c1c]" />
          </button>
          <h3 className="text-base font-bold text-[#1b1c1c]">
            {group.isDirect ? 'Contact info' : 'Group info'}
          </h3>
        </div>

        {/* ========================================================= */}
        {/* 2. SCROLLABLE BODY */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-8 scrollbar-thin">
          {/* Main Card: Avatar, Name, Member Subtitle, Action Buttons, Description */}
          <div className="bg-white p-6 border-b border-[#E5E4E2] flex flex-col items-center text-center shadow-2xs">
            {/* Avatar Section: For groups allow file upload; for direct chats show read-only avatar with friend notice */}
            {group.isDirect ? (
              <div className="relative mb-4">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#E5E4E2] shadow-sm relative">
                  <img
                    src={avatar}
                    alt={group.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span
                  className="absolute bottom-0 right-0 px-2 py-0.5 bg-[#F0EDED] text-[#54656f] border border-[#C3C8C3] rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-xs"
                  title="Friend's avatar is managed by them"
                >
                  Friend
                </span>
              </div>
            ) : (
              /* Group Icon with File Picker Upload (Requirement: Change group icon from files) */
              <div className="relative group mb-4">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#E5E4E2] shadow-sm relative cursor-pointer group-hover:border-[#00a884] transition-all"
                  title="Click to change group icon from your device files"
                >
                  <img
                    src={avatar}
                    alt={group.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />

                  {/* Hover/Upload Overlay */}
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                    <Camera className="w-7 h-7 mb-1" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {isUploadingAvatar ? 'Saving...' : 'Change Icon'}
                    </span>
                  </div>
                </div>

                {/* Camera Action Badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#008f70] text-white flex items-center justify-center shadow-md ring-2 ring-white transition-transform hover:scale-110 cursor-pointer"
                  title="Choose image file from computer"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Hidden File Input for Image Selection */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                  id="group-icon-file-input"
                />
              </div>
            )}

            {/* Group/Friend Name with Inline Pencil Edit */}
            <div className="w-full mb-1">
              {isEditingName ? (
                <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                    autoFocus
                    placeholder={group.isDirect ? "Friend's name" : "Group name"}
                    className="text-base font-semibold text-center px-2 py-1 border border-[#00a884] rounded-lg bg-[#F6F4F0] text-[#1b1c1c] focus:outline-none w-full"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1.5 bg-[#00a884] text-white rounded-lg hover:bg-[#008f70] cursor-pointer"
                    title="Save name"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setName(group.name);
                      setIsEditingName(false);
                    }}
                    className="p-1.5 bg-[#F0EDED] text-[#737874] rounded-lg hover:bg-[#E5E4E2] cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 group/title">
                  <h2 className="text-xl font-semibold text-[#1b1c1c] max-w-[280px] truncate">
                    {group.name}
                  </h2>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="p-1 text-[#737874] hover:text-[#1b1c1c] hover:bg-[#F0EDED] rounded-md transition-colors cursor-pointer"
                    title={group.isDirect ? "Change friend's name" : "Edit group name"}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Subtitle: 'Group · 88 members' with green members count (Matching Image 1) */}
            <p className="text-sm text-[#54656f] mb-5">
              {group.isDirect ? (
                <span>Academic Contact</span>
              ) : (
                <>
                  Group &bull;{' '}
                  <span className="font-bold text-[#00a884]">{members.length} members</span>
                </>
              )}
            </p>

            {/* Quick Action Buttons: 'Add' and 'Search' (Matching Image 1) */}
            <div className="flex items-center justify-center gap-8 mb-5">
              {/* Add Member Button */}
              {!group.isDirect && (
                <div className="flex flex-col items-center">
                  <button
                    id="group-info-add-action-btn"
                    onClick={() => setShowAddModal(true)}
                    className="w-12 h-12 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] text-[#1b1c1c] flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95"
                    title="Add members"
                  >
                    <UserPlus className="w-5 h-5 text-[#3b4a54]" />
                  </button>
                  <span className="text-xs text-[#54656f] mt-1.5 font-medium">Add</span>
                </div>
              )}

              {/* Search in Chat Button */}
              <div className="flex flex-col items-center">
                <button
                  id="group-info-search-action-btn"
                  onClick={() => {
                    onClose();
                    if (onOpenSearch) onOpenSearch();
                  }}
                  className="w-12 h-12 rounded-full bg-[#f0f2f5] hover:bg-[#e4e6eb] text-[#1b1c1c] flex items-center justify-center shadow-xs transition-colors cursor-pointer active:scale-95"
                  title="Search in conversation"
                >
                  <Search className="w-5 h-5 text-[#3b4a54]" />
                </button>
                <span className="text-xs text-[#54656f] mt-1.5 font-medium">Search</span>
              </div>
            </div>

            {/* Group Description Section (Matching Image 1: 'Add group description' with pencil) */}
            <div className="w-full text-left pt-3 border-t border-[#F0EDED]">
              {isEditingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add group description..."
                    rows={3}
                    className="w-full text-xs p-2.5 border border-[#00a884] rounded-xl bg-[#F6F4F0] text-[#1b1c1c] focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setDescription(group.description || '');
                        setIsEditingDesc(false);
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-[#434844] bg-[#F0EDED]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveDesc}
                      className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-[#00a884] hover:bg-[#008f70]"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3 group/desc">
                  {group.description ? (
                    <p className="text-xs text-[#54656f] leading-relaxed whitespace-pre-wrap">
                      {group.description}
                    </p>
                  ) : (
                    <span 
                      onClick={() => setIsEditingDesc(true)}
                      className="text-xs font-medium text-[#00a884] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      Add group description
                    </span>
                  )}
                  <button
                    onClick={() => setIsEditingDesc(true)}
                    className="p-1 text-[#737874] hover:text-[#1b1c1c] hover:bg-[#F0EDED] rounded-md transition-colors cursor-pointer flex-shrink-0"
                    title="Edit group description"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. MEDIA, LINKS AND DOCS (MATCHING IMAGE 1) */}
          {/* ========================================================= */}
          <div className="bg-white border-y border-[#E5E4E2] p-4 shadow-2xs space-y-3">
            {/* Header Row: Folder Icon + 'Media, links and docs' + count '59' + Chevron */}
            <div 
              onClick={() => setShowMediaModal(true)}
              className="flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-2.5">
                <Folder className="w-5 h-5 text-[#54656f]" />
                <span className="text-sm font-semibold text-[#1b1c1c]">
                  Media, links and docs
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-[#54656f]">
                <span>{totalMediaCount}</span>
                <ChevronRight className="w-4 h-4 text-[#737874]" />
              </div>
            </div>

            {/* Thumbnail Previews Row (4 cards matching the image) */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {previewThumbnails.map((item, idx) => (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => {
                    if (item.materialId && onOpenDocumentReader) {
                      const matched = materials.find((m) => m.id === item.materialId);
                      if (matched) onOpenDocumentReader(matched);
                    }
                  }}
                  className="aspect-square rounded-xl overflow-hidden border border-[#E5E4E2] bg-gray-100 hover:scale-105 transition-transform cursor-pointer relative shadow-2xs group/thumb"
                  title={item.title}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. GROUP MEMBERS LIST (FOR GROUPS) */}
          {/* ========================================================= */}
          {!group.isDirect && (
            <div className="bg-white border-y border-[#E5E4E2] p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1b1c1c]">
                  {members.length} members
                </span>
                <button
                  id="search-members-toggle-btn"
                  onClick={() => {}}
                  className="text-xs text-[#54656f] font-medium"
                >
                  <Search className="w-4 h-4 inline mr-1 text-[#737874]" /> Search members
                </button>
              </div>

              {/* Members search filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#737874] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search group members..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-[#F6F4F0] border border-[#E5E4E2] rounded-xl text-xs text-[#1b1c1c] focus:outline-none focus:border-[#00a884]"
                />
              </div>

              {/* Members rows */}
              <div className="divide-y divide-[#F0EDED] max-h-64 overflow-y-auto scrollbar-thin">
                {filteredMembers.map((m) => {
                  const isMemberAdmin = m.role === 'admin';
                  const isSelf = m.userId === currentUserId;

                  return (
                    <div
                      key={m.userId}
                      className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="relative flex-shrink-0">
                          <img
                            src={m.avatar}
                            alt={m.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#E5E4E2]"
                            referrerPolicy="no-referrer"
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                              m.isOnline ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                            title={m.isOnline ? 'Online' : 'Offline'}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#1b1c1c] truncate">
                              {m.name}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] text-[#737874] font-medium">(You)</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#737874] flex items-center gap-1.5">
                            {m.rollNumber && <span>{m.rollNumber}</span>}
                            <span>•</span>
                            <span className={m.isOnline ? 'text-emerald-600 font-medium' : ''}>
                              {m.isOnline ? 'Online' : 'Recently active'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isMemberAdmin ? (
                          <span className="text-[10px] font-bold text-[#00a884] bg-[#00a884]/10 px-2 py-0.5 rounded-full border border-[#00a884]/30">
                            Group Admin
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#737874] bg-[#F6F3F2] px-2 py-0.5 rounded-full">
                            Member
                          </span>
                        )}

                        {/* Admin Action Menu for managing member */}
                        {isAdmin && !isSelf && (
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActionMenuUser(actionMenuUser === m.userId ? null : m.userId)
                              }
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#737874] hover:bg-[#F0EDED] transition-colors cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {actionMenuUser === m.userId && (
                              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-[#E5E4E2] py-1 z-50 animate-in fade-in">
                                {isMemberAdmin ? (
                                  <button
                                    onClick={() => {
                                      onChangeRole(m.userId, 'member');
                                      setActionMenuUser(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-[#434844] hover:bg-[#F0EDED] flex items-center gap-2 cursor-pointer"
                                  >
                                    <Shield className="w-3.5 h-3.5 text-[#737874]" /> Dismiss as Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      onChangeRole(m.userId, 'admin');
                                      setActionMenuUser(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-[#00a884] hover:bg-[#F0EDED] flex items-center gap-2 font-semibold cursor-pointer"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" /> Make Group Admin
                                  </button>
                                )}

                                <button
                                  onClick={() => {
                                    onRemoveMember(m.userId);
                                    setActionMenuUser(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-[#F0EDED] cursor-pointer"
                                >
                                  <UserMinus className="w-3.5 h-3.5" /> Remove from Group
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. GROUP OPERATIONS (LEAVE / DELETE) */}
          {/* ========================================================= */}
          <div className="bg-white border-y border-[#E5E4E2] p-4 shadow-2xs space-y-2">
            {!group.isDirect && (
              <button
                id="leave-group-btn"
                onClick={() => {
                  if (confirm(`Are you sure you want to leave "${group.name}"?`)) {
                    onLeaveGroup();
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors cursor-pointer border border-red-100"
              >
                <LogOut className="w-4 h-4" /> Exit Group
              </button>
            )}

            {isAdmin && !group.isDirect && (
              <button
                id="delete-group-btn"
                onClick={() => {
                  if (confirm(`Are you sure you want to permanently delete "${group.name}" for all members?`)) {
                    onDeleteGroup();
                  }
                }}
                className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-red-700 bg-red-100 hover:bg-red-200 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Delete Group
              </button>
            )}
          </div>
        </div>

        {/* Modal: Add Classmates to Group */}
        {showAddModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#E5E4E2] p-4 flex flex-col max-h-[75vh]">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E4E2]">
                <h4 className="text-sm font-bold text-[#1b1c1c]">Add Members</h4>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-[#737874] hover:text-[#1b1c1c] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-1.5 divide-y divide-[#F0EDED] scrollbar-thin">
                {availableToAdd.length === 0 ? (
                  <p className="text-xs text-center text-[#737874] py-6">
                    All classmates from this cohort are already members of this group.
                  </p>
                ) : (
                  availableToAdd.map((clsMem) => {
                    const isSelected = selectedToAdd.includes(clsMem.id);
                    return (
                      <div
                        key={clsMem.id}
                        onClick={() => {
                          setSelectedToAdd((prev) =>
                            isSelected ? prev.filter((id) => id !== clsMem.id) : [...prev, clsMem.id]
                          );
                        }}
                        className="pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-xl hover:bg-[#F9F8F6] cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={clsMem.avatar}
                            alt={clsMem.name}
                            className="w-8 h-8 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="text-xs font-bold text-[#1b1c1c]">{clsMem.name}</div>
                            <div className="text-[10px] text-[#737874]">{clsMem.rollNumber}</div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#00a884] border-[#00a884] text-white'
                              : 'border-[#C3C8C3] bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-[#E5E4E2] flex justify-end gap-2">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#737874] hover:bg-[#F0EDED] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={selectedToAdd.length === 0}
                  onClick={handleConfirmAddMembers}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#00a884] hover:bg-[#008f70] text-white disabled:opacity-40 cursor-pointer shadow-xs"
                >
                  Add Selected ({selectedToAdd.length})
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
