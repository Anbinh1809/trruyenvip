-- TruyenVip TITAN-GRADE SQL Server (MSSQL) Schema
-- C1 FIX: Rewritten from PostgreSQL to T-SQL to match actual runtime database
-- Reference implementation: scripts/init-mssql.js
-- Last updated: 2026-04-21

-- 1. Identity & Users
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' and xtype='U')
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    uuid NVARCHAR(255) UNIQUE NOT NULL,
    username NVARCHAR(50) UNIQUE NOT NULL,
    email NVARCHAR(100),
    password_hash NVARCHAR(MAX) NOT NULL,
    xp BIGINT DEFAULT 0,
    [vipCoins] BIGINT DEFAULT 0,
    mission_data NVARCHAR(MAX) DEFAULT '{}',
    last_mission_reset DATETIME2 DEFAULT GETDATE(),
    role NVARCHAR(20) DEFAULT 'user',
    avatar NVARCHAR(MAX),
    last_stats_update DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 2. Manga Core
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='manga' and xtype='U')
CREATE TABLE manga (
    id NVARCHAR(255) PRIMARY KEY,
    title NVARCHAR(500) NOT NULL,
    normalized_title NVARCHAR(500),
    author NVARCHAR(255),
    status NVARCHAR(50),
    description NVARCHAR(MAX),
    cover NVARCHAR(MAX),
    trending BIT DEFAULT 0,
    views BIGINT DEFAULT 0,
    rating FLOAT DEFAULT 4.5,
    source_url NVARCHAR(MAX),
    alternative_titles NVARCHAR(MAX),
    views_at_source BIGINT DEFAULT 0,
    migration_count INT DEFAULT 0,
    last_chap_num NVARCHAR(255) DEFAULT N'Đang cập nhật',
    normalized_title NVARCHAR(500),
    last_crawled DATETIME2 DEFAULT GETDATE()
);

-- 3. Chapters
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chapters' and xtype='U')
CREATE TABLE chapters (
    id NVARCHAR(255) PRIMARY KEY,
    manga_id NVARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
    title NVARCHAR(1000) NOT NULL,
    chapter_number FLOAT,
    updated_at DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 DEFAULT GETDATE(),
    source_url NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'pending',
    fail_count INT DEFAULT 0,
    CONSTRAINT uq_chapters_manga_chapter UNIQUE(manga_id, chapter_number)
);

-- 4. Chapter Images
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chapterimages' and xtype='U')
CREATE TABLE chapterimages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    chapter_id NVARCHAR(255) REFERENCES chapters(id) ON DELETE CASCADE,
    image_url NVARCHAR(MAX) NOT NULL,
    [order] INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uq_chapterimages_chapter_order UNIQUE(chapter_id, [order])
);

-- 5. Genres
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='genres' and xtype='U')
CREATE TABLE genres (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) UNIQUE NOT NULL,
    slug NVARCHAR(100) UNIQUE NOT NULL
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='mangagenres' and xtype='U')
CREATE TABLE mangagenres (
    manga_id NVARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (manga_id, genre_id)
);

-- 6. Social & History
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='favorites' and xtype='U')
CREATE TABLE favorites (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_uuid NVARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    manga_id NVARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uq_favorites_user_manga UNIQUE(user_uuid, manga_id)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='readhistory' and xtype='U')
CREATE TABLE readhistory (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_uuid NVARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    manga_id NVARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
    chapter_id NVARCHAR(255) REFERENCES chapters(id),
    updated_at DATETIME2 DEFAULT GETDATE(),
    -- M4 FIX: Added UNIQUE constraint to prevent duplicate history records
    CONSTRAINT uq_readhistory_user_manga UNIQUE(user_uuid, manga_id)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='comments' and xtype='U')
CREATE TABLE comments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    chapter_id NVARCHAR(255) REFERENCES chapters(id) ON DELETE CASCADE,
    user_uuid NVARCHAR(255),
    user_name NVARCHAR(100) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    parent_id INT NULL,
    likes INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_comments_user FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE SET NULL,
    CONSTRAINT fk_comments_parent FOREIGN KEY (parent_id) REFERENCES comments(id)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='comment_likes' and xtype='U')
CREATE TABLE comment_likes (
    user_uuid NVARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    comment_id INT REFERENCES comments(id) ON DELETE CASCADE,
    PRIMARY KEY (user_uuid, comment_id)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='comment_reports' and xtype='U')
CREATE TABLE comment_reports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_uuid NVARCHAR(255),
    comment_id INT REFERENCES comments(id) ON DELETE CASCADE,
    reason NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_comment_reports_user FOREIGN KEY (user_uuid) REFERENCES users(uuid) ON DELETE SET NULL
);

-- 7. System & Crawler Infrastructure
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='system_config' and xtype='U')
CREATE TABLE system_config (
    [key] NVARCHAR(100) PRIMARY KEY,
    value NVARCHAR(MAX),
    updated_at DATETIME2 DEFAULT GETDATE()
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notifications' and xtype='U')
CREATE TABLE notifications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_uuid NVARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    type NVARCHAR(50) DEFAULT 'info',
    title NVARCHAR(MAX) NOT NULL,
    message NVARCHAR(MAX),
    link NVARCHAR(MAX),
    manga_id NVARCHAR(255),
    is_read BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_notifications_manga FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE SET NULL
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ratelimits' and xtype='U')
CREATE TABLE ratelimits (
    [key] NVARCHAR(255) PRIMARY KEY,
    count INT DEFAULT 1,
    reset_at DATETIME2 NOT NULL
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='dailycheckins' and xtype='U')
CREATE TABLE dailycheckins (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_uuid NVARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    checkin_date DATE NOT NULL,
    streak INT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uq_dailycheckins_user_date UNIQUE(user_uuid, checkin_date)
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='crawlertasks' and xtype='U')
CREATE TABLE crawlertasks (
    id INT IDENTITY(1,1) PRIMARY KEY,
    type NVARCHAR(50) NOT NULL,
    -- N4 NOTE: target is NVARCHAR(MAX) so cannot have UNIQUE index.
    -- MERGE operations rely on full table scan — consider using a hash column for indexing.
    target NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    priority INT DEFAULT 1,
    attempts INT DEFAULT 0,
    manga_id NVARCHAR(255),
    last_error NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT fk_crawlertasks_manga FOREIGN KEY (manga_id) REFERENCES manga(id) ON DELETE SET NULL
);

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='crawllogs' and xtype='U')
CREATE TABLE crawllogs (
    id INT IDENTITY(1,1) PRIMARY KEY,
    message NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(50) DEFAULT 'success',
    created_at DATETIME2 DEFAULT GETDATE()
);

-- Schema matches live DB and telemetry.js INSERT columns
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='guardianreports' and xtype='U')
CREATE TABLE guardianreports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    manga_id NVARCHAR(255),
    chapter_title NVARCHAR(255),
    event_type NVARCHAR(50),
    message NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 8. Redemptions
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='redemptionrequests' and xtype='U')
CREATE TABLE redemptionrequests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_uuid NVARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
    user_name NVARCHAR(100),
    card_type NVARCHAR(100),
    bank_name NVARCHAR(255),
    account_no NVARCHAR(100),
    account_holder NVARCHAR(255),
    card_value BIGINT,
    phone_number NVARCHAR(100),
    status NVARCHAR(50) DEFAULT 'pending',
    created_at DATETIME2 DEFAULT GETDATE()
);

-- 9. Push Subscriptions
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='pushsubscriptions' and xtype='U')
CREATE TABLE pushsubscriptions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    manga_id NVARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
    endpoint NVARCHAR(450) NOT NULL,
    p256dh NVARCHAR(255) NOT NULL,
    auth NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    CONSTRAINT uq_pushsubscriptions UNIQUE(manga_id, endpoint)
);

-- Performance Indexes
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_chapters_manga_id') CREATE INDEX idx_chapters_manga_id ON chapters(manga_id);
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_chapters_updated_at') CREATE INDEX idx_chapters_updated_at ON chapters(updated_at DESC);
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_users_xp') CREATE INDEX idx_users_xp ON users(xp DESC);
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_users_vipcoins') CREATE INDEX idx_users_vipcoins ON users(vipcoins DESC);
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_manga_views_rating') CREATE INDEX idx_manga_views_rating ON manga(views DESC, rating DESC);
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_crawlertasks_status') CREATE INDEX idx_crawlertasks_status ON crawlertasks(status, priority DESC);
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_crawlertasks_manga_id') CREATE INDEX idx_crawlertasks_manga_id ON crawlertasks(manga_id);
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_comments_chapter_id') CREATE INDEX idx_comments_chapter_id ON comments(chapter_id);
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_readhistory_composite') CREATE INDEX idx_readhistory_composite ON readhistory(user_uuid, manga_id);
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_crawllogs_created_at') CREATE INDEX idx_crawllogs_created_at ON crawllogs(created_at DESC);
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_guardianreports_created_at') CREATE INDEX idx_guardianreports_created_at ON guardianreports(created_at DESC);
IF NOT EXISTS(SELECT * FROM sys.indexes WHERE name = 'idx_chapterimages_created_at') CREATE INDEX idx_chapterimages_created_at ON chapterimages(created_at DESC);
