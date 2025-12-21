import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Play, Pause, Loader2, Headphones, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AudioSummary {
  id: string;
  date: string;
  audio_url: string | null;
  script: string | null;
  duration_seconds: number | null;
  status: string;
}

const NewsAudioPlayer: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSummary, setAudioSummary] = useState<AudioSummary | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const today = new Date().toISOString().split('T')[0];

  // Check for existing audio on mount
  useEffect(() => {
    checkExistingAudio();
  }, []);

  const checkExistingAudio = async () => {
    try {
      const { data, error } = await supabase
        .from('news_audio_summaries')
        .select('*')
        .eq('date', today)
        .eq('status', 'completed')
        .single();

      if (data && !error) {
        setAudioSummary(data);
        if (data.duration_seconds) {
          setDuration(data.duration_seconds);
        }
      }
    } catch (e) {
      // No existing audio, that's fine
    }
  };

  const generateAudio = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-news-audio', {
        body: { date: today }
      });

      if (error) {
        // Handle rate limits
        if (error.message?.includes('429')) {
          toast.error('Límite de solicitudes alcanzado. Intenta en unos minutos.');
          return;
        }
        throw error;
      }

      if (data?.success) {
        if (data.summary) {
          setAudioSummary({
            id: data.summary.id,
            date: today,
            audio_url: data.summary.audioUrl,
            script: data.summary.script,
            duration_seconds: data.summary.durationSeconds,
            status: 'completed'
          });
          setDuration(data.summary.durationSeconds || 120);
          toast.success('Resumen de audio generado correctamente');
        } else if (data.message === 'No hay noticias para esta fecha') {
          toast.info('No hay noticias disponibles para generar el resumen');
        }
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Error al generar el resumen de audio');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative bg-gradient-to-br from-emerald-900/30 via-slate-900/50 to-blue-900/30 rounded-2xl border border-emerald-500/30 p-6 backdrop-blur-sm"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <Headphones className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Resumen en Audio</h3>
            <p className="text-sm text-slate-400">Escucha las noticias del día en 2 minutos</p>
          </div>
        </div>

        {/* Main Content */}
        {!audioSummary ? (
          <div className="text-center py-6">
            <p className="text-slate-400 mb-4">
              Genera un resumen de audio con las noticias más importantes del día
            </p>
            <Button
              onClick={generateAudio}
              disabled={isLoading}
              className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white shadow-lg shadow-emerald-500/25"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando resumen...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Generar Resumen de Audio
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Audio Player */}
            {audioSummary.audio_url ? (
              <>
                <audio
                  ref={audioRef}
                  src={audioSummary.audio_url}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleEnded}
                />
                
                {/* Player Controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={togglePlayPause}
                    className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-105 transition-transform"
                  >
                    {isPlaying ? (
                      <Pause className="w-6 h-6 text-white" />
                    ) : (
                      <Play className="w-6 h-6 text-white ml-1" />
                    )}
                  </button>

                  <div className="flex-1">
                    {/* Progress Bar */}
                    <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    
                    {/* Time */}
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-800/50 rounded-xl p-4 text-center">
                <VolumeX className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Audio no disponible</p>
                <p className="text-xs text-slate-500">Configura ElevenLabs para generar audio</p>
              </div>
            )}

            {/* Transcript Toggle */}
            {audioSummary.script && (
              <div>
                <button
                  onClick={() => setShowTranscript(!showTranscript)}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2"
                >
                  {showTranscript ? 'Ocultar transcripción' : 'Ver transcripción'}
                </button>
                
                <AnimatePresence>
                  {showTranscript && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 p-4 bg-slate-800/50 rounded-xl max-h-48 overflow-y-auto">
                        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {audioSummary.script}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Duration Info */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Clock className="w-3 h-3" />
                <span>~{Math.round((audioSummary.duration_seconds || 120) / 60)} min de resumen</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateAudio}
                disabled={isLoading}
                className="text-slate-400 hover:text-emerald-400"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Regenerar
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NewsAudioPlayer;
