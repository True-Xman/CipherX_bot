import { CaptchaChallenge } from '../types';
import { config } from '../config/config';

/**
 * In-memory store of active captcha challenges, keyed by telegram_id.
 * A Map is sufficient here since captchas are short-lived (60s) and
 * don't need to survive a process restart. If you scale to multiple
 * bot instances behind a load balancer, move this to Redis instead.
 */
const activeChallenges = new Map<number, CaptchaChallenge>();

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generate a simple two-operand math question, e.g. "7 + 5 = ?" */
function generateQuestion(): { question: string; answer: number } {
  const a = randomInt(1, 20);
  const b = randomInt(1, 20);
  const ops = ['+', '-', '×'] as const;
  const op = ops[randomInt(0, ops.length - 1)];

  let answer: number;
  switch (op) {
    case '+':
      answer = a + b;
      break;
    case '-':
      answer = a - b;
      break;
    case '×':
      answer = a * b;
      break;
  }
  return { question: `${a} ${op} ${b} = ?`, answer };
}

/** Create (or replace) a captcha challenge for a user. */
export function createChallenge(telegramId: number): CaptchaChallenge {
  const { question, answer } = generateQuestion();
  const now = Date.now();
  const challenge: CaptchaChallenge = {
    telegram_id: telegramId,
    question,
    answer,
    createdAt: now,
    expiresAt: now + config.captcha.timeoutSeconds * 1000,
    attempts: 0,
  };
  activeChallenges.set(telegramId, challenge);
  return challenge;
}

export function getChallenge(telegramId: number): CaptchaChallenge | undefined {
  return activeChallenges.get(telegramId);
}

export function clearChallenge(telegramId: number): void {
  activeChallenges.delete(telegramId);
}

export function isExpired(challenge: CaptchaChallenge): boolean {
  return Date.now() > challenge.expiresAt;
}

/**
 * Build inline keyboard answer options: the correct answer plus 3 plausible
 * distractors, shuffled. Using buttons (rather than free-text input) avoids
 * ambiguity in parsing across 5 languages/number formats.
 */
export function buildAnswerOptions(correctAnswer: number): number[] {
  const options = new Set<number>([correctAnswer]);
  while (options.size < 4) {
    const offset = randomInt(-5, 5);
    if (offset === 0) continue;
    options.add(correctAnswer + offset);
  }
  return Array.from(options).sort(() => Math.random() - 0.5);
}

/** Increment attempts counter for a challenge; returns updated count. */
export function incrementAttempt(telegramId: number): number {
  const challenge = activeChallenges.get(telegramId);
  if (!challenge) return 0;
  challenge.attempts += 1;
  activeChallenges.set(telegramId, challenge);
  return challenge.attempts;
}

// Periodic sweep to avoid unbounded memory growth from abandoned challenges.
setInterval(() => {
  const now = Date.now();
  for (const [id, challenge] of activeChallenges.entries()) {
    if (now > challenge.expiresAt + 5 * 60_000) {
      activeChallenges.delete(id);
    }
  }
}, 5 * 60_000).unref();
