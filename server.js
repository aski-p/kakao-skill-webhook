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
const NAVER_WEB_SEARCH_URL = 'https://openapi.naver.com/v1/search/webkr.json';
const NAVER_NEWS_SEARCH_URL = 'https://openapi.naver.com/v1/search/news.json';

const conversations = new Map();
const continuations = new Map();

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
    return '안녕하세요! 무엇을 도와드릴까요?';
  }

  if (normalized.length <= MAX_RESPONSE_LENGTH) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, MAX_RESPONSE_LENGTH - 3))}...`;
}

function splitForKakao(text) {
  const normalized = normalizeText(text);
  if (!normalized) {
    return ['안녕하세요! 무엇을 도와드릴까요?'];
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
    return kakaoTextResponse('이어볼 내용이 없어요. 새 질문을 보내주세요.');
  }

  const text = chunks.join('\n\n');
  continuations.delete(userId);
  return kakaoTextResponse(text, undefined, userId);
}

function isWeatherQuery(message) {
  return /날씨|기온|비\s*와|눈\s*와|미세먼지|습도|더워|추워/.test(message);
}

function isSmallTalk(message) {
  return /^(안녕|안녕하세요|하이|고마워|감사|ㅋㅋ+|ㅎㅎ+|응|네|아니|좋아|그래)$/i.test(message);
}

function shouldSearchWeb(message) {
  if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET || isSmallTalk(message)) {
    return false;
  }

  return /검색|찾아|찾아봐|알아봐|최신|최근|오늘|지금|현재|실시간|뉴스|기사|가격|주가|환율|날씨|일정|순위|누구|어디|언제|무엇|뭐야|뭐지|뜻|정보|알려줘|대해서|관련|모르는|확인/.test(message);
}

function shouldSearchNews(message) {
  return /뉴스|기사|속보|최근|최신|오늘|현재|논란|발표|업데이트|주가|시장/.test(message);
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
      return match[1].replace(/날씨/g, '').trim();
    }
  }

  return '서울';
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

function getQuickReplies(userMessage, searchResults) {
  const replies = [];

  if (isWeatherQuery(userMessage)) {
    const location = getWeatherLocation(userMessage);
    const query = encodeURIComponent(`${location} 날씨`);
    replies.push({
      label: '네이버 날씨 보기',
      action: 'webLink',
      webLinkUrl: `https://search.naver.com/search.naver?query=${query}`,
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

async function searchNaver(userMessage) {
  if (!shouldSearchWeb(userMessage)) {
    return [];
  }

  const url = shouldSearchNews(userMessage) ? NAVER_NEWS_SEARCH_URL : NAVER_WEB_SEARCH_URL;
  const response = await axios.get(url, {
    params: {
      query: userMessage,
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
    return '인터넷 검색 결과를 찾지 못했어요. 검색어를 조금 더 구체적으로 보내주시면 다시 찾아볼게요.';
  }

  const lines = ['인터넷에서 찾아본 결과예요.'];
  searchResults.slice(0, 3).forEach((item, index) => {
    lines.push(`${index + 1}. ${item.title}`);
    if (item.description) {
      lines.push(item.description);
    }
    if (item.link) {
      lines.push(item.link);
    }
  });
  lines.push('원하면 이 결과를 바탕으로 더 쉽게 요약해달라고 해주세요.');
  return lines.join('\n');
}

function buildSystemPrompt(searchResults) {
  const prompt = [
    '당신은 카카오톡 챗봇에 연결된 친근한 한국어 AI 친구입니다.',
    '이전 대화 맥락을 자연스럽게 이어서 답변하세요.',
    '답변은 카카오톡에서 바로 읽기 좋게 짧고 실용적으로 작성하세요.',
    '제목, 표, 긴 마크다운 구분선은 쓰지 마세요.',
    '사용자가 바로 실행할 수 있는 구체적인 조언을 우선하세요.',
    '실시간 검색, 날씨, 주가처럼 외부 확인이 필요한 내용은 확정해서 꾸며내지 말고 확인이 필요하다고 말하세요.',
    '검색 결과가 제공되면 그 내용을 우선해서 답하고, 핵심 출처명이나 링크 번호를 짧게 언급하세요.',
    '검색 결과가 부족하면 부족하다고 솔직히 말하고 확인 방법을 안내하세요.',
    '날씨 질문에는 현재 실시간 값을 직접 조회했다고 말하지 말고, 확인 방법이나 판단 기준을 짧게 안내하세요.',
    `현재 한국 시간은 ${getKoreanDateTime()}입니다.`,
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
    return 'Claude API 키가 아직 설정되지 않았어요. Railway Variables에 CLAUDE_API_KEY를 추가하면 AI 대화가 활성화됩니다.';
  }

  const payload = {
    model: CLAUDE_MODEL,
    max_tokens: 900,
    temperature: 0.6,
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

  return response.data?.content?.[0]?.text || '응답을 생성하지 못했습니다. 다시 시도해주세요.';
}

async function buildAnswer(userMessage, userId, options = {}) {
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
      port: PORT,
    },
  });
});

app.get('/test', (req, res) => {
  res.json(kakaoTextResponse('테스트 성공! 카카오 스킬 응답 형식이 정상입니다.'));
});

app.post('/kakao-skill-webhook', async (req, res) => {
  const startedAt = Date.now();
  const userMessage = getUserMessage(req.body);
  const userId = getUserId(req.body);
  const callbackUrl = getCallbackUrl(req.body);

  if (!userMessage) {
    return res.json(kakaoTextResponse('메시지를 입력해주세요.'));
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
          text: '필요하면 인터넷 검색까지 확인해서 답변을 정리하고 있어요. 잠시만 기다려주세요.',
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
      '답변 생성이 평소보다 늦어지고 있어요. 같은 질문을 한 번만 더 보내주시면 이어서 답할게요.';
    const errorMessage =
      '지금 AI 응답을 받아오지 못했어요. 잠시 후 다시 보내주시면 바로 이어서 도와드릴게요.';

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
