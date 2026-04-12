import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, AlertTriangle } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <AlertTriangle size={48} className="mx-auto text-amber-400" />
        <h1 className="text-2xl font-bold text-white">404</h1>
        <p className="text-sm text-slate-400">This page doesn't exist.</p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Home size={14} />
          Back to Home
        </button>
      </motion.div>
    </div>
  );
}
