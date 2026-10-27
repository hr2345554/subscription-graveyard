import { useCallback, useEffect, useRef, useState } from 'react';
import { forgotPassword, resetPassword } from '../api/auth';
import { Modal } from '../components/ui/Modal';
import { 
  AnimatePresence, motion, useReducedMotion, useMotionValue, 
  useSpring, useTransform, useMotionTemplate 
} from 'motion/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Skull, Loader2, User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

import { AmbientBackground } from '../components/animations/AmbientBackground';
import { GlitchText } from '../components/animations/GlitchText';
import { DataRunners } from '../components/animations/DataRunners';
import './auth.css';

type AuthMode = 'login' | 'signup';

// 🌟 Updated Schema to accept Username and Confirm Password (optional for Login)
const authSchema = z.object({
  email: z.string().trim().min(1, 'Please enter your email address').email("That email doesn't look right"),
  username: z.string().optional(),
  password: z.string().min(1, 'Please enter your password'),
  confirmPassword: z.string().optional(),
});

type AuthValues = z.infer<typeof authSchema>;

// 🌟 Updated createUser to take the username
function createUser(email: string, name?: string, avatar?: string) {
  const cleanEmail = email.trim().toLowerCase();
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `user_${Date.now()}`,
    email: cleanEmail,
    name: name?.trim() || cleanEmail.split('@')[0] || 'Subscription Manager',
    ...(avatar ? { avatar } : {}),
    currency: 'USD',
    createdAt: new Date().toISOString(),
  };
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: '', className: '' };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 2) return { score: 1, label: 'Weak', className: 'weak' };
  if (score <= 3) return { score: 2, label: 'Okay', className: 'okay' };
  return { score: 3, label: 'Strong', className: 'strong' };
}

const MagneticButton = ({ children, className, ...props }: any) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouse = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * 0.2, y: middleY * 0.2 });
  };

  const reset = () => {
    setPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y, scale: isHovered ? 1.02 : 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export function Login() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const { resolvedTheme } = useTheme();
  const reduceMotion = useReducedMotion();

  const mainRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const bgX = useTransform(smoothX, [-1, 1], [-30, 30]);
  const bgY = useTransform(smoothY, [-1, 1], [-30, 30]);
  const rotateX = useTransform(smoothY, [-1, 1], [4, -4]);
  const rotateY = useTransform(smoothX, [-1, 1], [-4, 4]);
  const glowX = useTransform(smoothX, [-1, 1], ['0%', '100%']);
  const glowY = useTransform(smoothY, [-1, 1], ['0%', '100%']);
  const glowBackground = useMotionTemplate`radial-gradient(circle at ${glowX} ${glowY}, rgba(139, 92, 246, 0.15), transparent 60%)`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!mainRef.current || reduceMotion) return;
    const { left, top, width, height } = mainRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - left) / width * 2 - 1);
    mouseY.set((e.clientY - top) / height * 2 - 1);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5) return 'Burning midnight oil';
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 21) return 'Good evening';
    return 'Good night';
  };

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [submitError, setSubmitError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [emailNotRegistered, setEmailNotRegistered] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [successUser, setSuccessUser] = useState<ReturnType<typeof createUser> | null>(null);

  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    register, handleSubmit, watch, reset, clearErrors,
    formState: { errors, touchedFields },
  } = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: { email: '', username: '', password: '', confirmPassword: '' },
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
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    };
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError('');
    setSignupSuccess('');
    setEmailNotRegistered(false);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(values.email, values.password);
        finishSignIn(createUser(values.email));
      } else {
        // 🌟 Validation for Signup fields
        if (!values.username || values.username.trim().length < 3) {
          throw new Error('Username must be at least 3 characters long.');
        }
        if (values.password !== values.confirmPassword) {
          throw new Error('Passwords do not match.');
        }

        // Pass username as the 3rd argument
        await signup(values.email, values.password, values.username);
        finishSignIn(createUser(values.email, values.username)); // Direct Login (Auto-fill name)
      }
    } catch (error: any) {
      const message = error instanceof Error ? error.message : 'Unable to authenticate. Please try again.';
      
      if (mode === 'login' && (message.includes('registered') || error.code === 'EMAIL_NOT_FOUND')) {
        setEmailNotRegistered(true);
        setSubmitError('This email is not registered.');
      } else {
        setSubmitError(message);
        setShakeKey((value) => value + 1);
      }
    } finally {
      setIsLoading(false);
    }
  });

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setSubmitError('');
    setSignupSuccess('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setEmailNotRegistered(false);
    clearErrors();
    reset({ email: '', username: '', password: '', confirmPassword: '' });
  };

  return (
    <main
      ref={mainRef}
      onMouseMove={handleMouseMove}
      className={`auth-page relative ${resolvedTheme === 'light' ? 'auth-light' : 'auth-dark'}`}
      style={{ perspective: 1200 }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div style={{ x: bgX, y: bgY }} className="absolute -inset-10">
           <AmbientBackground warp={isSuccess} />
        </motion.div>
      </div>

      <DataRunners smoothX={smoothX} smoothY={smoothY} />

      <section
        className={`auth-scene ${submitError ? 'is-error' : ''} ${isSuccess ? 'is-success' : ''}`}
        aria-label="Subscription app animation"
      >
        <div className="auth-scene-overlay" />

        <div className="scene-copy relative z-20">
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
            className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white drop-shadow-lg"
          >
            Your money.
            <br />
            <span className="relative inline-block mt-2">
              <GlitchText 
                text="Your rules." 
                className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500" 
              />
            </span>
          </motion.h1>

          <p className="relative z-20 text-slate-700 dark:text-slate-300 font-medium">
            Track recurring costs and upcoming renewals.
          </p>

          <div className="scene-bottom-note">
            <span className="scene-note-line" />
            <span>LESS WASTE. MORE CONTROL.</span>
          </div>
        </div>

        <div className="scene-coordinate">SG — SUBSCRIPTION CONTROL</div>
      </section>

      <section className="auth-panel relative z-30">
        <div className="auth-panel-glow" />
        <div className="auth-mobile-fog" />

        <div className="auth-card-wrap" style={{ perspective: 1000 }}>
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                className="auth-success"
                initial={reduceMotion ? false : { opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0.15 : 0.45 }}
              >
                <div className="success-beam" />
                <div className="success-symbol">
                  <Check size={28} strokeWidth={2.2} />
                </div>
                <span className="auth-kicker">YOU'RE ALL SET</span>
                <h2>{getGreeting()}.</h2>
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
                className="auth-card relative"
                style={{ 
                  rotateX: reduceMotion ? 0 : rotateX, 
                  rotateY: reduceMotion ? 0 : rotateY, 
                  transformStyle: "preserve-3d" 
                }}
                initial={reduceMotion ? false : { opacity: 0, y: 38, scale: 0.97 }}
                animate={{
                  opacity: 1, y: 0, scale: 1,
                  x: shakeKey > 0 && !reduceMotion ? [0, -8, 7, -5, 3, 0] : 0,
                }}
                transition={{
                  opacity: { duration: 0.5 },
                  y: { duration: reduceMotion ? 0.15 : 0.75, type: 'spring', bounce: 0.24 },
                  scale: { duration: 0.55 },
                  x: { duration: 0.38 },
                }}
              >
                <motion.div
                  className="absolute inset-0 pointer-events-none z-0 rounded-3xl"
                  style={{ background: reduceMotion ? 'none' : glowBackground }}
                />

                <div style={{ transform: "translateZ(30px)" }} className="relative z-10 h-full">
                  
                  <div className="absolute top-0 right-0 z-20">
                    <motion.div
                      animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <svg className="w-5 h-5 sm:w-7 sm:h-7 text-fuchsia-500 drop-shadow-[0_0_8px_rgba(217,70,239,0.8)]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L13.5 9.5L21 11L13.5 12.5L12 20L10.5 12.5L3 11L10.5 9.5L12 2Z" />
                      </svg>
                    </motion.div>
                  </div>

                  <div className="auth-card-top relative">
                    <div className="flex items-center gap-2.5 sm:gap-3 mb-4 pr-6">
                      <div className="flex shrink-0 items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-black text-white shadow-lg" aria-hidden="true">
                        <Skull size={22} strokeWidth={2.5} className="sm:w-7 sm:h-7" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="text-[13px] sm:text-xl font-black tracking-tight leading-tight uppercase">
                          Subscription <span className="text-[#E50914]">Graveyard</span>
                        </h1>
                      </div>
                    </div>

                    <span className="auth-kicker">
                      {mode === 'login' ? 'YOUR SUBSCRIPTIONS AWAIT' : 'START FRESH'}
                    </span>
                    
                    <h2>
                      {mode === 'login' ? `${getGreeting()}.` : 'Create your account'}
                    </h2>
                  </div>

                  <form onSubmit={onSubmit} noValidate autoComplete="off" className="auth-form flex flex-col gap-4">
                    
                    {/* 🌟 USERNAME FIELD (Signup Only) */}
                    {mode === 'signup' && (
                      <motion.div
                        className={`auth-field ${errors.username ? 'has-error' : ''}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduceMotion ? 0 : 0.1 }}
                      >
                        <User className="auth-field-icon" size={17} />
                        <input
                          id="auth-username"
                          type="text"
                          autoComplete="off" 
                          placeholder=" "
                          {...register('username')}
                        />
                        <label htmlFor="auth-username">Username</label>
                      </motion.div>
                    )}

                    <motion.div
                      className={`auth-field ${errors.email ? 'has-error' : ''} ${touchedFields.email && !errors.email && email ? 'is-valid' : ''}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduceMotion ? 0 : 0.12 }}
                    >
                      <Mail className="auth-field-icon" size={17} />
                      <input
                        id="auth-email"
                        type="email"
                        autoComplete="off" 
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
                      className={`auth-field ${errors.password ? 'has-error' : ''}`}
                      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduceMotion ? 0 : 0.2 }}
                    >
                      <LockKeyhole className="auth-field-icon" size={17} />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password" 
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
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
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

                    {/* 🌟 CONFIRM PASSWORD FIELD (Signup Only) */}
                    {mode === 'signup' && (
                      <motion.div
                        className={`auth-field ${errors.confirmPassword ? 'has-error' : ''}`}
                        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: reduceMotion ? 0 : 0.25 }}
                      >
                        <ShieldCheck className="auth-field-icon" size={17} />
                        <input
                          id="auth-confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          autoComplete="new-password" 
                          placeholder=" "
                          {...register('confirmPassword')}
                        />
                        <label htmlFor="auth-confirm-password">Confirm Password</label>
                        <button
                          className="password-visibility"
                          type="button"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                        >
                          {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </motion.div>
                    )}

                    <div className="min-h-[24px]">
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
                                className={segment <= strength.score ? `strength-segment active ${strength.className}` : 'strength-segment'}
                              />
                            ))}
                          </div>
                          <span className={`strength-label ${strength.className}`}>{strength.label}</span>
                        </motion.div>
                      )}

                      {mode === 'login' && (
                        <div className="flex w-full items-center justify-center gap-2 mt-1 select-none">
                          <span className="text-xs font-semibold text-text-secondary">Forgot password?</span>
                          <button
                            type="button"
                            onClick={() => {
                              const currentEmail = watch('email');
                              setResetEmail(currentEmail || '');
                              setShowReset(true);
                              setResetStep(1);
                              setResetError('');
                              setResetSuccess('');
                            }}
                            className="h-5 px-2 flex items-center justify-center rounded-full text-[10px] font-bold leading-none text-violet-600 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 active:scale-95 dark:text-violet-300 dark:bg-violet-900/30 dark:border-violet-700/50 dark:hover:bg-violet-800/40 transition-all"
                          >
                            Reset it
                          </button>
                        </div>
                      )}
                    </div>

                    <AnimatePresence>
                      {signupSuccess && (
                        <motion.div
                          className="flex items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 p-3 text-sm font-medium text-green-500"
                          role="status"
                          initial={{ opacity: 0, y: -6, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -6, height: 0 }}
                        >
                          <Check size={16} /> {signupSuccess}
                        </motion.div>
                      )}
                    </AnimatePresence>

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

                    {emailNotRegistered && (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => {
                          setMode('signup');
                          setSubmitError('');
                          setEmailNotRegistered(false);
                          const currentEmail = watch('email');
                          reset({ email: currentEmail, username: '', password: '', confirmPassword: '' });
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded-xl font-bold transition-all hover:bg-violet-200 dark:hover:bg-violet-900/50"
                      >
                        Create Account with {watch('email')} <ArrowRight size={16} />
                      </motion.button>
                    )}

                    <MagneticButton
                      className="auth-submit w-full h-[56px] rounded-2xl mt-1"
                      type="submit"
                      disabled={isLoading}
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
                    </MagneticButton>
                  </form>

                  <div className="auth-mode-switch">
                    <span>
                      {mode === 'login' ? 'New around here?' : 'Already have an account?'}
                    </span>
                    <button
                      type="button"
                      onClick={() => changeMode(mode === 'login' ? 'signup' : 'login')}
                    >
                      {mode === 'login' ? 'Sign up' : 'Log in'}
                    </button>
                  </div>

                  <div className="auth-trust-note">
                    <ShieldCheck size={14} />
                    <span>Your money. Your choices. Your peace of mind.</span>
                  </div>
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

                <MagneticButton
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
                </MagneticButton>
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

                <MagneticButton
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
                </MagneticButton>

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