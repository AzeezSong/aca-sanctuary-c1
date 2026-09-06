import React, { useState } from 'react';
import { ChatGroup, ChatMessage, User } from '../../types';
import { X, Search, Check, Send, Users, MessageSquare, BookOpen, FileText } from 'lucide-react';

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  groups: ChatGroup[];
  currentUser: User;
  onForward: (messageId: string, targetGroupIds: string[]) => Promise<void>;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  onClose,
  message,
  groups,
  currentUser,
  onForward,
}) => {
  const [search, setSearch] = useState('');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !message) return null;

  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleConfirmForward = async () => {
    if (selectedGroupIds.length === 0) return;
    setIsSubmitting(true);
    try {
      await onForward(message.id, selectedGroupIds);
      setSelectedGroupIds([]);
      onClose();
    } catch (err) {
      console.error('Error forwarding message:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div 
        id="forward-message-modal"
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E5E4E2] overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#E5E4E2] flex items-center justify-between bg-[#F6F4F0]">
          <div>
            <h3 className="text-sm font-bold text-[#1b1c1c]">Forward Message</h3>
            <p className="text-[11px] text-[#737874]">
              Select one or more chats to forward this message
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#737874] hover:bg-[#E5E4E2] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Preview Snippet */}
        <div className="p-3 bg-[#FAF9F7] border-b border-[#E5E4E2]">
          <div className="text-[10px] uppercase font-bold text-[#56615a] tracking-wider mb-1">
            Message Preview
          </div>
          <div className="p-2.5 rounded-xl bg-white border border-[#E5E4E2] text-xs text-[#1b1c1c] max-h-20 overflow-y-auto">
            <span className="font-bold text-[#56642b] block mb-0.5">{message.senderName}:</span>
            {message.type === 'file' ? (
              <span className="flex items-center gap-1 text-[#56615a]">
                <FileText className="w-3.5 h-3.5" /> {message.fileName || 'Attachment'}
              </span>
            ) : message.type === 'material_forward' ? (
              <span className="flex items-center gap-1 text-[#56615a]">
                <BookOpen className="w-3.5 h-3.5" /> {message.forwardedMaterial?.title || 'Study Material'}
              </span>
            ) : (
              <p className="line-clamp-2">{message.content}</p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[#E5E4E2]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#737874] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chats or groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#F6F4F0] border border-[#E5E4E2] rounded-xl text-xs text-[#1b1c1c] focus:outline-none focus:border-[#56615a]"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-[#F0EDED]">
          {filteredGroups.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#737874]">No chats found</div>
          ) : (
            filteredGroups.map((grp) => {
              const isSelected = selectedGroupIds.includes(grp.id);
              return (
                <div
                  key={grp.id}
                  onClick={() => toggleGroup(grp.id)}
                  className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-[#d9e6dc]/40 border border-[#b2beb5]/60' : 'hover:bg-[#F6F4F0]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={grp.avatar}
                      alt={grp.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#E5E4E2] flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#1b1c1c] truncate">{grp.name}</div>
                      <div className="text-[10px] text-[#737874] flex items-center gap-1">
                        {grp.isDirect ? (
                          <>
                            <MessageSquare className="w-2.5 h-2.5" /> Direct Chat
                          </>
                        ) : (
                          <>
                            <Users className="w-2.5 h-2.5" /> Group Chat
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-[#56615a] border-[#56615a] text-white'
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

        {/* Footer */}
        <div className="p-3 border-t border-[#E5E4E2] bg-[#F6F4F0] flex items-center justify-between">
          <span className="text-xs text-[#56615a]">
            {selectedGroupIds.length} chat{selectedGroupIds.length === 1 ? '' : 's'} selected
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#737874] hover:bg-[#E5E4E2] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={selectedGroupIds.length === 0 || isSubmitting}
              onClick={handleConfirmForward}
              className="px-4 py-1.5 bg-[#56615a] hover:bg-[#434d46] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Forwarding...' : 'Forward'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
