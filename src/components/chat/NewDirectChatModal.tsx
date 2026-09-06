import React, { useState } from 'react';
import { Member } from '../../types';
import { X, Search, MessageSquare, UserCheck } from 'lucide-react';

interface NewDirectChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  currentUserId: string;
  onSelectUser: (userId: string) => void;
}

export const NewDirectChatModal: React.FC<NewDirectChatModalProps> = ({
  isOpen,
  onClose,
  members,
  currentUserId,
  onSelectUser,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const selectable = members.filter((m) => m.id !== currentUserId);

  const filtered = selectable.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="new-direct-chat-modal"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#E5E4E2] overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E4E2] bg-[#F9F8F6]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#d9e6dc] text-[#56615a] flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1b1c1c]">New Direct Chat</h3>
              <p className="text-[11px] text-[#737874]">Select a classmate to start chatting privately</p>
            </div>
          </div>
          <button
            id="close-new-direct-chat-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#737874] hover:bg-[#E5E4E2]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 border-b border-[#E5E4E2]">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#737874] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-classmates-input"
              type="text"
              placeholder="Search by name, roll number, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#F6F4F0] border border-[#E5E4E2] rounded-xl text-xs text-[#1b1c1c] focus:outline-none focus:border-[#56615a]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 divide-y divide-[#F0EDED] space-y-1">
          {filtered.length === 0 ? (
            <p className="text-xs text-center text-[#737874] py-8">No classmates found.</p>
          ) : (
            filtered.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  onSelectUser(m.id);
                  onClose();
                }}
                className="pt-1.5 first:pt-0 flex items-center justify-between p-2 rounded-xl hover:bg-[#F9F8F6] cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={m.avatar}
                    alt={m.name}
                    className="w-9 h-9 rounded-full object-cover border border-[#E5E4E2]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#1b1c1c] group-hover:text-[#56615a] truncate">
                      {m.name}
                    </h4>
                    <div className="text-[11px] text-[#737874]">
                      {m.rollNumber} • {m.role.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <button 
                  id={`chat-with-${m.id}`}
                  className="px-3 py-1 bg-[#F0EDED] group-hover:bg-[#56615a] group-hover:text-white rounded-lg text-xs font-semibold text-[#434844] transition-colors"
                >
                  Chat
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
