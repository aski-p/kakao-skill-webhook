CREATE TABLE IF NOT EXISTS restaurants (
  place_key TEXT PRIMARY KEY,
  naver_place_id TEXT,
  district TEXT NOT NULL,
  query TEXT,
  title TEXT NOT NULL,
  category TEXT,
  road_address TEXT,
  address TEXT,
  telephone TEXT,
  link TEXT,
  mapx NUMERIC,
  mapy NUMERIC,
  naver_rating NUMERIC(3, 2),
  review_count INTEGER,
  visitor_review_total INTEGER,
  food_review_count INTEGER,
  recommendation_count INTEGER,
  visitor_review_keywords JSONB DEFAULT '{}'::jsonb,
  naver_rank INTEGER,
  source TEXT DEFAULT 'naver',
  crawled_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS visitor_review_total INTEGER,
  ADD COLUMN IF NOT EXISTS food_review_count INTEGER,
  ADD COLUMN IF NOT EXISTS visitor_review_keywords JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_restaurants_district_food_rank
  ON restaurants (district, food_review_count DESC NULLS LAST, naver_rating DESC NULLS LAST, visitor_review_total DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_restaurants_district_rating
  ON restaurants (district, naver_rating DESC NULLS LAST, review_count DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_restaurants_crawled_at
  ON restaurants (crawled_at DESC);
