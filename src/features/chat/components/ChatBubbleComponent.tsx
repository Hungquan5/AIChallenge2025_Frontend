import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
// CHANGED: Thêm biểu tượng Image
import { MessageSquare, User, Bot, Loader2, X, Minimize2, ExternalLink, Clipboard, Check, Search, Image } from 'lucide-react';
const API_BASE_URL = 'http://localhost:5731'; // Assuming your FastAPI runs on port 8000

// --- TYPES ---
interface ToolOutput {
  tool: string;
  ok: boolean;
  output: {
    tool: string;
    ok: boolean;
    type: string;
    items: any[];
    meta: Record<string, any>;
  };
  meta: Record<string, any>;
  error?: string;
}
// CHANGED: Added a specific type for text search results for clarity
interface TextResult {
  title: string;
  link: string;
  snippet: string;
}
interface ImageResult {
  title: string;
  image: string; // This comes from your FastAPI endpoint
  thumbnail: string; // This comes from your FastAPI endpoint
  url: string;
}
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolOutputs?: ToolOutput[];
  isRefinedQuery?: boolean;
}

interface BubbleChatProps {
  onToolOutputs?: (outputs: any[]) => void;
  user?: { username: string };
  isVisible?: boolean;
}

export interface BubbleChatRef {
  sendMessage: (message: string) => void;
  openChat: () => void;
}

const ToolOutputRenderer: React.FC<{ toolOutput: ToolOutput }> = ({ toolOutput }) => {
  const items = toolOutput.output?.items;

  if (!toolOutput.ok || !Array.isArray(items) || items.length === 0) {
    return null;
  }

  switch (toolOutput.tool) {
    // Case for Image Results
    case 'duckduckgo_image_search_tool':
      return (
        <div className="mt-2 pt-2 border-t border-slate-200/60">
          <div className="grid grid-cols-3 gap-1.5">
            {items.map((image: ImageResult, index: number) => (
              <a key={index} href={image.image} target="_blank" rel="noopener noreferrer" /* ... */ >
                <img src={image.thumbnail} alt={image.title} /* ... */ />
                <div /* ... */ >
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      );

    // NEW: Case for Text Search Results
    case 'duckduckgo_text_search_tool':
      return (
        <div className="mt-2 pt-2 space-y-2 border-t border-slate-200/60">
          {items.map((result: TextResult, index: number) => (
            <div key={index} className="p-2 bg-slate-50/70 rounded-lg hover:bg-slate-100 transition-colors">
              <a href={result.link} target="_blank" rel="noopener noreferrer" className="block">
                <p className="text-xs font-semibold text-blue-600 truncate">{result.title}</p>
                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{result.snippet}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                  <span className="text-[10px] text-slate-500 truncate">{result.link}</span>
                </div>
              </a>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
};
// --- CHAT MESSAGE COMPONENT ---
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(message.content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text:', err);
    });
  };

  return (
    <div className={`flex gap-2 mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`relative group px-3 py-2 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          {/* Sửa đổi: Không hiển thị prompt đặc biệt cho người dùng */}
          <p className="text-xs whitespace-pre-wrap break-words">
            {message.content.startsWith("Find images of:") ? message.content.substring("Find images of:".length).trim() : message.content}
          </p>

          {!isUser && message.isRefinedQuery && (
            <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full border border-slate-200 shadow-sm transition-colors"
                title="Copy query"
              >
                {isCopied ? (
                  <Check className="w-3 h-3 text-green-600" />
                ) : (
                  <Clipboard className="w-3 h-3 text-slate-500" />
                )}
              </button>
            </div>
          )}

          {message.toolOutputs && message.toolOutputs.length > 0 && (
            <>
              {message.toolOutputs.map((output, index) => (
                <ToolOutputRenderer key={index} toolOutput={output} />
              ))}
            </>
          )}
        </div>
        <span className="text-[10px] text-slate-400 mt-0.5 px-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
    </div>
  );
};

// --- MAIN BUBBLE CHAT COMPONENT ---
const BubbleChat = forwardRef<BubbleChatRef, BubbleChatProps>(({
  onToolOutputs,
  user,
  isVisible = true
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hi${user ? ` ${user.username}` : ''}! Need quick help? Ask me anything!`,
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

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (isOpen && inputRef.current) { inputRef.current.focus(); } }, [isOpen]);
const handleImageSearch = async () => {
    if (!inputValue.trim() || isSending) return;

    const query = inputValue.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      // 1. Call your new FastAPI image search endpoint
      const response = await fetch(`${API_BASE_URL}/embeddings/duckduckgo/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          max_results: 6, // Request 6 images to fill the grid nicely
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Backend image search failed');
      }

      const imageResults: ImageResult[] = await response.json();

      // 2. Create an assistant message that CONTAINS the image data
      //    This will be automatically picked up by the ChatMessage and ToolOutputRenderer components.
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        // A simple text message to accompany the images
        content: imageResults.length > 0
          ? `Here are the image results for "${query}":`
          : `I couldn't find any images for "${query}".`,
        timestamp: new Date(),
        // 3. This is the crucial part: format the results for our renderer
                // ✅ FIX: The tool output object now fully matches the ToolOutput type
        toolOutputs: imageResults.length > 0 ? [
          {
            tool: 'duckduckgo_image_search_tool',
            ok: true,
            output: {
              tool: 'duckduckgo_image_search_tool',
              ok: true,
              type: 'image_results',
              items: imageResults,
              meta: {}, // Added missing 'meta' property
            },
            meta: {}, // Added missing 'meta' property
          }
        ] : [],
      };
      
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error fetching from backend image search:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, the image search failed. Please ensure the backend is running.\n\n**Error:** ${error}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };
     const handleDuckDuckGoSearch = async () => {
    if (!inputValue.trim() || isSending) return;

    const query = inputValue.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/embeddings/duckduckgo/search`, { // Assuming /api prefix from backend setup
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query,
          max_results: 4, // 4 results looks clean
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Backend search request failed');
      }
      
      const searchResults: TextResult[] = await response.json();
      
      // Create an assistant message that CONTAINS the structured search data
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: searchResults.length > 0
          ? `Here are the top web results for "${query}":`
          : `I couldn't find any web results for "${query}".`,
        timestamp: new Date(),
        // This is the key change: pass the data to the tool renderer
        toolOutputs: searchResults.length > 0 ? [
          {
            tool: 'duckduckgo_text_search_tool',
            ok: true,
            output: {
              tool: 'duckduckgo_text_search_tool',
              ok: true,
              type: 'text_results',
              items: searchResults,
              meta: {}, // Added missing 'meta' property
            },
            meta: {}, // Added missing 'meta' property
          }
        ] : [],
      };
      
      
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Error fetching from backend search:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I couldn't connect to the search service. Please make sure the backend is running. \n\n**Error:** ${error}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };
  
  const handleSendToBackend = async (messageText: string, isImageSearch: boolean = false) => {
    if (!messageText.trim() || isSending) return;

    // Hiển thị tin nhắn của người dùng ngay lập tức
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      // Sửa đổi: Gửi toàn bộ prompt đến backend nhưng chỉ hiển thị phần tìm kiếm cho người dùng
      content: isImageSearch ? `Find images of: ${messageText.trim()}` : messageText.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Gửi prompt đầy đủ đến backend
    const promptToSend = userMessage.content;
    
    setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch('http://localhost:5731/agent/chat/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg: promptToSend,
          user_id: user?.username || 'anonymous'
        })
      });

      if (!response.ok) throw new Error('Failed to get response from agent');
      
      const data = await response.json();
      
      let assistantMessage: Message;
      let messageContent = data.message;
      let isRefined = false;

      try {
        const parsedData = JSON.parse(data.message);
        
        if (parsedData.refined_queries && Array.isArray(parsedData.refined_queries) && parsedData.refined_queries.length > 0) {
          messageContent = parsedData.refined_queries[0].query || parsedData.refined_queries[0].text;
          isRefined = true;
        }
      } catch (e) {
        // Not a JSON string, treat as plain text.
      }

      assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: messageContent,
        timestamp: new Date(),
        toolOutputs: data.tool_outputs || [],
        isRefinedQuery: isRefined,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.tool_outputs && data.tool_outputs.length > 0 && onToolOutputs) {
        const searchOutput = data.tool_outputs.find((output: any) => output.ok);
        if (searchOutput) {
          onToolOutputs(searchOutput.output.items);
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
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };


  // --- END: NEW Image Search Handler ---
  
  useImperativeHandle(ref, () => ({
    sendMessage: (message: string) => {
      setIsOpen(true);
      handleSendToBackend(message);
    },
    openChat: () => setIsOpen(true)
  }));

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendToBackend(inputValue);
    }
  };

  const toggleChat = () => setIsOpen(!isOpen);

  const clearChat = () => {
    setMessages([{
      id: '1',
      role: 'assistant',
      content: 'Chat cleared. How can I help you?',
      timestamp: new Date(),
    }]);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className={`fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95 pointer-events-none'}`}>
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-white" />
            <h3 className="text-white font-semibold text-sm">Quick AI Assistant</h3>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={clearChat} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Clear chat">
              <Minimize2 className="w-4 h-4 text-white" />
            </button>
            <button onClick={toggleChat} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors" title="Close chat">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-50/50 to-white scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {messages.map(message => (<ChatMessage key={message.id} message={message} />))}
          {isSending && (
            <div className="flex gap-2 mb-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white border border-slate-200">
                <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                <span className="text-xs text-slate-600">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* --- CHANGED: Thêm nút tìm kiếm hình ảnh --- */}
        <div className="p-3 border-t border-slate-200 bg-white rounded-b-2xl">
          <div className="flex gap-2">
            <input 
              ref={inputRef} 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onKeyPress={handleKeyPress} 
              placeholder="Ask me anything..." 
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              disabled={isSending} 
            />
            {/* NÚT MỚI: TÌM KIẾM HÌNH ẢNH */}
            <button 
              onClick={handleImageSearch} 
              disabled={!inputValue.trim() || isSending} 
              className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              title="Search for images"
            >
              <Image className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDuckDuckGoSearch} 
              disabled={!inputValue.trim() || isSending} 
              className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              title="Search with DuckDuckGo"
            >
              <Search className="w-4 h-4" />
            </button>
            
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 px-1">Press Enter to send to AI</p>
        </div>
      </div>
      
      <button 
        onClick={toggleChat} 
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${isOpen ? 'rotate-0' : 'animate-bounce'}`} 
        title="Open AI Assistant"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <>
            <MessageSquare className="w-6 h-6 text-white" />
            <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20" />
          </>
        )}
      </button>
    </>
  );
});

BubbleChat.displayName = 'BubbleChat';

export default React.memo(BubbleChat);