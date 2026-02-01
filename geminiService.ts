
import { GoogleGenAI, Type } from "@google/genai";
import { Exam, QuestionType, GradingResult } from "./types";

// Safely retrieve API Key to prevent 'process is not defined' errors on mobile/static builds
const getApiKey = (): string => {
  let key = "";
  try {
    // Check environment variable (standard way)
    if (typeof process !== "undefined" && process.env && process.env.API_KEY) {
      key = process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Error accessing process.env", e);
  }

  // Fallback: Check localStorage. This allows users to manually set the key 
  // on mobile devices using console: localStorage.setItem('gemini_api_key', 'YOUR_KEY')
  if (!key && typeof localStorage !== "undefined") {
    const localKey = localStorage.getItem("gemini_api_key");
    if (localKey) key = localKey;
  }

  return key || "";
};

const API_KEY = getApiKey();

export const parseExamFromText = async (text: string): Promise<Exam> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. If you are running this locally/offline, please set 'gemini_api_key' in localStorage.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Transform the following unstructured text into a structured exam JSON. 
    Strict constraints: 
    1. Do NOT rewrite or rephrase the questions. Keep them exactly as they appear.
    2. Identify the type: MCQ, TRUE_FALSE, FILL_BLANK, WORKOUT, or MATCHING.
    3. If there are options provided (A, B, C, D), it is an MCQ.
    4. If it asks for True or False, it is TRUE_FALSE.
    5. If it requires a missing word or short phrase, it is FILL_BLANK.
    6. If it requires a long answer, calculation, or explanation, it is WORKOUT.
    7. If it asks to match items from two lists/columns, it is MATCHING.
    8. For MATCHING: structure the pairs in the 'matchingPairs' array.
    9. Provide a likely correctAnswer for MCQ, TF, and FILL_BLANK. For MATCHING, the 'matchingPairs' array serves as the answer key.
    10. Assign a point value (default 1).
    11. Use simple alphanumeric IDs like "q1", "q2", etc.

    Text to parse:
    ${text}`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                type: { 
                  type: Type.STRING, 
                  enum: [QuestionType.MCQ, QuestionType.TRUE_FALSE, QuestionType.FILL_BLANK, QuestionType.WORKOUT, QuestionType.MATCHING] 
                },
                questionText: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                },
                matchingPairs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      left: { type: Type.STRING },
                      right: { type: Type.STRING }
                    }
                  }
                },
                correctAnswer: { type: Type.STRING },
                points: { type: Type.NUMBER }
              },
              required: ["id", "type", "questionText", "points"]
            }
          }
        },
        required: ["title", "questions"]
      }
    }
  });

  try {
    const jsonStr = response.text.trim().replace(/^```json\n?|\n?```$/g, '');
    const parsed = JSON.parse(jsonStr);
    
    // Inject ID and Timestamp manually as the LLM doesn't generate them for the container
    return {
      ...parsed,
      id: crypto.randomUUID(),
      createdAt: Date.now()
    } as Exam;
  } catch (e) {
    console.error("Failed to parse Gemini parsing response", e, response.text);
    throw new Error("Could not structure the exam content.");
  }
};

export const gradeExam = async (exam: Exam, answers: Record<string, string>): Promise<GradingResult> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. If you are running this locally/offline, please set 'gemini_api_key' in localStorage.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  // LOGIC: Determine if Thinking Mode is relevant.
  // Subjective questions (WORKOUT) and fuzzy matching (FILL_BLANK) benefit from deep reasoning (32k tokens).
  // Purely objective questions (MCQ, TF, MATCHING) are deterministic and should be graded FAST (0 thinking tokens).
  const requiresThinking = exam.questions.some(q => 
    q.type === QuestionType.WORKOUT || 
    q.type === QuestionType.FILL_BLANK
  );

  const thinkingBudget = requiresThinking ? 32768 : 0;

  const prompt = `Act as an expert examiner. Grade the following exam submission strictly based on the provided Exam Reference.

Exam Reference:
${JSON.stringify(exam)}

Student's Submitted Answers:
${JSON.stringify(answers)}

Grading Instructions:
1. For MCQ: The answer must match one of the options exactly as specified in the Exam Reference.
2. For TRUE_FALSE: Compare the student's "True" or "False" against the correctAnswer.
3. For FILL_BLANK: Use smart concept matching. Allow for minor spelling mistakes if the meaning is identical.
4. For WORKOUT: This is a subjective question. Evaluate the student's response against the 'correctAnswer' (which contains key concepts/rubric). Award partial points if they captured some but not all concepts.
5. For MATCHING: The student answer is a JSON string of pairs (Left Item -> Selected Right Item). Compare these pairs against the 'matchingPairs' in the Exam Reference. Award points proportionally based on correct pairs.
6. Provide a 'feedback' entry for EVERY question in the exam.
7. Calculate the total 'score' by summing all 'pointsEarned'.
8. Return the result in the specified JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      thinkingConfig: { thinkingBudget },
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          totalPoints: { type: Type.NUMBER },
          feedback: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questionId: { type: Type.STRING },
                isCorrect: { type: Type.BOOLEAN },
                pointsEarned: { type: Type.NUMBER },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["questionId", "isCorrect", "pointsEarned", "correctAnswer"]
            }
          }
        },
        required: ["score", "totalPoints", "feedback"]
      }
    }
  });

  try {
    const jsonStr = response.text.trim().replace(/^```json\n?|\n?```$/g, '');
    return JSON.parse(jsonStr) as GradingResult;
  } catch (e) {
    console.error("Failed to parse Gemini grading response", e, response.text);
    throw new Error("Failed to parse grading results.");
  }
};
