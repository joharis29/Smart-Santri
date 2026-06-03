import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    const supabase = createAdminClient();
    
    const sqlPath = path.join(process.cwd(), 'docs', 'migration_fix_trigger_columns.sql');
    const sqlString = fs.readFileSync(sqlPath, 'utf8');
    
    return NextResponse.json({ 
        message: "File is ready. Please run docs/migration_fix_trigger_columns.sql in Supabase SQL Editor."
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
