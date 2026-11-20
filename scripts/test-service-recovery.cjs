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

function hookHarness() {
  const state = [], refs = [];
  let stateIndex = 0, refIndex = 0;
  const effects = [];
  return {
    effects,
    render: (component, props) => { stateIndex = 0; refIndex = 0; return component(props); },
    react: {
      useState: (initial) => {
        const index = stateIndex++;
        if (!(index in state)) state[index] = typeof initial === 'function' ? initial() : initial;
        return [state[index], (value) => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
      },
      useRef: (initial) => refs[refIndex++] ?? (refs[refIndex - 1] = { current: initial }),
      useCallback: (callback) => callback,
      useEffect: (callback) => effects.push(callback),
      useSyncExternalStore: (_, snapshot) => snapshot(),
    },
  };
}
const jsx = (type, props) => ({ type, props });
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
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
    '@/utils/token': {}, '@/utils/preferences': {}, '@/utils/api': { ApiError }, '@/hooks/useStudySession': {}, '@/services/studyPresence': {}, '@/services/studyStart': {},
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
    '@/utils/api': { ApiError },
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
  const button = children.find((child) => child?.props?.label === '결과 다시 확인');
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

async function chatHarness(createExchange, recover) {
  const hooks = hookHarness(), storage = new Map(), requests = [], queries = [];
  const helpers = recovery(async () => null, new Clock());
  const component = load('src/features/chat/ChatRoom.tsx', {
    react: hooks.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { FlatList: 'list', Text: 'text', StyleSheet: { create: (value) => value }, Platform: { OS: 'web' } },
    '@/components/common/Button': { __esModule: true, default: 'button' },
    '@/features/chat/ChatInput': { __esModule: true, default: 'input' }, '@/features/chat/MessageItem': {},
    '@/constants/characters': { CHARACTER_IDS: ['joy'] }, '@/constants/theme': { colors: {}, fonts: {} },
    '@/mocks/store': { useMockStore: () => ({ userId: 'user' }) }, '@/utils/api': { ApiError },
    '@/services/backend': {
      getChatHistory: async () => ({ items: [] }),
      getChatUsage: async () => ({ dailyRequestLimit: 30, availability: 'AVAILABLE' }),
      newClientRequestId: () => 'original-id',
      createExchange: async (request) => { requests.push(request); return createExchange(request); },
    },
    '@/services/chatRecovery': { ...helpers, pollExchange: async (id) => { queries.push(id); return recover?.(id) ?? null; } },
    '@/utils/preferences': { readPreference: async (key, fallback) => storage.get(key) ?? fallback, writePreference: async (key, value) => storage.set(key, value) },
    '@/utils/alert': { showAlert() {} },
  });
  const conversation = component.default({}).type;
  const render = () => nodes(hooks.render(conversation, { userId: 'user' }));
  render(); const cleanup = hooks.effects[0](); await flush();
  return { render, storage, requests, queries, cleanup,
    send: async () => { await render().find((node) => node.type === 'input').props.onSend('보낸 문장'); } };
}

test('CHAT_NOT_CONFIGURED overrides AVAILABLE usage and ends waiting while retaining the sent text', async () => {
  const chat = await chatHarness(async () => { throw new ApiError(503, { code: 'CHAT_NOT_CONFIGURED' }); });
  await chat.send();
  const tree = chat.render();
  assert.equal(chat.queries.length, 0);
  assert.equal(chat.storage.get('pendingChat.user.home'), null);
  assert.equal(tree.find((node) => node.type === 'input').props.disabled, false);
  const messages = tree.find((node) => node.type === 'list').props.data;
  assert.ok(messages.some((message) => message.text === '보낸 문장'));
  assert.ok(messages.every((message) => !message.pending));
  assert.ok(tree.some((node) => node.props?.children === '지금은 캐릭터 대화를 이용할 수 없어. 스터디룸에서 공부는 계속할 수 있어.'));
  chat.cleanup();
});

test('CHAT_SAFETY_SUPPORT displays the server message and allows the next input without polling', async () => {
  const message = '서버에서 제공한 지원 안내입니다.';
  const chat = await chatHarness(async () => { throw new ApiError(422, { code: 'CHAT_SAFETY_SUPPORT', message }); });
  await chat.send();
  const tree = chat.render();
  assert.ok(tree.some((node) => node.props?.children === message));
  assert.equal(tree.find((node) => node.type === 'input').props.disabled, false);
  assert.equal(chat.queries.length, 0);
  assert.equal(chat.storage.get('pendingChat.user.home'), null);
  chat.cleanup();
});

for (const code of ['CHAT_MEMORY_WRITE_FAILED', 'AI_USAGE_RECORD_FAILED']) {
  for (const httpError of [false, true]) {
    test(`${code} (${httpError ? 'HTTP error' : '200 FAILED'}) retains the original request for GET-only recheck`, async () => {
      const chat = await chatHarness(async () => {
        if (httpError) throw new ApiError(503, { code });
        return { clientRequestId: 'original-id', status: 'FAILED', failureCode: code, utterances: [] };
      }, () => ({ clientRequestId: 'original-id', status: 'SUCCEEDED', failureCode: null, utterances: [{ characterKey: 'JOY', content: '답변' }] }));
      await chat.send();
      assert.equal(chat.storage.get('pendingChat.user.home').content, '보낸 문장');
      assert.equal(chat.queries.length, 0);
      assert.equal(chat.render().find((node) => node.type === 'input').props.disabled, true);
      await chat.render().find((node) => node.props?.label === '결과 다시 확인').props.onPress();
      assert.deepEqual(chat.queries, ['original-id']);
      assert.equal(chat.requests.length, 1);
      assert.equal(chat.storage.get('pendingChat.user.home'), null);
      assert.equal(chat.render().find((node) => node.type === 'input').props.disabled, false);
      chat.cleanup();
    });
  }
}

function studyStartHarness(clock, storage, post, current = async () => ({ studySession: null })) {
  let serial = 0;
  return load('src/services/studyStart.ts', {
    '@/services/backend': { newClientRequestId: () => 'start-' + (++serial), startStudySession: post, getCurrentStudySession: current },
    '@/services/chatRecovery': recovery(async () => null, clock), '@/utils/api': { ApiError },
    '@/utils/preferences': {
      readPreference: async (key, fallback) => storage.get(key) ?? fallback,
      writePreference: async (key, value) => storage.set(key, JSON.parse(JSON.stringify(value))),
    },
  }, clock.globals);
}

test('study start retries, duplicate taps and an app restart preserve the exact original ID and task', async () => {
  const clock = new Clock(), storage = new Map(), requests = [];
  const service = studyStartHarness(clock, storage, async (input) => { requests.push(JSON.stringify(input)); throw new ApiError(0); });
  const first = service.startOrRecoverStudy('user', 'math');
  assert.equal(first, service.startOrRecoverStudy('user', 'other-task'));
  const failed = assert.rejects(first);
  await clock.advance(2000); await failed;
  assert.equal(requests.length, 3);
  assert.ok(requests.every((body) => body === requests[0]));
  const restarted = studyStartHarness(clock, storage, async (input) => { requests.push(JSON.stringify(input)); return { id: 'existing-room', status: 'STUDYING' }; });
  assert.equal((await restarted.startOrRecoverStudy('user', 'other-task')).id, 'existing-room');
  assert.equal(requests[3], requests[0]);
  assert.equal(storage.get('pendingStudyStart.user'), null);
});

test('ACTIVE_STUDY_EXISTS recovers the currently open room', async () => {
  const clock = new Clock(), storage = new Map();
  const room = { id: 'open-room', status: 'PAUSED' };
  const service = studyStartHarness(clock, storage, async () => { throw new ApiError(409, { code: 'ACTIVE_STUDY_EXISTS' }); }, async () => ({ studySession: room }));
  assert.equal(await service.startOrRecoverStudy('user', 'math'), room);
  assert.equal(storage.get('pendingStudyStart.user'), null);
});

test('logout cancels study start retries before an account can change', async () => {
  const clock = new Clock(), storage = new Map();
  let posts = 0;
  const service = studyStartHarness(clock, storage, async () => { posts++; throw new ApiError(0); });
  const operation = service.startOrRecoverStudy('user', 'math');
  const failure = assert.rejects(operation, /중단/);
  await flush(); service.cancelPendingStudyStart('user');
  await clock.advance(2000); await failure;
  assert.equal(posts, 1);
});

test('the timer sums prior task time and current session time without doubling on pause/resume', async () => {
  const clock = new Clock(); clock.now = 10000;
  const dto = { id: 'session', taskId: 'math', status: 'STUDYING', studySeconds: 120, priorTaskStudySeconds: 600, version: 0 };
  const service = load('src/hooks/useStudySession.ts', {
    react: { useSyncExternalStore: (_, snapshot) => snapshot(), useState: (initial) => [initial()], useEffect() {} },
    '@/services/backend': { changeStudySession: async (_, action) => ({ ...dto, studySeconds: 125, status: action === 'PAUSE' ? 'PAUSED' : 'STUDYING' }) },
    '@/services/studyStart': {}, '@/utils/api': { ApiError },
  }, clock.globals);
  service.studyActions.restore(dto);
  assert.equal(service.formatElapsed(service.useElapsed()), '00:12:00');
  clock.now += 5000;
  assert.equal(service.formatElapsed(service.useElapsed()), '00:12:05');
  await service.studyActions.pause();
  assert.equal(service.formatElapsed(service.useElapsed()), '00:12:05');
  await service.studyActions.resume();
  assert.equal(service.formatElapsed(service.useElapsed()), '00:12:05');
  service.studyActions.restore({ ...dto, priorTaskStudySeconds: undefined });
  assert.equal(service.formatElapsed(service.useElapsed()), '00:02:00');
});

test('server logout uses the existing bearer and sends no request body', async () => {
  const calls = [];
  const service = backend(async (path, options) => { calls.push([path, options]); }, new Clock());
  await service.logoutSession();
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'auth/logout');
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].headers.Authorization, 'Bearer test');
  assert.equal('body' in calls[0][1], false);
});

test('logout revokes the token before local cleanup and keeps credentials when the server is unreachable', async () => {
  const events = [];
  let unavailable = true;
  const service = load('src/mocks/store.ts', {
    react: { useSyncExternalStore: (_, snapshot) => snapshot() },
    '@/services/backend': { logoutSession: async () => { events.push('server'); if (unavailable) throw new ApiError(0); } },
    '@/services/studyPresence': { unregisterCurrentPushDevice: async () => events.push('unregister') },
    '@/services/studyStart': {}, '@/utils/api': { ApiError }, '@/utils/preferences': {},
    '@/utils/token': { readAccessToken: async () => 'token', clearAccessToken: async () => events.push('clear') },
    '@/services/localNotifications': { cancelAllStartReminders: async () => events.push('cancel-local') },
    '@/hooks/useStudySession': { reset: () => {}, studyActions: { reset: () => events.push('reset-study') } },
  });
  await assert.rejects(service.authActions.logout());
  assert.deepEqual(events, ['unregister', 'server']);
  unavailable = false; events.length = 0;
  await service.authActions.logout();
  assert.deepEqual(events, ['unregister', 'server', 'cancel-local', 'clear', 'reset-study']);
  assert.equal(service.useMockStore().loggedIn, false);
});

test('leaving without an alarm after END succeeds navigates home without retrying the failed reservation', async () => {
  const hooks = hookHarness();
  let session = { sessionId: 'session', status: 'study' }, draft = null, reservations = 0, ends = 0, exits = 0, cancels = 0;
  const mocks = {
    react: hooks.react, 'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { View: 'view', Text: 'text', StyleSheet: { create: (value) => value }, Platform: { OS: 'android' } },
    'expo-router': { router: { dismissTo: () => { exits++; } } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0 }) }, '@/constants/theme': { colors: {}, fonts: {}, fontSize: {} },
    '@/hooks/useStudySession': {
      useStudySession: () => session,
      studyActions: { end: async () => { ends++; session = { status: 'idle' }; return { id: 'session' }; } },
    },
    '@/mocks/store': {
      useMockStore: () => ({ tasks: [], userId: 'user' }),
      reminderActions: {
        setFromSession: async () => { reservations++; throw new ApiError(503); },
        cancelForSession: () => { cancels++; return new Promise(() => {}); },
      },
    },
    '@/services/reminderDraft': { readReminderDraft: async () => draft, saveReminderDraft: async (_, value) => { draft = value; } },
    '@/utils/alert': { showAlert() {} }, '@/utils/date': { formatReminder: (value) => value },
  };
  for (const name of ['@/components/common/DateTimeSheet', '@/components/common/Button',
    ...['CharacterTile', 'ExitSheet', 'MyTile', 'NextAlarmSheet', 'StudyBottomBar', 'TimerPill'].map((name) => '@/features/study/' + name)]) mocks[name] = { __esModule: true, default: name };
  const screen = load('src/app/study/index.tsx', mocks).default;
  const render = () => nodes(hooks.render(screen));
  render(); hooks.effects[0](); await flush();
  await render().find((node) => node.type === '@/features/study/NextAlarmSheet').props.onExit(new Date(Date.now() + 1800000).toISOString());
  assert.equal(session.status, 'idle');
  assert.equal(ends, 1); assert.equal(reservations, 1); assert.equal(exits, 0);
  await render().find((node) => node.props?.label === '알림 없이 나가기').props.onPress();
  assert.equal(exits, 1); assert.equal(reservations, 1); assert.equal(ends, 1);
  assert.equal(cancels, 1); assert.equal(draft, null); assert.equal(session.status, 'idle');
});

function loadStudySession(backend) {
  return load('src/hooks/useStudySession.ts', {
    react: { useSyncExternalStore: (_, snapshot) => snapshot(), useState: (initial) => [initial()], useEffect() {} },
    '@/services/backend': backend,
    '@/services/studyStart': {}, '@/utils/api': { ApiError },
  });
}

test('END sent right after a chat RESUME waits for it and uses the new version', async () => {
  const calls = [];
  let release;
  const service = loadStudySession({
    changeStudySession: async (id, action, version) => {
      calls.push(`${action}@${version}`);
      if (action === 'RESUME') await new Promise((resolve) => { release = resolve; });
      if (version !== calls.length - 1) throw new ApiError(409, 'VERSION_CONFLICT', 'stale');
      return { id, taskId: null, status: action === 'END' ? 'ENDED' : 'STUDYING', studySeconds: 60, version: version + 1 };
    },
    getCurrentStudySession: async () => assert.fail('no sync expected'),
  });
  service.studyActions.restore({ id: 'room', taskId: null, status: 'PAUSED', studySeconds: 60, version: 0 });
  const resumed = service.studyActions.resume('room');
  const ended = service.studyActions.end();
  await flush();
  assert.equal(calls.join(), 'RESUME@0');
  release();
  await resumed;
  assert.equal((await ended).id, 'room');
  assert.equal(calls.join(), 'RESUME@0,END@1');
  assert.equal(service.useStudySession().status, 'idle');
});

test('END 409 on a room the server already ended counts as ended so the reservation can continue', async () => {
  const service = loadStudySession({
    changeStudySession: async () => { throw new ApiError(409, 'VERSION_CONFLICT', 'stale'); },
    getCurrentStudySession: async () => ({ studySession: null }),
  });
  service.studyActions.restore({ id: 'room', taskId: null, status: 'STUDYING', studySeconds: 60, version: 3 });
  assert.equal((await service.studyActions.end()).id, 'room');
  assert.equal(service.useStudySession().status, 'idle');
});

test('END 409 on a room that is still open retries once with the latest version', async () => {
  const versions = [];
  const service = loadStudySession({
    changeStudySession: async (id, _action, version) => {
      versions.push(version);
      if (version !== 5) throw new ApiError(409, 'VERSION_CONFLICT', 'stale');
      return { id, taskId: null, status: 'ENDED', studySeconds: 90, version: 6 };
    },
    getCurrentStudySession: async () => ({ studySession: { id: 'room', taskId: null, status: 'STUDYING', studySeconds: 90, version: 5 } }),
  });
  service.studyActions.restore({ id: 'room', taskId: null, status: 'STUDYING', studySeconds: 60, version: 4 });
  assert.equal((await service.studyActions.end()).id, 'room');
  assert.equal(versions.join(), '4,5');
});
