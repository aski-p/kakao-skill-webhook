// 네이버 직접 크롤링 API
const express = require('express');
const { DirectNaverMovieCrawler } = require('../direct-naver-crawling');

const router = express.Router();

// 네이버 직접 크롤링 실행 API
router.post('/direct-naver-crawling', async (req, res) => {
    console.log('[MOVIE] 네이버 직접 크롤링 API 호출');
    
    const startTime = Date.now();
    
    try {
        const crawler = new DirectNaverMovieCrawler();
        
        // 크롤링 실행 전 상태 확인
        const initialCount = await crawler.checkDatabaseStatus();
        
        // 크롤링 실행
        const result = await crawler.crawlAndInsertMovies();
        
        // 크롤링 실행 후 상태 확인
        const finalCount = await crawler.checkDatabaseStatus();
        
        const duration = Date.now() - startTime;
        
        if (result.success) {
            res.json({
                success: true,
                message: '네이버 직접 크롤링 완료',
                data: {
                    initialMovieCount: initialCount,
                    finalMovieCount: finalCount,
                    actualAdded: finalCount - initialCount,
                    ...result.data,
                    duration: Math.round(duration / 1000),
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: '네이버 크롤링 실패',
                error: result.message,
                data: {
                    initialMovieCount: initialCount,
                    finalMovieCount: finalCount,
                    duration: Math.round(duration / 1000),
                    timestamp: new Date().toISOString()
                }
            });
        }
        
    } catch (error) {
        console.error('[ERROR] 네이버 직접 크롤링 API 오류:', error);
        
        const duration = Date.now() - startTime;
        
        res.status(500).json({
            success: false,
            message: '서버 오류',
            error: error.message,
            data: {
                duration: Math.round(duration / 1000),
                timestamp: new Date().toISOString()
            }
        });
    }
});

// 테스트용 단일 영화 추가 API
router.post('/add-single-movie', async (req, res) => {
    console.log('[MOVIE] 단일 영화 추가 API 호출');
    
    const { movieTitle } = req.body;
    
    if (!movieTitle) {
        return res.status(400).json({
            success: false,
            message: '영화 제목이 필요합니다',
            error: 'Movie title is required'
        });
    }
    
    try {
        const crawler = new DirectNaverMovieCrawler();
        
        console.log(`[SEARCH] "${movieTitle}" 검색 중...`);
        
        // 네이버에서 영화 검색
        const movieData = await crawler.searchNaverMovie(movieTitle);
        
        if (!movieData) {
            return res.status(404).json({
                success: false,
                message: `"${movieTitle}" 영화를 찾을 수 없습니다`,
                error: 'Movie not found'
            });
        }
        
        // 중복 확인
        const exists = await crawler.checkMovieExists(movieData.title, movieData.pubDate);
        
        if (exists) {
            return res.json({
                success: true,
                message: `"${movieData.title}" 영화가 이미 존재합니다`,
                data: {
                    movieTitle: movieData.title,
                    releaseYear: movieData.release_year,
                    status: 'already_exists'
                }
            });
        }
        
        // 영화 추가
        const inserted = await crawler.insertMovieToSupabase(movieData);
        
        if (inserted) {
            res.json({
                success: true,
                message: `"${movieData.title}" 영화가 성공적으로 추가되었습니다`,
                data: {
                    movieTitle: movieData.title,
                    director: movieData.director,
                    releaseYear: movieData.release_year,
                    naverRating: movieData.naver_rating,
                    posterImage: movieData.poster_image,
                    status: 'added'
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: '영화 저장에 실패했습니다',
                error: 'Failed to save movie'
            });
        }
        
    } catch (error) {
        console.error('[ERROR] 단일 영화 추가 오류:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류',
            error: error.message
        });
    }
});

module.exports = router;