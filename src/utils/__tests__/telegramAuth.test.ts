import crypto from 'crypto';
import assert from 'assert';
import { validateTelegramInitData } from '../telegramAuth';

const TEST_BOT_TOKEN = '123456789:ABCdefGHIjklMNOpqrsTUVwxyZ';

function createValidInitData(
  userObj: object,
  authDate: number,
  botToken: string = TEST_BOT_TOKEN
): string {
  const userJson = JSON.stringify(userObj);
  const params = new Map<string, string>();
  params.set('auth_date', String(authDate));
  params.set('query_id', 'AAH12345');
  params.set('user', userJson);

  // Sort keys alphabetically
  const sortedKeys = Array.from(params.keys()).sort();
  const dataCheckArr = sortedKeys.map((k) => `${k}=${params.get(k)}`);
  const dataCheckString = dataCheckArr.join('\n');

  // Compute secret key = HMAC-SHA256("WebAppData", botToken)
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();

  // Compute hash = HMAC-SHA256(secretKey, dataCheckString)
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  // Construct raw query string
  const urlParams = new URLSearchParams();
  urlParams.set('auth_date', String(authDate));
  urlParams.set('query_id', 'AAH12345');
  urlParams.set('user', userJson);
  urlParams.set('hash', hash);

  return urlParams.toString();
}

function runTests() {
  console.log('🧪 Starting Telegram InitData Validation Unit Tests...\n');

  const now = Math.floor(Date.now() / 1000);
  const testUser = { id: 987654321, first_name: 'CipherX_Tester', username: 'tester' };

  // -------------------------------------------------------------
  // Test 1: Valid initData accepted
  // -------------------------------------------------------------
  {
    const validInitData = createValidInitData(testUser, now);
    const result = validateTelegramInitData(validInitData, TEST_BOT_TOKEN);
    assert.strictEqual(result.isValid, true, 'Test 1 Failed: Valid initData should be accepted');
    assert.strictEqual(result.user?.id, 987654321, 'Test 1 Failed: User ID should match 987654321');
    assert.strictEqual(result.user?.username, 'tester', 'Test 1 Failed: Username should match');
    console.log('✅ Test 1 Passed: Valid initData accepted & user ID verified');
  }

  // -------------------------------------------------------------
  // Test 2: Invalid signature rejected
  // -------------------------------------------------------------
  {
    const validInitData = createValidInitData(testUser, now);
    const tamperedHashInitData = validInitData.replace(/hash=[a-f0-9]+/, 'hash=1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
    const result = validateTelegramInitData(tamperedHashInitData, TEST_BOT_TOKEN);
    assert.strictEqual(result.isValid, false, 'Test 2 Failed: Invalid signature should be rejected');
    assert.strictEqual(result.error, 'Invalid signature', 'Test 2 Failed: Error should be "Invalid signature"');
    console.log('✅ Test 2 Passed: Invalid signature rejected');
  }

  // -------------------------------------------------------------
  // Test 3: Missing initData rejected
  // -------------------------------------------------------------
  {
    const resultEmpty = validateTelegramInitData('', TEST_BOT_TOKEN);
    assert.strictEqual(resultEmpty.isValid, false, 'Test 3 Failed: Empty string should be rejected');
    assert.strictEqual(resultEmpty.error, 'Missing initData', 'Test 3 Failed: Error should be "Missing initData"');

    const resultNoHash = validateTelegramInitData('user=%7B%22id%22%3A1%7D&auth_date=1000', TEST_BOT_TOKEN);
    assert.strictEqual(resultNoHash.isValid, false, 'Test 3 Failed: Missing hash should be rejected');
    assert.strictEqual(resultNoHash.error, 'Missing hash in initData');
    console.log('✅ Test 3 Passed: Missing initData / missing hash rejected');
  }

  // -------------------------------------------------------------
  // Test 4: Tampered user data rejected
  // -------------------------------------------------------------
  {
    const validInitData = createValidInitData(testUser, now);
    // Attacker modifies user ID in query string while keeping original hash signature
    const tamperedUserInitData = validInitData.replace('987654321', '111111111');
    const result = validateTelegramInitData(tamperedUserInitData, TEST_BOT_TOKEN);
    assert.strictEqual(result.isValid, false, 'Test 4 Failed: Tampered user data should be rejected');
    assert.strictEqual(result.error, 'Invalid signature', 'Test 4 Failed: Error should be "Invalid signature"');
    console.log('✅ Test 4 Passed: Tampered user data rejected due to signature mismatch');
  }

  // -------------------------------------------------------------
  // Test 5: Stale auth_date rejected
  // -------------------------------------------------------------
  {
    const staleAuthDate = now - 90000; // 25 hours ago (> 24 hour threshold)
    const staleInitData = createValidInitData(testUser, staleAuthDate);
    const result = validateTelegramInitData(staleInitData, TEST_BOT_TOKEN, 86400);
    assert.strictEqual(result.isValid, false, 'Test 5 Failed: Stale auth_date should be rejected');
    assert.strictEqual(result.error, 'Stale auth_date', 'Test 5 Failed: Error should be "Stale auth_date"');
    console.log('✅ Test 5 Passed: Stale auth_date rejected');
  }

  console.log('\n🎉 ALL 5 TELEGRAM IDENTITY VERIFICATION TESTS PASSED!\n');
}

runTests();
