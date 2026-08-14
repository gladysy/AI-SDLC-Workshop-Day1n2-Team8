'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    async function checkAuth() {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        router.push('/');
      }
    }
    checkAuth();
  }, [router]);

  async function handleRegister() {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Step 1: Get registration options
      const optionsRes = await fetch('/api/auth/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        setError(data.error || 'Failed to start registration');
        setLoading(false);
        return;
      }

      const options = await optionsRes.json();

      // Step 2: Start WebAuthn registration
      let attestation;
      try {
        attestation = await startRegistration({ optionsJSON: options });
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setError('Registration cancelled');
        } else {
          setError('WebAuthn registration failed: ' + err.message);
        }
        setLoading(false);
        return;
      }

      // Step 3: Verify registration
      const verifyRes = await fetch('/api/auth/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, response: attestation }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setError(data.error || 'Registration verification failed');
        setLoading(false);
        return;
      }

      // Success - redirect to home
      router.push('/');
    } catch (err: any) {
      setError('Unexpected error: ' + err.message);
      setLoading(false);
    }
  }

  async function handleLogin() {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Step 1: Get login options
      const optionsRes = await fetch('/api/auth/login-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!optionsRes.ok) {
        const data = await optionsRes.json();
        setError(data.error || 'Failed to start login');
        setLoading(false);
        return;
      }

      const options = await optionsRes.json();

      // Step 2: Start WebAuthn authentication
      let assertion;
      try {
        assertion = await startAuthentication({ optionsJSON: options });
      } catch (err: any) {
        if (err.name === 'NotAllowedError') {
          setError('Login cancelled');
        } else {
          setError('WebAuthn authentication failed: ' + err.message);
        }
        setLoading(false);
        return;
      }

      // Step 3: Verify login
      const verifyRes = await fetch('/api/auth/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, response: assertion }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setError(data.error || 'Login verification failed');
        setLoading(false);
        return;
      }

      // Success - redirect to home
      router.push('/');
    } catch (err: any) {
      setError('Unexpected error: ' + err.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Todo App
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in or create an account with your passkey
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg space-y-6">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLogin();
              }
            }}
          />

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleLogin}
              disabled={loading || !username.trim()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Login'}
            </button>

            <button
              onClick={handleRegister}
              disabled={loading || !username.trim()}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Register'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Your biometric or security key is required for both registration and login.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
