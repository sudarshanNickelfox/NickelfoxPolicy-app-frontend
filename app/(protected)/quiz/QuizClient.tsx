'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPolicies } from '@/lib/services/policyService';
import type { Policy } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────────

interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  policyTitle: string;
}

type QuizState = 'loading' | 'error' | 'insufficient' | 'quiz' | 'results';

// ── Question generation ────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pickDistractors(correct: string, pool: string[], count = 3): string[] {
  const others = shuffle(pool.filter((v) => v !== correct));
  const result = others.slice(0, count);
  // Pad with generic fallbacks if pool is too small
  const fallbacks = ['N/A', 'Other', 'General', 'Various', 'Multiple'];
  let fi = 0;
  while (result.length < count) {
    const fb = fallbacks[fi++] ?? `Option ${result.length + 1}`;
    if (!result.includes(fb)) result.push(fb);
  }
  return result;
}

function buildOptions(correct: string, distractors: string[]): { options: string[]; correctIndex: number } {
  const options = shuffle([correct, ...distractors]);
  return { options, correctIndex: options.indexOf(correct) };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function generateFakeVersions(real: string): string[] {
  const base = ['1.0', '1.1', '2.0', '2.1', '3.0', '1.2', '2.2', '3.1'];
  const normalized = real.replace(/^v/, '');
  return base.filter((v) => v !== normalized).slice(0, 4).map((v) => `v${v}`);
}

function generateFakeDates(real: string): string[] {
  const base = new Date(real);
  return [-180, -90, 90, 180].map((offset) => {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    return formatDate(d.toISOString());
  });
}

function generateQuestions(policies: Policy[]): Question[] {
  const questions: Question[] = [];
  const pool = shuffle(policies).slice(0, 5);

  const allDepartments = Array.from(new Set(policies.map((p) => p.department).filter(Boolean)));
  const allCategories = Array.from(new Set(policies.map((p) => p.category).filter(Boolean)));
  const allTitles = policies.map((p) => p.title);

  const TYPES = ['department', 'category', 'version', 'which_policy', 'date'] as const;

  for (let i = 0; i < pool.length; i++) {
    const policy = pool[i];
    const type = TYPES[i % TYPES.length];

    if (type === 'department' && allDepartments.length >= 2) {
      const distractors = pickDistractors(policy.department, allDepartments);
      const { options, correctIndex } = buildOptions(policy.department, distractors);
      questions.push({
        id: `q-${i}`,
        policyTitle: policy.title,
        text: `Which department does the "${policy.title}" policy belong to?`,
        options,
        correctIndex,
      });
    } else if (type === 'category' && allCategories.length >= 2) {
      const distractors = pickDistractors(policy.category, allCategories);
      const { options, correctIndex } = buildOptions(policy.category, distractors);
      questions.push({
        id: `q-${i}`,
        policyTitle: policy.title,
        text: `What category is the "${policy.title}" policy classified under?`,
        options,
        correctIndex,
      });
    } else if (type === 'version') {
      const correct = policy.version.startsWith('v') ? policy.version : `v${policy.version}`;
      const distractors = generateFakeVersions(policy.version);
      const { options, correctIndex } = buildOptions(correct, distractors.slice(0, 3));
      questions.push({
        id: `q-${i}`,
        policyTitle: policy.title,
        text: `What is the current version of the "${policy.title}" policy?`,
        options,
        correctIndex,
      });
    } else if (type === 'which_policy' && allTitles.length >= 2) {
      const distractors = pickDistractors(policy.title, allTitles);
      const { options, correctIndex } = buildOptions(policy.title, distractors);
      questions.push({
        id: `q-${i}`,
        policyTitle: policy.title,
        text: `Which of these policies belongs to the "${policy.department}" department?`,
        options,
        correctIndex,
      });
    } else if (type === 'date') {
      const correct = formatDate(policy.effectiveDate);
      const distractors = generateFakeDates(policy.effectiveDate);
      const { options, correctIndex } = buildOptions(correct, distractors.slice(0, 3));
      questions.push({
        id: `q-${i}`,
        policyTitle: policy.title,
        text: `When did the "${policy.title}" policy become effective?`,
        options,
        correctIndex,
      });
    } else {
      // Fallback: department question
      const distractors = pickDistractors(policy.department, allDepartments.length >= 2 ? allDepartments : ['HR', 'Finance', 'Legal', 'IT']);
      const { options, correctIndex } = buildOptions(policy.department, distractors);
      questions.push({
        id: `q-${i}`,
        policyTitle: policy.title,
        text: `Which department does the "${policy.title}" policy belong to?`,
        options,
        correctIndex,
      });
    }
  }

  return questions;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
        <span>Question {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-100">
        <motion.div
          className="h-2 rounded-full bg-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function ScoreBadge({ score, total }: { score: number; total: number }) {
  const pct = (score / total) * 100;
  const color = pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600';
  const bg = pct >= 80 ? 'bg-green-50 border-green-200' : pct >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
  const label = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good effort!' : 'Keep studying!';

  return (
    <div className={`rounded-2xl border ${bg} p-8 text-center`}>
      <p className={`text-6xl font-bold ${color}`}>{score}/{total}</p>
      <p className={`mt-2 text-lg font-semibold ${color}`}>{label}</p>
      <p className="mt-1 text-sm text-slate-500">{Math.round(pct)}% correct</p>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function QuizClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadQuiz = useCallback(async () => {
    const token = (session as any)?.accessToken;
    if (!token) return;

    setQuizState('loading');
    try {
      const result = await fetchPolicies({ status: 'acknowledged', page: 1, page_size: 100 }, token);
      if (result.data.length < 2) {
        setQuizState('insufficient');
        return;
      }
      const qs = generateQuestions(result.data);
      setQuestions(qs);
      setCurrent(0);
      setSelected(null);
      setRevealed(false);
      setAnswers([]);
      setQuizState('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz.');
      setQuizState('error');
    }
  }, [session]);

  useEffect(() => {
    if (status === 'authenticated') loadQuiz();
  }, [status, loadQuiz]);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
  };

  const handleConfirm = () => {
    if (selected === null) return;
    setRevealed(true);
  };

  const handleNext = () => {
    if (selected === null) return;
    const isCorrect = selected === questions[current].correctIndex;
    const newAnswers = [...answers, isCorrect];
    setAnswers(newAnswers);

    if (current + 1 >= questions.length) {
      setQuizState('results');
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const handleRetry = () => loadQuiz();

  // ── Render states ──────────────────────────────────────────────────────────

  if (quizState === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
        <p className="text-sm text-slate-500">Preparing your quiz…</p>
      </div>
    );
  }

  if (quizState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button onClick={handleRetry} className="text-sm text-indigo-600 underline">Try again</button>
      </div>
    );
  }

  if (quizState === 'insufficient') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
          <svg className="h-8 w-8 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-slate-800">Not enough acknowledged policies</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          You need to acknowledge at least 2 policies before you can take the quiz.
        </p>
        <button
          onClick={() => router.push('/policies')}
          className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
        >
          Browse policies
        </button>
      </div>
    );
  }

  if (quizState === 'results') {
    const score = answers.filter(Boolean).length;
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-6 max-w-lg mx-auto"
      >
        <ScoreBadge score={score} total={questions.length} />

        <div className="flex flex-col gap-2">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                answers[i]
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <span className="mt-0.5 shrink-0">
                {answers[i] ? (
                  <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </span>
              <div className="min-w-0">
                <p className="text-slate-700 font-medium line-clamp-2">{q.text}</p>
                {!answers[i] && (
                  <p className="mt-0.5 text-xs text-red-600">
                    Correct: {q.options[q.correctIndex]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            Retake quiz
          </button>
          <button
            onClick={() => router.push('/policies')}
            className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Back to policies
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Quiz question ──────────────────────────────────────────────────────────

  const question = questions[current];

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <ProgressBar current={current + 1} total={questions.length} />

      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-4"
        >
          {/* Question */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-500 mb-2">
              Question {current + 1}
            </p>
            <p className="text-base font-semibold text-slate-800 leading-snug">
              {question.text}
            </p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-2.5">
            {question.options.map((option, idx) => {
              let style = 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50';
              if (revealed) {
                if (idx === question.correctIndex) {
                  style = 'border-green-400 bg-green-50';
                } else if (idx === selected) {
                  style = 'border-red-400 bg-red-50';
                } else {
                  style = 'border-slate-100 bg-slate-50 opacity-60';
                }
              } else if (idx === selected) {
                style = 'border-indigo-500 bg-indigo-50';
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={revealed}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${style}`}
                >
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${
                    revealed && idx === question.correctIndex
                      ? 'border-green-500 bg-green-500 text-white'
                      : revealed && idx === selected && idx !== question.correctIndex
                      ? 'border-red-500 bg-red-500 text-white'
                      : idx === selected
                      ? 'border-indigo-500 bg-indigo-500 text-white'
                      : 'border-slate-300 text-slate-500'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-slate-700">{option}</span>
                  {revealed && idx === question.correctIndex && (
                    <svg className="ml-auto h-4 w-4 shrink-0 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                  {revealed && idx === selected && idx !== question.correctIndex && (
                    <svg className="ml-auto h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action button */}
          <div className="flex justify-end pt-1">
            {!revealed ? (
              <button
                onClick={handleConfirm}
                disabled={selected === null}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Confirm answer
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                {current + 1 >= questions.length ? 'See results' : 'Next question →'}
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
