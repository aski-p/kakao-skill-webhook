const assert = require('node:assert/strict');
const { parseCalendarQueryRange, isCalendarItemInRange, formatGoogleCalendarEvent } = require('./server');

const range = parseCalendarQueryRange('12일 일정 알려줘');

assert.equal(range.startDate, '2026-05-12');
assert.equal(range.endDate, '2026-05-13');
assert.equal(range.timeMin, '2026-05-12T00:00:00+09:00');
assert.equal(range.timeMax, '2026-05-13T00:00:00+09:00');

assert.equal(
  isCalendarItemInRange({ start: { date: '2026-05-11' }, end: { date: '2026-05-12' }, summary: '전날 종일 일정' }, range),
  false,
);
assert.equal(
  isCalendarItemInRange({ start: { date: '2026-05-12' }, end: { date: '2026-05-13' }, summary: '당일 종일 일정' }, range),
  true,
);
assert.equal(
  isCalendarItemInRange({ kind: 'tasks#task', due: '2026-05-11T00:00:00.000Z', title: '전날 할 일' }, range),
  false,
);
assert.equal(
  isCalendarItemInRange({ kind: 'tasks#task', due: '2026-05-11T15:00:00.000Z', title: '전날 늦은 할 일' }, range),
  false,
);
assert.equal(
  isCalendarItemInRange({ kind: 'tasks#task', due: '2026-05-12T00:00:00.000Z', title: '당일 할 일' }, range),
  true,
);

assert.equal(
  formatGoogleCalendarEvent({ kind: 'tasks#task', due: '2026-05-12T00:00:00.000Z', title: 'KT 전화' }, 0),
  '1. KT 전화 (할 일)',
);
assert.equal(
  formatGoogleCalendarEvent({ start: { date: '2026-05-12' }, end: { date: '2026-05-13' }, summary: '티비설치' }, 1),
  '2. 티비설치 (종일)',
);
assert.equal(
  formatGoogleCalendarEvent({ start: { dateTime: '2026-05-12T09:00:00+09:00' }, end: { dateTime: '2026-05-12T10:00:00+09:00' }, summary: '병원' }, 2),
  '3. 병원 (09:00-10:00)',
);

console.log('calendar range tests passed');
