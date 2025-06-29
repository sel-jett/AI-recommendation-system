import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const topK = parseInt(searchParams.get('topK') || '12');

    console.log(`\n=== RECOMMENDATION REQUEST ===`);
    console.log(`Getting recommendations for user: ${session.user.id}`);

    // Load CSV data
    const csvPath = path.join(process.cwd(), '..', 'courses.csv');
    console.log('Reading CSV from:', csvPath);
    
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found at:', csvPath);
      return NextResponse.json(
        { error: 'Course data not available' },
        { status: 500 }
      );
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`Loaded ${records.length} courses from CSV`);

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

    // Get the most recently viewed course to ensure recommendations from same category
    const mostRecentView = recentViews[0];
    const mostRecentCourse = records.find((course: any) => 
      course.course_id === mostRecentView?.courseId
    );

    console.log('User has viewed', viewedCourseIds.length, 'courses:', viewedCourseIds);
    if (mostRecentCourse) {
      console.log('Most recent course:', mostRecentCourse.course_title, 'in', mostRecentCourse.subject);
    }

    console.log(`Found ${viewedCourses.length} viewed courses in CSV data`);
    console.log('Viewed courses details:', viewedCourses.map(c => ({
      course_id: c.course_id,
      subject: c.subject,
      level: c.level,
      title: c.course_title
    })));

    if (viewedCourses.length === 0) {
      console.log('WARNING: No viewed courses found in CSV data!');
      console.log('Available course IDs in CSV (first 10):', records.slice(0, 10).map(c => c.course_id));
      console.log('Viewed course IDs:', viewedCourseIds);
    }

    const userSubjects = [...new Set(viewedCourses.map((course: any) => course.subject))];
    const userLevels = [...new Set(viewedCourses.map((course: any) => course.level))];

    console.log('User subjects:', userSubjects);
    console.log('User levels:', userLevels);

    // Try to get recommendations from Python backend first
    /*
    try {
      console.log('Attempting to call Python backend at http://localhost:5000/recommend');
      const pythonResponse = await fetch('http://localhost:5000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: session.user.id, 
          topK,
          recentViews: recentViews.map(view => view.courseId)
        })
      });

      console.log('Python backend response status:', pythonResponse.status);
      console.log('Python backend response ok:', pythonResponse.ok);

      if (pythonResponse.ok) {
        const data = await pythonResponse.json();
        console.log('Python backend returned data:', data);
        return NextResponse.json({ 
          recommendations: data.recommendations,
          message: "Recommendations from Python AI backend"
        });
      } else {
        console.log('Python backend returned error status:', pythonResponse.status);
        const errorText = await pythonResponse.text();
        console.log('Python backend error response:', errorText);
      }
    } catch (error) {
      console.log('Python backend not available, using dynamic algorithm. Error:', error);
    }
    */
    
    console.log('Using dynamic recommendation algorithm');

    // Dynamic recommendation algorithm with same-category guarantee
    let recommendations = [];

    if (recentViews.length === 0) {
      // NEW USER: Return most popular and highly rated courses
      console.log('New user detected - showing most popular courses');
      
      const popularCourses = records
        .sort((a: any, b: any) => {
          const subscribersA = parseInt(a.num_subscribers) || 0;
          const subscribersB = parseInt(b.num_subscribers) || 0;
          const reviewsA = parseInt(a.num_reviews) || 0;
          const reviewsB = parseInt(b.num_reviews) || 0;
          
          // Combine popularity (subscribers) and rating (reviews) for better ranking
          const scoreA = subscribersA + (reviewsA * 10);
          const scoreB = subscribersB + (reviewsB * 10);
          
          return scoreB - scoreA;
        })
        .slice(0, topK);

      return NextResponse.json({
        recommendations: popularCourses.map(course => ({
        course_id: course.course_id,
        course_title: course.course_title,
        subject: course.subject,
        level: course.level,
        price: course.price,
        num_subscribers: course.num_subscribers,
        num_reviews: course.num_reviews,
        num_lectures: course.num_lectures,
        content_duration: course.content_duration
        })),
        message: "Welcome! Here are the most popular and highly rated courses to get you started. View any course to get personalized recommendations!",
        debug: {
          viewedCourses: 0,
          foundInCSV: 0,
          preferredSubjects: [],
          preferredLevels: [],
          algorithm: 'popular-for-new-users',
          recommendationIds: popularCourses.map(c => c.course_id)
        }
      });
    } else if (recentViews.length === 1) {
      // FIRST COURSE VIEWED: Show similar courses to the viewed course
      console.log('First course viewed - showing similar courses');
      
      const viewedCourse = records.find((course: any) => 
        course.course_id === recentViews[0].courseId
      );
      
      if (viewedCourse) {
        // Find courses similar to the viewed course
        const similarCourses = records
          .filter((course: any) => !viewedCourseIds.includes(course.course_id))
          .map((course: any) => {
            let score = 0;
            
            // Same subject (highest priority)
            if (course.subject === viewedCourse.subject) {
              score += 100;
            }
            
            // Same level
            if (course.level === viewedCourse.level) {
              score += 50;
            }
            
            // Popularity bonus
            const subscribers = parseInt(course.num_subscribers) || 0;
            score += Math.min(subscribers / 10000, 20);
            
            // Add some randomness
            score += Math.random() * 10;
            
            return { ...course, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);

        return NextResponse.json({
          recommendations: similarCourses.map(course => ({
            course_id: course.course_id,
            course_title: course.course_title,
            subject: course.subject,
            level: course.level,
            price: course.price,
            num_subscribers: course.num_subscribers,
            num_reviews: course.num_reviews,
            num_lectures: course.num_lectures,
            content_duration: course.content_duration,
            score: Math.round(course.score * 100) / 100
          })),
          message: `Based on your interest in "${viewedCourse.course_title}", here are similar courses you might enjoy!`,
          debug: {
            viewedCourses: 1,
            foundInCSV: 1,
            preferredSubjects: [viewedCourse.subject],
            preferredLevels: [viewedCourse.level],
            algorithm: 'similar-to-first-course',
            recommendationIds: similarCourses.map(c => c.course_id),
            mostRecentSubject: viewedCourse.subject,
            sameSubjectCount: similarCourses.filter(c => c.subject === viewedCourse.subject).length
          }
        });
      }
    }

    // MULTIPLE COURSES VIEWED: Use the existing algorithm with same-category guarantee
    if (recentViews.length > 1) {
      // Calculate scores for all courses
      const scoredCourses = records
        .filter((course: any) => !viewedCourseIds.includes(course.course_id))
        .map((course: any) => {
          let score = 0;
          
          // Subject match (MUCH higher weight - this is the key fix)
          if (userSubjects.includes(course.subject)) {
            score += 200; // Increased from 50 to 200
          }
          
          // Level match (high weight)
          if (userLevels.includes(course.level)) {
            score += 50; // Increased from 25 to 50
          }
          
          // Popularity bonus (reduced weight)
          const subscribers = parseInt(course.num_subscribers) || 0;
          score += Math.min(subscribers / 10000, 5); // Reduced from 10 to 5
          
          // Add very little randomness for variety
          score += Math.random() * 2; // Reduced from 5 to 2
          
          return { ...course, score };
        })
        .sort((a, b) => b.score - a.score);

      // NEW: Ensure at least 2 recommendations from the same subject as the most recent course
      if (mostRecentCourse) {
        // Get at least 2 courses from the same subject as the most recent course
        const sameSubjectCourses = scoredCourses
          .filter((course: any) => course.subject === mostRecentCourse.subject)
          .slice(0, 2);
        
        // Get remaining recommendations from other subjects (but prioritize user's subjects)
        const otherSubjectCourses = scoredCourses
          .filter((course: any) => course.subject !== mostRecentCourse.subject)
          .slice(0, topK - sameSubjectCourses.length);
        
        recommendations = [...sameSubjectCourses, ...otherSubjectCourses];
        
        console.log(`Ensuring ${sameSubjectCourses.length} recommendations from ${mostRecentCourse.subject}`);
        console.log('Same subject courses:', sameSubjectCourses.map(c => c.course_title));
        console.log('Recommendation subjects:', recommendations.map(c => c.subject));
      } else {
        // Fallback to original algorithm if no recent course
        recommendations = scoredCourses.slice(0, topK);
      }

      // Shuffle the final recommendations to mix same-subject and other-subject courses
      recommendations = recommendations.sort(() => Math.random() - 0.3);

      const message = mostRecentCourse 
        ? `Based on your recent interest in ${mostRecentCourse.subject}, here are personalized recommendations with at least 2 courses in the same category.`
        : `Based on your viewing history, here are personalized recommendations.`;

    return NextResponse.json({ 
        recommendations: recommendations.map(course => ({
          course_id: course.course_id,
          course_title: course.course_title,
          subject: course.subject,
          level: course.level,
          price: course.price,
          num_subscribers: course.num_subscribers,
          num_reviews: course.num_reviews,
          num_lectures: course.num_lectures,
          content_duration: course.content_duration,
          score: Math.round(course.score * 100) / 100
        })),
        message,
        debug: {
          viewedCourses: viewedCourses.length,
          foundInCSV: viewedCourses.length,
          preferredSubjects: userSubjects,
          preferredLevels: userLevels,
          algorithm: mostRecentCourse ? 'same-category-guarantee' : 'standard-scoring',
          recommendationIds: recommendations.map(c => c.course_id),
          mostRecentSubject: mostRecentCourse?.subject,
          sameSubjectCount: mostRecentCourse ? recommendations.filter(c => c.subject === mostRecentCourse.subject).length : 0,
          recommendationSubjects: [...new Set(recommendations.map(c => c.subject))]
        }
      });
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
} 