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
    const userLevels = [...new Set(viewedCourses.map((course: any) => course.level))];

    // Calculate scores for all courses (same as main algorithm)
    const scoredCourses = records
      .filter((course: any) => !viewedCourseIds.includes(course.course_id))
      .map((course: any) => {
        let score = 0;
        
        // Subject match (MUCH higher weight)
        if (userSubjects.includes(course.subject)) {
          score += 200;
        }
        
        // Level match (high weight)
        if (userLevels.includes(course.level)) {
          score += 50;
        }
        
        // Popularity bonus (reduced weight)
        const subscribers = parseInt(course.num_subscribers) || 0;
        score += Math.min(subscribers / 10000, 5);
        
        // Add very little randomness for variety
        score += Math.random() * 2;
        
        return { ...course, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 20); // Show top 20 for debugging

    // Get the most recently viewed course
    const mostRecentView = recentViews[0];
    const mostRecentCourse = records.find((course: any) => 
      course.course_id === mostRecentView?.courseId
    );

    // Get same subject courses
    const sameSubjectCourses = scoredCourses
      .filter((course: any) => course.subject === mostRecentCourse?.subject)
      .slice(0, 5);

    // Get other subject courses
    const otherSubjectCourses = scoredCourses
      .filter((course: any) => course.subject !== mostRecentCourse?.subject)
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      userProfile: {
        userId: session.user.id,
        viewedCourses: viewedCourseIds.length,
        userSubjects,
        userLevels,
        mostRecentCourse: mostRecentCourse ? {
          course_id: mostRecentCourse.course_id,
          course_title: mostRecentCourse.course_title,
          subject: mostRecentCourse.subject,
          level: mostRecentCourse.level
        } : null
      },
      scoringAnalysis: {
        subjectWeight: 200,
        levelWeight: 50,
        popularityWeight: 5,
        randomnessWeight: 2
      },
      topScoredCourses: scoredCourses.slice(0, 10).map(course => ({
        course_id: course.course_id,
        course_title: course.course_title,
        subject: course.subject,
        level: course.level,
        score: Math.round(course.score * 100) / 100,
        subscribers: course.num_subscribers,
        reviews: course.num_reviews
      })),
      sameSubjectRecommendations: sameSubjectCourses.map(course => ({
        course_id: course.course_id,
        course_title: course.course_title,
        subject: course.subject,
        level: course.level,
        score: Math.round(course.score * 100) / 100
      })),
      otherSubjectRecommendations: otherSubjectCourses.map(course => ({
        course_id: course.course_id,
        course_title: course.course_title,
        subject: course.subject,
        level: course.level,
        score: Math.round(course.score * 100) / 100
      })),
      subjectDistribution: {
        userSubjects,
        topRecommendationSubjects: [...new Set(scoredCourses.slice(0, 12).map(c => c.subject))],
        sameSubjectCount: sameSubjectCourses.length,
        otherSubjectCount: otherSubjectCourses.length
      }
    });
  } catch (error) {
    console.error('Error debugging recommendations:', error);
    return NextResponse.json({ error: 'Failed to debug recommendations' }, { status: 500 });
  }
} 