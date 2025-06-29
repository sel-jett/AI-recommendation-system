import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's course views
    const courseViews = await prisma.userCourseView.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });

    // Get total users and course views
    const totalUsers = await prisma.user.count();
    const totalCourseViews = await prisma.userCourseView.count();

    return NextResponse.json({
      success: true,
      userId: session.user.id,
      userEmail: session.user.email,
      courseViews: courseViews.map(view => ({
        courseId: view.courseId,
        viewedAt: view.viewedAt
      })),
      totalUsers,
      totalCourseViews,
      userCourseViewCount: courseViews.length
    });
  } catch (error) {
    console.error('Error testing database:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
} 