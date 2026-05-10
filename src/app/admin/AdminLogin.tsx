import { useState, FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { authStore } from '../store';
import { setOperatorRole } from '../utils/adminGate';
import { persistMockSession } from '../services/sessionTokens';

/** 데모용 운영팀 PIN — Phase 2에서 서버 인증으로 대체 */
const DEMO_ADMIN_PIN = 'admin1234';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/admin';

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (pin !== DEMO_ADMIN_PIN) {
        setError('PIN이 올바르지 않습니다.');
        setLoading(false);
        return;
      }
      if (!authStore.isLoggedIn()) {
        authStore.login();
        persistMockSession('qa-admin-auto');
      }
      setOperatorRole(true);
      navigate(redirectTo, { replace: true });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-white/10">
            <ShieldCheck className="h-7 w-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Proud Gallery 어드민</h1>
            <p className="text-sm text-slate-400 mt-1">운영팀 전용 관리 콘솔</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              관리자 PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN 입력"
              className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
              autoFocus
              autoComplete="current-password"
            />
            {error && (
              <p className="mt-2 text-sm text-red-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !pin}
            className="w-full rounded-lg bg-white text-slate-900 font-semibold py-3 text-sm hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '확인 중…' : '로그인'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          데모 PIN: admin1234
        </p>
      </div>
    </div>
  );
}
