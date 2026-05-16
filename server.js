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
const CLAUDE_MODEL =
  configuredClaudeModel && !RETIRED_CLAUDE_MODELS.has(configuredClaudeModel)
    ? configuredClaudeModel
    : DEFAULT_CLAUDE_MODEL;
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
const OPEN_METEO_GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

const conversations = new Map();
const continuations = new Map();

const KOREA_CITY_COORDS = {
  서울: { name: '서울', latitude: 37.5665, longitude: 126.9780 },
  부산: { name: '부산', latitude: 35.1796, longitude: 129.0756 },
  대구: { name: '대구', latitude: 35.8714, longitude: 128.6014 },
  인천: { name: '인천', latitude: 37.4563, longitude: 126.7052 },
  광주: { name: '광주', latitude: 35.1595, longitude: 126.8526 },
  대전: { name: '대전', latitude: 36.3504, longitude: 127.3845 },
  울산: { name: '울산', latitude: 35.5384, longitude: 129.3114 },
  세종: { name: '세종', latitude: 36.4800, longitude: 127.2890 },
  제주: { name: '제주', latitude: 33.4996, longitude: 126.5312 },
};

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

function getKoreanDateTime() {
  const now = new Date();
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'full',
    timeStyle: 'medium',
  }).format(now);
}

function normalizeText(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripHtml(text) {
  return normalizeText(text)
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}

function trimForKakao(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return '안녕! 뭐 도와줄까?';
  }

  if (normalized.length <= MAX_RESPONSE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, MAX_RESPONSE_LENGTH - 3))}...`;
}

function splitForKakao(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return ['안녕! 뭐 도와줄까?'];
  }

  const chunks = [];
  let remaining = normalized;

  while (remaining.length > MAX_RESPONSE_LENGTH) {
    const slice = remaining.slice(0, MAX_RESPONSE_LENGTH);
    const breakAt = Math.max(
      slice.lastIndexOf('\n'),
      slice.lastIndexOf('. '),
      slice.lastIndexOf('。'),
      slice.lastIndexOf(' '),
    );
    const end = breakAt > MAX_RESPONSE_LENGTH * 0.55 ? breakAt + 1 : MAX_RESPONSE_LENGTH;
    chunks.push(remaining.slice(0, end).trim());
    remaining = remaining.slice(end).trim();
  }

  if (remaining) {
    chunks.push(remaining);
  }

  return chunks;
}

function kakaoTextResponse(text, quickReplies, userId) {
  const chunks = splitForKakao(text);
  const visibleChunks = chunks.slice(0, MAX_OUTPUTS);
  const template = {
    outputs: visibleChunks.map((chunk) => ({
      simpleText: {
        text: chunk,
      },
    })),
  };

  const replies = Array.isArray(quickReplies) ? [...quickReplies] : [];
  if (chunks.length > MAX_OUTPUTS && userId) {
    continuations.set(userId, chunks.slice(MAX_OUTPUTS));
    replies.push({
      label: '이어보기',
      action: 'message',
      messageText: '이어보기',
    });
  }

  if (replies.length > 0) {
    template.quickReplies = replies;
  }

  return {
    version: '2.0',
    template,
  };
}

function getUserMessage(body) {
  return normalizeText(body?.userRequest?.utterance || body?.utterance || body?.message || '');
}

function getUserId(body) {
  return body?.userRequest?.user?.id || body?.userRequest?.user?.properties?.botUserKey || 'anonymous';
}

function getCallbackUrl(body) {
  return body?.userRequest?.callbackUrl || body?.callbackUrl || '';
}

function isContinuationRequest(message) {
  return /^(이어보기|더 보기|더보기|계속|다음)$/i.test(message);
}

function getContinuationResponse(userId) {
  const chunks = continuations.get(userId);
  if (!Array.isArray(chunks) || chunks.length === 0) {
    return kakaoTextResponse('이어볼 내용이 없어. 새 질문 보내줘.');
  }

  const text = chunks.join('\n\n');
  continuations.delete(userId);
  return kakaoTextResponse(text, undefined, userId);
}

function isWeatherQuery(message) {
  return /날씨|기온|비\s*와|눈\s*와|미세먼지|습도|더워|추워/.test(message);
}

function isSmallTalk(message) {
  return /^(안녕|안녕하세요|하이|ㅎㅇ|고마워|감사|ㅋㅋ+|ㅎㅎ+|응|네|아니|좋아|그래|뭐해|뭐함|심심해|심심하다|졸려|피곤해|배고파|그냥|잡담|수다)$/i.test(message);
}

function shouldSearchWeb(message) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET || isSmallTalk(message) || isWeatherQuery(message)) {
    return false;
  }

  const explicitSearch = /검색|찾아|찾아봐|알아봐|확인해|최신|최근|실시간|뉴스|기사|속보/.test(message);
  const liveInfo = /가격|주가|환율|일정|순위|발표|업데이트|논란|시장/.test(message);
  const knowledgeLookup = /누구|어디|언제|무엇|뭐야|뭐지|뜻|정보|알려줘|대해서|관련|모르는/.test(message);

  return explicitSearch || liveInfo || knowledgeLookup;
}

function shouldSearchNews(message) {
  if (isWeatherQuery(message)) {
    return false;
  }

  return /뉴스|기사|속보|논란|발표|업데이트|주가|시장/.test(message);
}

function getWeatherLocation(message) {
  const patterns = [
    /([가-힣]+(?:시|군|구|동|읍|면|도))\s*날씨/,
    /날씨\s*([가-힣]+(?:시|군|구|동|읍|면|도))/,
    /([가-힣]+)\s*날씨/,
    /날씨\s*([가-힣]+)/,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) {
      const location = match[1].replace(/날씨|오늘|지금|현재|알려줘|검색|찾아줘/g, '').trim();
      if (location) {
        return location;
      }
    }
  }

  return '서울';
}

function getSearchQuery(userMessage) {
  if (isWeatherQuery(userMessage)) {
    return `${getWeatherLocation(userMessage)} 날씨`;
  }

  const cleaned = normalizeText(userMessage)
    .replace(/검색해서|검색해|검색|찾아서|찾아줘|찾아봐|알아봐|알려줘|대해서|관련해서|정보|최신으로|최신|오늘|지금|현재/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || userMessage;
}

function getConversation(userId) {
  return conversations.get(userId) || [];
}

function rememberMessage(userId, role, content) {
  const history = getConversation(userId);
  history.push({ role, content: trimForKakao(content) });

  const trimmed = history.slice(-MAX_HISTORY_MESSAGES);
  conversations.set(userId, trimmed);
}

function getNaverSearchUrl(query) {
  return `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`;
}

function getQuickReplies(userMessage, searchResults) {
  const replies = [];

  if (isWeatherQuery(userMessage)) {
    replies.push({
      label: '네이버 날씨 보기',
      action: 'webLink',
      webLinkUrl: getNaverSearchUrl(`${getWeatherLocation(userMessage)} 날씨`),
    });
  }

  const firstResult = Array.isArray(searchResults) ? searchResults.find((item) => item.link) : null;
  if (firstResult) {
    replies.push({
      label: '검색결과 보기',
      action: 'webLink',
      webLinkUrl: firstResult.link,
    });
  }

  return replies.length > 0 ? replies : undefined;
}

function getWeatherDescription(code) {
  if ([0].includes(code)) return '맑음';
  if ([1, 2, 3].includes(code)) return '구름 조금/흐림';
  if ([45, 48].includes(code)) return '안개';
  if ([51, 53, 55, 56, 57].includes(code)) return '이슬비';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '비';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '눈';
  if ([95, 96, 99].includes(code)) return '뇌우';
  return '확인 필요';
}

async function resolveWeatherLocation(location) {
  const compact = location.replace(/특별시|광역시|시|군|구|동|읍|면|도/g, '').trim();
  if (KOREA_CITY_COORDS[location]) return KOREA_CITY_COORDS[location];
  if (KOREA_CITY_COORDS[compact]) return KOREA_CITY_COORDS[compact];

  const response = await axios.get(OPEN_METEO_GEOCODING_URL, {
    params: {
      name: location,
      count: 1,
      language: 'ko',
      format: 'json',
      countryCode: 'KR',
    },
    timeout: WEATHER_TIMEOUT_MS,
  });

  const result = response.data?.results?.[0];
  if (!result) {
    return KOREA_CITY_COORDS.서울;
  }

  return {
    name: result.name || location,
    latitude: result.latitude,
    longitude: result.longitude,
  };
}

async function getWeatherAnswer(userMessage) {
  const requestedLocation = getWeatherLocation(userMessage);
  const location = await resolveWeatherLocation(requestedLocation);
  const response = await axios.get(OPEN_METEO_FORECAST_URL, {
    params: {
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: 'Asia/Seoul',
      forecast_days: 1,
      current: 'temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    },
    timeout: WEATHER_TIMEOUT_MS,
  });

  const current = response.data?.current || {};
  const daily = response.data?.daily || {};
  const name = location.name || requestedLocation;
  const weather = getWeatherDescription(current.weather_code);
  const rainChance = daily.precipitation_probability_max?.[0];
  const maxTemp = daily.temperature_2m_max?.[0];
  const minTemp = daily.temperature_2m_min?.[0];

  return [
    `${name} 기준 현재 날씨야.`,
    `지금 ${current.temperature_2m}°C, 체감 ${current.apparent_temperature}°C, ${weather}이야.`,
    `오늘 최저/최고는 ${minTemp}°C / ${maxTemp}°C 정도고, 강수확률은 ${rainChance ?? '확인 필요'}%야.`,
    `습도는 ${current.relative_humidity_2m}%, 바람은 ${current.wind_speed_10m}km/h 정도야.`,
    '위치가 다르면 “강남 날씨”, “부산 날씨”처럼 지역명 붙여서 물어봐.',
  ].join('\n');
}

async function searchNaver(userMessage) {
  if (!shouldSearchWeb(userMessage)) {
    return [];
  }

  const query = getSearchQuery(userMessage);
  const url = shouldSearchNews(userMessage) ? NAVER_NEWS_SEARCH_URL : NAVER_WEB_SEARCH_URL;
  const response = await axios.get(url, {
    params: {
      query,
      display: Math.min(Math.max(NAVER_SEARCH_DISPLAY, 1), 10),
      sort: shouldSearchNews(userMessage) ? 'date' : 'sim',
    },
    headers: {
      'X-Naver-Client-Id': NAVER_CLIENT_ID,
      'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
    },
    timeout: NAVER_SEARCH_TIMEOUT_MS,
  });

  return (response.data?.items || []).map((item) => ({
    title: stripHtml(item.title),
    link: item.link || item.originallink,
    description: stripHtml(item.description),
    date: item.pubDate || '',
  }));
}

function formatSearchContext(searchResults) {
  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    return '';
  }

  return searchResults
    .slice(0, NAVER_SEARCH_DISPLAY)
    .map((item, index) => {
      const lines = [`[${index + 1}] ${item.title}`];
      if (item.description) lines.push(`요약: ${item.description}`);
      if (item.date) lines.push(`날짜: ${item.date}`);
      if (item.link) lines.push(`링크: ${item.link}`);
      return lines.join('\n');
    })
    .join('\n\n');
}

function buildSearchFallbackAnswer(userMessage, searchResults) {
  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    return '인터넷 검색 결과를 못 찾았어. 검색어를 조금 더 구체적으로 보내주면 다시 찾아볼게.';
  }

  const query = getSearchQuery(userMessage);
  const lines = [`“${query}”로 인터넷에서 찾아본 결과야.`];
  searchResults.slice(0, 3).forEach((item, index) => {
    lines.push(`${index + 1}. ${item.title}`);
    if (item.description) {
      lines.push(item.description);
    }
    if (item.link) {
      lines.push(item.link);
    }
  });
  lines.push('원하면 이 결과를 바탕으로 더 쉽게 요약해줄게.');
  return lines.join('\n');
}

function buildSystemPrompt(searchResults) {
  const prompt = [
    '너는 카카오톡 챗봇에 연결된 친근한 한국어 AI 친구야.',
    '모든 대화는 반드시 자연스러운 반말로 해. 존댓말, ~요, ~습니다 말투는 쓰지 마.',
    '사용자가 그냥 잡담하면 검색하지 말고 편하게 대화해.',
    '이전 대화 맥락을 자연스럽게 이어서 답해.',
    '카카오톡에서 바로 읽기 좋게 짧고 실용적으로 답해.',
    '제목, 표, 긴 마크다운 구분선은 쓰지 마.',
    '사용자가 바로 실행할 수 있는 구체적인 조언을 우선해.',
    '실시간 검색, 날씨, 주가처럼 외부 확인이 필요한 내용은 확정해서 꾸며내지 말고 확인이 필요하다고 말해.',
    '검색 결과가 제공되면 그 내용을 우선해서 답하고, 핵심 출처명이나 링크 번호를 짧게 말해.',
    '검색 결과가 부족하면 부족하다고 솔직히 말하고 확인 방법을 알려줘.',
    '날씨 질문에는 현재 실시간 값을 직접 조회했다고 말하지 말고, 확인 기준을 짧게 안내해.',
    `현재 한국 시간은 ${getKoreanDateTime()}야.`,
  ];

  const searchContext = formatSearchContext(searchResults);
  if (searchContext) {
    prompt.push(`네이버 검색 결과:\n${searchContext}`);
  }

  return prompt.join('\n');
}

function buildClaudeMessages(userMessage, userId) {
  const history = getConversation(userId).slice(-MAX_HISTORY_MESSAGES);
  return [
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    {
      role: 'user',
      content: userMessage,
    },
  ];
}

async function callClaude(userMessage, userId, searchResults = []) {
  if (!CLAUDE_API_KEY) {
    return 'Claude API 키가 아직 설정 안 됐어. Railway Variables에 CLAUDE_API_KEY를 넣으면 AI 대화가 켜져.';
  }

  const payload = {
    model: CLAUDE_MODEL,
    max_tokens: 900,
    temperature: 0.7,
    system: buildSystemPrompt(searchResults),
    messages: buildClaudeMessages(userMessage, userId),
  };

  const response = await axios.post(CLAUDE_API_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    timeout: CLAUDE_TIMEOUT_MS,
  });

  return response.data?.content?.[0]?.text || '응답을 못 만들었어. 다시 한 번만 보내줘.';
}

async function buildAnswer(userMessage, userId, options = {}) {
  if (isWeatherQuery(userMessage)) {
    try {
      return {
        answer: await getWeatherAnswer(userMessage),
        searchResults: [],
      };
    } catch (error) {
      console.error('[weather] lookup failed:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
      });
      const query = getSearchQuery(userMessage);
      return {
        answer: `${query}는 실시간 날씨 화면에서 확인하는 게 제일 정확해. 아래 “네이버 날씨 보기” 눌러서 확인해봐.`,
        searchResults: [],
      };
    }
  }

  let searchResults = [];

  try {
    searchResults = await searchNaver(userMessage);
  } catch (error) {
    console.error('[search] naver failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
    });
  }

  if (options.preferFastSearch && searchResults.length > 0) {
    return {
      answer: buildSearchFallbackAnswer(userMessage, searchResults),
      searchResults,
    };
  }

  try {
    const answer = await callClaude(userMessage, userId, searchResults);
    return {
      answer,
      searchResults,
    };
  } catch (error) {
    if (searchResults.length > 0) {
      return {
        answer: buildSearchFallbackAnswer(userMessage, searchResults),
        searchResults,
      };
    }
    throw error;
  }
}

async function sendCallback(callbackUrl, userMessage, userId) {
  try {
    const { answer, searchResults } = await buildAnswer(userMessage, userId);
    const quickReplies = getQuickReplies(userMessage, searchResults);
    rememberMessage(userId, 'user', userMessage);
    rememberMessage(userId, 'assistant', answer);
    await axios.post(callbackUrl, kakaoTextResponse(answer, quickReplies, userId), {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  } catch (error) {
    console.error('[kakao] callback failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
    });
  }
}

app.get('/', (req, res) => {
  res.type('html').send(`
    <h1>카카오 스킬 웹훅 서버</h1>
    <p>상태: 정상 실행 중</p>
    <p>현재 한국 시간: ${getKoreanDateTime()}</p>
    <ul>
      <li>POST /kakao-skill-webhook</li>
      <li>GET /health</li>
      <li>GET /test</li>
    </ul>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'kakao-skill-webhook',
    timestamp: new Date().toISOString(),
    koreaTime: getKoreanDateTime(),
    env: {
      claudeApiKey: Boolean(CLAUDE_API_KEY),
      claudeModel: CLAUDE_MODEL,
      claudeTimeoutMs: CLAUDE_TIMEOUT_MS,
      maxResponseLength: MAX_RESPONSE_LENGTH,
      maxOutputs: MAX_OUTPUTS,
      naverApi: Boolean(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET),
      naverSearchDisplay: NAVER_SEARCH_DISPLAY,
      weatherTimeoutMs: WEATHER_TIMEOUT_MS,
      port: PORT,
    },
  });
});

app.get('/test', (req, res) => {
  res.json(kakaoTextResponse('테스트 성공! 카카오 스킬 응답 형식 정상이어.'));
});

app.post('/kakao-skill-webhook', async (req, res) => {
  const startedAt = Date.now();
  const userMessage = getUserMessage(req.body);
  const userId = getUserId(req.body);
  const callbackUrl = getCallbackUrl(req.body);

  if (!userMessage) {
    return res.json(kakaoTextResponse('메시지 입력해줘.'));
  }

  if (isContinuationRequest(userMessage)) {
    return res.json(getContinuationResponse(userId));
  }

  try {
    if (callbackUrl) {
      setImmediate(() => sendCallback(callbackUrl, userMessage, userId));
      return res.json({
        version: '2.0',
        useCallback: true,
        data: {
          text: '필요하면 인터넷 검색까지 확인해서 답변 정리하고 있어. 잠깐만 기다려줘.',
        },
      });
    }

    const { answer, searchResults } = await buildAnswer(userMessage, userId, { preferFastSearch: true });
    const quickReplies = getQuickReplies(userMessage, searchResults);

    rememberMessage(userId, 'user', userMessage);
    rememberMessage(userId, 'assistant', answer);

    console.log(`[kakao] ${Date.now() - startedAt}ms user=${userId} search=${searchResults.length} message="${userMessage.slice(0, 80)}"`);
    return res.json(kakaoTextResponse(answer, quickReplies, userId));
  } catch (error) {
    console.error('[kakao] request failed:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      elapsedMs: Date.now() - startedAt,
    });

    const timeoutMessage =
      '답변 만드는 게 평소보다 늦어지고 있어. 같은 질문 한 번만 더 보내주면 이어서 답할게.';
    const errorMessage =
      '지금 AI 응답을 못 받아왔어. 잠깐 뒤에 다시 보내주면 바로 이어서 도와줄게.';

    return res.json(kakaoTextResponse(error.code === 'ECONNABORTED' ? timeoutMessage : errorMessage));
  }
});

app.use((req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Not Found',
  });
});

app.listen(PORT, () => {
  console.log(`Kakao skill webhook server listening on port ${PORT}`);
  console.log(`Claude model: ${CLAUDE_MODEL}`);
  console.log(`Claude timeout: ${CLAUDE_TIMEOUT_MS}ms`);
  console.log(`Naver search: ${NAVER_CLIENT_ID && NAVER_CLIENT_SECRET ? 'configured' : 'missing'}`);
  console.log(`Claude API key: ${CLAUDE_API_KEY ? 'configured' : 'missing'}`);
});
