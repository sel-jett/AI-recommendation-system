'use client';

import { useSearchParams } from 'next/navigation';
import { BookOpen, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid email or password. Please check your credentials and try again.';
      case 'OAuthSignin':
        return 'There was an error signing in with OAuth. Please try again.';
      case 'OAuthCallback':
        return 'There was an error completing the OAuth sign in. Please try again.';
      case 'OAuthCreateAccount':
        return 'There was an error creating your account. Please try again.';
      case 'EmailCreateAccount':
        return 'There was an error creating your account. Please try again.';
      case 'Callback':
        return 'There was an error during the sign in process. Please try again.';
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with a different account. Please use the same sign-in method you used originally.';
      case 'EmailSignin':
        return 'There was an error sending the sign in email. Please try again.';
      case 'CredentialsSignup':
        return 'There was an error creating your account. Please try again.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="relative">
              <BookOpen className="h-12 w-12 text-blue-600" />
              <AlertTriangle className="h-6 w-6 text-red-500 absolute -top-2 -right-2" />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {getErrorMessage(error)}
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Signing In Again
          </Link>
          
          <Link
            href="/auth/signup"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create New Account
          </Link>
          
          <Link
            href="/"
            className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
} 