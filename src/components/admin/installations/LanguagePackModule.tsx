import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Globe, Languages, Check, Sparkles, Search, RefreshCw, ChevronRight, Star, AlertCircle,
  Volume2, Mic, Square, Loader2, Play, Pause, Download
} from 'lucide-react';
import { useSupportedLanguages } from '@/hooks/cms/useSupportedLanguages';
import { useLanguage, type Language } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LanguagePackModuleProps {
  onLanguageChange?: (locale: string) => void;
  installationId?: string;
}

// Voice IDs optimizados para cada idioma - ElevenLabs multilingual voices
const VOICE_MAP: Record<string, { voiceId: string; name: string }> = {
  es: { voiceId: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  en: { voiceId: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel' },
  fr: { voiceId: 'TX3LPaxmHKxFdv7VOQHJ', name: 'Liam' },
  de: { voiceId: 'nPczCjzI2devNBz1zQrb', name: 'Brian' },
  it: { voiceId: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily' },
  pt: { voiceId: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda' },
  'pt-BR': { voiceId: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda' },
  zh: { voiceId: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica' },
  'zh-CN': { voiceId: 'cgSgspJ2msm6clMCkdW9', name: 'Jessica' },
  ja: { voiceId: 'iP95p4xoKVk53GoZ742B', name: 'Chris' },
  ko: { voiceId: 'bIHbv24MWmeRgasZH58o', name: 'Will' },
  ar: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
  ru: { voiceId: 'N2lVS1w4EtoT3dr4eOWO', name: 'Callum' },
  nl: { voiceId: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger' },
  pl: { voiceId: 'SAz9YHcvj6GT2YYXdXww', name: 'River' },
  ca: { voiceId: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  eu: { voiceId: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  gl: { voiceId: 'JBFqnCBsd6RMkjVDRZzb', name: 'George' },
  // Default for any other language - multilingual voice
  default: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah' },
};

// Textos de ejemplo para cada idioma
const SAMPLE_TEXTS: Record<string, string> = {
  es: 'Bienvenido a Obelixia. Este es un ejemplo de texto en español para demostrar la síntesis de voz.',
  en: 'Welcome to Obelixia. This is an example text in English to demonstrate voice synthesis.',
  fr: 'Bienvenue sur Obelixia. Ceci est un exemple de texte en français pour démontrer la synthèse vocale.',
  de: 'Willkommen bei Obelixia. Dies ist ein Beispieltext auf Deutsch zur Demonstration der Sprachsynthese.',
  it: 'Benvenuto in Obelixia. Questo è un testo di esempio in italiano per dimostrare la sintesi vocale.',
  pt: 'Bem-vindo ao Obelixia. Este é um texto de exemplo em português para demonstrar a síntese de voz.',
  'pt-BR': 'Bem-vindo ao Obelixia. Este é um texto de exemplo em português brasileiro para demonstrar a síntese de voz.',
  zh: '欢迎使用 Obelixia。这是一段中文示例文本，用于演示语音合成。',
  'zh-CN': '欢迎使用 Obelixia。这是一段中文示例文本，用于演示语音合成。',
  ja: 'Obelixiaへようこそ。これは音声合成をデモンストレーションするための日本語のサンプルテキストです。',
  ko: 'Obelixia에 오신 것을 환영합니다. 이것은 음성 합성을 시연하기 위한 한국어 샘플 텍스트입니다.',
  ar: 'مرحباً بك في Obelixia. هذا نص عينة باللغة العربية لتوضيح تركيب الصوت.',
  ru: 'Добро пожаловать в Obelixia. Это пример текста на русском языке для демонстрации синтеза речи.',
  nl: 'Welkom bij Obelixia. Dit is een voorbeeldtekst in het Nederlands om spraaksynthese te demonstreren.',
  pl: 'Witamy w Obelixia. To jest przykładowy tekst w języku polskim, aby zademonstrować syntezę mowy.',
  ca: 'Benvingut a Obelixia. Aquest és un text d\'exemple en català per demostrar la síntesi de veu.',
  eu: 'Ongi etorri Obelixia-ra. Hau euskarazko testu lagin bat da, ahots-sintesia erakusteko.',
  gl: 'Benvido a Obelixia. Este é un texto de exemplo en galego para demostrar a síntese de voz.',
};

export function LanguagePackModule({ onLanguageChange, installationId }: LanguagePackModuleProps) {
  const { languages, loading: languagesLoading } = useSupportedLanguages();
  const { language, setLanguage } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedLocale, setSelectedLocale] = useState(language);
  const [downloading, setDownloading] = useState(false);
  const [previewTexts, setPreviewTexts] = useState<Record<string, string>>({});
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Voice states
  const [ttsText, setTtsText] = useState('');
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // STT states
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const sampleKeys = ['dashboard.welcome', 'common.save', 'common.cancel', 'navigation.home', 'settings.title'];

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(search.toLowerCase()) ||
    lang.locale.toLowerCase().includes(search.toLowerCase()) ||
    lang.native_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getLocaleFlag = (locale: string) => {
    const flags: Record<string, string> = {
      'es': '🇪🇸', 'en': '🇬🇧', 'en-US': '🇺🇸', 'fr': '🇫🇷', 'de': '🇩🇪', 
      'it': '🇮🇹', 'pt': '🇵🇹', 'pt-BR': '🇧🇷', 'zh': '🇨🇳', 'zh-CN': '🇨🇳',
      'ja': '🇯🇵', 'ko': '🇰🇷', 'ar': '🇸🇦', 'ru': '🇷🇺', 'nl': '🇳🇱', 'pl': '🇵🇱',
      'ca': '🏳️', 'eu': '🏳️', 'gl': '🏳️', 'sv': '🇸🇪', 'da': '🇩🇰', 'no': '🇳🇴',
      'fi': '🇫🇮', 'el': '🇬🇷', 'tr': '🇹🇷', 'uk': '🇺🇦', 'he': '🇮🇱', 'th': '🇹🇭',
      'vi': '🇻🇳', 'id': '🇮🇩', 'ms': '🇲🇾', 'hi': '🇮🇳', 'bn': '🇧🇩', 'ta': '🇮🇳',
      'cs': '🇨🇿', 'ro': '🇷🇴', 'hu': '🇭🇺', 'sk': '🇸🇰', 'bg': '🇧🇬', 'hr': '🇭🇷',
      'sl': '🇸🇮', 'sr': '🇷🇸', 'lt': '🇱🇹', 'lv': '🇱🇻', 'et': '🇪🇪'
    };
    return flags[locale] || '🌐';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'text-green-500';
    if (progress >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const loadPreview = async (locale: string) => {
    setLoadingPreview(true);
    try {
      const { data } = await supabase
        .from('cms_translations')
        .select('translation_key, value')
        .eq('locale', locale)
        .in('translation_key', sampleKeys);

      const texts: Record<string, string> = {};
      data?.forEach(t => { texts[t.translation_key] = t.value; });
      setPreviewTexts(texts);
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  // Set sample text when locale changes
  useEffect(() => {
    if (selectedLocale) {
      loadPreview(selectedLocale);
      setTtsText(SAMPLE_TEXTS[selectedLocale] || SAMPLE_TEXTS.en);
      setTranscribedText('');
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
    }
  }, [selectedLocale]);

  const handleSelectLanguage = async (locale: string) => {
    setSelectedLocale(locale as Language);
    setDownloading(true);
    try {
      setLanguage(locale as Language);
      onLanguageChange?.(locale);
      toast.success(`Idioma cambiado a ${languages.find(l => l.locale === locale)?.name || locale}`);
    } catch (error) {
      console.error('Error changing language:', error);
      toast.error('Error al cambiar el idioma');
    } finally {
      setDownloading(false);
    }
  };

  // === TTS: Text to Speech ===
  const handleGenerateTTS = async () => {
    if (!ttsText.trim()) {
      toast.error('Escribe un texto para convertir a voz');
      return;
    }

    setIsGeneratingTTS(true);
    try {
      const voiceConfig = VOICE_MAP[selectedLocale] || VOICE_MAP.default;
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/erp-voice-tts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            text: ttsText,
            language: selectedLocale,
            voiceId: voiceConfig.voiceId,
            speechRate: 1.0
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      // Convert base64 to blob and create URL
      const audioBlob = base64ToBlob(data.audioContent, 'audio/mpeg');
      const url = URL.createObjectURL(audioBlob);
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(url);
      
      toast.success(`Audio generado en ${languages.find(l => l.locale === selectedLocale)?.name || selectedLocale}`);
    } catch (error) {
      console.error('TTS Error:', error);
      toast.error('Error al generar audio');
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const handlePlayAudio = () => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
        setIsPlayingAudio(false);
      } else {
        audioRef.current.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const handleDownloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `audio-${selectedLocale}-${Date.now()}.mp3`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Audio descargado');
    }
  };

  // === STT: Speech to Text ===
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast.info(`Grabando en ${languages.find(l => l.locale === selectedLocale)?.name || selectedLocale}...`);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) {
      toast.error('No se grabó audio');
      return;
    }

    setIsTranscribing(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert blob to base64
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });

      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { 
          audio: base64Audio,
          language: selectedLocale
        }
      });

      if (error) throw error;

      if (data?.text) {
        setTranscribedText(data.text);
        toast.success('Audio transcrito correctamente');
      } else {
        toast.warning('No se pudo transcribir el audio');
      }
    } catch (error) {
      console.error('STT Error:', error);
      toast.error('Error al transcribir audio');
    } finally {
      setIsTranscribing(false);
    }
  };

  const popularLanguages = languages.filter(l => ['es', 'en', 'fr', 'de', 'it', 'pt', 'zh', 'ja'].includes(l.locale));

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-primary/10 rounded-xl">
              <Languages className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Paquete de Idiomas</h2>
              <p className="text-muted-foreground">Selecciona tu idioma preferido. Escucha y habla en +65 idiomas.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="select" className="space-y-4">
        <TabsList>
          <TabsTrigger value="select">Seleccionar Idioma</TabsTrigger>
          <TabsTrigger value="voice">🎙️ Voz</TabsTrigger>
          <TabsTrigger value="all">Todos ({languages.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="select">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Check className="h-5 w-5 text-green-500" />Idioma Actual</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                  <span className="text-4xl">{getLocaleFlag(selectedLocale)}</span>
                  <div className="flex-1">
                    <p className="font-bold text-lg">{languages.find(l => l.locale === selectedLocale)?.name || selectedLocale}</p>
                    <p className="text-sm text-muted-foreground">{languages.find(l => l.locale === selectedLocale)?.native_name}</p>
                  </div>
                  <Badge variant="default" className="bg-green-500"><Check className="h-3 w-3 mr-1" />Activo</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" />Idiomas Populares</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {popularLanguages.map((lang) => (
                    <button key={lang.locale} onClick={() => handleSelectLanguage(lang.locale)} disabled={downloading}
                      className={`p-4 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5 ${selectedLocale === lang.locale ? 'border-primary bg-primary/10' : 'border-border'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getLocaleFlag(lang.locale)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{lang.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={lang.translation_progress || 0} className="h-1 flex-1" />
                            <span className={`text-xs ${getProgressColor(lang.translation_progress || 0)}`}>{lang.translation_progress || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-blue-500/20 bg-blue-500/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Sparkles className="h-6 w-6 text-blue-500 mt-1" />
                  <div>
                    <p className="font-medium">Traducciones con Inteligencia Artificial</p>
                    <p className="text-sm text-muted-foreground mt-1">Las traducciones son generadas automáticamente con IA y revisadas por nuestro equipo.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="voice">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Text to Speech */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Escuchar (Text to Speech)
                </CardTitle>
                <CardDescription>
                  Convierte texto a voz en {languages.find(l => l.locale === selectedLocale)?.name || selectedLocale}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="text-2xl">{getLocaleFlag(selectedLocale)}</span>
                  <div>
                    <p className="font-medium">{languages.find(l => l.locale === selectedLocale)?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Voz: {(VOICE_MAP[selectedLocale] || VOICE_MAP.default).name}
                    </p>
                  </div>
                </div>

                <Textarea
                  placeholder={`Escribe texto en ${languages.find(l => l.locale === selectedLocale)?.name || 'el idioma seleccionado'}...`}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  rows={4}
                  className="resize-none"
                />

                <div className="flex gap-2">
                  <Button 
                    onClick={handleGenerateTTS} 
                    disabled={isGeneratingTTS || !ttsText.trim()}
                    className="flex-1"
                  >
                    {isGeneratingTTS ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</>
                    ) : (
                      <><Volume2 className="h-4 w-4 mr-2" />Generar Audio</>
                    )}
                  </Button>
                </div>

                {audioUrl && (
                  <div className="space-y-3 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <audio 
                      ref={audioRef} 
                      src={audioUrl} 
                      onEnded={() => setIsPlayingAudio(false)}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={handlePlayAudio}>
                        {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDownloadAudio}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground flex-1">
                        Audio generado en {languages.find(l => l.locale === selectedLocale)?.name}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Speech to Text */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" />
                  Hablar (Speech to Text)
                </CardTitle>
                <CardDescription>
                  Graba tu voz y transcríbela en {languages.find(l => l.locale === selectedLocale)?.name || selectedLocale}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="text-2xl">{getLocaleFlag(selectedLocale)}</span>
                  <div>
                    <p className="font-medium">{languages.find(l => l.locale === selectedLocale)?.name}</p>
                    <p className="text-xs text-muted-foreground">Transcripción multilingüe con IA</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-4 p-6 border-2 border-dashed rounded-lg">
                  {isRecording ? (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                        <Button 
                          size="lg" 
                          variant="destructive"
                          className="relative rounded-full h-20 w-20"
                          onClick={stopRecording}
                        >
                          <Square className="h-8 w-8" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground animate-pulse">
                        Grabando... Haz clic para detener
                      </p>
                    </>
                  ) : isTranscribing ? (
                    <>
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Transcribiendo audio...</p>
                    </>
                  ) : (
                    <>
                      <Button 
                        size="lg" 
                        className="rounded-full h-20 w-20"
                        onClick={startRecording}
                      >
                        <Mic className="h-8 w-8" />
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Haz clic para grabar en {languages.find(l => l.locale === selectedLocale)?.name}
                      </p>
                    </>
                  )}
                </div>

                {transcribedText && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Texto transcrito:</label>
                    <div className="p-4 bg-muted/50 rounded-lg border">
                      <p className="text-sm">{transcribedText}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(transcribedText);
                        toast.success('Texto copiado al portapapeles');
                      }}
                    >
                      Copiar texto
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6 border-amber-500/20 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-6 w-6 text-amber-500 mt-1" />
                <div>
                  <p className="font-medium">Soporte Multilingüe Avanzado</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    La síntesis de voz utiliza ElevenLabs con el modelo multilingüe v2 que soporta +29 idiomas nativamente.
                    La transcripción usa IA avanzada para reconocer automáticamente el idioma hablado.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-base">Todos los Idiomas</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Buscar idioma..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredLanguages.map((lang) => (
                    <button key={lang.locale} onClick={() => handleSelectLanguage(lang.locale)} disabled={downloading}
                      className={`p-4 rounded-lg border text-left transition-all hover:border-primary hover:bg-primary/5 ${selectedLocale === lang.locale ? 'border-primary bg-primary/10' : 'border-border'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getLocaleFlag(lang.locale)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">{lang.name}</p>
                            {selectedLocale === lang.locale && <Check className="h-4 w-4 text-green-500 flex-shrink-0" />}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{lang.native_name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Progress value={lang.translation_progress || 0} className="h-1.5 flex-1" />
                            <span className={`text-xs font-medium ${getProgressColor(lang.translation_progress || 0)}`}>{lang.translation_progress || 0}%</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
