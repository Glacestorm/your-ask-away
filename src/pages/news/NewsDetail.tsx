import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Clock, ExternalLink, Share2, Bookmark, BookmarkCheck, 
  Eye, Tag, ChevronRight, Loader2, Copy, Check, Twitter, Linkedin, Facebook
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { es, enUS, fr, ca } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSavedNews } from '@/hooks/useSavedNews';
import { toast } from 'sonner';
import UnifiedFooter from '@/components/layout/UnifiedFooter';
import { getNewsImageFallback } from '@/lib/news/placeholders';
import DOMPurify from 'dompurify';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  image_credit: string | null;
  source_url: string;
  source_name: string;
  category: string;
  tags: string[];
  published_at: string;
  fetched_at: string;
  is_featured: boolean;
  ai_summary: string;
  relevance_score: number;
  read_count: number;
}

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const { isSaved, toggleSave, isLoading: isSaveLoading } = useSavedNews(id || '');

  const getDateLocale = () => {
    const locales: Record<string, typeof es> = { es, en: enUS, fr, ca };
    return locales[language] || es;
  };

  useEffect(() => {
    if (id) {
      fetchArticle();
      incrementReadCount();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('news_articles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setArticle(data);
    } catch (err) {
      console.error('Error fetching article:', err);
      toast.error(t('news.detail.notFound') || 'Article not found');
      navigate('/blog');
    } finally {
      setIsLoading(false);
    }
  };

  const incrementReadCount = async () => {
    try {
      // Use direct update instead of RPC to avoid type regeneration issues
      await supabase
        .from('news_articles')
        .update({ read_count: (article?.read_count || 0) + 1 })
        .eq('id', id);
    } catch (err) {
      // Silent fail for read count
      console.log('Read count increment failed (non-critical)');
    }
  };

  const handleShare = async (platform?: string) => {
    const url = window.location.href;
    const title = article?.title || '';

    if (platform === 'copy') {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('news.detail.linkCopied') || 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        // User cancelled or error
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 p-[3px]"
        >
          <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-emerald-400" />
          </div>
        </motion.div>
      </div>
    );
  }

  if (!article) return null;

  const hasOriginalImage = Boolean(article.image_url);
  const imageUrl = hasOriginalImage
    ? article.image_url
    : getNewsImageFallback(article.id, article.category);
  const imageCredit = hasOriginalImage
    ? (article.image_credit || article.source_name)
    : 'Ilustración (ObelixIA)';

  const timeAgo = formatDistanceToNow(new Date(article.published_at), { 
    addSuffix: true, 
    locale: getDateLocale() 
  });

  const formattedDate = format(new Date(article.published_at), 'PPP', { locale: getDateLocale() });

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="relative bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5" />
        <div className="relative container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/blog">
            <Button variant="ghost" className="text-slate-400 hover:text-white hover:bg-slate-800/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('news.back')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleSave()}
              disabled={isSaveLoading}
              className={isSaved ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}
            >
              {isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
            </Button>
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleShare()}
                className="text-slate-400 hover:text-white"
              >
                <Share2 className="w-5 h-5" />
              </Button>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 bg-slate-800 border border-slate-700 rounded-xl p-2 shadow-xl z-50"
                >
                  <button
                    onClick={() => handleShare('copy')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {t('news.detail.copyLink')}
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg"
                  >
                    <Twitter className="w-4 h-4" />
                    Twitter
                  </button>
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg"
                  >
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-slate-500">
          <Link to="/store" className="hover:text-emerald-400 transition-colors">
            {t('nav.store') || 'Store'}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/blog" className="hover:text-emerald-400 transition-colors">
            {t('news.title')}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-400 truncate max-w-xs">{article.title}</span>
        </nav>
      </div>

      {/* Article Content */}
      <article className="container mx-auto px-4 pb-20 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 text-white">
              {article.category}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Clock className="w-4 h-4" />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-slate-500">
              <Eye className="w-4 h-4" />
              {article.read_count || 0} {t('news.detail.reads')}
            </span>
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            {article.title}
          </h1>
          
          <p className="text-lg text-slate-400 leading-relaxed">
            {article.ai_summary || article.excerpt}
          </p>
        </motion.div>

        {/* Featured Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative rounded-2xl overflow-hidden mb-8"
        >
          <img
            src={imageUrl}
            alt={article.title}
            className="w-full h-64 md:h-96 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4">
            <span className="text-sm text-white/70">© {imageCredit}</span>
          </div>
        </motion.div>

        {/* Article Body */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="prose prose-invert prose-emerald max-w-none mb-8"
        >
          <div 
            dangerouslySetInnerHTML={{ 
              __html: DOMPurify.sanitize(article.content || article.ai_summary || article.excerpt) 
            }} 
          />
        </motion.div>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            <Tag className="w-4 h-4 text-slate-500" />
            {article.tags.map((tag, i) => (
              <Link
                key={i}
                to={`/blog?search=${encodeURIComponent(tag)}`}
                className="px-3 py-1.5 bg-slate-800/80 text-slate-400 text-sm rounded-lg hover:bg-slate-700 hover:text-white transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </motion.div>
        )}

        {/* Source & Metadata */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500 mb-1">{t('news.detail.source')}</p>
              <p className="text-white font-medium">{article.source_name}</p>
              <p className="text-sm text-slate-500 mt-1">{formattedDate}</p>
            </div>
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-xl transition-colors"
            >
              {t('news.detail.readOriginal')}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </article>

      <UnifiedFooter />
    </div>
  );
};

export default NewsDetail;
