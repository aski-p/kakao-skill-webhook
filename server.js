require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const ROUTER_VERSION = 'context-aware-support-router-2026-05-17';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const CLAUDE_TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS || 3200);
const CHAT_BUDGET_MS = Number(process.env.CHAT_BUDGET_MS || 2400);
const MAX_RESPONSE_LENGTH = Number(process.env.KAKAO_MAX_RESPONSE_LENGTH || 1000);
const MAX_OUTPUTS = Number(process.env.KAKAO_MAX_OUTPUTS || 3);
const MAX_HISTORY_MESSAGES = Number(process.env.KAKAO_HISTORY_MESSAGES || 10);

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_SEARCH_TIMEOUT_MS = Number(process.env.NAVER_SEARCH_TIMEOUT_MS || 1300);
const NAVER_SEARCH_DISPLAY = Number(process.env.NAVER_SEARCH_DISPLAY || 5);
const WEATHER_TIMEOUT_MS = Number(process.env.WEATHER_TIMEOUT_MS || 1600);

const NAVER_WEB_SEARCH_URL = 'https://openapi.naver.com/v1/search/webkr.json';
const NAVER_NEWS_SEARCH_URL = 'https://openapi.naver.com/v1/search/news.json';
const NAVER_SHOPPING_SEARCH_URL = 'https://openapi.naver.com/v1/search/shop.json';
const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const conversations = new Map();
const continuations = new Map();
const dialogueState = new Map();

const ROUTES = Object.freeze([
  { intent: 'continuation', handler: 'state', description: '잘린 답변 이어보기' },
  { intent: 'weather', handler: 'weather_api', description: '실시간 날씨' },
  { intent: 'calendar_holiday', handler: 'calendar', description: '달력/휴일 계산' },
  { intent: 'price', handler: 'shopping_price', description: '제품 가격/시세 계산' },
  { intent: 'shopping_recommendation', handler: 'shopping_recommendation', description: '구매 목적 제품 추천' },
  { intent: 'news_search', handler: 'news_search_then_llm', description: '최신 뉴스 검색' },
  { intent: 'web_lookup', handler: 'web_search_then_llm', description: '웹 검색 기반 정보 확인' },
  { intent: 'chat', handler: 'llm_chat', description: '잡담/상담/일반 지식/취향 추천' },
]);

const KOREA_CITY_COORDS = {
  서울: [37.5665, 126.9780], 부산: [35.1796, 129.0756], 대구: [35.8714, 128.6014], 인천: [37.4563, 126.7052],
  광주: [35.1595, 126.8526], 대전: [36.3504, 127.3845], 울산: [35.5384, 129.3114], 세종: [36.4800, 127.2890], 제주: [33.4996, 126.5312],
  노원: [37.6542, 127.0568], 강남: [37.5172, 127.0473], 마포: [37.5663, 126.9019], 송파: [37.5145, 127.1059],
};

const KOREAN_PUBLIC_HOLIDAYS = {
  2026: {
    '2026-01-01': '신정', '2026-02-16': '설날 연휴', '2026-02-17': '설날', '2026-02-18': '설날 연휴',
    '2026-03-01': '삼일절', '2026-03-02': '삼일절 대체공휴일', '2026-05-05': '어린이날',
    '2026-05-24': '부처님오신날', '2026-05-25': '부처님오신날 대체공휴일', '2026-06-03': '제9회 전국동시지방선거일', '2026-06-06': '현충일',
    '2026-08-15': '광복절', '2026-08-17': '광복절 대체공휴일', '2026-09-24': '추석 연휴', '2026-09-25': '추석', '2026-09-26': '추석 연휴', '2026-09-28': '추석 대체공휴일',
    '2026-10-03': '개천절', '2026-10-05': '개천절 대체공휴일', '2026-10-09': '한글날', '2026-12-25': '성탄절',
  },
  2027: {
    '2027-01-01': '신정', '2027-02-06': '설날 연휴', '2027-02-07': '설날', '2027-02-08': '설날 연휴', '2027-02-09': '설날 대체공휴일',
    '2027-03-01': '삼일절', '2027-05-05': '어린이날', '2027-05-13': '부처님오신날', '2027-06-06': '현충일',
    '2027-08-15': '광복절', '2027-08-16': '광복절 대체공휴일', '2027-09-14': '추석 연휴', '2027-09-15': '추석', '2027-09-16': '추석 연휴',
    '2027-10-03': '개천절', '2027-10-04': '개천절 대체공휴일', '2027-10-09': '한글날', '2027-10-11': '한글날 대체공휴일', '2027-12-25': '성탄절', '2027-12-27': '성탄절 대체공휴일',
  },
};

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const normalizeText = (text) => String(text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const stripHtml = (text) => normalizeText(text).replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
const getKoreanDateTime = () => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'medium' }).format(new Date());
const getKoreaNow = () => new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
const pad2 = (value) => String(value).padStart(2, '0');
const toDateKey = (year, month, day) => `${year}-${pad2(month)}-${pad2(day)}`;
const weekdayKo = (year, month, day) => ['일', '월', '화', '수', '목', '금', '토'][new Date(Date.UTC(year, month - 1, day)).getUTCDay()];

function getUserMessage(body) { return normalizeText(body?.userRequest?.utterance || body?.utterance || body?.message || ''); }
function getUserId(body) { return body?.userRequest?.user?.id || body?.userRequest?.user?.properties?.botUserKey || 'anonymous'; }
function getCallbackUrl(body) { return body?.userRequest?.callbackUrl || body?.callbackUrl || ''; }
function getConversation(userId) { return conversations.get(userId) || []; }
function getState(userId) { return dialogueState.get(userId) || { lastIntent: 'new', topic: '', slots: {}, turns: 0, updatedAt: 0 }; }

function splitForKakao(text) {
  const chunks = [];
  let rest = normalizeText(text) || '응, 뭐 도와줄까?';
  while (rest.length > MAX_RESPONSE_LENGTH) {
    const slice = rest.slice(0, MAX_RESPONSE_LENGTH);
    const breakAt = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf('. '), slice.lastIndexOf(' '));
    const end = breakAt > MAX_RESPONSE_LENGTH * 0.55 ? breakAt + 1 : MAX_RESPONSE_LENGTH;
    chunks.push(rest.slice(0, end).trim());
    rest = rest.slice(end).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

function kakaoTextResponse(text, quickReplies, userId) {
  const chunks = splitForKakao(text);
  const template = { outputs: chunks.slice(0, MAX_OUTPUTS).map((chunk) => ({ simpleText: { text: chunk } })) };
  const replies = Array.isArray(quickReplies) ? [...quickReplies] : [];
  if (chunks.length > MAX_OUTPUTS && userId) {
    continuations.set(userId, chunks.slice(MAX_OUTPUTS));
    replies.push({ label: '이어보기', action: 'message', messageText: '이어보기' });
  }
  if (replies.length) template.quickReplies = replies;
  return { version: '2.0', template };
}

function inferTopic(message, previousTopic = '') {
  if (/브레인\s*포그|브레인포그|인지|인지능력|시지각|지각능력|집중력|기억력|뇌|두뇌|주의력|멍함|머리.*안|adhd|우울|불안/i.test(message)) return 'brain_health';
  if (/친구|화가|화나|짜증|속상|억울|서운|어떻게\s*해야|어떡|컴퓨터.*사|사갔|거래|환불|청소|더러워/i.test(message)) return 'support';
  if (/위스키|whisky|whiskey|글렌알라키|cs10|cs 10|스모키|피트|셰리|버번|싱글몰트|하이볼|글렌드로낙|아란|스프링뱅크|레드브레스트|라프로익|탈리스커/i.test(message)) return '위스키';
  if (/전자레인지|전자렌지|rtx|5090|그래픽카드|노트북|모니터|냉장고|세탁기/.test(message)) return getShoppingQuery(message);
  if (/휴일|공휴일|달력|연휴/.test(message)) return '휴일';
  if (/날씨|기온|습도|미세먼지/.test(message)) return '날씨';
  return previousTopic || '';
}

function rememberMessage(userId, role, content, route, topic, analysis) {
  const history = getConversation(userId);
  history.push({ role, content: normalizeText(content).slice(0, 1600) });
  conversations.set(userId, history.slice(-MAX_HISTORY_MESSAGES));
  const previous = getState(userId);
  const sourceText = role === 'user' ? content : `${topic || ''} ${analysis?.topic || ''} ${analysis?.productQuery || ''}`;
  dialogueState.set(userId, {
    ...previous,
    lastIntent: route?.intent || previous.lastIntent,
    topic: inferTopic(sourceText, topic || previous.topic || ''),
    slots: { ...previous.slots, lastAnalysis: analysis || previous.slots?.lastAnalysis },
    turns: (previous.turns || 0) + (role === 'assistant' ? 1 : 0),
    updatedAt: Date.now(),
  });
}

const isContinuationRequest = (message) => /^(이어보기|더 보기|더보기|계속|다음)$/i.test(message);
const hasBuyCue = (message) => /(구매|구입|사려|살까|사면|살만|쇼핑|판매|최저가|가격대|예산|제품|상품|모델|본품|재고)/.test(message);
const hasPriceCue = (message) => /(가격|시세|최저가|평균가|평균\s*가격|구매가|판매가|중고가|견적|얼마야|얼마임|얼마쯤|얼마\s*정도|얼마인지)/.test(message);
const hasProductSignal = (message) => /(제품|상품|모델|구매|판매|쇼핑|본품|중고|신품|가격|시세|최저가|견적|전자레인지|전자렌지|오븐|에어프라이어|노트북|모니터|청소기|그래픽카드|냉장고|세탁기|건조기|rtx|gtx|iphone|ipad|galaxy|맥북|ssd|cpu|gpu|위스키|whisky|whiskey)/i.test(message);
const isCapabilityQuestion = (message) => /(너|너는|니가|네가).*(잘\s*알아|알아\?|가능|할\s*수|해줄\s*수|추천\s*가능|뭐해|뭐\s*할)|추천\s*가능\??$|잘\s*알아\??$/.test(message);
const isSmallTalk = (message) => !hasBuyCue(message) && !hasPriceCue(message) && /(뭐해|뭐\s*하고|심심|피곤|졸려|쉬고\s*싶|기분|잡담|얘기하자|수다|너는\s*내일|뭐\s*할\s*예정|그냥|ㅋㅋ|ㅎㅎ)/.test(message);
const isCalendarHolidayQuery = (message) => /(달력|휴일|공휴일|쉬는\s*날|빨간\s*날|연휴|대체공휴일|명절|선거일).*(얼마나|몇\s*개|몇\s*일|며칠|언제|알려|있어|많아|계산|확인|다음달|이번달|내년|올해|\d{1,2}월)|(?:다음달|이번달|내년|올해|\d{1,2}월).*(달력|휴일|공휴일|쉬는\s*날|빨간\s*날|연휴|대체공휴일|명절|선거일)/.test(message);
const isWeatherQuery = (message) => /날씨|기온|비\s*와|눈\s*와|미세먼지|습도|강수|온도/.test(message) && /(날씨|기온|습도|미세먼지).*(알려|검색|찾아|확인|조회|어때|몇|얼마|봐줘)?|(?:알려|검색|찾아|확인|조회).*(날씨|기온|습도|미세먼지)/.test(message);
const isPriceQuery = (message) => !isCalendarHolidayQuery(message) && !isWeatherQuery(message) && hasPriceCue(message) && hasProductSignal(message);
const isExplicitPurchaseRecommendation = (message) => !isCalendarHolidayQuery(message) && !isWeatherQuery(message) && hasBuyCue(message) && /(추천|골라|알려|찾아|비교|좋은|괜찮은)/.test(message) && hasProductSignal(message);
const isNewsQuery = (message) => /(뉴스|기사|속보|논란|발표|업데이트|최신\s*뉴스|최근\s*뉴스)/.test(message);
const isExplicitSearchQuery = (message) => !isCalendarHolidayQuery(message) && /(인터넷|웹에서|네이버|구글|검색|찾아봐|알아봐|확인해|출처|자료|최신|최근|실시간)/.test(message);

function isBrainHealthQuestion(message, state = {}) {
  if (hasBuyCue(message) || hasPriceCue(message) || isWeatherQuery(message) || isCalendarHolidayQuery(message)) return false;
  if (/브레인\s*포그|브레인포그|인지|인지능력|시지각|지각능력|집중력|기억력|뇌|두뇌|주의력|멍함|머리.*안/i.test(message)) return true;
  return state.topic === 'brain_health' && /(의도.*알아|질문.*의도|디테일|자세히|추천해줘|어떻게|왜|원인|검사|병원)/.test(message);
}

function isEmotionalAdviceQuestion(message, state = {}) {
  if (isWeatherQuery(message) || isCalendarHolidayQuery(message) || isPriceQuery(message) || isExplicitPurchaseRecommendation(message)) return false;
  if (/(화가\s*나|화나|짜증|속상|억울|서운|불쾌|불편|어떻게\s*해야|어떡|고민|친구|가족|회사|상사|연인|거래|사갔|빌려|빌려줬|컴퓨터.*더러|더러워)/.test(message)) return true;
  return state.topic === 'support' && /(어떻게|뭐라고|말해|답장|사과|화나|속상|괜찮|해야)/.test(message);
}

function isPreferenceRecommendation(message, state = {}) {
  if (hasBuyCue(message) || hasPriceCue(message) || isExplicitSearchQuery(message) || isWeatherQuery(message) || isCalendarHolidayQuery(message) || state.topic === 'brain_health' || state.topic === 'support') return false;
  return state.topic === '위스키' && /(추천|비슷한|맛난|맛있는|스타일|끌리|안끌리|다른\s*것|좋아해|취향|골라|어울려|뭐가\s*좋|더|비싼|강한|부드러운|달달한|스모키|피트|셰리|버번|마실)/.test(message);
}

function getSearchQuery(message) { return normalizeText(message).replace(/인터넷에서|웹에서|네이버에서|구글에서|검색해서|검색해|찾아봐|알아봐|확인해|알려줘|최신|최근|실시간|출처/g, ' ').replace(/[?？！!,.]/g, ' ').replace(/\s+/g, ' ').trim() || message; }
function getShoppingQuery(message) { return normalizeText(message).replace(/현재|지금|평균\s*가격|평균가|가격|시세|최저가|얼마야|얼마임|얼마쯤|얼마인지|알려줘|검색|찾아봐|정확히|제품|상품|추천|골라줘|구매하려고|구매|구입|사려|살까|사면|하는데|해줘|좀/g, ' ').replace(/[?？！!,.]/g, ' ').replace(/\s+/g, ' ').trim() || message; }
function getProductQueryFromPurchase(message) { return normalizeText(message).replace(/구매하려고|구매|구입|사려|살까|사면|쇼핑|판매|제품|상품|모델|추천해줘|추천|골라줘|골라|알려줘|알려|찾아줘|찾아|하는데|해줘|좀/g, ' ').replace(/[?？！!,.]/g, ' ').replace(/\s+/g, ' ').trim() || getShoppingQuery(message); }

function routeFromIntent(intent, confidence = 0.9, source = 'heuristic') { const route = ROUTES.find((item) => item.intent === intent) || ROUTES.find((item) => item.intent === 'chat'); return { ...route, confidence, source }; }

function analyzeTurn(message, userId) {
  const state = getState(userId);
  if (isContinuationRequest(message)) return { intent: 'continuation', tool: 'none', confidence: 1, topic: state.topic || '', productQuery: '', searchQuery: '', source: 'heuristic' };
  if (isCalendarHolidayQuery(message)) return { intent: 'calendar_holiday', tool: 'calendar', confidence: 0.98, topic: '', productQuery: '', searchQuery: '', source: 'heuristic' };
  if (isWeatherQuery(message)) return { intent: 'weather', tool: 'weather', confidence: 0.95, topic: '', productQuery: '', searchQuery: '', source: 'heuristic' };
  if (isPriceQuery(message)) return { intent: 'price', tool: 'shopping', confidence: 0.92, topic: '', productQuery: getShoppingQuery(message), searchQuery: '', source: 'heuristic' };
  if (isExplicitPurchaseRecommendation(message)) return { intent: 'shopping_recommendation', tool: 'shopping', confidence: 0.9, topic: '', productQuery: getProductQueryFromPurchase(message), searchQuery: '', source: 'heuristic_purchase' };
  if (isNewsQuery(message)) return { intent: 'news_search', tool: 'news', confidence: 0.82, topic: '', productQuery: '', searchQuery: getSearchQuery(message), source: 'heuristic' };
  if (isExplicitSearchQuery(message)) return { intent: 'web_lookup', tool: 'web', confidence: 0.78, topic: '', productQuery: '', searchQuery: getSearchQuery(message), source: 'heuristic' };
  return { intent: 'chat', tool: 'none', confidence: 0.72, topic: inferTopic(message, state.topic), productQuery: '', searchQuery: '', source: 'heuristic' };
}

function buildBrainHealthAnswer(message, state = {}) {
  if (/의도.*알아|질문.*의도|내가.*뭘.*묻/.test(message)) return '응, 네 의도는 “내가 말한 인지 저하, 브레인포그, 시지각 문제가 실제로 뇌 기능이랑 연결될 수 있는지, 그리고 어느 정도로 심각하게 봐야 하는지”를 묻는 거야.\n\n연관은 있을 수 있어. 다만 그게 곧바로 뇌 손상이나 큰 병이라는 뜻은 아니고, 수면 부족, 스트레스, 불안/우울, ADHD 성향, 약물, 혈당/갑상선/빈혈, 눈 문제, 편두통, 전정기관 문제 같은 것들도 비슷하게 만들 수 있어.';
  if (/디테일|자세히|구체/.test(message)) return '좀 자세히 말하면, 브레인포그는 “생각이 느림, 집중 유지가 안 됨, 말이나 기억이 바로 안 떠오름” 같은 실행기능/주의력 쪽 문제로 느껴질 수 있어. 시지각은 눈으로 본 정보를 뇌가 해석하는 과정이라서, 단순 시력 말고도 공간감, 글자 읽기, 움직임 추적, 피로감이 같이 엮일 수 있고.\n\n그래서 네 말처럼 인지능력과 시지각이 같이 흔들리면 뇌와 무관하다고 보긴 어려워. 다만 원인은 넓어. 뇌 자체 문제일 수도 있지만 수면, 스트레스, 불안, 우울, ADHD, 눈의 조절/사위 문제, 편두통, 빈혈/갑상선/비타민 결핍도 가능해.\n\n갑자기 심해졌거나 한쪽 마비, 말 어눌함, 심한 두통, 시야 결손이 있으면 바로 진료 쪽이고, 오래 지속되는 문제면 신경과나 정신건강의학과, 안과/신경안과 쪽으로 나눠서 확인하는 게 좋아.';
  if (/추천/.test(message)) return '추천은 이렇게 해볼게.\n\n1. 먼저 수면 시간, 카페인, 스트레스, 복용 약, 증상이 심한 시간대를 1~2주 기록해봐.\n2. 시야가 흐리거나 글자가 흔들리면 안과에서 시력 말고 조절/사위/안구운동 쪽도 봐달라고 해.\n3. 브레인포그가 계속되면 혈액검사로 빈혈, 갑상선, 비타민 B12/D, 혈당 쪽을 확인해봐.\n4. 집중력 문제와 오래된 산만함이 같이 있으면 정신건강의학과에서 ADHD/불안/우울 평가도 의미 있어.\n5. 갑자기 악화, 한쪽 힘 빠짐, 말 어눌함, 심한 두통, 시야 일부가 안 보임은 바로 응급 쪽이야.';
  return '응, 연관이 있을 수 있어. 인지능력, 브레인포그, 시지각은 전부 “뇌가 정보를 받아들이고 처리하고 집중을 유지하는 과정”이랑 연결돼.\n\n다만 이게 곧바로 심각한 뇌질환이라는 뜻은 아니야. 수면 부족, 스트레스, 불안/우울, ADHD 성향, 눈의 조절 문제, 편두통, 빈혈/갑상선/비타민 문제 같은 것도 비슷하게 만들 수 있어.\n\n갑자기 생겼거나 계속 악화되거나 한쪽 마비, 말 어눌함, 심한 두통, 시야 결손이 있으면 빨리 진료를 봐야 해.';
}

function buildEmotionalAdviceAnswer(message, state = {}) {
  if (/친구.*컴퓨터|컴퓨터.*사갔|사갔.*더러|더러워.*화/.test(message)) return '그건 화날 만해. 일단 바로 감정 섞어서 따지기보단, 먼저 “어느 부분이 더러웠는지” 사진이나 상태를 확인하고 기준을 정하는 게 좋아.\n\n이미 팔기로 한 물건이면 네가 할 수 있는 건 보통 3가지야. 1. 미안하다고 하고 청소비/소액 환불을 제안하기, 2. 다시 가져와서 네가 청소해주기, 3. 판매 전 상태를 서로 오해한 거면 차분히 설명하기.\n\n친구 관계가 중요하면 “기분 나빴겠다. 내가 확인을 덜 했네. 어느 부분이 제일 문제였는지 사진 보내줘. 가능한 선에서 처리할게” 정도로 보내는 게 제일 덜 싸워.';
  if (/뭐라고|답장|말해/.test(message)) return '이렇게 보내면 무난해.\n\n“기분 나빴겠다. 내가 상태를 제대로 확인 못 한 것 같아. 어느 부분이 제일 문제였는지 사진으로 보내줘. 내가 청소해주거나, 필요한 만큼 조정할 수 있는지 볼게.”\n\n핵심은 사과는 짧게 하고, 바로 해결 선택지를 주는 거야. 감정싸움으로 가면 손해가 커져.';
  if (/화가|화나|짜증|속상|억울/.test(message)) return '지금은 감정이 올라온 상태라 바로 세게 말하면 더 꼬일 수 있어. 먼저 네가 화난 이유를 한 문장으로 정리해봐. “내가 일부러 그런 게 아닌데 더럽다고만 하니까 억울하다”인지, “친구한테 미안한데 어떻게 수습할지 모르겠다”인지에 따라 답장이 달라져.\n\n대화는 인정 한 줄, 사실 확인 한 줄, 해결책 한 줄로 가면 좋아.';
  return '네 의도는 “지금 감정이 올라왔는데, 관계를 망치지 않으면서 어떻게 대응해야 하냐”는 거야. 우선 바로 따지기보다 상대가 불편했던 지점을 확인하고, 네가 해줄 수 있는 범위를 정해서 말하는 게 좋아. 감정은 인정하되 책임 범위는 차분히 나누는 쪽이 제일 안전해.';
}

function buildCapabilityAnswer(message) {
  if (/위스키|whisky|whiskey/i.test(message)) return '응, 위스키 추천 가능해. 바로 쇼핑 검색부터 하는 게 아니라 먼저 취향을 잡는 게 맞아.\n\n입문이면 부드럽고 달달한 쪽, 스모키한 향 좋아하면 피트 쪽, 하이볼용이면 가성비 좋은 블렌디드 쪽으로 나눠서 추천해줄 수 있어.\n\n예산이랑 “하이볼용/그냥 마실용/선물용” 중에 뭐인지 말해주면 거기에 맞춰 골라줄게.';
  if (/추천/.test(message)) return '응, 추천 가능해. 바로 검색부터 하지 말고 먼저 용도랑 취향을 잡아야 제대로 골라줄 수 있어. 예산, 원하는 느낌, 피하고 싶은 조건을 말해주면 거기에 맞춰서 좁혀줄게.';
  return '응, 그건 도와줄 수 있어. 바로 검색이 필요한 건 검색해서 알려주고, 그냥 취향이나 생각 정리가 필요한 건 대화하면서 맞춰줄게.';
}

function buildSmallTalkAnswer(message) {
  if (/뭐해|뭐\s*하고/.test(message)) return '나 지금 여기서 네 말 보고 있었지. 이제 잡담이랑 검색을 더 확실히 나눠서 받게 고쳤어.';
  if (/쉬고\s*싶|피곤|졸려/.test(message)) return '그럴 땐 진짜 잠깐 쉬는 게 맞아. 머리 계속 굴리면 더 꼬이더라. 오늘은 무리하지 말고 숨 좀 돌리자.';
  if (/너는\s*내일|뭐\s*할\s*예정/.test(message)) return '나는 내일도 여기서 네 질문 받으면서 도와주고 있을 것 같아. 너는 내일 뭐 하면서 쉬려고?';
  return null;
}

function buildWhiskyAnswer(message, state) {
  const topicIsWhisky = state.topic === '위스키' || /위스키|whisky|whiskey|글렌알라키|cs10|cs 10|스모키|피트|셰리|버번|싱글몰트/i.test(message);
  if (!topicIsWhisky) return null;
  if (/글렌알라키|cs10|cs 10/i.test(message) && /비슷|있어|추천/.test(message)) return '글렌알라키 CS10 좋아하면 진한 셰리감이랑 높은 도수에서 오는 농도가 취향인 쪽이네.\n\n비슷한 결로는 글렌드로낙 15 리바이벌, 아란 셰리 캐스크, 탐두 배치 스트렝스가 먼저 떠올라. CS10보다 더 묵직하고 달달한 쪽이면 글렌드로낙 18도 괜찮고, 조금 더 깔끔하게 가면 아벨라워 아부나흐도 잘 맞을 가능성 있어.';
  if (/안\s*끌리|별로|아쉬/.test(message)) return '오케이, 그럼 CS10 비슷한 안전빵 말고 아예 방향을 틀어보자.\n\n더 진하고 비싼 쪽이면 글렌드로낙 18, 아란 18, 글렌알라키 15가 좋고, 완전히 다른 매력으로 가면 스프링뱅크 15, 레드브레스트 21, 라가불린 16 쪽이 더 재밌어.';
  if (/비싸|맛난|맛있는|스타일|다른|프리미엄|고급/.test(message)) return '그럼 CS10 기준에서 더 비싸고 맛도 확실한 쪽으로 이렇게 볼게.\n\n1. 글렌드로낙 18 - 진한 셰리, 묵직함, CS10 좋아하면 가장 안전하게 업그레이드 느낌\n2. 아란 18 또는 21 - 과일, 몰트, 셰리 밸런스가 좋고 질감이 깔끔해\n3. 스프링뱅크 15 - 짭짤함, 펑키함, 복합미가 있어서 완전 다른 재미가 있어\n4. 레드브레스트 21 - 아이리시인데 고급스럽고 부드럽고 과일감이 좋아\n5. 라가불린 16 또는 라프로익 Lore - 피트/스모키 쪽으로 확 틀고 싶을 때';
  return null;
}

function buildFastPreferenceAnswer(message, userId) { const state = getState(userId); if (!isPreferenceRecommendation(message, state)) return null; return buildWhiskyAnswer(message, state); }
function buildTimeoutFallback(message, userId) { const state = getState(userId); if (isBrainHealthQuestion(message, state)) return buildBrainHealthAnswer(message, state); if (isEmotionalAdviceQuestion(message, state)) return buildEmotionalAdviceAnswer(message, state); return buildFastPreferenceAnswer(message, userId) || '잠깐 답변이 늦어질 것 같아서 짧게 먼저 말할게. 네 말의 핵심은 이해했고, 지금은 검색보다 상황을 차분히 정리해서 답하는 쪽이 맞아. 바로 이어서 구체적으로 물어봐주면 그 부분부터 잡아줄게.'; }

function getContinuationResponse(userId) { const chunks = continuations.get(userId); if (!chunks?.length) return kakaoTextResponse('이어볼 내용은 없어. 새로 물어봐줘.'); continuations.delete(userId); return kakaoTextResponse(chunks.join('\n\n'), undefined, userId); }

async function resolveWeatherLocation(location) { const key = location.replace(/^서울\s*/, '').replace(/구$/, ''); if (KOREA_CITY_COORDS[key]) return { name: location, latitude: KOREA_CITY_COORDS[key][0], longitude: KOREA_CITY_COORDS[key][1] }; const response = await axios.get(OPEN_METEO_GEOCODING_URL, { params: { name: location, count: 1, language: 'ko', format: 'json', countryCode: 'KR' }, timeout: WEATHER_TIMEOUT_MS }); const result = response.data?.results?.[0]; return result ? { name: result.name || location, latitude: result.latitude, longitude: result.longitude } : { name: '서울', latitude: 37.5665, longitude: 126.9780 }; }
function getWeatherLocation(message) { for (const key of Object.keys(KOREA_CITY_COORDS)) if (message.includes(key)) return key; const match = message.match(/([가-힣]{2,10})\s*(날씨|기온|습도|미세먼지)/); return match?.[1] || '서울'; }
function getWeatherDescription(code) { const value = Number(code); if (value === 0) return '맑음'; if ([1, 2, 3].includes(value)) return '구름 있음'; if ([45, 48].includes(value)) return '안개'; if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(value)) return '비'; if ([71, 73, 75, 77, 85, 86].includes(value)) return '눈'; if ([95, 96, 99].includes(value)) return '천둥번개'; return '날씨 변화 있음'; }
async function getWeatherAnswer(message) { const location = await resolveWeatherLocation(getWeatherLocation(message)); const dayOffset = /모레/.test(message) ? 2 : /내일/.test(message) ? 1 : 0; const response = await axios.get(OPEN_METEO_FORECAST_URL, { params: { latitude: location.latitude, longitude: location.longitude, timezone: 'Asia/Seoul', forecast_days: Math.max(1, dayOffset + 1), current: 'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m', daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' }, timeout: WEATHER_TIMEOUT_MS }); const current = response.data?.current || {}; const daily = response.data?.daily || {}; if (dayOffset > 0) return `${location.name} 기준 ${dayOffset === 1 ? '내일' : '모레'} 날씨야.\n예보는 ${getWeatherDescription(daily.weather_code?.[dayOffset])} 쪽이고, 최저/최고는 ${daily.temperature_2m_min?.[dayOffset]}°C / ${daily.temperature_2m_max?.[dayOffset]}°C 정도야.\n강수확률은 ${daily.precipitation_probability_max?.[dayOffset] ?? '확인 필요'}%로 보여.`; return `${location.name} 기준 현재 날씨야.\n지금 ${current.temperature_2m}°C, 체감 ${current.apparent_temperature}°C, ${getWeatherDescription(current.weather_code)}이야.\n오늘 최저/최고는 ${daily.temperature_2m_min?.[0]}°C / ${daily.temperature_2m_max?.[0]}°C 정도고, 강수확률은 ${daily.precipitation_probability_max?.[0] ?? '확인 필요'}%야.\n습도는 ${current.relative_humidity_2m}%, 바람은 ${current.wind_speed_10m}km/h 정도야.`; }

function getTargetMonth(message) { const now = getKoreaNow(); let year = now.getFullYear(); let month = now.getMonth() + 1; const explicitMonth = message.match(/(\d{1,2})\s*월/); if (/내년/.test(message)) year += 1; if (explicitMonth) month = Number(explicitMonth[1]); else if (/다음\s*달|다음달|내달/.test(message)) { month += 1; if (month > 12) { month = 1; year += 1; } } return { year, month }; }
function buildHolidayAnswer(message) { const { year, month } = getTargetMonth(message); const holidays = KOREAN_PUBLIC_HOLIDAYS[year] || {}; const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate(); const restDays = new Set(); const items = []; for (let day = 1; day <= lastDay; day += 1) { const key = toDateKey(year, month, day); const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); if (dow === 0 || dow === 6) restDays.add(key); if (holidays[key]) { restDays.add(key); items.push({ day, dow, name: holidays[key] }); } } const weekdayPublic = items.filter((item) => item.dow !== 0 && item.dow !== 6).length; const lines = [`${year}년 ${month}월 기준으로 계산해봤어.`, `주말까지 포함해서 쉬는 날은 총 ${restDays.size}일이야.`, `공휴일만 따로 보면 ${items.length}개고, 그중 평일 공휴일은 ${weekdayPublic}개야.`]; if (items.length) { lines.push('공휴일은 이렇게 있어:'); items.forEach((item) => lines.push(`- ${item.day}일(${weekdayKo(year, month, item.day)}): ${item.name}`)); } if (year === 2026 && month === 6) lines.push('6월 6일 현충일은 토요일이라 주말이랑 겹쳐. 평일에 추가로 쉬는 건 6월 3일 지방선거일 하루로 보면 돼.'); return lines.join('\n'); }

const formatWon = (value) => `${Math.round(value).toLocaleString('ko-KR')}원`;
const getMedian = (values) => { const sorted = [...values].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2; };
const getTrimmedPrices = (values) => values.length < 5 ? values : [...values].sort((a, b) => a - b).slice(1, -1);
const queryTokens = (query) => normalizeText(query).toLowerCase().split(/\s+/).filter((token) => token.length >= 2 && !/인기|모델|추천|현재|판매|중인|정확|알려|찾아/.test(token));
function itemMatchesQuery(query, item) { const title = item.title.toLowerCase().replace(/\s+/g, ''); const tokens = queryTokens(query).map((token) => token.toLowerCase().replace(/\s+/g, '')); const important = tokens.filter((token) => /전자레인지|전자렌지|오븐|에어프라이어|노트북|모니터|청소기|그래픽카드|냉장고|세탁기|건조기|rtx|gtx|iphone|ipad|galaxy|맥북|ssd|cpu|gpu|위스키|whisky|whiskey/i.test(token)); return (important.length ? important : tokens.slice(0, 3)).every((token) => title.includes(token)); }
function isRelevantShoppingItem(query, item) { const q = query.toLowerCase().replace(/\s+/g, ''); const title = item.title.toLowerCase(); if (/전자레인지|전자렌지/.test(query) && /전기레인지|인덕션|하이라이트|식기세척|마그네트론|부품|교체|수리|렌탈/.test(title)) return false; if (/5090/.test(q)) { const accessoryWords = /케이블|cable|라이저|riser|브라켓|bracket|수냉|워터블럭|water\s*block|백플레이트|쿨러|fan|팬|방열판|거치대|스탠드|지지대|홀더|커버|부품|부속|박스|메인보드|파워|케이스/; const gpuWords = /rtx|geforce|지포스|그래픽카드|그래픽 카드|vga|gpu/; if (accessoryWords.test(title) || !gpuWords.test(title) || item.lprice < 2500000) return false; } return itemMatchesQuery(query, item); }
async function searchNaverShoppingByQuery(query, display = 20) { if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return []; const response = await axios.get(NAVER_SHOPPING_SEARCH_URL, { params: { query, display, sort: 'sim' }, headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }, timeout: NAVER_SEARCH_TIMEOUT_MS }); return (response.data?.items || []).map((item) => ({ title: stripHtml(item.title), link: item.link, mallName: stripHtml(item.mallName), lprice: Number(item.lprice || 0) })).filter((item) => item.lprice > 0); }
async function searchNaverShopping(message, analysis) { const query = normalizeText(analysis?.productQuery || analysis?.topic || getShoppingQuery(message)); return (await searchNaverShoppingByQuery(query, 20)).filter((item) => isRelevantShoppingItem(query, item)); }
function buildShoppingPriceAnswer(message, items, analysis) { const query = normalizeText(analysis?.productQuery || analysis?.topic || getShoppingQuery(message)); if (!items.length) return `${query} 가격은 쇼핑 검색에서 본품으로 보이는 상품을 못 찾았어. 모델명을 조금 더 정확히 적어줘.`; const sorted = [...items].sort((a, b) => a.lprice - b.lprice); const prices = sorted.map((item) => item.lprice); const trimmed = getTrimmedPrices(prices); const average = trimmed.reduce((sum, price) => sum + price, 0) / trimmed.length; return [`${query} 현재 쇼핑 검색 기준으로 본품만 추려서 계산해봤어.`, `확인한 상품 ${prices.length}개 기준 ${trimmed.length === prices.length ? '평균' : '이상치 제외 평균'}은 약 ${formatWon(average)}야.`, `중앙값은 약 ${formatWon(getMedian(prices))}, 가격 범위는 ${formatWon(prices[0])}~${formatWon(prices[prices.length - 1])} 정도로 보여.`, '낮은 가격순으로 보면:', ...sorted.slice(0, 3).map((item, index) => `${index + 1}. ${formatWon(item.lprice)} - ${item.title}${item.mallName ? ` (${item.mallName})` : ''}`), '재고/배송비/카드할인에 따라 실구매가는 달라질 수 있어.'].join('\n'); }
function buildShoppingRecommendationAnswer(query, items) { const filtered = items.filter((item) => isRelevantShoppingItem(query, item) && !/중고|리퍼|부품|필터|접시|선반|커버|용기|도어|핸들|수리|렌탈/i.test(item.title)).sort((a, b) => a.lprice - b.lprice); if (!filtered.length) return `${query}로 쇼핑 검색을 했는데 추천할 만한 본품을 못 찾았어. 원하는 가격대나 용도를 조금 더 말해줘.`; const pick = filtered[Math.min(1, filtered.length - 1)]; return [`${query}는 지금 검색 기준으로 이쪽이 무난해 보여.`, `내 추천은 ${pick.title} (${pick.mallName || '판매처 확인 필요'}) - ${formatWon(pick.lprice)} 정도야.`, '부속품이나 다른 카테고리 섞인 건 빼고, 가격이랑 판매처가 비교적 정상적인 쪽을 골랐어.', '비교 후보는:', ...filtered.slice(0, 3).map((item, index) => `${index + 1}. ${formatWon(item.lprice)} - ${item.title}${item.mallName ? ` (${item.mallName})` : ''}`)].join('\n'); }
async function searchNaver(message, route, analysis) { if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET || !['web_lookup', 'news_search'].includes(route.intent)) return []; const query = normalizeText(analysis?.searchQuery || analysis?.topic || getSearchQuery(message)); const url = route.intent === 'news_search' ? NAVER_NEWS_SEARCH_URL : NAVER_WEB_SEARCH_URL; const response = await axios.get(url, { params: { query, display: Math.min(Math.max(NAVER_SEARCH_DISPLAY, 1), 10), sort: route.intent === 'news_search' ? 'date' : 'sim' }, headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }, timeout: NAVER_SEARCH_TIMEOUT_MS }); return (response.data?.items || []).map((item) => ({ title: stripHtml(item.title), link: item.link || item.originallink, description: stripHtml(item.description), date: item.pubDate || '' })); }
function formatSearchContext(results) { return (results || []).slice(0, NAVER_SEARCH_DISPLAY).map((item, index) => [`[${index + 1}] ${item.title}`, item.description ? `요약: ${item.description}` : '', item.date ? `날짜: ${item.date}` : '', item.link ? `링크: ${item.link}` : ''].filter(Boolean).join('\n')).join('\n\n'); }
function buildSearchFallbackAnswer(message, results, analysis) { if (!results.length) return '인터넷 검색 결과를 못 찾았어. 검색어를 조금 더 구체적으로 보내주면 다시 찾아볼게.'; const query = normalizeText(analysis?.searchQuery || analysis?.topic || getSearchQuery(message)); return [`${query}로 찾아본 결과 중 제일 가까운 건 “${results[0].title}”야.`, results[0].description || '', ...results.slice(0, 3).map((item, index) => `${index + 1}. ${item.title}\n${item.link || ''}`)].filter(Boolean).join('\n'); }

function buildSystemPrompt(results, route, state, analysis) { const searchContext = formatSearchContext(results); return ['너는 카카오톡에서 대화하는 친근한 한국어 AI 친구야.', '모든 답변은 자연스러운 반말로 해. 존댓말, ~요, ~습니다 말투는 쓰지 마.', '사용자 말을 먼저 이해하고, 카톡 대화처럼 짧고 자연스럽게 받아쳐.', '감정/갈등 상담은 먼저 감정을 인정하고, 바로 할 행동을 2~3개로 정리해.', '건강/인지 관련 질문은 진단처럼 단정하지 말고 가능성과 확인 방향을 말해. 위험 신호가 있으면 진료를 권해.', '취향 추천은 쇼핑 검색이 아니라 대화 맥락과 취향을 기준으로 해. 구매처/가격/최저가/판매 모델을 묻는 경우에만 쇼핑 맥락으로 말해.', '찾아볼게/기다려줘처럼 미래에 도구를 실행할 척하지 마.', '카카오톡 제한시간이 짧으니까 보통 1~5문장으로 답해.', `현재 한국 시간: ${getKoreanDateTime()}`, `라우터: ${route.intent}/${route.handler}, source=${route.source || 'unknown'}`, `분석: ${JSON.stringify(analysis || {})}`, `대화 상태: ${JSON.stringify(state || {})}`, searchContext ? `검색 결과:\n${searchContext}` : ''].filter(Boolean).join('\n'); }
async function callClaude(message, userId, results, route, analysis) { if (!CLAUDE_API_KEY) return '지금 Claude API 키가 설정 안 돼 있어서 일반 대화를 못 이어가. Railway 변수에 CLAUDE_API_KEY가 필요해.'; const history = getConversation(userId).slice(-MAX_HISTORY_MESSAGES).map((item) => ({ role: item.role, content: item.content })); const response = await axios.post(CLAUDE_API_URL, { model: CLAUDE_MODEL, max_tokens: ['web_lookup', 'news_search'].includes(route.intent) ? 850 : 300, temperature: ['web_lookup', 'news_search'].includes(route.intent) ? 0.35 : 0.72, system: buildSystemPrompt(results, route, getState(userId), analysis), messages: [...history, { role: 'user', content: message }] }, { headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' }, timeout: CLAUDE_TIMEOUT_MS }); return response.data?.content?.[0]?.text || '응답을 못 만들었어. 다시 한 번만 보내줘.'; }
function withTimeout(promise, ms, fallback) { let timer; const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(typeof fallback === 'function' ? fallback() : fallback), ms); }); return Promise.race([promise.finally(() => clearTimeout(timer)), timeout]); }
function getQuickReplies(results, route) { const replies = []; if (route?.intent === 'weather') replies.push({ label: '내일 날씨', action: 'message', messageText: '내일 날씨 알려줘' }); if (route?.intent === 'price' || route?.intent === 'shopping_recommendation') replies.push({ label: '다른 조건으로', action: 'message', messageText: '조건 바꿔서 다시 추천해줘' }); if (results?.[0]?.link) replies.push({ label: '첫 결과 보기', action: 'webLink', webLinkUrl: results[0].link }); return replies; }

async function buildAnswer(message, userId) {
  const state = getState(userId);
  const smallTalk = buildSmallTalkAnswer(message);

  if (isBrainHealthQuestion(message, state)) { const route = routeFromIntent('chat', 0.98, 'fast_brain_health'); const analysis = { intent: 'chat', tool: 'none', topic: 'brain_health', source: 'fast_brain_health' }; return { answer: buildBrainHealthAnswer(message, state), results: [], route, topic: 'brain_health', analysis }; }
  if (isEmotionalAdviceQuestion(message, state)) { const route = routeFromIntent('chat', 0.98, 'fast_support'); const analysis = { intent: 'chat', tool: 'none', topic: 'support', source: 'fast_support' }; return { answer: buildEmotionalAdviceAnswer(message, state), results: [], route, topic: 'support', analysis }; }
  if (isCapabilityQuestion(message) && !hasBuyCue(message) && !hasPriceCue(message)) { const route = routeFromIntent('chat', 0.99, 'fast_capability'); const analysis = { intent: 'chat', tool: 'none', topic: inferTopic(message, state.topic), source: 'fast_capability' }; return { answer: buildCapabilityAnswer(message), results: [], route, topic: analysis.topic, analysis }; }
  if (smallTalk) { const route = routeFromIntent('chat', 0.96, 'fast_smalltalk'); const analysis = { intent: 'chat', tool: 'none', topic: inferTopic(message, state.topic), source: 'fast_smalltalk' }; return { answer: smallTalk, results: [], route, topic: analysis.topic, analysis }; }

  const analysis = analyzeTurn(message, userId);
  const route = routeFromIntent(analysis.intent, analysis.confidence, analysis.source);
  if (route.intent === 'calendar_holiday') return { answer: buildHolidayAnswer(message), results: [], route, topic: '', analysis };
  if (route.intent === 'weather') return { answer: await getWeatherAnswer(message), results: [], route, topic: '', analysis };
  if (route.intent === 'price') { const items = await searchNaverShopping(message, analysis); return { answer: buildShoppingPriceAnswer(message, items, analysis), results: items, route, topic: analysis.productQuery || getShoppingQuery(message), analysis }; }
  if (route.intent === 'shopping_recommendation') { const query = normalizeText(analysis.productQuery || analysis.topic || getProductQueryFromPurchase(message)); const items = await searchNaverShoppingByQuery(`${query} 인기 모델`, 20); return { answer: buildShoppingRecommendationAnswer(query, items), results: items.filter((item) => isRelevantShoppingItem(query, item)), route, topic: query, analysis }; }

  const fastPreference = buildFastPreferenceAnswer(message, userId);
  if (fastPreference) { const fastRoute = routeFromIntent('chat', 0.97, 'fast_preference'); const fastAnalysis = { intent: 'chat', tool: 'none', topic: inferTopic(message, state.topic), source: 'fast_preference' }; return { answer: fastPreference, results: [], route: fastRoute, topic: fastAnalysis.topic, analysis: fastAnalysis }; }

  let results = [];
  try { results = await searchNaver(message, route, analysis); } catch (error) { console.error('[search] failed:', { message: error.message, code: error.code, status: error.response?.status }); }
  try { const answer = await withTimeout(callClaude(message, userId, results, route, analysis), ['web_lookup', 'news_search'].includes(route.intent) ? CHAT_BUDGET_MS + 700 : CHAT_BUDGET_MS, () => buildTimeoutFallback(message, userId)); return { answer, results, route, topic: analysis.topic || inferTopic(message, state.topic), analysis }; } catch (error) { if (results.length) return { answer: buildSearchFallbackAnswer(message, results, analysis), results, route, topic: analysis.topic || '', analysis }; return { answer: buildTimeoutFallback(message, userId), results, route, topic: analysis.topic || '', analysis }; }
}

async function sendCallback(callbackUrl, message, userId) { try { rememberMessage(userId, 'user', message); const { answer, results, route, topic, analysis } = await buildAnswer(message, userId); rememberMessage(userId, 'assistant', answer, route, topic, analysis); await axios.post(callbackUrl, kakaoTextResponse(answer, getQuickReplies(results, route), userId), { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }); } catch (error) { console.error('[callback] failed:', { message: error.message, code: error.code, status: error.response?.status }); } }

app.get('/', (req, res) => res.type('html').send(`<h1>카카오 스킬 웹훅 서버</h1><p>상태: 정상 실행 중</p><p>라우터: ${ROUTER_VERSION}</p><p>현재 한국 시간: ${getKoreanDateTime()}</p>`));
app.get('/health', (req, res) => res.json({ ok: true, service: 'kakao-skill-webhook', routerVersion: ROUTER_VERSION, timestamp: new Date().toISOString(), koreaTime: getKoreanDateTime(), env: { claudeApiKey: Boolean(CLAUDE_API_KEY), claudeModel: CLAUDE_MODEL, claudeTimeoutMs: CLAUDE_TIMEOUT_MS, chatBudgetMs: CHAT_BUDGET_MS, maxResponseLength: MAX_RESPONSE_LENGTH, maxOutputs: MAX_OUTPUTS, naverApi: Boolean(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET), routes: ROUTES.length, dialogueStates: dialogueState.size, port: PORT } }));
app.get('/routes', (req, res) => res.json({ ok: true, routerVersion: ROUTER_VERSION, routes: ROUTES }));
app.get('/test', (req, res) => res.json(kakaoTextResponse('테스트 성공! 카카오 스킬 응답 형식 정상이야.')));

app.post('/kakao-skill-webhook', async (req, res) => {
  const startedAt = Date.now();
  const message = getUserMessage(req.body);
  const userId = getUserId(req.body);
  const callbackUrl = getCallbackUrl(req.body);
  if (!message) return res.json(kakaoTextResponse('메시지 입력해줘.'));
  if (isContinuationRequest(message)) return res.json(getContinuationResponse(userId));
  try {
    if (callbackUrl) { setImmediate(() => sendCallback(callbackUrl, message, userId)); return res.json({ version: '2.0', useCallback: true, data: { text: '맥락 보고 바로 답하고 있어. 잠깐만 기다려줘.' } }); }
    rememberMessage(userId, 'user', message);
    const { answer, results, route, topic, analysis } = await buildAnswer(message, userId);
    rememberMessage(userId, 'assistant', answer, route, topic, analysis);
    console.log(`[kakao] ${Date.now() - startedAt}ms route=${route.intent}/${route.handler} source=${route.source || ''} search=${results.length} topic=${topic || ''} user=${userId} message="${message.slice(0, 80)}"`);
    return res.json(kakaoTextResponse(answer, getQuickReplies(results, route), userId));
  } catch (error) {
    console.error('[kakao] failed:', { message: error.message, code: error.code, status: error.response?.status, elapsedMs: Date.now() - startedAt });
    return res.json(kakaoTextResponse(buildTimeoutFallback(message, userId)));
  }
});

app.use((req, res) => res.status(404).json({ ok: false, error: 'Not Found' }));
app.listen(PORT, () => {
  console.log(`Kakao skill webhook server listening on port ${PORT}`);
  console.log(`Router version: ${ROUTER_VERSION}`);
  console.log(`Claude model: ${CLAUDE_MODEL}`);
});
