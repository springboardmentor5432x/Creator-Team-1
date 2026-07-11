import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuto } from '../contexts/AutoContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuto();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A] py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 animate-fade-in-up">
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center mb-4">
            <span className="font-heading text-black text-lg font-bold">IQ</span>
          </div>
          <h2 className="font-heading text-3xl font-bold tracking-tight text-white">
            Creator<span className="text-neutral-400 font-normal">IQ</span>
          </h2>
          <p className="mt-2 text-sm text-neutral-400">
            Luxury Creator Agency Dashboard
          </p>
        </div>

        <div className="bg-[#121212] border border-[#27272A] rounded-xl p-8 shadow-2xl">
          <h3 className="font-heading text-lg font-medium text-white mb-6">Sign In</h3>

          {error && (
            <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-[#EF4444]">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                data-testid="email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@agency.ch"
                className="block w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-[#52525B] focus:outline-none transition-colors duration-200"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                data-testid="password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-[#27272A] bg-[#0A0A0A] px-4 py-3 text-sm text-white placeholder-neutral-600 focus:border-[#52525B] focus:outline-none transition-colors duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              data-testid="login-submit-btn"
              className="mt-6 flex w-full justify-center items-center rounded-lg bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-200 transition-colors duration-200 disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : 'Enter Workspace'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-neutral-500">
          Don't have access?{' '}
          <Link to="/register" data-testid="goto-register-link" className="font-semibold text-white hover:underline">
            Register Agency
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
