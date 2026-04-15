-- TruyenVip TITAN-GRADE PostgreSQL Schema
-- Unified Production Schema (Synchronized with code and scripts)

-- 1. Identity & Users
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255),
    xp INTEGER DEFAULT 0,
    vipcoins INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    avatar TEXT,
    contribution_points INTEGER DEFAULT 0,
    badge_ids TEXT,
    mission_data JSONB DEFAULT '{}',
    last_mission_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_stats_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Manga Core
CREATE TABLE IF NOT EXISTS manga (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    cover TEXT,
    source_url TEXT UNIQUE,
    normalized_title VARCHAR(500),
    author VARCHAR(255) DEFAULT 'Đang cập nhật',
    status VARCHAR(100) DEFAULT 'Đang cập nhật',
    description TEXT,
    last_chap_num VARCHAR(100) DEFAULT 'Đang cập nhật',
    rating DOUBLE PRECISION DEFAULT 4.5,
    views BIGINT DEFAULT 0,
    views_at_source BIGINT DEFAULT 0,
    trending BOOLEAN DEFAULT FALSE,
    last_crawled TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    migration_count INTEGER DEFAULT 0,
    alternative_titles TEXT
);

-- 3. Chapters
CREATE TABLE IF NOT EXISTS chapters (
    id VARCHAR(255) PRIMARY KEY,
    manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
    title VARCHAR(1000) NOT NULL,
    source_url TEXT,
    chapter_number DOUBLE PRECISION,
    status VARCHAR(50) DEFAULT 'active',
    fail_count INTEGER DEFAULT 0,
    last_error TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(manga_id, chapter_number)
);

-- 4. Images
CREATE TABLE IF NOT EXISTS chapterimages (
    id SERIAL PRIMARY KEY,
    chapter_id VARCHAR(255) REFERENCES chapters(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chapter_id, "order")
);

-- 5. Genres
CREATE TABLE IF NOT EXISTS genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS mangagenres (
    manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (manga_id, genre_id)
);

-- 6. Social & History
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uuid, manga_id)
);

CREATE TABLE IF NOT EXISTS readhistory (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
    chapter_id VARCHAR(255) REFERENCES chapters(id) ON DELETE CASCADE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uuid, manga_id)
);

CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    chapter_id VARCHAR(255) REFERENCES chapters(id) ON DELETE CASCADE,
    user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comment_likes (
    user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    PRIMARY KEY (user_uuid, comment_id)
);

CREATE TABLE IF NOT EXISTS comment_reports (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE SET NULL,
    comment_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. System & Crawler Infrastructure
CREATE TABLE IF NOT EXISTS system_config (
    key VARCHAR(255) PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    type VARCHAR(50) DEFAULT 'info',
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ratelimits (
    key VARCHAR(255) PRIMARY KEY,
    count INTEGER DEFAULT 1,
    reset_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS dailycheckins (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    checkin_date DATE NOT NULL,
    streak INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uuid, checkin_date)
);

CREATE TABLE IF NOT EXISTS crawlertasks (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    target TEXT UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    attempts INTEGER DEFAULT 0,
    manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE SET NULL,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crawllogs (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'success',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guardianreports (
    id SERIAL PRIMARY KEY,
    manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
    manga_name VARCHAR(255),
    chapter_title VARCHAR(255),
    issue_type VARCHAR(50),
    details TEXT,
    fixed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Redemptions
CREATE TABLE IF NOT EXISTS redemptionrequests (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    user_name VARCHAR(255),
    card_type VARCHAR(100),
    bank_name VARCHAR(255),
    account_no VARCHAR(100),
    account_holder VARCHAR(255),
    card_value INTEGER,
    phone_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes (Audit-Verified)
CREATE INDEX IF NOT EXISTS idx_manga_normalized_title_trgm ON manga USING gin(normalized_title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_manga_alternative_titles_trgm ON manga USING gin(alternative_titles gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON chapters(manga_id);
CREATE INDEX IF NOT EXISTS idx_chapters_updated_at ON chapters(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapterimages_chapter_id ON chapterimages(chapter_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_uuid ON favorites(user_uuid);
CREATE INDEX IF NOT EXISTS idx_readhistory_composite ON readhistory(user_uuid, manga_id);
CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_crawlertasks_status_priority ON crawlertasks(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_crawlertasks_manga_id ON crawlertasks(manga_id);
CREATE INDEX IF NOT EXISTS idx_crawllogs_created_at ON crawllogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guardianreports_created_at ON guardianreports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chapterimages_created_at ON chapterimages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_users_vipcoins ON users(vipcoins DESC);
