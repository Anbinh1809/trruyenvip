-- TruyenVip TITAN-GRADE PostgreSQL Schema
-- Run this in the Neon.tech SQL Editor

-- 1. Identity & Users
CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    password_hash VARCHAR(255),
    xp INTEGER DEFAULT 0,
    vipCoins INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    avatar TEXT,
    contribution_points INTEGER DEFAULT 0,
    badge_ids TEXT,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Manga Core
CREATE TABLE IF NOT EXISTS Manga (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    cover TEXT,
    source_url TEXT,
    normalized_title VARCHAR(500),
    author VARCHAR(255),
    status VARCHAR(100),
    description TEXT,
    last_chap_num VARCHAR(100),
    rating DOUBLE PRECISION DEFAULT 0,
    views BIGINT DEFAULT 0,
    views_at_source BIGINT DEFAULT 0,
    last_crawled TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    migration_count INTEGER DEFAULT 0,
    alternative_titles TEXT
);

-- 3. Chapters
CREATE TABLE IF NOT EXISTS Chapters (
    id VARCHAR(255) PRIMARY KEY,
    manga_id VARCHAR(255) REFERENCES Manga(id) ON DELETE CASCADE,
    title VARCHAR(500),
    source_url TEXT,
    chapter_number DOUBLE PRECISION,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    retry_count INTEGER DEFAULT 0,
    last_error TEXT
);

-- 4. Images
CREATE TABLE IF NOT EXISTS ChapterImages (
    id SERIAL PRIMARY KEY,
    chapter_id VARCHAR(255) REFERENCES Chapters(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    "order" INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Genres
CREATE TABLE IF NOT EXISTS Genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS MangaGenres (
    manga_id VARCHAR(255) REFERENCES Manga(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES Genres(id) ON DELETE CASCADE,
    PRIMARY KEY (manga_id, genre_id)
);

-- 6. Social & History
CREATE TABLE IF NOT EXISTS Favorites (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    manga_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uuid, manga_id)
);

CREATE TABLE IF NOT EXISTS ReadHistory (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    manga_id VARCHAR(255) NOT NULL,
    chapter_id VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uuid, manga_id)
);

CREATE TABLE IF NOT EXISTS Comments (
    id SERIAL PRIMARY KEY,
    chapter_id VARCHAR(255) NOT NULL,
    user_uuid VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. System & Crawler
CREATE TABLE IF NOT EXISTS DailyCheckins (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    checkin_date DATE NOT NULL,
    streak INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_uuid, checkin_date)
);

CREATE TABLE IF NOT EXISTS CrawlerTasks (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    target TEXT UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    attempts INTEGER DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS CrawlLogs (
    id SERIAL PRIMARY KEY,
    message TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS GuardianReports (
    id SERIAL PRIMARY KEY,
    manga_name VARCHAR(255),
    chapter_title VARCHAR(255),
    event_type VARCHAR(50),
    message TEXT,
    cover TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Financial & Redemptions
CREATE TABLE IF NOT EXISTS RedemptionRequests (
    id SERIAL PRIMARY KEY,
    user_uuid VARCHAR(255) NOT NULL,
    user_name VARCHAR(255),
    card_type VARCHAR(100),
    card_value INTEGER,
    phone_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending',
    reward_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_manga_norm ON Manga(normalized_title);
CREATE INDEX IF NOT EXISTS idx_chapters_manga ON Chapters(manga_id);
CREATE INDEX IF NOT EXISTS idx_images_chap ON ChapterImages(chapter_id);
CREATE INDEX IF NOT EXISTS idx_fav_user ON Favorites(user_uuid);
CREATE INDEX IF NOT EXISTS idx_history_user ON ReadHistory(user_uuid);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON CrawlerTasks(status, priority);
