// 키워드 설정 파일
module.exports = {
    // 뉴스 검색 키워드
    news: [
        '뉴스', '최신뉴스', '오늘뉴스', '새로운소식', '헤드라인', '속보', '시사'
    ],

    // 쇼핑 검색 키워드
    shopping: {
        general: [
            '상품', '제품', '구매', '쇼핑', '판매', '가격', '베스트', '인기', 
            '랭킹', '순위', '리뷰', '후기'
        ],
        products: [
            '노트북', '휴대폰', '스마트폰', '아이폰', '갤럭시', '맥미니', '맥북', 
            '아이맥', '화장품', '의류', '신발', '가방', '시계', '이어폰', '충전기', 
            '마우스', '키보드', '모니터', '스피커', '헤드폰', '태블릿', '컴퓨터', 
            '카메라', '게임', '애플워치', '에어팟'
        ],
        price_keywords: [
            '가격', '싼곳', '저렴', '할인', '세일', '어디서', '구매', '최저가', 
            '가장싼', '제일싼', '저렴한곳', '할인점', '특가', '덤핑', '프로모션'
        ],
        // 리뷰/평가 관련 키워드 (쇼핑이 아닌 Claude AI로 처리)
        review_keywords: [
            '어때', '할만해', '재밌어', '평가', '리뷰', '어떤가', '좋아', 
            '괜찮아', '추천해', '어떻게', '어떨까', '후기', '사용후기', 
            '써봤어', '해봤어', '경험', '느낌', '인상', '의견'
        ]
    },

    // 맛집/지역 검색 키워드
    restaurant: {
        food: [
            '맛집', '음식점', '식당', '배달', '맛있는', '먹을곳', '밥집',
            '카페', '커피', '디저트', '떡볶이', '치킨', '피자', '한식', '중식', 
            '일식', '양식', '분식', '술집', '주점', '고기', '회', '초밥', '레스토랑',
            '베이커리', '브런치', '파스타', '스테이크', '부페', '뷔페'
        ],
        locations: {
            // 서울 주요 지역 및 역세권
            seoul: [
                '강남', '홍대', '신촌', '명동', '종로', '을지로', '성수', '건대', 
                '신림', '사당', '노원', '수유', '도봉', '서초', '송파', '강동', 
                '중랑', '성북', '동대문', '마포', '용산', '영등포', '구로', '금천',
                '서대문', '은평', '강서', '양천', '동작', '관악', '강북',
                '수서', '개포', '대치', '삼성', '선릉', '역삼', '강남역', '교대', 
                '방배', '사당역', '흑석', '노량진', '용산역', '이촌', '한남', '압구정', 
                '청담', '잠실', '석촌', '문정', '장지', '방이', '오금', '개롱',
                '거여', '마천', '상일동', '명일', '고덕', '둔촌', '천호', '암사', 
                '건대입구', '구의', '뚝섬', '왕십리', '한양대', '제기동', '신설동', 
                '동묘앞', '창신', '혜화', '한성대', '성신여대', '보문', '정릉', 
                '길음', '미아', '쌍문', '방학', '창동', '중계', '하계', '공릉', 
                '태릉', '먹골', '중화', '상봉', '면목', '사가정', '용마산', '중곡', 
                '군자', '어린이대공원', '신내', '상계', '당고개', '화랑대', '서울과기대', 
                '한국외대', '신이문', '석계', '안암', '고려대', '월곡', '상월곡', 
                '돌곶이', '석관', '신흥', '국회의사당', '여의나루', '샛강', 
                '장승배기', '신대방삼거리', '보라매', '신풍', '대림', '구로디지털단지',
                '신도림', '문래', '영등포구청', '당산', '합정', '홍대입구', '이대', 
                '아현', '충정로', '광화문', '종각', '회현', '중구청', '동국대', 
                '신당', '상왕십리', '청량리', '용두', '도봉산'
            ],
            // 경기도 주요 지역  
            gyeonggi: [
                '수원', '성남', '고양', '부천', '안산', '안양', '용인', '화성', 
                '평택', '의정부', '시흥', '파주', '김포', '광명', '광주', '군포', 
                '오산', '이천', '양주', '동두천', '과천', '구리', '남양주', '하남',
                '인덕원', '판교', '분당', '일산', '중동', '송도', '부평', '계양', 
                '서현', '미금', '정자', '평촌', '산본', '범계', '금정', '수내',
                '야탑', '모란', '태평', '복정', '가천대'
            ],
            // 기타 주요 도시
            major_cities: [
                '인천', '대전', '대구', '부산', '울산', '광주', '세종'
            ],
            // 일반 위치 키워드
            general: [
                '역', '동', '구', '시', '군', '면', '근처', '주변', '앞', '사거리', '거리'
            ]
        }
    },

    // 제외 키워드 (쇼핑과 맛집 구분용)
    exclude: {
        shopping_from_restaurant: [
            '상품', '제품', '구매', '쇼핑', '판매', '가격', '베스트', '인기', 
            '랭킹', '순위', '온라인', '쿠팡', '11번가', '지마켓', '옥션', 
            '티몬', 'G마켓', '네이버쇼핑', '할인', '세일', '특가', '리뷰', 
            '후기', '배송', '무료배송', '당일배송'
        ]
    },

    // 타임아웃 설정 (빠른 응답 최적화)
    timeouts: {
        naver_api: 3000,        // 네이버 API: 3초로 단축
        claude_general: 3500,   // Claude 일반: 3.5초로 단축 (빠른 응답)
        claude_image: 4000,
        image_download: 3000
    },

    // 응답 길이 제한
    limits: {
        message_max_length: 950,
        message_truncate_length: 850,
        claude_max_tokens: 400,
        search_results_count: 5
    },

    // 맛집 검색 필터링 및 정렬
    restaurant_filters: {
        // 패스트푸드 및 체인점 키워드 (제외)
        exclude_keywords: [
            // 패스트푸드 체인
            '맥도날드', '버거킹', '롯데리아', 'KFC', '케이에프씨', '서브웨이', '맘스터치',
            '파파존스', '피자헛', '도미노피자', '피자스쿨', '미스터피자', '파파머피',
            // 치킨 체인
            'BBQ', '치킨플러스', '교촌치킨', '네네치킨', '처갓집양념치킨', 'BHC', '굽네치킨',
            '60계치킨', '후라이드참잘하는집', '치킨매니아', '꼬꼬따리', '호식이두마리치킨',
            // 카페 체인 (대형 프랜차이즈만)
            '스타벅스', '투썸플레이스', '이디야', '엔젤리너스', '할리스', '빽다방', '파스쿠찌',
            '커피빈', '탐앤탐스', '공차', '메가커피', '컴포즈커피', '더벤티', '드롭탑',
            // 분식 체인
            '김밥천국', '김밥나라', '마늘보쌈족발', '죠스떡볶이', '신전떡볶이', '청년다방',
            // 기타 체인
            'CU', 'GS25', '세븐일레븐', '미니스톱', '롯데마트', '이마트', '홈플러스',
            // 베이커리 체인
            '파리바게뜨', '뚜레쥬르', '파리크라상', 'SPC'
        ],
        // 제외할 카테고리
        exclude_categories: [
            '편의점', '마트', '쇼핑', '대형마트', '할인점', '백화점', '슈퍼마켓'
        ],
        // 인기도 우선순위 키워드 (사용자 검색 많은 곳 기준)
        popular_keywords: [
            '유명한', '맛있는', '인기', '소문난', '맛집', '유명', '전문', '본점', '원조', 
            '정통', '깔끔한', '신선한', '엄선한', '갓', '장인', '수제', '직화',
            '숯불', '화덕', '생', '냉동안', '무첨가', '국내산', '재료', '신선',
            '손님이 많은', '줄서는', '대기', '예약', '인기메뉴', '맛있다는', 
            '소문', '입소문', '맛있기로', '찐', '진짜', '핫플', '핫한', '대박'
        ],
        // 카테고리 우선순위 (높을수록 우선)
        category_priority: {
            '한식': 5,
            '일식': 4, 
            '중식': 3,
            '양식': 2,
            '기타': 1
        }
    }
};