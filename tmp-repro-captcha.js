require('ts-node/register');
const { handleCaptchaAnswer } = require('./src/bot/handlers/captchaHandler');
const { createChallenge, getChallenge } = require('./src/services/captchaService');

const userId = 999999999;
const challenge = createChallenge(userId);
challenge.expiresAt = Date.now() - 1000;
console.log('expired challenge', challenge);

const ctx = {
  chat: { id: userId },
  dbUser: {
    telegram_id: userId,
    username: 'test',
    language: 'en',
    is_verified: 1,
    state: 'IN_CAPTCHA',
    failed_attempts: 0,
    banned_until: null,
    learning_step: 0,
    xp_points: 0,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  callbackQuery: { data: `captcha:${challenge.answer}`, message: { chat: { id: userId } }, id: 'cb1' },
  answerCbQuery: async () => console.log('answerCbQuery called'),
  reply: async (text, keyboard) => {
    console.log('reply1 text:', text);
    console.log('reply1 keyboard:', JSON.stringify(keyboard, null, 2));
  },
};

(async () => {
  await handleCaptchaAnswer(ctx);
  const newChallenge = getChallenge(userId);
  console.log('new challenge', newChallenge);
  const ctx2 = {
    chat: { id: userId },
    dbUser: ctx.dbUser,
    callbackQuery: { data: `captcha:${newChallenge.answer}`, message: { chat: { id: userId } }, id: 'cb2' },
    answerCbQuery: async () => console.log('answerCbQuery2 called'),
    reply: async (text, keyboard) => {
      console.log('reply2 text:', text);
      console.log('reply2 keyboard:', JSON.stringify(keyboard, null, 2));
    },
  };
  await handleCaptchaAnswer(ctx2);
})();
