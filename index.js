const express = require('express');
const axios = require('axios');
const http = require('http');
const https = require('https');
const config = require('./config/keywords');

// HTTP Keep-Alive 최적화 및 연결 안정성 향상
const httpAgent = new http.Agent({ 
    keepAlive: true, 
    maxSockets: 10,
    timeout: 30000
});
const httpsAgent = new https.Agent({ 
    keepAlive: true, 
    maxSockets: 10,
    timeout: 30000
});
axios.defaults.httpAgent = httpAgent;
axios.defaults.httpsAgent = httpsAgent;
axios.defaults.timeout = 4000; // 전역 타임아웃 4초로 단축

const app = express();
app.use(express.json());

// 카카오톡 5초 제한에 맞춘 응답 타임아웃 설정
app.use((req, res, next) => {
    res.setTimeout(4500, () => {  // 4.5초로 단축
        console.log('⏰ 서버 타임아웃 (4.5초) - 카카오톡 호환성');
        
        if (!res.headersSent) {
            res.status(200).json({
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: "⏰ 처리 시간이 길어지고 있습니다.\n\n간단한 질문으로 다시 시도해주세요."
                        }
                    }]
                }
            });
        }
    });
    next();
});

// 네이버 검색 API 설정
const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;
const NAVER_NEWS_API_URL = 'https://openapi.naver.com/v1/search/news.json';
const NAVER_SHOPPING_API_URL = 'https://openapi.naver.com/v1/search/shop.json';
const NAVER_LOCAL_API_URL = 'https://openapi.naver.com/v1/search/local.json';

// 설정 파일에서 타임아웃 설정 가져오기
const TIMEOUT_CONFIG = config.timeouts;

// 사실 확인 요청 감지 함수
function isFactCheckRequest(message) {
    const factCheckKeywords = [
        '사실', '진실', '사망', '죽음', '별세', '타계', '작고', '서거',
        '결혼', '이혼', '임신', '출산', '체포', '검거', '구속',
        '사고', '화재', '지진', '홍수', '태풍', '폭발',
        '발표', '공개', '출시', '런칭', '개봉', '방영',
        '사실이야', '진짜야', '맞아', '확실해', '사실 여부', 
        '진실 여부', '확인', '알려줘', '맞는지', '사실인지'
    ];
    
    return factCheckKeywords.some(keyword => message.includes(keyword));
}

// 유튜브 URL 감지 함수
function extractYouTubeUrl(message) {
    const youtubePatterns = [
        /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
        /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/
    ];
    
    for (const pattern of youtubePatterns) {
        const match = message.match(pattern);
        if (match) {
            const videoId = match[1];
            return {
                url: `https://www.youtube.com/watch?v=${videoId}`,
                videoId: videoId
            };
        }
    }
    return null;
}

// 유튜브 요약 요청 감지 함수
function isYouTubeSummaryRequest(message) {
    const youtubeUrl = extractYouTubeUrl(message);
    const summaryKeywords = ['요약', '내용', '정리', '설명', '어떤내용', '뭐라고', '뭔소리', '무슨말'];
    
    return youtubeUrl && summaryKeywords.some(keyword => message.includes(keyword));
}

// 영화 평가 요청 감지 함수
function isMovieReviewRequest(message) {
    const movieKeywords = ['영화', '영화평', '평점', '평가', '리뷰', '별점', '관람평'];
    const reviewKeywords = ['어때', '평가', '리뷰', '별점', '평점', '평좀', '어떤지', '볼만해', '재밌어'];
    
    const hasMovieKeyword = movieKeywords.some(keyword => message.includes(keyword));
    const hasReviewKeyword = reviewKeywords.some(keyword => message.includes(keyword));
    
    // "영화" 키워드가 있거나, 영화 제목과 평가 키워드가 함께 있는 경우
    return hasMovieKeyword || (hasReviewKeyword && !isGameInfoRequest(message));
}

// 게임 정보 요청 감지 함수 (영화와 구분하기 위해)
function isGameInfoRequest(message) {
    const gameKeywords = ['게임', '플레이', '스팀', '에픽', 'PC게임', '콘솔'];
    return gameKeywords.some(keyword => message.includes(keyword));
}

// YouTube API로 영상 정보 가져오기
async function getYouTubeVideoInfo(videoId) {
    try {
        // YouTube Data API v3 사용 (API 키 필요)
        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
        
        if (!YOUTUBE_API_KEY) {
            console.log('⚠️ YouTube API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${YOUTUBE_API_KEY}`;
        const response = await axios.get(url, { timeout: 3000 });
        
        if (response.data.items && response.data.items.length > 0) {
            const video = response.data.items[0];
            return {
                title: video.snippet.title,
                description: video.snippet.description,
                channelTitle: video.snippet.channelTitle,
                publishedAt: video.snippet.publishedAt,
                duration: video.contentDetails.duration
            };
        }
        
        return null;
    } catch (error) {
        console.log(`❌ YouTube API 오류: ${error.message}`);
        return null;
    }
}

// 네이버 영화 검색 함수
async function getNaverMovieInfo(movieTitle) {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: movieTitle,
            display: 5,
            start: 1
        };
        
        console.log(`🎬 네이버 영화 검색: "${movieTitle}"`);
        
        const response = await axios.get('https://openapi.naver.com/v1/search/movie.json', {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log(`🎬 "${movieTitle}" 검색 결과 없음`);
            return null;
        }
        
        console.log(`✅ "${movieTitle}" 검색 결과: ${items.length}개 영화 발견`);
        
        // 검색 결과 디버깅
        items.forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.title.replace(/<[^>]*>/g, '')} (${item.pubDate}) - 평점: ${item.userRating}`);
        });
        
        return items.map(item => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            director: item.director.replace(/<[^>]*>/g, ''),
            actor: item.actor.replace(/<[^>]*>/g, ''),
            pubDate: item.pubDate,
            userRating: item.userRating,
            link: item.link,
            image: item.image
        }));
        
    } catch (error) {
        console.error('❌ 네이버 영화 API 오류:', error.response?.data || error.message);
        return null;
    }
}

// 영화 평가 처리 함수
async function getMovieReview(movieTitle) {
    try {
        console.log(`🎬 영화 평가 요청: "${movieTitle}"`);
        
        // 1단계: 다양한 검색어로 시도
        let movieResults = null;
        const searchVariations = [
            movieTitle,                           // 원본
            movieTitle.replace(/\s+/g, ''),      // 공백 제거
            movieTitle.replace(/더/g, ' '),       // "더" → 공백
            movieTitle.replace(/더/g, 'THE'),     // "더" → "THE"
            movieTitle.replace(/더/g, '')         // "더" 제거
        ];
        
        // F1 특별 처리
        if (movieTitle.toLowerCase().includes('f1')) {
            searchVariations.push('F1', 'f1', 'Formula 1', '포뮬러원', '포뮬러 1');
            
            // F1 더 맥스 특별 처리 - 실제 존재하는 F1 영화들로 확장
            if (movieTitle.includes('맥스')) {
                searchVariations.push(
                    'F1 더 맥스', 
                    'F1 the Max', 
                    'F1: Drive to Survive',
                    '러쉬',           // 실제 F1 영화
                    'Rush',          // 영문 제목
                    '세나',           // 아일톤 세나 다큐
                    'Senna',
                    '그랑프리',       // 클래식 F1 영화
                    'Grand Prix'
                );
            }
        }
        
        console.log(`🔍 검색 시도할 키워드들: ${searchVariations.join(', ')}`);
        
        // 각 검색어로 순차적으로 시도
        for (const searchTerm of searchVariations) {
            if (searchTerm && searchTerm.length > 0) {
                movieResults = await getNaverMovieInfo(searchTerm);
                if (movieResults && movieResults.length > 0) {
                    console.log(`✅ "${searchTerm}"로 영화 발견됨`);
                    break;
                }
            }
        }
        
        if (!movieResults || movieResults.length === 0) {
            // 추가 시도: 영화 제목에 "F1" 포함시 특별 검색 로직
            console.log(`🔍 영화 제목 분석: "${movieTitle}" (소문자: "${movieTitle.toLowerCase()}")`);
            
            if (movieTitle.toLowerCase().includes('f1') || movieTitle.includes('더무비') || movieTitle.includes('무비')) {
                console.log('🏎️ F1/무비 영화 전용 검색 로직 시작');
                
                // 1. 네이버 뉴스에서 영화 평론 검색 (F1 특화 검색어 포함)
                const reviewSearches = [
                    `"${movieTitle}" 영화 평점`,
                    `"${movieTitle}" 영화 평론`,
                    `"${movieTitle}" 영화 리뷰`,
                    `"${movieTitle}" 관객 평점`,
                    `"${movieTitle}" 평가`,
                    `"F1 더무비" 평점`, // F1 특화 검색
                    `"F1 더무비" 리뷰`,
                    `"F1 영화" 평론`,
                    `"포뮬러1 영화" 평점`
                ];
                
                let allReviews = [];
                for (const searchTerm of reviewSearches) {
                    const reviews = await getLatestNews(searchTerm);
                    if (reviews && reviews.length > 0) {
                        allReviews.push(...reviews);
                    }
                }
                
                if (allReviews.length > 0) {
                    // 중복 제거
                    const uniqueReviews = allReviews.filter((review, index, arr) => 
                        arr.findIndex(r => r.title === review.title) === index
                    );
                    
                    let reviewText = `🎬 "${movieTitle}" 영화 평점/평론 모음\n\n`;
                    
                    // 전문가 평론과 관객 평을 구분
                    const expertReviews = uniqueReviews.filter(review => 
                        review.title.includes('평론') || review.title.includes('리뷰') || 
                        review.title.includes('평가') || review.title.includes('감상')
                    ).slice(0, 3);
                    
                    const audienceReviews = uniqueReviews.filter(review => 
                        review.title.includes('관객') || review.title.includes('후기') || 
                        review.title.includes('평점') || review.title.includes('별점')
                    ).slice(0, 3);
                    
                    if (expertReviews.length > 0) {
                        reviewText += `👨‍💼 전문가 평론:\n`;
                        expertReviews.forEach((review, index) => {
                            reviewText += `${index + 1}. ${review.title}\n`;
                            if (review.description) {
                                reviewText += `   "${review.description.substring(0, 80)}..."\n`;
                            }
                        });
                        reviewText += `\n`;
                    }
                    
                    if (audienceReviews.length > 0) {
                        reviewText += `👥 관객 평가:\n`;
                        audienceReviews.forEach((review, index) => {
                            reviewText += `${index + 1}. ${review.title}\n`;
                            if (review.description) {
                                reviewText += `   "${review.description.substring(0, 80)}..."\n`;
                            }
                        });
                        reviewText += `\n`;
                    }
                    
                    if (expertReviews.length === 0 && audienceReviews.length === 0) {
                        reviewText += `📰 검색된 리뷰/평점 (${uniqueReviews.length}개):\n`;
                        uniqueReviews.slice(0, 5).forEach((review, index) => {
                            reviewText += `${index + 1}. ${review.title}\n`;
                            if (review.description) {
                                reviewText += `   "${review.description.substring(0, 80)}..."\n`;
                            }
                        });
                    }
                    
                    reviewText += `\n💡 더 자세한 평점은 네이버 영화, 왓챠, CGV 등에서 확인하세요.`;
                    return reviewText;
                }
            }
            
            // 추가 시도: 네이버 뉴스에서 영화 관련 정보 검색
            console.log('🔍 네이버 뉴스에서 영화 정보 검색 시도');
            const newsResults = await getLatestNews(`"${movieTitle}" 영화`);
            
            if (newsResults && newsResults.length > 0) {
                let newsInfo = `🎬 "${movieTitle}" 관련 최신 정보\n\n`;
                newsInfo += `📰 뉴스 검색 결과 (영화 정보):\n`;
                newsResults.slice(0, 4).forEach((news, index) => {
                    newsInfo += `${index + 1}. ${news.title}\n`;
                });
                newsInfo += `\n💡 정확한 영화 제목 확인:\n• "러쉬" (2013) - F1 라이벌 영화\n• "세나" (2010) - 아일톤 세나 다큐\n• "그랑프리" (1966) - 클래식 F1 영화\n• 또는 "러쉬 영화평"으로 다시 검색`;
                return newsInfo;
            }
            
            return `🎬 "${movieTitle}" 영화를 찾을 수 없습니다.\n\n💡 검색 팁:\n• 정확한 영화 제목으로 다시 검색\n• 영어 제목이나 한글 제목으로 시도\n• 개봉년도와 함께 검색\n\n🏎️ F1 관련 실제 영화들:\n• "러쉬 영화평" - 2013년 F1 라이벌 영화\n• "세나 영화평" - 2010년 아일톤 세나 다큐\n• "그랑프리 영화평" - 1966년 클래식 F1 영화\n\n💭 "f1더무비"는 존재하지 않는 제목일 수 있습니다.`;
        }
        
        // 2단계: 가장 관련성 높은 영화 선택
        const bestMatch = movieResults[0];
        
        // 3단계: 네이버 뉴스에서 영화 리뷰 검색
        let reviewResults = await getLatestNews(`${bestMatch.title} 리뷰`);
        if (!reviewResults || reviewResults.length === 0) {
            reviewResults = await getLatestNews(`${bestMatch.title} 평점`);
        }
        
        let movieReviewText = `🎬 "${bestMatch.title}" 영화 정보\n\n`;
        
        // 영화 기본 정보
        movieReviewText += `📽️ 감독: ${bestMatch.director || '정보 없음'}\n`;
        movieReviewText += `🎭 출연: ${bestMatch.actor ? bestMatch.actor.substring(0, 100) + '...' : '정보 없음'}\n`;
        movieReviewText += `📅 개봉: ${bestMatch.pubDate || '정보 없음'}\n`;
        
        // 네이버 평점
        if (bestMatch.userRating && bestMatch.userRating !== '0.00') {
            const rating = parseFloat(bestMatch.userRating);
            const stars = '⭐'.repeat(Math.round(rating / 2));
            movieReviewText += `⭐ 네이버 평점: ${rating}/10 ${stars}\n`;
            
            // 평점 분석
            if (rating >= 8.0) {
                movieReviewText += `💫 높은 평점! 많은 관객들이 만족한 작품\n`;
            } else if (rating >= 6.0) {
                movieReviewText += `👍 괜찮은 평점의 무난한 작품\n`;
            } else if (rating >= 4.0) {
                movieReviewText += `😐 평점이 아쉬운 작품\n`;
            } else {
                movieReviewText += `👎 낮은 평점의 작품\n`;
            }
        } else {
            movieReviewText += `⭐ 네이버 평점: 정보 없음\n`;
        }
        
        movieReviewText += `\n🔗 상세 정보: ${bestMatch.link}\n`;
        
        // 리뷰 정보 추가
        if (reviewResults && reviewResults.length > 0) {
            movieReviewText += `\n📰 최신 리뷰 (${reviewResults.length}개):\n`;
            reviewResults.slice(0, 3).forEach((review, index) => {
                movieReviewText += `${index + 1}. ${review.title}\n`;
            });
        }
        
        return movieReviewText;
        
    } catch (error) {
        console.log(`❌ 영화 평가 오류: ${error.message}`);
        return `🎬 영화 정보를 가져올 수 없습니다.\n\n❌ 오류:\n• 네이버 영화 API 연결 실패\n• 영화 제목을 정확히 입력해주세요\n\n💡 다시 시도:\n• "영화제목 + 영화평" 형식으로 질문\n• 네이버 영화에서 직접 검색`;
    }
}

// 유튜브 요약 처리 함수 (개선된 버전)
async function getYouTubeSummary(youtubeData) {
    try {
        console.log(`📺 유튜브 요약 요청: ${youtubeData.url}`);
        
        // 1단계: YouTube API로 실제 영상 정보 가져오기
        const videoInfo = await getYouTubeVideoInfo(youtubeData.videoId);
        
        if (!process.env.CLAUDE_API_KEY) {
            throw new Error('CLAUDE_API_KEY not found');
        }
        
        let systemPrompt = `당신은 유튜브 영상 정보를 분석하는 전문가입니다.
        
한국어로 답변하세요. 다음 규칙을 엄격히 따르세요:
- 800자 이내로 간결하게 작성
- 절대 추측하거나 상상하지 마세요
- 영상 내용을 본 적이 없다는 것을 명확히 하세요
- "운전 사고", "충돌" 같은 내용을 만들어내지 마세요
- 제목과 설명에서 확인 가능한 정보만 제공
- 자막이나 영상 내용은 알 수 없다고 명시
- 이모지를 적절히 사용하여 읽기 쉽게 구성

중요: 영상을 직접 볼 수 없으므로 내용을 추측하지 마세요!`;

        let userContent = `다음 유튜브 영상 정보를 분석해주세요:\n\nURL: ${youtubeData.url}\nVideo ID: ${youtubeData.videoId}\n`;
        
        if (videoInfo) {
            userContent += `\n📌 영상 정보:\n제목: ${videoInfo.title}\n채널: ${videoInfo.channelTitle}\n업로드 날짜: ${videoInfo.publishedAt}\n설명: ${videoInfo.description ? videoInfo.description.substring(0, 500) + '...' : '설명 없음'}\n\n이 정보를 바탕으로 영상이 어떤 내용인지 파악할 수 있는 범위에서 설명해주세요.`;
        } else {
            userContent += `\n⚠️ YouTube API로 영상 정보를 가져올 수 없습니다.\n영상을 직접 볼 수 없으므로 내용을 추측하지 말고, 이 한계를 명확히 설명해주세요.`;
        }
        
        const claudeResponse = await axios.post(
            'https://api.anthropic.com/v1/messages',
            {
                model: "claude-3-haiku-20240307",
                system: systemPrompt,
                messages: [{
                    role: "user", 
                    content: userContent
                }],
                max_tokens: 400
            },
            {
                headers: {
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json'
                },
                timeout: config.timeouts.claude_general
            }
        );
        
        const summary = claudeResponse.data.content[0].text;
        console.log(`✅ 유튜브 분석 완료: ${summary.length}자`);
        
        return `📺 유튜브 영상 정보\n🔗 ${youtubeData.url}\n\n${summary}\n\n⚠️ 자막 기반 요약을 원하시면 YouTube 자막 API 연동이 필요합니다.`;
        
    } catch (error) {
        console.log(`❌ 유튜브 요약 오류: ${error.message}`);
        
        return `📺 유튜브 영상 요약을 처리할 수 없습니다.\n🔗 ${youtubeData.url}\n\n❌ 문제점:\n• YouTube API 키 미설정 또는 오류\n• Claude AI가 영상을 직접 볼 수 없음\n• 자막 데이터 접근 불가\n\n💡 정확한 요약을 위해서는:\n• YouTube Data API 키 설정 필요\n• 자막 추출 도구 연동 필요\n• 또는 영상을 직접 시청하세요`;
    }
}

// 나무위키 게임 정보 가져오기 함수
async function getNamuWikiGameInfo(gameName) {
    try {
        console.log(`🌳 나무위키에서 "${gameName}" 게임 정보 검색 시작`);
        
        // 나무위키 검색 URL 구성
        const searchUrl = `https://namu.wiki/w/${encodeURIComponent(gameName)}`;
        
        // 웹 페이지 요청
        const response = await axios.get(searchUrl, {
            timeout: 5000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        
        if (response.status === 200 && response.data) {
            const html = response.data;
            
            // 기본 정보 추출 (간단한 텍스트 추출)
            let gameInfo = '';
            
            // 제목 추출
            const titleMatch = html.match(/<title>([^<]+)<\/title>/);
            if (titleMatch) {
                gameInfo += `🎮 ${titleMatch[1].replace(' - 나무위키', '')}\n\n`;
            }
            
            // 첫 번째 문단 추출 (개요)
            const contentMatch = html.match(/<div[^>]*class="[^"]*wiki-content[^"]*"[^>]*>([\s\S]*?)<\/div>/);
            if (contentMatch) {
                let content = contentMatch[1];
                
                // HTML 태그 제거
                content = content.replace(/<[^>]*>/g, '');
                
                // 특수 문자 디코딩
                content = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
                
                // 불필요한 공백 제거
                content = content.replace(/\s+/g, ' ').trim();
                
                // 첫 500자만 추출
                if (content.length > 500) {
                    content = content.substring(0, 500) + '...';
                }
                
                if (content) {
                    gameInfo += `📝 개요:\n${content}\n\n`;
                }
            }
            
            gameInfo += `🔗 자세한 정보: ${searchUrl}`;
            
            console.log(`✅ 나무위키 "${gameName}" 정보 추출 완료: ${gameInfo.length}자`);
            return gameInfo;
            
        } else {
            console.log(`❌ 나무위키 "${gameName}" 페이지 응답 실패`);
            return null;
        }
        
    } catch (error) {
        console.log(`❌ 나무위키 "${gameName}" 정보 추출 오류:`, error.message);
        
        // 대안: 나무위키 검색 결과 페이지로 안내
        const searchQuery = encodeURIComponent(gameName);
        return `🌳 나무위키에서 "${gameName}" 정보를 찾을 수 없습니다.\n\n🔍 직접 검색해보세요:\nhttps://namu.wiki/Search?q=${searchQuery}\n\n나무위키는 게임 정보가 매우 상세하게 정리되어 있습니다.`;
    }
}

// 한국 시간 가져오기 함수
function getKoreanDateTime() {
    const now = new Date();
    const formatted = now.toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }) + ' ' + now.toLocaleTimeString('ko-KR', {
        timeZone: 'Asia/Seoul',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    
    return {
        formatted: formatted
    };
}

// 스마트 메시지 분할 시스템
function smartSplit(text, maxLength = 1500) {
    if (text.length <= maxLength) return [text];
    
    const sentences = text.split(/([.!?]\s+)/);
    const chunks = [];
    let currentChunk = '';
    
    for (let i = 0; i < sentences.length; i++) {
        const part = sentences[i];
        const testChunk = currentChunk + part;
        
        if (testChunk.length > maxLength - 100) {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
                currentChunk = part;
            } else {
                const forceSplit = part.match(/.{1,600}/g) || [part];
                for (let j = 0; j < forceSplit.length; j++) {
                    if (j === 0) {
                        chunks.push(forceSplit[j] + '...');
                    } else if (j === forceSplit.length - 1) {
                        currentChunk = '...' + forceSplit[j];
                    } else {
                        chunks.push('...' + forceSplit[j] + '...');
                    }
                }
            }
        } else {
            currentChunk = testChunk;
        }
    }
    
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
}

// 대화 메모리 시스템
const pendingMessages = new Map();
const conversationMemory = new Map(); // 사용자별 대화 히스토리
const userPatterns = new Map(); // 사용자별 패턴 분석

// 대화 컨텍스트 구조
function createUserContext(userId) {
    return {
        history: [], // 최근 10개 메시지
        patterns: {
            questionCount: 0,
            complaintCount: 0,
            casualChatCount: 0,
            topicsOfInterest: new Set(),
            preferredResponseStyle: 'detailed', // detailed, brief, friendly
            lastEmotionalState: 'neutral', // happy, frustrated, curious, neutral
            sessionStartTime: Date.now()
        },
        lastInteraction: Date.now()
    };
}

// 대화 히스토리 추가
function addToConversationHistory(userId, userMessage, botResponse, intent = 'unknown') {
    if (!conversationMemory.has(userId)) {
        conversationMemory.set(userId, createUserContext(userId));
    }
    
    const context = conversationMemory.get(userId);
    
    // 최근 10개만 유지
    context.history.push({
        timestamp: Date.now(),
        userMessage: userMessage,
        botResponse: botResponse.substring(0, 200) + '...', // 응답 요약
        intent: intent,
        messageType: classifyMessageType(userMessage)
    });
    
    if (context.history.length > 10) {
        context.history.shift();
    }
    
    // 패턴 업데이트
    updateUserPatterns(userId, userMessage, intent);
    context.lastInteraction = Date.now();
    
    console.log(`💭 대화 히스토리 저장: ${userId} (총 ${context.history.length}개 메시지)`);
}

// 메시지 타입 분류
function classifyMessageType(message) {
    if (/\?|어떻게|뭐|언제|어디|왜|누구/.test(message)) return 'question';
    if (/똑똑|정신차려|먹통|화나|짜증|답답/.test(message)) return 'complaint';
    if (/고마워|감사|좋아|훌륭|완벽/.test(message)) return 'praise';
    if (/안녕|hi|hello|좋은|날씨/.test(message)) return 'casual';
    return 'request';
}

// 사용자 패턴 업데이트
function updateUserPatterns(userId, message, intent) {
    if (!userPatterns.has(userId)) {
        userPatterns.set(userId, { questionCount: 0, complaintCount: 0, casualChatCount: 0, topicsOfInterest: new Set() });
    }
    
    const patterns = userPatterns.get(userId);
    
    // 카운트 업데이트
    if (intent === 'question') patterns.questionCount++;
    if (intent === 'complaint') patterns.complaintCount++;
    if (intent === 'casual') patterns.casualChatCount++;
    
    // 관심 주제 추출
    const topics = extractTopics(message);
    topics.forEach(topic => patterns.topicsOfInterest.add(topic));
}

// 관심 주제 추출
function extractTopics(message) {
    const topics = [];
    if (/게임|플레이/.test(message)) topics.push('게임');
    if (/영화|드라마/.test(message)) topics.push('영화');
    if (/맛집|음식|식당/.test(message)) topics.push('음식');
    if (/뉴스|정치|사회/.test(message)) topics.push('뉴스');
    if (/쇼핑|구매|상품/.test(message)) topics.push('쇼핑');
    if (/맥미니|아이폰|맥북|애플/.test(message)) topics.push('애플제품');
    return topics;
}

// 컨텍스트 기반 의도 추론 엔진
function analyzeMessageWithContext(userId, currentMessage) {
    const context = conversationMemory.get(userId);
    
    if (!context) {
        // 첫 대화 - 기본 분석
        return {
            intent: classifyBasicIntent(currentMessage),
            confidence: 0.7,
            responseStyle: 'friendly',
            needsGuidance: false,
            contextInsight: 'first_interaction'
        };
    }
    
    const recentHistory = context.history.slice(-3); // 최근 3개 메시지
    const messageType = classifyMessageType(currentMessage);
    
    // 컨텍스트 기반 의도 분석
    let intent = classifyBasicIntent(currentMessage);
    let confidence = 0.7;
    let needsGuidance = false;
    let responseStyle = 'detailed';
    
    // 연속된 불만 패턴 감지
    if (messageType === 'complaint') {
        const recentComplaints = recentHistory.filter(h => h.messageType === 'complaint').length;
        if (recentComplaints >= 2) {
            confidence = 0.9;
            responseStyle = 'apologetic_helpful';
            intent = 'frustrated_user_needs_help';
        }
    }
    
    // 질문이 아닌 것에 대한 안내 필요성 판단
    if (!isActualQuestion(currentMessage) && !isSpecificRequest(currentMessage)) {
        needsGuidance = true;
        intent = 'needs_guidance';
        confidence = 0.8;
    }
    
    // 사용자 패턴 기반 스타일 조정
    const patterns = userPatterns.get(userId);
    if (patterns) {
        if (patterns.complaintCount > patterns.questionCount) {
            responseStyle = 'patient_helpful';
        } else if (patterns.casualChatCount > 0) {
            responseStyle = 'friendly_conversational';
        }
    }
    
    return {
        intent,
        confidence,
        responseStyle,
        needsGuidance,
        contextInsight: buildContextInsight(context, currentMessage),
        userPattern: patterns
    };
}

// 실제 질문인지 판단
function isActualQuestion(message) {
    const questionIndicators = [
        /\?/, // 물음표
        /어떻게|어떤|어디|언제|왜|누구|뭐|몇|얼마/, // 의문사
        /알려줘|검색|찾아|추천|비교|말해줘/, // 요청 동사
        /어때|할만해|좋아|괜찮/, // 평가 요청
        /.*해줘|.*알아|.*봐줘/, // 도움 요청
        /영화평|평점|평가|리뷰|별점/ // 영화 평가 요청
    ];
    
    return questionIndicators.some(pattern => pattern.test(message));
}

// 구체적 요청인지 판단
function isSpecificRequest(message) {
    const requestPatterns = [
        /뉴스|맛집|쇼핑|영화|게임|시간|날씨/, // 구체적 도메인
        /추천|검색|찾아|알려|보여|말해/, // 명확한 동작
        /계속|더보기|다음/, // 시스템 명령
        /영화평|평점|평가|리뷰|별점/ // 영화 평가 요청
    ];
    
    return requestPatterns.some(pattern => pattern.test(message));
}

// 기본 의도 분류
function classifyBasicIntent(message) {
    if (isActualQuestion(message) || isSpecificRequest(message)) return 'question_or_request';
    if (/고마워|감사|좋아|훌륭/.test(message)) return 'praise';
    if (/안녕|hi|hello/.test(message)) return 'greeting';
    if (/똑똑|정신차려|먹통|화나|짜증/.test(message)) return 'complaint';
    return 'unclear_intent';
}

// 컨텍스트 인사이트 생성
function buildContextInsight(context, currentMessage) {
    const recentTopics = new Set();
    context.history.slice(-3).forEach(h => {
        extractTopics(h.userMessage).forEach(topic => recentTopics.add(topic));
    });
    
    return {
        recentTopics: Array.from(recentTopics),
        conversationLength: context.history.length,
        emotionalState: detectEmotionalState(context.history),
        suggestionTopics: generateSuggestions(recentTopics)
    };
}

// 감정 상태 감지
function detectEmotionalState(history) {
    const recent = history.slice(-3);
    const complaintCount = recent.filter(h => h.messageType === 'complaint').length;
    const praiseCount = recent.filter(h => h.messageType === 'praise').length;
    
    if (complaintCount >= 2) return 'frustrated';
    if (praiseCount >= 1) return 'satisfied';
    if (recent.length >= 2) return 'engaged';
    return 'neutral';
}

// 제안 주제 생성
function generateSuggestions(recentTopics) {
    if (recentTopics.has('게임')) return ['새로운 게임 추천', '게임 리뷰 검색'];
    if (recentTopics.has('영화')) return ['최신 영화 정보', '영화 평점 검색'];
    if (recentTopics.has('음식')) return ['다른 지역 맛집', '음식 배달 정보'];
    return ['최신 뉴스', '날씨 정보', '맛집 추천'];
}

// 응답 분할 처리 함수

function handleLongResponse(text, userId, responseType = 'general') {
    const chunks = smartSplit(text, 1500);
    
    if (chunks.length === 1) {
        return { text: chunks[0], hasMore: false };
    }
    
    const firstChunk = chunks[0];
    const remainingChunks = chunks.slice(1).join('\n\n');
    
    pendingMessages.set(userId, remainingChunks);
    
    const responseTypeEmoji = {
        'image': '🖼️',
        'restaurant': '🍽️',
        'news': '📰',
        'shopping': '🛒',
        'general': '💬'
    };
    
    const emoji = responseTypeEmoji[responseType] || '💬';
    const continueText = `\n\n${emoji} "계속" 또는 "더보기"를 입력하면 나머지 내용을 확인할 수 있습니다.`;
    
    console.log(`📄 ${responseType} 응답 분할: 총 ${chunks.length}개 청크, 첫 청크 ${firstChunk.length}자`);
    
    return {
        text: firstChunk + continueText,
        hasMore: true,
        totalChunks: chunks.length
    };
}

// 네이버 뉴스 검색 함수
async function getLatestNews(query = '오늘 뉴스') {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: query,
            display: 10,
            start: 1,
            sort: 'date'
        };
        
        console.log(`📡 네이버 뉴스 검색: "${query}"`);
        
        const response = await axios.get(NAVER_NEWS_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('📰 검색된 뉴스가 없습니다.');
            return null;
        }
        
        console.log(`✅ ${items.length}개의 뉴스를 찾았습니다.`);
        
        return items.slice(0, 5).map(item => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            description: item.description.replace(/<[^>]*>/g, ''),
            link: item.link,
            pubDate: item.pubDate
        }));
        
    } catch (error) {
        console.error('❌ 네이버 뉴스 API 오류:', error.response?.data || error.message);
        return null;
    }
}

// 네이버 쇼핑 검색 함수
async function getShoppingResults(query) {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: query,
            display: 15,  // 더 많이 가져와서 필터링
            start: 1,
            sort: 'price'  // 가격순으로 정렬
        };
        
        console.log(`🛒 네이버 쇼핑 검색: "${query}"`);
        
        const response = await axios.get(NAVER_SHOPPING_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('🛒 검색된 상품이 없습니다.');
            return null;
        }
        
        console.log(`✅ ${items.length}개의 상품을 찾았습니다.`);
        
        return items.slice(0, 5).map((item, index) => ({
            rank: index + 1,
            title: item.title.replace(/<[^>]*>/g, ''),
            price: item.lprice ? `${parseInt(item.lprice).toLocaleString()}원` : '가격정보없음',
            mallName: item.mallName || '쇼핑몰정보없음',
            brand: item.brand || '',
            link: item.link,
            image: item.image,
            productId: item.productId,
            category1: item.category1,
            category2: item.category2
        }));
        
    } catch (error) {
        console.error('❌ 네이버 쇼핑 API 오류:', error.response?.data || error.message);
        return null;
    }
}

// 네이버 지역검색 API로 맛집 가져오기 함수
async function getLocalRestaurants(query) {
    try {
        if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
            console.log('⚠️ 네이버 API 키가 설정되지 않았습니다.');
            return null;
        }
        
        const params = {
            query: query,
            display: 20,  // 필터링을 위해 더 많이 가져옴
            start: 1,
            sort: 'comment'  // 리뷰/댓글 많은 순으로 정렬 (사용자 검색 많은 곳)
        };
        
        console.log(`🍽️ 네이버 지역검색: "${query}"`);
        console.log(`📊 API 요청 파라미터:`, params);
        
        const response = await axios.get(NAVER_LOCAL_API_URL, {
            params: params,
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: TIMEOUT_CONFIG.naver_api
        });
        
        console.log(`📈 API 응답 상태: ${response.status}`);
        console.log(`📊 API 응답 데이터:`, {
            total: response.data.total || 0,
            start: response.data.start || 0,
            display: response.data.display || 0,
            itemsCount: response.data.items?.length || 0
        });
        
        const items = response.data.items;
        if (!items || items.length === 0) {
            console.log('🍽️ 검색된 맛집이 없습니다.');
            console.log(`🔍 API 응답 전체:`, JSON.stringify(response.data, null, 2));
            return null;
        }
        
        console.log(`✅ ${items.length}개의 원본 결과를 받았습니다.`);
        
        // 패스트푸드점 및 체인점 필터링 (설정 파일 기반)
        const filteredItems = items.filter(item => {
            const title = item.title.replace(/<[^>]*>/g, '');
            const category = item.category || '';
            
            // 제외 키워드 체크 (체인점, 패스트푸드)
            const hasExcludeKeyword = config.restaurant_filters.exclude_keywords.some(keyword => 
                title.includes(keyword) || category.includes(keyword)
            );
            
            // 제외 카테고리 체크 (편의점, 마트 등)
            const hasExcludeCategory = config.restaurant_filters.exclude_categories.some(excludeCategory =>
                category.includes(excludeCategory)
            );
            
            // 필터링 결과를 로그로 남김 (디버깅용)
            if (hasExcludeKeyword || hasExcludeCategory) {
                console.log(`🚫 필터링 제외: "${title}" (카테고리: ${category})`);
            }
            
            return !hasExcludeKeyword && !hasExcludeCategory;
        });
        
        console.log(`🔍 필터링 완료: ${items.length}개 → ${filteredItems.length}개 (패스트푸드/체인점 제외)`);
        
        if (filteredItems.length === 0) {
            console.log('🍽️ 필터링 후 맛집이 없습니다.');
            return null;
        }
        
        // 인기도 기준 추가 정렬 (사용자 검색량 기준, 설정 파일 기반)
        const sortedItems = filteredItems.sort((a, b) => {
            const titleA = a.title.replace(/<[^>]*>/g, '');
            const titleB = b.title.replace(/<[^>]*>/g, '');
            
            // 인기 키워드 점수 계산
            const popularKeywordScoreA = config.restaurant_filters.popular_keywords
                .filter(keyword => titleA.includes(keyword)).length;
            const popularKeywordScoreB = config.restaurant_filters.popular_keywords
                .filter(keyword => titleB.includes(keyword)).length;
            
            // 카테고리 우선순위 점수
            const categoryScoreA = config.restaurant_filters.category_priority[a.category] || 0;
            const categoryScoreB = config.restaurant_filters.category_priority[b.category] || 0;
            
            // 총 점수 계산 (인기 키워드 가중치를 높게)
            const totalScoreA = (popularKeywordScoreA * 3) + categoryScoreA;
            const totalScoreB = (popularKeywordScoreB * 3) + categoryScoreB;
            
            return totalScoreB - totalScoreA; // 높은 점수가 우선
        });
        
        console.log(`📊 인기도순 정렬 완료: ${sortedItems.length}개`);
        
        // 첫 번째 결과 샘플 로깅
        if (sortedItems.length > 0) {
            console.log(`🏪 첫 번째 결과 샘플:`, {
                title: sortedItems[0].title?.replace(/<[^>]*>/g, ''),
                category: sortedItems[0].category,
                address: sortedItems[0].address
            });
        }
        
        // 최대 5개까지 반환
        return sortedItems.slice(0, 5).map(item => ({
            title: item.title.replace(/<[^>]*>/g, ''),
            category: item.category,
            description: item.description ? item.description.replace(/<[^>]*>/g, '') : '',
            telephone: item.telephone || '전화번호 없음',
            address: item.address,
            roadAddress: item.roadAddress,
            mapx: item.mapx,
            mapy: item.mapy,
            link: item.link
        }));
        
    } catch (error) {
        console.error('❌ 네이버 지역검색 API 오류:', error.response?.data || error.message);
        console.error('🔍 오류 세부사항:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data
        });
        return null;
    }
}

// 요청 분석 함수들
function isNewsRequest(message) {
    return config.news.some(keyword => message.includes(keyword));
}

function isShoppingRequest(message) {
    const hasShoppingKeyword = config.shopping.general.some(keyword => message.includes(keyword));
    const hasProductKeyword = config.shopping.products.some(keyword => message.includes(keyword));
    const hasRestaurantKeyword = config.restaurant.food.some(keyword => message.includes(keyword));
    
    // 제품 추천의 경우: "제품명 + 추천" 형태
    const hasProductRecommend = hasProductKeyword && message.includes('추천');
    
    // 가격 비교 요청: "제일 싼곳", "저렴한", "가격", "어디서 사야" 등
    const hasPriceKeyword = config.shopping.price_keywords.some(keyword => message.includes(keyword));
    
    // 특정 제품명이 포함된 경우 (맥미니, 아이폰 등)
    const hasSpecificProduct = config.shopping.products.some(product => message.includes(product));
    
    // 리뷰/평가 관련 질문은 쇼핑이 아닌 Claude AI로 처리
    const isReviewQuestion = config.shopping.review_keywords.some(keyword => message.includes(keyword));
    
    // 명확한 쇼핑 의도가 있고, 리뷰 질문이 아니며, 맛집 키워드가 없는 경우만 쇼핑 검색
    const hasShoppingIntent = hasShoppingKeyword || hasProductRecommend || (hasPriceKeyword && hasSpecificProduct);
    
    return hasShoppingIntent && !isReviewQuestion && !hasRestaurantKeyword;
}

function isRestaurantRequest(message) {
    const hasRestaurantKeyword = config.restaurant.food.some(keyword => message.includes(keyword));
    
    // 기존 지역 키워드 확인
    const allLocationKeywords = [
        ...config.restaurant.locations.seoul,
        ...config.restaurant.locations.gyeonggi,
        ...config.restaurant.locations.major_cities,
        ...config.restaurant.locations.general
    ];
    const hasLocationKeyword = allLocationKeywords.some(keyword => message.includes(keyword));
    
    // 지능형 지역 패턴 매칭 (구, 동, 시, 군, 읍, 면, 역 등)
    const locationPatterns = [
        /\w+구(?:\s|$)/,     // OO구 (예: 강북구, 서초구)
        /\w+동(?:\s|$)/,     // OO동 (예: 번3동, 역삼동)
        /\w+시(?:\s|$)/,     // OO시 (예: 성남시, 고양시)
        /\w+군(?:\s|$)/,     // OO군 (예: 양평군)
        /\w+읍(?:\s|$)/,     // OO읍 (예: 진접읍)
        /\w+면(?:\s|$)/,     // OO면 (예: 청평면)
        /\w+역(?:\s|$)/,     // OO역 (예: 강남역, 홍대입구역)
        /\w+대(?:\s|$)/,     // OO대 (예: 연세대, 고려대)
        /\w+로(?:\s|$)/,     // OO로 (예: 테헤란로, 강남대로)
        /\w+거리(?:\s|$)/,   // OO거리 (예: 명동거리, 인사동거리)
        /\w+타운(?:\s|$)/,   // OO타운 (예: 이태원, 강남타운)
        /\w+단지(?:\s|$)/,   // OO단지 (예: 분당신도시, 일산신도시)
    ];
    
    const hasLocationPattern = locationPatterns.some(pattern => pattern.test(message));
    
    const hasExcludeKeyword = config.exclude.shopping_from_restaurant.some(keyword => message.includes(keyword));
    
    return hasRestaurantKeyword && (hasLocationKeyword || hasLocationPattern) && !hasExcludeKeyword;
}

// Basic health check
app.get('/', (req, res) => {
    const koreanTime = getKoreanDateTime();
    const hasClaudeApiKey = !!process.env.CLAUDE_API_KEY;
    const hasNaverClientId = !!process.env.NAVER_CLIENT_ID;
    const hasNaverClientSecret = !!process.env.NAVER_CLIENT_SECRET;
    
    res.send(`
        <h1>🤖 카카오 챗봇 Claude AI 서버</h1>
        <p><strong>상태:</strong> 정상 실행 중</p>
        <p><strong>현재 시간:</strong> ${koreanTime.formatted}</p>
        <p><strong>Claude AI API:</strong> ${hasClaudeApiKey ? '✅ 설정됨' : '❌ 미설정'}</p>
        <p><strong>네이버 검색 API:</strong> ${(hasNaverClientId && hasNaverClientSecret) ? '✅ 설정됨' : '❌ 미설정'}</p>
        <p><strong>Client ID:</strong> ${hasNaverClientId ? '✅ 설정됨' : '❌ 미설정'}</p>
        <p><strong>Client Secret:</strong> ${hasNaverClientSecret ? '✅ 설정됨' : '❌ 미설정'}</p>
        <hr>
        <p><strong>카카오 스킬 URL:</strong> /kakao-skill-webhook</p>
        <hr>
        <p><strong>기능:</strong></p>
        <ul>
            <li>🤖 Claude AI 답변 (M4 vs M2 성능비교 등)</li>
            <li>📰 실시간 뉴스 제공 (예: "오늘 뉴스", "최신 뉴스")</li>
            <li>🛒 쇼핑 상품 검색 (예: "노트북 추천", "휴대폰 베스트")</li>
            <li>🍽️ 맛집 검색 (예: "강남역 맛집", "홍대 카페")</li>
            <li>💬 긴 답변 자동 분할 및 "계속" 기능</li>
        </ul>
    `);
});

// Main webhook endpoint with Claude AI integration
app.post('/kakao-skill-webhook', async (req, res) => {
    console.log('🔔 카카오 웹훅 요청 받음!');
    console.log('요청 본문:', JSON.stringify(req.body, null, 2));
    
    try {
        const userMessage = req.body.userRequest?.utterance || '';
        const userId = req.body.userRequest?.user?.id || 'anonymous';
        console.log(`💬 사용자 메시지: '${userMessage}' (ID: ${userId})`);
        
        if (!userMessage) {
            const response = {
                version: "2.0",
                template: {
                    outputs: [{
                        simpleText: {
                            text: "메시지를 입력해주세요."
                        }
                    }]
                }
            };
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.status(200).json(response);
            return;
        }
        
        const koreanTime = getKoreanDateTime();
        console.log(`🕐 현재 한국 시간: ${koreanTime.formatted}`);
        
        // 키워드 감지 디버깅
        const debugInfo = {
            isNews: isNewsRequest(userMessage),
            isShopping: isShoppingRequest(userMessage), 
            isRestaurant: isRestaurantRequest(userMessage),
            isReviewQuestion: config.shopping.review_keywords.some(keyword => userMessage.includes(keyword)),
            isFactCheck: isFactCheckRequest(userMessage),
            isYouTubeSummary: isYouTubeSummaryRequest(userMessage),
            isMovieReview: isMovieReviewRequest(userMessage),
            youtubeUrl: extractYouTubeUrl(userMessage),
            message: userMessage
        };
        
        // 맛집 요청인 경우 추가 디버깅 정보
        if (debugInfo.isRestaurant) {
            const hasRestaurantKeyword = config.restaurant.food.some(keyword => userMessage.includes(keyword));
            const allLocationKeywords = [
                ...config.restaurant.locations.seoul,
                ...config.restaurant.locations.gyeonggi,
                ...config.restaurant.locations.major_cities,
                ...config.restaurant.locations.general
            ];
            const hasLocationKeyword = allLocationKeywords.some(keyword => userMessage.includes(keyword));
            
            const locationPatterns = [
                /\w+구(?:\s|$)/,     // OO구
                /\w+동(?:\s|$)/,     // OO동
                /\w+시(?:\s|$)/,     // OO시
                /\w+군(?:\s|$)/,     // OO군
                /\w+읍(?:\s|$)/,     // OO읍
                /\w+면(?:\s|$)/,     // OO면
                /\w+역(?:\s|$)/,     // OO역
                /\w+로(?:\s|$)/,     // OO로
                /\w+거리(?:\s|$)/,   // OO거리
            ];
            const hasLocationPattern = locationPatterns.some(pattern => pattern.test(userMessage));
            
            debugInfo.restaurantDebug = {
                hasRestaurantKeyword,
                hasLocationKeyword, 
                hasLocationPattern,
                foundRestaurantKeywords: config.restaurant.food.filter(keyword => userMessage.includes(keyword)),
                foundLocationKeywords: allLocationKeywords.filter(keyword => userMessage.includes(keyword)),
                locationPatternMatches: locationPatterns.filter(pattern => pattern.test(userMessage)).map(pattern => pattern.toString())
            };
        }
        
        console.log(`🔍 키워드 감지 결과:`, debugInfo);
        
        let responseText;
        
        // 🧠 컨텍스트 기반 의도 분석 (대화 메모리 활용)
        const analysis = analyzeMessageWithContext(userId, userMessage);
        console.log(`🧠 의도 분석 결과:`, analysis);
        
        // 컨텍스트 기반 응답 생성
        if (analysis.needsGuidance) {
            // 질문이 아닌 경우 → 안내 메시지
            const suggestions = analysis.contextInsight.suggestionTopics || ['뉴스 검색', '맛집 추천', '날씨 정보'];
            
            responseText = `💬 무엇을 도와드릴까요?\n\n🎯 이런 걸 물어보실 수 있어요:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n✨ 또는 자유롭게 질문해주세요!\n• 뉴스, 맛집, 쇼핑 검색\n• 영화 평점, 게임 정보\n• 일반적인 질문도 환영!`;
            
            // 대화 히스토리에 저장
            addToConversationHistory(userId, userMessage, responseText, analysis.intent);
        }
        else if (analysis.intent === 'frustrated_user_needs_help') {
            // 연속된 불만 → 특별한 도움 제공
            console.log('😅 연속된 불만 감지 - 맞춤형 도움 제공');
            
            const helpfulResponses = [
                `😊 계속 도움이 안 되는 것 같아 죄송해요!\n\n🎯 정확히 뭘 찾고 계신가요?\n• "홍대 맛집" - 맛집 정보\n• "오늘 뉴스" - 최신 뉴스\n• "아이폰 가격" - 쇼핑 정보\n\n💪 구체적으로 말씀해주시면 바로 도와드릴게요!`,
                
                `🤗 제가 이해를 못한 것 같네요!\n\n💡 이렇게 질문해주시면 도움이 될 거예요:\n• 구체적인 키워드로 (예: "강남 카페")\n• 원하는 정보 명시 (예: "영화 평점")\n• 간단명료하게 (예: "오늘 날씨")\n\n✨ 다시 시도해보세요!`
            ];
            
            responseText = helpfulResponses[Math.floor(Math.random() * helpfulResponses.length)];
            addToConversationHistory(userId, userMessage, responseText, analysis.intent);
        }
        // 간단한 인사나 기본 질문 처리
        else if (userMessage.includes('안녕') || userMessage.includes('hi') || userMessage.includes('hello')) {
            responseText = `안녕하세요! 현재 시간은 ${koreanTime.formatted}입니다. 무엇을 도와드릴까요?`;
        }
        // 즉시 응답 가능한 간단한 질문들
        else if (/시간|몇시|지금/.test(userMessage)) {
            responseText = `🕐 현재 시간: ${koreanTime.formatted}\n\n📅 오늘 날짜: ${koreanTime.date}\n\n⚡ 빠른 응답 모드로 답변드렸어요!`;
        }
        // 날씨 요청 처리
        else if (/날씨|기온|비|눈|맑음|흐림|온도/.test(userMessage)) {
            console.log('🌤️ 날씨 요청 감지됨');
            
            // 지역 추출
            let location = '서울';
            const locationMatch = userMessage.match(/([가-힣]+)(?:\s+)?날씨/);
            if (locationMatch) {
                location = locationMatch[1];
            }
            
            responseText = `🌤️ "${location}" 날씨 정보\n\n⚠️ 실시간 날씨 API 연동이 아직 준비 중입니다.\n\n💡 정확한 날씨 정보는:\n• 네이버 날씨 검색\n• 기상청 날씨누리\n• 스마트폰 날씨 앱\n\n에서 확인해주세요!\n\n🔧 곧 실시간 날씨 정보 제공 예정입니다.`;
            
            addToConversationHistory(userId, userMessage, responseText, 'weather_request');
        }
        else if (/고마워|감사|ㄱㅅ|thanks/.test(userMessage)) {
            const thankResponses = [
                `😊 천만에요! 도움이 되었다니 기뻐요!\n\n💪 앞으로도 더 나은 서비스로 보답하겠습니다!`,
                `🙏 별말씀을요! 언제든 궁금한 게 있으면 물어보세요!\n\n✨ 저는 항상 여기 있어요!`,
                `😄 네! 도움이 되어서 다행이에요!\n\n🎯 다음에도 필요한 게 있으면 바로 말씀해주세요!`
            ];
            responseText = thankResponses[Math.floor(Math.random() * thankResponses.length)];
        }
        else if (/괜찮아|좋아|잘해|훌륭|완벽/.test(userMessage)) {
            const praiseResponses = [
                `😊 와! 칭찬해주셔서 감사해요!\n\n💪 더 열심히 해서 항상 만족스러운 답변 드릴게요!`,
                `🥰 그렇게 말씀해주시니 힘이 나네요!\n\n⚡ 앞으로도 빠르고 정확한 정보로 도와드리겠습니다!`,
                `😄 칭찬 감사드려요! 정말 기뻐요!\n\n🎯 계속 발전하는 AI가 되도록 노력하겠습니다!`
            ];
            responseText = praiseResponses[Math.floor(Math.random() * praiseResponses.length)];
        }
        // 유튜브 요약 요청 처리
        else if (isYouTubeSummaryRequest(userMessage)) {
            console.log('📺 유튜브 요약 요청 감지됨');
            const youtubeData = extractYouTubeUrl(userMessage);
            
            if (youtubeData) {
                responseText = await getYouTubeSummary(youtubeData);
            } else {
                responseText = `📺 유튜브 URL을 찾을 수 없습니다.\n\n💡 올바른 형식:\n• https://www.youtube.com/watch?v=VIDEO_ID\n• https://youtu.be/VIDEO_ID\n\n다시 시도해주세요.`;
            }
        }
        // 영화 평가 요청 처리
        else if (isMovieReviewRequest(userMessage)) {
            console.log('🎬 영화 평가 요청 감지됨');
            
            // 영화 제목 추출 (평가 관련 키워드 제거)
            let movieTitle = userMessage
                .replace(/영화평|평점|평가|리뷰|별점|평좀|해줘|좀|어때|어떤지|볼만해|재밌어|봤어|본|생각|의견|말해줘|말해|알려줘|알려|보여줘|보여/g, '')
                .trim();
            
            // 빈 제목 처리
            if (!movieTitle || movieTitle.length < 2) {
                responseText = `🎬 영화 평가를 위해 영화 제목을 알려주세요!\n\n💡 올바른 형식:\n• "탑건 영화평"\n• "어벤져스 평점"\n• "기생충 어때?"\n\n다시 시도해주세요.`;
            } else {
                responseText = await getMovieReview(movieTitle);
            }
        }
        // 사실 확인 요청 (뉴스 검색으로 처리) - 시간 질문보다 우선
        else if (isFactCheckRequest(userMessage)) {
            console.log('🔍 사실 확인 요청 감지됨 - 스마트 뉴스 검색으로 처리');
            
            // 핵심 키워드 추출 (인명, 주요 단어)
            let searchKeywords = [];
            
            // 1. 인명 추출 (한글 인명 패턴)
            const nameMatches = userMessage.match(/([가-힣]{2,4})/g);
            if (nameMatches) {
                nameMatches.forEach(name => {
                    if (name.length >= 2 && !['오늘', '사실', '여부', '알려', '사망했어'].includes(name)) {
                        searchKeywords.push(name);
                    }
                });
            }
            
            // 2. 영문 인명 추출 (헐크호건 등)
            const englishNameMatches = userMessage.match(/([A-Za-z가-힣]{3,})/g);
            if (englishNameMatches) {
                englishNameMatches.forEach(name => {
                    if (name.length >= 3 && !['the', 'and', 'for', '사실', '여부', '알려'].includes(name.toLowerCase())) {
                        searchKeywords.push(name);
                    }
                });
            }
            
            // 3. 중복 제거 및 정리
            searchKeywords = [...new Set(searchKeywords)]; // 중복 제거
            
            // 3. 사실 확인 키워드 추가
            if (userMessage.includes('사망') || userMessage.includes('죽음')) {
                searchKeywords.push('사망');
            }
            if (userMessage.includes('결혼')) {
                searchKeywords.push('결혼');
            }
            if (userMessage.includes('체포') || userMessage.includes('검거')) {
                searchKeywords.push('체포');
            }
            
            console.log(`🔍 추출된 검색 키워드: ${searchKeywords.join(', ')}`);
            
            // API 연결 상태 확인
            if (!NAVER_CLIENT_ID || !NAVER_CLIENT_SECRET) {
                responseText = `❌ 네이버 뉴스 API 설정이 필요합니다.\n\n관리자가 API 키를 확인 중입니다.\n\n💡 임시 확인 방법:\n• 네이버 뉴스에서 직접 검색\n• 구글 뉴스에서 확인`;
                console.log('❌ 네이버 API 키가 설정되지 않았습니다.');
            } else {
                console.log(`✅ 네이버 API 키 상태: 설정됨 (${NAVER_CLIENT_ID.length}자)`);
                
                let newsResults = null;
                let searchTerm = '';
                
                // 4. 다단계 검색 시도
                for (const keyword of searchKeywords) {
                    searchTerm = keyword;
                    console.log(`🔍 "${searchTerm}" 검색 시도...`);
                    newsResults = await getLatestNews(searchTerm);
                    
                    if (newsResults && newsResults.length > 0) {
                        console.log(`✅ "${searchTerm}" 검색 성공: ${newsResults.length}개 결과`);
                        break;
                    } else {
                        console.log(`❌ "${searchTerm}" 검색 결과 없음`);
                    }
                }
            
                // 5. 조합 검색 시도 (단일 키워드 실패 시)
                if ((!newsResults || newsResults.length === 0) && searchKeywords.length >= 2) {
                    searchTerm = searchKeywords.slice(0, 2).join(' ');
                    console.log(`🔍 조합 검색 시도: "${searchTerm}"`);
                    newsResults = await getLatestNews(searchTerm);
                }
                
                // 6. 범용 대안 검색 시도 (더 넓은 키워드로)
                if ((!newsResults || newsResults.length === 0) && searchKeywords.length > 0) {
                    const mainKeyword = searchKeywords[0];
                    const alternatives = [];
                    
                    // 사망 관련 질문인 경우 대안 검색어
                    if (userMessage.includes('사망') || userMessage.includes('죽음')) {
                        alternatives.push(
                            `${mainKeyword} 부고`,
                            `${mainKeyword} 별세`,
                            `${mainKeyword} 타계`,
                            mainKeyword // 인명만으로도 검색
                        );
                    }
                    // 결혼 관련
                    else if (userMessage.includes('결혼')) {
                        alternatives.push(
                            `${mainKeyword} 웨딩`,
                            `${mainKeyword} 혼인`,
                            mainKeyword
                        );
                    }
                    // 사고 관련
                    else if (userMessage.includes('사고') || userMessage.includes('체포')) {
                        alternatives.push(
                            `${mainKeyword} 사건`,
                            `${mainKeyword} 논란`,
                            mainKeyword
                        );
                    }
                    // 기본: 인명만으로 검색
                    else {
                        alternatives.push(mainKeyword);
                    }
                    
                    for (const alt of alternatives) {
                        console.log(`🔍 대안 검색 시도: "${alt}"`);
                        newsResults = await getLatestNews(alt);
                        if (newsResults && newsResults.length > 0) {
                            searchTerm = alt;
                            console.log(`✅ 대안 검색 "${alt}" 성공: ${newsResults.length}개 결과`);
                            break;
                        }
                    }
                }
                
                if (newsResults && newsResults.length > 0) {
                    let factCheckText = `🔍 "${searchTerm}" 관련 최신 뉴스\n\n`;
                    newsResults.slice(0, 5).forEach((news, index) => {
                        factCheckText += `${index + 1}. ${news.title}\n${news.description}\n🕐 ${news.pubDate}\n🔗 ${news.link}\n\n`;
                    });
                    
                    if (factCheckText.length > config.limits.message_max_length) {
                        factCheckText = factCheckText.substring(0, config.limits.message_truncate_length) + '...\n\n📰 더 자세한 정보는 네이버 뉴스에서 확인하세요.';
                    }
                    
                    responseText = factCheckText;
                } else {
                    const mainKeyword = searchKeywords[0] || '관련 인물';
                    responseText = `🔍 "${searchKeywords.join(', ')}" 관련 최신 뉴스를 찾을 수 없습니다.\n\n💡 확인 방법:\n• 네이버 뉴스에서 "${mainKeyword}" 직접 검색\n• 구글 뉴스에서 검색\n• 공식 소스나 신뢰할 수 있는 언론사 확인\n\n📊 네이버 API 연결 상태: ${NAVER_CLIENT_ID ? '정상' : '오류'}\n\n최신 뉴스가 없다는 것은 해당 사실이 발생하지 않았을 가능성이 높습니다.`;
                }
            }
        }
        // 시간 관련 질문 (사실 확인 키워드가 없는 경우에만)
        else if ((userMessage.includes('시간') || userMessage.includes('날짜') || userMessage.includes('오늘') || userMessage.includes('지금')) && !isFactCheckRequest(userMessage)) {
            const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
            const now = new Date();
            const koreaDate = new Date(now.toLocaleString('en-US', {timeZone: 'Asia/Seoul'}));
            const dayOfWeek = dayNames[koreaDate.getDay()];
            responseText = `현재 한국 시간: ${koreanTime.formatted} ${dayOfWeek}입니다.`;
        }
        // 네이버 뉴스 검색
        else if (isNewsRequest(userMessage)) {
            console.log('📰 뉴스 요청 감지됨');
            const newsResults = await getLatestNews(userMessage);
            
            if (newsResults && newsResults.length > 0) {
                let newsText = `📰 최신 뉴스 (${newsResults.length}개)\n\n`;
                newsResults.forEach((news, index) => {
                    newsText += `${index + 1}. ${news.title}\n${news.description}\n🔗 ${news.link}\n\n`;
                });
                
                if (newsText.length > config.limits.message_max_length) {
                    newsText = newsText.substring(0, config.limits.message_truncate_length) + '...\n\n더 많은 뉴스는 네이버에서 확인하세요.';
                }
                
                responseText = newsText;
            } else {
                responseText = '죄송합니다. 현재 뉴스를 가져올 수 없습니다. 잠시 후 다시 시도해주세요.';
            }
        }
        // 네이버 쇼핑 검색
        else if (isShoppingRequest(userMessage)) {
            console.log('🛒 쇼핑 요청 감지됨');
            
            let searchQuery = userMessage;
            let foundProducts = [];
            
            config.shopping.products.forEach(keyword => {
                if (userMessage.includes(keyword)) {
                    foundProducts.push(keyword);
                }
            });
            
            if (foundProducts.length > 0) {
                searchQuery = foundProducts.join(' ');
            } else {
                searchQuery = userMessage.replace(/추천|상품|제품|쇼핑|구매|베스트|인기|랭킹|순위|어떤|좋은/g, '').trim();
            }
            
            const shoppingResults = await getShoppingResults(searchQuery);
            
            if (shoppingResults && shoppingResults.length > 0) {
                // 가격 중심의 쇼핑 검색 결과 표시
                const hasPriceRequest = config.shopping.price_keywords.some(keyword => userMessage.includes(keyword));
                
                let shoppingText;
                if (hasPriceRequest) {
                    shoppingText = `💰 "${searchQuery}" 최저가 검색 결과 (가격순)\n\n`;
                } else {
                    shoppingText = `🛒 "${searchQuery}" 쇼핑 검색 결과\n\n`;
                }
                
                shoppingResults.slice(0, config.limits.search_results_count).forEach((product, index) => {
                    // 가격을 더 눈에 띄게 표시
                    const priceDisplay = product.price !== '가격정보없음' ? `💰 ${product.price}` : '💰 가격문의';
                    shoppingText += `${index + 1}. ${product.title}\n${priceDisplay}\n🏪 ${product.mallName}\n🔗 ${product.link}\n\n`;
                });
                
                if (shoppingText.length > config.limits.message_max_length) {
                    shoppingText = shoppingText.substring(0, config.limits.message_truncate_length) + '...\n\n더 많은 상품은 네이버쇼핑에서 확인하세요.';
                }
                
                responseText = shoppingText;
            } else {
                responseText = `"${searchQuery}" 관련 상품을 찾을 수 없습니다. 다른 키워드로 다시 검색해보세요.`;
            }
        }
        // 네이버 지역검색 (맛집)
        else if (isRestaurantRequest(userMessage)) {
            console.log('🍽️ 맛집 요청 감지됨');
            
            // 검색 쿼리 최적화: 지역명 추출 및 검색어 개선
            let searchQuery = userMessage;
            let foundLocation = null;
            
            // 1. 기존 키워드 방식으로 지역명 찾기
            const allLocationKeywords = [
                ...config.restaurant.locations.seoul,
                ...config.restaurant.locations.gyeonggi,
                ...config.restaurant.locations.major_cities,
                ...config.restaurant.locations.general
            ];
            
            foundLocation = allLocationKeywords.find(location => userMessage.includes(location));
            
            // 2. 패턴 매칭으로 지역명 추출 (구, 동, 시 등)
            if (!foundLocation) {
                const locationPatterns = [
                    /(\w+구)(?:\s|맛집|식당|음식점)/,     // OO구
                    /(\w+동)(?:\s|맛집|식당|음식점)/,     // OO동  
                    /(\w+시)(?:\s|맛집|식당|음식점)/,     // OO시
                    /(\w+군)(?:\s|맛집|식당|음식점)/,     // OO군
                    /(\w+읍)(?:\s|맛집|식당|음식점)/,     // OO읍
                    /(\w+면)(?:\s|맛집|식당|음식점)/,     // OO면
                    /(\w+역)(?:\s|맛집|식당|음식점)/,     // OO역
                    /(\w+로)(?:\s|맛집|식당|음식점)/,     // OO로
                    /(\w+거리)(?:\s|맛집|식당|음식점)/,   // OO거리
                ];
                
                for (const pattern of locationPatterns) {
                    const match = userMessage.match(pattern);
                    if (match) {
                        foundLocation = match[1];
                        break;
                    }
                }
            }
            
            // 3. 검색 쿼리 구성
            if (foundLocation) {
                // 지역명이 있으면 "지역명 + 맛집"으로 검색
                searchQuery = `${foundLocation} 맛집`;
                console.log(`🔍 최적화된 검색어: "${searchQuery}" (원본: "${userMessage}", 추출된 지역: "${foundLocation}")`);
            } else {
                // 지역명을 못 찾았으면 원본 메시지 그대로 사용
                console.log(`🔍 지역명 추출 실패, 원본 검색어 사용: "${searchQuery}"`);
            }
            
            const restaurantResults = await getLocalRestaurants(searchQuery);
            
            if (restaurantResults && restaurantResults.length > 0) {
                // 첫 번째 검색 성공
                const displayLocation = foundLocation || userMessage.replace(/\s+(맛집|식당|음식점).*$/, '');
                let restaurantText = `🍽️ "${displayLocation}" 맛집 검색 결과\n\n`;
                
                restaurantResults.slice(0, config.limits.search_results_count).forEach((restaurant, index) => {
                    restaurantText += `${index + 1}. ${restaurant.title}\n📍 ${restaurant.address}\n📞 ${restaurant.telephone}\n🏷️ ${restaurant.category}\n🔗 ${restaurant.link}\n\n`;
                });
                
                if (restaurantText.length > config.limits.message_max_length) {
                    restaurantText = restaurantText.substring(0, config.limits.message_truncate_length) + '...\n\n더 많은 맛집은 네이버에서 확인하세요.';
                }
                
                responseText = restaurantText;
            } else {
                // 첫 번째 검색 실패 시 다양한 방법으로 재시도
                console.log(`🔄 첫 번째 검색 실패, 스마트 재시도 시작...`);
                
                let retryResults = null;
                let retryQuery = userMessage;
                let retryAttempts = [];
                
                if (foundLocation) {
                    // 지역명 변형 생성 (구 제거, 축약형 등)
                    const locationVariations = [foundLocation];
                    
                    // "OO구" → "OO" 변형
                    if (foundLocation.endsWith('구')) {
                        locationVariations.push(foundLocation.replace('구', ''));
                    }
                    
                    // "OO동" → "OO" 변형  
                    if (foundLocation.endsWith('동')) {
                        locationVariations.push(foundLocation.replace('동', ''));
                    }
                    
                    // 각 지역명 변형에 대해 다양한 키워드로 시도
                    for (const location of locationVariations) {
                        const searchTerms = ['맛집', '식당', '음식점', ''];
                        
                        for (const term of searchTerms) {
                            if (retryResults && retryResults.length > 0) break;
                            
                            retryQuery = term ? `${location} ${term}` : location;
                            console.log(`🔍 재시도: "${retryQuery}"`);
                            retryAttempts.push(retryQuery);
                            
                            retryResults = await getLocalRestaurants(retryQuery);
                            
                            if (retryResults && retryResults.length > 0) {
                                console.log(`✅ 성공한 검색어: "${retryQuery}"`);
                                break;
                            }
                        }
                        
                        if (retryResults && retryResults.length > 0) break;
                    }
                    
                    // 여전히 실패하면 더 넓은 범위로 시도
                    if (!retryResults || retryResults.length === 0) {
                        // "강북구 번3동" → 다양한 조합 시도
                        const broaderSearches = [];
                        
                        if (foundLocation.includes('구')) {
                            const district = foundLocation.replace('구', '');
                            // 강북구 → 강북 관련 검색 확장
                            broaderSearches.push(
                                `서울 ${district}`,
                                `${district}역`, 
                                `${district}동`,
                                `${district}구청`,
                                `${district} 지역`,
                                `${district} 근처`,
                                `서울시 ${district}구`,
                                `${district} 상권`
                            );
                        }
                        
                        if (foundLocation.includes('동')) {
                            const neighborhood = foundLocation.replace('동', '');
                            broaderSearches.push(`${neighborhood}역`, `${neighborhood}`);
                        }
                        
                        // 모든 검색어에 대해 '맛집' 뿐만 아니라 다른 키워드도 시도
                        const searchKeywords = ['맛집', '음식점', '식당'];
                        
                        for (const broadSearch of broaderSearches) {
                            if (retryResults && retryResults.length > 0) break;
                            
                            for (const keyword of searchKeywords) {
                                if (retryResults && retryResults.length > 0) break;
                                
                                retryQuery = `${broadSearch} ${keyword}`;
                                console.log(`🔍 확장 검색: "${retryQuery}"`);
                                retryAttempts.push(retryQuery);
                                
                                retryResults = await getLocalRestaurants(retryQuery);
                                
                                if (retryResults && retryResults.length > 0) {
                                    console.log(`✅ 확장 검색 성공: "${retryQuery}"`);
                                    break;
                                }
                            }
                        }
                    }
                    
                    // 최후 시도: 인근 대형 지역으로 검색
                    if (!retryResults || retryResults.length === 0) {
                        console.log(`🚨 최후 시도: 인근 주요 지역으로 검색...`);
                        
                        // 강북 관련 인근 주요 지역들
                        const nearbyAreas = [];
                        
                        if (foundLocation.includes('강북')) {
                            nearbyAreas.push('노원', '수유', '미아', '도봉', '성북');
                        }
                        
                        // 다른 지역들도 추가 가능
                        if (foundLocation.includes('강남')) {
                            nearbyAreas.push('서초', '송파', '역삼', '삼성');
                        }
                        
                        if (foundLocation.includes('마포')) {
                            nearbyAreas.push('홍대', '상수', '합정', '연남');
                        }
                        
                        for (const area of nearbyAreas) {
                            if (retryResults && retryResults.length > 0) break;
                            
                            retryQuery = `${area} 맛집`;
                            console.log(`🔍 인근 지역 검색: "${retryQuery}"`);
                            retryAttempts.push(retryQuery);
                            
                            retryResults = await getLocalRestaurants(retryQuery);
                            
                            if (retryResults && retryResults.length > 0) {
                                console.log(`✅ 인근 지역 검색 성공: "${retryQuery}" (${foundLocation} 대신)`);
                                break;
                            }
                        }
                    }
                } else {
                    // 지역명을 못 찾은 경우 원본 메시지로 재시도
                    console.log(`🔍 지역명 없이 원본 메시지로 재시도: "${userMessage}"`);
                    retryAttempts.push(userMessage);
                    retryResults = await getLocalRestaurants(userMessage);
                }
                
                console.log(`📊 총 ${retryAttempts.length}번의 재시도 완료:`, retryAttempts);
                
                if (retryResults && retryResults.length > 0) {
                    // 성공한 검색어에서 키워드 추출해서 사용자에게 표시
                    const successfulSearchTerm = retryQuery.replace(/\s+(맛집|식당|음식점)$/, '');
                    const displayLocation = successfulSearchTerm || foundLocation || userMessage;
                    
                    let restaurantText = `🍽️ "${displayLocation}" 맛집 검색 결과\n\n`;
                    
                    // 원래 요청과 다른 검색어로 찾았다면 알림 추가
                    if (retryQuery !== searchQuery) {
                        restaurantText += `💡 "${successfulSearchTerm}" 지역 맛집을 찾았습니다\n\n`;
                    }
                    
                    retryResults.slice(0, config.limits.search_results_count).forEach((restaurant, index) => {
                        restaurantText += `${index + 1}. ${restaurant.title}\n📍 ${restaurant.address}\n📞 ${restaurant.telephone}\n🏷️ ${restaurant.category}\n🔗 ${restaurant.link}\n\n`;
                    });
                    
                    if (restaurantText.length > config.limits.message_max_length) {
                        restaurantText = restaurantText.substring(0, config.limits.message_truncate_length) + '...\n\n더 많은 맛집은 네이버에서 확인하세요.';
                    }
                    
                    responseText = restaurantText;
                } else {
                    // 모든 재시도 실패 - 더 구체적인 안내
                    console.log(`❌ 모든 검색 시도 실패. 시도한 검색어들:`, retryAttempts);
                    
                    if (foundLocation) {
                        // 지역명 기반 대안 제시
                        const alternatives = [];
                        
                        if (foundLocation.includes('구')) {
                            const district = foundLocation.replace('구', '');
                            alternatives.push(`"${district} 맛집"`, `"${district}역 맛집"`);
                        }
                        
                        if (foundLocation.includes('동')) {
                            const neighborhood = foundLocation.replace('동', '');
                            alternatives.push(`"${neighborhood} 맛집"`, `"${neighborhood}역 맛집"`);
                        }
                        
                        // 기본 대안들도 추가
                        alternatives.push(`"${foundLocation} 한식"`, `"${foundLocation} 카페"`);
                        
                        // 중복 제거 후 최대 4개만
                        const uniqueAlternatives = [...new Set(alternatives)].slice(0, 4);
                        
                        responseText = `"${foundLocation}" 지역 검색 결과가 없습니다.\n\n💡 이렇게 검색해보세요:\n${uniqueAlternatives.map(alt => `• ${alt}`).join('\n')}\n\n또는 더 큰 지역명 (예: 강북구→강북)으로 시도해보세요.`;
                    } else {
                        responseText = `"${userMessage}" 검색 결과가 없습니다.\n\n💡 검색 팁:\n• "지역명 + 맛집" (예: 강남 맛집)\n• "구/동 + 맛집" (예: 강북구 맛집)\n• "역 + 맛집" (예: 강북역 맛집)\n• "지역명 + 음식종류" (예: 홍대 카페)`;
                    }
                }
            }
        }
        // 맥미니 가격 관련 질문은 쇼핑 검색으로 처리되므로 제외
        // 맥미니 관련 질문 - 최신 정보로 Claude API 사용 (가격 질문 제외)
        else if (userMessage.includes('맥미니') && (userMessage.includes('최신') || userMessage.includes('M4') || userMessage.includes('m4') || userMessage.includes('M2') || userMessage.includes('m2')) && !config.shopping.price_keywords.some(keyword => userMessage.includes(keyword))) {
            console.log('✅ 맥미니 관련 질문 - Claude API로 최신 정보 검색');
            const startTime = Date.now();
            
            try {
                if (!process.env.CLAUDE_API_KEY) {
                    throw new Error('CLAUDE_API_KEY not found in environment variables');
                }
                
                // 현재 날짜 정보 포함하여 요청
                const currentDate = new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                // 맥미니 질문에서도 구체적 불만 표현만 감지
                const hasMacSpecialCalling = /똑똑이.*정신|박지피티.*정신|정신차려|정신차렷|바보.*같|멍청.*짓/i.test(userMessage);
                const isMacFrustrated = /왜.*안.*돼|화.*나.*짜증|답답.*죽겠|제대로.*안.*맥미니|똑바로.*안.*맥미니|먹통.*같|맥미니.*모르/i.test(userMessage);
                
                const claudeResponse = await axios.post(
                    'https://api.anthropic.com/v1/messages',
                    {
                        model: "claude-3-haiku-20240307",
                        system: `한국어 800자 이내. M4 맥미니 최신. ${currentDate}

${hasMacSpecialCalling || isMacFrustrated ? `
🤖 사용자 화남. 친근 사과 톤: 😅 죄송해요! [맥미니 답변] 💪 더 나은 답변!
` : '맥미니 정확 정보. 이모지 사용.'}`,
                        messages: [{
                            role: "user",
                            content: userMessage
                        }],
                        max_tokens: config.limits.claude_max_tokens
                    },
                    {
                        headers: {
                            'x-api-key': process.env.CLAUDE_API_KEY,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        },
                        timeout: config.timeouts.claude_general
                    }
                );
                
                const responseTime = Date.now() - startTime;
                responseText = claudeResponse.data.content[0].text;
                console.log(`✅ 맥미니 Claude 응답 받음 (${responseText.length}자, ${responseTime}ms)`);
                
                // 응답 후처리: 카카오톡에 맞게 최적화
                if (responseText.length > config.limits.message_max_length) {
                    const sentences = responseText.split(/[.!?]\s+/);
                    let truncated = '';
                    for (const sentence of sentences) {
                        if ((truncated + sentence).length > config.limits.message_truncate_length) break;
                        truncated += sentence + '. ';
                    }
                    responseText = truncated.trim();
                    console.log(`📝 맥미니 응답 길이 조정: ${responseText.length}자로 단축`);
                }
                
            } catch (error) {
                const responseTime = Date.now() - startTime;
                console.log(`⚠️ 맥미니 Claude API 에러 (${responseTime}ms):`, error.message);
                
                // 에러 시 백업 최신 정보
                responseText = `🖥️ 맥미니 최신 정보 (2024년 말 기준)

🆕 **M4 맥미니** (최신, 2024년 10월 출시)
• CPU: 10코어 (4P+6E), M2 대비 25% 빠름
• GPU: 10코어, Ray Tracing 지원
• 메모리: 최대 64GB 통합 메모리
• 저장용량: 최대 8TB SSD
• 가격: 기본형 약 95만원

📊 **M2와 비교**
• 성능: 전체적으로 20-25% 향상
• AI 작업: 훨씬 빠른 처리 속도
• 게임: Ray Tracing으로 그래픽 향상

💡 M4가 현재 **최신 맥미니**입니다!`;
            }
        }
        // Claude API를 통한 일반 질문 처리 (카카오톡 최적화)
        else {
            console.log('✅ Claude API 호출 시작...');
            const startTime = Date.now();
            
            try {
                // API 키 확인
                if (!process.env.CLAUDE_API_KEY) {
                    throw new Error('CLAUDE_API_KEY not found in environment variables');
                }
                
                // 현재 날짜 정보 포함하여 요청
                const currentDate = new Date().toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                
                // 게임 정보 요청인 경우 네이버 검색 API로 실제 정보 확인
                let searchResults = null;
                let gameSearchSummary = '';
                const isGameInfoRequest = userMessage.includes('게임') && config.shopping.review_keywords.some(keyword => userMessage.includes(keyword));
                
                if (isGameInfoRequest) {
                    console.log('🎮 게임 정보 요청 감지 - 네이버 검색 API로 정확한 정보 확인');
                    
                    // 게임명 추출 개선 (호칭 제거 및 정확한 패턴 매칭)
                    let gameName = null;
                    
                    // 호칭 제거 (지피티야, 챗봇아, 등)
                    let cleanMessage = userMessage.replace(/(지피티야|챗봇아|봇아|ai야|에이아이야|클로드야)\s*/gi, '').trim();
                    
                    // 1. "OOO 게임 어때" 패턴
                    let gameNameMatch = cleanMessage.match(/([가-힣a-zA-Z0-9\s]+?)\s*(게임|어때|할만해|추천|평가|리뷰)/);
                    if (gameNameMatch) {
                        gameName = gameNameMatch[1].trim();
                    }
                    
                    // 2. "벨브 데드락" 같은 개발사+게임명 패턴
                    if (!gameName) {
                        gameNameMatch = cleanMessage.match(/(벨브|밸브|valve)\s*([가-힣a-zA-Z0-9]+)/i);
                        if (gameNameMatch) {
                            gameName = `${gameNameMatch[1]} ${gameNameMatch[2]}`;
                        }
                    }
                    
                    // 3. 간단한 게임명 추출 (호칭 제거된 메시지에서)
                    if (!gameName) {
                        // "데드락 어때?" → "데드락"
                        gameNameMatch = cleanMessage.match(/([가-힣a-zA-Z0-9]+)\s*(어때|할만해|재밌어|좋아|괜찮아)/);
                        if (gameNameMatch) {
                            gameName = gameNameMatch[1].trim();
                        }
                    }
                    
                    // 4. 마지막 시도: 첫 번째 단어 추출
                    if (!gameName) {
                        const words = cleanMessage.split(/\s+/);
                        if (words.length > 0 && words[0].length > 1) {
                            gameName = words[0];
                        }
                    }
                    
                    if (gameName) {
                        try {
                            console.log(`🔍 "${gameName}" 게임 정보 검색 시작...`);
                            
                            // 1단계: 나무위키에서 기본 게임 정보 가져오기 (우선순위)
                            let namuWikiInfo = null;
                            try {
                                namuWikiInfo = await getNamuWikiGameInfo(gameName);
                                console.log(`🌳 나무위키 검색 완료: ${namuWikiInfo ? '성공' : '실패'}`);
                            } catch (error) {
                                console.log(`🌳 나무위키 검색 오류: ${error.message}`);
                            }
                            
                            // 2단계: 네이버 뉴스로 최신 정보 보완
                            searchResults = [];
                            
                            // 기본 검색 (가장 확실한 검색어부터)
                            const primarySearches = [`${gameName} 게임`];
                            
                            // 데드락의 경우 영문명을 우선 검색
                            if (gameName.includes('데드락') || gameName.toLowerCase().includes('deadlock')) {
                                primarySearches.unshift(`Deadlock 게임`); // 맨 앞에 추가
                                primarySearches.push(`Deadlock Valve`);
                            }
                            
                            console.log(`🚀 네이버 뉴스 검색 시작: ${primarySearches.join(', ')}`);
                            
                            for (const searchTerm of primarySearches) {
                                const results = await getLatestNews(searchTerm);
                                if (results && results.length > 0) {
                                    searchResults.push(...results);
                                    console.log(`✅ "${searchTerm}" 검색 성공: ${results.length}개 결과`);
                                    break; // 첫 번째 성공한 검색으로 충분
                                }
                            }
                            
                            // 검색 결과가 부족하면 추가 검색
                            if (searchResults.length < 2) {
                                console.log(`🔄 추가 뉴스 검색 (현재 ${searchResults.length}개)`);
                                const secondarySearches = [`${gameName} 리뷰`, `${gameName} 평가`];
                                
                                for (const searchTerm of secondarySearches) {
                                    const results = await getLatestNews(searchTerm);
                                    if (results && results.length > 0) {
                                        searchResults.push(...results);
                                        console.log(`✅ "${searchTerm}" 추가 검색: ${results.length}개 결과`);
                                        if (searchResults.length >= 3) break; // 충분한 결과 확보
                                    }
                                }
                            }
                            
                            // 중복 제거 (제목 기준)
                            const uniqueResults = [];
                            const seenTitles = new Set();
                            
                            for (const result of searchResults) {
                                const cleanTitle = result.title.replace(/<[^>]*>/g, '').trim();
                                if (!seenTitles.has(cleanTitle)) {
                                    seenTitles.add(cleanTitle);
                                    uniqueResults.push({
                                        ...result,
                                        title: cleanTitle
                                    });
                                }
                            }
                            
                            searchResults = uniqueResults.slice(0, 10); // 최대 10개까지
                            
                            console.log(`📊 "${gameName}" 검색 완료: ${searchResults.length}개 결과`);
                            
                            // 검색 결과 요약 생성 (나무위키 + 네이버 뉴스)
                            gameSearchSummary = '';
                            
                            if (namuWikiInfo) {
                                gameSearchSummary += `🌳 나무위키 정보:\n나무위키에서 "${gameName}" 상세 정보를 찾았습니다.\n\n`;
                            }
                            
                            if (searchResults.length > 0) {
                                gameSearchSummary += `📰 최신 뉴스 (${searchResults.length}개):\n`;
                                searchResults.slice(0, 3).forEach((result, index) => {
                                    gameSearchSummary += `${index + 1}. ${result.title}\n`;
                                });
                            }
                            
                            if (!namuWikiInfo && searchResults.length === 0) {
                                gameSearchSummary = `❌ "${gameName}"에 대한 정보를 찾을 수 없습니다.\n`;
                            }
                            
                        } catch (error) {
                            console.log(`❌ 게임 정보 검색 오류: ${error.message}`);
                            gameSearchSummary = `⚠️ 검색 중 오류가 발생했습니다. Claude AI 직접 판단으로 전환합니다.\n`;
                            
                            // 검색 실패 시 Claude AI에게 직접 질문 던지기
                            searchResults = null;
                            namuWikiInfo = null;
                            console.log(`🔄 검색 실패, Claude AI 직접 판단 모드로 전환`);
                        }
                    } else {
                        console.log(`⚠️ 게임명을 추출할 수 없습니다: "${userMessage}"`);
                        gameSearchSummary = `❓ 게임명을 정확히 파악하기 어려워 Claude AI 직접 판단으로 전환합니다.\n`;
                        
                        // 게임명 추출 실패 시도 Claude AI에게 직접 질문 던지기
                        searchResults = null;
                        namuWikiInfo = null;
                        console.log(`🔄 게임명 추출 실패, Claude AI 직접 판단 모드로 전환`);
                    }
                }
                
                // 구체적 불만 표현만 감지 (Claude API용 - 일반 질문과 구분)
                const hasSpecialCalling = /똑똑이.*정신|박지피티.*정신|정신차려|정신차렷|바보.*같|멍청.*짓|지피티야.*정신|클로드야.*정신|봇아.*정신/i.test(userMessage);
                const isFrustrated = /왜.*안.*돼|화.*나.*짜증|답답.*죽겠|제대로.*안|똑바로.*안|먹통.*같|아무.*말.*안/i.test(userMessage);
                const isDownOrSilent = /다운.*됐|먹통.*됐|안.*해.*아무|침묵.*지켜|반응.*없.*아무|응답.*없.*왜|말.*안.*해.*왜|대답.*안.*해/i.test(userMessage);
                
                const claudeResponse = await axios.post(
                    'https://api.anthropic.com/v1/messages',
                    {
                        model: "claude-3-haiku-20240307",
                        system: `한국어로 800자 이내 간결 답변. ${currentDate}

${hasSpecialCalling || isFrustrated || isDownOrSilent ? `
🤖 사용자 화남. 친근하고 사과하는 톤 필수.
형식: 😅 죄송해요! [답변] 💪 더 나은 답변 드리겠습니다!
` : '빠른 정확한 답변. 이모지 사용.'}

${namuWikiInfo || (searchResults && searchResults.length > 0) ? `🎮 게임 정보 검색 결과:

${namuWikiInfo ? `🌳 나무위키 상세 정보:
${namuWikiInfo}

` : ''}${searchResults && searchResults.length > 0 ? `📰 최신 뉴스 정보:
${gameSearchSummary}

상세 뉴스:
${searchResults.slice(0, 3).map((item, index) => `${index + 1}. ${item.title}\n   ${item.description || '설명 없음'}`).join('\n\n')}` : ''}

위 검색 결과를 바탕으로 정확하고 유용한 답변을 제공하세요.` : `🔄 검색 시스템에서 정보를 찾지 못했습니다.
${gameSearchSummary}

검색 실패로 인해 내장된 지식으로 답변합니다. 알고 있는 정보 범위 내에서 게임에 대해 설명하되, 2024년 이후 최신 정보는 제한적일 수 있음을 알려주세요.

답변 형식:
🎮 [게임명]에 대해 알고 있는 정보를 바탕으로 설명드립니다.
[게임 정보 설명]
⚠️ 단, 2024년 이후 최신 정보는 제한적일 수 있습니다.`}`,
                        messages: [{
                            role: "user",
                            content: userMessage
                        }],
                        max_tokens: config.limits.claude_max_tokens
                    },
                    {
                        headers: {
                            'x-api-key': process.env.CLAUDE_API_KEY,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        },
                        timeout: config.timeouts.claude_general  // 6초로 늘림
                    }
                );
                
                const responseTime = Date.now() - startTime;
                responseText = claudeResponse.data.content[0].text;
                console.log(`✅ Claude 응답 받음 (${responseText.length}자, ${responseTime}ms)`);
                
                // 응답 후처리: 카카오톡에 맞게 최적화
                if (responseText.length > config.limits.message_max_length) {
                    // 문장 단위로 자르기
                    const sentences = responseText.split(/[.!?]\s+/);
                    let truncated = '';
                    for (const sentence of sentences) {
                        if ((truncated + sentence).length > config.limits.message_truncate_length) break;
                        truncated += sentence + '. ';
                    }
                    responseText = truncated.trim();
                    console.log(`📝 응답 길이 조정: ${responseText.length}자로 단축`);
                }
                
            } catch (error) {
                const responseTime = Date.now() - startTime;
                console.log(`⚠️ Claude API 에러 (${responseTime}ms):`, {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data,
                    code: error.code,
                    hasApiKey: !!process.env.CLAUDE_API_KEY,
                    apiKeyLength: process.env.CLAUDE_API_KEY?.length || 0,
                    apiKeyStart: process.env.CLAUDE_API_KEY?.substring(0, 10) || 'none'
                });
                
                if (error.response?.status === 401) {
                    responseText = `🔑 AI 서비스 인증에 문제가 있습니다.\n\n관리자에게 문의해주세요.`;
                } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                    // 게임 정보 요청인 경우 검색 결과라도 제공
                    if (isGameInfoRequest && searchResults && searchResults.length > 0) {
                        responseText = `🎮 AI 처리 시간이 초과되었지만, 검색된 정보를 제공드립니다:\n\n${gameSearchSummary}\n💡 더 자세한 정보는 위 검색 결과를 참고해주세요.`;
                    } else {
                        responseText = `⏰ AI 응답 시간이 초과되었습니다.\n\n게임 정보 검색은 정상 작동하지만 AI 처리에서 지연이 발생했습니다.\n다시 시도해주세요.`;
                    }
                } else if (error.response?.status === 429) {
                    responseText = `🚫 AI 사용량 한도에 도달했습니다.\n\n잠시 후 다시 시도해주세요.`;
                } else if (error.message.includes('CLAUDE_API_KEY not found')) {
                    responseText = `⚙️ AI 서비스 설정이 필요합니다.\n\n관리자가 설정을 확인 중입니다.`;
                } else {
                    // 게임 정보 요청인 경우 안전한 에러 메시지
                    if (isGameInfoRequest) {
                        responseText = `🎮 죄송합니다. AI 서비스 오류로 게임 정보를 처리할 수 없습니다.\n\n${gameSearchSummary || ''}💡 정확한 게임 정보를 원하시면:\n• 네이버에서 "게임명 + 리뷰" 검색\n• 스팀, 플레이스토어 등 공식 스토어 확인\n• 게임 공식 웹사이트 방문\n\n네이버 검색 API를 통한 실시간 정보 제공을 목표로 하고 있습니다.`;
                    } else {
                        responseText = `⚠️ AI 서비스가 일시 불안정합니다.\n\n잠시 후 다시 시도해주세요.`;
                    }
                }
            }
        }
        
        console.log(`📝 응답 내용: ${responseText.substring(0, 100)}...`);
        
        // 메시지 길이 제한 (카카오톡 호환성)
        if (responseText.length > config.limits.message_max_length) {
            responseText = responseText.substring(0, config.limits.message_max_length - 3) + '...';
            console.log(`⚠️ 메시지가 길어서 ${config.limits.message_max_length}자로 제한됨`);
        }
        
        const kakaoResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: responseText
                    }
                }]
            }
        };
        
        // 🧠 대화 히스토리 저장 (응답 생성 완료 후)
        if (userId && userMessage && responseText) {
            try {
                // 기존 분석이 있으면 사용, 없으면 새로 분석
                const finalIntent = analysis?.intent || classifyBasicIntent(userMessage);
                addToConversationHistory(userId, userMessage, responseText, finalIntent);
                
                // 메모리 정리 (30분 이상 비활성 사용자)
                const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
                for (const [id, context] of conversationMemory.entries()) {
                    if (context.lastInteraction < thirtyMinutesAgo) {
                        conversationMemory.delete(id);
                        userPatterns.delete(id);
                        console.log(`🧹 메모리 정리: ${id} (30분 비활성)`);
                    }
                }
                
                console.log(`💾 현재 메모리: 대화기록 ${conversationMemory.size}명, 패턴 ${userPatterns.size}명`);
            } catch (error) {
                console.log(`⚠️ 대화 히스토리 저장 오류: ${error.message}`);
            }
        }
        
        console.log(`📤 카카오 응답 전송: ${JSON.stringify(kakaoResponse, null, 2)}`);
        
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(kakaoResponse);
        console.log('✅ 카카오 웹훅 응답 전송 완료');
        
    } catch (error) {
        console.error('❌ 웹훅 처리 중 전체 오류:', error);
        
        // 게임 정보 요청이었는지 확인
        const isGameQuestion = userMessage && userMessage.includes('게임') && config.shopping.review_keywords.some(keyword => userMessage.includes(keyword));
        
        let errorMessage;
        if (isGameQuestion) {
            errorMessage = `🎮 게임 정보 검색 중 오류가 발생했습니다.\n\n💡 다시 시도해주시거나:\n• "게임명 + 어때" 형식으로 질문\n• 네이버에서 직접 검색\n\n검색 시스템을 개선하고 있습니다.`;
        } else {
            errorMessage = `⚠️ 서비스 처리 중 오류가 발생했습니다.\n\n잠시 후 다시 시도해주세요.\n문제가 지속되면 더 간단한 질문으로 시도해보세요.`;
        }
        
        const errorResponse = {
            version: "2.0",
            template: {
                outputs: [{
                    simpleText: {
                        text: errorMessage
                    }
                }]
            }
        };
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json(errorResponse);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`🔑 Claude API 키 상태: ${process.env.CLAUDE_API_KEY ? '설정됨 (' + process.env.CLAUDE_API_KEY.length + '자)' : '미설정'}`);
    console.log(`📡 네이버 API 키 상태: ${(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) ? '설정됨' : '미설정'}`);
});