// 전체 영화 데이터베이스 구축 API
const express = require('express');
const KoficMovieCrawler = require('../crawlers/kofic-movie-crawler');
const NaverMovieCrawler = require('../crawlers/naver-movie-crawler');
const EnhancedNaverCrawler = require('../crawlers/enhanced-naver-crawler');
const SupabaseClient = require('../config/supabase-client');

const router = express.Router();

// 전체 크롤링 실행 API
router.post('/execute-full-crawling', async (req, res) => {
    console.log('🎬 전체 영화 데이터베이스 구축 API 호출');
    
    const startTime = Date.now();
    let results = {
        success: false,
        message: '',
        data: {
            initialMovieCount: 0,
            finalMovieCount: 0,
            koficResults: null,
            naverEnhancementCount: 0,
            posterCount: 0,
            ratingCount: 0,
            errors: [],
            duration: 0
        }
    };
    
    try {
        const supabase = new SupabaseClient();
        
        if (!supabase.client) {
            return res.status(500).json({
                success: false,
                message: 'Supabase 연결 실패',
                error: 'Database connection failed'
            });
        }
        
        // 1. 현재 상태 확인
        console.log('1️⃣ 현재 데이터베이스 상태 확인');
        const { count: initialCount } = await supabase.client
            .from('movies')
            .select('*', { count: 'exact', head: true });
            
        results.data.initialMovieCount = initialCount || 0;
        console.log(`📊 초기 영화 수: ${results.data.initialMovieCount}개`);
        
        // 2. 영화진흥위원회 크롤링
        console.log('2️⃣ 영화진흥위원회 크롤링 시작');
        const koficCrawler = new KoficMovieCrawler();
        
        try {
            const koficResult = await koficCrawler.crawlAllMovies();
            results.data.koficResults = koficResult;
            
            if (koficResult.success) {
                console.log(`✅ KOFIC 크롤링 성공: ${koficResult.newMoviesAdded}개 추가`);
            } else {
                console.log('⚠️ KOFIC 크롤링 실패:', koficResult.error);
                results.data.errors.push(`KOFIC 크롤링: ${koficResult.error}`);
            }
        } catch (error) {
            console.error('❌ KOFIC 크롤링 예외:', error);
            results.data.errors.push(`KOFIC 예외: ${error.message}`);
        }
        
        // 3. 향상된 네이버 크롤링 (평점 및 리뷰 데이터 포함)
        console.log('3️⃣ 향상된 네이버 크롤링 시작 (평점/리뷰 데이터 포함)');
        try {
            const enhancedCrawler = new EnhancedNaverCrawler();
            const enhancementResult = await enhancedCrawler.enhanceAllMovies(30); // 30개 제한
            
            if (enhancementResult.success) {
                results.data.naverEnhancementCount = enhancementResult.data.successCount;
                console.log(`✅ 향상된 크롤링 완료: ${enhancementResult.data.successCount}개 성공`);
                
                if (enhancementResult.data.errors.length > 0) {
                    results.data.errors.push(...enhancementResult.data.errors.slice(0, 5)); // 최대 5개 오류만 저장
                }
            } else {
                console.log('⚠️ 향상된 크롤링 실패:', enhancementResult.error);
                results.data.errors.push(`향상된 크롤링: ${enhancementResult.error}`);
            }
        } catch (error) {
            console.error('❌ 향상된 크롤링 오류:', error);
            results.data.errors.push(`향상된 크롤링: ${error.message}`);
        }
        
        // 4. 최종 상태 확인
        console.log('4️⃣ 최종 상태 확인');
        const { count: finalCount } = await supabase.client
            .from('movies')
            .select('*', { count: 'exact', head: true });
            
        results.data.finalMovieCount = finalCount || 0;
        
        // 포스터/평점/리뷰 통계
        const { count: posterCount } = await supabase.client
            .from('movies')
            .select('*', { count: 'exact', head: true })
            .not('poster_image', 'is', null);
            
        const { count: ratingCount } = await supabase.client
            .from('movie_ratings')
            .select('*', { count: 'exact', head: true });
            
        const { count: reviewCount } = await supabase.client
            .from('movie_reviews')
            .select('*', { count: 'exact', head: true });
            
        results.data.posterCount = posterCount || 0;
        results.data.ratingCount = ratingCount || 0;
        results.data.reviewCount = reviewCount || 0;
        results.data.duration = Date.now() - startTime;
        
        // 성공 판단
        const moviesAdded = results.data.finalMovieCount - results.data.initialMovieCount;
        results.success = true;
        results.message = `전체 크롤링 완료! ${moviesAdded}개 영화 추가됨`;
        
        console.log('🎉 전체 크롤링 완료!');
        console.log(`📊 최종 영화 수: ${results.data.finalMovieCount}개`);
        console.log(`📸 포스터: ${results.data.posterCount}개`);
        console.log(`⭐ 평점: ${results.data.ratingCount}개`);
        console.log(`💬 리뷰: ${results.data.reviewCount}개`);
        
        res.json(results);
        
    } catch (error) {
        console.error('❌ 전체 크롤링 오류:', error);
        results.data.duration = Date.now() - startTime;
        results.data.errors.push(error.message);
        
        res.status(500).json({
            ...results,
            message: '전체 크롤링 실행 중 오류 발생',
            error: error.message
        });
    }
});

// 크롤링 상태 확인 API
router.get('/crawling-status', async (req, res) => {
    try {
        const supabase = new SupabaseClient();
        
        if (!supabase.client) {
            return res.status(500).json({
                success: false,
                message: 'Supabase 연결 실패'
            });
        }
        
        // 전체 통계
        const { count: totalMovies } = await supabase.client
            .from('movies')
            .select('*', { count: 'exact', head: true });
            
        // 데이터 소스별 분포
        const { data: sourceData } = await supabase.client
            .from('movies')
            .select('data_source');
            
        const sourceCounts = {};
        sourceData?.forEach(movie => {
            const source = movie.data_source || 'unknown';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });
        
        // 포스터/평점/리뷰 통계
        const { count: posterCount } = await supabase.client
            .from('movies')
            .select('*', { count: 'exact', head: true })
            .not('poster_image', 'is', null);
            
        const { count: movieRatingCount } = await supabase.client
            .from('movie_ratings')
            .select('*', { count: 'exact', head: true });
            
        const { count: movieReviewCount } = await supabase.client
            .from('movie_reviews')
            .select('*', { count: 'exact', head: true });
            
        // 최근 추가된 영화
        const { data: recentMovies } = await supabase.client
            .from('movies')
            .select('title, director, release_year, data_source, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        res.json({
            success: true,
            message: '크롤링 상태 확인 완료',
            data: {
                totalMovies: totalMovies || 0,
                sourceDistribution: sourceCounts,
                posterCount: posterCount || 0,
                ratingCount: movieRatingCount || 0,
                reviewCount: movieReviewCount || 0,
                recentMovies: recentMovies || [],
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ 상태 확인 오류:', error);
        res.status(500).json({
            success: false,
            message: '상태 확인 실패',
            error: error.message
        });
    }
});

module.exports = router;