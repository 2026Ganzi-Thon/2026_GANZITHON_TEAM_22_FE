const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

function load(file, mocks, globals = {}) {
  const exports = {};
  const { outputText } = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  vm.runInNewContext(outputText, {
    exports, require: (name) => { assert.ok(name in mocks, name); return mocks[name]; },
    Headers, AbortController, URLSearchParams, setTimeout, clearTimeout, ...globals,
  });
  return exports;
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
class Clock {
  now = 0;
  nextId = 0;
  timers = new Map();
  globals = {
    Date: { now: () => this.now },
    setTimeout: (callback, delay) => {
      const id = ++this.nextId;
      this.timers.set(id, { at: this.now + delay, callback });
      return id;
    },
    clearTimeout: (id) => this.timers.delete(id),
  };
  async advance(duration) {
    const end = this.now + duration;
    await flush();
    for (;;) {
      const next = [...this.timers].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      this.now = next[1].at;
      this.timers.delete(next[0]);
      next[1].callback();
      await flush();
    }
    this.now = end;
    await flush();
  }
}
class ApiError extends Error {
  constructor(status, body) { super('API error'); this.status = status; this.body = body; }
}
function recovery(recoverExchange, clock) {
  return load('src/services/chatRecovery.ts', {
    '@/services/backend': { recoverExchange }, '@/utils/api': { ApiError },
  }, clock.globals);
}

test('unknown chat results use one ID every four seconds for at most 35 seconds', async () => {
  const clock = new Clock();
  const calls = [];
  const service = recovery(async (id) => { calls.push([id, clock.now]); return null; }, clock);
  const result = service.pollExchange('original-id', new AbortController().signal);
  await clock.advance(35_000);
  assert.equal(await result, null);
  assert.deepEqual(calls.map(([, time]) => time), [0, 4000, 8000, 12000, 16000, 20000, 24000, 28000, 32000]);
  assert.ok(calls.every(([id]) => id === 'original-id'));
  assert.equal(clock.timers.size, 0);
});

test('PROCESSING stays pending and manual checks reuse the original ID', async () => {
  const clock = new Clock();
  let calls = 0;
  const result = { clientRequestId: 'original', status: 'SUCCEEDED' };
  const service = recovery(async (id) => {
    assert.equal(id, 'original');
    return ++calls < 3 ? { status: 'PROCESSING' } : result;
  }, clock);
  const poll = service.pollExchange('original', new AbortController().signal);
  await clock.advance(8000);
  assert.equal(await poll, result);
  assert.equal(await service.pollExchange('original', new AbortController().signal), result);
});

test('navigation cancels polling and nonretryable history errors stop immediately', async () => {
  const clock = new Clock();
  let calls = 0;
  const service = recovery(async () => { calls++; return null; }, clock);
  const controller = new AbortController();
  const result = service.pollExchange('id', controller.signal);
  await flush();
  controller.abort();
  assert.equal(await result, null);
  await clock.advance(35_000);
  assert.equal(calls, 1);
  const failure = new ApiError(503, { retryable: false });
  const broken = recovery(async () => { throw failure; }, clock);
  await assert.rejects(broken.pollExchange('id', new AbortController().signal), (error) => error === failure);
});

function backend(apiRequest, clock) {
  return load('src/services/backend.ts', {
    '@/utils/api': { ApiError, apiRequest },
    '@/utils/token': { readAccessToken: async () => 'test' },
  }, clock.globals);
}

test('lost chat POST responses are never automatically posted again', async () => {
  const clock = new Clock();
  const calls = [];
  const request = { clientRequestId: 'original', content: 'original body', characterKeys: ['JOY'] };
  const service = backend(async (path, options) => { calls.push([path, options]); throw new ApiError(0); }, clock);
  await assert.rejects(service.createExchange(request));
  assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(calls[0][1].body), request);
});

test('reminder retries preserve the original session, timestamp and timezone', async () => {
  const clock = new Clock();
  const calls = [];
  const response = { reminder: { status: 'CANCELED' } };
  const service = backend(async (path, options) => {
    calls.push([path, options.body]);
    if (calls.length < 3) throw new ApiError(503, { retryable: true });
    return response;
  }, clock);
  const result = service.putNextStartReminder('session', '2026-11-18T11:30:00Z', 'Asia/Seoul');
  await clock.advance(2000);
  assert.equal(await result, response);
  assert.equal(calls.length, 3);
  assert.ok(calls.every(([path, body]) => path === calls[0][0] && body === calls[0][1]));
});

test('canceled reminders never enter the active store or local notification scheduler', async () => {
  let schedules = 0;
  const { useMockStore, reminderActions } = load('src/mocks/store.ts', {
    react: { useSyncExternalStore: (_, snapshot) => snapshot() },
    '@/services/backend': { putNextStartReminder: async () => ({ reminder: { id: 'canceled', status: 'CANCELED' } }) },
    '@/utils/token': {}, '@/utils/preferences': {}, '@/hooks/useStudySession': {}, '@/services/studyPresence': {},
    '@/services/localNotifications': {
      clearStaleStartReminders: async () => {},
      scheduleStartReminder: async () => { schedules++; },
    },
  });
  const result = await reminderActions.setFromSession('session', 'original-time', 'Asia/Seoul');
  assert.equal(result.reminder, null);
  assert.equal(useMockStore().reminder, null);
  assert.equal(schedules, 0);
});

function presenceEnvironment(saved) {
  let serial = 0;
  let device = saved;
  return {
    mocks: {
      'expo-constants': { __esModule: true, default: { executionEnvironment: 'standalone', easConfig: { projectId: 'project' } }, ExecutionEnvironment: { StoreClient: 'storeClient' } },
      'expo-device': { isDevice: true },
      'expo-notifications': { AndroidImportance: { DEFAULT: 3 }, setNotificationChannelAsync: async () => {}, getExpoPushTokenAsync: async () => ({ data: 'token' }) },
      'react-native': { Platform: { OS: 'android' } },
      '@/services/backend': { newClientRequestId: () => 'uuid-' + (++serial), registerPushDevice: async () => {}, removePushDevice: async () => {} },
      '@/services/chatRecovery': { apiErrorCode: () => '' },
      '@/services/localNotifications': { getNotificationsEnabledPreference: async () => true, hasLocalNotificationPermission: async () => true },
      '@/utils/preferences': { readPreference: async () => device, writePreference: async (_, value) => { device = JSON.parse(JSON.stringify(value)); } },
    },
    getDevice: () => device,
  };
}

test('presence sequences increase across rapid transitions and an app restart with clock rollback', async () => {
  const clock = new Clock();
  const env = presenceEnvironment({ id: 'installation', sequence: 9000 });
  const service = load('src/services/studyPresence.ts', env.mocks, clock.globals);
  const [away, back] = await Promise.all([service.createPresenceEvent('BACKGROUND'), service.createPresenceEvent('FOREGROUND')]);
  assert.equal(back.installationId, away.installationId);
  assert.ok(back.sequence > away.sequence);
  assert.notEqual(back.eventId, away.eventId);
  const restart = presenceEnvironment(env.getDevice());
  const restarted = load('src/services/studyPresence.ts', restart.mocks, clock.globals);
  assert.ok((await restarted.createPresenceEvent('FOREGROUND')).sequence > back.sequence);
});

test('root presence reports departure and return, then cancels stale departure retries', async () => {
  const clock = new Clock();
  let appListener, effect;
  let sequence = 0;
  const sent = [];
  const mocks = {
    react: { useEffect: (callback) => { effect = callback; } },
    'react-native': { AppState: { currentState: 'active', addEventListener: (_, listener) => { appListener = listener; return { remove() {} }; } } },
    'expo-notifications': { addPushTokenListener: () => ({ remove() {} }) },
    '@/hooks/useStudySession': { useStudySession: () => ({ sessionId: 'session', status: 'study' }) },
    '@/mocks/store': { useMockStore: () => ({ loggedIn: true, loading: false, userId: 'user' }) },
    '@/utils/api': { ApiError },
    '@/services/studyPresence': {
      supportsRemotePush: () => true, isPushDeviceRegistered: () => true,
      syncPushRegistration: async () => 'installation', waitForPushRegistration: async () => {},
      createPresenceEvent: async (state) => ({ state, sequence: ++sequence }),
      transmitPresence: async (_, event) => {
        sent.push(event);
        if (event.state === 'BACKGROUND') throw new ApiError(0);
      },
    },
  };
  const service = load('src/hooks/useStudyPresence.ts', mocks, clock.globals);
  service.useStudyPresence(); const cleanup = effect();
  await flush();
  appListener('background'); await flush();
  appListener('active'); await flush();
  await clock.advance(8000);
  assert.deepEqual(sent.map((event) => event.state), ['FOREGROUND', 'BACKGROUND', 'FOREGROUND']);
  assert.ok(sent[2].sequence > sent[1].sequence);
  cleanup();
  assert.equal(clock.timers.size, 0);
});

test('chat recheck button restores the saved body and performs GET recovery only', async () => {
  const clock = new Clock();
  const saved = { clientRequestId: 'kept-id', content: 'kept body', studySessionId: null, characterKeys: ['JOY'] };
  let stateIndex = 0;
  const state = [];
  const effects = [];
  const storage = new Map([['pendingChat.user.home', saved]]);
  let polls = 0, posts = 0;
  const jsx = (type, props) => ({ type, props });
  const mocks = {
    react: {
      useState: (initial) => {
        const index = stateIndex++;
        if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
        return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
      },
      useRef: (initial) => ({ current: initial }),
      useCallback: (callback) => callback,
      useEffect: (callback) => effects.push(callback),
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { StyleSheet: { create: (value) => value }, Platform: { OS: 'web' } },
    '@/components/common/Button': { __esModule: true, default: 'button' },
    '@/features/chat/ChatInput': { __esModule: true, default: 'input' },
    '@/features/chat/MessageItem': {},
    '@/constants/characters': { CHARACTER_IDS: ['joy'] },
    '@/constants/theme': { colors: {}, fonts: {} },
    '@/mocks/store': { useMockStore: () => ({ userId: 'user' }) },
    '@/services/backend': {
      getChatHistory: async () => ({ items: [] }), getChatUsage: async () => ({ dailyRequestLimit: 30 }),
      createExchange: async () => { posts++; },
    },
    '@/services/chatRecovery': {
      apiErrorCode: () => '', needsChatRecovery: () => true,
      pollExchange: async (id) => { assert.equal(id, saved.clientRequestId); polls++; return null; },
    },
    '@/utils/preferences': { readPreference: async (key) => storage.get(key), writePreference: async (key, value) => storage.set(key, value) },
    '@/utils/alert': {},
  };
  const component = load('src/features/chat/ChatRoom.tsx', mocks, clock.globals);
  const conversation = component.default({}).type;
  conversation({ userId: 'user' });
  const cleanup = effects[0]();
  await flush();
  stateIndex = 0;
  const tree = conversation({ userId: 'user' });
  const children = tree.props.children;
  const button = children.find((child) => child?.props?.label === '다시 확인');
  assert.ok(button);
  await button.props.onPress();
  assert.equal(polls, 2);
  assert.equal(posts, 0);
  assert.equal(storage.get('pendingChat.user.home'), saved);
  const input = children.find((child) => child?.type === 'input');
  assert.equal(input.props.disabled, true);
  cleanup();
});

test('pause and end stop stale retries and never send another BACKGROUND event', async () => {
  const clock = new Clock();
  let effect, listener, sequence = 0;
  let session = { sessionId: 'session', status: 'study' };
  const sent = [];
  const mocks = {
    react: { useEffect: (callback) => { effect = callback; } },
    'react-native': { AppState: { currentState: 'background', addEventListener: (_, callback) => { listener = callback; return { remove() {} }; } } },
    'expo-notifications': { addPushTokenListener: () => ({ remove() {} }) },
    '@/hooks/useStudySession': { useStudySession: () => session },
    '@/mocks/store': { useMockStore: () => ({ loggedIn: true, loading: false, userId: 'user' }) },
    '@/utils/api': { ApiError },
    '@/services/studyPresence': {
      supportsRemotePush: () => true, isPushDeviceRegistered: () => true,
      syncPushRegistration: async () => 'installation', waitForPushRegistration: async () => {},
      createPresenceEvent: async (state) => ({ state, sequence: ++sequence }),
      transmitPresence: async (_, event) => { sent.push(event); if (event.state === 'BACKGROUND') throw new ApiError(0); },
    },
  };
  const service = load('src/hooks/useStudyPresence.ts', mocks, clock.globals);
  service.useStudyPresence(); let cleanup = effect();
  await flush(); cleanup();
  session = { sessionId: 'session', status: 'rest' };
  service.useStudyPresence(); cleanup = effect();
  await clock.advance(8000); cleanup();
  session = { status: 'idle' };
  service.useStudyPresence(); cleanup = effect();
  listener('background'); await clock.advance(8000); cleanup();
  assert.deepEqual(sent.map((event) => event.state), ['BACKGROUND', 'FOREGROUND']);
});

test('restored reminder retries keep the old session without ending a new study session', async () => {
  const saved = { sessionId: 'old-session', remindAt: '2026-11-18T11:30:00Z', timeZone: 'Asia/Seoul' };
  const state = [], refs = [], effects = [], requests = [], alerts = [];
  let stateIndex = 0, refIndex = 0, ends = 0, exits = 0;
  const jsx = (type, props) => ({ type, props });
  const passthrough = { __esModule: true, default: 'component' };
  const mocks = {
    react: {
      useState: (initial) => {
        const index = stateIndex++;
        if (!(index in state)) state[index] = initial;
        return [state[index], (value) => { state[index] = value; }];
      },
      useRef: (initial) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
      useEffect: (callback) => effects.push(callback),
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'view', Text: 'text', StyleSheet: { create: (value) => value }, Platform: { OS: 'android' } },
    'expo-router': { router: { dismissTo: () => { exits++; } } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0 }) },
    '@/constants/theme': { colors: {}, fonts: {}, fontSize: {} },
    '@/hooks/useStudySession': {
      useStudySession: () => ({ sessionId: 'new-session', status: 'study' }),
      studyActions: { end: async () => { ends++; } },
    },
    '@/mocks/store': {
      useMockStore: () => ({ tasks: [], userId: 'user' }),
      reminderActions: { setFromSession: async (...args) => { requests.push(args); return { reminder: null, scheduled: false }; } },
    },
    '@/services/reminderDraft': { readReminderDraft: async () => saved, saveReminderDraft: async () => {} },
    '@/utils/alert': { showAlert: (...args) => alerts.push(args) },
    '@/utils/date': { formatReminder: (value) => value },
  };
  for (const name of ['@/components/common/DateTimeSheet', '@/components/common/Button',
    ...['CharacterTile', 'ExitSheet', 'MyTile', 'NextAlarmSheet', 'StudyBottomBar', 'TimerPill'].map((name) => '@/features/study/' + name)]) mocks[name] = passthrough;
  const screen = load('src/app/study/index.tsx', mocks).default;
  screen(); effects[0](); await flush();
  stateIndex = 0; refIndex = 0;
  const tree = screen();
  const retry = tree.props.children[0].props.children.find((child) => child?.props?.label === '같은 예약 다시 시도');
  await retry.props.onPress();
  assert.equal(ends, 0);
  assert.deepEqual(requests, [[saved.sessionId, saved.remindAt, saved.timeZone]]);
  assert.equal(exits, 1);
  assert.equal(alerts[0][0], '예약 상태를 확인했어');
  assert.ok(!alerts.some(([title]) => title === '알림을 저장했어'));
});
