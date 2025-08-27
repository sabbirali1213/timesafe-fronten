// Firebase Authentication Component for TimeSafe Delivery
import React, { useState } from 'react';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import app from '../lib/firebase';
import axios from 'axios';

const FirebaseAuth = ({ onAuthSuccess, API }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔐 Starting Google Sign-In...');

      // Step 1: Sign in with Google
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('✅ Google Sign-In successful:', user.email);

      // Step 2: Get Firebase ID token
      const idToken = await user.getIdToken();
      console.log('🎫 Firebase ID Token obtained');

      // Step 3: Send token to backend for verification (your Python code)
      const response = await axios.post(`${API}/auth/firebase-verify-token`, {
        id_token: idToken
      });

      if (response.data.success) {
        console.log('✅ Backend verification successful');
        
        // Step 4: Handle authentication success
        const userData = {
          uid: response.data.uid,
          name: response.data.name || user.displayName,
          email: response.data.email || user.email,
          picture: user.photoURL,
          firebase_auth: true
        };

        onAuthSuccess(userData, idToken);
      }

    } catch (error) {
      console.error('❌ Firebase Auth Error:', error);
      setError(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const signOutFirebase = async () => {
    try {
      await signOut(auth);
      console.log('👋 Firebase Sign-Out successful');
    } catch (error) {
      console.error('❌ Sign-out error:', error);
    }
  };

  return (
    <div className="firebase-auth">
      <button
        onClick={signInWithGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        {loading ? (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            Signing in...
          </div>
        ) : (
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </div>
        )}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          ❌ {error}
        </div>
      )}
    </div>
  );
};

export default FirebaseAuth;