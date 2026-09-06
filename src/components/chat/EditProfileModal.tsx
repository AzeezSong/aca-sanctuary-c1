import React, { useState, useRef } from 'react';
import { X, Camera, Check, User as UserIcon, Upload } from 'lucide-react';
import { User } from '../../types';

interface EditProfileModalProps {
  isOpen: boolean;
  currentUser: User;
  onClose: () => void;
  onSave: (updated: { name: string; avatar: string }) => Promise<void> | void;
}

const PRESET_AVATARS = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCpKVqp8kbAfxGqOzgulKLDI74NQiSdlDhDdFDyQV_evpa8r7d5WkZGkgnCShgY15unIPoRzhmSGM8c5eYPlAfPusWbCSY4vPjAwP8KRomBMr7KQOQX0hIJBjhcSdgOwc2dkZEXm70URgJJ9cLOY4dgO0jxryXS4sw8mAUGz6kgZFPaT6gja0ikk7HNAfoTyv5oY_mEIBEb28YJUw2rW5IOw1WBEJ7mg51EYzStKeEueXcmsQHbIoC-nA',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCGaR09JxPLMxTUqAOn21XHcUqnAmqIeBD6jAqrDU96ITXbLPrkZZaOCjQK7IIR0PKxWNWRRHW7UpC6dTEYhaUWD4iA8mgfmc13xgb933NjQg-Kp__Lo1419atLEixTCMlfpxIvT1-8pb6FjhhmuDcoj3YBiMdoQrxSHJdiO59ij_2u55zAV4duQwWVxUctNVbs3budTAzNTx5QK-4QBTQeVbxrdva2Bi57wirGxl-DIZIC8wyz5e_v2A',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCBi-zIOKYT1CTN9RV3ZzQNieXOigrdCfr81_ihfbOqXHZzoMgFBdaEoBMZKl89hXhj_Om3SEgrx7dTB_i9FJqzma_T0g0Tf3DtnuXuWmMdQnaX-eOgOcdJLbUhWfy34CChRKQFpmloUWTp4QMGnnPQ-C3Lndf0MXhLQ80s437Z0YbdROLpO8-R6f8rAPpT8SPOAHaGk_thBcwBigM4TyxJMNJZWmNHABG_qY1TNnmdM-E3z0-9U-ATvg',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=250&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const result = loadEvt.target?.result as string;
        if (result) {
          setAvatar(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave({ name: name.trim(), avatar });
      onClose();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        id="edit-profile-modal"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5E4E2] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
      >
        {/* Header (WhatsApp green style) */}
        <div className="px-6 py-4 bg-[#008069] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold tracking-tight">Edit Profile</h2>
          </div>
          <button
            id="close-edit-profile-btn"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <img
                src={avatar}
                alt={name}
                className="w-24 h-24 rounded-full object-cover border-3 border-[#008069]/20 shadow-md group-hover:opacity-90 transition-opacity"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-semibold mt-0.5">CHANGE PHOTO</span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="upload-profile-photo-btn"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#008069] bg-[#e7f5f2] hover:bg-[#d0ece6] rounded-full transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload New Photo
              </button>
            </div>

            {/* Presets */}
            <div className="w-full mt-2">
              <p className="text-[11px] font-medium text-[#737874] text-center mb-2">Or select from presets:</p>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {PRESET_AVATARS.map((presetUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(presetUrl)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      avatar === presetUrl ? 'border-[#008069] scale-110 shadow-sm' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  >
                    <img src={presetUrl} alt="Preset" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="user-profile-name-input" className="text-xs font-bold text-[#434844]">
              Your Name
            </label>
            <input
              id="user-profile-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              maxLength={50}
              className="w-full px-3.5 py-2.5 bg-[#F6F4F0] border border-[#E5E4E2] focus:border-[#008069] focus:bg-white rounded-xl text-sm text-[#1b1c1c] font-medium outline-none transition-colors"
            />
            <span className="text-[11px] text-[#737874]">
              This is not your username or student ID. This name will appear on messages you send to your cohort and friends.
            </span>
          </div>

          {/* Read-Only Info */}
          <div className="p-3 bg-[#F6F4F0] rounded-xl text-xs text-[#56615a] flex flex-col gap-1 border border-[#E5E4E2]">
            <div className="flex justify-between">
              <span className="text-[#737874]">Email:</span>
              <span className="font-semibold text-[#1b1c1c]">{currentUser.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#737874]">Role:</span>
              <span className="font-semibold text-[#1b1c1c] capitalize">{currentUser.role.replace('_', ' ')}</span>
            </div>
            {currentUser.rollNumber && (
              <div className="flex justify-between">
                <span className="text-[#737874]">Student ID:</span>
                <span className="font-semibold text-[#1b1c1c]">{currentUser.rollNumber}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5E4E2]">
            <button
              type="button"
              id="cancel-edit-profile-btn"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-[#54656f] hover:bg-[#E5E4E2] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-profile-btn"
              disabled={isSaving || !name.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-[#008069] hover:bg-[#006e5a] rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
