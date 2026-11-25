import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Settings, Trash2, Volume2, RotateCcw, User, Home, AlertTriangle, Camera, FileUp, X, LayoutDashboard, ShieldAlert, Brain, GraduationCap, Languages, KeyRound, Eye, EyeOff, Plus, Image, FileText, Puzzle, Sparkles, Check } from 'lucide-react';
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
import { AssistantStatus, ChatMessage, LanguageCode } from '@/types';
import { createRecognition, isSpeechRecognitionSupported } from '@/services/speechRecognition';
import { isSpeechSynthesisSupported, speakText, stopSpeaking } from '@/services/speechSynthesis';
import { sendChatMessage, fetchApiKeyStatus, activateApiKey, testApiKeyConnection, removeApiKey, type ApiKeyStatus } from '@/services/aiAssistant';
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
  const [messages, setMessages] = useState<ChatMessage[]>(() => settings.saveHistory ? loadHistory() : []);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState('');
  const [keyStatus, setKeyStatus] = useState<ApiKeyStatus>({ ok: true, configured: false, connectionState: 'Not Configured' });
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyFeedback, setKeyFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [attachMenuOpen, setAttachMenuOpen] = useState(false);
  const [pluginsOpen, setPluginsOpen] = useState(false);
  const [thinkHarder, setThinkHarder] = useState(false);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [mode, setMode] = useState<'default' | 'tutor' | 'simple' | 'translate' | 'emergency'>('default');
  const [continuous, setContinuous] = useState(settings.continuousMode);
  const [docText, setDocText] = useState('');
  const [docName, setDocName] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [memories, setMemories] = useState<string[]>([]);
  const [memoryCandidate, setMemoryCandidate] = useState<string | null>(null);
  const [locationHint, setLocationHint] = useState(safeStorage.getItem('swar_location') || 'Hyderabad');

  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null);
  const latestTranscriptRef = useRef('');
  const baseInputRef = useRef('');
  const voiceSubmittedRef = useRef(false);
  const attachMenuRef = useRef<HTMLDivElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const cameraFallbackRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ aiConfigured?: boolean; weatherConfigured?: boolean; newsConfigured?: boolean } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const messagesRef = useRef(messages); messagesRef.current = messages;
  const statusRef = useRef(status); statusRef.current = status;
  const lastSpokenRef = useRef('');
  const convoIdRef = useRef<string | null>(null);
  const continuousRef = useRef(continuous); continuousRef.current = continuous;
  const pendingListenRef = useRef(false);

  const speechRecSupported = isSpeechRecognitionSupported();
  const ttsSupported = isSpeechSynthesisSupported();

  useEffect(() => { setContinuous(settings.continuousMode); }, [settings.continuousMode]);
  useEffect(() => {
    if (!user) {
      setKeyStatus({ ok: true, configured: false, connectionState: 'Not Configured' });
      return;
    }
    fetchApiKeyStatus().then((st) => setKeyStatus(st));
  }, [user?.uid]);
  useEffect(() => { if (settings.saveHistory) try { localStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-50))); } catch {} }, [messages, settings.saveHistory]);
  useEffect(() => { if (!settings.saveHistory) safeStorage.removeItem(HISTORY_KEY); }, [settings.saveHistory]);
  useEffect(() => { document.documentElement.dataset.theme = 'dark'; }, []);

  useEffect(() => {
    if (!user) return;
    (async () => {
      if (isSupabaseConfigured()) {
        const p = await getProfile(user.uid);
        if (p) updateSettings({
          preferredLanguage: p.preferred_language || settings.preferredLanguage,
          autoDetectLanguage: !!p.auto_detect_language,
          speechRate: Number(p.speech_rate || 1),
          easyMode: !!p.easy_mode,
          
          memoryConsent: !!p.memory_consent,
          saveHistory: p.save_history !== false,
        });
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
      email: user.email, phone: user.phoneNumber, name: user.name,
      preferred_language: settings.preferredLanguage, auto_detect_language: settings.autoDetectLanguage,
      speech_rate: settings.speechRate, easy_mode: settings.easyMode, 
      memory_consent: settings.memoryConsent, save_history: settings.saveHistory, save_audio: settings.saveAudio,
    });
  }, [user, settings]);

  useEffect(() => { persistProfile(); }, [persistProfile]);

  const cleanupAudio = useCallback(() => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((tr) => tr.stop()); streamRef.current = null; }
    if (audioCtxRef.current) { audioCtxRef.current.close().catch(() => {}); audioCtxRef.current = null; }
    setAnalyser(null);
  }, []);

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach((t) => t.stop()); cameraStreamRef.current = null; }
    setCameraOpen(false);
  }, []);

  useEffect(() => () => { cleanupAudio(); stopSpeaking(); recognitionRef.current?.abort(); stopCamera(); }, [cleanupAudio, stopCamera]);

  const ensureConversation = useCallback(async () => {
    if (convoIdRef.current || !user || !isSupabaseConfigured() || !settings.saveHistory) return convoIdRef.current;
    const id = await createConversation(user.uid, language);
    convoIdRef.current = id;
    return id;
  }, [user, language, settings.saveHistory]);

  const speak = useCallback(async (text: string, lang: LanguageCode) => {
    if (!text) return;
    lastSpokenRef.current = text;
    if (!ttsSupported) { if (continuousRef.current) pendingListenRef.current = true; return; }
    setStatus('speaking');
    await speakText(text, {
      lang, rate: settings.speechRate, voicePreference: settings.voicePreference,
      onStart: () => setStatus('speaking'),
      onEnd: () => { setStatus('idle'); if (continuousRef.current) pendingListenRef.current = true; },
      onError: () => { setStatus('idle'); if (continuousRef.current) pendingListenRef.current = true; },
    });
  }, [settings.speechRate, settings.voicePreference, ttsSupported]);

  useEffect(() => {
    if (!pendingListenRef.current) return;
    if (status !== 'idle') return;
    pendingListenRef.current = false;
    const timer = setTimeout(() => { if (continuousRef.current && statusRef.current === 'idle') startListeningRef.current(); }, 350);
    return () => clearTimeout(timer);
  }, [status]);

  const greetedRef = useRef(false);
  useEffect(() => {
    if (greetedRef.current) return;
    greetedRef.current = true;
    if (messagesRef.current.length === 0) {
      const greeting: ChatMessage = { id: uid(), role: 'assistant', content: t('assistantGreeting'), language, timestamp: Date.now(), suggestions: language === 'te-IN' ? ['ఈరోజు వాతావరణం?', 'నాకు ఇంగ్లీష్ నేర్పించు', 'కంప్యూటర్ అంటే ఏమిటి?'] : language === 'hi-IN' ? ['आज मौसम कैसा है?', 'मुझे अंग्रेज़ी सिखाओ', 'कंप्यूटर क्या है?'] : ['What can you do?', 'Teach me something new', 'Help me with technology'] };
      setMessages([greeting]);
      setTimeout(() => { speak(greeting.content, language).catch(() => {}); }, 600);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(async (text: string, overrideMode?: typeof mode) => {
    const trimmed = text.trim();
    if (!trimmed || statusRef.current === 'processing') return;
    setError(null); stopSpeaking(); recognitionRef.current?.abort(); cleanupAudio();

    const activeMode = overrideMode || mode;
    const userLang = settings.autoDetectLanguage ? (detectLanguageFromText(trimmed) || language) : language;
    const userMsg: ChatMessage = { id: uid(), role: 'user', content: trimmed, language: userLang, timestamp: Date.now() };
    const nextMessages = [...messagesRef.current, userMsg];
    setMessages(nextMessages); setInput(''); setStatus('processing');
    await logUsage(user?.uid || null, 'message_sent', { mode: activeMode, voice: false });

    try {
      const convoId = await ensureConversation();
      if (user && convoId && settings.saveHistory) await saveMessage(user.uid, convoId, userMsg).catch((e) => console.warn('Save user msg failed', e));
      const res = await sendChatMessage({
        messages: nextMessages, language: userLang, autoDetect: settings.autoDetectLanguage,
        mode: activeMode, memories: settings.memoryConsent ? memories : [], documentText: docText, imageDataUrl, locationHint,
        thinkHarder,
      });
      const replyLang = (res.detectedLanguage || userLang) as LanguageCode;
      if (settings.autoDetectLanguage && replyLang !== language) { setLanguage(replyLang); updateSettings({ preferredLanguage: replyLang }); }
      const assistantMsg: ChatMessage = { id: uid(), role: 'assistant', content: res.reply, language: replyLang, timestamp: Date.now(), suggestions: res.suggestions, error: Boolean(res.error) };
      setMessages((prev) => [...prev, assistantMsg]);
      if (user && convoId && settings.saveHistory) await saveMessage(user.uid, convoId, assistantMsg).catch((e) => console.warn('Save assistant msg failed', e));
      if (res.error) {
        const details = [res.error];
        if ((res as any).providerStatus) details.push(`status ${(res as any).providerStatus}`);
        if ((res as any).providerCode) details.push(`code ${(res as any).providerCode}`);
        if ((res as any).providerMessage) details.push(String((res as any).providerMessage));
        const reason = res.error === 'AI_NOT_CONFIGURED' ? 'Missing AI_API_KEY on backend'
          : res.error === 'AI_AUTH_ERROR' ? 'AI authentication/permission error'
          : res.error === 'AI_RATE_LIMITED' ? 'AI rate limit/quota error'
          : res.error === 'AI_MODEL_OR_ENDPOINT_ERROR' ? 'AI model or endpoint error'
          : res.error === 'AI_BAD_REQUEST' ? 'AI bad request'
          : res.error === 'AI_UPSTREAM_ERROR' ? 'AI provider error'
          : res.error;
        setError(`${t('aiError')} (${reason}: ${details.filter(Boolean).join(' | ')})`);
      }
      if (settings.memoryConsent && res.memoryCandidate) setMemoryCandidate(res.memoryCandidate);
      await logUsage(user?.uid || null, 'assistant_reply', { mode: activeMode }).catch(() => {});
      if (res.reply) { try { await speak(res.reply, replyLang); } catch (e) { console.warn('TTS failed', e); setStatus('idle'); } }
      else setStatus('idle');
    } catch (e) {
      console.error('Chat send failed', e);
      const msg = e instanceof Error ? e.message : String(e);
      setStatus('error'); setError(`${t('aiError')} (${msg})`);
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: t('aiError'), language, timestamp: Date.now(), error: true, suggestions: [t('retry')] }]);
    }
  }, [mode, settings, language, memories, docText, imageDataUrl, locationHint, thinkHarder, user, ensureConversation, setLanguage, updateSettings, speak, cleanupAudio, t]);

  useEffect(() => {
    if (!attachMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target as Node)) {
        setAttachMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAttachMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [attachMenuOpen]);

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then((d) => setHealthStatus(d)).catch(() => {});
  }, []);

  const startListening = useCallback(async () => {
    setError(null); stopSpeaking();
    pendingListenRef.current = false;
    if (!speechRecSupported) { setError(t('micNotSupported')); return; }

    recognitionRef.current?.abort();
    cleanupAudio();
    baseInputRef.current = input.trim();
    latestTranscriptRef.current = '';
    voiceSubmittedRef.current = false;

    const rec = createRecognition(language, {
      onStart: () => setStatus('listening'),
      onEnd: () => {
        cleanupAudio();
        const spoken = latestTranscriptRef.current.trim();
        const combined = [baseInputRef.current, spoken].filter(Boolean).join(' ').trim();
        if (combined) setInput(combined);

        if (continuousRef.current && !voiceSubmittedRef.current && spoken) {
          voiceSubmittedRef.current = true;
          handleSend(combined);
          return;
        }
        if (statusRef.current === 'listening') setStatus('idle');
      },
      onResult: (transcript, isFinal) => {
        latestTranscriptRef.current = transcript;
        const combined = [baseInputRef.current, transcript].filter(Boolean).join(' ').trim();
        setInput(combined);
        if (continuousRef.current && isFinal && transcript.trim() && !voiceSubmittedRef.current) {
          voiceSubmittedRef.current = true;
          recognitionRef.current?.stop();
          cleanupAudio();
          handleSend(combined);
        }
      },
      onError: (err) => {
        cleanupAudio();
        if (err === 'not-allowed' || err === 'service-not-allowed') setError(t('micPermissionDenied'));
        else if (err === 'no-speech') setError('No speech detected. Please speak into your microphone and try again.');
        else if (err === 'audio-capture') setError('No microphone found or microphone is busy in another app.');
        else if (err === 'network') setError('Speech recognition network error. Please check your internet connection.');
        else if (err !== 'aborted') setError(`${t('error')} (${err})`);
        setStatus('idle');
      },
    });
    if (!rec) { setError(t('micNotSupported')); return; }
    recognitionRef.current = rec;
    rec.start();

    // Audio-reactive Web Audio API AnalyserNode for live waveform
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (Ctx) {
          const ctx = new Ctx(); audioCtxRef.current = ctx;
          if (ctx.state === 'suspended') await ctx.resume().catch(() => {});
          const source = ctx.createMediaStreamSource(stream); const an = ctx.createAnalyser(); an.fftSize = 256; source.connect(an); setAnalyser(an);
        }
      }
    } catch {
      /* Visualizer is optional; SpeechRecognition handles mic input independently */
    }
    await logUsage(user?.uid || null, 'voice_start').catch(() => {});
  }, [language, speechRecSupported, input, handleSend, cleanupAudio, t, user]);
  const startListeningRef = useRef(startListening); startListeningRef.current = startListening;

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    cleanupAudio();
    setStatus('idle');
  }, [cleanupAudio]);
  const onMicClick = () => {
    if (status === 'listening') stopListening();
    else if (status === 'speaking') {
      stopSpeaking();
      pendingListenRef.current = false;
      setStatus('idle');
      setTimeout(() => startListening(), 150);
    }
    else if (status !== 'processing') startListening();
  };

  const onRepeat = (text?: string) => {
    const toSpeak = text || lastSpokenRef.current || [...messagesRef.current].reverse().find((m) => m.role === 'assistant')?.content;
    if (toSpeak) speak(toSpeak, language);
    else setError('No assistant response to repeat yet.');
  };
  const onSimplify = (text: string) => handleSend(`${t('explainSimply')}: ${text}`, 'simple');
  const clearHistory = () => { stopSpeaking(); setMessages([]); safeStorage.removeItem(HISTORY_KEY); setStatus('idle'); convoIdRef.current = null; greetedRef.current = false; setTimeout(() => { greetedRef.current = true; setMessages([{ id: uid(), role: 'assistant', content: t('assistantGreeting'), language, timestamp: Date.now() }]); }, 0); };

  const handleDocUpload = async (file: File) => {
    setError(null);
    const name = file.name.toLowerCase();
    if (name.match(/\.(txt|md|csv|json|js|ts|tsx|py|html|css)$/)) {
      const text = await file.text();
      setDocText(text.slice(0, 12000));
      setDocName(file.name);
      return;
    }
    if (name.endsWith('.docx')) {
      try {
        const buf = await file.arrayBuffer();
        const bytes = new Uint8Array(buf);
        const view = new DataView(buf);
        let extracted = '';
        for (let i = 0; i < bytes.length - 30; i++) {
          if (view.getUint32(i, true) === 0x04034b50) {
            const compMethod = view.getUint16(i + 8, true);
            const compSize = view.getUint32(i + 18, true);
            const nameLen = view.getUint16(i + 26, true);
            const extraLen = view.getUint16(i + 28, true);
            const entryName = new TextDecoder().decode(bytes.slice(i + 30, i + 30 + nameLen));
            const dataStart = i + 30 + nameLen + extraLen;
            if (entryName === 'word/document.xml' && compSize > 0 && dataStart + compSize <= bytes.length) {
              const rawEntry = bytes.slice(dataStart, dataStart + compSize);
              let xmlText = '';
              if (compMethod === 0) {
                xmlText = new TextDecoder().decode(rawEntry);
              } else if (compMethod === 8 && typeof DecompressionStream !== 'undefined') {
                const ds = new DecompressionStream('deflate-raw');
                const writer = ds.writable.getWriter();
                writer.write(rawEntry);
                writer.close();
                xmlText = await new Response(ds.readable).text();
              }
              if (xmlText) {
                extracted = xmlText.replace(/<w:p[^>]*>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
              }
              break;
            }
          }
        }
        setDocText((extracted || `[Attached DOCX: ${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB)]`).slice(0, 12000));
        setDocName(file.name);
        return;
      } catch {
        /* fallback below */
      }
    }
    if (name.match(/\.(pdf|doc|docx)$/)) {
      try {
        const buf = await file.arrayBuffer();
        const raw = new TextDecoder('latin1').decode(buf);
        const matches = raw.match(/\(([^()\\]{3,120})\)/g) || [];
        const textRuns = matches
          .map((m) => m.slice(1, -1))
          .filter((s) => /[a-zA-Z0-9\u0900-\u097F\u0C00-\u0C7F]{2}/.test(s))
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
        setDocText((textRuns || `[Attached document: ${file.name} (${Math.max(1, Math.round(file.size / 1024))} KB). Compressed/scanned PDF/DOC text could not be decoded in-browser.]`).slice(0, 12000));
        setDocName(file.name);
      } catch {
        setDocText(`[Attached document: ${file.name}]`);
        setDocName(file.name);
      }
      return;
    }
    setError('Supported files: .pdf, .doc, .docx, .txt, .md, .csv, .json, and code files.');
  };

  const handlePhotoUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const openCamera = async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraFallbackRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      cameraStreamRef.current = stream; setCameraOpen(true);
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); } }, 50);
    } catch {
      cameraFallbackRef.current?.click();
    }
  };
  const captureImage = () => {
    const video = videoRef.current; if (!video) return;
    const canvas = document.createElement('canvas'); canvas.width = video.videoWidth || 640; canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.drawImage(video, 0, 0); setImageDataUrl(canvas.toDataURL('image/jpeg', 0.8)); stopCamera();
  };

  const handleActivateKey = async () => {
    const trimmed = apiKeyDraft.trim();
    if (!trimmed) {
      setKeyFeedback({ type: 'err', text: 'Please paste an API key first.' });
      return;
    }
    setKeyBusy(true);
    setKeyFeedback(null);
    setKeyStatus((prev) => ({ ...prev, connectionState: 'Testing Connection' }));
    const res = await activateApiKey(trimmed);
    setKeyBusy(false);
    setKeyStatus(res);
    if (res.ok) {
      setApiKeyDraft('');
      setError(null);
      setKeyFeedback({ type: 'ok', text: 'API Key Activated Successfully' });
    } else {
      setKeyFeedback({ type: 'err', text: res.message || 'API key verification failed.' });
    }
  };

  const handleTestConnection = async () => {
    setKeyBusy(true);
    setKeyFeedback(null);
    setKeyStatus((prev) => ({ ...prev, connectionState: 'Testing Connection' }));
    const res = await testApiKeyConnection();
    setKeyBusy(false);
    setKeyStatus(res);
    setKeyFeedback({
      type: res.ok ? 'ok' : 'err',
      text: res.message || res.connectionState,
    });
  };

  const handleRemoveKey = async () => {
    setKeyBusy(true);
    setKeyFeedback(null);
    const res = await removeApiKey();
    setKeyBusy(false);
    setKeyStatus(res);
    setApiKeyDraft('');
    setKeyFeedback({ type: 'ok', text: 'API key removed.' });
  };

  const saveMemoryCandidate = async () => {
    if (!memoryCandidate || !user) { setMemoryCandidate(null); return; }
    await addMemory(user.uid, memoryCandidate);
    setMemories((prev) => [memoryCandidate, ...prev].slice(0, 50));
    setMemoryCandidate(null);
  };

  return (
    <PageShell className="assistant-page">
      <div className="assistant-shell">
        <header className="assistant-top glass">
          <div className="top-left">
            <Link to="/" className="btn btn-ghost btn-icon" aria-label={t('navHome')}><Home size={20} /></Link>
            <div className="assistant-brand"><span className="brand-name">{t('appName')}</span><AssistantStatusBar status={status} /></div>
          </div>
          <div className="top-right">
            <LanguageSelector compact />
            <button className={`btn btn-secondary btn-icon ${continuous ? 'active-toggle' : ''}`} onClick={() => { const v = !continuous; setContinuous(v); updateSettings({ continuousMode: v }); }} title={t('continuousMode')} aria-label={t('continuousMode')}><RotateCcw size={18} /></button>
            <Link to="/dashboard" className="btn btn-secondary btn-icon" aria-label={t('dashboard')}><LayoutDashboard size={18} /></Link>
            <button className="btn btn-secondary btn-icon" onClick={() => setShowSettings(true)} aria-label={t('settings')}><Settings size={18} /></button>
            <Link to={user ? '/profile' : '/auth'} className="btn btn-secondary btn-icon" aria-label={user ? t('navProfile') : t('navSignIn')}><User size={18} /></Link>
          </div>
        </header>

        <main className={`assistant-main ${settings.easyMode ? 'easy' : ''}`}>
          <section className="assistant-center" aria-label="SWAR AI mascot">
            <div className="assistant-mascot-stage">
              <div className="assistant-mascot-glow" aria-hidden />
              <AssistantOrb status={status} analyser={analyser} />
            </div>
            <p className="assistant-intro">{t('assistantIntro')}</p>
            <div className="quick-actions">
              <button className={`chip ${mode === 'tutor' ? 'active-chip' : ''}`} onClick={() => setMode(mode === 'tutor' ? 'default' : 'tutor')}><GraduationCap size={14} />{t('tutorMode')}</button>
              <button className={`chip ${mode === 'translate' ? 'active-chip' : ''}`} onClick={() => setMode(mode === 'translate' ? 'default' : 'translate')}><Languages size={14} />{t('translateMode')}</button>
              <button className={`chip ${mode === 'emergency' ? 'active-chip' : ''}`} onClick={() => setMode(mode === 'emergency' ? 'default' : 'emergency')}><ShieldAlert size={14} />{t('emergency')}</button>
            </div>
            {!ttsSupported && <div className="notice"><AlertTriangle size={16} />{t('ttsNotSupported')}</div>}
            {docName && <div className="notice"><FileUp size={16} />{t('documentLoaded')}: {docName} <button className="link-btn" onClick={() => { setDocText(''); setDocName(''); }}>{t('close')}</button></div>}
            {imageDataUrl && <div className="notice"><Camera size={16} />{t('imageAttached')} <button className="link-btn" onClick={() => setImageDataUrl('')}>{t('removeImage')}</button></div>}
          </section>

          <section className="assistant-chat glass">
            <ConversationPanel messages={messages} onSuggestion={(s) => handleSend(s)} onRepeat={(text) => onRepeat(text)} onSimplify={onSimplify} />
            {error && (
              <div className="chat-error" role="alert" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><AlertTriangle size={16} /> {error}</span>
                {(error.includes('API') || error.includes('rate limit') || error.includes('quota') || error.includes('authentication')) && (
                  <button className="btn btn-sm btn-secondary" onClick={() => setShowSettings(true)}><KeyRound size={14} /> Change API Key</button>
                )}
              </div>
            )}
            {memoryCandidate && settings.memoryConsent && (
              <div className="chat-error" style={{ background: 'rgba(255,107,53,0.1)', color: '#ffd2c2' }}>
                <Brain size={16} /> {t('memoryConsentAsk')} "{memoryCandidate}"
                <button className="btn btn-sm btn-primary" onClick={saveMemoryCandidate}>{t('save')}</button>
                <button className="btn btn-sm btn-secondary" onClick={() => setMemoryCandidate(null)}>{t('close')}</button>
              </div>
            )}
            <div className="chat-controls">
              <div className="tool-row">
                <button
                  className={`btn btn-secondary btn-sm ${continuous ? 'active-toggle' : ''}`}
                  onClick={() => { const v = !continuous; setContinuous(v); updateSettings({ continuousMode: v }); }}
                  title="Toggle hands-free voice conversation mode"
                >
                  <RotateCcw size={14} /> {continuous ? 'Voice Chat: ON' : 'Voice Chat: OFF'}
                </button>
                {thinkHarder && (
                  <button className="btn btn-secondary btn-sm think-badge" onClick={() => setThinkHarder(false)} title="Disable Think Harder">
                    <Sparkles size={14} /> Think Harder ON <X size={13} />
                  </button>
                )}
              </div>
              <MicrophoneButton status={status} onClick={onMicClick} disabled={status === 'processing'} analyser={analyser} />
              <div className="input-row" ref={attachMenuRef}>
                <AnimatePresence>
                  {attachMenuOpen && (
                    <motion.div
                      className="attach-popup"
                      role="menu"
                      aria-label="Attachment and tools menu"
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.16, ease: 'easeOut' }}
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="attach-item"
                        onClick={() => { setAttachMenuOpen(false); openCamera(); }}
                      >
                        <span className="attach-icon"><Camera size={18} /></span>
                        <span className="attach-text">Camera</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="attach-item"
                        onClick={() => { setAttachMenuOpen(false); photoInputRef.current?.click(); }}
                      >
                        <span className="attach-icon"><Image size={18} /></span>
                        <span className="attach-text">Photos</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="attach-item"
                        onClick={() => { setAttachMenuOpen(false); fileInputRef.current?.click(); }}
                      >
                        <span className="attach-icon"><FileText size={18} /></span>
                        <span className="attach-text">Files</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className="attach-item"
                        onClick={() => { setAttachMenuOpen(false); setPluginsOpen(true); }}
                      >
                        <span className="attach-icon"><Puzzle size={18} /></span>
                        <span className="attach-text">Plugins</span>
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        className={`attach-item ${thinkHarder ? 'active' : ''}`}
                        onClick={() => { setThinkHarder((v) => !v); setAttachMenuOpen(false); }}
                      >
                        <span className="attach-icon"><Sparkles size={18} /></span>
                        <span className="attach-text">Think Harder</span>
                        {thinkHarder && <Check size={16} className="attach-check" />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <input
                  ref={photoInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.currentTarget.value = ''; }}
                />
                <input
                  ref={cameraFallbackRef}
                  type="file"
                  hidden
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); e.currentTarget.value = ''; }}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept=".pdf,.doc,.docx,.txt,.md,.csv,.json,.js,.ts,.tsx,.py,.html,.css"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleDocUpload(f); e.currentTarget.value = ''; }}
                />
                <button
                  type="button"
                  className={`btn btn-secondary btn-icon attach-plus-btn ${attachMenuOpen || thinkHarder ? 'active-toggle' : ''}`}
                  onClick={() => setAttachMenuOpen((v) => !v)}
                  aria-label="Open attachment menu"
                  aria-expanded={attachMenuOpen}
                  title="Attach or tools"
                >
                  <Plus size={20} style={{ transform: attachMenuOpen ? 'rotate(45deg)' : 'none', transition: 'transform 0.16s ease' }} />
                </button>
                <button className="btn btn-secondary btn-icon" onClick={() => onRepeat()} aria-label={t('speakAgain')} title={t('speakAgain')}><Volume2 size={18} /></button>
                <input className="input chat-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('typeMessage')} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(input); } }} aria-label={t('typeMessage')} />
                <button className="btn btn-primary btn-icon" onClick={() => handleSend(input)} disabled={!input.trim() || status === 'processing'} aria-label={t('send')}><Send size={18} /></button>
              </div>
              {!speechRecSupported && <p className="support-note">{t('micNotSupported')}</p>}
            </div>
          </section>
        </main>

        <AnimatePresence>
          {showSettings && (
            <motion.div className="settings-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettings(false)}>
              <motion.div className="settings-panel glass" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                <div className="settings-head"><h2>{t('settings')}</h2><button className="btn btn-ghost" onClick={() => setShowSettings(false)}>{t('close')}</button></div>
                <div className="settings-body">
                  {[
                    [t('autoDetectLanguage'), settings.autoDetectLanguage, () => updateSettings({ autoDetectLanguage: !settings.autoDetectLanguage })],
                    [t('easyMode'), settings.easyMode, () => updateSettings({ easyMode: !settings.easyMode })],
                    [t('continuousMode'), continuous, () => { const v = !continuous; setContinuous(v); updateSettings({ continuousMode: v }); }],
                    [t('saveHistory'), settings.saveHistory, () => updateSettings({ saveHistory: !settings.saveHistory })],
                    [t('memoryConsent'), settings.memoryConsent, () => updateSettings({ memoryConsent: !settings.memoryConsent })],
                    [t('saveAudio'), settings.saveAudio, () => updateSettings({ saveAudio: !settings.saveAudio })],
                  ].map(([label, val, fn]: any) => (
                    <div className="setting-row" key={label}><div><div className="setting-label">{label}</div></div><button className={`toggle ${val ? 'on' : ''}`} onClick={fn} aria-pressed={!!val}><span /></button></div>
                  ))}
                  <div className="setting-row"><div><div className="setting-label">{t('speechRate')}</div><div className="setting-desc">{settings.speechRate.toFixed(1)}x</div></div><input type="range" min="0.7" max="1.5" step="0.1" value={settings.speechRate} onChange={(e) => updateSettings({ speechRate: Number(e.target.value) })} /></div>
                  <div className="setting-row"><div><div className="setting-label">{t('location')}</div></div><input className="input" style={{ maxWidth: 220 }} value={locationHint} onChange={(e) => { setLocationHint(e.target.value); safeStorage.setItem('swar_location', e.target.value); }} /></div>
                  <div className="setting-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div>
                        <div className="setting-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                          <KeyRound size={15} /> Custom AI API Key
                          <span className={`key-state-badge state-${keyStatus.connectionState.toLowerCase().replace(/\s+/g, '-')}`}>
                            {keyStatus.connectionState}
                          </span>
                        </div>
                        <div className="setting-desc">
                          {!user
                            ? <>Please <Link to="/auth" className="link-btn">sign in</Link> to save and activate your personal API key securely.</>
                            : keyStatus.configured
                              ? `Active key: ${keyStatus.keySuffix || '••••'} (${keyStatus.provider || 'AI'} • ${keyStatus.model || 'default'})`
                              : 'Paste a Gemini (AIza...) or OpenCode key and click Set Key to verify & activate.'}
                        </div>
                      </div>
                      {user && keyStatus.configured && (
                        <button className="btn btn-ghost btn-sm" type="button" disabled={keyBusy} onClick={handleRemoveKey}>
                          Remove Key
                        </button>
                      )}
                    </div>
                    {user && (
                      <>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <input
                            className="input"
                            style={{ flex: 1, minWidth: 180 }}
                            type={showApiKey ? 'text' : 'password'}
                            value={apiKeyDraft}
                            onChange={(e) => { setApiKeyDraft(e.target.value); setKeyFeedback(null); }}
                            placeholder={keyStatus.configured ? 'Paste new key to replace active key' : 'Paste Gemini (AIza...) or OpenCode API key'}
                            autoComplete="off"
                            disabled={keyBusy}
                          />
                          <button className="btn btn-secondary btn-icon" type="button" onClick={() => setShowApiKey((v) => !v)} aria-label={showApiKey ? 'Hide API key' : 'Show API key'}>
                            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button className="btn btn-primary btn-sm" type="button" disabled={keyBusy || !apiKeyDraft.trim()} onClick={handleActivateKey}>
                            <Check size={15} /> {keyBusy ? 'Verifying...' : 'Set Key'}
                          </button>
                          <button className="btn btn-secondary btn-sm" type="button" disabled={keyBusy} onClick={handleTestConnection}>
                            Test Connection
                          </button>
                        </div>
                        {keyFeedback && (
                          <div className={`setting-desc`} style={{ color: keyFeedback.type === 'ok' ? '#7ef0b5' : '#ffb3b3', fontWeight: 500 }}>
                            {keyFeedback.text}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <button className="btn btn-secondary" onClick={clearHistory}><Trash2 size={16} /> {t('clearHistory')}</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {pluginsOpen && (
            <motion.div className="settings-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPluginsOpen(false)}>
              <motion.div className="settings-panel glass" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                <div className="settings-head">
                  <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Puzzle size={20} /> Plugins & Integrations</h2>
                  <button className="btn btn-ghost" onClick={() => setPluginsOpen(false)}>{t('close')}</button>
                </div>
                <div className="settings-body">
                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Voice Conversation Mode</div>
                      <div className="setting-desc">Hands-free continuous voice chat with spoken replies</div>
                    </div>
                    <button className={`toggle ${continuous ? 'on' : ''}`} onClick={() => { const v = !continuous; setContinuous(v); updateSettings({ continuousMode: v }); }} aria-pressed={continuous}><span /></button>
                  </div>
                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Think Harder (Deep Reasoning)</div>
                      <div className="setting-desc">Step-by-step analysis for complex questions</div>
                    </div>
                    <button className={`toggle ${thinkHarder ? 'on' : ''}`} onClick={() => setThinkHarder((v) => !v)} aria-pressed={thinkHarder}><span /></button>
                  </div>
                  <div className="setting-row">
                    <div>
                      <div className="setting-label">Custom AI / Gemini API Key</div>
                      <div className="setting-desc">{keyStatus.configured ? `${keyStatus.connectionState} (${keyStatus.keySuffix || '••••'})` : healthStatus?.aiConfigured ? 'Using server default key' : 'Needs API key configuration'}</div>
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setPluginsOpen(false); setShowSettings(true); }}><KeyRound size={15} /> Configure</button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {cameraOpen && (
            <motion.div className="settings-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={stopCamera}>
              <motion.div className="settings-panel glass" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                <div className="settings-head"><h2>{t('camera')}</h2><button className="btn btn-ghost" onClick={stopCamera}><X size={18} /></button></div>
                <video ref={videoRef} style={{ width: '100%', borderRadius: 16, background: '#000' }} playsInline muted />
                <div style={{ display: 'flex', gap: 12, marginTop: 16 }}><button className="btn btn-primary" onClick={captureImage}><Camera size={16} />{t('capture')}</button><button className="btn btn-secondary" onClick={stopCamera}>{t('close')}</button></div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`
        .assistant-page{min-height:100vh}.assistant-shell{min-height:100vh;padding:16px;display:flex;flex-direction:column;gap:16px}
        .assistant-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 16px;border-radius:20px;position:sticky;top:12px;z-index:20}
        .top-left,.top-right{display:flex;align-items:center;gap:10px}.top-right{flex-wrap:wrap;justify-content:flex-end}
        .assistant-brand{display:flex;align-items:center;gap:12px;flex-wrap:wrap}.brand-name{font-weight:800;font-size:1.2rem}
        .assistant-main{flex:1;display:grid;grid-template-columns:minmax(320px,460px) minmax(0,1fr);gap:20px;min-height:0;align-items:stretch}
        .assistant-main.easy{grid-template-columns:1fr}.assistant-center{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:16px;min-height:420px;position:relative;border-radius:24px;background:linear-gradient(180deg,rgba(255,107,53,0.06),rgba(255,255,255,0.01));border:1px solid rgba(255,107,53,0.08)}
        .assistant-mascot-stage{position:relative;width:min(380px,100%);display:grid;place-items:center}
        .assistant-mascot-glow{position:absolute;inset:8% 12%;background:radial-gradient(circle,rgba(255,107,53,0.28),transparent 68%);filter:blur(28px);pointer-events:none}
        .assistant-intro{color:var(--text-muted);text-align:center;max-width:320px;line-height:1.6;margin:0}
        .quick-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}.active-chip,.active-toggle{background:rgba(255,107,53,0.18)!important;border-color:rgba(255,107,53,0.5)!important;color:#fff!important}
        .notice{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;background:rgba(255,154,90,0.1);color:#ffd2c2;font-size:.88rem;flex-wrap:wrap}
        .assistant-chat{border-radius:24px;padding:20px;display:flex;flex-direction:column;min-height:0;height:calc(100vh - 120px)}
        .chat-error{display:flex;align-items:center;gap:8px;padding:12px 14px;border-radius:12px;background:rgba(255,77,77,0.1);color:#ffb3b3;font-size:.9rem;margin-bottom:12px;flex-wrap:wrap}
        .chat-controls{display:flex;flex-direction:column;gap:16px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06)}
        .tool-row{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
        .input-row{position:relative;display:flex;gap:10px;align-items:center}.chat-input{flex:1;min-width:0;height:52px;border-radius:14px}
        .attach-plus-btn{flex-shrink:0;border-radius:50%}
        .attach-popup{position:absolute;bottom:calc(100% + 12px);left:0;width:min(280px,calc(100vw - 40px));background:#1e1f24;border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:8px;box-shadow:0 16px 40px rgba(0,0,0,0.55);z-index:40;display:flex;flex-direction:column;gap:2px}
        .attach-item{display:flex;align-items:center;gap:12px;width:100%;padding:10px 12px;border-radius:14px;background:transparent;border:none;color:#ffffff;font-size:.95rem;font-weight:500;cursor:pointer;text-align:left;transition:background .15s ease,color .15s ease}
        .attach-item:hover,.attach-item:focus-visible{background:rgba(255,255,255,0.08);outline:none}
        .attach-item.active{background:rgba(255,107,53,0.16);color:#fff}
        .attach-item.active .attach-icon{background:var(--accent);color:#fff}
        .attach-icon{width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,0.08);display:grid;place-items:center;flex-shrink:0;color:#fff}
        .attach-text{flex:1}.attach-check{color:var(--accent);flex-shrink:0}
        .think-badge{background:rgba(255,107,53,0.16)!important;border-color:rgba(255,107,53,0.5)!important;color:#ffd2c2!important}
        .key-state-badge{font-size:.75rem;padding:2px 8px;border-radius:999px;font-weight:600;background:rgba(255,255,255,0.08);color:#ddd}
        .key-state-badge.state-connected{background:rgba(46,204,113,0.18);color:#7ef0b5}
        .key-state-badge.state-testing-connection{background:rgba(255,154,90,0.2);color:#ffd2c2}
        .key-state-badge.state-invalid-api-key,.key-state-badge.state-connection-failed{background:rgba(255,77,77,0.18);color:#ffb3b3}
        .key-state-badge.state-insufficient-credits,.key-state-badge.state-rate-limited{background:rgba(255,193,7,0.18);color:#ffe082}
        .support-note{margin:0;text-align:center;color:var(--text-muted);font-size:.85rem}
        .settings-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:grid;place-items:center;z-index:100;padding:20px}
        .settings-panel{width:min(620px,100%);border-radius:24px;padding:24px;max-height:90vh;overflow:auto}
        .settings-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}.settings-head h2{margin:0;font-size:1.5rem}
        .settings-body{display:flex;flex-direction:column;gap:16px}.setting-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:4px 0}
        .setting-label{font-weight:600}.setting-desc{font-size:.88rem;color:var(--text-muted);margin-top:2px}
        .toggle{width:52px;height:30px;border-radius:999px;background:rgba(255,255,255,0.15);padding:3px;transition:.2s;flex-shrink:0}.toggle span{display:block;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}
        .toggle.on{background:var(--accent)}.toggle.on span{transform:translateX(22px)}.setting-row input[type=range]{width:160px;accent-color:var(--accent)}
        .link-btn{color:var(--accent-2);font-size:.85rem;text-decoration:underline;cursor:pointer}
        @media (max-width:1020px){.assistant-main{grid-template-columns:1fr}.assistant-center{min-height:300px;padding:16px}.assistant-chat{height:auto;min-height:55vh}}
        @media (max-width:720px){.assistant-shell{padding:10px}.assistant-top{flex-direction:column;align-items:stretch;position:static}.top-left,.top-right{justify-content:space-between}.top-right{width:100%}}
      `}</style>
    </PageShell>
  );
}
