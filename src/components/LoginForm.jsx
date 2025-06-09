import React, { useState } from 'react';

export default function LoginForm({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState(null);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-sm mx-auto p-6 bg-gray-800 rounded-lg"
    >
      <h2 className="text-2xl font-bold text-white mb-4">Log In</h2>
      {error && <p className="text-red-400 mb-2">{error}</p>}
      <label className="block mb-2 text-gray-300">
        Email
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full mt-1 p-2 rounded bg-gray-700 text-white"
        />
      </label>
      <label className="block mb-4 text-gray-300">
        Password
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="w-full mt-1 p-2 rounded bg-gray-700 text-white"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-blue-600 rounded hover:bg-blue-700 text-white"
      >
        {loading ? 'Logging in…' : 'Log In'}
      </button>
    </form>
  );
}