'use client';

import { useState } from 'react';
import { BookOpen, User, ChevronDown, Star, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export default function Header() {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { data: session, status } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

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

            {status === 'loading' ? (
              <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
            ) : session ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-6 w-6 rounded-full"
                    />
                  ) : (
                <User className="h-4 w-4" />
                  )}
                  <span>{session.user?.name || session.user?.email || 'User'}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                      <p className="font-medium">{session.user?.name}</p>
                      <p className="text-gray-500">{session.user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                </div>
              )}
            </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/auth/signin"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="bg-blue-600 text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 