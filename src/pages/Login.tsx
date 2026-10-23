import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { forgotPassword, resetPassword } from '../api/auth';
import { Modal } from '../components/ui/Modal';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  Skull,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import OrbitingSubscriptions from '../components/animations/OrbitingSubscriptions';
import './auth.css';

type AuthMode = 'login' | 'signup';

const authSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address')
    .email("That email doesn't look right"),
  password: z.string().min(1, 'Please enter your password'),
});

type AuthValues = z.infer<typeof authSchema>;

function createUser(email: string, name?: string, avatar?: string) {
  const cleanEmail = email.trim().toLowerCase();

  return {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `user_${Date.now()}`,
    email: cleanEmail,
    name: name?.trim() || cleanEmail.split('@')[0] || 'Subscription Manager',
    ...(avatar ? { avatar } : {}),
    currency: 'USD',
    createdAt: new Date().toISOString(),
  };
}

function getPasswordStrength(password: string) {
  if (!password) {
    return { score: 0, label: '', className: '' };
  }

  let score = 0;

  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) {
    return { score: 1, label: 'Weak', className: 'weak' };
  }

  if (score <= 3) {
    return { score: 2, label: 'Okay', className: 'okay' };
  }

  return { score: 3, label: 'Strong', className: 'strong' };
}

export function Login() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  
  // Reset Password States
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  
  // Naye Loading States
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [successUser, setSuccessUser] = useState<
    ReturnType<typeof createUser> | null
  >(null);

  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    clearErrors,
    formState: { errors, touchedFields },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const email = watch('email') || '';
  const password = watch('password') || '';
  const strength = getPasswordStrength(password);

  const finishSignIn = useCallback(
    (user: ReturnType<typeof createUser>) => {
      setSuccessUser(user);
      setIsSuccess(true);
      setSubmitError('');

      if (!reduceMotion) {
        confetti({
          particleCount: 90,
          spread: 75,
          startVelocity: 32,
          origin: { x: 0.72, y: 0.55 },
          colors: ['#8b5cf6', '#2dd4bf', '#f5d0fe', '#fef3c7'],
          disableForReducedMotion: true,
        });
      }

      finishTimerRef.current = setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, reduceMotion ? 300 : 1700);
    },
    [navigate, reduceMotion]
  );

  useEffect(() => {
    return () => {
      if (finishTimerRef.current) {
        clearTimeout(finishTimerRef.current);
      }
    };
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(values.email, values.password);
      } else {
        await signup(values.email, values.password);
      }

      finishSignIn(createUser(values.email));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to authenticate. Please try again.';

      setSubmitError(message);
      setShakeKey((value) => value + 1);
    } finally {
      setIsLoading(false);
    }
  });

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setSubmitError('');
    setShowPassword(false);
    clearErrors();
    reset({ email, password: '' });
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <main
      className={`auth-page ${
        resolvedTheme === 'light' ? 'auth-light' : 'auth-dark'
      }`}
    >
      <section
        className={`auth-scene ${
          submitError ? 'is-error' : ''
        } ${isSuccess ? 'is-success' : ''}`}
        aria-label="Subscription app animation"
      >
        <div className="auth-scene-overlay" />
        <OrbitingSubscriptions />

        <div className="scene-copy">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="scene-eyebrow"
          >
            <span className="scene-eyebrow-dot" />
          </motion.div>

          <motion.h1
            initial={reduceMotion ? false : { opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1 }}
          >
            Your money.
            <br />
            <span>Your rules.</span>
          </motion.h1>

          <p>Track recurring costs and upcoming renewals.</p>

          <div className="scene-bottom-note">
            <span className="scene-note-line" />
            <span>LESS WASTE. MORE CONTROL.</span>
          </div>
        </div>

        <div className="scene-coordinate">SG — SUBSCRIPTION CONTROL</div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-glow" />
        <div className="auth-mobile-fog" />

        <button
          className="auth-theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${
            resolvedTheme === 'dark' ? 'light' : 'dark'
          } mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={17} />
          ) : (
            <Moon size={17} />
          )}
        </button>

        <div className="auth-card-wrap">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                className="auth-success"
                initial={
                  reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.45 }}
              >
                <div className="success-beam" />
                <div className="success-symbol">
                  <Check size={28} strokeWidth={2.2} />
                </div>
                <span className="auth-kicker">YOU'RE ALL SET</span>
                <h2>Welcome back.</h2>
                <p>
                  {successUser?.name
                    ? `Good to have you here, ${successUser.name}.`
                    : 'Your subscriptions are ready to manage.'}
                </p>
                <div className="success-loading">
                  <span />
                  Preparing your dashboard…
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                className="auth-card"
                initial={
                  reduceMotion ? false : { opacity: 0, y: 38, scale: 0.97 }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  x:
                    shakeKey > 0 && !reduceMotion
                      ? [0, -8, 7, -5, 3, 0]
                      : 0,
                }}
                transition={{
                  opacity: { duration: 0.5 },
                  y: {
                    duration: reduceMotion ? 0.15 : 0.75,
                    type: 'spring',
                    bounce: 0.24,
                  },
                  scale: { duration: 0.55 },
                  x: { duration: 0.38 },
                }}
              >
                {/* =========================================
                    CUTE DECORATIONS (STICKERS)
                    ========================================= */}
                <div className="auth-decorations">
                  {/* Top Left Cute Flower */}
                  <svg className="sticker sticker-tl" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C12 2 14 6 17 7C20 8 22 12 22 12C22 12 18 14 17 17C16 20 12 22 12 22C12 22 10 18 7 17C4 16 2 12 2 12C2 12 6 10 7 7C8 4 12 2 12 2Z" fill="#fbcfe8" opacity="0.8"/>
                    <circle cx="12" cy="12" r="3" fill="#fdf2f8"/>
                  </svg>

                  {/* Top Right Sparkle/Star */}
                  <svg className="sticker sticker-tr" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" fill="#c4b5fd" opacity="0.9"/>
                  </svg>

                  {/* Bottom Left Small Leaf */}
                  <svg className="sticker sticker-bl" viewBox="0 0 24 24" fill="none">
                    <path d="M12 22C12 22 16 18 16 12C16 6 12 2 12 2C12 2 8 6 8 12C8 18 12 22 12 22Z" fill="#e9d5ff" opacity="0.6"/>
                  </svg>
                  
                  {/* Bottom Right Cute Ghost */}
                  <svg className="sticker sticker-br" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C7.58 2 4 5.58 4 10V22L7 19L10 22L12 20L14 22L17 19L20 22V10C20 5.58 16.42 2 12 2Z" fill="#f3e8ff" opacity="0.7"/>
                    <circle cx="9" cy="10" r="1.5" fill="#a855f7"/>
                    <circle cx="15" cy="10" r="1.5" fill="#a855f7"/>
                  </svg>
                </div>
                {/* ========================================= */}

                <div className="auth-card-top">
                  {/* =========================================
                      NETFLIX-STYLE BRAND HEADER (YAHAN CHANGE HAI)
                      ========================================= */}
                  <div className="auth-brand-header">
                    <div className="auth-card-emblem" aria-hidden="true">
                      <Skull size={32} strokeWidth={2.5} />
                    </div>
                    <div className="auth-brand-title">
                      <h1>Subscription <span>Graveyard</span></h1>
                    </div>
                  </div>
                  {/* ========================================= */}

                  <span className="auth-kicker">
                    {mode === 'login'
                      ? 'YOUR SUBSCRIPTIONS AWAIT'
                      : 'START FRESH'}
                  </span>
                  <h2>
                    {mode === 'login'
                      ? 'Welcome back'
                      : 'Create your account'}
                  </h2>
                </div>

                <form onSubmit={onSubmit} noValidate className="auth-form">
                  <motion.div
                    className={`auth-field ${
                      errors.email ? 'has-error' : ''
                    } ${
                      touchedFields.email && !errors.email && email
                        ? 'is-valid'
                        : ''
                    }`}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : 0.12 }}
                  >
                    <Mail className="auth-field-icon" size={17} />
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      placeholder=" "
                      aria-invalid={!!errors.email}
                      {...register('email')}
                    />
                    <label htmlFor="auth-email">Email address</label>
                    {touchedFields.email && !errors.email && email && (
                      <Check className="auth-field-check" size={16} />
                    )}
                  </motion.div>

                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        id="email-error"
                        className="auth-field-error"
                        initial={{ opacity: 0, height: 0, y: -4 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.div
                    className={`auth-field ${
                      errors.password ? 'has-error' : ''
                    }`}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : 0.2 }}
                  >
                    <LockKeyhole className="auth-field-icon" size={17} />
                    <input
                      id="auth-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete={
                        mode === 'login'
                          ? 'current-password'
                          : 'new-password'
                      }
                      placeholder=" "
                      aria-invalid={!!errors.password}
                      {...register('password')}
                    />
                    <label htmlFor="auth-password">Password</label>
                    <button
                      className="password-visibility"
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </motion.div>

                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        id="password-error"
                        className="auth-field-error"
                        initial={{ opacity: 0, height: 0, y: -4 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {mode === 'signup' && password.length > 0 && (
                    <motion.div
                      className="password-strength"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="strength-track">
                        {[1, 2, 3].map((segment) => (
                          <span
                            key={segment}
                            className={
                              segment <= strength.score
                                ? `strength-segment active ${strength.className}`
                                : 'strength-segment'
                            }
                          />
                        ))}
                      </div>
                      <span className={`strength-label ${strength.className}`}>
                        {strength.label}
                      </span>
                    </motion.div>
                  )}

                  {mode === 'login' && (
                    <div className="auth-forgot-row">
                      <span>Forgot your password?</span>
                      <button
                        type="button"
                        className="auth-reset-btn"
                        onClick={() => {
                          const currentEmail = watch('email');
                          setResetEmail(currentEmail || '');
                          setShowReset(true);
                          setResetStep(1);
                          setResetError('');
                          setResetSuccess('');
                        }}
                      >
                        Reset it
                      </button>
                    </div>
                  )}

                  <AnimatePresence>
                    {submitError && (
                      <motion.div
                        className="auth-error-banner"
                        role="alert"
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                      >
                        <span className="error-dot" />
                        {submitError}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    className="auth-submit"
                    type="submit"
                    disabled={isLoading}
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.985 }}
                  >
                    <span className="submit-shimmer" />
                    {isLoading ? (
                      <>
                        <span className="auth-spinner" />
                        {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                      </>
                    ) : (
                      <>
                        {mode === 'login' ? 'Log in' : 'Create account'}
                        <ArrowRight size={17} />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="auth-mode-switch">
                  <span>
                    {mode === 'login'
                      ? 'New around here?'
                      : 'Already have an account?'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      changeMode(mode === 'login' ? 'signup' : 'login')
                    }
                  >
                    {mode === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </div>

                <div className="auth-trust-note">
                  <ShieldCheck size={14} />
                  <span>Your money. Your choices. Your peace of mind.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="auth-panel-footer">
          <span>© {new Date().getFullYear()} Subscription Graveyard</span>
          <span className="footer-separator">·</span>
          <span>Your subscriptions, under control.</span>
        </div>
      </section>

      {/* =========================================
          PREMIUM PASSWORD RESET MODAL (With Animations)
          ========================================= */}
      <Modal 
        isOpen={showReset} 
        onClose={() => {
          if(!isSendingCode && !isUpdatingPassword) setShowReset(false);
        }} 
        title="Reset Password"
      >
        <form onSubmit={(e) => e.preventDefault()} autoComplete="off">
          <AnimatePresence mode="wait">
            {resetStep === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-5 pt-2"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-accent-blue/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Mail className="text-accent-blue w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">Forgot Password?</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Enter your registered email. We'll send you a secure code.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-primary ml-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="example@email.com"
                    autoComplete="off"
                    disabled={isSendingCode}
                    className="w-full p-3 border border-border rounded-xl bg-bg-surface text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSendingCode || !resetEmail}
                  onClick={async () => {
                    try {
                      setIsSendingCode(true);
                      setResetError('');
                      setResetSuccess('');
                      await forgotPassword(resetEmail);
                      setResetStep(2);
                    } catch (err: any) { 
                      setResetError(err.message || 'Email bhejne mein error aaya.'); 
                    } finally {
                      setIsSendingCode(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-accent-blue text-white rounded-xl font-semibold hover:brightness-110 transition-all shadow-lg shadow-accent-blue/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSendingCode ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-5 pt-2"
              >
                <div className="text-center mb-6">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                    className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-3"
                  >
                    <ShieldCheck className="text-success w-6 h-6" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-text-primary">Check Your Email</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    We sent a 6-digit code to <strong className="text-text-primary">{resetEmail}</strong>.
                  </p>
                </div>

                <AnimatePresence>
                  {resetSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-3 bg-success/10 border border-success/20 rounded-xl text-sm text-success text-center font-medium"
                    >
                      {resetSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-primary ml-1">
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    placeholder="e.g. 123456"
                    maxLength={6}
                    disabled={isUpdatingPassword}
                    autoComplete="new-password"
                    spellCheck={false}
                    className="w-full p-3 border border-border rounded-xl bg-bg-surface text-text-primary text-center tracking-[0.5em] text-xl font-bold focus:ring-2 focus:ring-accent-blue/30 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text-primary ml-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter your new password"
                    disabled={isUpdatingPassword}
                    autoComplete="new-password"
                    className="w-full p-3 border border-border rounded-xl bg-bg-surface text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-accent-blue/30 outline-none transition-all disabled:opacity-50"
                  />
                </div>

                <button
                  type="button"
                  disabled={isUpdatingPassword || !resetCode || !newPassword}
                  onClick={async () => {
                    try {
                      setIsUpdatingPassword(true);
                      setResetError('');
                      await resetPassword(resetEmail, resetCode, newPassword);
                      setResetSuccess('Password successfully updated!');
                      setTimeout(() => {
                        setShowReset(false);
                        setResetStep(1);
                      }, 2000);
                    } catch (err: any) { 
                      setResetError(err.message || 'Password change nahi ho paya.'); 
                    } finally {
                      setIsUpdatingPassword(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-success text-white rounded-xl font-semibold hover:brightness-110 transition-all shadow-lg shadow-success/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>

                <div className="text-center mt-2">
                  <button
                    type="button"
                    disabled={isUpdatingPassword}
                    onClick={() => setResetStep(1)}
                    className="text-xs text-text-secondary hover:text-accent-blue hover:underline transition-all disabled:opacity-50"
                  >
                    ← Back to email
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <AnimatePresence>
            {resetError && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="p-3 bg-danger/10 border border-danger/20 rounded-xl text-sm text-danger text-center font-medium"
              >
                {resetError}
              </motion.div>
            )}
          </AnimatePresence>
          
        </form>
      </Modal>

    </main>
  );
}

export default Login;