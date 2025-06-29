import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's recent course views
    const recentViews = await prisma.userCourseView.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        viewedAt: 'desc',
      },
      take: 10,
    });

    // Load CSV data
    const csvPath = path.join(process.cwd(), '..', 'courses.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Test course ID matching
    const viewedCourseIds = recentViews.map(view => view.courseId);
    const viewedCourses = records.filter((course: any) => 
      viewedCourseIds.includes(course.course_id)
    );

    // Get some sample courses from CSV
    const sampleCourses = records.slice(0, 5).map((course: any) => ({
      course_id: course.course_id,
      course_title: course.course_title,
      subject: course.subject,
      level: course.level
    }));

    // Test specific course IDs
    const testCourseIds = ['768028', '145220', '738910', '591880', '302450'];
    const testResults = testCourseIds.map(id => {
      const found = records.find((course: any) => course.course_id === id);
      return {
        courseId: id,
        found: !!found,
        course: found ? {
          course_id: found.course_id,
          course_title: found.course_title,
          subject: found.subject,
          level: found.level
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      userId: session.user.id,
      recentViews: recentViews.map(v => ({
        courseId: v.courseId,
        viewedAt: v.viewedAt
      })),
      totalCoursesInCSV: records.length,
      viewedCoursesFound: viewedCourses.length,
      viewedCoursesDetails: viewedCourses.map(c => ({
        course_id: c.course_id,
        course_title: c.course_title,
        subject: c.subject,
        level: c.level
      })),
      sampleCourses,
      testResults,
      debug: {
        viewedCourseIds,
        csvPath,
        csvExists: fs.existsSync(csvPath)
      }
    });
  } catch (error) {
    console.error('Error testing recommendations:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
} 