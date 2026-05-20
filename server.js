require('dotenv').config();

const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const NaverWeatherCrawler = require('./crawlers/naver-weather-crawler');

const app = express();
const PORT = process.env.PORT || 3000;
const ROUTER_VERSION = 'claude-first-chat-2026-05-20b';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const CLAUDE_PLANNER_TIMEOUT_MS = Number(process.env.CLAUDE_PLANNER_TIMEOUT_MS || 900);
const CLAUDE_TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS || 4400);
const KAKAO_MAX_RESPONSE_LENGTH = Number(process.env.KAKAO_MAX_RESPONSE_LENGTH || 1000);

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_SEARCH_TIMEOUT_MS = Number(process.env.NAVER_SEARCH_TIMEOUT_MS || 1800);
const NAVER_SEARCH_DISPLAY = Math.min(Math.max(Number(process.env.NAVER_SEARCH_DISPLAY || 5), 1), 10);
const GOOGLE_CLOUD_API_KEY = process.env.GOOGLE_CLOUD_API_KEY || process.env.GOOGLE_API_KEY;
const GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON = process.env.GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;
const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID;
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const GOOGLE_OAUTH_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI;
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL;
const GOOGLE_TOKEN_STORE_PATH = process.env.GOOGLE_TOKEN_STORE_PATH || path.join(__dirname, 'data', 'google-calendar-tokens.json');
const GOOGLE_CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const KAKAO_CALENDAR_ALLOWED_USER_IDS = String(process.env.KAKAO_CALENDAR_ALLOWED_USER_IDS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const MEAL_WORD_PATTERN = /점심|저녁|아침|브런치|런치|디너|야식/;
const naverWeatherCrawler = new NaverWeatherCrawler();

const NAVER_URLS = {
  web_lookup: 'https://openapi.naver.com/v1/search/webkr.json',
  news_search: 'https://openapi.naver.com/v1/search/news.json',
  local_search: 'https://openapi.naver.com/v1/search/local.json',
  shopping_search: 'https://openapi.naver.com/v1/search/shop.json',
};

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const conversations = new Map();
const normalizeText = (text) => String(text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const stripHtml = (text) => normalizeText(text).replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
const getKoreanDateTime = () => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'medium' }).format(new Date());
const getUserMessage = (body) => normalizeText(body?.userRequest?.utterance || body?.utterance || body?.message || '');
const getUserId = (body) => body?.userRequest?.user?.id || body?.userRequest?.user?.properties?.botUserKey || 'anonymous';
const LOCAL_LOCATION_PATTERN = /[가-힣A-Za-z0-9]+(?:구|동|역|로|길|시|군|읍|면|리|가)/;
const WEATHER_WORD_PATTERN = /날씨|기온|온도|비\s*와|비와|비\s*올|비올|우산|미세먼지|초미세먼지|습도|바람/;

function normalizeKoreanSearchText(text) {
  return normalizeText(text)
    .replace(/울지로(?=\d*\s*가|\s|$)/g, '을지로')
    .replace(/울지로/g, '을지로');
}

function kakaoTextResponse(text, quickReplies = []) {
  const safeText = normalizeText(text).slice(0, KAKAO_MAX_RESPONSE_LENGTH) || '응, 다시 한 번만 보내줘.';
  const template = { outputs: [{ simpleText: { text: safeText } }] };
  if (quickReplies.length) template.quickReplies = quickReplies.slice(0, 5);
  return { version: '2.0', template };
}

function loadGoogleTokens() {
  try {
    if (!fs.existsSync(GOOGLE_TOKEN_STORE_PATH)) return {};
    return JSON.parse(fs.readFileSync(GOOGLE_TOKEN_STORE_PATH, 'utf8'));
  } catch (error) {
    console.error('[google-calendar] token load failed:', error.message);
    return {};
  }
}

function saveGoogleTokens(tokens) {
  fs.mkdirSync(path.dirname(GOOGLE_TOKEN_STORE_PATH), { recursive: true });
  fs.writeFileSync(GOOGLE_TOKEN_STORE_PATH, JSON.stringify(tokens, null, 2));
}

function hasGoogleOAuthConfig() {
  return Boolean(GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET);
}

function getPublicBaseUrl(req) {
  if (PUBLIC_BASE_URL) return PUBLIC_BASE_URL.replace(/\/$/, '');
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('x-forwarded-host') || req.get('host');
  return `${protocol}://${host}`;
}

function getGoogleRedirectUri(req) {
  return GOOGLE_OAUTH_REDIRECT_URI || `${getPublicBaseUrl(req)}/auth/google/callback`;
}

function encodeOAuthState(userId) {
  return Buffer.from(JSON.stringify({ userId })).toString('base64url');
}

function decodeOAuthState(state) {
  try {
    return JSON.parse(Buffer.from(String(state || ''), 'base64url').toString('utf8'));
  } catch {
    return {};
  }
}

function buildGoogleAuthUrl(userId, req) {
  const params = new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    redirect_uri: getGoogleRedirectUri(req),
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: encodeOAuthState(userId),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function isCalendarUserAllowed(userId) {
  return KAKAO_CALENDAR_ALLOWED_USER_IDS.includes(String(userId || ''));
}

function answerCalendarUserNotAllowed(userId) {
  const reason = KAKAO_CALENDAR_ALLOWED_USER_IDS.length
    ? '이 카카오 사용자는 캘린더 수정 허용목록에 없어.'
    : '캘린더 수정 허용목록이 아직 비어 있어.';
  return {
    answer: `${reason}\n개인 캘린더 보호를 위해 구글 연결/일정 등록은 허용된 카카오 사용자만 가능해.\n관리자는 Railway 변수 KAKAO_CALENDAR_ALLOWED_USER_IDS에 이 사용자 ID를 추가해야 해: ${userId}`,
    quickReplies: [],
    plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_user_not_allowed' },
    results: [],
  };
}

function remember(userId, role, content) {
  const history = conversations.get(userId) || [];
  history.push({ role, content: normalizeText(content).slice(0, 1200) });
  conversations.set(userId, history.slice(-8));
}

function compactGeneralQuery(message) {
  return normalizeKoreanSearchText(message)
    .replace(/(인터넷|웹|네이버|구글)?에서/g, ' ')
    .replace(/검색해서|검색해|검색|찾아봐|찾아줘|찾아줄\s*수\s*있어|찾아줄래|알아봐|알려줘|추천해줘|추천|확인해줘|확인/g, ' ')
    .replace(/최신|최근|실시간|출처|자료|좀|제발/g, ' ')
    .replace(/[?？！!,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function compactLocalQuery(message) {
  const text = normalizeKoreanSearchText(message).replace(/[?？！!,.]/g, ' ');
  const location = text.match(LOCAL_LOCATION_PATTERN)?.[0] || '';
  if (!location) return compactGeneralQuery(text);

  let target = text
    .replace(location, ' ')
    .replace(/(근처|주변|가까운|동네|인근|에서|으로|로|중에|쪽|근방|인데|인대|인데요|이에요|예요|지금|오늘)/g, ' ')
    .replace(/(\d+\s*)?(곳|개)\s*만/g, ' ')
    .replace(/(유명한|인기\s*있는|많이\s*찾는|괜찮은|좋은|맛있는|평점\s*좋은|가성비\s*좋은)/g, ' ')
    .replace(/(칠려고|치려고|하려고|하고\s*싶은데|하려\s*하는데|하는데|이용하려고|예약하려고|잡으려고|먹으려고|먹지|먹을\s*만한|먹을\s*거|먹을\s*것|먹거리|먹거)/g, ' ')
    .replace(/(잡을\s*수\s*있는\s*곳|잡을\s*수\s*있는|예약\s*가능한\s*곳|예약\s*가능한|예약할\s*수\s*있는\s*곳|예약할\s*수\s*있는)/g, ' ')
    .replace(/(맛집|식당|매장|가게|업체|장소|곳|집|브랜드|시설|센터)/g, ' ')
    .replace(/(찾아줄\s*수\s*있어|찾아줘|찾아봐|알려줘|추천해줘|추천|검색해줘|검색|어디|뭐|좀|해줘|있어|있나|있니|가능|가능한)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!target) target = compactGeneralQuery(text.replace(location, ' '));
  if (!target && /(점심|점심밥|런치)/.test(text)) target = '점심';
  if (!target && /(저녁|저녁밥|디너)/.test(text)) target = '저녁';
  if (!target && /(아침|아침밥|브런치)/.test(text)) target = '아침';
  return normalizeText(`${location} ${target || '맛집'}`).replace(/\s+/g, ' ').trim();
}

function compactSearchQuery(message, intent) {
  if (intent === 'weather_lookup') return extractWeatherLocation(message);
  const compacted = intent === 'local_search' ? compactLocalQuery(message) : compactGeneralQuery(message);
  return compacted || normalizeText(message);
}

function buildLocalRetryQueries(query) {
  const normalized = normalizeKoreanSearchText(query);
  const location = normalized.match(LOCAL_LOCATION_PATTERN)?.[0] || '';
  const meal = normalized.match(MEAL_WORD_PATTERN)?.[0] || '';
  const relaxedLocation = location.replace(/\d+\s*가$/, '');
  const stationLocation = location ? (/(?:역|터미널)$/.test(location) ? location : `${location}역`) : '';
  const candidates = [
    normalized,
    location && meal ? `${location} ${meal} 맛집` : '',
    location ? `${location} 맛집` : '',
    stationLocation && meal ? `${stationLocation} ${meal} 맛집` : '',
    stationLocation ? `${stationLocation} 맛집` : '',
    location && meal ? `${location} 식당` : '',
    location ? `${location} 밥집` : '',
    relaxedLocation && relaxedLocation !== location && meal ? `${relaxedLocation} ${meal} 맛집` : '',
    relaxedLocation && relaxedLocation !== location ? `${relaxedLocation} 맛집` : '',
  ];
  return [...new Set(candidates.map((item) => normalizeText(item)).filter(Boolean))];
}

function buildLocalFallbackQueries(plan) {
  const query = normalizeKoreanSearchText(plan.searchQuery);
  const location = query.match(LOCAL_LOCATION_PATTERN)?.[0] || query.split(/\s+/)[0] || '';
  const meal = query.match(MEAL_WORD_PATTERN)?.[0] || '';
  return buildLocalRetryQueries(`${location} ${meal || '맛집'}`)
    .filter((item) => /맛집|식당|밥집/.test(item))
    .slice(0, 4);
}

function fallbackPlan(message) {
  const text = normalizeKoreanSearchText(message);
  const hasLocation = LOCAL_LOCATION_PATTERN.test(text);
  const hasLocalSearchCue = /(근처|주변|가까운|동네|맛집|식당|매장|가게|업체|장소|시설|센터|코트|구장|체육관|운동장|연습장|클럽|예약|잡을\s*수|이용할\s*수|어디|찾아|검색|추천|유명한)/.test(text);
  if (WEATHER_WORD_PATTERN.test(text)) return { intent: 'weather_lookup', searchQuery: extractWeatherLocation(text), sort: 'sim', confidence: 0.85, source: 'fallback' };
  if (/뉴스|기사|속보|최신\s*뉴스|최근\s*뉴스/.test(text)) return { intent: 'news_search', searchQuery: compactSearchQuery(text, 'news_search'), sort: 'date', confidence: 0.75, source: 'fallback' };
  if (/가격|최저가|시세|얼마|구매|상품|제품|쇼핑/.test(text)) return { intent: 'shopping_search', searchQuery: compactSearchQuery(text, 'shopping_search'), sort: 'sim', confidence: 0.72, source: 'fallback' };
  if (hasLocation && hasLocalSearchCue) return { intent: 'local_search', searchQuery: compactSearchQuery(text, 'local_search'), sort: 'comment', confidence: 0.72, source: 'fallback' };
  if (/검색|찾아봐|알아봐|확인|최신|최근|실시간|웹|인터넷|네이버|구글|출처/.test(text)) return { intent: 'web_lookup', searchQuery: compactSearchQuery(text, 'web_lookup'), sort: 'sim', confidence: 0.7, source: 'fallback' };
  return { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.65, source: 'fallback' };
}

function shouldAnswerWithClaudeFirst(message) {
  const text = normalizeKoreanSearchText(message);
  const explicitLookupCue = /(검색|찾아봐|찾아줘|알아봐|최신|최근|실시간|뉴스|기사|속보|출처|네이버|구글|웹에서|인터넷에서)/.test(text);
  const commerceCue = /(가격|최저가|시세|얼마|구매|상품|제품|쇼핑)/.test(text);
  const localCue = LOCAL_LOCATION_PATTERN.test(text) && /(근처|주변|가까운|맛집|식당|매장|가게|업체|장소|시설|센터|예약|어디|추천)/.test(text);
  const howToCue = /(어떻게|어케|방법|가능|할\s*수\s*있|되나|되냐|만들|설정|실행|명령어|cmd|윈도|윈도우|windows|바로가기|아이콘)/i.test(text);
  return howToCue && !explicitLookupCue && !commerceCue && !localCue && !WEATHER_WORD_PATTERN.test(text);
}

function extractJsonObject(text) {
  const match = normalizeText(text).match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function normalizePlan(plan, fallback) {
  const intents = new Set(['chat', 'web_lookup', 'news_search', 'local_search', 'shopping_search', 'weather_lookup']);
  const intent = intents.has(plan?.intent) ? plan.intent : fallback.intent;
  const plannedQuery = normalizeText(plan?.searchQuery || fallback.searchQuery || '');
  return {
    intent,
    searchQuery: compactSearchQuery(plannedQuery || fallback.searchQuery, intent),
    sort: ['comment', 'sim', 'date'].includes(plan?.sort) ? plan.sort : (intent === 'local_search' ? 'comment' : fallback.sort || 'sim'),
    confidence: Number(plan?.confidence || fallback.confidence || 0.75),
    source: plan ? 'claude_planner' : fallback.source,
  };
}

async function planTurn(message, userId) {
  const fallback = fallbackPlan(message);
  if (!CLAUDE_API_KEY) return fallback;

  const history = (conversations.get(userId) || []).slice(-4).map((item) => `${item.role}: ${item.content}`).join('\n');
  const system = [
    '너는 카카오톡 챗봇의 검색 라우터야.',
    '사용자 질문을 보고 답변 방식과 필요한 검색어를 정해.',
    '반드시 JSON 객체 하나만 출력해. 설명, 마크다운, 코드블록 금지.',
    'intent는 chat, web_lookup, news_search, local_search, shopping_search, weather_lookup 중 하나야.',
    '날씨, 기온, 비, 우산, 미세먼지 같은 실시간 날씨 질문은 weather_lookup을 골라.',
    'weather_lookup의 searchQuery는 지역명만 짧게 넣어. 지역이 없으면 서울로 둬.',
    '지역 맛집, 주변 가게, 업종 추천, 장소 검색이면 local_search를 골라.',
    'local_search의 searchQuery는 네이버 지역검색에 바로 넣을 짧은 한국어 검색어로 만들어. 지역명과 조건을 포함해.',
    'local_search는 많이 찾는 순서가 필요하므로 sort는 comment로 둬.',
    '최신 정보, 사실 확인은 web_lookup이나 news_search를 골라.',
    '가격, 상품, 구매, 시세는 shopping_search를 골라.',
    '출력 형식 예: {"intent":"local_search","searchQuery":"지역명 업종","sort":"comment","confidence":0.9}',
  ].join('\n');

  try {
    const response = await axios.post(CLAUDE_API_URL, {
      model: CLAUDE_MODEL,
      max_tokens: 180,
      temperature: 0,
      system,
      messages: [{ role: 'user', content: `${history ? `최근 대화:\n${history}\n\n` : ''}현재 질문:\n${message}` }],
    }, {
      headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
      timeout: CLAUDE_PLANNER_TIMEOUT_MS,
    });
    return normalizePlan(extractJsonObject(response.data?.content?.[0]?.text || ''), fallback);
  } catch (error) {
    console.error('[planner] fallback:', { message: error.message, code: error.code, status: error.response?.status });
    return fallback;
  }
}

function isNaverConfigQuestion(message) {
  const text = normalizeKoreanSearchText(message);
  return /(네이버|naver).*(api|API|키|key|검색\s*에이피아이|검색\s*api|설정|넣|등록|확인)|((api|API|키|key).*(네이버|naver))/.test(text);
}

function isGoogleCalendarConfigQuestion(message) {
  const text = normalizeKoreanSearchText(message);
  return /(구글|google).*(캘린더|calendar|일정|예약|api|API|키|key|cloud|클라우드|연동|설정|넣|등록|확인)|((캘린더|calendar).*(구글|google|api|API|키|key|연동))/.test(text);
}

function isCalendarWriteRequest(message) {
  const text = normalizeKoreanSearchText(message);
  const hasCalendarCue = /(캘린더|calendar|일정|예약|스케줄)/.test(text);
  const hasWriteCue = /(등록|추가|생성|만들|잡아|예약해|넣어|수정|변경|삭제|지워|알림|해줘)/.test(text);
  return hasCalendarCue && hasWriteCue;
}

function answerGoogleCalendarConfigQuestion() {
  const keyReady = Boolean(GOOGLE_CLOUD_API_KEY);
  const serviceAccountReady = Boolean(GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON && GOOGLE_CALENDAR_ID);
  const oauthReady = hasGoogleOAuthConfig();
  const status = keyReady
    ? '구글 Cloud API 키는 서버 환경변수에서 확인돼.'
    : '구글 Cloud API 키는 아직 서버 환경변수에서 확인되지 않아.';
  const serviceAccountStatus = serviceAccountReady
    ? '서비스 계정 설정도 있어서 공유 캘린더 방식은 사용할 수 있어.'
    : '서비스 계정 JSON과 캘린더 ID는 아직 완성되지 않았어. 이 방식은 봇 전용/공유 캘린더에 맞아.';
  const oauthStatus = oauthReady
    ? '각자 본인 구글 캘린더를 수정하는 OAuth 설정은 준비돼 있어. 사용자는 한 번 구글 동의만 하면 돼.'
    : '각자 본인 구글 캘린더를 수정하려면 서비스 계정이 아니라 Google OAuth 클라이언트 ID/Secret이 필요해.';
  return {
    answer: `${status}\n${serviceAccountStatus}\n${oauthStatus}\n키 값 자체는 보안상 답변에 노출하지 않을게.`,
    quickReplies: [],
    plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'deterministic_google_config' },
    results: [],
  };
}

function getStoredGoogleToken(userId) {
  return loadGoogleTokens()[userId];
}

async function exchangeGoogleCodeForToken(code, redirectUri) {
  const response = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
    code,
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  }), { timeout: 5000 });
  return response.data;
}

async function refreshGoogleAccessToken(userId, token) {
  if (!token?.refresh_token) return token;
  if (token.expires_at && token.expires_at > Date.now() + 60000) return token;

  const response = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
    client_id: GOOGLE_OAUTH_CLIENT_ID,
    client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
    refresh_token: token.refresh_token,
    grant_type: 'refresh_token',
  }), { timeout: 5000 });

  const refreshed = {
    ...token,
    ...response.data,
    refresh_token: response.data.refresh_token || token.refresh_token,
    expires_at: Date.now() + Number(response.data.expires_in || 3600) * 1000,
  };
  const tokens = loadGoogleTokens();
  tokens[userId] = refreshed;
  saveGoogleTokens(tokens);
  return refreshed;
}

function formatKoreaDateTime(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00+09:00`;
}

function parseCalendarEvent(message) {
  const text = normalizeKoreanSearchText(message);
  const nowKst = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const start = new Date(nowKst);
  start.setSeconds(0, 0);

  const monthDay = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  const isoDate = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoDate) {
    start.setFullYear(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
  } else if (monthDay) {
    start.setMonth(Number(monthDay[1]) - 1, Number(monthDay[2]));
  } else if (/모레/.test(text)) {
    start.setDate(start.getDate() + 2);
  } else if (/내일/.test(text)) {
    start.setDate(start.getDate() + 1);
  }

  const time = text.match(/(오전|오후|저녁|밤|아침)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/);
  if (!time) return { error: '시간을 못 찾았어. 예: 내일 오후 3시에 병원 일정 추가해줘' };

  let hour = Number(time[2]);
  const minute = Number(time[3] || 0);
  if (/(오후|저녁|밤)/.test(time[1] || '') && hour < 12) hour += 12;
  if (/오전/.test(time[1] || '') && hour === 12) hour = 0;
  start.setHours(hour, minute, 0, 0);

  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  const title = normalizeText(text
    .replace(/(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일|오늘|내일|모레|오전|오후|저녁|밤|아침|\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/g, ' ')
    .replace(/(구글|google|캘린더|calendar|일정|예약|스케줄|등록|추가|생성|만들어줘|만들|잡아줘|잡아|넣어줘|넣어|해줘|좀|에|으로|로)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()) || '일정';

  return {
    summary: title,
    start: formatKoreaDateTime(start),
    end: formatKoreaDateTime(end),
  };
}

async function createGoogleCalendarEvent(userId, event) {
  const storedToken = getStoredGoogleToken(userId);
  if (!storedToken) return { needsAuth: true };
  const token = await refreshGoogleAccessToken(userId, storedToken);

  const response = await axios.post('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    summary: event.summary,
    start: { dateTime: event.start, timeZone: 'Asia/Seoul' },
    end: { dateTime: event.end, timeZone: 'Asia/Seoul' },
  }, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    timeout: 5000,
  });

  return { event: response.data };
}

async function answerCalendarWriteRequest(message, userId, req) {
  if (!isCalendarUserAllowed(userId)) {
    return answerCalendarUserNotAllowed(userId);
  }

  if (!hasGoogleOAuthConfig()) {
    return {
      answer: '각자 본인 구글 캘린더를 수정하려면 Google OAuth 클라이언트 ID/Secret이 먼저 필요해. 지금 화면의 서비스 계정 키 ID만으로는 사용자별 개인 캘린더 수정이 안 돼.',
      quickReplies: [],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_oauth_missing' },
      results: [],
    };
  }

  if (!getStoredGoogleToken(userId)) {
    const authUrl = buildGoogleAuthUrl(userId, req);
    return {
      answer: `본인 구글 캘린더에 일정을 넣으려면 먼저 구글 동의가 필요해.\n아래 링크로 한 번 연결한 뒤 다시 일정 추가를 말해줘.\n${authUrl}`,
      quickReplies: [{ label: '구글 연결', action: 'webLink', webLinkUrl: authUrl }],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_auth_required' },
      results: [],
    };
  }

  const event = parseCalendarEvent(message);
  if (event.error) {
    return {
      answer: event.error,
      quickReplies: [],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.8, source: 'calendar_parse_failed' },
      results: [],
    };
  }

  const result = await createGoogleCalendarEvent(userId, event);
  if (result.needsAuth) {
    const authUrl = buildGoogleAuthUrl(userId, req);
    return {
      answer: `구글 캘린더 연결이 필요해.\n${authUrl}`,
      quickReplies: [{ label: '구글 연결', action: 'webLink', webLinkUrl: authUrl }],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.9, source: 'calendar_auth_required' },
      results: [],
    };
  }

  return {
    answer: `구글 캘린더에 추가했어.\n${event.summary}\n${event.start.replace('T', ' ').replace(':00+09:00', '')}`,
    quickReplies: [],
    plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_event_created' },
    results: [result.event],
  };
}

function isWeatherQuestion(message) {
  return WEATHER_WORD_PATTERN.test(normalizeKoreanSearchText(message));
}

function extractWeatherLocation(message) {
  const original = normalizeKoreanSearchText(message);
  const directPatterns = [
    /([가-힣A-Za-z0-9]+(?:시|군|구|읍|면|동|도|역))\s*(?:날씨|기온|온도|비|미세먼지|초미세먼지)/,
    /(?:날씨|기온|온도|비|미세먼지|초미세먼지)\s*(?:는|은|이|가|좀|어때|알려줘|확인해줘|검색해줘|봐줘|봐)?\s*([가-힣A-Za-z0-9]+(?:시|군|구|읍|면|동|도|역))/,
  ];
  for (const pattern of directPatterns) {
    const match = original.match(pattern);
    if (match?.[1]) return match[1];
  }

  const text = original
    .replace(/오늘|내일|지금|현재|실시간|요즘|이번\s*주|날씨|기온|온도|비\s*와|비와|비\s*올|비올|우산|미세먼지|초미세먼지|습도|바람/g, ' ')
    .replace(/잘\s*잤어|잘잤어|굿모닝|안녕|하이|반가워|고마워|감사|알려줘|말해줘|확인해줘|확인|어때|어떻게|좀|검색해줘|검색|해줘|봐줘|봐|[?？！!,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const candidates = [
    '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종', '수원', '용인', '고양', '창원', '성남', '청주', '안산', '전주', '천안', '안양', '인덕원',
    '제주도', '제주시', '제주', '서귀포시', '서귀포',
    '경기도', '경기', '강원도', '강원', '충청북도', '충북', '충청남도', '충남', '전라북도', '전북', '전라남도', '전남', '경상북도', '경북', '경상남도', '경남',
  ];
  const found = candidates.find((candidate) => text.includes(candidate));
  if (found) return found;

  const location = text.match(/[가-힣A-Za-z0-9]+(?:시|군|구|읍|면|동|도|역)/)?.[0];
  return location || '서울';
}

function formatWeatherAnswer(city, weather) {
  const details = [];
  const condition = normalizeText(weather.condition || '').match(/맑음|구름많음|흐림|비|눈|소나기|안개|황사/)?.[0] || normalizeText(weather.condition || '');
  if (weather.temperature && weather.temperature !== '정보 없음') details.push(`기온은 ${weather.temperature.replace(/^현재 온도\s*/, '')}`);
  if (condition && !/정보 없음|가져올 수 없습니다/.test(condition)) details.push(`상태는 ${condition}`);
  if (weather.feels_like) details.push(`체감 ${weather.feels_like}`);
  if (weather.humidity) details.push(`습도 ${weather.humidity}`);
  if (weather.rainfall) details.push(`강수 ${weather.rainfall}`);
  if (weather.precipitationProbability) details.push(`강수확률 ${weather.precipitationProbability}`);
  if (weather.wind) details.push(`바람 ${weather.wind}`);
  if (weather.fineDust) details.push(`미세먼지 ${weather.fineDust}`);
  if (weather.ultraFineDust) details.push(`초미세먼지 ${weather.ultraFineDust}`);
  if (weather.lowest || weather.highest) details.push(`오늘 최저/최고는 ${weather.lowest || '?'} / ${weather.highest || '?'} 정도`);

  if (!details.length) {
    return `${city} 날씨를 바로 확인하려고 했는데 지금은 정보를 못 가져왔어. 네이버 검색 API 키는 설정돼 있어도 날씨는 검색 API가 아니라 네이버 날씨 페이지를 읽어서 확인하는 방식이라, 네이버 쪽 응답이 잠깐 막히면 실패할 수 있어.`;
  }

  return [
    `${city} 기준 현재 날씨야.`,
    details.join(', '),
    /비|소나기/.test(condition) ? '비가 잡혀 있으니 우산 챙기는 게 좋아.' : weather.recommendation || '',
  ].filter(Boolean).join('\n');
}

async function answerWeather(message) {
  const city = extractWeatherLocation(message);
  const weather = await naverWeatherCrawler.getWeatherInfo(city);
  return {
    answer: formatWeatherAnswer(city, weather),
    quickReplies: [{
      label: '네이버 날씨',
      action: 'webLink',
      webLinkUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(`${city} 날씨`)}`,
    }],
    plan: { intent: 'weather_lookup', searchQuery: city, sort: 'sim', confidence: 0.9, source: 'deterministic' },
    results: weather.temperature && weather.temperature !== '정보 없음' ? [weather] : [],
  };
}

function answerNaverConfigQuestion(message) {
  const naverReady = Boolean(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET);
  const weatherMentioned = isWeatherQuestion(message);
  const weatherLine = weatherMentioned
    ? '날씨 질문은 이제 네이버 검색 API 결과로 뭉개지지 않고, 네이버 날씨 확인 로직으로 따로 처리하게 연결돼 있어.'
    : '네이버 검색 API는 지역/뉴스/웹/쇼핑 검색에 쓰고 있어.';
  const statusLine = naverReady
    ? '네이버 API 키는 현재 서버 환경변수에 설정돼 있어.'
    : '네이버 API 키는 현재 서버 환경변수에서 확인되지 않아.';
  return {
    answer: `${statusLine}\n${weatherLine}\n키 값 자체는 보안상 답변에 노출하지 않을게.`,
    quickReplies: [],
    plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'deterministic_config' },
    results: [],
  };
}

async function searchNaver(plan) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return [];
  if (!NAVER_URLS[plan.intent] || !plan.searchQuery) return [];

  const sort = plan.intent === 'local_search' ? 'comment' : plan.intent === 'news_search' ? 'date' : plan.sort || 'sim';
  const response = await axios.get(NAVER_URLS[plan.intent], {
    params: { query: plan.searchQuery, display: NAVER_SEARCH_DISPLAY, sort },
    headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET },
    timeout: NAVER_SEARCH_TIMEOUT_MS,
  });

  return (response.data?.items || []).map((item) => ({
    title: stripHtml(item.title),
    link: item.link || item.originallink || '',
    description: stripHtml(item.description),
    category: stripHtml(item.category),
    roadAddress: stripHtml(item.roadAddress),
    address: stripHtml(item.address),
    mallName: stripHtml(item.mallName),
    lprice: item.lprice ? Number(item.lprice) : 0,
    date: item.pubDate || '',
  }));
}

async function searchNaverWithRetries(plan) {
  const queries = plan.intent === 'local_search' ? buildLocalRetryQueries(plan.searchQuery) : [plan.searchQuery];
  for (const query of queries) {
    const nextPlan = { ...plan, searchQuery: query };
    const results = await searchNaver(nextPlan);
    if (results.length) return { plan: nextPlan, results };
  }
  return { plan, results: [] };
}

function formatWon(value) { return `${Math.round(value).toLocaleString('ko-KR')}원`; }

function formatSearchAnswer(plan, results) {
  if (!results.length) {
    if (plan.intent === 'local_search') {
      const alternatives = buildLocalFallbackQueries(plan);
      const meal = normalizeKoreanSearchText(plan.searchQuery).match(MEAL_WORD_PATTERN)?.[0] || '식사';
      return [
        `${plan.searchQuery} 기준이면 ${meal}은 이렇게 고르면 좋아.`,
        `1. 빠르게 먹기: 국밥, 칼국수, 덮밥`,
        `2. 무난한 선택: 돈까스, 제육, 백반`,
        `3. 가볍게 먹기: 쌀국수, 샐러드볼, 김밥`,
        alternatives.length ? `바로 열어볼 검색어: ${alternatives.join(', ')}` : '',
      ].filter(Boolean).join('\n');
    }
    return '바로 확인된 항목은 없어서 핵심 키워드를 한두 개로 줄여서 다시 보는 게 좋아.';
  }
  const head = plan.intent === 'local_search'
    ? `${plan.searchQuery} 기준으로 많이 찾는 순서에 가깝게 보면:`
    : `${plan.searchQuery || '검색'} 결과 중 가까운 것들이야:`;
  const lines = results.slice(0, 5).map((item, index) => {
    if (plan.intent === 'shopping_search') {
      return `${index + 1}. ${item.title}${item.lprice ? ` - ${formatWon(item.lprice)}` : ''}${item.mallName ? ` (${item.mallName})` : ''}`;
    }
    if (plan.intent === 'local_search') {
      return `${index + 1}. ${item.title}${item.category ? ` (${item.category})` : ''}${item.roadAddress || item.address ? ` - ${item.roadAddress || item.address}` : ''}`;
    }
    return `${index + 1}. ${item.title}${item.description ? ` - ${item.description.slice(0, 70)}` : ''}`;
  });
  return [head, ...lines].join('\n');
}

function buildNaverSearchUrl(item, plan) {
  const query = [
    item.title,
    item.category,
    item.roadAddress || item.address,
  ].filter(Boolean).join(' ') || plan.searchQuery;
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`;
}

function buildQuickReplies(plan, results) {
  if (plan.intent !== 'local_search') return [];
  if (!results.length) {
    return buildLocalFallbackQueries(plan).slice(0, 3).map((query) => ({
      label: query.length > 14 ? `${query.slice(0, 13)}…` : query,
      action: 'webLink',
      webLinkUrl: `https://map.naver.com/p/search/${encodeURIComponent(query)}`,
    }));
  }
  return results.slice(0, 5).map((item, index) => ({
    label: `${index + 1}번 보기`,
    action: 'webLink',
    webLinkUrl: item.link || buildNaverSearchUrl(item, plan),
  }));
}

function fallbackChatAnswer(message) {
  const text = normalizeKoreanSearchText(message);
  if (/^(안녕|안녕하세요|하이|ㅎㅇ)/.test(text)) return '안녕. 뭐 도와줄까?';
  if (/(cmd|명령어|바로가기|아이콘|윈도|윈도우|windows)/i.test(text)) {
    return '응, 가능해. Windows 바로가기의 대상에 `cmd /k "명령어"`를 넣으면 실행 후 명령 결과가 남고, `cmd /c "명령어"`는 실행 후 창이 닫혀. 예: `cmd /k "cd /d C:\\work && npm start"`처럼 쓰면 바로가기 실행 시 자동으로 입력/실행돼.';
  }
  if (/(배고파|뭐\s*먹|먹을\s*거|먹을거|점심|저녁|야식)/.test(text)) {
    if (/점심/.test(text)) return '점심이면 너무 무겁지 않게 국밥, 돈까스, 제육, 쌀국수, 샐러드볼 중에서 고르면 좋아.';
    if (/저녁|야식/.test(text)) return '지금 먹기엔 치킨, 분식, 국밥, 마라탕, 덮밥 쪽이 무난해. 위치를 같이 보내주면 근처 기준으로 찾아볼게.';
    return '먹을 거면 한식, 면, 덮밥, 분식 중에 지금 당기는 쪽으로 가는 게 좋아. 위치까지 주면 주변 맛집으로 바로 좁혀볼게.';
  }
  return '응, 바로 답해줄게. 검색이 필요한 내용이면 지역명이나 핵심 키워드를 같이 보내줘.';
}

async function answerChat(message, userId) {
  if (!CLAUDE_API_KEY) return fallbackChatAnswer(message);
  const history = (conversations.get(userId) || []).slice(-6).map((item) => ({ role: item.role, content: item.content }));
  const response = await axios.post(CLAUDE_API_URL, {
    model: CLAUDE_MODEL,
    max_tokens: 420,
    temperature: 0.7,
    system: ['너는 카카오톡에서 대화하는 친근한 한국어 AI 친구야.', '자연스러운 반말로 바로 답해.', '찾아볼게처럼 미래에 도구를 실행할 척하지 마.'].join('\n'),
    messages: [...history, { role: 'user', content: message }],
  }, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
    timeout: CLAUDE_TIMEOUT_MS,
  });
  return response.data?.content?.[0]?.text || '응답을 못 만들었어. 다시 한 번만 보내줘.';
}

async function buildAnswer(message, userId, req) {
  if (isNaverConfigQuestion(message)) return answerNaverConfigQuestion(message);
  if (isCalendarWriteRequest(message)) return answerCalendarWriteRequest(message, userId, req);
  if (isGoogleCalendarConfigQuestion(message)) return answerGoogleCalendarConfigQuestion();
  if (isWeatherQuestion(message)) {
    try {
      return await answerWeather(message);
    } catch (error) {
      console.error('[weather] failed:', { message: error.message, code: error.code, status: error.response?.status });
      const city = extractWeatherLocation(message);
      return {
        answer: `${city} 날씨를 확인하려고 했는데 지금은 정보를 못 가져왔어. 잠시 후 다시 물어봐줘.`,
        quickReplies: [],
        plan: { intent: 'weather_lookup', searchQuery: city, sort: 'sim', confidence: 0.8, source: 'deterministic_error' },
        results: [],
      };
    }
  }

  if (shouldAnswerWithClaudeFirst(message)) {
    const plan = { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.9, source: 'claude_first_chat' };
    try {
      const answer = await answerChat(message, userId);
      return { answer, quickReplies: [], plan, results: [] };
    } catch (error) {
      console.error('[claude-first-chat] failed:', { message: error.message, code: error.code, status: error.response?.status });
      return { answer: fallbackChatAnswer(message), quickReplies: [], plan, results: [] };
    }
  }

  const plan = await planTurn(message, userId);
  if (plan.intent === 'weather_lookup') return answerWeather(plan.searchQuery || message);
  if (plan.intent !== 'chat') {
    try {
      const search = await searchNaverWithRetries(plan);
      return { answer: formatSearchAnswer(search.plan, search.results), quickReplies: buildQuickReplies(search.plan, search.results), plan: search.plan, results: search.results };
    } catch (error) {
      console.error('[naver] failed:', { message: error.message, code: error.code, status: error.response?.status });
      return { answer: formatSearchAnswer(plan, []), quickReplies: buildQuickReplies(plan, []), plan, results: [] };
    }
  }

  try {
    const answer = await answerChat(message, userId);
    return { answer, quickReplies: [], plan, results: [] };
  } catch (error) {
    console.error('[claude-chat] failed:', { message: error.message, code: error.code, status: error.response?.status });
    return { answer: fallbackChatAnswer(message), quickReplies: [], plan, results: [] };
  }
}

app.get('/', (req, res) => res.type('html').send(`<h1>카카오 스킬 웹훅 서버</h1><p>상태: 정상 실행 중</p><p>라우터: ${ROUTER_VERSION}</p><p>현재 한국 시간: ${getKoreanDateTime()}</p>`));
app.get('/health', (req, res) => res.json({ ok: true, service: 'kakao-skill-webhook', routerVersion: ROUTER_VERSION, koreaTime: getKoreanDateTime(), env: { claudeApiKey: Boolean(CLAUDE_API_KEY), naverApi: Boolean(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET), googleCloudApiKey: Boolean(GOOGLE_CLOUD_API_KEY), googleCalendarWritable: Boolean(GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON && GOOGLE_CALENDAR_ID), googleCalendarOAuth: hasGoogleOAuthConfig(), googleCalendarAllowedUsers: KAKAO_CALENDAR_ALLOWED_USER_IDS.length, plannerTimeoutMs: CLAUDE_PLANNER_TIMEOUT_MS, naverTimeoutMs: NAVER_SEARCH_TIMEOUT_MS, port: PORT } }));
app.get('/test', (req, res) => res.json(kakaoTextResponse('테스트 성공! 카카오 스킬 응답 형식 정상이야.')));
app.get('/routes', (req, res) => res.json({ ok: true, routerVersion: ROUTER_VERSION, routes: ['chat', 'web_lookup', 'news_search', 'local_search', 'shopping_search', 'weather_lookup', 'google_calendar_oauth', 'google_calendar_create_event'] }));

app.get('/auth/google', (req, res) => {
  const userId = normalizeText(req.query.userId || '');
  if (!hasGoogleOAuthConfig()) return res.status(503).type('text/plain').send('Google OAuth 설정이 아직 없습니다.');
  if (!userId) return res.status(400).type('text/plain').send('userId가 필요합니다.');
  if (!isCalendarUserAllowed(userId)) return res.status(403).type('text/plain').send('이 카카오 사용자는 Google Calendar 연결이 허용되지 않았습니다.');
  return res.redirect(buildGoogleAuthUrl(userId, req));
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    if (!hasGoogleOAuthConfig()) return res.status(503).type('text/plain').send('Google OAuth 설정이 아직 없습니다.');
    const { userId } = decodeOAuthState(req.query.state);
    if (!userId || !req.query.code) return res.status(400).type('text/plain').send('OAuth state/code가 올바르지 않습니다.');
    if (!isCalendarUserAllowed(userId)) return res.status(403).type('text/plain').send('이 카카오 사용자는 Google Calendar 연결이 허용되지 않았습니다.');
    const token = await exchangeGoogleCodeForToken(req.query.code, getGoogleRedirectUri(req));
    const tokens = loadGoogleTokens();
    tokens[userId] = {
      ...token,
      refresh_token: token.refresh_token || tokens[userId]?.refresh_token,
      expires_at: Date.now() + Number(token.expires_in || 3600) * 1000,
      connected_at: new Date().toISOString(),
    };
    saveGoogleTokens(tokens);
    return res.type('html').send('<h1>Google Calendar connected</h1><p>카카오톡으로 돌아가서 일정을 다시 등록해 주세요.</p>');
  } catch (error) {
    console.error('[google-calendar] oauth callback failed:', { message: error.message, status: error.response?.status });
    return res.status(500).type('text/plain').send('Google Calendar 연결에 실패했습니다. 다시 시도해 주세요.');
  }
});

async function handleKakaoSkill(req, res) {
  const startedAt = Date.now();
  const message = getUserMessage(req.body);
  const userId = getUserId(req.body);
  if (!message) return res.json(kakaoTextResponse('메시지 입력해줘.'));

  try {
    remember(userId, 'user', message);
    const { answer, quickReplies, plan, results } = await buildAnswer(message, userId, req);
    remember(userId, 'assistant', answer);
    console.log(`[kakao] ${Date.now() - startedAt}ms intent=${plan.intent} source=${plan.source} results=${results.length} query=${plan.searchQuery || ''}`);
    return res.json(kakaoTextResponse(answer, quickReplies));
  } catch (error) {
    console.error('[kakao] failed:', { message: error.message, code: error.code, status: error.response?.status, elapsedMs: Date.now() - startedAt });
    return res.json(kakaoTextResponse('서버가 잠깐 꼬였어. 방금 질문 그대로 한 번만 다시 보내줘.'));
  }
}

app.post('/', handleKakaoSkill);
app.post('/webhook', handleKakaoSkill);
app.post('/kakao-skill-webhook', handleKakaoSkill);

app.use((req, res) => res.status(404).json({ ok: false, error: 'Not Found' }));
app.listen(PORT, () => {
  console.log(`Kakao skill webhook server listening on port ${PORT}`);
  console.log(`Router version: ${ROUTER_VERSION}`);
});
