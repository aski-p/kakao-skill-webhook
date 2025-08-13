// 새로운 날씨 함수 - 깔끔하게 작성
async function handleWeatherQuery(message) {
    try {
        // 지역 추출
        const locationPatterns = [
            /([가-힣]+(?:시|구|동|읍|면|도))\s*날씨/,
            /날씨\s*([가-힣]+(?:시|구|동|읍|면|도))/,
            /([가-힣]+)\s*날씨/,
            /날씨\s*([가-힣]+)/
        ];
        
        let location = '서울'; // 기본값
        for (const pattern of locationPatterns) {
            const match = message.match(pattern);
            if (match && match[1]) {
                location = match[1].replace(/날씨/g, '').trim();
                break;
            }
        }
        
        console.log(`🌤️ 날씨 정보 요청: ${location} (네이버 날씨 페이지 크롤링)`);
        
        // 네이버 날씨 페이지 직접 크롤링
        const weatherData = await getNaverWeatherData(location);
        
        if (weatherData) {
            let response = `🌤️ ${location} 날씨 정보\n\n`;
            
            // 현재 날씨
            if (weatherData.current) {
                response += `🌡️ 현재 기온: ${weatherData.current.temp}°C\n`;
                response += `☁️ 현재 날씨: ${weatherData.current.condition}\n`;
                if (weatherData.current.humidity) {
                    response += `💧 습도: ${weatherData.current.humidity}%\n`;
                }
            }
            
            // 시간별 예보 (표 형식)
            if (weatherData.hourly && weatherData.hourly.length > 0) {
                response += `\n⏰ 시간별 예보:\n`;
                response += `시간 | 온도 | 날씨\n`;
                response += `─────────────\n`;
                
                for (let i = 0; i < Math.min(6, weatherData.hourly.length); i++) {
                    const hour = weatherData.hourly[i];
                    const time = hour.time.padEnd(4);
                    const temp = (hour.temp + '°C').padEnd(5);
                    response += `${time} | ${temp} | ${hour.condition}\n`;
                }
            }
            
            response += `\n💡 더 자세한 날씨는 네이버에서 확인하세요.`;
            return response;
        }
        
        // 날씨 데이터를 가져올 수 없는 경우 기본 메시지
        return `🌤️ ${location} 날씨 정보를 가져올 수 없었습니다.\n\n💡 네이버에서 "${location} 날씨"를 검색해보세요.`;
        
    } catch (error) {
        console.error('❌ 날씨 쿼리 처리 오류:', error);
        return null;
    }
}