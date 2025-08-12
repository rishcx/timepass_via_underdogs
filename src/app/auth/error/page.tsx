'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const errorMessages = {
  spotify_denied: 'Spotify authorization was denied. Please try again.',
  invalid_state: 'Invalid authentication state. Please try logging in again.',
  no_code: 'No authorization code received. Please try again.',
  token_exchange_failed: 'Failed to authenticate with Spotify. Please try again.',
  profile_fetch_failed: 'Failed to fetch your profile from Spotify. Please try again.',
  supabase_auth_failed: 'Failed to create your account. Please try again.',
  callback_failed: 'Authentication failed. Please try again.',
  default: 'An unexpected error occurred. Please try again.',
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const error = searchParams.get('error');
    setErrorMessage(errorMessages[error as keyof typeof errorMessages] || errorMessages.default);
  }, [searchParams]);

  const handleRetry = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-400 to-pink-500">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Error</h1>
          <p className="text-gray-600">{errorMessage}</p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Try Again
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}
