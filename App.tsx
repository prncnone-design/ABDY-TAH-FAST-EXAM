
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

  const isLoading = loadingStatus !== 'idle';

  // Load history on mount
  useEffect(() => {
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

  const handleProcessInput = async (text: string) => {
    setLoadingStatus('parsing');
    setError(null);
    try {
      const parsedExam = await parseExamFromText(text);
      setExam(parsedExam);
      
      // Add to history if not exists (though mostly new exams will be unique by ID)
      setHistory(prev => {
        const exists = prev.find(h => h.id === parsedExam.id);
        if (exists) return prev;
        return [parsedExam, ...prev];
      });
    } catch (err) {
      setError("Failed to process the exam data. Please ensure the input is clear.");
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
    // Also update current exam if it's the one being renamed
    if (exam && exam.id === id) {
      setExam(prev => prev ? { ...prev, title: newTitle } : null);
    }
  };

  const handleDeleteExam = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (exam && exam.id === id) {
      // Optional: Clear current exam if deleted? Or just leave it as active session.
      // Let's leave it, but user can't reload it from history once deleted.
    }
  };

  const handleSubmitExam = async (answers: Record<string, string>) => {
    if (!exam) return;
    setLoadingStatus('grading');
    try {
      const grading = await gradeExam(exam, answers);
      setResults(grading);
    } catch (err) {
      setError("Failed to grade the exam. Please try again.");
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
