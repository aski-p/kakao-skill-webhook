require('dotenv').config();

const express = require('express');
const axios = require('axios');

const app = express();

const PORT = process.env.PORT || 3000;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_CLAUDE_MODEL = 'claude-sonnet-4-6';
const RETIRED_CLAUDE_MODELS = new Set(['claude-3-5-sonnet-20240620']);
const configuredClaudeModel = process.env.CLAUDE_MODEL;
const CLAUDE_MODEL =
  configuredClaudeModel && !RETIRED_CLAUDE_MODELS.has(configuredClaudeModel)
    ? configuredClaudeModel
    : DEFAULT_CLAUDE_MODEL;
const CLAUDE_TIMEOUT_MS = Number(process.env.CLAUDE_TIMEOUT_MS || 12000);
const MAX_RESPONSE_LENGTH = Number(process.env.KAKAO_MAX_RESPONSE_LENGTH || 600);
const MAX_HISTORY_MESSAGES = Number(process.env.KAKAO_HISTORY_MESSAGES || 8);

const conversations = new Map();

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

function kakaoTextResponse(text, quickReplies) {
  const template = {
    outputs: [
      {
        simpleText: {
          text: trimForKakao(text),
        },
      },
    ],
  };

  if (Array.isArray(quickReplies) && quickReplies.length > 0) {
    template.quickReplies = quickReplies;
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

function isWeatherQuery(message) {
  return /날씨|기온|비\s*와|눈\s*와|미세먼지|습도|더워|추워/.test(message);
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

function getQuickReplies(userMessage) {
  if (!isWeatherQuery(userMessage)) {
    return undefined;
  }

  const location = getWeatherLocation(userMessage);
  const query = encodeURIComponent(`${location} 날씨`);
  return [
    {
      label: '네이버 날씨 보기',
      action: 'webLink',
      webLinkUrl: `https://search.naver.com/search.naver?query=${query}`,
    },
  ];
}

function buildSystemPrompt() {
  return [
    '당신은 카카오톡 챗봇에 연결된 친근한 한국어 AI 친구입니다.',
    '이전 대화 맥락을 자연스럽게 이어서 답변하세요.',
    '답변은 카카오톡에서 읽기 좋게 짧고 실용적으로 작성하세요.',
    '사용자가 바로 실행할 수 있는 구체적인 조언을 우선하세요.',
    '실시간 검색, 날씨, 주가처럼 외부 확인이 필요한 내용은 확정해서 꾸며내지 말고 확인이 필요하다고 말하세요.',
    '날씨 질문에는 현재 실시간 값을 직접 조회했다고 말하지 말고, 확인 방법이나 판단 기준을 짧게 안내하세요.',
    `현재 한국 시간은 ${getKoreanDateTime()}입니다.`,
  ].join('\n');
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

async function callClaude(userMessage, userId) {
  if (!CLAUDE_API_KEY) {
    return 'Claude API 키가 아직 설정되지 않았어요. Railway Variables에 CLAUDE_API_KEY를 추가하면 AI 대화가 활성화됩니다.';
  }

  const payload = {
    model: CLAUDE_MODEL,
    max_tokens: 700,
    temperature: 0.8,
    system: buildSystemPrompt(),
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
      naverApi: Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET),
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

  if (!userMessage) {
    return res.json(kakaoTextResponse('메시지를 입력해주세요.'));
  }

  try {
    const quickReplies = getQuickReplies(userMessage);
    const answer = await callClaude(userMessage, userId);

    rememberMessage(userId, 'user', userMessage);
    rememberMessage(userId, 'assistant', answer);

    console.log(`[kakao] ${Date.now() - startedAt}ms user=${userId} message="${userMessage.slice(0, 80)}"`);
    return res.json(kakaoTextResponse(answer, quickReplies));
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
  console.log(`Claude API key: ${CLAUDE_API_KEY ? 'configured' : 'missing'}`);
});
