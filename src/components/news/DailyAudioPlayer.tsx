import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Headphones,
  Calendar,
  Clock,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AudioSummary {
  id: string;
  date: string;
  audio_url: string;
  transcript: string;
  articles_included: string[];
  duration_seconds: number;
  generated_at: string;
}

export const DailyAudioPlayer: React.FC = () => {
  const [summary, setSummary] = useState<AudioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchLatestSummary();
  }, []);

  const fetchLatestSummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('news_audio_summaries')
        .select('*')
        .lte('date', today)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSummary({
          ...data,
          articles_included: data.articles_included || []
        });
      }
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAudio = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-news-audio');
      if (error) throw error;
      
      toast.success('Resumen de audio generado correctamente');
      fetchLatestSummary();
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Error al generar audio. Verifica que ElevenLabs está configurado.');
    } finally {
      setGenerating(false);
    }
  };

  const togglePlay = () => {
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

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 1;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Headphones className="h-6 w-6" />
            Resumen de Voz Diario
          </h2>
          <p className="text-muted-foreground">
            Escucha las noticias más importantes del día en 2 minutos
          </p>
        </div>
        <Button onClick={generateAudio} disabled={generating}>
          <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generando...' : 'Generar Nuevo'}
        </Button>
      </div>

      {!summary ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Headphones className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="font-medium text-lg mb-2">Sin resumen de audio disponible</h3>
            <p className="text-muted-foreground mb-4">
              Genera tu primer resumen de voz con las noticias del día
            </p>
            <Button onClick={generateAudio} disabled={generating}>
              {generating ? 'Generando...' : 'Generar Resumen de Hoy'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Audio Player Card */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
            <CardContent className="p-6">
              <audio
                ref={audioRef}
                src={summary.audio_url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />

              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-primary/20 rounded-full">
                  <Headphones className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Resumen del {new Date(summary.date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}</h3>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatTime(summary.duration_seconds || duration)}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {summary.articles_included?.length || 0} noticias
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-4">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => skip(-10)}>
                  <SkipBack className="h-5 w-5" />
                </Button>
                
                <Button 
                  size="lg" 
                  className="h-14 w-14 rounded-full"
                  onClick={togglePlay}
                  disabled={!summary.audio_url}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6 ml-1" />
                  )}
                </Button>
                
                <Button variant="ghost" size="icon" onClick={() => skip(10)}>
                  <SkipForward className="h-5 w-5" />
                </Button>

                <div className="flex items-center gap-2 ml-4">
                  <Button variant="ghost" size="icon" onClick={toggleMute}>
                    {isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-24"
                  />
                </div>
              </div>

              {!summary.audio_url && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Audio no disponible. Genera un nuevo resumen para escucharlo.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Transcript */}
          <Card>
            <CardHeader 
              className="cursor-pointer"
              onClick={() => setShowTranscript(!showTranscript)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Transcripción
                </CardTitle>
                {showTranscript ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </div>
            </CardHeader>
            {showTranscript && (
              <CardContent>
                {summary.transcript ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {summary.transcript.split('\n').map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Transcripción no disponible
                  </p>
                )}
              </CardContent>
            )}
          </Card>

          {/* Historical Summaries */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Resúmenes Anteriores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <p>Próximamente: historial de resúmenes de audio</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DailyAudioPlayer;
