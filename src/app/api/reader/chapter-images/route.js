import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

        const result = await query('SELECT image_url FROM ChapterImages WHERE chapter_id = @id ORDER BY "order" ASC', { id });
        
        return NextResponse.json({ 
            success: true, 
            images: result.recordset
        });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
