// 영화진흥위원회 전체 영화 데이터 수집 API 엔드포인트
const express = require('express');
const KoficMovieCrawler = require('../crawlers/kofic-movie-crawler');

const router = express.Router();

// 영화진흥위원회 전체 영화 수집 API
router.post('/crawl-kofic-movies', async (req, res) => {
    console.log('[MOVIE] 영화진흥위원회 전체 영화 수집 API 호출');
    
    try {
        const crawler = new KoficMovieCrawler();
        const result = await crawler.crawlAllMovies();
        
        if (result.success) {
            res.json({
                success: true,
                message: '영화진흥위원회 영화 데이터 수집 완료',
                data: {
                    totalProcessed: result.totalProcessed,
                    newMoviesAdded: result.newMoviesAdded,
                    existingMovies: result.existingMovies,
                    errors: result.errors?.length || 0,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: '영화진흥위원회 데이터 수집 실패',
                error: result.error,
                data: {
                    totalProcessed: result.totalProcessed || 0,
                    newMoviesAdded: result.newMoviesAdded || 0,
                    timestamp: new Date().toISOString()
                }
            });
        }
    } catch (error) {
        console.error('[ERROR] 영화진흥위원회 크롤링 API 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 영화진흥위원회 API 상태 확인
router.get('/kofic-status', async (req, res) => {
    try {
        const crawler = new KoficMovieCrawler();
        
        res.json({
            success: true,
            message: '영화진흥위원회 API 상태 확인',
            data: {
                apiKeyConfigured: !!process.env.KOFIC_API_KEY,
                apiKey: process.env.KOFIC_API_KEY ? 
                    process.env.KOFIC_API_KEY.substring(0, 8) + '...' : 
                    'Not configured',
                baseUrl: 'http://www.kobis.or.kr/kobisopenapi/webservice/rest',
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('[ERROR] 영화진흥위원회 상태 확인 오류:', error);
        res.status(500).json({
            success: false,
            message: '상태 확인 실패',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;