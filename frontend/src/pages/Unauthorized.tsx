import React from 'react';
import AnimatedPage from '../components/AnimatedPage.js';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

const Unauthorized: React.FC = () => {
  return (
    <AnimatedPage>
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-455 mb-6 shadow-lg shadow-rose-500/5">
        <ShieldAlert size={48} className="text-rose-455" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">403 - Access Denied</h1>
      <p className="text-slate-400 mt-2.5 max-w-md text-sm leading-relaxed">
        You do not have the required permissions or administrative privileges to view this section of the portal.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-650/15 transition-all"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
      </div>
    </div>
    </AnimatedPage>
  );
};

export default Unauthorized;
