export type LiveSenderRole = 'user' | 'consultant' | 'system';

export type LiveMessage = {
  id: string;
  conversationId: string;
  senderRole: LiveSenderRole;
  senderId?: string | null;
  text: string;
  createdAt: string;
};

export type LiveConversation = {
  id: string;
  userId: string;
  petId?: string | null;
  status: 'waiting' | 'active' | 'closed';
  consultantId?: string | null;
  userName?: string;
  petName?: string;
};

export type UiChatMessage = {
  id: string;
  role: 'bot' | 'user' | 'system';
  text: string;
  attachment?: {
    kind: 'image' | 'file';
    name: string;
    uri: string;
  };
};

export function liveToUiMessage(message: LiveMessage): UiChatMessage {
  if (message.senderRole === 'user') {
    return { id: message.id, role: 'user', text: message.text };
  }
  if (message.senderRole === 'system') {
    return { id: message.id, role: 'system', text: message.text };
  }
  return { id: message.id, role: 'bot', text: message.text };
}
