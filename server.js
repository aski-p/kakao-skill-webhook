require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const ROUTER_VERSION = 'claude-planned-naver-search-2026-05-19a';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const CLAUDE_TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS || 4200);
const CLAUDE_PLANNER_TIMEOUT_MS = Number(process.env.CLAUDE_PLANNER_TIMEOUT_MS || 1800);
const CHAT_BUDGET_MS = Number(process.env.CHAT_BUDGET_MS || 3200);
const MAX_RESPONSE_LENGTH = Number(process.env.KAKAO_MAX_RESPONSE_LENGTH || 1000);
const MAX_OUTPUTS = Number(process.env.KAKAO_MAX_OUTPUTS || 3);
const MAX_HISTORY_MESSAGES = Number(process.env.KAKAO_HISTORY_MESSAGES || 10);

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_SEARCH_TIMEOUT_MS = Number(process.env.NAVER_SEARCH_TIMEOUT_MS || 1600);
const NAVER_SEARCH_DISPLAY = Number(process.env.NAVER_SEARCH_DISPLAY || 5);

const NAVER_WEB_SEARCH_URL = 'https://openapi.naver.com/v1/search/webkr.json';
const NAVER_NEWS_SEARCH_URL = 'https://openapi.naver.com/v1/search/news.json';
const NAVER_SHOPPING_SEARCH_URL = 'https://openapi.naver.com/v1/search/shop.json';
const NAVER_LOCAL_SEARCH_URL = 'https://openapi.naver.com/v1/search/local.json';

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const conversations = new Map();
const continuations = new Map();

const ROUTES = Object.freeze([
  { intent: 'chat', handler: 'claude_direct', description: '검색 없이 Claude가 바로 답변' },
  { intent: 'web_lookup', handler: 'naver_web_then_claude', description: '네이버 웹검색 후 Claude 답변' },
  { intent: 'news_search', handler: 'naver_news_then_claude', description: '네이버 뉴스검색 후 Claude 답변' },
  { intent: 'local_search', handler: 'naver_local_then_claude', description: '네이버 지역검색 후 Claude 답변' },
  { intent: 'shopping_search', handler: 'naver_shopping_then_claude', description: '네이버 쇼핑검색 후 Claude 답변' },
]);

const normalizeText = (text) => String(text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const stripHtml = (text) => normalizeText(text).replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
const getKoreanDateTime = () => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'medium' }).format(new Date());

function getUserMessage(body) { return normalizeText(body?.userRequest?.utterance || body?.utterance || body?.message || ''); }
function getUserId(body) { return body?.userRequest?.user?.id || body?.userRequest?.user?.properties?.botUserKey || 'anonymous'; }
function getCallbackUrl(body) { return body?.userRequest?.callbackUrl || body?.callbackUrl || ''; }
function getConversation(userId) { return conversations.get(userId) || []; }

function rememberMessage(userId, role, content) {
  const history = getConversation(userId);
  history.push({ role, content: normalizeText(content).slice(0, 1800) });
  conversations.set(userId, history.slice(-MAX_HISTORY_MESSAGES));
}

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

function getContinuationResponse(userId) {
  const chunks = continuations.get(userId);
  if (!chunks?.length) return kakaoTextResponse('이어볼 내용은 없어. 새로 물어봐줘.');
  continuations.delete(userId);
  return kakaoTextResponse(chunks.join('\n\n'), undefined, userId);
}

function routeFromIntent(intent, confidence = 0.75, source = 'fallback') {
  const route = ROUTES.find((item) => item.intent === intent) || ROUTES[0];
  return { ...route, confidence, source };
}

function extractJsonObject(text) {
  const match = normalizeText(text).match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function fallbackPlan(message) {
  const text = normalizeText(message);
  if (/뉴스|기사|속보|최신\s*뉴스|최근\s*뉴스/.test(text)) return { intent: 'news_search', tool: 'news', searchQuery: text, sort: 'date', confidence: 0.75, source: 'fallback' };
  if (/가격|최저가|시세|얼마|구매|상품|제품|쇼핑/.test(text)) return { intent: 'shopping_search', tool: 'shopping', searchQuery: text, sort: 'sim', confidence: 0.72, source: 'fallback' };
  if (/(근처|주변|가까운|동네|맛집|식당|매장|가게|어디|찾아|검색|추천)/.test(text) && /[가-힣]{2,}(구|동|역|로|길|시|군)/.test(text)) return { intent: 'local_search', tool: 'local', searchQuery: text, sort: 'comment', confidence: 0.72, source: 'fallback' };
  if (/검색|찾아봐|알아봐|확인|최신|최근|실시간|웹|인터넷|네이버|구글|출처/.test(text)) return { intent: 'web_lookup', tool: 'web', searchQuery: text, sort: 'sim', confidence: 0.7, source: 'fallback' };
  return { intent: 'chat', tool: 'none', searchQuery: '', confidence: 0.65, source: 'fallback' };
}

function normalizePlan(plan, fallback) {
  const allowed = new Set(ROUTES.map((item) => item.intent));
  const intent = allowed.has(plan?.intent) ? plan.intent : fallback.intent;
  return {
    intent,
    tool: normalizeText(plan?.tool || fallback.tool || 'none'),
    searchQuery: normalizeText(plan?.searchQuery || fallback.searchQuery || ''),
    productQuery: normalizeText(plan?.productQuery || fallback.productQuery || ''),
    topic: normalizeText(plan?.topic || fallback.topic || ''),
    sort: ['comment', 'sim', 'date'].includes(plan?.sort) ? plan.sort : (fallback.sort || (intent === 'local_search' ? 'comment' : 'sim')),
    confidence: Number(plan?.confidence || fallback.confidence || 0.75),
    source: plan?.source || 'claude_planner',
  };
}

async function planTurnWithClaude(message, userId) {
  const fallback = fallbackPlan(message);
  if (!CLAUDE_API_KEY) return fallback;
  const history = getConversation(userId).slice(-4).map((item) => `${item.role}: ${item.content}`).join('\n');
  const system = [
    '너는 카카오톡 챗봇의 검색 라우터야.',
    '사용자 질문을 보고 답변 방식과 필요한 검색어를 정해.',
    '반드시 JSON 객체 하나만 출력해. 설명, 마크다운, 코드블록 금지.',
    'intent는 chat, web_lookup, news_search, local_search, shopping_search 중 하나야.',
    '지역 맛집, 주변 가게, 업종 추천, 장소 검색이면 local_search를 골라.',
    'local_search의 searchQuery는 네이버 지역검색에 바로 넣을 짧은 한국어 검색어로 만들어. 지역명과 사용자가 원하는 업종/음식/장소 조건을 포함해.',
    'local_search는 많이 찾는 순서가 필요하므로 sort는 comment로 둬.',
    '최신 정보, 사실 확인, 모르는 정보는 web_lookup이나 news_search를 골라.',
    '가격, 상품, 구매, 시세는 shopping_search를 골라.',
    '검색이 필요 없는 상담, 잡담, 의견 질문은 chat을 골라.',
    '예: 월계동에서 유명한 곳 찾아줘 치킨으로 -> {"intent":"local_search","tool":"local","searchQuery":"월계동 치킨","sort":"comment","confidence":0.9}',
  ].join('\n');
  const response = await axios.post(CLAUDE_API_URL, {
    model: CLAUDE_MODEL,
    max_tokens: 220,
    temperature: 0,
    system,
    messages: [{ role: 'user', content: `${history ? `최근 대화:\n${history}\n\n` : ''}현재 사용자 질문:\n${message}` }],
  }, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
    timeout: CLAUDE_PLANNER_TIMEOUT_MS,
  });
  return normalizePlan(extractJsonObject(response.data?.content?.[0]?.text || ''), fallback);
}

async function searchNaver(plan) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) return [];
  if (!['web_lookup', 'news_search', 'local_search', 'shopping_search'].includes(plan.intent)) return [];

  const query = normalizeText(plan.searchQuery || plan.productQuery || plan.topic);
  if (!query) return [];

  const config = {
    web_lookup: { url: NAVER_WEB_SEARCH_URL, sort: 'sim' },
    news_search: { url: NAVER_NEWS_SEARCH_URL, sort: 'date' },
    local_search: { url: NAVER_LOCAL_SEARCH_URL, sort: 'comment' },
    shopping_search: { url: NAVER_SHOPPING_SEARCH_URL, sort: 'sim' },
  }[plan.intent];

  const response = await axios.get(config.url, {
    params: { query, display: Math.min(Math.max(NAVER_SEARCH_DISPLAY, 1), 10), sort: plan.sort || config.sort },
    headers: { 'X-Naver-Client-Id': NAVER_CLIENT_ID, 'X-Naver-Client-Secret': NAVER_CLIENT_SECRET },
    timeout: NAVER_SEARCH_TIMEOUT_MS,
  });

  return (response.data?.items || []).map((item) => ({
    type: plan.intent,
    title: stripHtml(item.title),
    link: item.link || item.originallink || '',
    description: stripHtml(item.description),
    category: stripHtml(item.category),
    address: stripHtml(item.address),
    roadAddress: stripHtml(item.roadAddress),
    mallName: stripHtml(item.mallName),
    lprice: item.lprice ? Number(item.lprice) : 0,
    date: item.pubDate || '',
  }));
}

const formatWon = (value) => `${Math.round(value).toLocaleString('ko-KR')}원`;
function formatSearchContext(results) {
  return (results || []).slice(0, NAVER_SEARCH_DISPLAY).map((item, index) => [
    `[${index + 1}] ${item.title}`,
    item.category ? `분류: ${item.category}` : '',
    item.description ? `요약: ${item.description}` : '',
    item.address ? `주소: ${item.address}` : '',
    item.roadAddress ? `도로명주소: ${item.roadAddress}` : '',
    item.mallName ? `판매처: ${item.mallName}` : '',
    item.lprice ? `가격: ${formatWon(item.lprice)}` : '',
    item.date ? `날짜: ${item.date}` : '',
    item.link ? `링크: ${item.link}` : '',
  ].filter(Boolean).join('\n')).join('\n\n');
}

function buildSystemPrompt(results, plan) {
  const searchContext = formatSearchContext(results);
  return [
    '너는 카카오톡에서 대화하는 친근한 한국어 AI 친구야.',
    '모든 답변은 자연스러운 반말로 해. 존댓말, ~요, ~습니다 말투는 쓰지 마.',
    '사용자 질문에 바로 답해. 내부 라우팅, 분석, 검색 여부를 설명하지 마.',
    '검색 결과가 있으면 그 내용을 바탕으로 답하고, 결과가 부족하면 부족하다고 짧게 말한 뒤 그래도 도움이 되는 판단을 해줘.',
    '지역 업체 검색 결과는 제공된 순서가 많이 찾는 순서에 가깝다고 보고, 상위 결과부터 간단히 추천해.',
    '가격/상품 검색 결과는 가격과 판매처를 함께 요약해.',
    '지역 업체나 최신 정보는 검색 결과 기준이라고 자연스럽게 밝혀.',
    '찾아볼게/기다려줘처럼 미래에 도구를 실행할 척하지 마.',
    '카카오톡 제한시간이 짧으니까 보통 1~5문장으로 답해.',
    `현재 한국 시간: ${getKoreanDateTime()}`,
    plan?.searchQuery ? `검색어: ${plan.searchQuery}` : '',
    searchContext ? `검색 결과:\n${searchContext}` : '',
  ].filter(Boolean).join('\n');
}

async function callClaude(message, userId, results, plan) {
  if (!CLAUDE_API_KEY) {
    if (results.length) return buildSearchFallbackAnswer(results, plan);
    return '지금 Claude API 키가 설정 안 돼 있어서 자연어 답변을 못 만들고 있어. 배포 환경에 CLAUDE_API_KEY가 필요해.';
  }
  const history = getConversation(userId).slice(-MAX_HISTORY_MESSAGES).map((item) => ({ role: item.role, content: item.content }));
  const usesSearch = Boolean(results?.length);
  const response = await axios.post(CLAUDE_API_URL, {
    model: CLAUDE_MODEL,
    max_tokens: usesSearch ? 850 : 420,
    temperature: usesSearch ? 0.35 : 0.72,
    system: buildSystemPrompt(results, plan),
    messages: [...history, { role: 'user', content: message }],
  }, {
    headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
    timeout: CLAUDE_TIMEOUT_MS,
  });
  return response.data?.content?.[0]?.text || '응답을 못 만들었어. 다시 한 번만 보내줘.';
}

function buildSearchFallbackAnswer(results, plan) {
  if (!results.length) return '검색 결과를 못 찾았어. 검색어를 조금 더 구체적으로 보내주면 다시 찾아볼게.';
  if (plan.intent === 'local_search') {
    return [`${plan.searchQuery} 기준으로 많이 찾는 순서에 가깝게 보면:`, ...results.slice(0, 3).map((item, index) => `${index + 1}. ${item.title}${item.category ? ` (${item.category})` : ''}${item.roadAddress ? ` - ${item.roadAddress}` : ''}`)].join('\n');
  }
  return [
    `${plan.searchQuery || '검색'} 결과 중 가까운 것들이야:`,
    ...results.slice(0, 3).map((item, index) => `${index + 1}. ${item.title}${item.link ? `\n${item.link}` : ''}`),
  ].join('\n');
}

function withTimeout(promise, ms, fallback) {
  let timer;
  const timeout = new Promise((resolve) => { timer = setTimeout(() => resolve(typeof fallback === 'function' ? fallback() : fallback), ms); });
  return Promise.race([promise.finally(() => clearTimeout(timer)), timeout]);
}

function getQuickReplies(results) {
  const replies = [];
  if (results?.[0]?.link) replies.push({ label: '첫 결과 보기', action: 'webLink', webLinkUrl: results[0].link });
  return replies;
}

async function buildAnswer(message, userId) {
  let plan = fallbackPlan(message);
  let results = [];
  try {
    plan = await planTurnWithClaude(message, userId);
    results = await searchNaver(plan);
  } catch (error) {
    console.error('[search-plan] failed:', { message: error.message, code: error.code, status: error.response?.status });
    try { results = await searchNaver(plan); } catch (searchError) { console.error('[search] failed:', { message: searchError.message, code: searchError.code, status: searchError.response?.status }); }
  }

  const answer = await withTimeout(callClaude(message, userId, results, plan), CHAT_BUDGET_MS, () => buildSearchFallbackAnswer(results, plan));
  return { answer, results, route: routeFromIntent(plan.intent, plan.confidence, plan.source), topic: plan.topic || plan.searchQuery || '', analysis: plan };
}

async function sendCallback(callbackUrl, message, userId) {
  try {
    rememberMessage(userId, 'user', message);
    const { answer, results } = await buildAnswer(message, userId);
    rememberMessage(userId, 'assistant', answer);
    await axios.post(callbackUrl, kakaoTextResponse(answer, getQuickReplies(results), userId), { headers: { 'Content-Type': 'application/json' }, timeout: 5000 });
  } catch (error) {
    console.error('[callback] failed:', { message: error.message, code: error.code, status: error.response?.status });
  }
}

app.get('/', (req, res) => res.type('html').send(`<h1>카카오 스킬 웹훅 서버</h1><p>상태: 정상 실행 중</p><p>라우터: ${ROUTER_VERSION}</p><p>현재 한국 시간: ${getKoreanDateTime()}</p>`));
app.get('/health', (req, res) => res.json({ ok: true, service: 'kakao-skill-webhook', routerVersion: ROUTER_VERSION, timestamp: new Date().toISOString(), koreaTime: getKoreanDateTime(), env: { claudeApiKey: Boolean(CLAUDE_API_KEY), claudeModel: CLAUDE_MODEL, claudeTimeoutMs: CLAUDE_TIMEOUT_MS, plannerTimeoutMs: CLAUDE_PLANNER_TIMEOUT_MS, chatBudgetMs: CHAT_BUDGET_MS, maxResponseLength: MAX_RESPONSE_LENGTH, maxOutputs: MAX_OUTPUTS, naverApi: Boolean(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET), port: PORT } }));
app.get('/routes', (req, res) => res.json({ ok: true, routerVersion: ROUTER_VERSION, routes: ROUTES }));
app.get('/test', (req, res) => res.json(kakaoTextResponse('테스트 성공! 카카오 스킬 응답 형식 정상이야.')));

app.post('/kakao-skill-webhook', async (req, res) => {
  const startedAt = Date.now();
  const message = getUserMessage(req.body);
  const userId = getUserId(req.body);
  const callbackUrl = getCallbackUrl(req.body);
  if (!message) return res.json(kakaoTextResponse('메시지 입력해줘.'));
  if (/^(이어보기|더 보기|더보기|계속|다음)$/i.test(message)) return res.json(getContinuationResponse(userId));

  try {
    if (callbackUrl) {
      setImmediate(() => sendCallback(callbackUrl, message, userId));
      return res.json({ version: '2.0', useCallback: true, data: { text: '바로 확인해서 답할게.' } });
    }

    rememberMessage(userId, 'user', message);
    const { answer, results, route, topic, analysis } = await buildAnswer(message, userId);
    rememberMessage(userId, 'assistant', answer);
    console.log(`[kakao] ${Date.now() - startedAt}ms route=${route.intent}/${route.handler} source=${route.source || ''} search=${results.length} topic=${topic || ''} query=${analysis.searchQuery || ''} user=${userId} message="${message.slice(0, 80)}"`);
    return res.json(kakaoTextResponse(answer, getQuickReplies(results), userId));
  } catch (error) {
    console.error('[kakao] failed:', { message: error.message, code: error.code, status: error.response?.status, elapsedMs: Date.now() - startedAt });
    return res.json(kakaoTextResponse('답변 만드는 중에 문제가 생겼어. 방금 질문 그대로 한 번만 다시 보내줘.'));
  }
});

app.use((req, res) => res.status(404).json({ ok: false, error: 'Not Found' }));
app.listen(PORT, () => {
  console.log(`Kakao skill webhook server listening on port ${PORT}`);
  console.log(`Router version: ${ROUTER_VERSION}`);
  console.log(`Claude model: ${CLAUDE_MODEL}`);
});
