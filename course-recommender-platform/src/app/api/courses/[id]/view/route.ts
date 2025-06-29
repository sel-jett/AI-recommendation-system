import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const courseId = url.pathname.split('/')[3]; // Extract course ID from /api/courses/[id]/view

    console.log(`Recording course view: User ${session.user.id} viewed course ${courseId}`);

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      );
    }

    // Record the course view
    const result = await prisma.userCourseView.upsert({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        courseId: courseId,
      },
    });

    console.log(`Course view recorded successfully:`, result);

    return NextResponse.json({ 
      success: true, 
      message: 'Course view recorded' 
    });
  } catch (error) {
    console.error('Error recording course view:', error);
    return NextResponse.json(
      { error: 'Failed to record course view' },
      { status: 500 }
    );
  }
} 