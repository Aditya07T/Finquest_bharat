import React, { useState, useEffect } from 'react';
import { GameScenario, UserStats, UserTrack } from '../types';
import { generateGameScenario, speakText } from '../services/geminiService';

interface Props {
  track: UserTrack;
  stats: UserStats;
  updateStats: (newStats: Partial<UserStats>) => void;
}

const GameScenarioView: React.FC<Props> = ({ track, stats, updateStats }) => {
  const [scenario, setScenario] = useState<GameScenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadNewScenario = async () => {
    setLoading(true);
    setFeedback(null);
    setScenario(null); // Clear previous scenario to avoid stale state
    try {
      const newScenario = await generateGameScenario(track, stats);
      setScenario(newScenario);
      // Auto-speak for accessibility/rural context
      if (newScenario && newScenario.situation) {
        speakText(newScenario.situation);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load initial scenario
    loadNewScenario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]); // Reload if track changes

  const handleChoice = (optionIndex: number) => {
    if (!scenario || !scenario.options) return;
    const option = scenario.options[optionIndex];
    
    updateStats(option.impact);
    setFeedback(option.feedback);
    speakText(option.feedback); // Audio feedback
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto border-t-8 border-indigo-500">
      <h2 className="text-2xl font-bold mb-4 text-indigo-900 flex items-center gap-2">
        <span className="material-icons">casino</span>
        Decision Time
      </h2>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 animate-pulse">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500">Generating scenario...</p>
        </div>
      ) : scenario ? (
        <>
          <div className="mb-6">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 mb-2">
              {scenario.theme || 'General'}
            </span>
            <p className="text-xl text-gray-800 font-medium leading-relaxed">
              {scenario.situation}
            </p>
          </div>

          {!feedback ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scenario.options && scenario.options.length > 0 ? (
                scenario.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChoice(idx)}
                    className="bg-slate-50 hover:bg-indigo-50 border-2 border-slate-200 hover:border-indigo-500 text-left p-4 rounded-xl transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <p className="font-semibold text-gray-800">{option.text}</p>
                    <div className="mt-2 text-xs text-gray-500 flex gap-2">
                        {option.impact.savings !== 0 && (
                            <span className={option.impact.savings! > 0 ? "text-green-600" : "text-red-600"}>
                                {option.impact.savings! > 0 ? '+' : ''}₹{option.impact.savings}
                            </span>
                        )}
                        {option.impact.happiness !== 0 && (
                             <span className={option.impact.happiness! > 0 ? "text-yellow-600" : "text-gray-600"}>
                                {option.impact.happiness! > 0 ? '+' : ''}{option.impact.happiness}% Happy
                            </span>
                        )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-2 text-center p-4 bg-yellow-50 text-yellow-700 rounded-lg">
                  No options available for this scenario.
                  <button onClick={loadNewScenario} className="block mx-auto mt-2 underline font-bold">Try Another</button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-fade-in">
              <h3 className="text-lg font-bold text-green-800 mb-2">Result</h3>
              <p className="text-gray-700 mb-6">{feedback}</p>
              <button
                onClick={loadNewScenario}
                className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors shadow-lg"
              >
                Next Challenge
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center text-red-500 p-8">
            <p className="mb-4">Failed to load scenario.</p>
            <button 
                onClick={loadNewScenario} 
                className="bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
            >
                Retry
            </button>
        </div>
      )}
    </div>
  );
};

export default GameScenarioView;