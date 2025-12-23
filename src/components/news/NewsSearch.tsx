import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Mic, MicOff, Loader2, ExternalLink, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

interface SearchResult {
  id: string;
  title: string;
  excerpt: string;
  source: string;
  url?: string;
  isAI?: boolean;
  published_at?: string;
}

const NewsSearch: React.FC = () => {
  const { t, language } = useLanguage();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Get speech recognition language
  const getSpeechLang = () => {
    const langMap: Record<string, string> = {
      'es': 'es-ES',
      'en': 'en-US',
      'ca': 'ca-ES',
      'fr': 'fr-FR',
    };
    return langMap[language] || 'es-ES';
  };

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = getSpeechLang();

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setQuery(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error(t('news.voiceError'));
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, t]);

  // Close results on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error(t('news.voiceNotSupported'));
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = getSpeechLang();
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const searchNews = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setShowResults(true);
    setHasSearched(true);
    setResults([]);

    try {
      // First search in local database
      const { data: localResults, error: dbError } = await supabase
        .from('news_articles')
        .select('id, title, ai_summary, source_name, source_url, published_at')
        .or(`title.ilike.%${query}%,ai_summary.ilike.%${query}%,content.ilike.%${query}%`)
        .order('published_at', { ascending: false })
        .limit(5);

      if (dbError) throw dbError;

      const formattedLocalResults: SearchResult[] = (localResults || []).map(article => ({
        id: article.id,
        title: article.title,
        excerpt: article.ai_summary || '',
        source: article.source_name || 'ObelixIA',
        url: `/blog/${article.id}`,
        published_at: article.published_at,
        isAI: false
      }));

      setResults(formattedLocalResults);

      // If no local results, search with AI
      if (formattedLocalResults.length === 0) {
        const { data: aiData, error: aiError } = await supabase.functions.invoke('news-ai-search', {
          body: { query }
        });

        if (aiError) throw aiError;

        if (aiData?.results) {
          setResults(aiData.results.map((r: any) => ({
            ...r,
            isAI: true
          })));
        }
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error(t('news.searchError'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchNews();
    }
  };

  return (
    <div ref={searchContainerRef} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => hasSearched && setShowResults(true)}
            placeholder={t('news.searchPlaceholder')}
            className="pl-12 pr-4 h-14 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 rounded-full text-base focus:ring-2 focus:ring-primary/50 focus:border-primary"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleListening}
          className={`h-14 w-14 rounded-full transition-all duration-300 ${
            isListening 
              ? 'bg-red-500/20 text-red-400 animate-pulse border-2 border-red-500' 
              : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 border border-slate-700'
          }`}
          title={isListening ? t('common.close') : t('news.search')}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Button>

        <Button
          onClick={searchNews}
          disabled={isSearching || !query.trim()}
          className="h-14 px-8 rounded-full bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white font-medium shadow-lg shadow-primary/25"
        >
          {isSearching ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            t('news.search')
          )}
        </Button>
      </div>

      {/* Voice indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 text-center"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/20 text-red-400 text-sm">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {t('news.listening')}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && (results.length > 0 || isSearching) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-slate-400">
                  {isSearching ? t('news.searching') : `${results.length} ${t('news.resultsFound')}`}
                </h4>
                <button
                  onClick={() => setShowResults(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {results.map((result) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group"
                    >
                      {result.url?.startsWith('/') ? (
                        <Link
                          to={result.url}
                          onClick={() => setShowResults(false)}
                          className="block p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                        >
                          <ResultContent result={result} />
                        </Link>
                      ) : (
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-4 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
                        >
                          <ResultContent result={result} />
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {!isSearching && results.length > 0 && (
              <div className="px-4 py-3 bg-slate-800/50 border-t border-slate-700">
                <p className="text-xs text-slate-500 text-center">
                  {results.some(r => r.isAI) && (
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-primary" />
                      {t('news.aiResults')}
                    </span>
                  )}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results message */}
      <AnimatePresence>
        {showResults && hasSearched && !isSearching && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-0 right-0 mt-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 p-8 text-center"
          >
            <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">{t('news.noResults')} "{query}"</p>
            <p className="text-sm text-slate-500">{t('news.tryOther')}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ResultContent: React.FC<{ result: SearchResult }> = ({ result }) => (
  <>
    <div className="flex items-start justify-between gap-3">
      <h5 className="text-white font-medium group-hover:text-primary transition-colors line-clamp-2">
        {result.title}
      </h5>
      {result.isAI && (
        <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">
          <Sparkles className="w-3 h-3" />
          IA
        </span>
      )}
    </div>
    {result.excerpt && (
      <p className="text-sm text-slate-400 mt-2 line-clamp-2">{result.excerpt}</p>
    )}
    <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
      <span>{result.source}</span>
      {result.url && !result.url.startsWith('/') && (
        <ExternalLink className="w-3 h-3" />
      )}
    </div>
  </>
);

export default NewsSearch;
