
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ExamView from './components/ExamView';
import ResultsOverlay from './components/ResultsOverlay';
import { Exam, GradingResult } from './types';
import { parseExamFromText, gradeExam } from './geminiService';

const App: React.FC = () => {
  // Loading state: idle | parsing | grading
  const [loadingStatus, setLoadingStatus] = useState<'idle' | 'parsing' | 'grading'>('idle');
  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Exam[]>([]);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [manualKey, setManualKey] = useState('');

  const isLoading = loadingStatus !== 'idle';

  // Check for API Key on mount
  useEffect(() => {
    // We can't access getApiKey directly here easily without importing logic, 
    // but we can check the artifacts it looks for.
    const hasKey = 
      (typeof window !== 'undefined' && (
        localStorage.getItem("gemini_api_key") || 
        new URLSearchParams(window.location.search).get('key') ||
        // @ts-ignore
        (window.process?.env?.API_KEY)
      ));
    
    setApiKeyMissing(!hasKey);

    // Load history
    const saved = localStorage.getItem('exam_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('exam_history', JSON.stringify(history));
  }, [history]);

  const handleSaveKey = () => {
    if (manualKey.trim()) {
      localStorage.setItem('gemini_api_key', manualKey.trim());
      window.location.reload();
    }
  };

  const handleProcessInput = async (text: string) => {
    setLoadingStatus('parsing');
    setError(null);
    try {
      const parsedExam = await parseExamFromText(text);
      setExam(parsedExam);
      setApiKeyMissing(false); // If successful, key is definitely there
      
      // Add to history
      setHistory(prev => {
        const exists = prev.find(h => h.id === parsedExam.id);
        if (exists) return prev;
        return [parsedExam, ...prev];
      });
    } catch (err: any) {
      setError(err.message || "Failed to process the exam data.");
      // Check if error is related to key
      if (err.message?.includes('Key')) {
        setApiKeyMissing(true);
      }
      console.error(err);
    } finally {
      setLoadingStatus('idle');
    }
  };

  const handleLoadExam = (selectedExam: Exam) => {
    setExam(selectedExam);
    setResults(null);
    setError(null);
  };

  const handleRenameExam = (id: string, newTitle: string) => {
    setHistory(prev => prev.map(item => 
      item.id === id ? { ...item, title: newTitle } : item
    ));
    if (exam && exam.id === id) {
      setExam(prev => prev ? { ...prev, title: newTitle } : null);
    }
  };

  const handleDeleteExam = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  const handleSubmitExam = async (answers: Record<string, string>) => {
    if (!exam) return;
    setLoadingStatus('grading');
    try {
      const grading = await gradeExam(exam, answers);
      setResults(grading);
    } catch (err: any) {
      setError(err.message || "Failed to grade the exam. Please try again.");
    } finally {
      setLoadingStatus('idle');
    }
  };

  const reset = () => {
    setExam(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pb-20">
      <Header onLogoClick={reset} />
      
      {/* Warning Banner for Vercel/Static Deployments */}
      {apiKeyMissing && (
        <div className="w-full bg-slate-900 border-b border-slate-800 p-4 text-center text-sm text-white shadow-lg z-50 flex flex-col md:flex-row items-center justify-center gap-4 animate-in slide-in-from-top duration-300">
           <div className="flex items-center gap-2 text-yellow-400 font-bold shrink-0">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             <span>AI Setup Required</span>
           </div>
           
           <div className="flex items-center gap-2 w-full max-w-lg">
             <input 
               type="password" 
               placeholder="Paste Gemini API Key here..."
               value={manualKey}
               onChange={(e) => setManualKey(e.target.value)}
               className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
               onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
             />
             <button 
               onClick={handleSaveKey}
               disabled={!manualKey.trim()}
               className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold transition-colors"
             >
               Save
             </button>
           </div>

           <a 
             href="https://aistudio.google.com/app/apikey" 
             target="_blank" 
             rel="noopener noreferrer"
             className="text-xs text-slate-400 hover:text-white underline decoration-slate-600 hover:decoration-white transition-all shrink-0"
           >
             Get Free API Key &rarr;
           </a>
        </div>
      )}

      <main className="w-full max-w-6xl px-4 mt-8 flex-1">
        {isLoading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-300">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
            <p className="mt-4 text-slate-600 font-bold text-lg animate-pulse">
              {loadingStatus === 'parsing' ? 'Constructing Precision Exam...' : 'Analyzing & Grading Performance...'}
            </p>
            <p className="text-sm text-slate-400 mt-2">Powered by Gemini 3.0 Pro</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3 animate-in slide-in-from-top-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {!exam ? (
          <InputSection 
            onProcess={handleProcessInput} 
            disabled={isLoading}
            history={history}
            onLoadExam={handleLoadExam}
            onRenameExam={handleRenameExam}
            onDeleteExam={handleDeleteExam}
          />
        ) : (
          <ExamView 
            exam={exam} 
            onSubmit={handleSubmitExam} 
            disabled={isLoading}
          />
        )}
      </main>

      {results && (
        <ResultsOverlay 
          results={results} 
          exam={exam!} 
          onClose={() => setResults(null)} 
          onReset={reset}
        />
      )}
    </div>
  );
};

export default App;
