/**
 * Floating admin-portal trigger that appears when the secret keyword is typed.
 *
 * Usage: Mount once at the root of the app.  It is invisible by default.
 * When the keyword "natpac" is typed anywhere (outside input fields), a small
 * floating badge slides up from the bottom-right corner of the screen.
 * Clicking it navigates to /admin/login.
 */

import { useNavigate } from 'react-router-dom';
import { useAdminKeyword } from '@/hooks/useAdminKeyword';
import { ShieldCheck, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function AdminSecretTrigger() {
  const navigate = useNavigate();
  const triggered = useAdminKeyword();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (triggered) {
      setVisible(true);
    }
  }, [triggered]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-2 bg-slate-900 text-white pl-3 pr-2 py-2 rounded-full shadow-2xl shadow-black/40 border border-yellow-500/40">
        <ShieldCheck className="h-4 w-4 text-yellow-400 shrink-0" />
        <button
          className="text-sm font-medium hover:text-yellow-300 transition-colors"
          onClick={() => { setVisible(false); navigate('/admin/login'); }}
        >
          Admin Portal
        </button>
        <button
          className="ml-1 h-5 w-5 rounded-full flex items-center justify-center hover:bg-slate-700 transition-colors"
          onClick={() => setVisible(false)}
          aria-label="Dismiss"
        >
          <X className="h-3 w-3 text-slate-400" />
        </button>
      </div>
    </div>
  );
}
