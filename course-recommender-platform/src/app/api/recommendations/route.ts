import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'user_0';
    const topK = parseInt(searchParams.get('topK') || '10');

    // Try to call the Python backend first
    try {
      const pythonResponse = await fetch('http://localhost:5000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, topK })
      });

      if (pythonResponse.ok) {
        const data = await pythonResponse.json();
        return NextResponse.json({ 
          recommendations: data.recommendations,
          message: "Recommendations from Python AI backend"
        });
      }
    } catch (error) {
      console.log('Python backend not available, using fallback algorithm');
    }

    // Fallback: Simple recommendation algorithm
    const csvPath = path.join(process.cwd(), '..', 'courses.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Simple recommendation: return top courses by subscribers
    const recommendations = records
      .sort((a: any, b: any) => parseInt(b.num_subscribers) - parseInt(a.num_subscribers))
      .slice(0, topK)
      .map((course: any) => ({
        course_id: course.course_id,
        course_title: course.course_title,
        subject: course.subject,
        level: course.level,
        price: course.price,
        num_subscribers: course.num_subscribers,
        num_reviews: course.num_reviews,
        num_lectures: course.num_lectures,
        content_duration: course.content_duration
      }));

    return NextResponse.json({ 
      recommendations,
      message: "Using fallback algorithm. Start the Python backend for AI-powered recommendations."
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    );
  }
} 