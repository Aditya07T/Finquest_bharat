import React, { useState } from 'react';
import { UserStats, UserTrack } from './types';
import GameScenarioView from './components/GameScenario';
import MentorVoice from './components/MentorVoice';
import VisionBoard from './components/VisionBoard';
import ScamDetector from './components/ScamDetector';
import ThinkingPlanner from './components/ThinkingPlanner';

function App() {
  const [track, setTrack] = useState<UserTrack>(UserTrack.STUDENT);
  const [activeTab, setActiveTab] = useState<'play' | 'mentor' | 'vision' | 'scam' | 'plan'>('play');
  
  const [stats, setStats] = useState<UserStats>({
    savings: 1000,
    happiness: 50,
    knowledge: 20,
  });

  const updateStats = (impact: Partial<UserStats>) => {
    setStats(prev => ({
      savings: Math.max(0, prev.savings + (impact.savings || 0)),
      happiness: Math.min(100, Math.max(0, prev.happiness + (impact.happiness || 0))),
      knowledge: Math.min(100, Math.max(0, prev.knowledge + (impact.knowledge || 0))),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-20">
      {/* Header */}
      <header className="bg-indigo-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h1 className="text-xl font-bold tracking-tight">FinQuest Bharat</h1>
          </div>
          
          {/* Stats Bar */}
          <div className="flex gap-4 bg-indigo-800/50 px-4 py-2 rounded-full text-sm font-medium">
            <div className="flex items-center gap-1">
              <span className="text-green-300">₹</span> {stats.savings}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-300">😊</span> {stats.happiness}%
            </div>
            <div className="flex items-center gap-1">
              <span className="text-blue-300">🧠</span> {stats.knowledge}%
            </div>
          </div>

          <select 
            value={track} 
            onChange={(e) => setTrack(e.target.value as UserTrack)}
            className="bg-indigo-700 text-white text-sm rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value={UserTrack.STUDENT}>Track: Student</option>
            <option value={UserTrack.YOUNG_ADULT}>Track: Young Adult</option>
          </select>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide md:justify-center">
            {[
                { id: 'play', label: 'Play', icon: 'sports_esports' },
                { id: 'mentor', label: 'Mentor', icon: 'mic' },
                { id: 'plan', label: 'Planner', icon: 'psychology' },
                { id: 'vision', label: 'Vision', icon: 'image' },
                { id: 'scam', label: 'Scam Check', icon: 'security' },
            ].map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold whitespace-nowrap transition-all ${
                        activeTab === tab.id 
                        ? 'bg-indigo-600 text-white shadow-lg scale-105' 
                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                    }`}
                >
                    <span className="material-icons text-lg">{tab.icon}</span>
                    {tab.label}
                </button>
            ))}
        </div>

        <div className="transition-all duration-300">
            {activeTab === 'play' && (
                <div className="space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Your Journey Begins</h2>
                        <p className="text-gray-500">Make choices, learn from consequences, and grow your wealth.</p>
                    </div>
                    <GameScenarioView track={track} stats={stats} updateStats={updateStats} />
                </div>
            )}

            {activeTab === 'mentor' && (
                <div className="space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Voice Mentor</h2>
                        <p className="text-gray-500">Talk to your AI financial guide in real-time.</p>
                    </div>
                    <MentorVoice track={track} />
                </div>
            )}

            {activeTab === 'plan' && (
                <div className="space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Deep Planner</h2>
                        <p className="text-gray-500">Create long-term strategies for complex goals.</p>
                    </div>
                    <ThinkingPlanner track={track} />
                </div>
            )}

            {activeTab === 'vision' && (
                <div className="space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Dream Board</h2>
                        <p className="text-gray-500">Visualize your financial goals and bring them to life.</p>
                    </div>
                    <VisionBoard />
                </div>
            )}

            {activeTab === 'scam' && (
                <div className="space-y-6">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">Safety Center</h2>
                        <p className="text-gray-500">Upload suspicious content to verify its authenticity.</p>
                    </div>
                    <ScamDetector />
                </div>
            )}
        </div>
      </main>
      
      {/* Material Icons Import (via CDN for simplicity in this constrained env) */}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </div>
  );
}

export default App;