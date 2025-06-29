'use client';

import { useState, useEffect } from 'react';
import { Star, ArrowLeft, RefreshCw, Eye, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import CourseCard from '@/components/CourseCard';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ProtectedRoute from '@/components/ProtectedRoute';

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

interface RecommendationResponse {
  recommendations: Course[];
  message: string;
  debug?: {
    viewedCourses: number;
    foundInCSV: number;
    preferredSubjects: string[];
    preferredLevels: string[];
    algorithm: string;
    recommendationIds: string[];
    mostRecentSubject?: string;
    sameSubjectCount?: number;
  };
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [previousRecommendationIds, setPreviousRecommendationIds] = useState<string[]>([]);
  const [hasChanged, setHasChanged] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user?.id) {
      fetchRecommendations();
    }
  }, [session]);

  // Auto-refresh recommendations when user returns to the page
  useEffect(() => {
    const handleFocus = () => {
      if (session?.user?.id) {
    fetchRecommendations();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [session]);

  const fetchRecommendations = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      // Add timestamp to prevent caching
      const timestamp = Date.now();
      const response = await fetch(`/api/recommendations?topK=12&t=${timestamp}`);
      const data: RecommendationResponse = await response.json();
      
      // Debug logging to see what we're actually receiving
      console.log('=== RECOMMENDATIONS PAGE DEBUG ===');
      console.log('API Response:', data);
      console.log('Recommendations received:', data.recommendations?.length || 0);
      console.log('First 3 recommendations:', data.recommendations?.slice(0, 3).map(r => ({
        title: r.course_title,
        subject: r.subject,
        level: r.level
      })));
      console.log('Debug info:', data.debug);
      console.log('Message:', data.message);
      
      // Check if recommendations have changed
      const currentIds = data.debug?.recommendationIds || [];
      const hasRecommendationsChanged = JSON.stringify(currentIds) !== JSON.stringify(previousRecommendationIds);
      
      setRecommendations(data.recommendations);
      setMessage(data.message);
      setDebugInfo(data.debug || {
        viewedCourses: 0,
        foundInCSV: 0,
        preferredSubjects: [],
        preferredLevels: [],
        algorithm: 'unknown',
        recommendationIds: []
      });
      setLastUpdated(new Date());
      setPreviousRecommendationIds(currentIds);
      setHasChanged(hasRecommendationsChanged);
      
      // Reset the change indicator after 5 seconds
      if (hasRecommendationsChanged) {
        setTimeout(() => setHasChanged(false), 5000);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Set default debug info on error
      setDebugInfo({
        viewedCourses: 0,
        foundInCSV: 0,
        preferredSubjects: [],
        preferredLevels: [],
        algorithm: 'error',
        recommendationIds: []
      });
    } finally {
      setLoading(false);
    }
  };

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
    <ProtectedRoute>
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
                  {hasChanged && (
                    <div className="ml-3 flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Updated!
                    </div>
                  )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/debug-recommendations');
                      const data = await response.json();
                      if (data.success) {
                        const debugText = `
🔍 RECOMMENDATION DEBUG

Your Profile:
• Viewed Courses: ${data.userProfile.viewedCourses}
• Subjects: ${data.userProfile.userSubjects.join(', ')}
• Levels: ${data.userProfile.userLevels.join(', ')}
• Most Recent: ${data.userProfile.mostRecentCourse?.course_title} (${data.userProfile.mostRecentCourse?.subject})

Scoring Weights:
• Subject Match: ${data.scoringAnalysis.subjectWeight} points
• Level Match: ${data.scoringAnalysis.levelWeight} points
• Popularity: ${data.scoringAnalysis.popularityWeight} points
• Randomness: ${data.scoringAnalysis.randomnessWeight} points

Top 5 Scored Courses:
${data.topScoredCourses.slice(0, 5).map((c: any) => 
  `• ${c.course_title} (${c.subject}) - Score: ${c.score}`
).join('\n')}

Same Subject Recommendations (${data.subjectDistribution.sameSubjectCount}):
${data.sameSubjectRecommendations.slice(0, 3).map((c: any) => 
  `• ${c.course_title} (${c.subject}) - Score: ${c.score}`
).join('\n')}

Other Subject Recommendations (${data.subjectDistribution.otherSubjectCount}):
${data.otherSubjectRecommendations.slice(0, 3).map((c: any) => 
  `• ${c.course_title} (${c.subject}) - Score: ${c.score}`
).join('\n')}

Recommendation Subjects: ${data.subjectDistribution.topRecommendationSubjects.join(', ')}
                        `;
                        alert(debugText);
                      }
                    } catch (error) {
                      console.error('Error debugging:', error);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
              >
                  Debug
                </button>
                <button
                  onClick={() => {
                    const currentDisplay = recommendations.slice(0, 5).map(r => ({
                      title: r.course_title,
                      subject: r.subject,
                      level: r.level
                    }));
                    
                    const comparisonText = `
📊 DISPLAY vs API COMPARISON

Currently Displayed (${recommendations.length} courses):
${currentDisplay.map((c: any) => 
  `• ${c.title} (${c.subject})`
).join('\n')}

Debug Info:
• Algorithm: ${debugInfo?.algorithm || 'unknown'}
• Viewed Courses: ${debugInfo?.viewedCourses || 0}
• Preferred Subjects: ${debugInfo?.preferredSubjects?.join(', ') || 'none'}
• Most Recent Subject: ${debugInfo?.mostRecentSubject || 'none'}
• Same Subject Count: ${debugInfo?.sameSubjectCount || 0}

Check browser console for detailed API response!
                        `;
                    alert(comparisonText);
                  }}
                  className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Compare
                </button>
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
              Recommended for {session?.user?.name || session?.user?.email}
          </h2>
            <p className="text-gray-600 mb-4">
            Based on your learning preferences and interests, here are courses we think you'll love.
          </p>
            
            {lastUpdated && (
              <div className="text-sm text-gray-500 mb-4">
                Last updated: {lastUpdated.toLocaleTimeString()}
                {hasChanged && (
                  <span className="ml-2 text-green-600 font-medium">✓ Recommendations have changed!</span>
                )}
                {loading && (
                  <span className="ml-2 text-blue-600 font-medium">🔄 Updating recommendations...</span>
                )}
              </div>
            )}
            
            {message && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <Eye className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">
                      Dynamic Recommendations
                    </h3>
                    <p className="text-sm text-blue-700">
                      {message}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      💡 <strong>Tip:</strong> View more courses to get even better recommendations!
                    </p>
                    {debugInfo?.mostRecentSubject && (
                      <p className="text-xs text-blue-600 mt-1">
                        🎯 <strong>Same Category:</strong> At least 2 recommendations from {debugInfo.mostRecentSubject}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {debugInfo && debugInfo.preferredSubjects && debugInfo.preferredSubjects.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-green-900 mb-1">
                      Your Learning Profile
                    </h3>
                    <div className="text-sm text-green-700 space-y-1">
                      <p><strong>Favorite Subjects:</strong> {debugInfo.preferredSubjects.join(', ')}</p>
                      <p><strong>Preferred Levels:</strong> {debugInfo.preferredLevels.join(', ')}</p>
                      <p><strong>Courses Viewed:</strong> {debugInfo.viewedCourses}</p>
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      🎯 <strong>Recommendations are personalized</strong> based on your viewing history!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {debugInfo && debugInfo.preferredSubjects && debugInfo.preferredSubjects.length === 1 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <TrendingUp className="h-5 w-5 text-orange-600 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-900 mb-1">
                      Limited Subject Variety
                    </h3>
                    <p className="text-sm text-orange-700">
                      You've only viewed courses in <strong>{debugInfo.preferredSubjects.join(', ')}</strong>. 
                      To see more dramatic changes in recommendations, try viewing courses in different subjects!
                    </p>
                    <div className="mt-2">
                      <Link 
                        href="/" 
                        className="text-orange-800 font-medium hover:underline text-sm"
                      >
                        Browse courses in different subjects →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                Browse courses to help us understand your preferences and get personalized recommendations.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Browse All Courses
            </Link>
          </div>
        )}

          {recommendations.length > 0 && (
            <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">How Recommendations Work</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Eye className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Course Views</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      We track which courses you view to understand your interests.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Smart Matching</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      We find courses similar to what you've been viewing recently.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-gray-900">Real-time Updates</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Your recommendations update every time you view a new course.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">🎯 Personalized Experience</h4>
                <p className="text-sm text-blue-700">
                  New users see the most popular courses. After viewing your first course, 
                  you'll get similar recommendations. View more courses to see even better personalized suggestions!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
} 