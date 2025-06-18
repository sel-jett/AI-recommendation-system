import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), '..', 'courses.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    return NextResponse.json({ courses: records });
  } catch (error) {
    console.error('Error reading courses:', error);
    return NextResponse.json(
      { error: 'Failed to load courses' },
      { status: 500 }
    );
  }
} 