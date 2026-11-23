const fs=require('fs');
const p='src/pages/AssistantPage.tsx';
let s=fs.readFileSync(p,'utf8');
const old=`    try {
      const convoId = await ensureConversation();
      if (user && convoId && settings.saveHistory) await saveMessage(user.uid, convoId, userMsg);
      const res = await sendChatMessage({
        messages: nextMessages, language: userLang, autoDetect: settings.autoDetectLanguage,
        mode: activeMode, memories: settings.memoryConsent ? memories : [], documentText: docText, imageDataUrl, locationHint,
      });
      const replyLang = (res.detectedLanguage || userLang) as LanguageCode;
      if (settings.autoDetectLanguage && replyLang !== language) { setLanguage(replyLang); updateSettings({ preferredLanguage: replyLang }); }
      const assistantMsg: ChatMessage = { id: uid(), role: 'assistant', content: res.reply, language: replyLang, timestamp: Date.now(), suggestions: res.suggestions, error: res.error === 'AI_SERVICE_UNAVAILABLE' };
      setMessages((prev) => [...prev, assistantMsg]);
      if (user && convoId && settings.saveHistory) await saveMessage(user.uid, convoId, assistantMsg);
      if (res.error === 'AI_SERVICE_UNAVAILABLE') setError(t('aiError'));
      if (settings.memoryConsent && res.memoryCandidate) setMemoryCandidate(res.memoryCandidate);
      await logUsage(user?.uid || null, 'assistant_reply', { mode: activeMode });
      await speak(res.reply, replyLang);
    } catch {
      setStatus('error'); setError(t('aiError'));
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: t('aiError'), language, timestamp: Date.now(), error: true, suggestions: [t('retry')] }]);
    }`;
const neu=`    try {
      const convoId = await ensureConversation();
      if (user && convoId && settings.saveHistory) await saveMessage(user.uid, convoId, userMsg).catch((e) => console.warn('Save user msg failed', e));
      const res = await sendChatMessage({
        messages: nextMessages, language: userLang, autoDetect: settings.autoDetectLanguage,
        mode: activeMode, memories: settings.memoryConsent ? memories : [], documentText: docText, imageDataUrl, locationHint,
      });
      const replyLang = (res.detectedLanguage || userLang) as LanguageCode;
      if (settings.autoDetectLanguage && replyLang !== language) { setLanguage(replyLang); updateSettings({ preferredLanguage: replyLang }); }
      const assistantMsg: ChatMessage = { id: uid(), role: 'assistant', content: res.reply, language: replyLang, timestamp: Date.now(), suggestions: res.suggestions, error: Boolean(res.error) };
      setMessages((prev) => [...prev, assistantMsg]);
      if (user && convoId && settings.saveHistory) await saveMessage(user.uid, convoId, assistantMsg).catch((e) => console.warn('Save assistant msg failed', e));
      if (res.error) {
        const reason = res.error === 'AI_NOT_CONFIGURED' ? 'Missing AI_API_KEY on backend'
          : res.error === 'AI_UPSTREAM_ERROR' ? 'AI provider/key/model error - check server logs'
          : res.error;
        setError(\`\${t('aiError')} (\${reason})\`);
      }
      if (settings.memoryConsent && res.memoryCandidate) setMemoryCandidate(res.memoryCandidate);
      await logUsage(user?.uid || null, 'assistant_reply', { mode: activeMode }).catch(() => {});
      if (res.reply) { try { await speak(res.reply, replyLang); } catch (e) { console.warn('TTS failed', e); setStatus('idle'); } }
      else setStatus('idle');
    } catch (e) {
      console.error('Chat send failed', e);
      const msg = e instanceof Error ? e.message : String(e);
      setStatus('error'); setError(\`\${t('aiError')} (\${msg})\`);
      setMessages((prev) => [...prev, { id: uid(), role: 'assistant', content: t('aiError'), language, timestamp: Date.now(), error: true, suggestions: [t('retry')] }]);
    }`;
if(!s.includes(old)){console.error('old not found'); process.exit(1);}
s=s.replace(old,neu);
fs.writeFileSync(p,s); console.log('ok');