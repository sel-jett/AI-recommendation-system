'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { BookOpen, User, Mail, Calendar, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function ProfilePage() {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(session?.user?.name || '');
  const [email, setEmail] = useState(session?.user?.email || '');

  const handleSave = () => {
    // In a real app, you would update the user profile here
    setIsEditing(false);
  };

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
                  <Settings className="h-8 w-8 text-blue-600" />
                  <h1 className="ml-3 text-xl font-bold text-gray-900">
                    Profile Settings
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Account Information</h2>
              <p className="text-sm text-gray-600">Manage your account settings and preferences.</p>
            </div>

            <div className="px-6 py-6 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      className="h-16 w-16 rounded-full"
                    />
                  ) : (
                    <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-8 w-8 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {session?.user?.name || 'User'}
                  </h3>
                  <p className="text-sm text-gray-500">{session?.user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!isEditing}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <Calendar className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Member since {new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Learning Preferences</h2>
              <p className="text-sm text-gray-600">Customize your learning experience.</p>
            </div>

            <div className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <BookOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-gray-900">Courses Viewed</h3>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-gray-900">Courses Completed</h3>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <BookOpen className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-gray-900">Wishlist</h3>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
} 