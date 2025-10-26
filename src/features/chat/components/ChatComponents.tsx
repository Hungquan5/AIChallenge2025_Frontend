import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, User, Bot, Loader2, X, Image as ImageIcon, Link as LinkIcon, Video } from 'lucide-react';
import { sendAgentMessage,extractVideoIds } from '../../../utils/AgentUtils'; // Giả sử bạn có hàm này
import { getImageUrl } from '../../../utils/getImageURL';
// UPDATED: Cấu trúc dữ liệu của một tool output
export interface AgentToolOutput {
  tool: string;
  ok: boolean;
  // `output` có thể là một mảng trực tiếp, hoặc một object chứa 'items'
  output: any[] | {
    items: any[];
    meta?: Record<string, any>;
  };
  error?: string;
}

// (Giữ nguyên interface Message)
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolOutputs?: AgentToolOutput[];
  videoIds?: string[];
}

interface ChatbotProps {
  onToolOutputs?: (outputs: AgentToolOutput) => void;
  isLoading?: boolean;
  user?: { username: string };
}

// ==================================================================
// NEW: Các component con để hiển thị các loại kết quả khác nhau
// ==================================================================

// Component hiển thị kết quả tìm kiếm web
const WebSearchResults: React.FC<{ items: any[] }> = ({ items }) => (
  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <LinkIcon className="w-4 h-4 text-slate-500" />
      <h4 className="font-semibold text-sm text-slate-700">Web Results</h4>
    </div>
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index}>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline font-medium break-words"
          >
            {item.title}
          </a>
        </div>
      ))}
    </div>
  </div>
);

// Component hiển thị kết quả tìm kiếm hình ảnh
// src/features/chatbot/components/Chatbot.tsx

// Component hiển thị kết quả tìm kiếm hình ảnh
const ImageSearchResults: React.FC<{ items: any[] }> = ({ items }) => (
  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <ImageIcon className="w-4 h-4 text-slate-500" />
      <h4 className="font-semibold text-sm text-slate-700">Image Results</h4>
    </div>
    {/* 👇 THAY ĐỔI DÒNG NÀY 👇 */}
    <div className="grid grid-cols-[repeat(auto-fit,minmax(4.5rem,1fr))] gap-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 pr-2">
      {items.map((item, index) => (
        <a key={index} href={item.image_url} target="_blank" rel="noopener noreferrer">
          <img
            src={item.thumbnail_url}
            alt={item.title}
            // 👇 Chiều cao có thể giữ nguyên hoặc điều chỉnh cho phù hợp 👇
            className="w-full h-20 object-cover rounded-md hover:opacity-80 transition-opacity"
            title={item.title}
          />
        </a>
      ))}
    </div>
  </div>
);

// Component hiển thị kết quả tìm kiếm video
const VideoSearchResults: React.FC<{ items: any[] }> = ({ items }) => (
  <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
    <div className="flex items-center gap-2 mb-2">
      <Video className="w-4 h-4 text-slate-500" />
      <h4 className="font-semibold text-sm text-slate-700">Video Results</h4>
    </div>
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {items.map((item, index) => (
        <div key={index} className="cursor-pointer">
          <img
            src={getImageUrl(item.videoId, item.timestamp)}
            alt={`Frame from ${item.videoId}`}
            className="w-full h-20 object-cover rounded-md hover:scale-105 transition-transform"
            title={`Video: ${item.videoId}, Frame: ${item.timestamp}\nConfidence: ${item.confidence}`}
          />
        </div>
      ))}
    </div>
  </div>
);


// ==================================================================
// UPDATED: Chat Message Component (đã được sửa lỗi)
// ==================================================================
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';

  // NEW: Hàm render các tool outputs đã được làm cho "thông minh" hơn
  const renderToolOutputs = () => {
    if (!message.toolOutputs || message.toolOutputs.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 w-full">
        {message.toolOutputs.map((output, index) => {
          if (!output.ok) {
            return null;
          }

          // 👇 LOGIC QUAN TRỌNG ĐỂ XỬ LÝ CẢ 2 TRƯỜNG HỢP 👇
          // Kiểm tra và lấy ra mảng 'items' một cách linh hoạt
          const items = Array.isArray(output.output) 
            ? output.output 
            : (output.output?.items || []);

          if (items.length === 0) {
            return null;
          }
          // 👆 KẾT THÚC LOGIC QUAN TRỌNG 👆

          switch (output.tool) {
            case 'video_search_tool':
            case 'chain_search_tool':
              return <VideoSearchResults key={index} items={items.slice(0,5)} />; //just take first 5 items
            case 'duckduckgo_image_search_tool':
              return <ImageSearchResults key={index} items={items} />;
            case 'duckduckgo_web_search_tool':
              return <WebSearchResults key={index} items={items} />;
            default:
              return null;
          }
        })}
      </div>
    );
  };

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
          {!isUser && renderToolOutputs()}
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

// ==================================================================
// UPDATED: Main Chatbot Component
// ==================================================================
const Chatbot: React.FC<ChatbotProps> = ({ 
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    const currentInput = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch('http://localhost:5731/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg: currentInput,
          user_id: user?.username || 'anonymous'
        })
      });

      if (!response.ok) throw new Error('Failed to get response from agent');
      
      const data: { message: string; tool_outputs: AgentToolOutput[] } = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || "Here's what I found:", // Cung cấp nội dung mặc định
        timestamp: new Date(),
        toolOutputs: data.tool_outputs
      };

      setMessages(prev => [...prev, assistantMessage]);

      // UPDATED: Logic gọi callback onToolOutputs trở nên rõ ràng hơn
      // Gửi kết quả của *chỉ* tool tìm kiếm video cho component cha (nếu có)
      if (data.tool_outputs && onToolOutputs) {
        const videoSearchOutput = data.tool_outputs.find(
          (output) => (output.tool === 'video_search_tool' || output.tool === 'chain_search_tool') && output.ok
        );
        if (videoSearchOutput) {
          onToolOutputs(videoSearchOutput);
        }
      }

    } catch (error) {
      console.error('Error sending message to agent:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  // (Giữ nguyên các hàm handleKeyPress và clearChat)
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


  // (Giữ nguyên phần JSX trả về của component Chatbot)
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