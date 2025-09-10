-- daily_schedule_memos 테이블 생성
CREATE TABLE IF NOT EXISTS daily_schedule_memos (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    time TIME NOT NULL,
    description TEXT,
    user_id VARCHAR(100) DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_schedule_date_user ON daily_schedule_memos(date, user_id);
CREATE INDEX IF NOT EXISTS idx_schedule_user_date ON daily_schedule_memos(user_id, date);

-- 샘플 데이터 (테스트용)
INSERT INTO daily_schedule_memos (date, title, time, description, user_id) VALUES
('2025-01-10', '회의', '14:00', '프로젝트 리뷰 회의', 'default'),
('2025-01-10', '점심약속', '12:00', '동료와 점심', 'default'),
('2025-01-11', '병원', '09:30', '정기 검진', 'default')
ON CONFLICT DO NOTHING;