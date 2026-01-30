import { GoogleGenAI, Type, Modality } from "@google/genai";
import { GameScenario, UserTrack } from "../types";

// Initialize AI client
// Note: For Veo/Pro Vision requests, we will re-instantiate with the selected key if needed
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Scenario Generation (Standard Flash) ---
export const generateGameScenario = async (track: UserTrack, currentStats: any): Promise<GameScenario> => {
  const ai = getAiClient();
  const prompt = `
    Create a financial literacy game scenario for a ${track}.
    Current Stats: Savings ₹${currentStats.savings}, Knowledge ${currentStats.knowledge}/100.
    Themes: Budgeting, Savings, Scams, Investments.
    
    Output strictly in JSON format matching this schema:
    {
      "id": "unique_id",
      "situation": "A concise description of the situation (max 30 words).",
      "theme": "Savings" | "Budgeting" | "Scam" | "Investment",
      "options": [
        {
          "text": "Action choice 1",
          "impact": { "savings": number, "happiness": number, "knowledge": number },
          "feedback": "Short consequence explanation."
        },
        {
          "text": "Action choice 2",
          "impact": { "savings": number, "happiness": number, "knowledge": number },
          "feedback": "Short consequence explanation."
        }
      ]
    }
  `;

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              situation: { type: Type.STRING },
              theme: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: { type: Type.STRING },
                    feedback: { type: Type.STRING },
                    impact: {
                      type: Type.OBJECT,
                      properties: {
                        savings: { type: Type.NUMBER },
                        happiness: { type: Type.NUMBER },
                        knowledge: { type: Type.NUMBER },
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text) as GameScenario;
        // Safety check to ensure options exist
        if (!parsed.options) {
            parsed.options = [];
        }
        return parsed;
      }
      throw new Error("Empty response text");
  } catch (error) {
      console.error("Gemini Generation Error:", error);
      // Fallback scenario to prevent crash
      return {
          id: "fallback",
          situation: "You found ₹500 on the street. What do you do?",
          theme: "Savings",
          options: [
              {
                  text: "Save it",
                  impact: { savings: 500, happiness: 5, knowledge: 0 },
                  feedback: "Good start to an emergency fund!"
              },
              {
                  text: "Spend it on treats",
                  impact: { savings: 0, happiness: 10, knowledge: 0 },
                  feedback: "Fun for now, but money is gone."
              }
          ]
      };
  }
};

// --- Thinking Mode (Complex Planning) ---
export const getFinancialPlan = async (query: string, track: UserTrack) => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `I am a ${track}. ${query}. Provide a detailed, step-by-step financial plan.`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 } // Max thinking for deep reasoning
    }
  });
  return response.text || "I couldn't generate a plan right now.";
};

// --- Scam Detection (Video Understanding) ---
export const analyzeScamVideo = async (videoFile: File): Promise<string> => {
  const ai = getAiClient();
  
  // Convert File to Base64
  const base64Data = await fileToBase64(videoFile);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: videoFile.type,
            data: base64Data
          }
        },
        { text: "Analyze this video for potential financial scams, deepfakes, or fraudulent promises. Be specific about red flags." }
      ]
    }
  });

  return response.text || "Analysis complete, but no text returned.";
};

// --- Vision Board (Image Gen/Edit) ---
export const generateVisionImage = async (prompt: string): Promise<string> => {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: { aspectRatio: "1:1" } // Nano banana supports this
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      // Use the returned mimeType if available, or default to png
      const mimeType = part.inlineData.mimeType || 'image/png';
      return `data:${mimeType};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const editVisionImage = async (base64Image: string, editInstruction: string): Promise<string> => {
  const ai = getAiClient();
  // Strip prefix if present for API
  // Regex to capture mime type just in case we want to reuse it, though API usually wants the data
  const matches = base64Image.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
  const cleanBase64 = matches ? matches[2] : base64Image;
  const mimeType = matches ? matches[1] : 'image/png';
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: cleanBase64
          }
        },
        { text: editInstruction }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      const respMime = part.inlineData.mimeType || 'image/png';
      return `data:${respMime};base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No edited image generated");
};

// --- Veo Video Generation ---
export const generateVeoVideo = async (base64Image: string): Promise<string> => {
  // Ensure we have the latest key (Veo requirement)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY }); 
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    image: {
      imageBytes: cleanBase64,
      mimeType: 'image/png',
    },
    prompt: "Cinematic slow motion success moment, high quality, inspiring financial success",
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");

  // Fetch the actual video blob
  const videoRes = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await videoRes.blob();
  return URL.createObjectURL(blob);
};

// --- Text to Speech ---
export const speakText = async (text: string): Promise<void> => {
  try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Puck' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
      }
  } catch (e) {
      console.warn("TTS failed:", e);
  }
};

// --- Helper Utilities ---

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const res = reader.result as string;
        // Remove data URL prefix for API calls usually, but keep for some, handled in caller
        const base64 = res.split(',')[1];
        resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext
): Promise<AudioBuffer> {
  try {
      // Try native decode first (if WAV header exists)
      return await ctx.decodeAudioData(data.buffer.slice(0)); 
  } catch (e) {
       // Fallback for raw PCM (assuming 24kHz mono based on TTS docs)
       const sampleRate = 24000;
       const numChannels = 1;
       const dataInt16 = new Int16Array(data.buffer);
       const frameCount = dataInt16.length / numChannels;
       const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
       for (let channel = 0; channel < numChannels; channel++) {
         const channelData = buffer.getChannelData(channel);
         for (let i = 0; i < frameCount; i++) {
           channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
         }
       }
       return buffer;
  }
}