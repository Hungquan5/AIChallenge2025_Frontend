import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
// CHANGED: Added Clipboard and Check icons for the copy button
import { MessageSquare, Send, User, Bot, Loader2, X, Minimize2, ExternalLink, Clipboard, Check } from 'lucide-react';

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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  toolOutputs?: ToolOutput[];
  isRefinedQuery?: boolean; // ADDED: Flag for special message types
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

// --- TOOL OUTPUT RENDERER ---
const ToolOutputRenderer: React.FC<{ toolOutput: ToolOutput }> = ({ toolOutput }) => {
  // ... (This component remains unchanged)
  const items = toolOutput.output?.items;

  if (!toolOutput.ok || !Array.isArray(items) || items.length === 0) {
    return null;
  }

  switch (toolOutput.tool) {
    case 'duckduckgo_image_search_tool':
      return (
        <div className="mt-2 pt-2 border-t border-slate-200/60">
          <div className="grid grid-cols-3 gap-1.5">
            {items.slice(0, 6).map((image: any, index: number) => (
              <a
                key={index}
                href={image.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block relative aspect-square rounded-lg overflow-hidden group shadow-sm hover:shadow-md transition-shadow"
                title={`View image: ${image.title}`}
              >
                <img
                  src={image.thumbnail_url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-5 h-5 text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      );
    default:
      return null;
  }
};

// --- CHAT MESSAGE COMPONENT ---
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  // ADDED: State for copy-to-clipboard feedback
  const [isCopied, setIsCopied] = useState(false);

  // ADDED: Handler to copy message content
  const handleCopy = () => {
    if (!navigator.clipboard) return; // Clipboard API not available
    navigator.clipboard.writeText(message.content).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
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
        {/* CHANGED: Added `relative group` for positioning the copy button */}
        <div
          className={`relative group px-3 py-2 rounded-2xl ${
            isUser
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
              : 'bg-white border border-slate-200 text-slate-800 shadow-sm'
          }`}
        >
          <p className="text-xs whitespace-pre-wrap break-words">{message.content}</p>
          
          {/* ADDED: The copy button, appears on hover */}
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
  // ... (all state and refs remain the same)
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

  // Internal send handler
  const handleSendInternal = async (messageText: string) => {
    if (!messageText.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);

    try {
      const response = await fetch('http://localhost:5731/agent/chat/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          msg: messageText.trim(),
          user_id: user?.username || 'anonymous'
        })
      });

      if (!response.ok) throw new Error('Failed to get response from agent');
      
      const data = await response.json();

      // --- START: CHANGED RESPONSE HANDLING ---
      let assistantMessage: Message;
      let messageContent = data.message;
      let isRefined = false;

      try {
        // Try to parse the message content as JSON
        const parsedData = JSON.parse(data.message);
        
        // Check if it has the refined_queries structure
        if (parsedData.refined_queries && Array.isArray(parsedData.refined_queries) && parsedData.refined_queries.length > 0) {
          // Extract the actual query text
          messageContent = parsedData.refined_queries[0].query || parsedData.refined_queries[0].text;
          isRefined = true; // Flag this message for the UI
        }
      } catch (e) {
        // It's not a JSON string, so we treat it as plain text.
      }

      assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: messageContent,
        timestamp: new Date(),
        toolOutputs: data.tool_outputs || [],
        isRefinedQuery: isRefined, // Pass the flag to the message object
      };
      // --- END: CHANGED RESPONSE HANDLING ---

      setMessages(prev => [...prev, assistantMessage]);
      
      if (data.tool_outputs && data.tool_outputs.length > 0 && onToolOutputs) {
        const videoSearchOutput = data.tool_outputs.find((output: any) => output.ok);
        if (videoSearchOutput) {
          onToolOutputs(videoSearchOutput.output.items);
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
  
  // ... (rest of the component remains the same)
  const handleSend = () => handleSendInternal(inputValue);

  useImperativeHandle(ref, () => ({
    sendMessage: (message: string) => {
      setIsOpen(true);
      handleSendInternal(message);
    },
    openChat: () => setIsOpen(true)
  }));

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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
        
        <div className="p-3 border-t border-slate-200 bg-white rounded-b-2xl">
          <div className="flex gap-2">
            <input 
              ref={inputRef} 
              type="text" 
              value={inputValue} 
              onChange={(e) => setInputValue(e.target.value)} 
              onKeyPress={handleKeyPress} 
              placeholder="Ask me anything..." 
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs" 
              disabled={isSending} 
            />
            <button 
              onClick={handleSend} 
              disabled={!inputValue.trim() || isSending} 
              className="px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 px-1">Press Enter to send</p>
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

export default BubbleChat;