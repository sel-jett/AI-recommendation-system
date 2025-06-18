'use client';

import { useState } from 'react';
import { BookOpen, User, ChevronDown, Star } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  currentUser: string;
  onUserChange: (userId: string) => void;
}

export default function Header({ currentUser, onUserChange }: HeaderProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const userOptions = Array.from({ length: 10 }, (_, i) => `user_${i}`);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="ml-3 text-xl font-bold text-gray-900">
                Course Recommender
              </h1>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                Browse Courses
              </Link>
              <Link
                href="/recommendations"
                className="flex items-center text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
              >
                <Star className="h-4 w-4 mr-1" />
                Recommendations
              </Link>
            </nav>

            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <User className="h-4 w-4" />
                <span>{currentUser}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  {userOptions.map((userId) => (
                    <button
                      key={userId}
                      onClick={() => {
                        onUserChange(userId);
                        setIsUserMenuOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        userId === currentUser
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {userId}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 