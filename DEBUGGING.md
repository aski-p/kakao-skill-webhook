# Kakao Skill Webhook Debugging Guide

## Common Issues and Solutions

### 1. API Not Responding
**Issue**: The webhook receives requests but doesn't return proper responses.

**Root Cause**: The root webhook handler (`POST /`) had incorrect implementation.

**Solution**: Fixed in index.js - now properly redirects to `/kakao-skill-webhook`.

### 2. Missing Environment Variables
**Issue**: Claude API and Naver API keys not set.

**Solution**:
1. In Railway dashboard, go to Variables section
2. Add the following:
   - `CLAUDE_API_KEY`: Your Claude API key
   - `NAVER_CLIENT_ID`: Your Naver Client ID
   - `NAVER_CLIENT_SECRET`: Your Naver Client Secret

### 3. Shopping Search Query Issues
**Issue**: Search queries become malformed (e.g., "젖병 세척기 추천해줘" → "있는 젖병 세척기").

**Solution**: Fixed search query processing to properly handle Korean text and remove helper words.

### 4. Response Format Issues
**Issue**: Responses might be too long for Kakao's text limit (1000 characters).

**Solution**: The code already handles this by converting long responses to list cards.

## Testing Locally

1. Create `.env` file with your API keys:
   ```bash
   cp .env.example .env
   # Edit .env with your actual keys
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the server:
   ```bash
   npm start
   ```

4. Test endpoints:
   ```bash
   # Health check
   curl http://localhost:3000/

   # Status page
   curl http://localhost:3000/status

   # Test webhook
   curl -X POST http://localhost:3000/kakao-skill-webhook \
     -H "Content-Type: application/json" \
     -d '{"userRequest":{"utterance":"안녕하세요"}}'
   ```

## Monitoring in Production

1. Check Railway logs:
   ```bash
   railway logs
   ```

2. Visit status page:
   ```
   https://kakao-skill-webhook-production.up.railway.app/status
   ```

3. Monitor response times and errors in logs.

## Response Format

Kakao expects responses in this format:
```json
{
  "version": "2.0",
  "template": {
    "outputs": [{
      "simpleText": {
        "text": "응답 메시지"
      }
    }]
  }
}
```

For list cards (long responses):
```json
{
  "version": "2.0",
  "template": {
    "outputs": [{
      "listCard": {
        "header": {
          "title": "제목"
        },
        "items": [...],
        "buttons": [...]
      }
    }]
  }
}
```