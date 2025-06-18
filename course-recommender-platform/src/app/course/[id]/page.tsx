'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Users, Clock, DollarSign, BookOpen, Play } from 'lucide-react';
import Link from 'next/link';

interface Course {
  course_id: string;
  course_title: string;
  subject: string;
  level: string;
  price: string;
  num_subscribers: string;
  num_reviews: string;
  num_lectures: string;
  content_duration: string;
  published_timestamp: string;
  is_paid: string;
}

export default function CourseDetailPage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarCourses, setSimilarCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetchCourse();
  }, [params.id]);

  const fetchCourse = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses/${params.id}`);
      const data = await response.json();
      setCourse(data.course);
      

      const allCoursesResponse = await fetch('/api/courses');
      const allCoursesData = await allCoursesResponse.json();
      const similar = allCoursesData.courses
        .filter((c: Course) => c.subject === data.course.subject && c.course_id !== data.course.course_id)
        .slice(0, 4);
      setSimilarCourses(similar);
    } catch (error) {
      console.error('Error fetching course:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: string) => {
    if (price.toLowerCase() === 'free') return 'Free';
    return `$${price}`;
  };

  const formatSubscribers = (subscribers: string) => {
    const num = parseInt(subscribers);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner level':
        return 'bg-green-100 text-green-800';
      case 'intermediate level':
        return 'bg-yellow-100 text-yellow-800';
      case 'expert level':
        return 'bg-red-100 text-red-800';
      case 'all levels':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Course not found</h3>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link
              href="/"
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Course Details</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2">

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      {course.subject}
                    </span>
                    <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${getLevelColor(course.level)}`}>
                      {course.level}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    {course.course_title}
                  </h1>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    {formatPrice(course.price)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {course.is_paid === 'TRUE' ? 'Paid Course' : 'Free Course'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatSubscribers(course.num_subscribers)}
                  </div>
                  <div className="text-sm text-gray-500">Students</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Star className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {course.num_reviews}
                  </div>
                  <div className="text-sm text-gray-500">Reviews</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <BookOpen className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {course.num_lectures}
                  </div>
                  <div className="text-sm text-gray-500">Lectures</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {course.content_duration}
                  </div>
                  <div className="text-sm text-gray-500">Duration</div>
                </div>
              </div>


              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                  <Play className="h-5 w-5 mr-2" />
                  Enroll Now
                </button>
                <button className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Add to Wishlist
                </button>
              </div>
            </div>


            {similarCourses.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Similar Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {similarCourses.map((similarCourse) => (
                    <Link
                      key={similarCourse.course_id}
                      href={`/course/${similarCourse.course_id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {similarCourse.course_title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>{formatPrice(similarCourse.price)}</span>
                        <span>{formatSubscribers(similarCourse.num_subscribers)} students</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>


          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Information</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Subject</label>
                  <p className="text-gray-900">{course.subject}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Level</label>
                  <p className="text-gray-900">{course.level}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Published</label>
                  <p className="text-gray-900">
                    {new Date(course.published_timestamp).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Content Duration</label>
                  <p className="text-gray-900">{course.content_duration}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Number of Lectures</label>
                  <p className="text-gray-900">{course.num_lectures}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 