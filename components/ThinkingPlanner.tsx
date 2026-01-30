import React, { useState } from 'react';
import { getFinancialPlan } from '../services/geminiService';
import { UserTrack } from '../types';

interface Props {
    track: UserTrack;
}

const ThinkingPlanner: React.FC<Props> = ({ track }) => {
    const [query, setQuery] = useState('');
    const [plan, setPlan] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePlan = async () => {
        if (!query) return;
        setLoading(true);
        try {
            const result = await getFinancialPlan(query, track);
            setPlan(result);
        } catch (e) {
            console.error(e);
            setPlan("Sorry, the planning service is currently unavailable.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-800 text-slate-100 rounded-xl shadow-xl p-6 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
                <span className="material-icons text-blue-400">psychology</span>
                <h2 className="text-xl font-bold">Deep Financial Planner</h2>
            </div>
            
            <p className="text-slate-400 text-sm mb-4">
                Powered by Gemini 3.0 Thinking Mode. Ask complex questions like "How can I save ₹10 Lakhs in 5 years with a ₹25k salary?"
            </p>

            <div className="flex gap-2 mb-6">
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask a complex financial question..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
                <button 
                    onClick={handlePlan}
                    disabled={loading || !query}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold disabled:opacity-50"
                >
                    {loading ? 'Thinking...' : 'Plan'}
                </button>
            </div>

            {loading && (
                <div className="animate-pulse space-y-2">
                    <div className="h-2 bg-slate-600 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-600 rounded w-1/2"></div>
                    <div className="h-2 bg-slate-600 rounded w-5/6"></div>
                </div>
            )}

            {plan && !loading && (
                <div className="bg-slate-700/50 p-4 rounded-lg text-sm leading-7 whitespace-pre-wrap border-l-4 border-blue-500">
                    {plan}
                </div>
            )}
        </div>
    );
};

export default ThinkingPlanner;