import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }
    const csvPath = path.join(process.cwd(), '..', 'courses.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    const course = records.find((course: any) => course.course_id === id);

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error reading course:', error);
    return NextResponse.json(
      { error: 'Failed to load course' },
      { status: 500 }
    );
  }
} 