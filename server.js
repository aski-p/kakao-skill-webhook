require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const ROUTER_VERSION = 'claude-planned-naver-search-2026-05-19g';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const CLAUDE_PLANNER_TIMEOUT_MS = Number(process.env.CLAUDE_PLANNER_TIMEOUT_MS || 700);
const CLAUDE_TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS || 1200);
const KAKAO_MAX_RESPONSE_LENGTH = Number(process.env.KAKAO_MAX_RESPONSE_LENGTH || 1000);

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_SEARCH_TIMEOUT_MS = Number(process.env.NAVER_SEARCH_TIMEOUT_MS || 900);
const NAVER_SEARCH_DISPLAY = Math.min(Math.max(Number(process.env.NAVER_SEARCH_DISPLAY || 5), 1), 10);

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
  const compacted = intent === 'local_search' ? compactLocalQuery(message) : compactGeneralQuery(message);
  return compacted || normalizeText(message);
}

function buildLocalRetryQueries(query) {
  const normalized = normalizeKoreanSearchText(query);
  const location = normalized.match(LOCAL_LOCATION_PATTERN)?.[0] || '';
  const meal = normalized.match(/점심|저녁|아침|브런치|런치|디너/)?.[0] || '';
  const relaxedLocation = location.replace(/\d+\s*가$/, '');
  const candidates = [
    normalized,
    location && meal ? `${location} ${meal} 맛집` : '',
    location ? `${location} 맛집` : '',
    relaxedLocation && relaxedLocation !== location && meal ? `${relaxedLocation} ${meal} 맛집` : '',
    relaxedLocation && relaxedLocation !== location ? `${relaxedLocation} 맛집` : '',
  ];
  return [...new Set(candidates.map((item) => normalizeText(item)).filter(Boolean))];
}

function fallbackPlan(message) {
  const text = normalizeKoreanSearchText(message);
  const hasLocation = LOCAL_LOCATION_PATTERN.test(text);
  const hasLocalSearchCue = /(근처|주변|가까운|동네|맛집|식당|매장|가게|업체|장소|시설|센터|코트|구장|체육관|운동장|연습장|클럽|예약|잡을\s*수|이용할\s*수|어디|찾아|검색|추천|유명한)/.test(text);
  if (/뉴스|기사|속보|최신\s*뉴스|최근\s*뉴스/.test(text)) return { intent: 'news_search', searchQuery: compactSearchQuery(text, 'news_search'), sort: 'date', confidence: 0.75, source: 'fallback' };
  if (/가격|최저가|시세|얼마|구매|상품|제품|쇼핑/.test(text)) return { intent: 'shopping_search', searchQuery: compactSearchQuery(text, 'shopping_search'), sort: 'sim', confidence: 0.72, source: 'fallback' };
  if (hasLocation && hasLocalSearchCue) return { intent: 'local_search', searchQuery: compactSearchQuery(text, 'local_search'), sort: 'comment', confidence: 0.72, source: 'fallback' };
  if (/검색|찾아봐|알아봐|확인|최신|최근|실시간|웹|인터넷|네이버|구글|출처/.test(text)) return { intent: 'web_lookup', searchQuery: compactSearchQuery(text, 'web_lookup'), sort: 'sim', confidence: 0.7, source: 'fallback' };
  return { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.65, source: 'fallback' };
}

function extractJsonObject(text) {
  const match = normalizeText(text).match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

function normalizePlan(plan, fallback) {
  const intents = new Set(['chat', 'web_lookup', 'news_search', 'local_search', 'shopping_search']);
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
    'intent는 chat, web_lookup, news_search, local_search, shopping_search 중 하나야.',
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
    return plan.intent === 'local_search'
      ? `${plan.searchQuery}로 네이버 지역검색을 해봤는데 바로 보여줄 만한 결과가 안 잡혔어.`
      : '검색 결과를 못 찾았어.';
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
  return results.slice(0, 5).map((item, index) => ({
    label: `${index + 1}번 보기`,
    action: 'webLink',
    webLinkUrl: item.link || buildNaverSearchUrl(item, plan),
  }));
}

async function answerChat(message, userId) {
  if (!CLAUDE_API_KEY) return '응, 바로 답해줄게. 지금은 검색 필요한 질문이면 네이버 검색 결과 기준으로 알려줄 수 있어.';
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

async function buildAnswer(message, userId) {
  const plan = await planTurn(message, userId);
  if (plan.intent !== 'chat') {
    try {
      const search = await searchNaverWithRetries(plan);
      return { answer: formatSearchAnswer(search.plan, search.results), quickReplies: buildQuickReplies(search.plan, search.results), plan: search.plan, results: search.results };
    } catch (error) {
      console.error('[naver] failed:', { message: error.message, code: error.code, status: error.response?.status });
      return { answer: '검색이 잠깐 막혔어. 같은 질문 한 번만 다시 보내줘.', quickReplies: [], plan, results: [] };
    }
  }

  try {
    const answer = await answerChat(message, userId);
    return { answer, quickReplies: [], plan, results: [] };
  } catch (error) {
    console.error('[claude-chat] failed:', { message: error.message, code: error.code, status: error.response?.status });
    return { answer: '답변이 잠깐 늦어졌어. 같은 질문 한 번만 다시 보내줘.', quickReplies: [], plan, results: [] };
  }
}

app.get('/', (req, res) => res.type('html').send(`<h1>카카오 스킬 웹훅 서버</h1><p>상태: 정상 실행 중</p><p>라우터: ${ROUTER_VERSION}</p><p>현재 한국 시간: ${getKoreanDateTime()}</p>`));
app.get('/health', (req, res) => res.json({ ok: true, service: 'kakao-skill-webhook', routerVersion: ROUTER_VERSION, koreaTime: getKoreanDateTime(), env: { claudeApiKey: Boolean(CLAUDE_API_KEY), naverApi: Boolean(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET), plannerTimeoutMs: CLAUDE_PLANNER_TIMEOUT_MS, naverTimeoutMs: NAVER_SEARCH_TIMEOUT_MS, port: PORT } }));
app.get('/test', (req, res) => res.json(kakaoTextResponse('테스트 성공! 카카오 스킬 응답 형식 정상이야.')));
app.get('/routes', (req, res) => res.json({ ok: true, routerVersion: ROUTER_VERSION, routes: ['chat', 'web_lookup', 'news_search', 'local_search', 'shopping_search'] }));

app.post('/kakao-skill-webhook', async (req, res) => {
  const startedAt = Date.now();
  const message = getUserMessage(req.body);
  const userId = getUserId(req.body);
  if (!message) return res.json(kakaoTextResponse('메시지 입력해줘.'));

  try {
    remember(userId, 'user', message);
    const { answer, quickReplies, plan, results } = await buildAnswer(message, userId);
    remember(userId, 'assistant', answer);
    console.log(`[kakao] ${Date.now() - startedAt}ms intent=${plan.intent} source=${plan.source} results=${results.length} query=${plan.searchQuery || ''}`);
    return res.json(kakaoTextResponse(answer, quickReplies));
  } catch (error) {
    console.error('[kakao] failed:', { message: error.message, code: error.code, status: error.response?.status, elapsedMs: Date.now() - startedAt });
    return res.json(kakaoTextResponse('서버가 잠깐 꼬였어. 방금 질문 그대로 한 번만 다시 보내줘.'));
  }
});

app.use((req, res) => res.status(404).json({ ok: false, error: 'Not Found' }));
app.listen(PORT, () => {
  console.log(`Kakao skill webhook server listening on port ${PORT}`);
  console.log(`Router version: ${ROUTER_VERSION}`);
});
