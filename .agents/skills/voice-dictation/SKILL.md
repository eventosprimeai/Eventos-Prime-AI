---
name: voice-dictation
description: "When the user wants to add continuous voice dictation (microphone functionality) to any input or textarea."
---

# Voice Dictation Skill (SpeechRecognition)

Use this skill whenever the user asks to "add voice dictation", "agregar micrófono", "dictado por voz", or integrate continuous speech-to-text into a form.

## Steps to Execute:

1. **Add Required States**:
   Establish React states to manage the recording status and a reference for the speech recognition instance. Add the following to the target component:
   ```tsx
   import { useState, useRef } from "react";
   
   const [isRecording, setIsRecording] = useState(false);
   const recognitionRef = useRef<any>(null);
   ```

2. **Wrap the Input/Textarea**:
   Ensure the target input or textarea is wrapped in a `div` with `display: "flex", gap: "var(--space-2)", alignItems: "flex-start"` to align the field with the microphone button side-by-side.

3. **Inject the Microphone Logic**:
   Insert the following button next to the input field. Pay close attention to updating the `YOUR_STATE` and `SET_YOUR_STATE` variables to match the component's state structure (for example `form.description` and `setForm({...form, description: text})`).

   ```tsx
   <button type="button" onClick={() => {
       if (isRecording) {
           if (recognitionRef.current) {
               const rec = recognitionRef.current;
               recognitionRef.current = null; // Mark as manually stopped
               rec.stop();
           }
           setIsRecording(false);
           return;
       }
       const windowAny = window as any;
       const SpeechRecognition = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;
       if (!SpeechRecognition) {
           alert("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.");
           return;
       }
       const recognition = new SpeechRecognition();
       recognitionRef.current = recognition;
       recognition.lang = 'es-ES'; // Modificar si el idioma es otro
       recognition.continuous = true;
       recognition.interimResults = true;
       
       // WARNING: Modify 'YOUR_STATE' to map directly to the text variable you want to append to
       const startingText = YOUR_STATE ? YOUR_STATE + " " : "";
       
       recognition.onstart = () => setIsRecording(true);
       recognition.onend = () => {
           // Auto-restart to bypass Chrome's aggressive 'no-speech' cancellation during long pauses
           if (recognitionRef.current) {
               try { recognitionRef.current.start(); } catch (e) { }
           } else {
               setIsRecording(false);
           }
       };
       recognition.onerror = (e: any) => {
           // Si el usuario deniega permisos o no tiene micro
           if (e.error === 'not-allowed' || e.error === 'not-supported') {
               recognitionRef.current = null;
               setIsRecording(false);
               alert("Error de micrófono: " + e.error);
           }
       };
       recognition.onresult = (evt: any) => {
           let finalSegment = "";
           let interimSegment = "";
           for (let i = 0; i < evt.results.length; ++i) {
               if (evt.results[i].isFinal) {
                   finalSegment += evt.results[i][0].transcript;
               } else {
                   interimSegment += evt.results[i][0].transcript;
               }
           }
           // WARNING: Update this setter function
           SET_YOUR_STATE(startingText + finalSegment + interimSegment);
       };
       recognition.start();
   }} style={{ width: 44, height: 44, borderRadius: "50%", background: isRecording ? "rgba(255, 60, 60, 0.2)" : "var(--color-bg-elevated)", border: `1px solid ${isRecording ? "red" : "var(--color-border)"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, fontSize: "1.2rem", transition: "all 0.2s ease", color: "var(--color-text-primary)" }}>
       🎤
   </button>
   ```

4. **Verify Behavior**:
   Ensure `recognitionRef.current = null` correctly stops the loop, while `onend` correctly invokes `.start()` when the recording state is still active, protecting the continuous behavior.
