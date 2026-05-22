import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sendCode, login, type User } from '../utils/api';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

export function LoginModal({ open, onClose, onLogin }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setCode('');
      setStep('email');
      setError('');
      setCountdown(0);
      clearInterval(timerRef.current);
    }
  }, [open]);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    const e = email.trim();
    if (!e || !e.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resp = await sendCode(e);
      setStep('code');
      setCountdown(resp.ttl_seconds);
    } catch (err: any) {
      setError(err?.response?.data?.detail || '发送验证码失败');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    const c = code.trim();
    if (!c || c.length !== 6) {
      setError('请输入6位验证码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const resp = await login(email.trim(), c);
      localStorage.setItem('wanasing_token', resp.token);
      onLogin(resp.user);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.detail || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('email');
    setCode('');
    setError('');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-surface border border-primary/20 rounded-3xl p-8 w-full max-w-sm mx-4 shadow-2xl"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎵</div>
              <h2 className="text-xl font-bold text-text-primary">登录 WannaSing</h2>
              <p className="text-sm text-text-secondary mt-1">
                {step === 'email'
                  ? '输入邮箱地址，获取验证码'
                  : '输入邮箱中收到的6位验证码'}
              </p>
            </div>

            {/* Step 1: Email */}
            {step === 'email' && (
              <div className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                  className="w-full bg-background border border-primary/20 rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSendCode}
                  disabled={loading || !email.trim()}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold disabled:opacity-50 glow-primary"
                >
                  {loading ? '发送中...' : '发送验证码'}
                </motion.button>
              </div>
            )}

            {/* Step 2: Code */}
            {step === 'code' && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-text-secondary mb-1">验证码已发送至</p>
                  <p className="text-text-primary font-medium">{email}</p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6位验证码"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-background border border-primary/20 rounded-xl px-4 py-3 text-text-primary placeholder-text-secondary text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  disabled={loading || code.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-primary to-secondary text-white rounded-xl font-semibold disabled:opacity-50 glow-primary"
                >
                  {loading ? '登录中...' : '登录'}
                </motion.button>
                <div className="flex justify-between text-sm">
                  <button
                    onClick={handleBack}
                    className="text-text-secondary hover:text-primary transition-colors"
                  >
                    修改邮箱
                  </button>
                  <button
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                    className={`transition-colors ${
                      countdown > 0
                        ? 'text-text-secondary cursor-not-allowed'
                        : 'text-primary hover:text-primary/80'
                    }`}
                  >
                    {countdown > 0 ? `${countdown}s 后重发` : '重新发送'}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-4 text-center"
              >
                {error}
              </motion.p>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-full hover:bg-surface transition-colors"
            >
              ✕
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
