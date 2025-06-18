'use client';

import { useState } from 'react';
import { Filter, X, Star, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface SidebarProps {
  subjects: string[];
  levels: string[];
  selectedSubject: string;
  selectedLevel: string;
  onSubjectChange: (subject: string) => void;
  onLevelChange: (level: string) => void;
}

export default function Sidebar({
  subjects,
  levels,
  selectedSubject,
  selectedLevel,
  onSubjectChange,
  onLevelChange,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const clearFilters = () => {
    onSubjectChange('');
    onLevelChange('');
  };

  return (
    <>
      {/* Mobile filter button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg"
      >
        <Filter className="h-6 w-6" />
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white shadow-lg lg:shadow-none border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Quick Actions */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/recommendations"
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Get Recommendations
                </Link>
                <button
                  onClick={() => {
                    // TODO: Implement trending courses
                    console.log('Trending courses');
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Trending Courses
                </button>
              </div>
            </div>

            {/* Subject Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Subject</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <button
                  onClick={() => onSubjectChange('')}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                    selectedSubject === ''
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Subjects
                </button>
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => onSubjectChange(subject)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                      selectedSubject === subject
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Level</h3>
              <div className="space-y-2">
                <button
                  onClick={() => onLevelChange('')}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                    selectedLevel === ''
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Levels
                </button>
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => onLevelChange(level)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                      selectedLevel === level
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 