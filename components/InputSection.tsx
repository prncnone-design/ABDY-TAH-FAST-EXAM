
import React, { useState } from 'react';
import { Exam } from '../types';

interface InputSectionProps {
  onProcess: (text: string) => void;
  disabled: boolean;
  history: Exam[];
  onLoadExam: (exam: Exam) => void;
  onRenameExam: (id: string, title: string) => void;
  onDeleteExam: (id: string) => void;
  apiKeyMissing: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ 
  onProcess, 
  disabled, 
  history, 
  onLoadExam,
  onRenameExam,
  onDeleteExam,
  apiKeyMissing
}) => {
  const [rawText, setRawText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawText.trim() && !apiKeyMissing) {
      onProcess(rawText);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawText(content);
    };
    reader.readAsText(file);
  };

  const startEditing = (e: React.MouseEvent, exam: Exam) => {
    e.stopPropagation();
    setEditingId(exam.id);
    setEditTitle(exam.title);
  };

  const saveTitle = (id: string) => {
    if (editTitle.trim()) {
      onRenameExam(id, editTitle);
    }
    setEditingId(null);
  };

  const deleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this exam?")) {
      onDeleteExam(id);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="lg:col-span-8 bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 md:p-8 border border-slate-200 transition-all">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Initialize Exam Delivery</h2>
          <p className="text-slate-500">Paste your raw exam content below. Supported: MCQs, T/F, Fill-in-blanks, Workout, and Matching questions.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative group">
            <textarea
              className="w-full h-80 p-5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all outline-none font-mono text-sm leading-relaxed"
              placeholder="Question 1: What is the capital of France?&#10;A. London&#10;B. Paris&#10;C. Berlin&#10;D. Rome&#10;&#10;Question 2: (True/False) Gravity is a repulsive force.&#10;&#10;Question 3: Match the terms.&#10;Atom - Smallest unit of matter&#10;Cell - Basic unit of life&#10;..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              disabled={disabled}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <label className="cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                Attach File
                <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md" />
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={disabled || !rawText.trim() || apiKeyMissing}
            className="w-full py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 active:scale-[0.98] transition-all shadow-lg shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-3"
          >
            {apiKeyMissing ? (
               <>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 SETUP API KEY FIRST
               </>
            ) : (
               <>
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 INSTANT DEPLOY
               </>
            )}
          </button>
        </form>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-8">
          {[
            { icon: '⚡', label: 'High Speed', desc: 'Instant transformation' },
            { icon: '🎯', label: 'Precision', desc: 'Zero modification policy' },
            { icon: '🛡️', label: 'Secure', desc: 'Direct exam delivery' }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <span className="text-2xl mb-2">{item.icon}</span>
              <h3 className="font-bold text-slate-800 text-sm">{item.label}</h3>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* History Sidebar */}
      <aside className="lg:col-span-4 space-y-4">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
          <h3 className="font-bold text-lg mb-1">Previous Exams</h3>
          <p className="text-slate-400 text-sm">Select to retake or manage</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2 max-h-[600px] overflow-y-auto">
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm">No exam history yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {history.map((exam) => (
                <div 
                  key={exam.id}
                  className="group relative p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer"
                  onClick={() => onLoadExam(exam)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {editingId === exam.id ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => saveTitle(exam.id)}
                          onKeyDown={(e) => e.key === 'Enter' && saveTitle(exam.id)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          className="w-full text-sm font-semibold text-slate-900 bg-white border border-red-300 rounded px-1 -ml-1 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                      ) : (
                        <h4 className="font-semibold text-slate-800 text-sm truncate pr-6">{exam.title}</h4>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(exam.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">
                          {exam.questions.length} Qs
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-3">
                      <button
                        onClick={(e) => startEditing(e, exam)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Rename"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button
                        onClick={(e) => deleteItem(e, exam.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default InputSection;
