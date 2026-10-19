import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#fbfbfa] dark:bg-[#0f1715] flex flex-col items-center justify-center p-6 text-center text-stone-900 dark:text-stone-100">
      <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 mb-4">
        <Leaf className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-bold font-serif mb-2">Page Not Found</h1>
      <p className="text-xs text-stone-500 max-w-sm mb-6">
        The page you are looking for does not exist or may have been relocated.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to ShareBite Home</span>
      </Link>
    </div>
  );
};
