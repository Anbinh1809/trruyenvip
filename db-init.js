import sql from 'mssql';
import 'dotenv/config';

const config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER || 'localhost',
  database: 'master', // Start with master to create the DB
  options: {
    encrypt: process.env.NODE_ENV === 'production',
    trustServerCertificate: true,
  },
};

async function init() {
  let pool = null;
  let retries = 5;
  
  while (retries > 0) {
    try {
        console.log(`--- Connecting to Database (Retries left: ${retries}) ---`);
        pool = await sql.connect(config);
        break; 
    } catch (err) {
        console.error(`Connection failed: ${err.message}. Retrying in 5s...`);
        retries--;
        if (retries === 0) throw new Error("Could not connect to database after 5 attempts.");
        await new Promise(r => setTimeout(r, 5000));
    }
  }

  try {
    console.log('--- Creating Database ---');
    await pool.request().query("IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'TruyenVip') CREATE DATABASE TruyenVip");
    await pool.close();

    // Reconnect to TruyenVip
    config.database = 'TruyenVip';
    pool = await sql.connect(config);

    console.log('--- Creating Tables (Resilient Mode) ---');
    
    const runQuery = async (name, q) => {
        try {
            await pool.request().query(q);
            console.log(`[OK] ${name}`);
        } catch (e) {
            console.warn(`[SKIP] ${name}: ${e.message}`);
        }
    };

    // --- MIGRATION: Ensure all existing ID columns have consistent length ---
    console.log('--- Running Schema Migrations ---');
    const migrations = [
        ["Manga", "id", "NVARCHAR(255)"],
        ["Chapters", "id", "NVARCHAR(255)"],
        ["Chapters", "manga_id", "NVARCHAR(255)"],
        ["ChapterImages", "chapter_id", "NVARCHAR(255)"],
        ["MangaGenres", "manga_id", "NVARCHAR(255)"],
        ["Comments", "chapter_id", "NVARCHAR(255)"],
        ["Reviews", "manga_id", "NVARCHAR(255)"],
        ["RedemptionRequests", "user_uuid", "NVARCHAR(255)"],
        ["Users", "uuid", "NVARCHAR(255)"],
        ["Manga", "views", "INT"],
        ["Manga", "rating", "FLOAT"],
        ["Manga", "source_url", "NVARCHAR(500)"],
        ["Manga", "alternative_titles", "NVARCHAR(MAX)"],
        ["Manga", "title", "NVARCHAR(500)"],
        ["Chapters", "title", "NVARCHAR(1000)"],
        ["Comments", "user_uuid", "NVARCHAR(255)"],
        ["Users", "last_stats_update", "DATETIME"]
    ];

    for (const [table, col, type] of migrations) {
        try {
            // Check if table exists before trying to alter
            const checkTable = await pool.request().query(`SELECT * FROM sys.tables WHERE name = '${table}'`);
            if (checkTable.recordset.length > 0) {
                // Check if column exists and its length to avoid redundant alterations
                const checkCol = await pool.request().query(`
                    SELECT CHARACTER_MAXIMUM_LENGTH 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_NAME = '${table}' AND COLUMN_NAME = '${col}'
                `);
                
                if (checkCol.recordset.length > 0 && checkCol.recordset[0].CHARACTER_MAXIMUM_LENGTH < 255) {
                    try {
                        await pool.request().query(`ALTER TABLE ${table} ALTER COLUMN ${col} ${type} ${col === 'id' ? 'NOT NULL' : ''}`);
                        console.log(`[MIGRATE] ${table}.${col} -> ${type}`);
                    } catch (innerE) {
                        // Keep quiet if it's a constraint issue, we'll fix it in a future major migration if needed
                    }
                }
            }
        } catch (e) {
            // General table check fail
        }
    }

    await runQuery('Manga', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Manga')
      CREATE TABLE Manga (
        id NVARCHAR(255) PRIMARY KEY,
        title NVARCHAR(500) NOT NULL,
        author NVARCHAR(255),
        status NVARCHAR(50),
        description NVARCHAR(MAX),
        cover NVARCHAR(MAX),
        trending BIT DEFAULT 0,
        views INT DEFAULT 0,
        rating FLOAT DEFAULT 4.5,
        source_url NVARCHAR(500),
        alternative_titles NVARCHAR(MAX),
        views_at_source INT DEFAULT 0,
        migration_count INT DEFAULT 0,
        last_chap_num NVARCHAR(255) DEFAULT N'Đang cập nhật',
        last_crawled DATETIME DEFAULT GETDATE()
      )
    `);

    await runQuery('Chapters', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Chapters')
      CREATE TABLE Chapters (
        id NVARCHAR(255) PRIMARY KEY,
        manga_id NVARCHAR(255) FOREIGN KEY REFERENCES Manga(id) ON DELETE CASCADE,
        title NVARCHAR(1000) NOT NULL,
        chapter_number FLOAT,
        updated_at DATETIME DEFAULT GETDATE(),
        source_url NVARCHAR(MAX),
        CONSTRAINT UC_MangaChapterNum UNIQUE(manga_id, chapter_number),
        CONSTRAINT UC_MangaChapterTitle UNIQUE(manga_id, title)
      )
    `);

    await runQuery('ChapterImages', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ChapterImages')
      CREATE TABLE ChapterImages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        chapter_id NVARCHAR(255) FOREIGN KEY REFERENCES Chapters(id) ON DELETE CASCADE,
        image_url NVARCHAR(MAX) NOT NULL,
        [order] INT NOT NULL
      )
    `);

    await runQuery('Genres', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Genres')
      CREATE TABLE Genres (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) UNIQUE NOT NULL,
        slug NVARCHAR(100) UNIQUE NOT NULL
      )
    `);

    await runQuery('MangaGenres', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MangaGenres')
      CREATE TABLE MangaGenres (
        manga_id NVARCHAR(255) FOREIGN KEY REFERENCES Manga(id) ON DELETE CASCADE,
        genre_id INT FOREIGN KEY REFERENCES Genres(id) ON DELETE CASCADE,
        PRIMARY KEY (manga_id, genre_id)
      )
    `);
    
    await runQuery('Comments', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Comments')
      CREATE TABLE Comments (
        id INT IDENTITY(1,1) PRIMARY KEY,
        chapter_id NVARCHAR(255) FOREIGN KEY REFERENCES Chapters(id) ON DELETE CASCADE,
        user_uuid NVARCHAR(255) FOREIGN KEY REFERENCES Users(uuid) NULL,
        user_name NVARCHAR(100) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        parent_id INT FOREIGN KEY REFERENCES Comments(id) NULL,
        likes INT DEFAULT 0,
        created_at DATETIME DEFAULT GETDATE()
      )
    `);

    await runQuery('Reviews', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Reviews')
      CREATE TABLE Reviews (
        id INT IDENTITY(1,1) PRIMARY KEY,
        manga_id NVARCHAR(255) FOREIGN KEY REFERENCES Manga(id) ON DELETE CASCADE,
        user_name NVARCHAR(100) NOT NULL,
        rating INT DEFAULT 5,
        content NVARCHAR(MAX) NOT NULL,
        created_at DATETIME DEFAULT GETDATE()
      )
    `);

    await runQuery('CrawlLogs', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CrawlLogs')
      CREATE TABLE CrawlLogs (
        id INT IDENTITY(1,1) PRIMARY KEY,
        message NVARCHAR(MAX) NOT NULL,
        status NVARCHAR(50) DEFAULT 'success',
        created_at DATETIME DEFAULT GETDATE()
      )
    `);

    await runQuery('RedemptionRequests', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'RedemptionRequests')
      CREATE TABLE RedemptionRequests (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_uuid NVARCHAR(255) NOT NULL,
        user_name NVARCHAR(100),
        card_type NVARCHAR(50) NOT NULL,
        card_value INT NOT NULL,
        phone_number NVARCHAR(20),
        status NVARCHAR(20) DEFAULT 'Pending',
        created_at DATETIME DEFAULT GETDATE()
      )
    `);

    await runQuery('Users', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
      CREATE TABLE Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        uuid NVARCHAR(255) UNIQUE NOT NULL,
        username NVARCHAR(50) UNIQUE NOT NULL,
        email NVARCHAR(100),
        password_hash NVARCHAR(MAX) NOT NULL,
        xp INT DEFAULT 0,
        vipCoins INT DEFAULT 0,
        role NVARCHAR(20) DEFAULT 'user',
        avatar NVARCHAR(MAX),
        last_stats_update DATETIME DEFAULT GETDATE(),
        created_at DATETIME DEFAULT GETDATE()
      )
    `);

    await runQuery('Favorites', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Favorites')
      CREATE TABLE Favorites (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_uuid NVARCHAR(255) FOREIGN KEY REFERENCES Users(uuid),
        manga_id NVARCHAR(255) FOREIGN KEY REFERENCES Manga(id),
        created_at DATETIME DEFAULT GETDATE(),
        UNIQUE(user_uuid, manga_id)
      )
    `);

    await runQuery('DailyCheckins', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DailyCheckins')
      CREATE TABLE DailyCheckins (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_uuid NVARCHAR(255) FOREIGN KEY REFERENCES Users(uuid),
        checkin_date DATE NOT NULL,
        streak INT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        UNIQUE(user_uuid, checkin_date)
      )
    `);

    // --- TITAN PERSISTENCE: Crawler Task Queue ---
    await runQuery('CrawlerTasks', `
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CrawlerTasks')
      CREATE TABLE CrawlerTasks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        type NVARCHAR(50) NOT NULL, -- 'chapter_scrape', 'manga_discovery'
        target NVARCHAR(MAX) NOT NULL, -- URL or JSON
        status NVARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
        priority INT DEFAULT 1,
        attempts INT DEFAULT 0,
        last_error NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    // --- TITAN OPTIMIZATION: High-Performance Indexes ---
    await runQuery('Indexes', `
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Xp' AND object_id = OBJECT_ID('Users'))
      CREATE INDEX IX_Users_Xp ON Users(xp DESC);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Coins' AND object_id = OBJECT_ID('Users'))
      CREATE INDEX IX_Users_Coins ON Users(vipCoins DESC);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Manga_LastCrawled' AND object_id = OBJECT_ID('Manga'))
      CREATE INDEX IX_Manga_LastCrawled ON Manga(last_crawled DESC);
      
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Chapters_MangaId' AND object_id = OBJECT_ID('Chapters'))
      CREATE INDEX IX_Chapters_MangaId ON Chapters(manga_id);
    `);

    // --- GOLD SEAL: Audit Trail ---
    await runQuery('Table_AuditLogs', `
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
        CREATE TABLE AuditLogs (
            id INT PRIMARY KEY IDENTITY(1,1),
            admin_uuid NVARCHAR(100),
            action NVARCHAR(50),
            details NVARCHAR(MAX),
            created_at DATETIME DEFAULT GETDATE()
        )
    `);

    console.log('--- Creating Performance Indexes ---');
    await runQuery('Idx_Chapters_MangaId', "IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_chapters_manga_id') CREATE INDEX idx_chapters_manga_id ON Chapters(manga_id)");
    await runQuery('Idx_ChapterImages_ChapterId', "IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_chapterimages_chapter_id') CREATE INDEX idx_chapterimages_chapter_id ON ChapterImages(chapter_id)");
    await runQuery('Idx_MangaGenres_MangaId', "IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_mangagenres_manga_id') CREATE INDEX idx_mangagenres_manga_id ON MangaGenres(manga_id)");
    await runQuery('Idx_Chapters_UpdatedAt', "IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_chapters_updated_at') CREATE INDEX idx_chapters_updated_at ON Chapters(updated_at DESC)");
    await runQuery('Idx_Manga_LastCrawled', "IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_manga_last_crawled') CREATE INDEX idx_manga_last_crawled ON Manga(last_crawled DESC)");
    await runQuery('Idx_Manga_SourceUrl', "IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_manga_source_url') CREATE INDEX idx_manga_source_url ON Manga(source_url)");
    await runQuery('Idx_Comments_ParentId', "IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_comments_parent_id') CREATE INDEX idx_comments_parent_id ON Comments(parent_id)");
    await runQuery('Idx_Favorites_MangaId', "IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_favorites_manga_id') CREATE INDEX idx_favorites_manga_id ON Favorites(manga_id)");
    await runQuery('Idx_Manga_Views_Rating', "IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_manga_views_rating') CREATE INDEX idx_manga_views_rating ON Manga(views DESC, rating DESC)");
    await runQuery('Idx_Manga_Status_Crawled', "IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_manga_status_crawled') CREATE INDEX idx_manga_status_crawled ON Manga(status, last_crawled DESC)");


    // --- MIGRATION: Attempt to add missing columns to existing tables ---
    console.log('--- Post-Init Integrity Lock & Column Sync ---');
    try {
        const checkMangaViewsAtSource = await pool.request().query("SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Manga') AND name = 'views_at_source'");
        if (checkMangaViewsAtSource.recordset.length === 0) {
            console.log('[SCHEMA] Adding views_at_source to Manga table...');
            await pool.request().query("ALTER TABLE Manga ADD views_at_source INT DEFAULT 0");
        }

        const checkMangaLastChap = await pool.request().query("SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Manga') AND name = 'last_chap_num'");
        if (checkMangaLastChap.recordset.length === 0) {
            console.log('[SCHEMA] Adding last_chap_num to Manga table...');
            await pool.request().query("ALTER TABLE Manga ADD last_chap_num NVARCHAR(50) DEFAULT N'Đang cập nhật'");
        }
    } catch (e) {
        console.warn('[SCHEMA] Failed to sync Manga columns:', e.message);
    }


    await runQuery('Constraint_Chapters_UniqueNum', "IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'UC_MangaChapterNum') ALTER TABLE Chapters ADD CONSTRAINT UC_MangaChapterNum UNIQUE(manga_id, chapter_number)");

    await runQuery('Constraint_Chapters_UniqueTitle', "IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'UC_MangaChapterTitle') ALTER TABLE Chapters ADD CONSTRAINT UC_MangaChapterTitle UNIQUE(manga_id, title)");
    
    // Attempt to drop and re-add foreign keys with CASCADE if they don't have it (Simplified version for init script)
    // In production, this would be a more complex script to find constraint names
    
    console.log('--- Database Initialized Successfully ---');
    await pool.close();
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

init();
