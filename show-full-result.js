// 전체 결과 확인
const MessageClassifier = require('./config/message-classifier');
const DataExtractor = require('./config/data-extractor');

async function showFullResult() {
    const userMessage = "F1더무비 네이버";
    
    const messageClassifier = new MessageClassifier();
    const dataExtractor = new DataExtractor({
        clientId: 'test',
        clientSecret: 'test'
    });
    
    const classification = messageClassifier.classifyMessage(userMessage);
    const extractionResult = await dataExtractor.extractData(classification);
    
    console.log('[MOVIE] 완전한 영화평 결과:');
    console.log('='.repeat(80));
    console.log(extractionResult.data.message);
    console.log('='.repeat(80));
}

showFullResult().catch(console.error);