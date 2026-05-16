require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();

const PORT = process.env.PORT || 3000;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const RETIRED_CLAUDE_MODELS = new Set(['claude-3-5-sonnet-20240620', 'claude-3-5-haiku-20241022']);
const configuredClaudeModel = process.env.CLAUDE_MODEL;
const CLAUDE_MODEL = configuredClaudeModel && !RETIRED_CLAUDE_MODELS.has(configuredClaudeModel) ? configuredClaudeModel : DEFAULT_CLAUDE_MODEL;
const CLAUDE_TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS || 3800);
const MAX_RESPONSE_LENGTH = Number(process.env.KAKAO_MAX_RESPONSE_LENGTH || 1000);
const MAX_OUTPUTS = Number(process.env.KAKAO_MAX_OUTPUTS || 3);
const MAX_HISTORY_MESSAGES = Number(process.env.KAKAO_HISTORY_MESSAGES || 8);
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_SEARCH_TIMEOUT_MS = Number(process.env.NAVER_SEARCH_TIMEOUT_MS || 1200);
const NAVER_SEARCH_DISPLAY = Number(process.env.NAVER_SEARCH_DISPLAY || 5);
const WEATHER_TIMEOUT_MS = Number(process.env.WEATHER_TIMEOUT_MS || 1800);
const NAVER_WEB_SEARCH_URL = 'https://openapi.naver.com/v1/search/webkr.json';
const NAVER_NEWS_SEARCH_URL = 'https://openapi.naver.com/v1/search/news.json';
const NAVER_SHOPPING_SEARCH_URL = 'https://openapi.naver.com/v1/search/shop.json';
const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const conversations = new Map();
const continuations = new Map();
const dialogueState = new Map();

const KOREA_CITY_COORDS = {
  서울: { name: '서울', latitude: 37.5665, longitude: 126.9780 }, 부산: { name: '부산', latitude: 35.1796, longitude: 129.0756 }, 대구: { name: '대구', latitude: 35.8714, longitude: 128.6014 }, 인천: { name: '인천', latitude: 37.4563, longitude: 126.7052 }, 광주: { name: '광주', latitude: 35.1595, longitude: 126.8526 }, 대전: { name: '대전', latitude: 36.3504, longitude: 127.3845 }, 울산: { name: '울산', latitude: 35.5384, longitude: 129.3114 }, 세종: { name: '세종', latitude: 36.4800, longitude: 127.2890 }, 제주: { name: '제주', latitude: 33.4996, longitude: 126.5312 },
  강남: { name: '서울 강남구', latitude: 37.5172, longitude: 127.0473 }, 강동: { name: '서울 강동구', latitude: 37.5301, longitude: 127.1238 }, 강북: { name: '서울 강북구', latitude: 37.6396, longitude: 127.0257 }, 강서: { name: '서울 강서구', latitude: 37.5509, longitude: 126.8495 }, 관악: { name: '서울 관악구', latitude: 37.4784, longitude: 126.9516 }, 광진: { name: '서울 광진구', latitude: 37.5384, longitude: 127.0822 }, 구로: { name: '서울 구로구', latitude: 37.4955, longitude: 126.8877 }, 금천: { name: '서울 금천구', latitude: 37.4569, longitude: 126.8955 }, 노원: { name: '서울 노원구', latitude: 37.6542, longitude: 127.0568 }, 도봉: { name: '서울 도봉구', latitude: 37.6688, longitude: 127.0471 }, 동대문: { name: '서울 동대문구', latitude: 37.5744, longitude: 127.0396 }, 동작: { name: '서울 동작구', latitude: 37.5124, longitude: 126.9393 }, 마포: { name: '서울 마포구', latitude: 37.5663, longitude: 126.9019 }, 서대문: { name: '서울 서대문구', latitude: 37.5791, longitude: 126.9368 }, 서초: { name: '서울 서초구', latitude: 37.4836, longitude: 127.0327 }, 성동: { name: '서울 성동구', latitude: 37.5633, longitude: 127.0371 }, 성북: { name: '서울 성북구', latitude: 37.5894, longitude: 127.0167 }, 송파: { name: '서울 송파구', latitude: 37.5145, longitude: 127.1059 }, 양천: { name: '서울 양천구', latitude: 37.5169, longitude: 126.8664 }, 영등포: { name: '서울 영등포구', latitude: 37.5264, longitude: 126.8962 }, 용산: { name: '서울 용산구', latitude: 37.5326, longitude: 126.9904 }, 은평: { name: '서울 은평구', latitude: 37.6176, longitude: 126.9227 }, 종로: { name: '서울 종로구', latitude: 37.5735, longitude: 126.9790 }, 중구: { name: '서울 중구', latitude: 37.5636, longitude: 126.9976 }, 중랑: { name: '서울 중랑구', latitude: 37.6063, longitude: 127.0925 },
};

const ROUTE_DEFINITIONS = Object.freeze([
  { intent: 'continuation', handler: 'state', priority: 100, examples: ['이어보기', '계속'], description: '잘린 답변 이어보기' },
  { intent: 'weather', handler: 'weather_api', priority: 90, examples: ['노원 날씨 알려줘'], description: '명시적인 날씨 요청' },
  { intent: 'price', handler: 'shopping_price', priority: 86, examples: ['rtx5090 평균 가격'], description: '가격/시세 계산' },
  { intent: 'recommendation', handler: 'shopping_recommendation', priority: 85, examples: ['그건 네가 추천해줘', '모델 골라줘', '뭐 사면 돼?'], description: '제품 추천과 후속 쇼핑 검색' },
  { intent: 'relational_chat', handler: 'llm_chat', priority: 83, examples: ['잠이 안 와', '맥주 한잔 중'], description: '감정/일상 공유' },
  { intent: 'smalltalk', handler: 'llm_chat', priority: 80, examples: ['뭐해', '심심해'], description: '잡담' },
  { intent: 'news_search', handler: 'news_search_then_llm', priority: 70, examples: ['최신 뉴스'], description: '최신 뉴스 검색' },
  { intent: 'web_lookup', handler: 'web_search_then_llm', priority: 60, examples: ['PPP2R5D 알려줘'], description: '웹 검색 정보 질문' },
  { intent: 'knowledge', handler: 'llm_chat', priority: 10, examples: ['쉽게 설명해줘'], description: '일반 대화/지식' },
]);

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

function getKoreanDateTime() { return new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'medium' }).format(new Date()); }
function normalizeText(text) { return String(text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim(); }
function stripHtml(text) { return normalizeText(text).replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'"); }
function trimForKakao(text) { const normalized = normalizeText(text); if (!normalized) return '안녕! 뭐 도와줄까?'; return normalized.length <= MAX_RESPONSE_LENGTH ? normalized : `${normalized.slice(0, Math.max(0, MAX_RESPONSE_LENGTH - 3))}...`; }

function splitForKakao(text) {
  const normalized = normalizeText(text);
  if (!normalized) return ['안녕! 뭐 도와줄까?'];
  const chunks = [];
  let remaining = normalized;
  while (remaining.length > MAX_RESPONSE_LENGTH) {
    const slice = remaining.slice(0, MAX_RESPONSE_LENGTH);
    const breakAt = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf('. '), slice.lastIndexOf('。'), slice.lastIndexOf(' '));
    const end = breakAt > MAX_RESPONSE_LENGTH * 0.55 ? breakAt + 1 : MAX_RESPONSE_LENGTH;
    chunks.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }
  if (remaining) chunks.push(remaining);
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
  if (replies.length > 0) template.quickReplies = replies;
  return { version: '2.0', template };
}

function getUserMessage(body) { return normalizeText(body?.userRequest?.utterance || body?.utterance || body?.message || ''); }
function getUserId(body) { return body?.userRequest?.user?.id || body?.userRequest?.user?.properties?.botUserKey || 'anonymous'; }
function getCallbackUrl(body) { return body?.userRequest?.callbackUrl || body?.callbackUrl || ''; }
function getConversation(userId) { return conversations.get(userId) || []; }
function getState(userId) { return dialogueState.get(userId) || { lastIntent: 'new', mood: 'neutral', turns: 0, topic: '', updatedAt: 0 }; }

function isContinuationRequest(message) { return /^(이어보기|더 보기|더보기|계속|다음)$/i.test(message); }
function getContinuationResponse(userId) { const chunks = continuations.get(userId); if (!Array.isArray(chunks) || chunks.length === 0) return kakaoTextResponse('이어볼 내용이 없어. 새 질문 보내줘.'); continuations.delete(userId); return kakaoTextResponse(chunks.join('\n\n'), undefined, userId); }
function isSmallTalk(message) { return /^(안녕|안녕하세요|하이|ㅎㅇ|고마워|감사|ㅋㅋ+|ㅎㅎ+|응|네|아니|좋아|그래|뭐해|뭐함|뭐하고 있어\??|심심해|심심하다|졸려|피곤해|배고파|그냥|잡담|수다)$/i.test(message); }
function hasRelationalCue(message) { return /잠이?\s*안\s*와|잠\s*안\s*와|못\s*자|불면|심심|외롭|우울|힘들|피곤|짜증|답답|기분|맥주|소주|술|한잔|혼술|그냥|수다|얘기|대화|보고싶|춥네|덥네|더웠|추웠|좋았|별로/.test(message); }
function isExplicitWeatherRequest(message) { const compact = message.replace(/\s+/g, ''); if (!/날씨|기온|비\s*와|눈\s*와|미세먼지|습도|강수|온도|더워|추워/.test(message)) return false; if (/^(오늘|내일|지금|현재)?[가-힣]{0,8}(날씨|기온|습도|미세먼지)$/.test(compact)) return true; if (/(날씨|기온|습도|미세먼지).*(알려|검색|찾아|확인|조회|어때|어떰|몇|얼마|봐줘|볼래)|(?:알려|검색|찾아|확인|조회).*(날씨|기온|습도|미세먼지)/.test(message)) return true; return /비\s*와\??$|눈\s*와\??$|더워\??$|추워\??$/.test(message) && message.length <= 16; }
function isPriceQuery(message) { return /가격|얼마|시세|최저가|평균가|평균 가격|평균가격|구매가|판매가|중고가|견적/.test(message); }
function isRecommendationQuery(message) { return /추천|골라|골라줘|네가|너가|니가|알아서|뭐\s*사|뭘\s*사|모델.*알려|모델.*찾아|괜찮은.*모델|구매.*서둘|살만한/.test(message); }
function isNewsOrLiveQuery(message) { return /뉴스|기사|속보|논란|발표|업데이트|주가|시장|환율|코인|증시|최신|최근|오늘 나온|방금|실시간/.test(message); }
function isExplicitSearchQuery(message) { return /검색|찾아|찾아봐|알아봐|확인해|인터넷|웹에서|네이버|구글|출처|자료/.test(message); }
function hasLookupEntity(message) { const compact = message.replace(/\s+/g, ''); const alphaNumericCode = /[a-zA-Z]{2,}\d|\d[a-zA-Z]{2,}/.test(compact); const productModel = /(rtx|gtx|rx|iphone|ipad|galaxy|맥북|노트북|전자레인지|에어프라이어|그래픽카드|cpu|gpu|ssd)/i.test(message); const asksAbout = /대해서|뭐야|뭐지|뜻|정보|알려줘|설명해줘|누구|어디|언제|무엇/.test(message); return alphaNumericCode || (productModel && asksAbout); }

function extractProductTopic(text) {
  const normalized = normalizeText(text).replace(/["“”'`*]/g, ' ');
  const patterns = [
    /((?:LG|삼성|위니아|쿠쿠|쿠첸|필립스|샤오미|Apple|애플)?\s*\d{1,3}\s?L\s*(?:전자레인지|오븐|에어프라이어))/i,
    /((?:LG|삼성|위니아|쿠쿠|쿠첸|필립스|샤오미|Apple|애플)\s*[A-Za-z0-9가-힣\- ]{0,20}(?:전자레인지|오븐|에어프라이어|노트북|모니터|청소기))/i,
    /((?:전자레인지|오븐|에어프라이어|노트북|모니터|청소기|그래픽카드|냉장고|세탁기|건조기)\s*[A-Za-z0-9가-힣\- ]{0,20})/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1].replace(/현재|판매|중인|인기|모델|추천|확인|검색|알려|찾아/g, ' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

function inferRecommendationQuery(userMessage, userId) {
  const direct = extractProductTopic(userMessage);
  if (direct) return direct;
  const stateTopic = getState(userId).topic;
  if (stateTopic) return stateTopic;
  const historyText = getConversation(userId).map((message) => message.content).join('\n');
  return extractProductTopic(historyText) || getSearchQuery(userMessage);
}

function routeMessage(message, userId) {
  const state = getState(userId);
  const candidates = [];
  const add = (intent, confidence, reason) => { const definition = ROUTE_DEFINITIONS.find((route) => route.intent === intent); candidates.push({ intent, handler: definition?.handler || 'llm_chat', confidence, reason, priority: definition?.priority || 0 }); };
  if (isContinuationRequest(message)) add('continuation', 1, 'continuation keyword');
  if (isRecommendationQuery(message)) add('recommendation', state.topic ? 0.97 : 0.88, state.topic ? 'follow-up recommendation with stored topic' : 'recommendation keyword');
  if (hasRelationalCue(message)) add('relational_chat', state.lastIntent === 'smalltalk' || state.lastIntent === 'relational_chat' ? 0.97 : 0.9, 'relational cue');
  if (isExplicitWeatherRequest(message) && !(hasRelationalCue(message) && !/(알려|검색|찾아|확인|조회|어때|몇|얼마)/.test(message))) add('weather', 0.96, 'explicit weather request');
  if (isPriceQuery(message)) add('price', 0.95, 'price keyword');
  if (isSmallTalk(message)) add('smalltalk', 0.94, 'smalltalk exact match');
  if (isNewsOrLiveQuery(message)) add('news_search', 0.82, 'fresh/live information');
  if (isExplicitSearchQuery(message) || hasLookupEntity(message)) add('web_lookup', 0.74, 'lookup/search intent');
  add('knowledge', 0.45, 'default llm conversation');
  return candidates.sort((a, b) => b.confidence - a.confidence || b.priority - a.priority)[0];
}

function routeNeedsSearch(route) { return ['news_search', 'web_lookup'].includes(route?.intent); }
function routeStoresTopic(route) { return ['price', 'recommendation', 'web_lookup'].includes(route?.intent); }
function rememberMessage(userId, role, content, route, topic) { const history = getConversation(userId); history.push({ role, content: trimForKakao(content) }); conversations.set(userId, history.slice(-MAX_HISTORY_MESSAGES)); if (role === 'assistant' && route) { const previous = getState(userId); dialogueState.set(userId, { lastIntent: route.intent, mood: route.intent === 'relational_chat' ? 'personal' : previous.mood, turns: (previous.turns || 0) + 1, topic: topic || (routeStoresTopic(route) ? previous.topic : previous.topic), updatedAt: Date.now() }); } }

function getWeatherLocation(message) { const patterns = [/([가-힣]+(?:시|군|구|동|읍|면|도))\s*날씨/, /날씨\s*([가-힣]+(?:시|군|구|동|읍|면|도))/, /([가-힣]+)\s*날씨/, /날씨\s*([가-힣]+)/]; for (const pattern of patterns) { const match = message.match(pattern); if (match?.[1]) { const location = match[1].replace(/날씨|오늘|내일|지금|현재|알려줘|검색|찾아줘/g, '').trim(); if (location) return location; } } return '서울'; }
function getSearchQuery(userMessage) { if (isExplicitWeatherRequest(userMessage)) return `${getWeatherLocation(userMessage)} 날씨`; return normalizeText(userMessage).replace(/검색해서|검색해|검색|찾아서|찾아줘|찾아봐|알아봐|알려줘|대해서|관련해서|정보|최신으로|최신|오늘|지금|현재/g, ' ').replace(/\s+/g, ' ').trim() || userMessage; }
function getShoppingQuery(userMessage) { const cleaned = normalizeText(userMessage).replace(/현재|지금|오늘|요즘|평균가|평균 가격|평균가격|가격|얼마야|얼마|시세|최저가|구매가|판매가|중고가|견적|검색|찾아줘|찾아봐|알아봐|알려줘|추천|골라줘|골라|글카/g, ' ').replace(/은|는|이|가|의|에\s*대해서|대해서|관련해서|정보/g, ' ').replace(/[?？！!,.]/g, ' ').replace(/([A-Za-z]+)(\d+)/g, '$1 $2').replace(/\s+/g, ' ').trim(); if (/^\d{4}$/.test(cleaned)) return `RTX ${cleaned} 그래픽카드`; if (/5090/.test(cleaned) && !/rtx/i.test(cleaned)) return `RTX ${cleaned} 그래픽카드`; return cleaned || userMessage; }
function getNaverSearchUrl(query) { return `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`; }
function getQuickReplies(userMessage, searchResults, route) { const replies = []; if (route?.intent === 'weather') replies.push({ label: '네이버 날씨 보기', action: 'webLink', webLinkUrl: getNaverSearchUrl(`${getWeatherLocation(userMessage)} 날씨`) }); const firstResult = Array.isArray(searchResults) ? searchResults.find((item) => item.link) : null; if (firstResult) replies.push({ label: ['price', 'recommendation'].includes(route?.intent) ? '쇼핑결과 보기' : '검색결과 보기', action: 'webLink', webLinkUrl: firstResult.link }); return replies.length > 0 ? replies : undefined; }

function getWeatherDescription(code) { if ([0].includes(code)) return '맑음'; if ([1, 2, 3].includes(code)) return '구름 조금/흐림'; if ([45, 48].includes(code)) return '안개'; if ([51, 53, 55, 56, 57].includes(code)) return '이슬비'; if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '비'; if ([71, 73, 75, 77, 85, 86].includes(code)) return '눈'; if ([95, 96, 99].includes(code)) return '뇌우'; return '확인 필요'; }
async function resolveWeatherLocation(location) { const compact = location.replace(/특별시|광역시|시|군|구|동|읍|면|도/g, '').trim(); if (KOREA_CITY_COORDS[location]) return KOREA_CITY_COORDS[location]; if (KOREA_CITY_COORDS[compact]) return KOREA_CITY_COORDS[compact]; const response = await axios.get(OPEN_METEO_GEOCODING_URL, { params: { name: location, count: 1, language: 'ko', format: 'json', countryCode: 'KR' }, timeout: WEATHER_TIMEOUT_MS }); const result = response.data?.results?.[0]; if (!result) return KOREA_CITY_COORDS.서울; return { name: result.name || location, latitude: result.latitude, longitude: result.longitude }; }
async function getWeatherAnswer(userMessage) { const requestedLocation = getWeatherLocation(userMessage); const location = await resolveWeatherLocation(requestedLocation); const response = await axios.get(OPEN_METEO_FORECAST_URL, { params: { latitude: location.latitude, longitude: location.longitude, timezone: 'Asia/Seoul', forecast_days: 1, current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m', daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max' }, timeout: WEATHER_TIMEOUT_MS }); const current = response.data?.current || {}; const daily = response.data?.daily || {}; const weather = getWeatherDescription(current.weather_code); return [`${location.name || requestedLocation} 기준 현재 날씨야.`, `지금 ${current.temperature_2m}°C, 체감 ${current.apparent_temperature}°C, ${weather}이야.`, `오늘 최저/최고는 ${daily.temperature_2m_min?.[0]}°C / ${daily.temperature_2m_max?.[0]}°C 정도고, 강수확률은 ${daily.precipitation_probability_max?.[0] ?? '확인 필요'}%야.`, `습도는 ${current.relative_humidity_2m}%, 바람은 ${current.wind_speed_10m}km/h 정도야.`, '위치가 다르면 “강남 날씨”, “부산 날씨”처럼 지역명 붙여서 물어봐.'].join('\n'); }

function formatWon(value) { return `${Math.round(value).toLocaleString('ko-KR')}원`; }
function getMedian(values) { const sorted = [...values].sort((a, b) => a - b); const mid = Math.floor(sorted.length / 2); return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]; }
function getTrimmedPrices(prices) { if (prices.length < 5) return prices; const sorted = [...prices].sort((a, b) => a - b); return sorted.slice(1, -1); }

function isRelevantShoppingItem(query, item) {
  const q = query.toLowerCase().replace(/\s+/g, '');
  const title = item.title.toLowerCase().replace(/\s+/g, '');
  const rawTitle = item.title.toLowerCase();
  const modelNumbers = q.match(/\d{3,5}/g) || [];
  if (!modelNumbers.every((number) => title.includes(number))) return false;
  if (/5090/.test(q)) {
    const accessoryWords = /케이블|cable|라이저|riser|브라켓|bracket|수냉|워터블럭|water\s*block|백플레이트|쿨러|fan|팬|방열판|히트싱크|거치대|스탠드|지지대|홀더|커버|필통|수납함|모형|피규어|스티커|패드|adapter|어댑터|변환|연장|익스텐션|호환|부품|부속|박스|중고박스|메인보드|파워|케이스/;
    const gpuWords = /rtx|geforce|지포스|그래픽카드|그래픽 카드|vga|gpu/;
    if (accessoryWords.test(rawTitle)) return false;
    if (!gpuWords.test(rawTitle)) return false;
    if (item.lprice < 2500000) return false;
  }
  return true;
}

async function searchNaverShoppingByQuery(query, display = 20) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return [];
  const response = await axios.get(NAVER_SHOPPING_SEARCH_URL, { params: { query, display, sort: 'sim' }, headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }, timeout: NAVER_SEARCH_TIMEOUT_MS });
  return (response.data?.items || []).map((item) => ({ title: stripHtml(item.title), link: item.link, mallName: stripHtml(item.mallName), lprice: Number(item.lprice || 0), hprice: Number(item.hprice || 0) })).filter((item) => item.lprice > 0);
}
async function searchNaverShopping(userMessage) { const query = getShoppingQuery(userMessage); return (await searchNaverShoppingByQuery(query, 20)).filter((item) => isRelevantShoppingItem(query, item)); }

function buildShoppingPriceAnswer(userMessage, shoppingResults) {
  const query = getShoppingQuery(userMessage);
  if (!Array.isArray(shoppingResults) || shoppingResults.length === 0) return `${query} 가격은 쇼핑 검색에서 본품으로 보이는 상품을 못 찾았어. 모델명을 더 정확히 적어서 다시 물어봐.`;
  const sortedItems = [...shoppingResults].sort((a, b) => a.lprice - b.lprice);
  const prices = sortedItems.map((item) => item.lprice);
  const trimmedPrices = getTrimmedPrices(prices);
  const average = trimmedPrices.reduce((sum, price) => sum + price, 0) / trimmedPrices.length;
  const median = getMedian(prices);
  const topItems = sortedItems.slice(0, 3).map((item, index) => `${index + 1}. ${formatWon(item.lprice)} - ${item.title}${item.mallName ? ` (${item.mallName})` : ''}`);
  const averageLabel = trimmedPrices.length === prices.length ? '평균' : '이상치 제외 평균';
  return [`${query} 현재 쇼핑 검색 기준으로 본품만 추려서 계산해봤어.`, `확인한 상품 ${prices.length}개 기준 ${averageLabel}은 약 ${formatWon(average)}야.`, `중앙값은 약 ${formatWon(median)}, 가격 범위는 ${formatWon(prices[0])}~${formatWon(prices[prices.length - 1])} 정도로 보여.`, '낮은 가격순으로 보면:', ...topItems, '재고/배송비/카드할인에 따라 실구매가는 달라질 수 있어.'].join('\n');
}

function buildRecommendationAnswer(query, items) {
  const filtered = (items || []).filter((item) => !/중고|리퍼|부품|필터|접시|선반|커버|용기|도어|핸들|수리|렌탈/i.test(item.title));
  const sorted = filtered.length > 0 ? filtered.sort((a, b) => a.lprice - b.lprice) : items;
  if (!Array.isArray(sorted) || sorted.length === 0) return `${query}로 쇼핑 검색을 했는데 추천할 만한 상품을 못 찾았어. 조건을 조금만 더 구체적으로 말해줘.`;
  const pick = sorted[Math.min(1, sorted.length - 1)];
  const lines = [`${query}는 지금 검색 기준으로 이쪽이 무난해 보여.`];
  lines.push(`내 추천은 ${pick.title} (${pick.mallName || '판매처 확인 필요'}) - ${formatWon(pick.lprice)} 정도야.`);
  lines.push('너무 싼 건 옵션/부속품일 수 있어서 피하고, 가격이랑 판매처가 비교적 정상적으로 보이는 쪽을 골랐어.');
  lines.push('비교 후보는:');
  sorted.slice(0, 3).forEach((item, index) => lines.push(`${index + 1}. ${formatWon(item.lprice)} - ${item.title}${item.mallName ? ` (${item.mallName})` : ''}`));
  return lines.join('\n');
}

async function searchNaver(userMessage, route) { if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET || !routeNeedsSearch(route)) return []; const query = getSearchQuery(userMessage); const url = route?.intent === 'news_search' ? NAVER_NEWS_SEARCH_URL : NAVER_WEB_SEARCH_URL; const response = await axios.get(url, { params: { query, display: Math.min(Math.max(NAVER_SEARCH_DISPLAY, 1), 10), sort: route?.intent === 'news_search' ? 'date' : 'sim' }, headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET }, timeout: NAVER_SEARCH_TIMEOUT_MS }); return (response.data?.items || []).map((item) => ({ title: stripHtml(item.title), link: item.link || item.originallink, description: stripHtml(item.description), date: item.pubDate || '' })); }
function formatSearchContext(searchResults) { if (!Array.isArray(searchResults) || searchResults.length === 0) return ''; return searchResults.slice(0, NAVER_SEARCH_DISPLAY).map((item, index) => { const lines = [`[${index + 1}] ${item.title}`]; if (item.description) lines.push(`요약: ${item.description}`); if (item.date) lines.push(`날짜: ${item.date}`); if (item.link) lines.push(`링크: ${item.link}`); return lines.join('\n'); }).join('\n\n'); }
function buildSearchFallbackAnswer(userMessage, searchResults) { if (!Array.isArray(searchResults) || searchResults.length === 0) return '인터넷 검색 결과를 못 찾았어. 검색어를 조금 더 구체적으로 보내주면 다시 찾아볼게.'; const query = getSearchQuery(userMessage); const first = searchResults[0]; const lines = [`${query}로 찾아본 결과 중 제일 가까운 건 “${first.title}”야.`]; if (first.description) lines.push(first.description); lines.push('AI 요약이 늦어서 일단 핵심 검색 결과만 짧게 줄게.'); searchResults.slice(0, 3).forEach((item, index) => { lines.push(`${index + 1}. ${item.title}`); if (item.link) lines.push(item.link); }); return lines.join('\n'); }

function buildSystemPrompt(searchResults, route, state) {
  const routeText = route ? `${route.intent} / ${route.handler} / confidence ${route.confidence}` : 'unknown';
  const prompt = [
    '너는 카카오톡 챗봇에 연결된 친근한 한국어 AI 친구야.',
    '모든 대화는 반드시 자연스러운 반말로 해. 존댓말, ~요, ~습니다 말투는 쓰지 마.',
    '찾아볼게, 확인해볼게, 기다려줘처럼 미래에 도구를 실행할 것처럼 말하지 마. 도구가 필요하면 서버가 이미 실행해서 검색 결과를 제공한다.',
    '사용자가 후속으로 “네가 추천해줘”, “알아서 골라줘”라고 하면 이전 제품 맥락을 이어받아서 바로 추천해야 해.',
    '일상 공유나 감정 표현에는 짧게 공감하고 자연스럽게 받아쳐.',
    '검색 결과가 제공될 때만 출처 기반으로 답하고, 그대로 나열하지 말고 핵심에 맞게 해석해.',
    '카카오톡에서 읽기 좋게 1~4문장 위주로 답해. 필요한 정보 질문일 때만 목록을 써.',
    `현재 한국 시간은 ${getKoreanDateTime()}야.`,
    `라우터 판단: ${routeText}`,
    `최근 대화 상태: lastIntent=${state?.lastIntent || 'none'}, mood=${state?.mood || 'neutral'}, topic=${state?.topic || 'none'}, turns=${state?.turns || 0}`,
  ];
  const searchContext = formatSearchContext(searchResults);
  if (searchContext) prompt.push(`네이버 검색 결과:\n${searchContext}`);
  return prompt.join('\n');
}

function buildClaudeMessages(userMessage, userId) { const history = getConversation(userId).slice(-MAX_HISTORY_MESSAGES); return [...history.map((message) => ({ role: message.role, content: message.content })), { role: 'user', content: userMessage }]; }
async function callClaude(userMessage, userId, searchResults = [], route) { if (!CLAUDE_API_KEY) return 'Claude API 키가 아직 설정 안 됐어. Railway Variables에 CLAUDE_API_KEY를 넣으면 AI 대화가 켜져.'; const payload = { model: CLAUDE_MODEL, max_tokens: route?.intent === 'relational_chat' || route?.intent === 'smalltalk' ? 260 : 900, temperature: routeNeedsSearch(route) ? 0.35 : 0.85, system: buildSystemPrompt(searchResults, route, getState(userId)), messages: buildClaudeMessages(userMessage, userId) }; const response = await axios.post(CLAUDE_API_URL, payload, { headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' }, timeout: CLAUDE_TIMEOUT_MS }); return response.data?.content?.[0]?.text || '응답을 못 만들었어. 다시 한 번만 보내줘.'; }

async function buildAnswer(userMessage, userId) {
  const route = routeMessage(userMessage, userId);
  let topic = extractProductTopic(userMessage);

  if (route.intent === 'recommendation') {
    try {
      const query = inferRecommendationQuery(userMessage, userId);
      topic = query;
      const items = await searchNaverShoppingByQuery(`${query} 인기 모델`, 20);
      return { answer: buildRecommendationAnswer(query, items), searchResults: items, route, topic };
    } catch (error) {
      console.error('[recommendation] naver failed:', { message: error.message, code: error.code, status: error.response?.status });
      return { answer: '추천하려고 쇼핑 검색을 했는데 지금 결과를 못 받아왔어. 제품명만 한 번 더 적어주면 바로 골라줄게.', searchResults: [], route, topic };
    }
  }

  if (route.intent === 'price') {
    try { const shoppingResults = await searchNaverShopping(userMessage); topic = extractProductTopic(userMessage) || getShoppingQuery(userMessage); return { answer: buildShoppingPriceAnswer(userMessage, shoppingResults), searchResults: shoppingResults, route, topic }; }
    catch (error) { console.error('[shopping] naver failed:', { message: error.message, code: error.code, status: error.response?.status }); return { answer: '가격 검색을 하려 했는데 지금 쇼핑 검색이 잘 안 됐어. 제품명만 한 번 더 적어줘.', searchResults: [], route, topic }; }
  }

  if (route.intent === 'weather') {
    try { return { answer: await getWeatherAnswer(userMessage), searchResults: [], route, topic }; }
    catch (error) { console.error('[weather] lookup failed:', { message: error.message, code: error.code, status: error.response?.status }); const query = getSearchQuery(userMessage); return { answer: `${query}는 실시간 날씨 화면에서 확인하는 게 제일 정확해. 아래 “네이버 날씨 보기” 눌러서 확인해봐.`, searchResults: [], route, topic }; }
  }

  let searchResults = [];
  try { searchResults = await searchNaver(userMessage, route); } catch (error) { console.error('[search] naver failed:', { message: error.message, code: error.code, status: error.response?.status }); }
  try { return { answer: await callClaude(userMessage, userId, searchResults, route), searchResults, route, topic }; }
  catch (error) { if (searchResults.length > 0) return { answer: buildSearchFallbackAnswer(userMessage, searchResults), searchResults, route, topic }; throw error; }
}

async function sendCallback(callbackUrl, userMessage, userId) {
  try { const { answer, searchResults, route, topic } = await buildAnswer(userMessage, userId); const quickReplies = getQuickReplies(userMessage, searchResults, route); rememberMessage(userId, 'user', userMessage); rememberMessage(userId, 'assistant', answer, route, topic); await axios.post(callbackUrl, kakaoTextResponse(answer, quickReplies, userId), { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }); }
  catch (error) { console.error('[kakao] callback failed:', { message: error.message, code: error.code, status: error.response?.status }); }
}

app.get('/', (req, res) => { res.type('html').send(`<h1>카카오 스킬 웹훅 서버</h1><p>상태: 정상 실행 중</p><p>현재 한국 시간: ${getKoreanDateTime()}</p><ul><li>POST /kakao-skill-webhook</li><li>GET /health</li><li>GET /test</li><li>GET /routes</li></ul>`); });
app.get('/health', (req, res) => { res.json({ ok: true, service: 'kakao-skill-webhook', timestamp: new Date().toISOString(), koreaTime: getKoreanDateTime(), env: { claudeApiKey: Boolean(CLAUDE_API_KEY), claudeModel: CLAUDE_MODEL, claudeTimeoutMs: CLAUDE_TIMEOUT_MS, maxResponseLength: MAX_RESPONSE_LENGTH, maxOutputs: MAX_OUTPUTS, naverApi: Boolean(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET), naverSearchDisplay: NAVER_SEARCH_DISPLAY, shoppingSearch: Boolean(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET), weatherTimeoutMs: WEATHER_TIMEOUT_MS, routes: ROUTE_DEFINITIONS.length, dialogueStates: dialogueState.size, port: PORT } }); });
app.get('/routes', (req, res) => { res.json({ ok: true, routes: ROUTE_DEFINITIONS }); });
app.get('/test', (req, res) => { res.json(kakaoTextResponse('테스트 성공! 카카오 스킬 응답 형식 정상이야.')); });

app.post('/kakao-skill-webhook', async (req, res) => {
  const startedAt = Date.now();
  const userMessage = getUserMessage(req.body);
  const userId = getUserId(req.body);
  const callbackUrl = getCallbackUrl(req.body);
  if (!userMessage) return res.json(kakaoTextResponse('메시지 입력해줘.'));
  if (isContinuationRequest(userMessage)) return res.json(getContinuationResponse(userId));

  try {
    if (callbackUrl) { setImmediate(() => sendCallback(callbackUrl, userMessage, userId)); return res.json({ version: '2.0', useCallback: true, data: { text: '맥락까지 보고 바로 처리하고 있어. 잠깐만 기다려줘.' } }); }
    const { answer, searchResults, route, topic } = await buildAnswer(userMessage, userId);
    const quickReplies = getQuickReplies(userMessage, searchResults, route);
    rememberMessage(userId, 'user', userMessage);
    rememberMessage(userId, 'assistant', answer, route, topic);
    console.log(`[kakao] ${Date.now() - startedAt}ms route=${route.intent}/${route.handler} search=${searchResults.length} topic=${topic || ''} user=${userId} message="${userMessage.slice(0, 80)}"`);
    return res.json(kakaoTextResponse(answer, quickReplies, userId));
  } catch (error) {
    console.error('[kakao] request failed:', { message: error.message, code: error.code, status: error.response?.status, elapsedMs: Date.now() - startedAt });
    return res.json(kakaoTextResponse(error.code === 'ECONNABORTED' ? '답변 만드는 게 평소보다 늦어지고 있어. 같은 질문 한 번만 더 보내주면 이어서 답할게.' : '지금 AI 응답을 못 받아왔어. 잠깐 뒤에 다시 보내주면 바로 이어서 도와줄게.'));
  }
});

app.use((req, res) => { res.status(404).json({ ok: false, error: 'Not Found' }); });
app.listen(PORT, () => { console.log(`Kakao skill webhook server listening on port ${PORT}`); console.log(`Claude model: ${CLAUDE_MODEL}`); console.log(`Claude timeout: ${CLAUDE_TIMEOUT_MS}ms`); console.log(`Naver search: ${NAVER_CLIENT_ID && NAVER_CLIENT_SECRET ? 'configured' : 'missing'}`); console.log(`Routes: ${ROUTE_DEFINITIONS.map((route) => route.intent).join(', ')}`); console.log(`Claude API key: ${CLAUDE_API_KEY ? 'configured' : 'missing'}`); });
