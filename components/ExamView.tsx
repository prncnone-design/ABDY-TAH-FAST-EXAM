
import React, { useState, useMemo, useEffect } from 'react';
import { Exam, QuestionType } from '../types';

interface ExamViewProps {
  exam: Exam;
  onSubmit: (answers: Record<string, string>) => void;
  disabled: boolean;
}

const ExamView: React.FC<ExamViewProps> = ({ exam, onSubmit, disabled }) => {
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState<Set<string>>(new Set());
  // Default duration: 90 seconds per question
  const [timeLeft, setTimeLeft] = useState(exam.questions.length * 90);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [matchingState, setMatchingState] = useState<Record<string, Record<string, string>>>({});

  // Memoized options for matching questions
  const matchingOptions = useMemo(() => {
    const optionsMap: Record<string, { id: string; text: string }[]> = {};
    exam.questions.forEach(q => {
      if (q.type === QuestionType.MATCHING && q.matchingPairs) {
        const rightSide = q.matchingPairs.map(p => p.right);
        // Shuffle
        const shuffled = [...rightSide].sort(() => Math.random() - 0.5);
        // Assign IDs (A, B, C...)
        optionsMap[q.id] = shuffled.map((text, idx) => ({
          id: String.fromCharCode(65 + idx),
          text
        }));
      }
    });
    return optionsMap;
  }, [exam.id]);

  // Security: Prevent Copy/Paste/Context Menu
  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('paste', preventDefault);
    
    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('paste', preventDefault);
    };
  }, []);

  // Timer
  useEffect(() => {
    if (disabled || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [disabled, timeLeft]);

  // Handlers
  const handleInputChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMatchingChange = (questionId: string, leftItem: string, rightValue: string) => {
    setMatchingState(prev => {
      const qState = prev[questionId] || {};
      const newState = { ...qState, [leftItem]: rightValue };
      const rightText = matchingOptions[questionId].find(o => o.id === rightValue)?.text || "";
      const jsonAnswer = JSON.stringify({ ...qState, [leftItem]: rightText });
      handleInputChange(questionId, jsonAnswer);
      return { ...prev, [questionId]: newState };
    });
  };

  const toggleFlag = (questionId: string) => {
    setFlags(prev => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = exam.questions[currentIndex];
  const progress = Math.round((Object.keys(answers).length / exam.questions.length) * 100);

  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col z-50 overflow-hidden">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-8 shrink-0 relative z-20">
        <div className="flex items-center gap-4 w-1/3">
          <div className="flex items-center gap-2">
            <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded">
              Q{currentIndex + 1}
            </span>
            <span className="text-slate-400 text-sm font-medium hidden sm:inline">
              of {exam.questions.length}
            </span>
          </div>
          {/* Mobile Progress Text */}
          <span className="text-xs font-bold text-emerald-600 sm:hidden">{progress}% Done</span>
        </div>

        <div className="flex flex-col items-center justify-center w-1/3">
          <div className={`text-xl font-mono font-black tracking-wider ${timeLeft < 60 ? 'text-red-600 animate-pulse' : 'text-slate-800'}`}>
            {formatTime(timeLeft)}
          </div>
          <div className="w-full max-w-[120px] h-1 bg-slate-100 rounded-full mt-1 hidden sm:block overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex justify-end w-1/3 gap-3">
          <button 
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
            className={`p-2 rounded-lg transition-colors relative ${isPaletteOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
          >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
             {/* Badge for flagged count */}
             {flags.size > 0 && (
               <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-white"></span>
             )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 sm:p-10 min-h-[50vh] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-2 duration-300" key={currentQuestion.id}>
          
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-800 leading-relaxed">
              {currentQuestion.questionText}
            </h3>
            <button
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`shrink-0 ml-4 p-2 rounded-full transition-all ${flags.has(currentQuestion.id) ? 'text-yellow-500 bg-yellow-50' : 'text-slate-300 hover:bg-slate-50'}`}
              title="Mark for review"
            >
              <svg className={`w-6 h-6 ${flags.has(currentQuestion.id) ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8l-6-2.5L3 21z" /></svg>
            </button>
          </div>

          <div className="mt-4">
            {/* Question Type Logic */}
            {currentQuestion.type === QuestionType.MCQ && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((opt) => {
                  const isSelected = answers[currentQuestion.id] === opt;
                  return (
                    <label 
                      key={opt} 
                      className={`flex items-center gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all group ${isSelected ? 'border-red-600 bg-red-50/50' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-red-600 bg-red-600' : 'border-slate-300 group-hover:border-slate-400'}`}>
                        {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                      </div>
                      <input 
                        type="radio" 
                        name={currentQuestion.id} 
                        value={opt} 
                        checked={isSelected}
                        onChange={() => handleInputChange(currentQuestion.id, opt)}
                        className="hidden"
                        disabled={disabled}
                      />
                      <span className={`text-lg font-medium ${isSelected ? 'text-red-900' : 'text-slate-700'}`}>{opt}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === QuestionType.TRUE_FALSE && (
              <div className="grid grid-cols-2 gap-6">
                {['True', 'False'].map((val) => {
                  const isSelected = answers[currentQuestion.id] === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleInputChange(currentQuestion.id, val)}
                      disabled={disabled}
                      className={`py-8 px-6 rounded-2xl font-bold text-xl border-2 transition-all shadow-sm ${isSelected ? 'bg-red-600 border-red-600 text-white shadow-red-200' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === QuestionType.FILL_BLANK && (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type your answer here..."
                  className="w-full p-6 text-xl bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none font-medium text-slate-800 transition-all placeholder:text-slate-400"
                  value={answers[currentQuestion.id] || ''}
                  onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                  disabled={disabled}
                  autoFocus
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                  RETURN to save
                </div>
              </div>
            )}

            {currentQuestion.type === QuestionType.WORKOUT && (
              <textarea
                rows={8}
                placeholder="Type your explanation..."
                className="w-full p-6 text-lg bg-slate-50 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none font-medium text-slate-800 transition-all resize-none"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                disabled={disabled}
              />
            )}

            {currentQuestion.type === QuestionType.MATCHING && currentQuestion.matchingPairs && matchingOptions[currentQuestion.id] && (
              <div className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-3">
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Premises</div>
                     {currentQuestion.matchingPairs.map((pair, idx) => (
                       <div key={idx} className="flex items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                         <span className="font-medium text-slate-700">{pair.left}</span>
                         <select
                            className="w-20 p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                            value={matchingState[currentQuestion.id]?.[pair.left] || ''}
                            onChange={(e) => handleMatchingChange(currentQuestion.id, pair.left, e.target.value)}
                            disabled={disabled}
                          >
                            <option value="">-</option>
                            {matchingOptions[currentQuestion.id].map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.id}</option>
                            ))}
                          </select>
                       </div>
                     ))}
                   </div>
                   <div className="space-y-3">
                     <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Responses</div>
                     {matchingOptions[currentQuestion.id].map((opt) => (
                        <div key={opt.id} className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                          <span className="bg-slate-800 text-white w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {opt.id}
                          </span>
                          <span className="text-slate-600 text-sm font-medium">{opt.text}</span>
                        </div>
                      ))}
                   </div>
                 </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer Nav */}
      <footer className="bg-white border-t border-slate-200 p-4 shrink-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0 || disabled}
            className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <span className="hidden sm:inline">Previous</span>
          </button>

          {/* Palette Toggle for Mobile */}
          <button 
             onClick={() => setIsPaletteOpen(true)}
             className="sm:hidden p-3 bg-slate-100 rounded-xl text-slate-600 font-bold text-sm"
          >
            View All
          </button>

          {currentIndex === exam.questions.length - 1 ? (
            <button
              onClick={() => onSubmit(answers)}
              disabled={disabled}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center gap-2"
            >
              Finish Exam
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </button>
          ) : (
             <button
              onClick={() => setCurrentIndex(prev => Math.min(exam.questions.length - 1, prev + 1))}
              disabled={disabled}
              className="px-8 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 active:scale-95 flex items-center gap-2"
            >
              Next Question
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          )}
        </div>
      </footer>

      {/* Question Palette Overlay (Drawer) */}
      {isPaletteOpen && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsPaletteOpen(false)}></div>
          <div className="w-80 bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800">Exam Overview</h3>
              <button onClick={() => setIsPaletteOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-4 gap-3">
                {exam.questions.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isFlagged = flags.has(q.id);
                  const isCurrent = currentIndex === idx;
                  
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsPaletteOpen(false);
                      }}
                      className={`
                        aspect-square rounded-lg flex items-center justify-center font-bold text-sm border-2 transition-all relative
                        ${isCurrent ? 'border-slate-800 bg-slate-800 text-white' : 
                          isAnswered ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 
                          'border-slate-100 bg-white text-slate-400 hover:border-slate-300'}
                      `}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white shadow-sm"></span>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="mt-8 space-y-3">
                 <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                   <div className="w-3 h-3 bg-slate-800 rounded"></div> Current
                 </div>
                 <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                   <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded"></div> Answered
                 </div>
                 <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                   <div className="w-3 h-3 bg-white border border-slate-200 rounded relative"><span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full"></span></div> Flagged
                 </div>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
               <button 
                 onClick={() => onSubmit(answers)}
                 className="w-full py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-colors"
               >
                 Submit All
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamView;
