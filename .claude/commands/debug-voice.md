Help me diagnose a voice input problem in Mathe Blaster.

First ask me to describe the symptom precisely:
- Is recognition not starting at all?
- Are numbers being detected but not firing?
- Is echo suppression blocking valid answers?
- Is a specific language or number not parsing?
- Is the trigger word not working?

Then read js/voice.js in full.

Based on the symptom, guide me through the relevant subsystem:

**Not starting**: Check browser support (SpeechRecognition vs webkitSpeechRecognition), microphone permission flow (onerror: not-allowed), and whether recognition.start() throws InvalidStateError.

**Numbers not firing in trigger mode**: Check _triggerMode and _triggerWord. Explain that in trigger mode a number alone is ignored — the trigger word must precede it. Show the relevant handleTranscript logic.

**Echo suppression too aggressive**: Explain the three filter layers (resultsMuted, _echoNumberGuardUntil, _echoPhraseGuardUntil, looksLikePureEcho). Show how setTTSEchoFilter is called and what grace windows are set. Check if the filter times need adjusting.

**Specific number not parsing**: Run the parseNumber() function logic manually for the failing input. Check WORD_MAP for the language. Check if noise stripping is over-removing.

**Android streaming partial problem**: Explain PARTIAL_DELAY_MS (320ms) and how conf=0 results are held briefly. Check if the symptom matches the "2 * 11 22" streaming pattern.

Suggest console.log lines to add for debugging, and explain what the [Voice:t] timing trace output means.
