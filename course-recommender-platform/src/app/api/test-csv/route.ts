import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), '..', 'courses.csv');
    console.log('Testing CSV path:', csvPath);
    
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: 'CSV file not found' }, { status: 404 });
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Get a sample of courses
    const sampleCourses = records.slice(0, 5).map((course: any) => ({
      course_id: course.course_id,
      course_title: course.course_title,
      subject: course.subject,
      level: course.level
    }));

    return NextResponse.json({
      success: true,
      totalCourses: records.length,
      sampleCourses,
      csvPath
    });
  } catch (error) {
    console.error('Error testing CSV:', error);
    return NextResponse.json({ error: 'Failed to read CSV' }, { status: 500 });
  }
} 