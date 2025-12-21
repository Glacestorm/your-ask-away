import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bot, ChevronDown, ChevronUp, ExternalLink, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Source {
  id: string;
  title: string;
  source: string;
  date: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  created_at: string;
}

interface NewsChatMessageProps {
  message: ChatMessage;
}

export const NewsChatMessage: React.FC<NewsChatMessageProps> = ({ message }) => {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === 'user';

  // Format message content - convert [N] references to styled citations
  const formatContent = (content: string) => {
    return content.replace(/\[(\d+)\]/g, (match, num) => {
      return `<span class="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 font-medium">${num}</span>`;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
          isUser
            ? 'bg-blue-500/20 text-blue-400'
            : 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400'
        }`}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message content */}
      <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
        <div
          className={`inline-block max-w-[85%] rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-blue-500 text-white rounded-br-md'
              : 'bg-slate-800 text-slate-200 rounded-bl-md'
          }`}
        >
          <div
            className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
          />
        </div>

        {/* Sources toggle */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
            >
              <span>{message.sources.length} fuentes citadas</span>
              {showSources ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showSources && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-2"
              >
                {message.sources.map((source, idx) => (
                  <div
                    key={source.id}
                    className="flex items-start gap-2 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs flex items-center justify-center font-medium">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {source.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{source.source}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(source.date), {
                            addSuffix: true,
                            locale: es,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <p className={`text-xs text-slate-500 mt-1 ${isUser ? 'text-right' : ''}`}>
          {formatDistanceToNow(new Date(message.created_at), {
            addSuffix: true,
            locale: es,
          })}
        </p>
      </div>
    </motion.div>
  );
};
