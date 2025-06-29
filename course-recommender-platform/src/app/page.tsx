'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, Star, Users, DollarSign, Filter, Eye } from 'lucide-react';
import CourseCard from '@/components/CourseCard';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useSession } from 'next-auth/react';

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

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const { data: session } = useSession();

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [courses, searchTerm, selectedSubject, selectedLevel]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourses(data.courses);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setLoading(false);
    }
  };

  const filterCourses = () => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter(course => course.subject === selectedSubject);
    }

    if (selectedLevel) {
      filtered = filtered.filter(course => course.level === selectedLevel);
    }

    setFilteredCourses(filtered);
  };

  const subjects = [...new Set(courses.map(course => course.subject))].sort();
  const levels = [...new Set(courses.map(course => course.level))].sort();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex">
        <Sidebar
          subjects={subjects}
          levels={levels}
          selectedSubject={selectedSubject}
          selectedLevel={selectedLevel}
          onSubjectChange={setSelectedSubject}
          onLevelChange={setSelectedLevel}
        />
        
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">

            <div className="mb-8">
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Courses</p>
                      <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Subjects</p>
                      <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Star className="h-8 w-8 text-yellow-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                      <p className="text-2xl font-bold text-gray-900">4.2</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Avg Price</p>
                      <p className="text-2xl font-bold text-gray-900">$45</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {searchTerm || selectedSubject || selectedLevel ? 'Filtered Courses' : 'All Courses'}
                <span className="text-gray-500 text-lg font-normal ml-2">
                  ({filteredCourses.length} courses)
                </span>
              </h2>
              {session && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <Eye className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-900 mb-1">
                        Dynamic Recommendations Active
                      </h3>
                      <p className="text-sm text-blue-700 mb-2">
                        Welcome back, {session.user?.name || session.user?.email}! 
                        Your recommendations update every time you view a course.
                      </p>
                      <div className="flex items-center space-x-4">
                        <a 
                          href="/recommendations" 
                          className="text-blue-800 font-medium hover:underline text-sm"
                        >
                          View your personalized recommendations →
                        </a>
                        <span className="text-xs text-blue-600">
                          💡 Click on any course to improve your recommendations
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCourses.map((course) => (
                <CourseCard key={course.course_id} course={course} />
              ))}
            </div>

            {filteredCourses.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
                <p className="text-gray-500">Try adjusting your search criteria or filters.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
