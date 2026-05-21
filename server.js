require('dotenv').config();

const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const NaverWeatherCrawler = require('./crawlers/naver-weather-crawler');

const app = express();
const PORT = process.env.PORT || 3000;
const ROUTER_VERSION = 'claude-haiku-4-5-2026-05-21ad-fast-meal-chat';

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CONFIGURED_CLAUDE_MODEL = String(process.env.CLAUDE_MODEL || '').trim();
const CLAUDE_MODEL = CONFIGURED_CLAUDE_MODEL || 'claude-haiku-4-5-20251001';
const CLAUDE_FALLBACK_MODELS = ['claude-3-5-haiku-20241022', 'claude-3-haiku-20240307'];
const CLAUDE_PLANNER_TIMEOUT_MS = Math.max(Number(process.env.CLAUDE_PLANNER_TIMEOUT_MS || 1800), 1000);
const CLAUDE_TIMEOUT_MS = Math.max(Number(process.env.CLAUDE_TIMEOUT_MS || 4400), 4400);
const KAKAO_MAX_RESPONSE_LENGTH = Number(process.env.KAKAO_MAX_RESPONSE_LENGTH || 1000);
const GOOGLE_CALENDAR_TIMEOUT_MS = Math.min(Math.max(Number(process.env.GOOGLE_CALENDAR_TIMEOUT_MS || 3200), 1500), 4200);

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
const GOOGLE_TOKEN_STORE_BUCKET = process.env.GOOGLE_TOKEN_STORE_BUCKET || 'app-state';
const GOOGLE_TOKEN_STORE_OBJECT = process.env.GOOGLE_TOKEN_STORE_OBJECT || 'google-calendar-tokens.json';
const GOOGLE_CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/tasks.readonly',
];
const GOOGLE_TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks.readonly';
const KAKAO_CALENDAR_ALLOWED_USER_IDS = String(process.env.KAKAO_CALENDAR_ALLOWED_USER_IDS || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const MEAL_WORD_PATTERN = /점심|저녁|아침|브런치|런치|디너|야식/;
const naverWeatherCrawler = new NaverWeatherCrawler();
let tokenStoreSupabase = null;
let tokenStoreBucketReady = false;
let lastGoogleTokenStoreStatus = { mode: 'unknown', ok: null, message: null, at: null };

const NAVER_URLS = {
  web_lookup: 'https://openapi.naver.com/v1/search/webkr.json',
  news_search: 'https://openapi.naver.com/v1/search/news.json',
  local_search: 'https://openapi.naver.com/v1/search/local.json',
  shopping_search: 'https://openapi.naver.com/v1/search/shop.json',
};

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

const conversations = new Map();
const calendarCardCache = new Map();
let lastClaudeStatus = { ok: null, status: null, code: null, message: null, at: null };
const normalizeText = (text) => String(text || '').replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
const stripHtml = (text) => normalizeText(text).replace(/<[^>]*>/g, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
const getKoreanDateTime = () => new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full', timeStyle: 'medium' }).format(new Date());
const getUserMessage = (body) => normalizeText(body?.userRequest?.utterance || body?.utterance || body?.message || '');
const getUserId = (body) => body?.userRequest?.user?.id || body?.userRequest?.user?.properties?.botUserKey || 'anonymous';
const LOCAL_LOCATION_PATTERN = /[가-힣A-Za-z0-9]+(?:구|동|역|로|길|시|군|읍|면|리|가)/;
const WEATHER_WORD_PATTERN = /날씨|기온|온도|비\s*와|비와|비\s*올|비올|우산|미세먼지|초미세먼지|습도|바람/;
const CALENDAR_ASSET_DIR = path.join(__dirname, 'assets', 'calendar');
const CALENDAR_FONT_DATA_URI = loadAssetDataUri(path.join(CALENDAR_ASSET_DIR, 'NotoSansKR-Bold.ttf'), 'font/truetype');
const CALENDAR_FONT_BUFFER = loadAssetBuffer(path.join(CALENDAR_ASSET_DIR, 'NotoSansKR-Bold.ttf'));
const ZHUANG_FANGYI_IMAGE_BUFFER = loadAssetBuffer(path.join(CALENDAR_ASSET_DIR, 'zhuang-fangyi.png'));
const ZHUANG_FANGYI_FULL_IMAGE_BUFFER = loadAssetBuffer(path.join(CALENDAR_ASSET_DIR, 'zhuang-fangyi-full.png'));
const ZHUANG_FANGYI_FACE_IMAGE_BUFFER = loadAssetBuffer(path.join(CALENDAR_ASSET_DIR, 'zhuang-fangyi-face.png'));
const ZHUANG_FANGYI_FRONT_FACE_IMAGE_BUFFER = loadAssetBuffer(path.join(CALENDAR_ASSET_DIR, 'zhuang-fangyi-front-face.png'));
const ROSSI_FACE_IMAGE_BUFFER = loadAssetBuffer(path.join(CALENDAR_ASSET_DIR, 'rossi-face.webp'));
const ROSSI_CALENDAR_THEME = {
  background: '#F7F1F2',
  panel: '#FFF9FA',
  shellBorder: '#F0D6DA',
  hero: '#2A0E14',
  heroBorder: '#5B1B25',
  accent: '#E31B3F',
  accentSoft: '#FFE3E8',
  labelBg: '#4A1722',
  labelText: '#FFD6DE',
  heroMuted: '#F2C4CD',
  text: '#241014',
  muted: '#7A5360',
  rowAccent: ['#E31B3F', '#B91C1C', '#F43F5E', '#7F1D1D'],
  shadow: 'rgba(127, 29, 29, 0.18)',
  portraitBg: '#FFF5F7',
  portraitShadow: 'rgba(127, 29, 29, 0.32)',
};
const ZHUANG_FANGYI_CALENDAR_THEME = {
  background: '#EEF8F7',
  panel: '#FAFFFE',
  shellBorder: '#BFE8E5',
  hero: '#092E31',
  heroBorder: '#0F6B6B',
  accent: '#00AFAA',
  accentSoft: '#DDF8F4',
  labelBg: '#0B4D4F',
  labelText: '#BFFAF2',
  heroMuted: '#B9EFEC',
  text: '#0B2528',
  muted: '#497275',
  rowAccent: ['#00AFAA', '#55B938', '#0E7490', '#1D4E45'],
  shadow: 'rgba(8, 83, 83, 0.18)',
  portraitBg: '#F1FFFC',
  portraitShadow: 'rgba(0, 132, 132, 0.28)',
};

function loadAssetDataUri(filePath, mimeType) {
  try {
    return `data:${mimeType};base64,${fs.readFileSync(filePath).toString('base64')}`;
  } catch (error) {
    console.error('[assets] failed to load:', filePath, error.message);
    return '';
  }
}

function loadAssetBuffer(filePath) {
  try {
    return fs.readFileSync(filePath);
  } catch (error) {
    console.error('[assets] failed to load:', filePath, error.message);
    return null;
  }
}

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

function kakaoImageResponse({ imageUrl, altText, text, quickReplies = [] }) {
  const safeText = normalizeText(text).slice(0, KAKAO_MAX_RESPONSE_LENGTH);
  const outputs = [{ simpleImage: { imageUrl, altText: normalizeText(altText || '일정 카드') } }];
  if (safeText) outputs.push({ simpleText: { text: safeText } });
  const template = { outputs };
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

function getTokenStoreSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.supabase_url;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.supabase_service_role_key;
  if (!supabaseUrl || !supabaseKey) return null;
  if (!tokenStoreSupabase) {
    tokenStoreSupabase = {
      url: String(supabaseUrl).replace(/\/+$/, ''),
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    };
  }
  return tokenStoreSupabase;
}

async function ensureTokenStoreBucket(supabase) {
  if (tokenStoreBucketReady) return true;
  try {
    await axios.post(
      `${supabase.url}/storage/v1/bucket`,
      {
        id: GOOGLE_TOKEN_STORE_BUCKET,
        name: GOOGLE_TOKEN_STORE_BUCKET,
        public: false,
        allowed_mime_types: ['application/json'],
      },
      { headers: supabase.headers, timeout: 2500 }
    );
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    if (status !== 400 && status !== 409 && !/already exists|Duplicate/i.test(String(message || ''))) {
      console.error('[google-calendar] token bucket create failed:', message);
    }
  }
  tokenStoreBucketReady = true;
  return true;
}

async function loadGoogleTokensAsync() {
  const supabase = getTokenStoreSupabase();
  if (!supabase) {
    lastGoogleTokenStoreStatus = { mode: 'file', ok: true, message: 'supabase_not_configured', at: new Date().toISOString() };
    return loadGoogleTokens();
  }

  try {
    const { data } = await axios.get(
      `${supabase.url}/storage/v1/object/${encodeURIComponent(GOOGLE_TOKEN_STORE_BUCKET)}/${encodeURIComponent(GOOGLE_TOKEN_STORE_OBJECT)}`,
      { headers: supabase.headers, timeout: 2500, responseType: 'json' }
    );
    lastGoogleTokenStoreStatus = { mode: 'supabase', ok: true, message: 'downloaded', at: new Date().toISOString() };
    return data || {};
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    if (status !== 404) {
      console.error('[google-calendar] token storage load failed:', message);
    }
    lastGoogleTokenStoreStatus = { mode: 'supabase', ok: false, message: message || 'download_failed', at: new Date().toISOString() };
    return loadGoogleTokens();
  }
}

async function saveGoogleTokensAsync(tokens) {
  const supabase = getTokenStoreSupabase();
  if (!supabase) {
    saveGoogleTokens(tokens);
    lastGoogleTokenStoreStatus = { mode: 'file', ok: true, message: 'supabase_not_configured', at: new Date().toISOString() };
    return false;
  }

  try {
    await ensureTokenStoreBucket(supabase);
    await axios.post(
      `${supabase.url}/storage/v1/object/${encodeURIComponent(GOOGLE_TOKEN_STORE_BUCKET)}/${encodeURIComponent(GOOGLE_TOKEN_STORE_OBJECT)}`,
      JSON.stringify(tokens, null, 2),
      {
        headers: {
          ...supabase.headers,
          'content-type': 'application/json',
          'x-upsert': 'true',
        },
        timeout: 2500,
      }
    );
    lastGoogleTokenStoreStatus = { mode: 'supabase', ok: true, message: 'uploaded', at: new Date().toISOString() };
    return true;
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.error || error.message;
    console.error('[google-calendar] token storage save failed:', message);
    saveGoogleTokens(tokens);
    lastGoogleTokenStoreStatus = { mode: 'file', ok: false, message: message || 'upload_failed', at: new Date().toISOString() };
    return false;
  }
}

function normalizeOAuthScopes(scopeText) {
  return new Set(String(scopeText || '').split(/\s+/).filter(Boolean));
}

function hasGoogleTasksScope(token) {
  return normalizeOAuthScopes(token?.scope).has(GOOGLE_TASKS_SCOPE);
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

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function truncateForCard(value, max = 34) {
  const text = normalizeText(value);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function cleanupCalendarCardCache() {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (const [id, card] of calendarCardCache.entries()) {
    if (!card?.createdAt || card.createdAt < cutoff) calendarCardCache.delete(id);
  }
}

function createCalendarCard(card) {
  cleanupCalendarCardCache();
  const id = crypto.randomUUID();
  calendarCardCache.set(id, { ...card, createdAt: Date.now() });
  return id;
}

function formatGoogleCalendarCardEvent(event, options = {}) {
  const { includeDate = false } = options;
  const datePrefix = includeDate ? formatCalendarDateShort(getGoogleCalendarEventDate(event)) : '';
  if (event.kind === 'tasks#task') {
    const taskStatus = event.status === 'completed' ? '완료' : '할 일';
    return { time: datePrefix ? `${datePrefix} ${taskStatus}` : taskStatus, title: normalizeText(event.title || '제목 없음') };
  }
  const startValue = event.start?.dateTime || event.start?.date;
  const endValue = event.end?.dateTime || event.end?.date;
  const isAllDay = Boolean(event.start?.date);
  let timeText = '시간미정';
  if (isAllDay) {
    timeText = '종일';
  } else if (startValue) {
    const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    timeText = timeFormatter.format(new Date(startValue));
    if (endValue) timeText += `-${timeFormatter.format(new Date(endValue))}`;
  }
  if (datePrefix) timeText = `${datePrefix} ${timeText}`;
  return { time: timeText, title: normalizeText(event.summary || '제목 없음') };
}

function getGoogleCalendarEventDate(event) {
  if (event.kind === 'tasks#task') return getGoogleTaskDate(event);
  const startValue = event.start?.dateTime || event.start?.date;
  if (!startValue) return '';
  if (event.start?.date) return event.start.date;
  return formatKoreaDateOnlyFromValue(startValue);
}

function getGoogleTaskDate(task) {
  if (!task?.due) return '';
  return String(task.due).slice(0, 10);
}

function formatCalendarDateShort(dateText) {
  if (!dateText) return '날짜미정';
  const date = new Date(`${dateText}T00:00:00+09:00`);
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
}

function groupGoogleCalendarEventsByDate(events) {
  const grouped = new Map();
  for (const event of events || []) {
    const date = getGoogleCalendarEventDate(event) || 'unknown';
    if (!grouped.has(date)) grouped.set(date, []);
    grouped.get(date).push(event);
  }
  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEvents]) => ({ date, events: dayEvents }));
}

function formatGoogleCalendarCardSummary(group) {
  const first = formatGoogleCalendarCardEvent(group.events[0]);
  const extraCount = Math.max(group.events.length - 1, 0);
  return {
    date: group.date,
    time: formatCalendarDateShort(group.date),
    title: extraCount > 0
      ? `${first.title} 외 ${extraCount}개 일정`
      : first.title,
    count: group.events.length,
  };
}

function isCalendarDetailRequest(message, range) {
  const text = normalizeKoreanSearchText(message);
  const isSingleDay = Number(range?.days || 0) === 1;
  if (!isSingleDay) return false;
  return /(상세|자세히|전체|모든|전부)/.test(text);
}

function formatCalendarCardTitle(rangeLabel) {
  const label = normalizeText(rangeLabel || '오늘');
  if (label === '오늘') return '오늘의 일정';
  if (label === '내일') return '내일의 일정';
  if (label === '모레') return '모레의 일정';
  if (label === '이번 주') return '이번 주 일정';
  return `${label} 일정`;
}

function getCalendarCardTheme(card) {
  return card.mode === 'detail' ? ROSSI_CALENDAR_THEME : ZHUANG_FANGYI_CALENDAR_THEME;
}

function renderCalendarCardSvg(card) {
  const events = card.events || [];
  const rowHeight = 82;
  const baseHeight = 500;
  const height = Math.max(820, baseHeight + Math.max(events.length, 1) * rowHeight);
  const characterArt = `<rect x="0" y="0" width="190" height="190" rx="28" fill="#1f2a40"/>
       <text x="95" y="104" text-anchor="middle" fill="#f7fbff" font-size="26" font-weight="900">비서님</text>`;
  const rows = events.length
    ? events.map((event, index) => {
      const y = 470 + index * rowHeight;
      const accent = ['#2ee6a6', '#66d9ff', '#ffd166', '#ff7aa2'][index % 4];
      return `
        <g>
          <rect x="70" y="${y}" width="660" height="62" rx="14" fill="#172033" stroke="#2b3856"/>
          <rect x="70" y="${y}" width="8" height="62" rx="4" fill="${accent}"/>
          <text x="100" y="${y + 39}" fill="#9fb2d9" font-size="22" font-weight="700">${escapeXml(event.time)}</text>
          <text x="318" y="${y + 39}" fill="#f7fbff" font-size="27" font-weight="800">${escapeXml(truncateForCard(event.title, 20))}</text>
        </g>`;
    }).join('')
    : `
        <rect x="70" y="470" width="660" height="92" rx="18" fill="#172033" stroke="#2b3856"/>
        <text x="400" y="526" text-anchor="middle" fill="#f7fbff" font-size="30" font-weight="800">오늘은 비어 있어요</text>
        <text x="400" y="562" text-anchor="middle" fill="#9fb2d9" font-size="20">작전 대기, 휴식 허가.</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}">
  <defs>
    <style>
      @font-face {
        font-family: 'CalendarNotoKR';
        src: url('${CALENDAR_FONT_DATA_URI}') format('truetype');
        font-weight: 400 900;
      }
      text { font-family: 'CalendarNotoKR', 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif; }
    </style>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="#0b101c"/>
      <stop offset="0.58" stop-color="#111a2b"/>
      <stop offset="1" stop-color="#18263a"/>
    </linearGradient>
    <linearGradient id="panel" x1="0" x2="1">
      <stop offset="0" stop-color="#202a40"/>
      <stop offset="1" stop-color="#121a2a"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="20" flood-color="#000" flood-opacity="0.35"/>
    </filter>
    <clipPath id="operatorClip">
      <rect x="0" y="0" width="190" height="190" rx="28"/>
    </clipPath>
  </defs>
  <rect width="800" height="${height}" fill="url(#bg)"/>
  <path d="M0 155 H800" stroke="#26344f" stroke-width="2"/>
  <path d="M0 ${height - 90} H800" stroke="#26344f" stroke-width="2"/>

  <g filter="url(#shadow)">
    <rect x="46" y="46" width="708" height="${height - 92}" rx="28" fill="url(#panel)" stroke="#344667"/>
  </g>

  <text x="76" y="104" fill="#2ee6a6" font-size="24" font-weight="900" letter-spacing="3">일정관리</text>
  <text x="76" y="158" fill="#f7fbff" font-size="48" font-weight="900">${escapeXml(card.label || '일정')}</text>
  <text x="78" y="198" fill="#9fb2d9" font-size="22" font-weight="700">비서님이 캘린더를 정리했어요</text>

  <g transform="translate(520 78)">
    ${characterArt}
    <rect x="0" y="0" width="190" height="190" rx="28" fill="none" stroke="#5b6d91" stroke-width="4"/>
    <rect x="132" y="12" width="44" height="44" rx="12" fill="#f5c400"/>
    <path d="M154 20 L140 38 H153 L147 51 L168 30 H155 Z" fill="#111827"/>
    <rect x="8" y="202" width="174" height="46" rx="14" fill="#111827" stroke="#2b3856"/>
    <text x="95" y="233" text-anchor="middle" fill="#f7fbff" font-size="22" font-weight="900">비서님</text>
  </g>

  <rect x="70" y="260" width="410" height="124" rx="20" fill="#111827" stroke="#2b3856"/>
  <text x="102" y="313" fill="#f7fbff" font-size="34" font-weight="900">${events.length ? `${events.length}개 일정` : '일정 없음'}</text>
  <text x="104" y="350" fill="#9fb2d9" font-size="21">${escapeXml(getKoreanDateTime())}</text>

  ${rows}
</svg>`;
}

function h(type, props, ...children) {
  const nextProps = { ...(props || {}) };
  if (type === 'div') nextProps.style = { display: 'flex', ...(nextProps.style || {}) };
  return { type, props: { ...nextProps, children: children.flat().filter((child) => child !== null && child !== undefined && child !== false) } };
}

async function renderCalendarCardVectorSvg(card) {
  const { default: satori } = await import('satori');
  const events = card.events || [];
  const rowHeight = 92;
  const baseHeight = 424;
  const height = Math.max(760, baseHeight + Math.max(events.length, 1) * rowHeight);
  const timestamp = new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'full' }).format(new Date());
  const mode = card.mode || 'detail';
  const theme = getCalendarCardTheme(card);
  const rows = events.length
    ? events.map((event, index) => {
      const y = 398 + index * rowHeight;
      const accent = theme.rowAccent[index % theme.rowAccent.length];
      const timeWidth = mode === 'summary' ? 220 : 172;
      const titleWidth = mode === 'summary' ? 340 : 360;
      const titleMax = mode === 'summary' ? 22 : 18;
      return h('div', { style: { position: 'absolute', left: 56, top: y, width: 688, height: 76, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #E9EDF3', display: 'flex', alignItems: 'center', boxShadow: '0 18px 36px rgba(26, 32, 44, 0.08)' } },
        h('div', { style: { marginLeft: 18, width: 12, height: 46, borderRadius: 8, backgroundColor: accent } }),
        h('div', { style: { marginLeft: 22, width: timeWidth, color: '#687386', fontSize: mode === 'summary' ? 20 : 23, fontWeight: 900 } }, event.time),
        h('div', { style: { width: titleWidth, color: '#161A22', fontSize: mode === 'summary' ? 26 : 30, fontWeight: 900, lineHeight: 1.08 } }, truncateForCard(event.title, titleMax)),
        h('div', { style: { marginLeft: 'auto', marginRight: 22, width: 42, height: 42, borderRadius: 21, backgroundColor: theme.accentSoft, color: accent, fontSize: 22, fontWeight: 900, alignItems: 'center', justifyContent: 'center' } }, `${index + 1}`),
      );
    })
    : [
      h('div', { style: { position: 'absolute', left: 56, top: 398, width: 688, height: 124, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #E9EDF3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 18px 36px rgba(26, 32, 44, 0.08)' } },
        h('div', { style: { color: '#161A22', fontSize: 33, fontWeight: 900 } }, '비어 있는 날이에요'),
        h('div', { style: { color: '#687386', fontSize: 20, marginTop: 8 } }, '새 일정이 생기면 여기에 정리할게요.'),
      ),
    ];

  return satori(
    h('div', {
      style: {
        width: 800,
        height,
        position: 'relative',
        backgroundColor: theme.background,
        color: theme.text,
        fontFamily: 'Noto Sans KR',
        display: 'flex',
      },
    },
      h('div', { style: { position: 'absolute', inset: 0, backgroundColor: theme.background } }),
      h('div', { style: { position: 'absolute', left: 0, top: 0, width: 800, height: 248, backgroundColor: theme.hero } }),
      h('div', { style: { position: 'absolute', left: 42, top: 42, width: 716, height: height - 84, borderRadius: 36, backgroundColor: theme.panel, border: `1px solid ${theme.shellBorder}`, display: 'flex', boxShadow: `0 28px 70px ${theme.shadow}` } }),
      h('div', { style: { position: 'absolute', left: 64, top: 64, width: 672, height: 212, borderRadius: 30, backgroundColor: theme.hero, border: `1px solid ${theme.heroBorder}`, display: 'flex', overflow: 'hidden' } }),
      h('div', { style: { position: 'absolute', left: 64, top: 64, width: 18, height: 212, backgroundColor: theme.accent } }),
      h('div', { style: { position: 'absolute', left: 104, top: 94, width: 174, height: 40, borderRadius: 20, backgroundColor: theme.labelBg, color: theme.labelText, fontSize: 19, fontWeight: 900, alignItems: 'center', justifyContent: 'center' } }, 'GOOGLE CALENDAR'),
      h('div', { style: { position: 'absolute', left: 104, top: 148, width: 438, color: '#FFFFFF', fontSize: 45, fontWeight: 900, lineHeight: 1.08 } }, card.label || '오늘의 일정'),
      h('div', { style: { position: 'absolute', left: 104, top: 232, width: 400, color: theme.heroMuted, fontSize: 21, fontWeight: 700 } }, timestamp),
      h('div', { style: { position: 'absolute', left: 578, top: 82, width: 136, height: 136, borderRadius: 38, backgroundColor: theme.portraitBg, border: `5px solid ${theme.labelBg}`, display: 'flex', boxShadow: `0 18px 42px ${theme.portraitShadow}` } }),
      h('div', { style: { position: 'absolute', left: 616, top: 232, width: 62, height: 8, borderRadius: 4, backgroundColor: theme.accent } }),

      h('div', { style: { position: 'absolute', left: 56, top: 304, width: 688, height: 62, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #E9EDF3', display: 'flex', alignItems: 'center', boxShadow: '0 14px 32px rgba(26, 32, 44, 0.07)' } },
        h('div', { style: { marginLeft: 24, width: 13, height: 13, borderRadius: 7, backgroundColor: theme.accent } }),
        h('div', { style: { marginLeft: 12, color: theme.text, fontSize: 25, fontWeight: 900 } }, card.summaryText || (events.length ? `${events.length}개 일정` : '일정 없음')),
        h('div', { style: { marginLeft: 'auto', marginRight: 24, color: theme.muted, fontSize: 20, fontWeight: 800 } }, mode === 'summary' ? 'Daily brief' : 'Calendar detail'),
      ),
      rows,
    ),
    {
      width: 800,
      height,
      fonts: [
        { name: 'Noto Sans KR', data: CALENDAR_FONT_BUFFER, weight: 700, style: 'normal' },
        { name: 'Noto Sans KR', data: CALENDAR_FONT_BUFFER, weight: 900, style: 'normal' },
      ],
    },
  );
}

async function renderCalendarCardPng(card) {
  const composites = [];
  const isRossiPortrait = card.mode === 'detail' && ROSSI_FACE_IMAGE_BUFFER;
  const portraitBuffer = card.mode === 'detail'
    ? (ROSSI_FACE_IMAGE_BUFFER || ZHUANG_FANGYI_FACE_IMAGE_BUFFER || ZHUANG_FANGYI_IMAGE_BUFFER || ZHUANG_FANGYI_FULL_IMAGE_BUFFER)
    : (ZHUANG_FANGYI_FRONT_FACE_IMAGE_BUFFER || ZHUANG_FANGYI_FACE_IMAGE_BUFFER || ZHUANG_FANGYI_IMAGE_BUFFER || ZHUANG_FANGYI_FULL_IMAGE_BUFFER);
  if (portraitBuffer) {
    const portraitSize = 136;
    const portraitMask = Buffer.from(`<svg width="${portraitSize}" height="${portraitSize}" viewBox="0 0 ${portraitSize} ${portraitSize}"><rect width="${portraitSize}" height="${portraitSize}" rx="30" fill="#fff"/></svg>`);
    const character = await sharp(portraitBuffer)
      .resize(portraitSize, portraitSize, { fit: 'cover', position: isRossiPortrait ? 'north' : 'center' })
      .composite([{ input: portraitMask, blend: 'dest-in' }])
      .png()
      .toBuffer();
    composites.push({ input: character, left: 578, top: 82 });
  }
  const baseSvg = CALENDAR_FONT_BUFFER
    ? await renderCalendarCardVectorSvg(card)
    : renderCalendarCardSvg(card);
  return sharp(Buffer.from(baseSvg)).composite(composites).png().toBuffer();
}

function getGoogleRedirectUri(req) {
  return GOOGLE_OAUTH_REDIRECT_URI || `${getPublicBaseUrl(req)}/auth/google/callback`;
}

function getGoogleCloudProjectNumberFromOAuthClientId() {
  const match = String(GOOGLE_OAUTH_CLIENT_ID || '').match(/^(\d+)-/);
  return match ? match[1] : '';
}

function getGoogleTasksApiEnableUrl() {
  const projectNumber = getGoogleCloudProjectNumberFromOAuthClientId();
  const params = projectNumber ? `?project=${encodeURIComponent(projectNumber)}` : '';
  return `https://console.cloud.google.com/apis/library/tasks.googleapis.com${params}`;
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
    include_granted_scopes: 'true',
    prompt: 'consent',
    state: encodeOAuthState(userId),
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function buildGoogleConnectUrl(userId, req) {
  return `${getPublicBaseUrl(req)}/auth/google?userId=${encodeURIComponent(userId)}`;
}

function isBlockedOAuthUserAgent(req) {
  return /KAKAOTALK|KAKAOSTORY|FBAN|FBAV|Instagram|Line\//i.test(req.get('user-agent') || '');
}

function renderExternalBrowserInstructions(connectUrl) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Google Calendar 연결</title>
  <style>
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 28px; line-height: 1.55; color: #111; background: #fff; }
    main { max-width: 560px; margin: 0 auto; }
    h1 { font-size: 24px; margin: 0 0 16px; }
    p { margin: 12px 0; }
    .url { word-break: break-all; padding: 12px; border: 1px solid #ddd; border-radius: 8px; background: #f7f7f7; }
    .hint { color: #555; font-size: 14px; }
  </style>
</head>
<body>
  <main>
    <h1>외부 브라우저에서 열어 주세요</h1>
    <p>Google 로그인을 카카오톡 인앱 브라우저에서 열면 Google 정책 때문에 <strong>403 disallowed_useragent</strong>가 발생합니다.</p>
    <p>이 페이지 주소를 복사해서 Safari 또는 Chrome 주소창에 붙여넣으면 캘린더 연결을 계속할 수 있습니다.</p>
    <p class="url">${connectUrl.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</p>
    <p class="hint">iPhone: 공유 버튼 또는 더보기 메뉴에서 Safari로 열기<br>Android: 더보기 메뉴에서 Chrome으로 열기</p>
  </main>
</body>
</html>`;
}

function isCalendarUserAllowed(userId) {
  return KAKAO_CALENDAR_ALLOWED_USER_IDS.includes(String(userId || ''));
}

function answerCalendarUserNotAllowed(userId) {
  const reason = KAKAO_CALENDAR_ALLOWED_USER_IDS.length
    ? '이 카카오 사용자는 캘린더 허용목록에 없어.'
    : '캘린더 허용목록이 아직 비어 있어.';
  return {
    answer: `${reason}\n개인 캘린더 보호를 위해 구글 연결/일정 조회/등록/수정은 허용된 카카오 사용자만 가능해.\n관리자는 Railway 변수 KAKAO_CALENDAR_ALLOWED_USER_IDS에 이 사용자 ID를 추가해야 해: ${userId}`,
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

function isCasualMealChoiceRequest(message) {
  const text = normalizeKoreanSearchText(message);
  const explicitLookupCue = /(근처|주변|가까운|맛집|식당|매장|가게|주소|위치|지도|예약|찾아|검색|네이버|구글|웹에서|인터넷에서)/.test(text);
  const asksMealChoice = /(뭐\s*먹지|뭐\s*먹을까|뭐\s*먹어|메뉴\s*추천|먹을\s*(거|것)\s*추천|식사\s*추천)/.test(text);
  return asksMealChoice && MEAL_WORD_PATTERN.test(text) && !explicitLookupCue;
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

function demoteOverbroadLocalPlan(plan, message) {
  if (plan.intent !== 'local_search') return plan;
  const combined = normalizeKoreanSearchText(`${message} ${plan.searchQuery || ''}`);
  const hasLocation = LOCAL_LOCATION_PATTERN.test(combined);
  const hasExplicitSearchCue = /(근처|주변|가까운|동네|어디|찾아|검색|예약|지도|주소|위치)/.test(normalizeKoreanSearchText(message));
  if (hasLocation || hasExplicitSearchCue) return plan;
  return {
    ...plan,
    intent: 'chat',
    searchQuery: '',
    source: `${plan.source || 'planner'}_demoted_no_location`,
    confidence: Math.min(plan.confidence || 0.75, 0.7),
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
    '위치 없이 "뭐먹지", "저녁 추천", "야식 뭐 먹을까"처럼 메뉴 판단을 묻는 일상 질문은 local_search가 아니라 chat이야.',
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
    return demoteOverbroadLocalPlan(normalizePlan(extractJsonObject(response.data?.content?.[0]?.text || ''), fallback), message);
  } catch (error) {
    console.error('[planner] fallback:', { message: error.message, code: error.code, status: error.response?.status });
    return demoteOverbroadLocalPlan(fallback, message);
  }
}

function isNaverConfigQuestion(message) {
  const text = normalizeKoreanSearchText(message);
  return /(네이버|naver).*(api|API|키|key|검색\s*에이피아이|검색\s*api|설정|넣|등록|확인)|((api|API|키|key).*(네이버|naver))/.test(text);
}

function isGoogleCalendarConfigQuestion(message) {
  const text = normalizeKoreanSearchText(message);
  return /(구글|google).*(캘린더|calendar).*(api|API|키|key|cloud|클라우드|연동|설정|넣|등록|확인|왜\s*안|안\s*돼|안돼)|((캘린더|calendar).*(구글|google).*(api|API|키|key|cloud|클라우드|연동|설정|왜\s*안|안\s*돼|안돼))/.test(text);
}

function isCalendarWriteRequest(message) {
  const text = normalizeKoreanSearchText(message);
  const hasCalendarCue = /(캘린더|calendar|일정|예약|스케줄)/.test(text);
  const hasWriteCue = /(등록|추가|생성|만들|잡아|예약해|넣어|수정|변경|삭제|지워)/.test(text);
  return hasCalendarCue && hasWriteCue;
}

function isCalendarUpdateRequest(message) {
  const text = normalizeKoreanSearchText(message);
  const hasCalendarCue = /(캘린더|calendar|일정|예약|스케줄)/.test(text);
  const hasUpdateCue = /(수정|변경|바꿔|옮겨|미뤄|당겨)/.test(text);
  const hasDateCue = /(오늘|내일|낼|모레|\d{1,2}\s*월\s*\d{1,2}\s*일|\d{4}-\d{1,2}-\d{1,2})/.test(text);
  const hasTimeCue = /(오전|오후|저녁|밤|아침)?\s*\d{1,2}\s*시/.test(text);
  return hasUpdateCue && (hasCalendarCue || (hasDateCue && hasTimeCue));
}

function isCalendarReadRequest(message) {
  const text = normalizeKoreanSearchText(message);
  const hasCalendarCue = /(구글\s*)?(캘린더|calendar|일정|스케줄|예약)/.test(text);
  const hasDateCue = /(오늘|내일|낼|모레|이번\s*주|이번주|주간|일주일|이번\s*달|이번달|다음\s*달|다음달|내달|이전\s*달|이전달|지난\s*달|지난달|저번\s*달|저번달|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일|\d{1,2}\s*일)/.test(text);
  const hasReadCue = /(알려|말해|보여|조회|확인|읽어|뭐\s*있|뭐가\s*있|있어|있나|있니|리스트|목록)/.test(text);
  const calendarDateRead = hasCalendarCue && (hasReadCue || hasDateCue);
  const dateScheduleRead = hasDateCue && hasReadCue && /(일정|스케줄|예약)/.test(text);
  return (calendarDateRead || dateScheduleRead) && !isCalendarWriteRequest(text) && !isGoogleCalendarConfigQuestion(text);
}

function isReminderWriteRequest(message) {
  const text = normalizeKoreanSearchText(message);
  const hasReminderCue = /(알림|알려줘|알려줄|리마인드|리마인더|상기|깨워줘|예약)/.test(text);
  const hasTimeCue = /(오늘|내일|모레|\d{1,2}\s*월\s*\d{1,2}\s*일|\d{4}-\d{1,2}-\d{1,2}).*(오전|오후|저녁|밤|아침)?\s*\d{1,2}\s*시|(?:오전|오후|저녁|밤|아침)?\s*\d{1,2}\s*시/.test(text);
  return hasReminderCue && hasTimeCue;
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
    ? '각자 본인 구글 캘린더를 조회/수정하는 OAuth 설정은 준비돼 있어. 사용자는 한 번 구글 동의만 하면 돼.'
    : '각자 본인 구글 캘린더를 조회/수정하려면 서비스 계정이 아니라 Google OAuth 클라이언트 ID/Secret이 필요해.';
  return {
    answer: `${status}\n${serviceAccountStatus}\n${oauthStatus}\n키 값 자체는 보안상 답변에 노출하지 않을게.`,
    quickReplies: [],
    plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'deterministic_google_config' },
    results: [],
  };
}

async function getStoredGoogleToken(userId) {
  return (await loadGoogleTokensAsync())[userId];
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
    scope: response.data.scope || token.scope,
    refresh_token: response.data.refresh_token || token.refresh_token,
    expires_at: Date.now() + Number(response.data.expires_in || 3600) * 1000,
  };
  const tokens = await loadGoogleTokensAsync();
  tokens[userId] = refreshed;
  await saveGoogleTokensAsync(tokens);
  return refreshed;
}

function formatKoreaDateTime(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00+09:00`;
}

function formatKoreaDateOnly(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatKoreaDateOnlyFromValue(value) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const getPart = (type) => parts.find((part) => part.type === type)?.value || '';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

function getKoreaNowDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

function getKoreaDayStart(offsetDays = 0) {
  const date = getKoreaNowDate();
  date.setDate(date.getDate() + offsetDays);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date, months) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function parseKoreaDateStart(dateText) {
  if (!dateText) return null;
  return new Date(`${dateText}T00:00:00+09:00`);
}

function getCalendarItemRange(item) {
  if (item?.kind === 'tasks#task') {
    const taskDateText = getGoogleTaskDate(item);
    const taskDate = parseKoreaDateStart(taskDateText);
    return taskDate ? { start: taskDate, end: addDays(taskDate, 1), pointInDay: true, startDate: taskDateText, endDate: formatKoreaDateOnlyFromValue(addDays(taskDate, 1)) } : null;
  }

  if (item?.start?.date) {
    const start = parseKoreaDateStart(item.start.date);
    const end = parseKoreaDateStart(item.end?.date) || (start ? addDays(start, 1) : null);
    return start && end ? { start, end, startDate: item.start.date, endDate: item.end?.date || formatKoreaDateOnly(addDays(start, 1)) } : null;
  }

  const startValue = item?.start?.dateTime || item?.start?.date;
  const endValue = item?.end?.dateTime || item?.end?.date;
  const start = startValue ? new Date(startValue) : null;
  const end = endValue ? new Date(endValue) : (start ? new Date(start.getTime() + 60 * 60 * 1000) : null);
  return start && end ? { start, end } : null;
}

function isCalendarItemInRange(item, range) {
  const rangeStart = new Date(range.timeMin);
  const rangeEnd = new Date(range.timeMax);
  const itemRange = getCalendarItemRange(item);
  if (!itemRange || Number.isNaN(itemRange.start.getTime()) || Number.isNaN(itemRange.end.getTime())) return true;
  const rangeStartDate = range.startDate || range.timeMin?.slice(0, 10) || formatKoreaDateOnly(rangeStart);
  const rangeEndDate = range.endDate || range.timeMax?.slice(0, 10) || formatKoreaDateOnly(rangeEnd);
  if (itemRange.pointInDay && itemRange.startDate) return itemRange.startDate >= rangeStartDate && itemRange.startDate < rangeEndDate;
  if (item?.start?.date && itemRange.startDate && itemRange.endDate) return itemRange.startDate < rangeEndDate && itemRange.endDate > rangeStartDate;
  return itemRange.start < rangeEnd && itemRange.end > rangeStart;
}

function getKoreaMonthStart(offsetMonths = 0) {
  const date = getKoreaDayStart(0);
  date.setDate(1);
  date.setMonth(date.getMonth() + offsetMonths);
  return date;
}

function formatKoreaDateLabel(date) {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
  return formatter.format(date);
}

function parseCalendarQueryRange(message) {
  const text = normalizeKoreanSearchText(message);
  let start = getKoreaDayStart(0);
  let days = 1;
  let label = '오늘';

  const isoDate = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  const monthDay = text.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  const monthOnly = text.match(/(\d{1,2})\s*월(?!\s*\d{1,2}\s*일)/);
  const dayOnly = text.match(/(?<!월\s*)(\d{1,2})\s*일/);
  const monthOffset = /다음\s*달|다음달|내달/.test(text)
    ? 1
    : /이전\s*달|이전달|지난\s*달|지난달|저번\s*달|저번달/.test(text)
      ? -1
      : 0;
  if (/이번\s*주|이번주|주간|일주일/.test(text)) {
    days = 7;
    label = '이번 주';
  } else if (/모레/.test(text)) {
    start = getKoreaDayStart(2);
    label = '모레';
  } else if (/내일|낼/.test(text)) {
    start = getKoreaDayStart(1);
    label = '내일';
  } else if (isoDate) {
    start.setFullYear(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3]));
    label = formatKoreaDateLabel(start);
  } else if (monthDay) {
    start.setMonth(Number(monthDay[1]) - 1, Number(monthDay[2]));
    label = formatKoreaDateLabel(start);
  } else if (dayOnly) {
    start = getKoreaMonthStart(monthOffset);
    start.setDate(Number(dayOnly[1]));
    label = formatKoreaDateLabel(start);
  } else if (monthOnly) {
    start = getKoreaMonthStart(0);
    start.setMonth(Number(monthOnly[1]) - 1);
    days = null;
    label = `${Number(monthOnly[1])}월`;
  } else if (/다음\s*달|다음달|내달|이번\s*달|이번달|이전\s*달|이전달|지난\s*달|지난달|저번\s*달|저번달/.test(text)) {
    start = getKoreaMonthStart(monthOffset);
    days = null;
    label = monthOffset === 1 ? '다음 달' : monthOffset === -1 ? '지난 달' : '이번 달';
  }

  const end = days === null ? addMonths(start, 1) : addDays(start, days);
  return {
    label,
    days: days === null ? Math.ceil((end - start) / (24 * 60 * 60 * 1000)) : days,
    startDate: formatKoreaDateOnly(start),
    endDate: formatKoreaDateOnly(end),
    timeMin: formatKoreaDateTime(start),
    timeMax: formatKoreaDateTime(end),
  };
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

  const time = text.match(/(오전|오후|저녁|밤|아침)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분(?!\s*(?:전|전에|전쯤)))?/);
  if (!time) return { error: '시간을 못 찾았어. 예: 내일 오후 3시에 병원 일정 추가해줘' };

  let hour = Number(time[2]);
  const minute = Number(time[3] || 0);
  if (/(오후|저녁|밤)/.test(time[1] || '') && hour < 12) hour += 12;
  if (/오전/.test(time[1] || '') && hour === 12) hour = 0;
  start.setHours(hour, minute, 0, 0);

  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  const reminderMinutes = Number(text.match(/(\d{1,3})\s*분\s*(?:전|전에|전쯤)/)?.[1] || 0);
  let title = normalizeText(text
    .replace(/\d{1,3}\s*분\s*(?:전|전에|전쯤)/g, ' ')
    .replace(/(\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\s*월\s*\d{1,2}\s*일|오늘|내일|모레|오전|오후|저녁|밤|아침|\d{1,2}\s*시(?:\s*\d{1,2}\s*분)?)/g, ' ')
    .replace(/(구글|google|캘린더|calendar|일정|예약|스케줄|등록|추가|생성|만들어줘|만들|잡아줘|잡아|넣어줘|넣어|해줘|좀|에|으로|로|나한테|내게|저한테|알림|알려줘|알려줄|수\s*있어|줘)/g, ' ')
    .replace(/[?？！!,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());
  title = title.replace(/(.+)으라고$/, '$1기').replace(/(.+)라고$/, '$1').trim() || '일정';

  return {
    summary: title,
    start: formatKoreaDateTime(start),
    end: formatKoreaDateTime(end),
    reminderMinutes: reminderMinutes > 0 ? reminderMinutes : null,
  };
}

function parseKoreanTimeExpression(match, fallbackMeridiem = '') {
  if (!match) return null;
  const meridiem = match[1] || fallbackMeridiem || '';
  const rawHour = Number(match[2]);
  let hour = rawHour;
  const minute = Number(match[3] || 0);
  if (/(오후|저녁|밤)/.test(meridiem) && hour < 12) hour += 12;
  if (/오전/.test(meridiem) && hour === 12) hour = 0;
  return { hour, minute, meridiem, rawHour };
}

function applyKoreanTime(date, time) {
  const next = new Date(date);
  next.setHours(time.hour, time.minute, 0, 0);
  return next;
}

function parseCalendarUpdate(message) {
  const text = normalizeKoreanSearchText(message);
  const range = parseCalendarQueryRange(text);
  const startOfDay = new Date(`${range.timeMin.slice(0, 10)}T00:00:00`);

  const timePattern = /(오전|오후|저녁|밤|아침)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/g;
  const timeMatches = [...text.matchAll(timePattern)];
  if (!timeMatches.length) {
    return { error: '바꿀 시간을 못 찾았어. 예: 내일 교육 오후 1시부터 6시로 수정해줘' };
  }

  const startTime = parseKoreanTimeExpression(timeMatches[0]);
  const explicitEndTime = timeMatches.length >= 2 ? parseKoreanTimeExpression(timeMatches[1], startTime?.meridiem) : null;
  const start = applyKoreanTime(startOfDay, startTime);
  const end = explicitEndTime ? applyKoreanTime(startOfDay, explicitEndTime) : new Date(start.getTime() + 60 * 60 * 1000);
  if (end <= start) end.setDate(end.getDate() + 1);

  let titleQuery = normalizeText(text
    .replace(/\d{4}-\d{1,2}-\d{1,2}/g, ' ')
    .replace(/\d{1,2}\s*월\s*\d{1,2}\s*일/g, ' ')
    .replace(/오늘|내일|낼|모레|이번\s*주|이번주|주간|일주일/g, ' ')
    .replace(timePattern, ' ')
    .replace(/부터|에서|까지|으로|로|에|을|를|은|는|이|가/g, ' ')
    .replace(/구글|google|캘린더|calendar|일정|예약|스케줄|수정|변경|바꿔|옮겨|미뤄|당겨|해줘|좀|줘/g, ' ')
    .replace(/[?？！!,.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim());

  return {
    range,
    titleQuery,
    start: formatKoreaDateTime(start),
    end: formatKoreaDateTime(end),
  };
}

function scoreCalendarEventMatch(event, titleQuery) {
  const summary = normalizeText(event.summary || '');
  if (!titleQuery) return 1;
  if (summary === titleQuery) return 100;
  if (summary.includes(titleQuery)) return 80;
  if (titleQuery.includes(summary)) return 70;
  const tokens = titleQuery.split(/\s+/).filter(Boolean);
  return tokens.reduce((score, token) => score + (summary.includes(token) ? 10 : 0), 0);
}

async function patchGoogleCalendarEventTime(userId, eventId, update) {
  const storedToken = await getStoredGoogleToken(userId);
  if (!storedToken) return { needsAuth: true };
  const token = await refreshGoogleAccessToken(userId, storedToken);

  const response = await axios.patch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(eventId)}`, {
    start: { dateTime: update.start, timeZone: 'Asia/Seoul' },
    end: { dateTime: update.end, timeZone: 'Asia/Seoul' },
  }, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
  });

  return { event: response.data };
}

async function updateGoogleCalendarEvent(userId, update) {
  const listed = await listGoogleCalendarEvents(userId, update.range);
  if (listed.needsAuth) return { needsAuth: true };

  const ranked = (listed.events || [])
    .map((event) => ({ event, score: scoreCalendarEventMatch(event, update.titleQuery) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked.length) return { notFound: true, events: listed.events || [] };
  const topScore = ranked[0].score;
  const tied = ranked.filter((item) => item.score === topScore);
  if (tied.length > 1 && update.titleQuery) return { ambiguous: true, events: tied.map((item) => item.event) };

  const patched = await patchGoogleCalendarEventTime(userId, ranked[0].event.id, update);
  if (patched.needsAuth) return patched;
  return { event: patched.event };
}

async function answerCalendarUpdateRequest(message, userId, req) {
  if (!isCalendarUserAllowed(userId)) {
    return answerCalendarUserNotAllowed(userId);
  }

  if (!hasGoogleOAuthConfig()) {
    return {
      answer: '각자 본인 구글 캘린더를 수정하려면 Google OAuth 클라이언트 ID/Secret이 먼저 필요해.',
      quickReplies: [],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_oauth_missing' },
      results: [],
    };
  }

  if (!(await getStoredGoogleToken(userId))) {
    const authUrl = buildGoogleConnectUrl(userId, req);
    return {
      answer: `구글 캘린더 연결이 필요해. Safari/Chrome에서 열어 연결한 뒤 다시 일정 수정을 말해줘.\n${authUrl}`,
      quickReplies: [{ label: '구글 연결', action: 'webLink', webLinkUrl: authUrl }],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_auth_required' },
      results: [],
    };
  }

  const update = parseCalendarUpdate(message);
  if (update.error) {
    return {
      answer: update.error,
      quickReplies: [],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.8, source: 'calendar_update_parse_failed' },
      results: [],
    };
  }

  const result = await updateGoogleCalendarEvent(userId, update);
  if (result.needsAuth) {
    const authUrl = buildGoogleConnectUrl(userId, req);
    return {
      answer: `구글 캘린더 연결이 필요해. Safari/Chrome에서 열어줘.\n${authUrl}`,
      quickReplies: [{ label: '구글 연결', action: 'webLink', webLinkUrl: authUrl }],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.9, source: 'calendar_auth_required' },
      results: [],
    };
  }
  if (result.notFound) {
    return {
      answer: `${formatCalendarCardTitle(update.range.label)}에서 ${update.titleQuery ? `"${update.titleQuery}" ` : ''}일정을 못 찾았어. 일정 이름을 조금 더 정확히 말해줘.`,
      quickReplies: [],
      plan: { intent: 'chat', searchQuery: update.titleQuery, sort: 'sim', confidence: 0.85, source: 'calendar_update_not_found' },
      results: result.events || [],
    };
  }
  if (result.ambiguous) {
    return {
      answer: `비슷한 일정이 여러 개라 하나를 못 고르겠어. 일정 이름이나 현재 시간을 같이 말해줘.`,
      quickReplies: [],
      plan: { intent: 'chat', searchQuery: update.titleQuery, sort: 'sim', confidence: 0.85, source: 'calendar_update_ambiguous' },
      results: result.events || [],
    };
  }

  const updatedEvent = result.event;
  const updatedLine = formatGoogleCalendarEvent(updatedEvent, 0).replace(/^1\.\s*/, '');
  return {
    answer: `수정 완료했어.\n${updatedLine}\n확인해봐!`,
    quickReplies: [],
    plan: { intent: 'chat', searchQuery: update.titleQuery, sort: 'sim', confidence: 0.95, source: 'calendar_event_updated' },
    results: [updatedEvent],
  };
}

async function listGoogleCalendarEvents(userId, range) {
  const storedToken = await getStoredGoogleToken(userId);
  if (!storedToken) return { needsAuth: true };
  const token = await refreshGoogleAccessToken(userId, storedToken);
  const params = new URLSearchParams({
    timeMin: range.timeMin,
    timeMax: range.timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '80',
    timeZone: 'Asia/Seoul',
  });
  const response = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
  });
  return { events: (response.data?.items || []).filter((event) => isCalendarItemInRange(event, range)) };
}

async function listGoogleTasks(userId, range) {
  const storedToken = await getStoredGoogleToken(userId);
  if (!storedToken) return { needsAuth: true };
  const token = await refreshGoogleAccessToken(userId, storedToken);
  const headers = { Authorization: `Bearer ${token.access_token}` };
  const taskListsResponse = await axios.get('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
    headers,
    timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
  });
  const taskLists = taskListsResponse.data?.items || [];
  const tasks = [];

  for (const taskList of taskLists) {
    const params = new URLSearchParams({
      dueMin: `${range.startDate || range.timeMin.slice(0, 10)}T00:00:00.000Z`,
      dueMax: `${range.endDate || range.timeMax.slice(0, 10)}T00:00:00.000Z`,
      showCompleted: 'true',
      showDeleted: 'false',
      showHidden: 'true',
      maxResults: '100',
    });
    const response = await axios.get(`https://tasks.googleapis.com/tasks/v1/lists/${encodeURIComponent(taskList.id)}/tasks?${params.toString()}`, {
      headers,
      timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
    });
    tasks.push(...(response.data?.items || []).filter((task) => task.due));
  }

  return { tasks: tasks.filter((task) => isCalendarItemInRange(task, range)) };
}

function sortCalendarItems(items) {
  return [...(items || [])].sort((a, b) => {
    const aValue = a.kind === 'tasks#task' ? a.due : (a.start?.dateTime || a.start?.date || '');
    const bValue = b.kind === 'tasks#task' ? b.due : (b.start?.dateTime || b.start?.date || '');
    return String(aValue).localeCompare(String(bValue));
  });
}

function getGoogleApiErrorText(error) {
  return JSON.stringify(error.response?.data || {});
}

function classifyGoogleTasksError(error) {
  const status = error.response?.status;
  const data = getGoogleApiErrorText(error);
  if (status === 401) return 'auth_expired';
  if (status !== 403) return '';
  if (/accessNotConfigured|SERVICE_DISABLED|has not been used|not been used|disabled|enable it|API has not/i.test(data)) {
    return 'api_disabled';
  }
  if (/ACCESS_TOKEN_SCOPE_INSUFFICIENT|insufficient authentication scopes|insufficientPermissions|insufficient|scope/i.test(data)) {
    return 'insufficient_scope';
  }
  if (/permission|forbidden|PERMISSION_DENIED/i.test(data)) return 'permission_denied';
  return '';
}

async function listGoogleCalendarItems(userId, range) {
  const eventsResult = await listGoogleCalendarEvents(userId, range);
  if (eventsResult.needsAuth) return eventsResult;

  try {
    const tasksResult = await listGoogleTasks(userId, range);
    if (tasksResult.needsAuth) return tasksResult;
    return { events: sortCalendarItems([...(eventsResult.events || []), ...(tasksResult.tasks || [])]) };
  } catch (error) {
    const tasksErrorType = classifyGoogleTasksError(error);
    if (tasksErrorType) {
      const storedToken = await getStoredGoogleToken(userId);
      console.error('[google-tasks] auth/config failed:', {
        type: tasksErrorType,
        status: error.response?.status,
        message: String(error.response?.data?.error?.message || error.message || '').slice(0, 240),
      });
      return {
        events: eventsResult.events || [],
        tasksAuthIssue: tasksErrorType,
        tasksScopeGranted: hasGoogleTasksScope(storedToken),
        tasksScopeCheckedAt: storedToken?.connected_at || null,
      };
    }
    console.error('[google-tasks] list failed:', { message: error.message, code: error.code, status: error.response?.status });
    return { events: eventsResult.events || [], tasksFailed: true };
  }
}

function formatGoogleCalendarEvent(event, index) {
  if (event.kind === 'tasks#task') {
    const statusText = event.status === 'completed' ? '완료' : '할 일';
    return `${index + 1}. ${normalizeText(event.title || '제목 없음')} (${statusText})`;
  }
  const startValue = event.start?.dateTime || event.start?.date;
  const endValue = event.end?.dateTime || event.end?.date;
  const isAllDay = Boolean(event.start?.date);
  let timeText = '시간미정';
  if (isAllDay) {
    timeText = '종일';
  } else if (startValue) {
    const start = new Date(startValue);
    const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    timeText = timeFormatter.format(start);
    if (endValue) {
      const end = new Date(endValue);
      timeText += `-${timeFormatter.format(end)}`;
    }
  }
  return `${index + 1}. ${normalizeText(event.summary || '제목 없음')} (${timeText})`;
}

function formatGoogleCalendarDetailAnswer(cardTitle, events) {
  const lines = (events || []).map(formatGoogleCalendarEvent);
  return [`${cardTitle} 상세 일정 ${lines.length}개`, ...lines].join('\n');
}

async function answerCalendarReadRequest(message, userId, req) {
  if (!isCalendarUserAllowed(userId)) {
    return answerCalendarUserNotAllowed(userId);
  }

  if (!hasGoogleOAuthConfig()) {
    return {
      answer: '개인 구글 캘린더를 읽으려면 Google OAuth 클라이언트 ID/Secret이 필요해. API 키만으로는 개인 일정 조회가 안 돼.',
      quickReplies: [],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_oauth_missing' },
      results: [],
    };
  }

  if (!(await getStoredGoogleToken(userId))) {
    const authUrl = buildGoogleConnectUrl(userId, req);
    return {
      answer: `본인 구글 캘린더 일정을 읽으려면 먼저 구글 동의가 필요해.\n카카오톡 안에서 열면 Google이 막을 수 있으니, 아래 링크를 Safari/Chrome 같은 외부 브라우저에서 열어줘.\n연결 후 다시 “내일 일정 알려줘”처럼 물어봐줘.\n${authUrl}`,
      quickReplies: [{ label: '구글 연결', action: 'webLink', webLinkUrl: authUrl }],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_auth_required' },
      results: [],
    };
  }

  const range = parseCalendarQueryRange(message);
  const detailMode = isCalendarDetailRequest(message, range);
  let result;
  try {
    result = await listGoogleCalendarItems(userId, range);
  } catch (error) {
    console.error('[google-calendar] list failed:', { message: error.message, code: error.code, status: error.response?.status });
    return {
      answer: `${formatCalendarCardTitle(range.label)}을 확인하려고 했는데 구글 캘린더 응답이 늦거나 실패했어. 잠깐 뒤에 같은 문장으로 다시 보내줘.`,
      quickReplies: [],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.85, source: 'calendar_list_failed' },
      results: [],
    };
  }
  if (result.needsAuth) {
    const authUrl = buildGoogleConnectUrl(userId, req);
    return {
      answer: `구글 캘린더 연결이 필요해. 카카오톡 안에서 열면 Google이 막을 수 있으니 Safari/Chrome에서 열어줘.\n${authUrl}`,
      quickReplies: [{ label: '구글 연결', action: 'webLink', webLinkUrl: authUrl }],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.9, source: 'calendar_auth_required' },
      results: [],
    };
  }

  if (!result.events.length) {
    const cardTitle = formatCalendarCardTitle(range.label);
    if (result.tasksAuthIssue) {
      const authUrl = buildGoogleConnectUrl(userId, req);
      if (result.tasksAuthIssue === 'api_disabled') {
        const tasksApiEnableUrl = getGoogleTasksApiEnableUrl();
        return {
          answer: `구글 연결은 저장됐는데, 서버의 Google Cloud 프로젝트에서 Google Tasks API가 꺼져 있어. 이건 사용자 토큰 문제가 아니라 프로젝트 설정이라 Google Cloud 프로젝트 소유자 권한으로 한 번 켜야 해.\n아래 링크에서 Tasks API를 사용 설정한 뒤 다시 같은 문장으로 물어봐줘.\n${tasksApiEnableUrl}`,
          quickReplies: [{ label: 'Tasks API 켜기', action: 'webLink', webLinkUrl: tasksApiEnableUrl }],
          plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_tasks_api_disabled' },
          results: [],
          calendarCard: { label: cardTitle, mode: detailMode ? 'detail' : 'summary', summaryText: 'Tasks API 필요', events: [] },
        };
      }
      if (result.tasksAuthIssue === 'insufficient_scope') {
        const reconnectedAt = result.tasksScopeCheckedAt ? Date.parse(result.tasksScopeCheckedAt) : 0;
        const wasRecentlyReconnected = Number.isFinite(reconnectedAt) && reconnectedAt > Date.now() - 10 * 60 * 1000;
        if (wasRecentlyReconnected || result.tasksScopeGranted === false) {
          return {
            answer: `구글 연결은 저장됐는데, Google Tasks 권한이 실제 토큰에 포함되지 않았어. 그래서 Calendar 앱의 파란 체크 할 일을 아직 못 읽고, ${cardTitle}의 일반 캘린더 일정은 비어 있어.\nOAuth 동의 화면의 테스트 사용자/Tasks scope 설정을 다시 확인해야 해.`,
            quickReplies: [],
            plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_tasks_scope_not_granted' },
            results: [],
            calendarCard: { label: cardTitle, mode: detailMode ? 'detail' : 'summary', summaryText: 'Tasks 권한 필요', events: [] },
          };
        }
        return {
          answer: `Google Calendar 앱에 보이는 체크 표시 할 일까지 읽으려면 Google Tasks 권한이 추가로 필요해. 아래 링크로 한 번만 다시 연결한 뒤 같은 문장으로 물어봐줘.\n${authUrl}`,
          quickReplies: [{ label: '구글 재연결', action: 'webLink', webLinkUrl: authUrl }],
          plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_tasks_reconnect_required' },
          results: [],
        };
      }
      return {
        answer: `구글 연결은 저장됐는데 Google Tasks 쪽 권한/설정이 막혀서 체크 표시 할 일을 못 읽었어. ${cardTitle}의 일반 캘린더 일정은 비어 있어.\n서버 로그에 정확한 원인을 남겨뒀으니 설정 확인 후 다시 처리할게.`,
        quickReplies: [],
        plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.9, source: 'calendar_tasks_permission_blocked' },
        results: [],
        calendarCard: { label: cardTitle, mode: detailMode ? 'detail' : 'summary', summaryText: 'Tasks 설정 확인 필요', events: [] },
      };
    }
    return {
      answer: `비서님이 확인했는데 ${cardTitle}은 비어 있어.`,
      quickReplies: [],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_events_empty' },
      results: [],
      calendarCard: { label: cardTitle, mode: detailMode ? 'detail' : 'summary', summaryText: '일정 없음', events: [] },
    };
  }

  const cardTitle = formatCalendarCardTitle(range.label);
  const includeDateInCardRows = Number(range?.days || 0) > 1;
  const cardEvents = result.events.map((event) => formatGoogleCalendarCardEvent(event, { includeDate: includeDateInCardRows }));
  const groupedEvents = groupGoogleCalendarEventsByDate(result.events);
  const summaryText = Number(range?.days || 0) > 1
    ? `${groupedEvents.length}일 / ${result.events.length}개 일정`
    : `${result.events.length}개 일정`;
  return {
    answer: detailMode
      ? formatGoogleCalendarDetailAnswer(cardTitle, result.events)
      : `비서님이 ${cardTitle}을 날짜별 요약 카드로 정리했어.`,
    quickReplies: [],
    plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_events_listed' },
    results: result.events,
    calendarCard: {
      label: cardTitle,
      mode: detailMode ? 'detail' : 'summary',
      summaryText,
      events: cardEvents,
    },
  };
}

async function createGoogleCalendarEvent(userId, event) {
  const storedToken = await getStoredGoogleToken(userId);
  if (!storedToken) return { needsAuth: true };
  const token = await refreshGoogleAccessToken(userId, storedToken);

  const response = await axios.post('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    summary: event.summary,
    start: { dateTime: event.start, timeZone: 'Asia/Seoul' },
    end: { dateTime: event.end, timeZone: 'Asia/Seoul' },
    reminders: event.reminderMinutes
      ? { useDefault: false, overrides: [{ method: 'popup', minutes: event.reminderMinutes }] }
      : { useDefault: true },
  }, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    timeout: GOOGLE_CALENDAR_TIMEOUT_MS,
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

  if (!(await getStoredGoogleToken(userId))) {
    const authUrl = buildGoogleConnectUrl(userId, req);
    return {
      answer: `본인 구글 캘린더에 일정을 넣으려면 먼저 구글 동의가 필요해.\n카카오톡 안에서 열면 Google이 막을 수 있으니, 아래 링크를 Safari/Chrome 같은 외부 브라우저에서 열어줘.\n연결 후 다시 일정 추가를 말해줘.\n${authUrl}`,
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
    const authUrl = buildGoogleConnectUrl(userId, req);
    return {
      answer: `구글 캘린더 연결이 필요해. 카카오톡 안에서 열면 Google이 막을 수 있으니 Safari/Chrome에서 열어줘.\n${authUrl}`,
      quickReplies: [{ label: '구글 연결', action: 'webLink', webLinkUrl: authUrl }],
      plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.9, source: 'calendar_auth_required' },
      results: [],
    };
  }

  return {
    answer: `구글 캘린더에 추가했어.\n${event.summary}\n${event.start.replace('T', ' ').replace(':00+09:00', '')}${event.reminderMinutes ? `\n${event.reminderMinutes}분 전 알림도 같이 설정했어.` : ''}`,
    quickReplies: [],
    plan: { intent: 'chat', searchQuery: '', sort: 'sim', confidence: 0.95, source: 'calendar_event_created' },
    results: [result.event],
  };
}

function isWeatherQuestion(message) {
  return WEATHER_WORD_PATTERN.test(normalizeKoreanSearchText(message));
}

function detectWeatherTimeframe(message) {
  const text = normalizeKoreanSearchText(message);
  if (/모레|내일\s*모레/.test(text)) return 'day_after_tomorrow';
  if (/내일|낼|다음\s*날/.test(text)) return 'tomorrow';
  if (/지금|현재|실시간/.test(text)) return 'current';
  return 'today';
}

function getWeatherTimeLabel(timeframe) {
  switch (timeframe) {
    case 'tomorrow':
      return '내일';
    case 'day_after_tomorrow':
      return '모레';
    case 'current':
      return '현재';
    default:
      return '오늘';
  }
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

function formatTomorrowWeatherAnswer(city, weather) {
  const tomorrow = weather.tomorrow || {};
  const details = [];
  const condition = normalizeText(tomorrow.condition || '').match(/맑음|구름많음|흐림|비|눈|소나기|안개|황사/)?.[0] || normalizeText(tomorrow.condition || '');
  const low = normalizeText(tomorrow.tempLow || '').replace(/^최저기온\s*/, '');
  const high = normalizeText(tomorrow.tempHigh || '').replace(/^최고기온\s*/, '');

  if (condition) details.push(`상태는 ${condition}`);
  if (low || high) details.push(`최저/최고는 ${low || '?'} / ${high || '?'} 정도`);

  if (!details.length) {
    return `${city} 내일 날씨를 확인하려고 했는데 지금은 내일 예보를 못 가져왔어. 네이버 날씨에서 최신 예보를 한 번 확인해줘.`;
  }

  return [
    `${city} 기준 내일 날씨야.`,
    details.join(', '),
    /비|소나기/.test(condition) ? '비 예보가 있으면 우산 챙기는 게 좋아.' : '',
  ].filter(Boolean).join('\n');
}

function formatWeatherAnswer(city, weather, timeframe = 'today') {
  if (timeframe === 'tomorrow') return formatTomorrowWeatherAnswer(city, weather);
  if (timeframe === 'day_after_tomorrow') {
    return `${city} 모레 날씨는 현재 응답에서 직접 확인할 수 있는 예보 범위를 벗어나 있어. 네이버 날씨 버튼에서 모레 예보를 확인해줘.`;
  }

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
    `${city} 기준 ${getWeatherTimeLabel(timeframe)} 날씨야.`,
    details.join(', '),
    /비|소나기/.test(condition) ? '비가 잡혀 있으니 우산 챙기는 게 좋아.' : weather.recommendation || '',
  ].filter(Boolean).join('\n');
}

async function answerWeather(message, routePlan = null) {
  const city = extractWeatherLocation(message);
  const timeframe = detectWeatherTimeframe(message);
  const weather = await naverWeatherCrawler.getWeatherInfo(city);
  const linkQueryTime = timeframe === 'tomorrow' ? '내일 ' : timeframe === 'day_after_tomorrow' ? '모레 ' : '';
  return {
    answer: formatWeatherAnswer(city, weather, timeframe),
    quickReplies: [{
      label: '네이버 날씨',
      action: 'webLink',
      webLinkUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(`${city} ${linkQueryTime}날씨`)}`,
    }],
    plan: { ...(routePlan || {}), intent: 'weather_lookup', searchQuery: city, sort: routePlan?.sort || 'sim', confidence: routePlan?.confidence || 0.9, source: routePlan?.source || 'weather_handler', timeframe },
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
  const modelAnswer = answerClaudeModelQuestion(text);
  if (modelAnswer) return modelAnswer;
  if (/^(안녕|안녕하세요|하이|ㅎㅇ)/.test(text)) return '안녕. 뭐 도와줄까?';
  return 'Claude 응답이 잠깐 지연됐어. 방금 질문 그대로 한 번만 다시 보내줘.';
}

function answerClaudeModelQuestion(message) {
  const text = normalizeKoreanSearchText(message);
  const asksModel = /(클로드|claude|ai|인공지능|챗봇|너|당신|모델|model).*(버전|version|소넷|sonnet|하이쿠|haiku|모델|model|뭐야|뭔지|어떤거|무슨)|((버전|version|소넷|sonnet|하이쿠|haiku|모델|model).*(클로드|claude|ai|인공지능|챗봇|너|당신))/.test(text);
  if (!asksModel) return null;

  const fallbackText = CLAUDE_FALLBACK_MODELS.length ? ` 안 되면 ${CLAUDE_FALLBACK_MODELS.join(', ')} 순서로 자동 대체해.` : '';
  return `지금은 Haiku 계열인 ${CLAUDE_MODEL}로 설정돼 있어.${fallbackText}`;
}

async function answerChat(message, userId) {
  const modelAnswer = answerClaudeModelQuestion(message);
  if (modelAnswer) return modelAnswer;
  if (!CLAUDE_API_KEY) return fallbackChatAnswer(message);
  const history = (conversations.get(userId) || []).slice(-6).map((item) => ({ role: item.role, content: item.content }));
  const models = [...new Set([CLAUDE_MODEL, ...CLAUDE_FALLBACK_MODELS].filter(Boolean))];
  let lastError;

  for (const model of models) {
    try {
      const response = await axios.post(CLAUDE_API_URL, {
        model,
        max_tokens: 420,
        temperature: 0.7,
        system: ['너는 카카오톡에서 대화하는 친근한 한국어 AI 친구야.', '자연스러운 반말로 바로 답해.', '찾아볼게처럼 미래에 도구를 실행할 척하지 마.', `네 모델명은 추측하지 마. 모델을 묻는 질문에는 ${model}이라고 답해.`].join('\n'),
        messages: [...history, { role: 'user', content: message }],
      }, {
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY, 'anthropic-version': '2023-06-01' },
        timeout: CLAUDE_TIMEOUT_MS,
      });
      const answer = response.data?.content?.[0]?.text || '응답을 못 만들었어. 다시 한 번만 보내줘.';
      lastClaudeStatus = { ok: true, status: 200, code: null, message: null, model, at: new Date().toISOString() };
      return answer;
    } catch (error) {
      lastError = error;
      lastClaudeStatus = { ok: false, status: error.response?.status || null, code: error.code || null, message: String(error.response?.data?.error?.message || error.message || '').slice(0, 160), model, at: new Date().toISOString() };
      if (error.response?.status !== 404) break;
    }
  }

  throw lastError;
}

async function buildAnswer(message, userId, req) {
  if (isNaverConfigQuestion(message)) return answerNaverConfigQuestion(message);
  if (isCalendarUpdateRequest(message)) return answerCalendarUpdateRequest(message, userId, req);
  if (isCalendarReadRequest(message)) return answerCalendarReadRequest(message, userId, req);
  if (isCalendarWriteRequest(message) || isReminderWriteRequest(message)) return answerCalendarWriteRequest(message, userId, req);
  if (isGoogleCalendarConfigQuestion(message)) return answerGoogleCalendarConfigQuestion();

  if (shouldAnswerWithClaudeFirst(message) || isCasualMealChoiceRequest(message)) {
    const plan = {
      intent: 'chat',
      searchQuery: '',
      sort: 'sim',
      confidence: 0.9,
      source: isCasualMealChoiceRequest(message) ? 'claude_first_meal_chat' : 'claude_first_chat',
    };
    try {
      const answer = await answerChat(message, userId);
      return { answer, quickReplies: [], plan, results: [] };
    } catch (error) {
      console.error('[claude-first-chat] failed:', { message: error.message, code: error.code, status: error.response?.status });
      lastClaudeStatus = { ok: false, status: error.response?.status || null, code: error.code || null, message: String(error.response?.data?.error?.message || error.message || '').slice(0, 160), at: new Date().toISOString() };
      return { answer: fallbackChatAnswer(message), quickReplies: [], plan, results: [] };
    }
  }

  const plan = await planTurn(message, userId);
  if (plan.intent === 'weather_lookup') {
    try {
      return await answerWeather(plan.searchQuery || message, plan);
    } catch (error) {
      console.error('[weather] failed:', { message: error.message, code: error.code, status: error.response?.status });
      const city = extractWeatherLocation(plan.searchQuery || message);
      return {
        answer: `${city} 날씨를 확인하려고 했는데 지금은 정보를 못 가져왔어. 잠시 후 다시 물어봐줘.`,
        quickReplies: [],
        plan: { ...plan, intent: 'weather_lookup', searchQuery: city, source: `${plan.source || 'unknown'}_weather_error` },
        results: [],
      };
    }
  }
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
    lastClaudeStatus = { ok: false, status: error.response?.status || null, code: error.code || null, message: String(error.response?.data?.error?.message || error.message || '').slice(0, 160), at: new Date().toISOString() };
    return { answer: fallbackChatAnswer(message), quickReplies: [], plan, results: [] };
  }
}

app.get('/', (req, res) => res.type('html').send(`<h1>카카오 스킬 웹훅 서버</h1><p>상태: 정상 실행 중</p><p>라우터: ${ROUTER_VERSION}</p><p>현재 한국 시간: ${getKoreanDateTime()}</p>`));
app.get('/health', async (req, res) => {
  if (req.query.googleTokenStoreCheck === '1') {
    await loadGoogleTokensAsync();
  }
  return res.json({
    ok: true,
    service: 'kakao-skill-webhook',
    routerVersion: ROUTER_VERSION,
    koreaTime: getKoreanDateTime(),
    env: {
      claudeApiKey: Boolean(CLAUDE_API_KEY),
      claudeModel: CLAUDE_MODEL,
      claudeFallbackModels: CLAUDE_FALLBACK_MODELS,
      claudeTimeoutMs: CLAUDE_TIMEOUT_MS,
      naverApi: Boolean(NAVER_CLIENT_ID && NAVER_CLIENT_SECRET),
      googleCloudApiKey: Boolean(GOOGLE_CLOUD_API_KEY),
      googleCalendarWritable: Boolean(GOOGLE_CALENDAR_SERVICE_ACCOUNT_JSON && GOOGLE_CALENDAR_ID),
      googleCalendarOAuth: hasGoogleOAuthConfig(),
      googleCalendarReadable: hasGoogleOAuthConfig(),
      googleCalendarAllowedUsers: KAKAO_CALENDAR_ALLOWED_USER_IDS.length,
      googleTokenStoreSupabase: Boolean(getTokenStoreSupabase()),
      googleTokenStoreBucket: GOOGLE_TOKEN_STORE_BUCKET,
      plannerTimeoutMs: CLAUDE_PLANNER_TIMEOUT_MS,
      naverTimeoutMs: NAVER_SEARCH_TIMEOUT_MS,
      port: PORT,
    },
    googleTokenStore: lastGoogleTokenStoreStatus,
    claude: lastClaudeStatus,
  });
});
app.get('/test', (req, res) => res.json(kakaoTextResponse('테스트 성공! 카카오 스킬 응답 형식 정상이야.')));
app.get('/routes', (req, res) => res.json({ ok: true, routerVersion: ROUTER_VERSION, routes: ['chat', 'web_lookup', 'news_search', 'local_search', 'shopping_search', 'weather_lookup', 'google_calendar_oauth', 'google_calendar_create_event', 'google_calendar_list_events', 'calendar_card_image'] }));

app.get('/calendar-card.png', async (req, res) => {
  cleanupCalendarCardCache();
  const card = calendarCardCache.get(normalizeText(req.query.id));
  if (!card) return res.status(404).type('text/plain').send('Calendar card not found or expired.');
  try {
    const png = await renderCalendarCardPng(card);
    res.set('Cache-Control', 'public, max-age=600');
    return res.type('image/png').send(png);
  } catch (error) {
    console.error('[calendar-card] render failed:', error.message);
    return res.status(500).type('text/plain').send('Calendar card render failed.');
  }
});

app.get('/auth/google', (req, res) => {
  const userId = normalizeText(req.query.userId || '');
  if (!hasGoogleOAuthConfig()) return res.status(503).type('text/plain').send('Google OAuth 설정이 아직 없습니다.');
  if (!userId) return res.status(400).type('text/plain').send('userId가 필요합니다.');
  if (!isCalendarUserAllowed(userId)) return res.status(403).type('text/plain').send('이 카카오 사용자는 Google Calendar 연결이 허용되지 않았습니다.');
  if (isBlockedOAuthUserAgent(req)) {
    return res.type('html').send(renderExternalBrowserInstructions(buildGoogleConnectUrl(userId, req)));
  }
  return res.redirect(buildGoogleAuthUrl(userId, req));
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    if (!hasGoogleOAuthConfig()) return res.status(503).type('text/plain').send('Google OAuth 설정이 아직 없습니다.');
    const { userId } = decodeOAuthState(req.query.state);
    if (!userId || !req.query.code) return res.status(400).type('text/plain').send('OAuth state/code가 올바르지 않습니다.');
    if (!isCalendarUserAllowed(userId)) return res.status(403).type('text/plain').send('이 카카오 사용자는 Google Calendar 연결이 허용되지 않았습니다.');
    const token = await exchangeGoogleCodeForToken(req.query.code, getGoogleRedirectUri(req));
    const tokens = await loadGoogleTokensAsync();
    const grantedScope = token.scope || tokens[userId]?.scope || '';
    tokens[userId] = {
      ...token,
      scope: grantedScope,
      refresh_token: token.refresh_token || tokens[userId]?.refresh_token,
      expires_at: Date.now() + Number(token.expires_in || 3600) * 1000,
      connected_at: new Date().toISOString(),
    };
    const tokenPersisted = await saveGoogleTokensAsync(tokens);
    if (grantedScope && !hasGoogleTasksScope(tokens[userId])) {
      return res.type('html').send('<h1>Google Calendar connected</h1><p>캘린더 연결은 완료됐지만 Google Tasks 권한은 토큰에 포함되지 않았습니다. 카카오톡으로 돌아가서 다시 물어보면 캘린더 일정만 먼저 확인할 수 있습니다.</p>');
    }
    if (!tokenPersisted) {
      return res.type('html').send('<h1>Google Calendar connected</h1><p>연결은 완료됐지만 서버의 영속 토큰 저장소 설정이 아직 완전하지 않습니다. 카카오톡으로 돌아가서 다시 물어봐 주세요.</p>');
    }
    return res.type('html').send('<h1>Google Calendar connected</h1><p>카카오톡으로 돌아가서 일정 조회나 등록을 다시 요청해 주세요.</p>');
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
    const { answer, quickReplies, plan, results, calendarCard } = await buildAnswer(message, userId, req);
    remember(userId, 'assistant', answer);
    console.log(`[kakao] ${Date.now() - startedAt}ms intent=${plan.intent} source=${plan.source} results=${results.length} query=${plan.searchQuery || ''}`);
    if (calendarCard) {
      const cardId = createCalendarCard(calendarCard);
      return res.json(kakaoImageResponse({
        imageUrl: `${getPublicBaseUrl(req)}/calendar-card.png?id=${encodeURIComponent(cardId)}`,
        altText: `${calendarCard.label || '구글 캘린더'} 일정 카드`,
        text: answer,
        quickReplies,
      }));
    }
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
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Kakao skill webhook server listening on port ${PORT}`);
    console.log(`Router version: ${ROUTER_VERSION}`);
  });
}

module.exports = { app, renderCalendarCardPng, renderCalendarCardSvg, parseCalendarQueryRange, isCalendarItemInRange, formatGoogleCalendarEvent };
