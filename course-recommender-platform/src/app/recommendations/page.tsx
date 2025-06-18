'use client';

import { useState, useEffect } from 'react';
import { Star, ArrowLeft, RefreshCw } from 'lucide-react';
import CourseCard from '@/components/CourseCard';
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
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState('user_0');

  useEffect(() => {
    fetchRecommendations();
  }, [currentUser]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/recommendations?userId=${currentUser}&topK=12`);
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const userOptions = Array.from({ length: 10 }, (_, i) => `user_${i}`);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your personalized recommendations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                href="/"
                className="mr-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="flex items-center">
                <Star className="h-8 w-8 text-blue-600" />
                <h1 className="ml-3 text-xl font-bold text-gray-900">
                  Your Recommendations
                </h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={currentUser}
                onChange={(e) => setCurrentUser(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {userOptions.map((userId) => (
                  <option key={userId} value={userId}>
                    {userId}
                  </option>
                ))}
              </select>
              <button
                onClick={fetchRecommendations}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Recommended for {currentUser}
          </h2>
          <p className="text-gray-600">
            Based on your learning preferences and interests, here are courses we think you'll love.
          </p>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recommendations.map((course) => (
              <CourseCard key={course.course_id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations yet</h3>
            <p className="text-gray-500 mb-4">
              Try switching to a different user or browse all courses to get started.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse All Courses
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 