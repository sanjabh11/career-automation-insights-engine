import React from 'react';

export default function ApiHealth() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <h1 className="text-2xl md:text-3xl font-bold mb-4 text-blue-700">Health Check</h1>
      <p className="text-gray-700 mb-6">This is a basic health-check endpoint for deployment monitoring.</p>
      <div className="p-6 bg-white rounded-xl shadow-lg border border-blue-100">
        <span className="text-green-600 font-semibold">Status: OK</span>
      </div>
    </div>
  );
}
