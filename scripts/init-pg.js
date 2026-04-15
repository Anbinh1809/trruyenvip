import 'dotenv/config';
import { query } from '../src/lib/db.js';

async function init() {
    console.log('--- Initializing TruyenVip PostgreSQL (Neon) Schema ---');
    try {
        // 1. EXTENSIONS
        console.log('[1/4] Enabling Extensions...');
        await query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');

        // 2. CORE TABLES
        console.log('[2/4] Creating Core Tables...');

        await query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                uuid VARCHAR(255) UNIQUE NOT NULL,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100),
                password_hash TEXT NOT NULL,
                xp INT DEFAULT 0,
                vipcoins INT DEFAULT 0,
                mission_data JSONB DEFAULT '{}',
                last_mission_reset TIMESTAMPTZ DEFAULT NOW(),
                role VARCHAR(20) DEFAULT 'user',
                avatar TEXT,
                last_stats_update TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // TITAN-GRADE MIGRATION: Ensure columns exist if table was created in a previous version
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS mission_data JSONB DEFAULT '{}';`);
        await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_mission_reset TIMESTAMPTZ DEFAULT NOW();`);

        await query(`
            CREATE TABLE IF NOT EXISTS manga (
                id VARCHAR(255) PRIMARY KEY,
                title VARCHAR(500) NOT NULL,
                normalized_title VARCHAR(500),
                author VARCHAR(255),
                status VARCHAR(50),
                description TEXT,
                cover TEXT,
                trending BOOLEAN DEFAULT FALSE,
                views BIGINT DEFAULT 0,
                rating DOUBLE PRECISION DEFAULT 4.5,
                source_url TEXT UNIQUE,
                alternative_titles TEXT,
                views_at_source BIGINT DEFAULT 0,
                migration_count INT DEFAULT 0,
                last_chap_num VARCHAR(255) DEFAULT 'Đang cập nhật',
                last_crawled TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS chapters (
                id VARCHAR(255) PRIMARY KEY,
                manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
                title VARCHAR(1000) NOT NULL,
                chapter_number DOUBLE PRECISION,
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW(),
                source_url TEXT,
                UNIQUE(manga_id, chapter_number)
            );
        `);

        // TITAN-GRADE MIGRATION: Health Tracking
        await query(`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';`);
        await query(`ALTER TABLE chapters ADD COLUMN IF NOT EXISTS fail_count INT DEFAULT 0;`);

        await query(`
            CREATE TABLE IF NOT EXISTS chapterimages (
                id SERIAL PRIMARY KEY,
                chapter_id VARCHAR(255) REFERENCES chapters(id) ON DELETE CASCADE,
                image_url TEXT NOT NULL,
                "order" INT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(chapter_id, "order")
            );
        `);

        // 3. AUXILIARY TABLES
        console.log('[3/4] Creating Auxiliary Tables...');

        await query(`
            CREATE TABLE IF NOT EXISTS genres (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS mangagenres (
                manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
                genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
                PRIMARY KEY (manga_id, genre_id)
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS comments (
                id SERIAL PRIMARY KEY,
                chapter_id VARCHAR(255) REFERENCES chapters(id) ON DELETE CASCADE,
                user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE SET NULL,
                user_name VARCHAR(100) NOT NULL,
                content TEXT NOT NULL,
                parent_id INT REFERENCES comments(id) NULL,
                likes INT DEFAULT 0,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS favorites (
                id SERIAL PRIMARY KEY,
                user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
                manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_uuid, manga_id)
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS readhistory (
                id SERIAL PRIMARY KEY,
                user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
                manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE CASCADE,
                chapter_id VARCHAR(255) REFERENCES chapters(id) ON DELETE CASCADE,
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS crawllogs (
                id SERIAL PRIMARY KEY,
                message TEXT NOT NULL,
                status VARCHAR(50) DEFAULT 'success',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS crawlertasks (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                target TEXT NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                priority INT DEFAULT 1,
                attempts INT DEFAULT 0,
                manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE SET NULL,
                last_error TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS system_config (
                key VARCHAR(100) PRIMARY KEY,
                value JSONB,
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS guardianreports (
                id SERIAL PRIMARY KEY,
                manga_name VARCHAR(255),
                chapter_title VARCHAR(255),
                event_type VARCHAR(50),
                message TEXT,
                cover TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS redemptionrequests (
                id SERIAL PRIMARY KEY,
                user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
                user_name VARCHAR(100),
                card_type VARCHAR(100),
                bank_name VARCHAR(255),
                account_no VARCHAR(100),
                account_holder VARCHAR(255),
                card_value INT,
                phone_number VARCHAR(100),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS ratelimits (
                key VARCHAR(255) PRIMARY KEY,
                count INT DEFAULT 1,
                reset_at TIMESTAMPTZ NOT NULL
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS notifications (
                id SERIAL PRIMARY KEY,
                user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
                type VARCHAR(50) DEFAULT 'info',
                title TEXT NOT NULL,
                message TEXT,
                link TEXT,
                manga_id VARCHAR(255) REFERENCES manga(id) ON DELETE SET NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS comment_likes (
                user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE CASCADE,
                comment_id INT REFERENCES comments(id) ON DELETE CASCADE,
                PRIMARY KEY (user_uuid, comment_id)
            );
        `);

        await query(`
            CREATE TABLE IF NOT EXISTS comment_reports (
                id SERIAL PRIMARY KEY,
                user_uuid VARCHAR(255) REFERENCES users(uuid) ON DELETE SET NULL,
                comment_id INT REFERENCES comments(id) ON DELETE CASCADE,
                reason TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);

        // 4. PERFORMANCE INDEXES
        console.log('[4/4] Creating Performance Indexes...');
        
        // Trigram Indexes for Fuzzy Search
        await query('CREATE INDEX IF NOT EXISTS idx_manga_title_trgm ON manga USING gin (title gin_trgm_ops);');
        await query('CREATE INDEX IF NOT EXISTS idx_manga_alt_titles_trgm ON manga USING gin (alternative_titles gin_trgm_ops);');
        await query('CREATE INDEX IF NOT EXISTS idx_manga_norm_title_trgm ON manga USING gin (normalized_title gin_trgm_ops);');

        // Standard Indexes
        await query('CREATE INDEX IF NOT EXISTS idx_chapters_manga_id ON chapters(manga_id);');
        await query('CREATE INDEX IF NOT EXISTS idx_chapters_updated_at ON chapters(updated_at DESC);');
        await query('CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);');
        await query('CREATE INDEX IF NOT EXISTS idx_users_vipcoins ON users(vipcoins DESC);');
        await query('CREATE INDEX IF NOT EXISTS idx_manga_views_rating ON manga(views DESC, rating DESC);');
        await query('CREATE INDEX IF NOT EXISTS idx_crawlertasks_status ON crawlertasks(status, priority DESC);');
        await query('CREATE INDEX IF NOT EXISTS idx_crawlertasks_manga_id ON crawlertasks(manga_id);');
        await query('CREATE INDEX IF NOT EXISTS idx_comments_chapter_id ON comments(chapter_id);');
        await query('CREATE INDEX IF NOT EXISTS idx_readhistory_composite ON readhistory(user_uuid, manga_id);');
        
        // Time-based Indexes for Scaling
        await query('CREATE INDEX IF NOT EXISTS idx_crawllogs_created_at ON crawllogs(created_at DESC);');
        await query('CREATE INDEX IF NOT EXISTS idx_guardianreports_created_at ON guardianreports(created_at DESC);');
        await query('CREATE INDEX IF NOT EXISTS idx_chapterimages_created_at ON chapterimages(created_at DESC);');

        console.log('--- PostgreSQL Initialization Complete ---');
    } catch (err) {
        console.error('--- Init Failed ---');
        console.error(err);
    }
}

init();
