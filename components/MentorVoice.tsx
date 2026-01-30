import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { UserTrack } from '../types';

interface Props {
  track: UserTrack;
}

const MentorVoice: React.FC<Props> = ({ track }) => {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState("Ready to connect");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sessionRef = useRef<any>(null); // Keep track of session to close it
  
  // Audio Context Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const stopSession = () => {
      if (sessionRef.current) {
          // No explicit close method on the promise wrapper easily accessible without keeping the session obj
          // Usually handled by closing contexts or reloading in simple demos. 
          // Ideally we would send a close signal if the API supported it cleanly, or just stop media tracks.
          sessionRef.current = null;
      }
      if (inputContextRef.current) inputContextRef.current.close();
      if (outputContextRef.current) outputContextRef.current.close();
      setActive(false);
      setStatus("Disconnected");
  };

  const startSession = async () => {
    setActive(true);
    setStatus("Connecting to Mentor...");

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Setup Audio Contexts
    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    inputContextRef.current = inputAudioContext;
    outputContextRef.current = outputAudioContext;

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Connect to Live API
    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-12-2025',
      callbacks: {
        onopen: () => {
          setStatus("Connected! Say 'Hello Mentor'.");
          
          // Audio Input Stream Processing
          const source = inputAudioContext.createMediaStreamSource(stream);
          const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
          
          scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
            
            // Encode to PCM 16
            const l = inputData.length;
            const int16 = new Int16Array(l);
            for (let i = 0; i < l; i++) {
              int16[i] = inputData[i] * 32768;
            }
            const pcmData = new Uint8Array(int16.buffer);
            
            // Base64 encode manually
            let binary = '';
            const len = pcmData.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(pcmData[i]);
            }
            const b64 = btoa(binary);

            sessionPromise.then((session) => {
              session.sendRealtimeInput({ 
                  media: {
                      mimeType: 'audio/pcm;rate=16000',
                      data: b64
                  }
               });
            });
          };
          
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputAudioContext.destination);
        },
        onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
                // Decode
                const binaryString = atob(base64Audio);
                const len = binaryString.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                
                const dataInt16 = new Int16Array(bytes.buffer);
                const frameCount = dataInt16.length; 
                const buffer = outputAudioContext.createBuffer(1, frameCount, 24000);
                const channelData = buffer.getChannelData(0);
                for (let i = 0; i < frameCount; i++) {
                    channelData[i] = dataInt16[i] / 32768.0;
                }

                // Play
                const source = outputAudioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(outputAudioContext.destination);
                
                // Scheduling
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buffer.duration;
                
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
        },
        onclose: () => setStatus("Connection Closed"),
        onerror: (e) => {
            console.error(e);
            setStatus("Error occurred");
        }
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
        },
        systemInstruction: `You are a friendly, rural-aware financial mentor for a ${track}. Keep advice simple, encouraging, and short. Speak in a warm tone.`
      }
    });

    sessionRef.current = sessionPromise;
  };

  useEffect(() => {
      return () => {
          stopSession();
      };
  }, []);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-xl shadow-xl p-8 max-w-2xl mx-auto flex flex-col items-center">
      <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mb-6 relative">
          {active && <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-50"></div>}
          <span className="material-icons text-5xl">mic</span>
      </div>
      
      <h2 className="text-3xl font-bold mb-2">Mentor Live</h2>
      <p className="text-indigo-200 mb-8">{status}</p>
      
      {!active ? (
        <button 
            onClick={startSession}
            className="bg-white text-indigo-700 font-bold py-3 px-8 rounded-full shadow-lg hover:bg-indigo-50 transition-all transform hover:scale-105"
        >
            Start Conversation
        </button>
      ) : (
        <button 
            onClick={stopSession}
            className="bg-red-500 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-red-600 transition-all"
        >
            End Call
        </button>
      )}
      
      <p className="mt-6 text-sm text-indigo-200 text-center max-w-md">
         Ask about: "How to save ₹500/month?", "Is crypto safe?", "How to open a bank account?"
      </p>
    </div>
  );
};

export default MentorVoice;