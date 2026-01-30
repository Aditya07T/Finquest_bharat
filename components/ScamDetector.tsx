import React, { useState } from 'react';
import { analyzeScamVideo } from '../services/geminiService';

const ScamDetector: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await analyzeScamVideo(file);
      setAnalysis(result);
    } catch (error) {
      console.error(error);
      setAnalysis("Error analyzing video. Please try a shorter clip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-xl shadow p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-orange-800 mb-2 flex items-center gap-2">
            <span className="material-icons">security</span>
            Scam Buster
        </h2>
        <p className="text-sm text-gray-600 mb-4">
            Received a suspicious video promising "Double your money"? Upload it here. Our AI will analyze it for deepfakes and fraud patterns.
        </p>

        <div className="flex flex-col gap-4">
            <input 
                type="file" 
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-orange-100 file:text-orange-700
                    hover:file:bg-orange-200"
            />

            <button
                onClick={handleAnalyze}
                disabled={!file || loading}
                className="bg-orange-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-orange-700 disabled:opacity-50 self-start"
            >
                {loading ? 'Analyzing...' : 'Detect Scam'}
            </button>
        </div>

        {analysis && (
            <div className="mt-6 p-4 bg-white rounded-lg border border-orange-200 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                <h3 className="font-bold mb-2">Analysis Report:</h3>
                {analysis}
            </div>
        )}
    </div>
  );
};

export default ScamDetector;