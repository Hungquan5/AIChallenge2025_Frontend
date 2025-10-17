// src/features/chatbot/components/Chatbot.tsx

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, User, Bot, Loader2, X } from 'lucide-react';
import { sendAgentMessage,extractVideoIds } from '../../../utils/AgentUtils';
// Types
import type { AgentToolOutput } from '../../../utils/AgentUtils';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolOutputs?: AgentToolOutput[];
  videoIds?: string[];
}

interface ChatbotProps {
  // onSearch?: (query: string) => void;
  onToolOutputs?: (outputs: AgentToolOutput[]) => void;
  isLoading?: boolean;
  user?: { username: string };
}

// Chat Message Component
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className="text-xs text-slate-400 mt-1 px-2">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
          <User className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

// Main Chatbot Component
const Chatbot: React.FC<ChatbotProps> = ({ 
  // onSearch, 
  onToolOutputs,
  isLoading = false, 
  user 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi${user ? ` ${user.username}` : ''}! I'm your AI assistant for video retrieval. I can help you find specific scenes, objects, or moments in videos. What are you looking for?`,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      // Call the agent API
      const response = await fetch('http://localhost:5731/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          msg: inputValue.trim(),
          user_id: user?.username || 'anonymous'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get response from agent');
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        toolOutputs: data.tool_outputs
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If there are tool outputs, pass them to the parent component
      if (data.tool_outputs && data.tool_outputs.length > 0) {
        // Find video_search_tool output
        const videoSearchOutput = data.tool_outputs.find(
          (output: any) => output.ok
        );

        if (videoSearchOutput && onToolOutputs) {
          onToolOutputs(videoSearchOutput.output);
        }

        // Also trigger onSearch callback if provided
        // if (onSearch) {
        //   onSearch(inputValue.trim());
        // }
      }

    } catch (error) {
      console.error('Error sending message to agent:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Chat cleared. How can I help you find videos today?',
      timestamp: new Date(),
    }]);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-white to-slate-50/50 rounded-xl shadow-lg border border-slate-200/60">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-xl">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-white" />
          <h2 className="text-white font-semibold">AI Video Assistant</h2>
        </div>
        <button
          onClick={clearChat}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          title="Clear chat"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        
        {isSending && (
          <div className="flex gap-3 mb-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-slate-200">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-slate-600">Thinking...</span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white/50 rounded-b-xl">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to find something in videos..."
            className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

export default Chatbot;