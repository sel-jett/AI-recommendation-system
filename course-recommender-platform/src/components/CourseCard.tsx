'use client';

import { useState } from 'react';
import { Star, Users, Clock, DollarSign, BookOpen } from 'lucide-react';
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

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const [isHovered, setIsHovered] = useState(false);

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

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 ${
        isHovered ? 'shadow-md transform -translate-y-1' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >

      <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <BookOpen className="h-16 w-16 text-white opacity-80" />
      </div>


      <div className="p-4">

        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {course.subject}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getLevelColor(course.level)}`}>
            {course.level}
          </span>
        </div>


        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {course.course_title}
        </h3>

        <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{formatSubscribers(course.num_subscribers)}</span>
          </div>
          <div className="flex items-center">
            <Star className="h-4 w-4 mr-1 text-yellow-500" />
            <span>{course.num_reviews}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            <span>{course.content_duration}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-green-600 mr-1" />
            <span className="font-semibold text-green-600">
              {formatPrice(course.price)}
            </span>
          </div>
          <Link
            href={`/course/${course.course_id}`}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            View Course
          </Link>
        </div>
      </div>
    </div>
  );
} 