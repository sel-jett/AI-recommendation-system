'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function DebugPage() {
  const [dbData, setDbData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [differentSubjects, setDifferentSubjects] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();

  const testDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-db');
      const data = await response.json();
      setDbData(data);
    } catch (error) {
      console.error('Error testing database:', error);
    } finally {
      setLoading(false);
    }
  };

  const testRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recommendations?topK=5');
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error testing recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const testDifferentSubjects = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-different-subjects');
      const data = await response.json();
      setDifferentSubjects(data);
    } catch (error) {
      console.error('Error testing different subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const manuallyViewCourse = async (courseId: string) => {
    try {
      const response = await fetch('/api/debug/view-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });
      const data = await response.json();
      console.log('Manual course view result:', data);
      alert(`Course view recorded: ${data.success ? 'Success' : 'Failed'}`);
    } catch (error) {
      console.error('Error manually viewing course:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Info</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Database Test</h2>
            <button
              onClick={testDatabase}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Database'}
            </button>
            {dbData && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Results:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(dbData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Recommendations Test</h2>
            <button
              onClick={testRecommendations}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Recommendations'}
            </button>
            {recommendations && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Results:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(recommendations, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Different Subjects Test</h2>
            <button
              onClick={testDifferentSubjects}
              disabled={loading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Different Subjects'}
            </button>
            {differentSubjects && (
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Results:</h3>
                <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(differentSubjects, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Manual Course View Test</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {['768028', '145220', '738910', '591880'].map((courseId) => (
              <button
                key={courseId}
                onClick={() => manuallyViewCourse(courseId)}
                className="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700"
              >
                View Course {courseId}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Click these buttons to manually record course views, then test recommendations again.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Why Recommendations Might Not Seem to Change</h3>
            <div className="text-sm text-yellow-800 space-y-1">
              <p>• <strong>Same Subject Area:</strong> If you view courses in the same subject (like "Business Finance"), recommendations will be similar</p>
              <p>• <strong>Popular Courses:</strong> Popular courses appear in many recommendation sets</p>
              <p>• <strong>Limited Variety:</strong> Try viewing courses in different subjects to see more dramatic changes</p>
              <p>• <strong>Algorithm Working:</strong> The system IS working - check the debug info to see your learning profile</p>
            </div>
          </div>
        </div>

        {differentSubjects && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Subject Analysis</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Your Current Subjects:</h3>
                <div className="flex flex-wrap gap-2">
                  {differentSubjects.userSubjects?.map((subject: string) => (
                    <span key={subject} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Available Subjects:</h3>
                <div className="flex flex-wrap gap-2">
                  {differentSubjects.allAvailableSubjects?.map((subject: string) => (
                    <span key={subject} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-green-900 mb-2">💡 Try This:</h3>
                <p className="text-sm text-green-800">
                  View courses in different subjects (like "Musical Instruments", "Web Development", etc.) 
                  to see how your recommendations change dramatically!
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 