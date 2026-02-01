
import React from 'react';
import { GradingResult, Exam } from '../types';

interface ResultsOverlayProps {
  results: GradingResult;
  exam: Exam;
  onClose: () => void;
  onReset: () => void;
}

const ResultsOverlay: React.FC<ResultsOverlayProps> = ({ results, exam, onClose, onReset }) => {
  const percentage = Math.round((results.score / results.totalPoints) * 100);
  
  const getGrade = (pct: number) => {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    return 'F';
  };

  const grade = getGrade(percentage);
  const isPassed = percentage >= 60;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className={`p-10 text-center text-white relative ${isPassed ? 'bg-emerald-600' : 'bg-red-600'}`}>
          <div className="relative z-10">
            <div className="mb-4 inline-flex items-center justify-center bg-white/20 p-3 rounded-full backdrop-blur-md">
              {isPassed ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
              )}
            </div>
            <h2 className="text-4xl font-black mb-2 uppercase tracking-tighter">
              {isPassed ? 'EXAM PASSED' : 'EXAM FAILED'}
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md min-w-[100px]">
                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-80">Grade</span>
                <span className="text-4xl font-black">{grade}</span>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md min-w-[100px]">
                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-80">Score</span>
                <span className="text-2xl font-black">{results.score} / {results.totalPoints}</span>
              </div>
              <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md min-w-[100px]">
                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-80">Percentage</span>
                <span className="text-2xl font-black">{percentage}%</span>
              </div>
            </div>
          </div>
          {/* Decorative shapes */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-lg">Detailed Breakdown</h3>
            <span className="text-xs font-medium text-slate-500">{exam.questions.length} items evaluated</span>
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {exam.questions.map((q, idx) => {
              const f = results.feedback.find(item => item.questionId === q.id);
              return (
                <div key={q.id} className={`p-4 rounded-xl border transition-all ${f?.isCorrect ? 'bg-emerald-50/30 border-emerald-100' : 'bg-red-50/30 border-red-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Question {idx + 1}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${f?.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {f?.pointsEarned ?? 0} / {q.points} PTS
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-800 line-clamp-2">{q.questionText}</p>
                  
                  {f?.explanation && (
                    <p className="mt-2 text-xs text-slate-500 italic">
                      {f.explanation}
                    </p>
                  )}

                  {!f?.isCorrect && f?.correctAnswer && (
                    <div className="mt-3 p-3 bg-white border border-slate-100 rounded-lg text-xs shadow-sm">
                      <span className="text-slate-400 font-bold uppercase block mb-1">Correct Answer:</span>
                      <span className="text-slate-800 font-medium">{f.correctAnswer}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <button
              onClick={onClose}
              className="py-4 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all active:scale-95"
            >
              REVIEW ANSWERS
            </button>
            <button
              onClick={onReset}
              className="py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
            >
              NEW EXAM
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsOverlay;
