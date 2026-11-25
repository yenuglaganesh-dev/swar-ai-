import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Settings,
  Trash2,
  Volume2,
  RotateCcw,
  User,
  Home,
  AlertTriangle,
  MicOff,
  Camera,
  FileUp,
  X,
  LayoutDashboard,
  Maximize2,
  Minimize2,
  ShieldAlert,
  CloudSun,
  Newspaper,
  Brain,
  GraduationCap,
  Languages,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageShell from '@/components/Layout/PageShell';
import LanguageSelector from '@/components/Layout/LanguageSelector';
import AssistantOrb from '@/components/VoiceAssistant/AssistantOrb';
import MicrophoneButton from '@/components/VoiceAssistant/MicrophoneButton';
import ConversationPanel from '@/components/VoiceAssistant/ConversationPanel';
import AssistantStatusBar from '@/components/VoiceAssistant/AssistantStatusBar';
import { useLanguage } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import DisplaySettingsPanel from '@/components/Settings/DisplaySettingsPanel';
import { AssistantStatus, ChatMessage, LanguageCode } from '@/types';
import { createRecognition, isSpeechRecognitionSupported } from '@/services/speechRecognition';
import { isSpeechSynthesisSupported, speakText, stopSpeaking } from '@/services/speechSynthesis';
import { sendChatMessage, fetchWeather, fetchNews, type WeatherData, type NewsArticle, type ApiResult } from '@/services/aiAssistant';
import { safeStorage, safeJsonParse } from '@/services/safeStorage';
import { detectLanguageFromText } from '@/services/languageDetection';
import { addMemory, createConversation, getProfile, listMemories, logUsage, saveMessage, upsertProfile } from '@/services/dataStore';
import { isSupabaseConfigured } from '@/services/supabase';

const HISTORY_KEY = 'swar_history';
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const loadHistory = (): ChatMessage[] => safeJsonParse<ChatMessage[]>(safeStorage.getItem(HISTORY_KEY), []);

export default function AssistantPage() {
  const { t, language, setLanguage } = useLanguage();
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();

  const [status, setStatus] = useState<AssistantStatus>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>(() => (settings.saveHistory ? loadHistory() : []));
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [mode, setMode] = useState<'default' | 'tutor' | 'simple' | 'translate' | 'emergency'>('default');
  const [continuous, setContinuous] = useState(settings.continuousMode);
  const [docText, setDocText] = useState('');
  const [docName, setDocName] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [memories, setMemories] = useState<string[]>([]);
  const [memoryCandidate, setMemoryCandidate] = useState<string | null>(null);
  const [weatherResult, setWeatherResult] = useState<ApiResult<WeatherData> | null>(null);
  const [newsResult, setNewsResult] = useState<ApiResult<{ source: string; query: string; articles: NewsArticle[] }> | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [locationHint, setLocationHint] = useState(safeStorage.getItem('swar_location') || 'Hyderabad');

  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const resizingRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const statusRef = useRef(status);
  statusRef.current = status;
  const lastSpokenRef = useRef('');
  const convoIdRef = useRef<string | null>(null);
  const continuousRef = useRef(continuous);
  continuousRef.current = continuous;
  const pendingListenRef = useRef(false);

  const speechRecSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  useEffect(() => {
    setContinuous(settings.continuousMode);
  }, [settings.continuousMode]);

  useEffect(() => {
    if (settings.saveHistory) {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-50)));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [messages, settings.saveHistory]);

  useEffect(() => {
    if (!settings.saveHistory) safeStorage.removeItem(HISTORY_KEY);
  }, [settings.saveHistory]);

  useEffect(() => {
    document.documentElement.dataset.theme = 'dark';
  }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (isSupabaseConfigured()) {
        const p = await getProfile(user.uid);
        if (p) {
          updateSettings({
            preferredLanguage: p.preferred_language || settings.preferredLanguage,
            autoDetectLanguage: !!p.auto_detect_language,
            speechRate: Number(p.speech_rate || 1),
            easyMode: !!p.easy_mode,
            memoryConsent: !!p.memory_consent,
            saveHistory: p.save_history !== false,
          });
        }
      }
      if (settings.memoryConsent) {
        const mems = await listMemories(user.uid);
        setMemories(mems.map((m) => m.content));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const persistProfile = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) return;
    await upsertProfile(user.uid, {
      email: user.email,
      phone: user.phoneNumber,
      name: user.name,
      preferred_language: settings.preferredLanguage,
      auto_detect_language: settings.autoDetectLanguage,
      speech_rate: settings.speechRate,
      easy_mode: settings.easyMode,
      memory_consent: settings.memoryConsent,
      save_history: settings.saveHistory,
      save_audio: settings.saveAudio,
    });
  }, [user, settings]);

  useEffect(() => {
    persistProfile();
  }, [persistProfile]);

  const cleanupAudio = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setAnalyser(null);
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    setCameraOpen(false);
  }, []);

  useEffect(() => () => {
    cleanupAudio();
    stopSpeaking();
    recognitionRef.current?.abort();
  }, [cleanupAudio]);

  const ensureConversation = useCallback(async () => {
    if (convoIdRef.current || !user || !isSupabaseConfigured() || !settings.saveHistory) {
      return convoIdRef.current;
    }
    const id = await createConversation(user.uid, language);
    convoIdRef.current = id;
    return id;
  }, [user, language, settings.saveHistory]);

  const speak = useCallback(
    async (text: string, lang: LanguageCode) => {
      if (!text) return;
      lastSpokenRef.current = text;
      if (!ttsSupported) {
        if (continuousRef.current) pendingListenRef.current = true;
        return;
      }
      setStatus('speaking');
      await speakText(text, {
        lang,
        rate: settings.speechRate,
        voicePreference: settings.voicePreference,
        onStart: () => setStatus('speaking'),
        onEnd: () => {
          setStatus('idle');
          if (continuousRef.current) pendingListenRef.current = true;
        },
        onError: () => {
          setStatus('idle');
          if (continuousRef.current) pendingListenRef.current = true;
        },
      });
    },
    [settings.speechRate, settings.voicePreference, ttsSupported],
  );

  useEffect(() => {
    if (!pendingListenRef.current || status !== 'idle') return;
    pendingListenRef.current = false;
    const timer = setTimeout(() => {
      if (continuousRef.current && statusRef.current === 'idle') {
        startListeningRef.current();
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [status]);

  const greetedRef = useRef(false);
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    if (messagesRef.current.length === 0) {
      const suggestions =
        language === 'te-IN'
          ? ['ఈరోజు వాతావరణం?', 'నాకు ఇంగ్లీష్ నేర్పించు', 'కంప్యూటర్ అంటే ఏమిటి?']
          : language === 'hi-IN'
            ? ['आज मौसम कैसा है?', 'मुझे अंग्रेज़ी सिखाओ', 'कंप्यूटर क्या है?']
            : ['What can you do?', 'Teach me something new', 'Help me with technology'];
      const greeting: ChatMessage = {
        id: uid(),
        role: 'assistant',
        content: t('assistantGreeting'),
        language,
        timestamp: Date.now(),
        suggestions,
      };
      setMessages([greeting]);
      setTimeout(() => {
        speak(greeting.content, language).catch(() => {});
      }, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(
    async (text: string, overrideMode?: typeof mode) => {
      const trimmed = text.trim();
      if (!trimmed || statusRef.current === 'processing') return;
      setError(null);
      stopSpeaking();
      recognitionRef.current?.abort();
      cleanupAudio();

      const activeMode = overrideMode || mode;
      const userLang = settings.autoDetectLanguage ? detectLanguageFromText(trimmed) || language : language;
      const userMsg: ChatMessage = {
        id: uid(),
        role: 'user',
        content: trimmed,
        language: userLang,
        timestamp: Date.now(),
      };
      const nextMessages = [...messagesRef.current, userMsg];
      setMessages(nextMessages);
      setInput('');
      setStatus('processing');
      await logUsage(user?.uid || null, 'message_sent', { mode: activeMode, voice: false });

      try {
        const convoId = await ensureConversation();
        if (user && convoId && settings.saveHistory) {
          await saveMessage(user.uid, convoId, userMsg).catch((e) => console.warn('Save user msg failed', e));
        }

        const res = await sendChatMessage({
          messages: nextMessages,
          language: userLang,
          autoDetect: settings.autoDetectLanguage,
          mode: activeMode,
          memories: settings.memoryConsent ? memories : [],
          documentText: docText,
          imageDataUrl,
          locationHint,
        });

        const replyLang = (res.detectedLanguage || userLang) as LanguageCode;
        if (settings.autoDetectLanguage && replyLang !== language) {
          setLanguage(replyLang);
          updateSettings({ preferredLanguage: replyLang });
        }

        const assistantMsg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content: res.reply,
          language: replyLang,
          timestamp: Date.now(),
          suggestions: res.suggestions,
          error: Boolean(res.error),
        };
        setMessages((prev) => [...prev, assistantMsg]);

        if (user && convoId && settings.saveHistory) {
          await saveMessage(user.uid, convoId, assistantMsg).catch((e) => console.warn('Save assistant msg failed', e));
        }

        if (res.error) {
          const details = [res.error];
          if ((res as any).providerStatus) details.push(`status ${(res as any).providerStatus}`);
          if ((res as any).providerCode) details.push(`code ${(res as any).providerCode}`);
          if ((res as any).providerMessage) details.push(String((res as any).providerMessage));
          const reason =
            res.error === 'AI_NOT_CONFIGURED'
              ? 'Missing GEMINI_API_KEY on backend'
              : res.error === 'AI_AUTH_ERROR'
                ? 'AI authentication/permission error'
                : res.error === 'AI_RATE_LIMITED'
                  ? 'AI rate limit/quota error'
                  : res.error === 'AI_MODEL_OR_ENDPOINT_ERROR'
                    ? 'AI model or endpoint error'
                    : res.error === 'AI_BAD_REQUEST'
                      ? 'AI bad request'
                      : res.error === 'AI_UPSTREAM_ERROR'
                        ? 'AI provider error'
                        : res.error;
          setError(`${t('aiError')} (${reason}: ${details.filter(Boolean).join(' | ')})`);
        }

        if (settings.memoryConsent && res.memoryCandidate) {
          setMemoryCandidate(res.memoryCandidate);
        }
        await logUsage(user?.uid || null, 'assistant_reply', { mode: activeMode }).catch(() => {});

        if (res.reply) {
          try {
            await speak(res.reply, replyLang);
          } catch (e) {
            console.warn('TTS failed', e);
            setStatus('idle');
          }
        } else {
          setStatus('idle');
        }
      } catch (e) {
        console.error('Chat send failed', e);
        const msg = e instanceof Error ? e.message : String(e);
        setStatus('error');
        setError(`${t('aiError')} (${msg})`);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content: t('aiError'),
            language,
            timestamp: Date.now(),
            error: true,
            suggestions: [t('retry')],
          },
        ]);
      }
    },
    [
      mode,
      settings,
      language,
      memories,
      docText,
      imageDataUrl,
      locationHint,
      user,
      ensureConversation,
      setLanguage,
      updateSettings,
      speak,
      cleanupAudio,
      t,
    ],
  );

  const startListening = useCallback(async () => {
    setError(null);
    stopSpeaking();
    if (!speechRecSupported) {
      setError(t('micNotSupported'));
      return;
    }
    try {
      const rec = createRecognition(
        language,
        {
          onStart: () => setStatus('listening'),
          onEnd: () => {
            cleanupAudio();
            if (statusRef.current === 'listening') setStatus('idle');
          },
          onResult: (transcript, isFinal) => {
            setInput(transcript);
            if (isFinal && transcript.trim()) {
              recognitionRef.current?.stop();
              cleanupAudio();
              handleSend(transcript);
            }
          },
          onError: (err) => {
            cleanupAudio();
            if (err === 'not-allowed' || err === 'service-not-allowed') {
              setError(t('micPermissionDenied'));
            } else if (err !== 'aborted' && err !== 'no-speech') {
              setError(t('error'));
            }
            setStatus('idle');
          },
        },
        continuous,
      );
      recognitionRef.current = rec;
      rec?.start();
      await logUsage(user?.uid || null, 'voice_start');
    } catch {
      setError(t('micPermissionDenied'));
      setStatus('idle');
    }
  }, [language, speechRecSupported, handleSend, cleanupAudio, continuous, t, user]);

  const startListeningRef = useRef(startListening);
  startListeningRef.current = startListening;

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    cleanupAudio();
    setStatus('idle');
  }, [cleanupAudio]);

  const onMicClick = () => {
    if (status === 'listening') {
      stopListening();
    } else if (status === 'speaking') {
      stopSpeaking();
      setStatus('idle');
      if (continuousRef.current) setTimeout(() => startListening(), 200);
    } else if (status !== 'processing') {
      startListening();
    }
  };

  const onRepeat = (text?: string) => {
    const toSpeak =
      text || lastSpokenRef.current || [...messagesRef.current].reverse().find((m) => m.role === 'assistant')?.content;
    if (toSpeak) speak(toSpeak, language);
  };

  const onSimplify = (text: string) => handleSend(`${t('explainSimply')}: ${text}`, 'simple');

  const clearHistory = () => {
    stopSpeaking();
    setMessages([]);
    safeStorage.removeItem(HISTORY_KEY);
    setStatus('idle');
    convoIdRef.current = null;
    greetedRef.current = false;
    setTimeout(() => {
      greetedRef.current = true;
      setMessages([
        {
          id: uid(),
          role: 'assistant',
          content: t('assistantGreeting'),
          language,
          timestamp: Date.now(),
        },
      ]);
    }, 0);
  };

  const handleDocUpload = async (file: File) => {
    const name = file.name.toLowerCase();
    if (name.match(/\.(txt|md|csv|json|js|ts|tsx|py|html|css)$/)) {
      const text = await file.text();
      setDocText(text.slice(0, 12000));
      setDocName(file.name);
    } else {
      setError('Document text extraction is supported for text files (.txt, .md, .csv, .json, code).');
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    setImageDataUrl(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
  };

  const doWeather = async (askAssistant = true) => {
    setWeatherLoading(true);
    setError(null);
    const r = await fetchWeather(locationHint || 'Hyderabad');
    setWeatherResult(r);
    setWeatherLoading(false);
    if (askAssistant) {
      if (r.ok && r.data) handleSend(`${t('weather')} in ${locationHint || 'Hyderabad'}`);
      else setError(r.message || t('weatherError'));
    }
    return r;
  };

  const doNews = async (query?: string, askAssistant = true) => {
    const q = (query || locationHint || 'technology').trim();
    setNewsLoading(true);
    setError(null);
    const r = await fetchNews(q);
    setNewsResult(r);
    setNewsLoading(false);
    if (askAssistant) {
      if (r.ok && r.data?.articles?.length) handleSend(`${t('news')} about ${q}`);
      else setError(r.message || t('newsError'));
    }
    return r;
  };

  const onChatResizeStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (settings.chatFullscreen) return;
    const el = chatPanelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scale = settings.displayScale || 1;
    resizingRef.current = { x: e.clientX, y: e.clientY, w: rect.width / scale, h: rect.height / scale };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onChatResizeMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const start = resizingRef.current;
    if (!start) return;
    const scale = settings.displayScale || 1;
    const dw = (e.clientX - start.x) / scale;
    const dh = (e.clientY - start.y) / scale;
    updateSettings({
      chatPanelWidth: Math.min(1200, Math.max(320, Math.round(start.w + dw))),
      chatPanelHeight: Math.min(1200, Math.max(420, Math.round(start.h + dh))),
    });
  };

  const onChatResizeEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    resizingRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const saveMemoryCandidate = async () => {
    if (!memoryCandidate || !user) {
      setMemoryCandidate(null);
      return;
    }
    await addMemory(user.uid, memoryCandidate);
    setMemories((prev) => [memoryCandidate, ...prev].slice(0, 50));
    setMemoryCandidate(null);
  };

  const settingsToggles = [
    {
      label: t('autoDetectLanguage'),
      value: settings.autoDetectLanguage,
      onToggle: () => updateSettings({ autoDetectLanguage: !settings.autoDetectLanguage }),
    },
    {
      label: t('easyMode'),
      value: settings.easyMode,
      onToggle: () => updateSettings({ easyMode: !settings.easyMode }),
    },
    {
      label: t('continuousMode'),
      value: continuous,
      onToggle: () => {
        const next = !continuous;
        setContinuous(next);
        updateSettings({ continuousMode: next });
      },
    },
    {
      label: t('saveHistory'),
      value: settings.saveHistory,
      onToggle: () => updateSettings({ saveHistory: !settings.saveHistory }),
    },
    {
      label: t('memoryConsent'),
      value: settings.memoryConsent,
      onToggle: () => updateSettings({ memoryConsent: !settings.memoryConsent }),
    },
    {
      label: t('saveAudio'),
      value: settings.saveAudio,
      onToggle: () => updateSettings({ saveAudio: !settings.saveAudio }),
    },
  ];

  return (
    <PageShell className="assistant-page">
      <div className="assistant-shell">
        <header className="assistant-top glass">
          <div className="top-left">
            <Link to="/" className="btn btn-ghost btn-icon top-icon-btn" aria-label={t('navHome')} title={t('navHome')}>
              <Home size={18} />
            </Link>
            <div className="assistant-brand">
              <span className="brand-name">{t('appName')}</span>
              <AssistantStatusBar status={status} />
            </div>
          </div>

          <div className="top-right">
            <LanguageSelector compact />
            <button
              type="button"
              className={`btn btn-secondary btn-icon top-icon-btn ${continuous ? 'active-toggle' : ''}`}
              onClick={() => {
                const v = !continuous;
                setContinuous(v);
                updateSettings({ continuousMode: v });
              }}
              title={t('continuousMode')}
              aria-label={t('continuousMode')}
            >
              <RotateCcw size={17} />
            </button>
            <Link
              to="/dashboard"
              className="btn btn-secondary btn-icon top-icon-btn"
              aria-label={t('dashboard')}
              title={t('dashboard')}
            >
              <LayoutDashboard size={17} />
            </Link>
            <button
              type="button"
              className={`btn btn-secondary btn-icon top-icon-btn ${settings.chatFullscreen ? 'active-toggle' : ''}`}
              onClick={() => updateSettings({ chatFullscreen: !settings.chatFullscreen })}
              aria-label={settings.chatFullscreen ? t('restoreChat') : t('fullscreenChat')}
              title={settings.chatFullscreen ? t('restoreChat') : t('fullscreenChat')}
            >
              {settings.chatFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-icon top-icon-btn"
              onClick={() => setShowSettings(true)}
              aria-label={t('settings')}
              title={t('settings')}
            >
              <Settings size={17} />
            </button>
            <Link
              to={user ? '/profile' : '/auth'}
              className="btn btn-secondary btn-icon top-icon-btn"
              aria-label={user ? t('navProfile') : t('navSignIn')}
              title={user ? t('navProfile') : t('navSignIn')}
            >
              <User size={17} />
            </Link>
          </div>
        </header>

        <main className={`assistant-main ${settings.easyMode ? 'easy' : ''} ${settings.chatFullscreen ? 'chat-fullscreen' : ''}`}>
          <section className="assistant-center" aria-label={t('assistantTitle')}>
            <div className="assistant-mascot-stage">
              <div className="assistant-mascot-glow" aria-hidden />
              <AssistantOrb status={status} analyser={analyser} />
            </div>

            <p className="assistant-intro">{t('assistantIntro')}</p>

            <div className="quick-actions">
              <button
                type="button"
                className={`chip ${mode === 'tutor' ? 'active-chip' : ''}`}
                onClick={() => setMode(mode === 'tutor' ? 'default' : 'tutor')}
              >
                <GraduationCap size={14} />
                {t('tutorMode')}
              </button>
              <button
                type="button"
                className={`chip ${mode === 'translate' ? 'active-chip' : ''}`}
                onClick={() => setMode(mode === 'translate' ? 'default' : 'translate')}
              >
                <Languages size={14} />
                {t('translateMode')}
              </button>
              <button
                type="button"
                className={`chip ${mode === 'emergency' ? 'active-chip' : ''}`}
                onClick={() => setMode(mode === 'emergency' ? 'default' : 'emergency')}
              >
                <ShieldAlert size={14} />
                {t('emergency')}
              </button>
            </div>

            {(weatherLoading || weatherResult || newsLoading || newsResult) && (
              <div className="live-data-grid" aria-live="polite">
                <div className="live-card">
                  <div className="live-card-head">
                    <CloudSun size={16} />
                    <strong>{t('weather')}</strong>
                  </div>
                  {weatherLoading && <p className="muted">{t('weatherLoading')}</p>}
                  {!weatherLoading && weatherResult?.ok && weatherResult.data && (
                    <div className="live-body">
                      <div>
                        <strong>
                          {weatherResult.data.location}
                          {weatherResult.data.country ? `, ${weatherResult.data.country}` : ''}
                        </strong>
                      </div>
                      <div>
                        {t('temperature')}:{' '}
                        {weatherResult.data.tempC != null ? `${Math.round(weatherResult.data.tempC)}°C` : '—'}{' '}
                        {weatherResult.data.feelsLikeC != null
                          ? `(${t('feelsLike')} ${Math.round(weatherResult.data.feelsLikeC)}°C)`
                          : ''}
                      </div>
                      <div>
                        {t('conditions')}: {weatherResult.data.conditions || '—'}
                      </div>
                      <div>
                        {t('humidity')}: {weatherResult.data.humidity != null ? `${weatherResult.data.humidity}%` : '—'} |{' '}
                        {t('windSpeed')}:{' '}
                        {weatherResult.data.windSpeedMps != null ? `${weatherResult.data.windSpeedMps} m/s` : '—'}
                      </div>
                      <div className="muted small">
                        {t('source')}: {weatherResult.data.source}. {t('weatherApiPlanNote')}
                      </div>
                    </div>
                  )}
                  {!weatherLoading && weatherResult && !weatherResult.ok && (
                    <div className="live-body">
                      <div className="live-error">{weatherResult.message || t('weatherError')}</div>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => doWeather(false)}>
                        {t('retry')}
                      </button>
                    </div>
                  )}
                </div>

                <div className="live-card">
                  <div className="live-card-head">
                    <Newspaper size={16} />
                    <strong>{t('news')}</strong>
                  </div>
                  {newsLoading && <p className="muted">{t('newsLoading')}</p>}
                  {!newsLoading && newsResult?.ok && newsResult.data && (
                    <div className="live-body">
                      {newsResult.data.articles.length ? (
                        newsResult.data.articles.map((a, i) => (
                          <article key={a.url + i} className="news-item">
                            <a href={a.url} target="_blank" rel="noreferrer" className="news-title">
                              {a.title}
                            </a>
                            <div className="muted small">
                              {a.source}
                              {a.publishedAt ? ` • ${new Date(a.publishedAt).toLocaleString()}` : ''}
                            </div>
                          </article>
                        ))
                      ) : (
                        <div className="muted">{t('noNewsFound')}</div>
                      )}
                      <div className="muted small">
                        {t('source')}: {newsResult.data.source}. {t('newsApiPlanNote')}
                      </div>
                    </div>
                  )}
                  {!newsLoading && newsResult && !newsResult.ok && (
                    <div className="live-body">
                      <div className="live-error">{newsResult.message || t('newsError')}</div>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => doNews(undefined, false)}>
                        {t('retry')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!ttsSupported && (
              <div className="notice">
                <AlertTriangle size={16} />
                {t('ttsNotSupported')}
              </div>
            )}
          </section>

          <section
            className={`assistant-chat glass ${settings.chatPanelMode} ${settings.chatFullscreen ? 'fullscreen' : ''}`}
            ref={chatPanelRef}
            style={
              settings.chatFullscreen
                ? undefined
                : {
                    width: `min(100%, ${settings.chatPanelWidth}px)`,
                    height: `min(calc(100vh - 124px), ${settings.chatPanelHeight}px)`,
                  }
            }
          >
            <div className="chat-panel-head">
              <div className="chat-panel-title">{t('assistant')}</div>
              <div className="chat-panel-actions">
                <button
                  type="button"
                  className={`btn btn-ghost btn-sm ${settings.chatPanelMode === 'compact' ? 'active-chip' : ''}`}
                  onClick={() =>
                    updateSettings({
                      chatPanelMode: settings.chatPanelMode === 'compact' ? 'comfortable' : 'compact',
                    })
                  }
                  aria-label={settings.chatPanelMode === 'compact' ? t('comfortableMode') : t('compactMode')}
                >
                  {settings.chatPanelMode === 'compact' ? t('comfortableMode') : t('compactMode')}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => updateSettings({ chatFullscreen: !settings.chatFullscreen })}
                  aria-label={settings.chatFullscreen ? t('restoreChat') : t('fullscreenChat')}
                >
                  {settings.chatFullscreen ? t('restoreChat') : t('fullscreenChat')}
                </button>
              </div>
            </div>

            <ConversationPanel
              messages={messages}
              onSuggestion={(s) => handleSend(s)}
              onRepeat={(text) => onRepeat(text)}
              onSimplify={onSimplify}
            />

            {error && (
              <div className="chat-error" role="alert">
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {memoryCandidate && settings.memoryConsent && (
              <div className="chat-banner-memory">
                <Brain size={16} />
                <span>
                  {t('memoryConsentAsk')} "{memoryCandidate}"
                </span>
                <div className="chat-banner-actions">
                  <button type="button" className="btn btn-sm btn-primary" onClick={saveMemoryCandidate}>
                    {t('save')}
                  </button>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setMemoryCandidate(null)}>
                    {t('close')}
                  </button>
                </div>
              </div>
            )}

            <div className="chat-controls">
              <div className="tool-row">
                <label className="btn btn-secondary btn-sm tool-pill">
                  <FileUp size={15} />
                  <span>{docName || t('uploadDocument')}</span>
                  <input
                    type="file"
                    hidden
                    accept=".txt,.md,.csv,.json,.js,.ts,.tsx,.py,.html,.css"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDocUpload(f);
                      e.currentTarget.value = '';
                    }}
                  />
                </label>
                {docName && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm tool-pill"
                    onClick={() => {
                      setDocText('');
                      setDocName('');
                    }}
                    title={t('close')}
                    aria-label={t('close')}
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm tool-pill"
                  onClick={() => doWeather(true)}
                  disabled={weatherLoading}
                >
                  <CloudSun size={15} />
                  <span>{weatherLoading ? t('loading') : t('weather')}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm tool-pill"
                  onClick={() => doNews(undefined, true)}
                  disabled={newsLoading}
                >
                  <Newspaper size={15} />
                  <span>{newsLoading ? t('loading') : t('news')}</span>
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm tool-pill"
                  onClick={() => {
                    stopSpeaking();
                    setStatus('idle');
                  }}
                >
                  <MicOff size={15} />
                  <span>{t('stopSpeaking')}</span>
                </button>
              </div>

              <form
                className="input-row"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
              >
                <button
                  type="button"
                  className="btn btn-secondary btn-icon composer-btn"
                  onClick={() => onRepeat()}
                  aria-label={t('speakAgain')}
                  title={t('speakAgain')}
                >
                  <Volume2 size={17} />
                </button>
                <textarea
                  className="chat-input chat-textarea"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('typeMessage')}
                  aria-label={t('typeMessage')}
                  disabled={status === 'processing'}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(input);
                    }
                  }}
                />
                <div className="composer-right">
                  <MicrophoneButton status={status} onClick={onMicClick} disabled={status === 'processing'} compact />
                  <button
                    type="submit"
                    className="btn btn-primary btn-icon composer-btn"
                    aria-label={t('send')}
                    title={t('send')}
                    disabled={!input.trim() || status === 'processing'}
                  >
                    <Send size={17} />
                  </button>
                </div>
              </form>

              {!speechRecSupported && <p className="support-note">{t('micNotSupported')}</p>}
            </div>

            {!settings.chatFullscreen && (
              <button
                type="button"
                className="chat-resize-handle"
                aria-label={t('chatPanelSize')}
                title={t('chatPanelSize')}
                onPointerDown={onChatResizeStart}
                onPointerMove={onChatResizeMove}
                onPointerUp={onChatResizeEnd}
                onPointerCancel={onChatResizeEnd}
                onKeyDown={(e) => {
                  const step = e.shiftKey ? 40 : 20;
                  if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    updateSettings({ chatPanelWidth: Math.min(1200, settings.chatPanelWidth + step) });
                  }
                  if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    updateSettings({ chatPanelWidth: Math.max(320, settings.chatPanelWidth - step) });
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    updateSettings({ chatPanelHeight: Math.min(1200, settings.chatPanelHeight + step) });
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    updateSettings({ chatPanelHeight: Math.max(420, settings.chatPanelHeight - step) });
                  }
                }}
              />
            )}
          </section>
        </main>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              className="settings-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                className="settings-panel glass"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="settings-head">
                  <h2>{t('settings')}</h2>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowSettings(false)}>
                    {t('close')}
                  </button>
                </div>

                <div className="settings-body">
                  <DisplaySettingsPanel />

                  {settingsToggles.map((item) => (
                    <div className="setting-row" key={item.label}>
                      <div>
                        <div className="setting-label">{item.label}</div>
                      </div>
                      <button
                        type="button"
                        className={`toggle ${item.value ? 'on' : ''}`}
                        onClick={item.onToggle}
                        aria-pressed={Boolean(item.value)}
                      >
                        <span />
                      </button>
                    </div>
                  ))}

                  <div className="setting-row">
                    <div>
                      <div className="setting-label">{t('speechRate')}</div>
                      <div className="setting-desc">{settings.speechRate.toFixed(1)}x</div>
                    </div>
                    <input
                      type="range"
                      min="0.7"
                      max="1.5"
                      step="0.1"
                      value={settings.speechRate}
                      onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })}
                    />
                  </div>

                  <div className="setting-row">
                    <div>
                      <div className="setting-label">{t('location')}</div>
                    </div>
                    <input
                      className="input location-input"
                      value={locationHint}
                      onChange={(e) => {
                        setLocationHint(e.target.value);
                        safeStorage.setItem('swar_location', e.target.value);
                      }}
                    />
                  </div>

                  <button type="button" className="btn btn-secondary" onClick={clearHistory}>
                    <Trash2 size={16} />
                    {t('clearHistory')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {cameraOpen && (
            <motion.div
              className="settings-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={stopCamera}
            >
              <motion.div
                className="settings-panel glass"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="settings-head">
                  <h2>{t('camera')}</h2>
                  <button type="button" className="btn btn-ghost btn-icon" onClick={stopCamera}>
                    <X size={18} />
                  </button>
                </div>
                <video ref={videoRef} className="camera-preview" playsInline muted />
                <div className="camera-actions">
                  <button type="button" className="btn btn-primary" onClick={captureImage}>
                    <Camera size={16} />
                    {t('capture')}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={stopCamera}>
                    {t('close')}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .assistant-page {
          min-height: 100vh;
        }
        .assistant-shell {
          min-height: 100vh;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .assistant-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 16px;
          border-radius: 20px;
          position: sticky;
          top: 12px;
          z-index: 20;
        }
        .top-left,
        .top-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .top-right {
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        .top-icon-btn {
          width: 40px;
          height: 40px;
        }
        .assistant-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .brand-name {
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: -0.01em;
        }

        .assistant-main {
          flex: 1;
          display: grid;
          grid-template-columns: minmax(320px, 460px) minmax(0, 1fr);
          gap: 20px;
          min-height: 0;
          align-items: stretch;
        }
        .assistant-main.easy,
        .assistant-main.chat-fullscreen {
          grid-template-columns: 1fr;
        }
        .assistant-main.chat-fullscreen .assistant-center {
          display: none;
        }

        .assistant-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
          gap: 16px;
          min-height: 420px;
          position: relative;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255, 107, 53, 0.06), rgba(255, 255, 255, 0.01));
          border: 1px solid rgba(255, 107, 53, 0.1);
        }
        .assistant-mascot-stage {
          position: relative;
          width: min(360px, 100%);
          display: grid;
          place-items: center;
        }
        .assistant-mascot-glow {
          position: absolute;
          inset: 8% 12%;
          background: radial-gradient(circle, rgba(255, 107, 53, 0.28), transparent 68%);
          filter: blur(28px);
          pointer-events: none;
        }
        .assistant-intro {
          color: var(--text-muted);
          text-align: center;
          max-width: 340px;
          line-height: 1.6;
          margin: 0;
        }
        .quick-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
        }
        .active-chip,
        .active-toggle {
          background: rgba(255, 107, 53, 0.18) !important;
          border-color: rgba(255, 107, 53, 0.5) !important;
          color: #fff !important;
        }
        .notice {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          background: rgba(255, 154, 90, 0.1);
          color: #ffd2c2;
          font-size: 0.88rem;
          flex-wrap: wrap;
        }

        .live-data-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12px;
          width: 100%;
          max-width: 920px;
        }
        .live-card {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 14px;
          text-align: left;
        }
        .live-card-head {
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 8px;
          color: #fff;
        }
        .live-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 0.92rem;
          color: #ddd;
        }
        .news-item {
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .news-item:last-child {
          border-bottom: none;
        }
        .news-title {
          color: #ffd2c2;
          text-decoration: none;
          line-height: 1.4;
        }
        .news-title:hover {
          text-decoration: underline;
        }
        .muted {
          color: var(--text-muted);
        }
        .small {
          font-size: 0.78rem;
        }
        .live-error {
          color: #ffb3b3;
        }

        .assistant-chat {
          position: relative;
          border-radius: 24px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          min-height: 420px;
          max-width: 100%;
          justify-self: end;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.03);
        }
        .assistant-chat.fullscreen {
          position: fixed;
          inset: 12px;
          width: auto !important;
          height: auto !important;
          max-height: none;
          z-index: 120;
          justify-self: stretch;
        }
        .chat-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding-bottom: 12px;
          margin-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .chat-panel-title {
          font-weight: 700;
          font-size: 0.95rem;
          color: #eee;
        }
        .chat-panel-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .assistant-chat.compact {
          padding: 14px;
        }
        .assistant-chat.compact .chat-controls {
          gap: 8px;
          padding-top: 10px;
        }

        .chat-error,
        .chat-banner-memory {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.88rem;
          margin: 6px 0;
          flex-wrap: wrap;
        }
        .chat-error {
          background: rgba(255, 77, 77, 0.1);
          color: #ffb3b3;
        }
        .chat-banner-memory {
          justify-content: space-between;
          background: rgba(255, 107, 53, 0.1);
          color: #ffd2c2;
        }
        .chat-banner-actions {
          display: inline-flex;
          gap: 8px;
          margin-left: auto;
        }

        .chat-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .tool-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          justify-content: flex-start;
        }
        .tool-pill {
          height: 34px;
          padding: 0 12px;
          font-size: 0.84rem;
          gap: 6px;
        }

        .input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .input-row:focus-within {
          border-color: rgba(255, 107, 53, 0.6);
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.12);
        }
        .chat-input {
          flex: 1;
          min-width: 0;
          min-height: 42px;
          max-height: 140px;
          padding: 9px 10px;
          font-size: 0.96rem;
          line-height: 1.45;
          color: #fff;
          background: transparent;
          border: none;
          resize: none;
        }
        .chat-input::placeholder {
          color: var(--text-muted);
        }
        .composer-btn {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
        }
        .composer-right {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .support-note {
          margin: 0;
          padding: 8px 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: var(--text-muted);
          font-size: 0.8rem;
        }
        .chat-resize-handle {
          position: absolute;
          right: 10px;
          bottom: 10px;
          width: 14px;
          height: 14px;
          border-right: 2px solid rgba(255, 154, 90, 0.75);
          border-bottom: 2px solid rgba(255, 154, 90, 0.75);
          cursor: nwse-resize;
          opacity: 0.85;
          background: transparent;
        }
        .chat-resize-handle:hover {
          opacity: 1;
        }

        .settings-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.55);
          display: grid;
          place-items: center;
          z-index: 100;
          padding: 20px;
        }
        .settings-panel {
          width: min(620px, 100%);
          border-radius: 24px;
          padding: 24px;
          max-height: 90vh;
          overflow: auto;
        }
        .settings-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .settings-head h2 {
          margin: 0;
          font-size: 1.4rem;
        }
        .settings-body {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding: 4px 0;
        }
        .setting-label {
          font-weight: 600;
        }
        .setting-desc {
          font-size: 0.88rem;
          color: var(--text-muted);
          margin-top: 2px;
        }
        .location-input {
          max-width: 220px;
        }
        .toggle {
          width: 52px;
          height: 30px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.15);
          padding: 3px;
          transition: 0.2s;
          flex-shrink: 0;
        }
        .toggle span {
          display: block;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          transition: transform 0.2s;
        }
        .toggle.on {
          background: var(--accent);
        }
        .toggle.on span {
          transform: translateX(22px);
        }
        .setting-row input[type='range'] {
          width: 160px;
          accent-color: var(--accent);
        }
        .camera-preview {
          width: 100%;
          border-radius: 16px;
          background: #000;
        }
        .camera-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        @media (max-width: 1020px) {
          .assistant-main {
            grid-template-columns: 1fr;
          }
          .assistant-center {
            min-height: 280px;
            padding: 16px;
          }
          .assistant-chat {
            width: 100% !important;
            height: min(72vh, 760px) !important;
            min-height: 55vh;
            justify-self: stretch;
          }
          .chat-resize-handle {
            display: none;
          }
        }
        @media (max-width: 720px) {
          .assistant-shell {
            padding: 10px;
          }
          .assistant-top {
            flex-direction: column;
            align-items: stretch;
            position: static;
          }
          .top-left,
          .top-right {
            justify-content: space-between;
          }
          .top-right {
            width: 100%;
          }
          .assistant-chat,
          .assistant-chat.fullscreen {
            height: min(74vh, 720px) !important;
            min-height: 420px;
            border-radius: 18px;
            padding: 14px;
            inset: 8px;
          }
          .chat-panel-actions .btn {
            padding: 8px 10px;
            font-size: 0.8rem;
          }
          .input-row {
            gap: 6px;
          }
        }
      `}</style>
    </PageShell>
  );
}
