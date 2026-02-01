
export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  FILL_BLANK = 'FILL_BLANK',
  WORKOUT = 'WORKOUT',
  MATCHING = 'MATCHING'
}

export interface Question {
  id: string;
  type: QuestionType;
  questionText: string;
  options?: string[]; // For MCQ
  matchingPairs?: { left: string; right: string }[]; // For MATCHING
  correctAnswer: string;
  points: number;
}

export interface Exam {
  id: string;
  title: string;
  questions: Question[];
  createdAt: number;
}

export interface ExamSubmission {
  examId: string;
  answers: Record<string, string>;
}

export interface FeedbackItem {
  questionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  correctAnswer?: string;
  explanation?: string;
}

export interface GradingResult {
  score: number;
  totalPoints: number;
  feedback: FeedbackItem[];
}
