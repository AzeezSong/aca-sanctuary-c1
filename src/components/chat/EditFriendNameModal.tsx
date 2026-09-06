import React, { useState } from 'react';
import { X, Check, Pencil, Lock, UserCheck } from 'lucide-react';

interface EditFriendNameModalProps {
  isOpen: boolean;
  friendId: string;
  friendCurrentName: string;
  friendAvatar: string;
  groupId?: string;
  onClose: () => void;
  onSave: (targetUserId: string, newName: string, groupId?: string) => Promise<void> | void;
}

export const EditFriendNameModal: React.FC<EditFriendNameModalProps> = ({
  isOpen,
  friendId,
  friendCurrentName,
  friendAvatar,
  groupId,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(friendCurrentName);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when opened
  React.useEffect(() => {
    setName(friendCurrentName);
  }, [friendCurrentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave(friendId, name.trim(), groupId);
      onClose();
    } catch (err) {
      console.error('Failed to change friend name:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        id="edit-friend-name-modal"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5E4E2] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#008069] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold tracking-tight">Change Friend's Name</h2>
          </div>
          <button
            id="close-edit-friend-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Friend Avatar Preview (Fixed / Only name is editable) */}
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="relative">
              <img
                src={friendAvatar}
                alt={friendCurrentName}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#E5E4E2] shadow-sm"
                referrerPolicy="no-referrer"
              />
              <span 
                className="absolute -bottom-1 -right-1 p-1 bg-[#F0EDED] text-[#54656f] border border-[#C3C8C3] rounded-full shadow-xs" 
                title="Friend's avatar is managed by them"
              >
                <Lock className="w-3.5 h-3.5" />
              </span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-[11px] font-medium text-amber-800 mt-1">
              <Lock className="w-3 h-3 text-amber-700" />
              <span>Only your friend's name can be changed</span>
            </div>
          </div>

          {/* Name Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="friend-name-input" className="text-xs font-bold text-[#434844]">
              Friend's Name / Nickname
            </label>
            <input
              id="friend-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter friend's new name"
              required
              maxLength={50}
              autoFocus
              className="w-full px-3.5 py-2.5 bg-[#F6F4F0] border border-[#E5E4E2] focus:border-[#008069] focus:bg-white rounded-xl text-sm text-[#1b1c1c] font-medium outline-none transition-colors"
            />
            <p className="text-[11px] text-[#737874] leading-relaxed">
              This updates how your friend's name appears in this chat thread, conversation list, and message bubbles.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E4E2]">
            <button
              type="button"
              id="cancel-friend-name-btn"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-[#54656f] hover:bg-[#E5E4E2] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-friend-name-btn"
              disabled={isSaving || !name.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-[#008069] hover:bg-[#006e5a] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Update Name'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
