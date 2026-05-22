const assert = require('assert');
const {
  fallbackPlan,
  compactLocalQuery,
  isCasualMealChoiceRequest,
} = require('./server');

const locationMealRequests = [
  ['울지로3가 점심 먹을거 추천좀', '을지로3가 점심'],
  ['을지로3가 점심 먹을거 추천좀', '을지로3가 점심'],
  ['강남역 저녁 먹을 것 추천해줘', '강남역 저녁'],
  ['홍대 밥 먹을 곳 알려줘', '홍대 밥'],
  ['을지로3가에서 뭐 먹지', '을지로3가 맛집'],
  ['성수 근처 조용한 카페 있을까', '성수 조용한 카페'],
];

for (const [message, expectedQuery] of locationMealRequests) {
  const plan = fallbackPlan(message);
  assert.strictEqual(plan.intent, 'local_search', `${message} should route to local_search`);
  assert.strictEqual(plan.searchQuery, expectedQuery, `${message} should compact to the right local query`);
  assert.strictEqual(plan.sort, 'comment');
  assert.strictEqual(isCasualMealChoiceRequest(message), false, `${message} should not be casual chat`);
}

assert.strictEqual(isCasualMealChoiceRequest('점심 뭐 먹을까'), true);
assert.strictEqual(fallbackPlan('점심 뭐 먹을까').intent, 'chat');

console.log('local meal routing tests passed');
