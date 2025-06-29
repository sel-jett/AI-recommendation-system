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

    // Load CSV data
    const csvPath = path.join(process.cwd(), '..', 'courses.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Get all unique subjects
    const allSubjects = [...new Set(records.map((course: any) => course.subject))];
    
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

    const viewedCourseIds = recentViews.map(view => view.courseId);
    const viewedCourses = records.filter((course: any) => 
      viewedCourseIds.includes(course.course_id)
    );

    const userSubjects = [...new Set(viewedCourses.map((course: any) => course.subject))];

    // Get recommendations from different subject areas
    const differentSubjectRecommendations = allSubjects
      .filter(subject => !userSubjects.includes(subject))
      .slice(0, 5)
      .map(subject => {
        const coursesInSubject = records
          .filter((course: any) => course.subject === subject)
          .sort((a: any, b: any) => {
            const subscribersA = parseInt(a.num_subscribers) || 0;
            const subscribersB = parseInt(b.num_subscribers) || 0;
            return subscribersB - subscribersA;
          })
          .slice(0, 3)
          .map((course: any) => ({
            course_id: course.course_id,
            course_title: course.course_title,
            subject: course.subject,
            level: course.level,
            num_subscribers: course.num_subscribers
          }));

        return {
          subject,
          courses: coursesInSubject
        };
      });

    // Get current personalized recommendations
    const currentRecommendations = records
      .filter((course: any) => !viewedCourseIds.includes(course.course_id))
      .filter((course: any) => userSubjects.includes(course.subject))
      .sort((a: any, b: any) => {
        const subscribersA = parseInt(a.num_subscribers) || 0;
        const subscribersB = parseInt(b.num_subscribers) || 0;
        return subscribersB - subscribersA;
      })
      .slice(0, 5)
      .map((course: any) => ({
        course_id: course.course_id,
        course_title: course.course_title,
        subject: course.subject,
        level: course.level,
        num_subscribers: course.num_subscribers
      }));

    return NextResponse.json({
      success: true,
      userId: session.user.id,
      userSubjects,
      viewedCourses: viewedCourses.length,
      currentPersonalizedRecommendations: currentRecommendations,
      differentSubjectRecommendations,
      allAvailableSubjects: allSubjects.slice(0, 10), // Show first 10 subjects
      message: `You've viewed courses in: ${userSubjects.join(', ')}. Try viewing courses in different subjects to see more varied recommendations!`
    });
  } catch (error) {
    console.error('Error testing different subjects:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
} 