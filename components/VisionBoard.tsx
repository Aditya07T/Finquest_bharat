import React, { useState } from 'react';
import { generateVisionImage, editVisionImage, generateVeoVideo } from '../services/geminiService';

const VisionBoard: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
      if (mode === 'create') {
        const img = await generateVisionImage(prompt + ", photorealistic, high quality");
        setImage(img);
        setMode('edit');
        setPrompt(''); // Clear for edit instruction
      } else if (mode === 'edit' && image) {
        const img = await editVisionImage(image, prompt);
        setImage(img);
        setPrompt('');
      }
    } catch (e) {
      alert("Failed to generate/edit image");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVeo = async () => {
    if (!image) return;
    
    // Check/Request API Key for Veo
    if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
            // Race condition mitigation: assume success or retry
        }
    }

    setLoading(true);
    try {
      const videoUrl = await generateVeoVideo(image);
      setVideo(videoUrl);
    } catch (e) {
        alert("Veo generation failed. Ensure you selected a paid project key.");
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Financial Vision Board</h2>
      
      <div className="flex gap-4 mb-6 flex-col md:flex-row">
        <div className="flex-1">
            <div className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-slate-300">
                {loading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                ) : video ? (
                    <video src={video} controls autoPlay loop className="w-full h-full object-cover" />
                ) : image ? (
                    <img src={image} alt="Vision" className="w-full h-full object-cover" />
                ) : (
                    <p className="text-gray-400 text-center p-4">Your dream visualization appears here</p>
                )}
            </div>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-4">
            <p className="text-sm text-gray-600">
                {mode === 'create' 
                    ? "Visualize your financial goal (e.g., 'A small organic farm house', 'A modern laptop for college')." 
                    : "Refine your dream (e.g., 'Add a bicycle outside', 'Make it sunset')."}
            </p>
            
            <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'create' ? "Describe your dream..." : "Describe the change..."}
                className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={3}
            />

            <button 
                onClick={handleGenerate}
                disabled={loading || !prompt}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
            >
                {mode === 'create' ? 'Generate Vision' : 'Edit Vision'}
            </button>

            {image && !video && (
                <button 
                    onClick={handleVeo}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 flex items-center justify-center gap-2"
                >
                    <span className="material-icons text-sm">movie</span>
                    Bring to Life (Veo)
                </button>
            )}
            
            {image && (
                <button onClick={() => { setImage(null); setVideo(null); setMode('create'); }} className="text-xs text-gray-500 underline">
                    Start Over
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default VisionBoard;