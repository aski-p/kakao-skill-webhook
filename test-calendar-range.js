const assert = require('node:assert/strict');
const {
  parseCalendarQueryRange,
  parseCalendarEvent,
  isCalendarItemInRange,
  formatGoogleCalendarEvent,
  groupGoogleCalendarEventsByDate,
  formatWeeklyCalendarSummaryAnswer,
  formatWeeklyCalendarCardEvents,
  truncateForMonthCard,
} = require('./server');

const range = parseCalendarQueryRange('12일 일정 알려줘');

assert.equal(range.startDate, '2026-05-12');
assert.equal(range.endDate, '2026-05-13');
assert.equal(range.timeMin, '2026-05-12T00:00:00+09:00');
assert.equal(range.timeMax, '2026-05-13T00:00:00+09:00');

const nextWeekRange = parseCalendarQueryRange('다음주 일정 알려줘');
assert.equal(nextWeekRange.label, '다음 주');
assert.equal(nextWeekRange.days, 7);
assert.equal(nextWeekRange.startDate, '2026-05-25');
assert.equal(nextWeekRange.endDate, '2026-06-01');

const nextMondayRange = parseCalendarQueryRange('다음주 월요일 일정 알려줘');
assert.equal(nextMondayRange.days, 1);
assert.equal(nextMondayRange.startDate, '2026-05-25');
assert.equal(nextMondayRange.endDate, '2026-05-26');

const previousFridayRange = parseCalendarQueryRange('저번주 금요일 일정 알려줘');
assert.equal(previousFridayRange.days, 1);
assert.equal(previousFridayRange.startDate, '2026-05-15');
assert.equal(previousFridayRange.endDate, '2026-05-16');

const weekAfterNextRange = parseCalendarQueryRange('다다음주 일정 알려줘');
assert.equal(weekAfterNextRange.label, '다다음 주');
assert.equal(weekAfterNextRange.startDate, '2026-06-01');
assert.equal(weekAfterNextRange.endDate, '2026-06-08');

const monthlyRange = parseCalendarQueryRange('한달 달력 보여줘');
assert.equal(monthlyRange.label, '이번 달');
assert.equal(monthlyRange.startDate, '2026-05-01');
assert.equal(monthlyRange.endDate, '2026-06-01');

const event = parseCalendarEvent('다음주 월요일 오전 11시 우체국 보험 접수 일정 등록 해줘');
assert.equal(event.summary, '우체국 보험 접수');
assert.equal(event.start, '2026-05-25T11:00:00+09:00');
assert.equal(event.end, '2026-05-25T12:00:00+09:00');
assert.equal(event.allDay, false);

const dayOnlyEvent = parseCalendarEvent('27일 신생아특례대출 일정 등록해줘');
assert.equal(dayOnlyEvent.summary, '신생아특례대출');
assert.equal(dayOnlyEvent.startDate, '2026-05-27');
assert.equal(dayOnlyEvent.endDate, '2026-05-28');
assert.equal(dayOnlyEvent.allDay, true);

assert.equal(truncateForMonthCard('건강검진 신경외과 예약'), '건강검진 신...');
assert.equal(truncateForMonthCard('우체국 보험 전화'), '우체국 보험...');

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

const weeklyItems = [
  { kind: 'tasks#task', due: '2026-05-25T00:00:00.000Z', title: '티비 설치' },
  { kind: 'tasks#task', due: '2026-05-25T00:00:00.000Z', title: 'KT 전화' },
  { start: { date: '2026-05-26' }, end: { date: '2026-05-27' }, summary: '공부' },
  { start: { dateTime: '2026-05-26T14:00:00+09:00' }, end: { dateTime: '2026-05-26T15:00:00+09:00' }, summary: '병원' },
  { kind: 'tasks#task', due: '2026-05-26T00:00:00.000Z', title: '서류 정리' },
];
const weeklyGroups = groupGoogleCalendarEventsByDate(weeklyItems);
assert.equal(
  formatWeeklyCalendarSummaryAnswer(nextWeekRange, weeklyGroups),
  [
    '다음 주 시간표',
    '월요일은 티비 설치 외 1건',
    '화요일은 공부 외 2건',
    '수요일은 일정 없음',
    '목요일은 일정 없음',
    '금요일은 일정 없음',
    '토요일은 일정 없음',
    '일요일은 일정 없음',
  ].join('\n'),
);
assert.deepEqual(formatWeeklyCalendarCardEvents(nextWeekRange, weeklyGroups).slice(0, 2), [
  { time: '5. 25. (월)', title: '티비 설치 외 1건' },
  { time: '5. 26. (화)', title: '공부 외 2건' },
]);

console.log('calendar range tests passed');
