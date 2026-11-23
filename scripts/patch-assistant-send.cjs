const fs=require('fs');
const p='src/pages/AssistantPage.tsx';
let s=fs.readFileSync(p,'utf8');
const old=`  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || status === 'processing') return;
    setError(null); stopSpeaking(); recognitionRef.current?.abort(); cleanupAudio();
    const userMsg = { id: uid(), role: 'user' as const, content: trimmed, language, timestamp: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next); setInput(''); setStatus('processing');

    try {
      const res = await sendChatMessage({
        messages: next, language, autoDetect: settings.autoDetectLanguage, mode,
        memories: settings.memoryConsent && user ? (await listMemories(user.uid)).map((m) => m.content) : [],
        documentText: docText || undefined, imageDataUrl: cameraImage || undefined, locationHint: settings.locationHint || undefined,
      });
      const assistantMsg: ChatMessage = { id: uid(), role: 'assistant', content: res.reply, language: res.detectedLanguage, timestamp: Date.now(), suggestions: res.suggestions, error: Boolean(res.error) };
      setMessages((prev) => [...prev, assistantMsg]);
      setLastReply(assistantMsg);
      if (res.error === 'AI_SERVICE_UNAVAILABLE') setError(t('aiError'));
      if (res.memoryCandidate && settings.memoryConsent) setPendingMemory(res.memoryCandidate);
      if (user) { await addMessage(user.uid, conversationId, assistantMsg); await logUsage(user.uid, 'text'); }
      setStatus('speaking');
      await speak(res.reply, res.detectedLanguage);
      setStatus('idle');
      if (continuousRef.current && !res.error) setTimeout(() => { if (continuousRef.current) handleMic(); }, 350);
    } catch {
      setStatus('error'); setError(t('aiError'));
    }
  };`;
const neu=`  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || status === 'processing') return;
    setError(null); stopSpeaking(); recognitionRef.current?.abort(); cleanupAudio();
    const userMsg = { id: uid(), role: 'user' as const, content: trimmed, language, timestamp: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next); setInput(''); setStatus('processing');

    try {
      const res = await sendChatMessage({
        messages: next, language, autoDetect: settings.autoDetectLanguage, mode,
        memories: settings.memoryConsent && user ? (await listMemories(user.uid)).map((m) => m.content) : [],
        documentText: docText || undefined, imageDataUrl: cameraImage || undefined, locationHint: settings.locationHint || undefined,
      });
      const assistantMsg: ChatMessage = { id: uid(), role: 'assistant', content: res.reply, language: res.detectedLanguage, timestamp: Date.now(), suggestions: res.suggestions, error: Boolean(res.error) };
      setMessages((prev) => [...prev, assistantMsg]);
      setLastReply(assistantMsg);
      if (res.error) {
        const reason = res.error === 'AI_NOT_CONFIGURED'
          ? 'AI is not configured on backend (missing AI_API_KEY)'
          : res.error === 'AI_UPSTREAM_ERROR'
            ? 'AI provider request failed; check API key/model/server logs'
            : res.error;
        setError(\`\${t('aiError')} (\${reason})\`);
      }
      if (res.memoryCandidate && settings.memoryConsent) setPendingMemory(res.memoryCandidate);
      if (user) { try { await addMessage(user.uid, conversationId, assistantMsg); await logUsage(user.uid, 'text'); } catch (e) { console.warn('Persist failed', e); } }
      if (res.reply) {
        setStatus('speaking');
        try { await speak(res.reply, res.detectedLanguage); } catch (e) { console.warn('TTS failed', e); }
      }
      setStatus('idle');
      if (continuousRef.current && !res.error) setTimeout(() => { if (continuousRef.current) handleMic(); }, 350);
    } catch (e) {
      console.error('Chat send failed', e);
      setStatus('error');
      setError(e instanceof Error ? \`\${t('aiError')} (\${e.message})\` : t('aiError'));
    }
  };`;
if(!s.includes(old)){console.error('old not found'); process.exit(1);}
s=s.replace(old,neu);
fs.writeFileSync(p,s); console.log('ok');