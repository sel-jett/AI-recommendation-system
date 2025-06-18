import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const csvPath = path.join(process.cwd(), '..', 'courses.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    const course = records.find((course: any) => course.course_id === params.id);

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