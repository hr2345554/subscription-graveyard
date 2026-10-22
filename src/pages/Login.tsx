import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
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
  RotateCcw,
  Skull,
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

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              width?: number;
              logo_alignment?: 'left' | 'center';
            },
          ) => void;
        };
      };
    };
  }
}

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

function decodeGoogleCredential(credential: string): {
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
} {
  const payload = credential.split('.')[1];

  if (!payload) {
    throw new Error('Google returned an invalid sign-in response.');
  }

  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const bytes = atob(padded);

  const decoded = decodeURIComponent(
    Array.from(bytes)
      .map((character) =>
        `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`,
      )
      .join(''),
  );

  return JSON.parse(decoded) as {
    email?: string;
    name?: string;
    picture?: string;
    email_verified?: boolean;
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

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="google-mark">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.7a12 12 0 0 1 0-7.4V15H5.8a20 20 0 0 0 0 18l6.8-5.3Z"
      />
      <path
        fill="#EA4335"
        d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.8 15l6.8 5.3C14.2 15.5 18.7 11.9 24 11.9Z"
      />
    </svg>
  );
}

export function Login() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const reduceMotion = useReducedMotion();

  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showResetNote, setShowResetNote] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [googleMessage, setGoogleMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [successUser, setSuccessUser] = useState<
    ReturnType<typeof createUser> | null
  >(null);

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as
    | string
    | undefined;

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
      setGoogleMessage('');

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

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !window.google || !googleButtonRef.current) return;

      googleButtonRef.current.replaceChildren();

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        cancel_on_tap_outside: true,
        callback: (response) => {
          try {
            const profile = decodeGoogleCredential(response.credential);

            if (!profile.email || profile.email_verified !== true) {
              setGoogleMessage(
                'Google could not verify this email. Please try another account.',
              );
              setShakeKey((value) => value + 1);
              return;
            }

            finishSignIn(
              createUser(profile.email, profile.name, profile.picture),
            );
          } catch {
            setGoogleMessage(
              'We could not complete Google sign-in. Please try again.',
            );
          }
        },
      });

      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: Math.min(
          Math.max(googleButtonRef.current.clientWidth, 220),
          420,
        ),
        logo_alignment: 'left',
      });
    };

    if (window.google) {
      renderGoogleButton();
    } else {
      let script = document.querySelector<HTMLScriptElement>(
        'script[data-google-identity]',
      );

      if (!script) {
        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.dataset.googleIdentity = 'true';
        document.head.appendChild(script);
      }

      script.addEventListener('load', renderGoogleButton);
    }

    return () => {
      cancelled = true;
    };
  }, [googleClientId, finishSignIn]);

  
const onSubmit = handleSubmit(async (values) => {
  setSubmitError('');
  setGoogleMessage('');
  setShowResetNote(false);
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
    setGoogleMessage('');
    setShowResetNote(false);
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
          submitError || googleMessage ? 'is-error' : ''
        } ${isSuccess ? 'is-success' : ''}`}
        aria-label="Subscription app animation"
      >
        <div className="auth-scene-overlay" />

        <OrbitingSubscriptions />

        {/* Scene branding removed. Auth card emblem is preserved. */}

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
          title={`Switch to ${
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
                <div className="auth-card-top">
                  {/* Keep the skull emblem inside the auth card */}
                  <div className="auth-card-emblem" aria-hidden="true">
                    <Skull size={38} strokeWidth={1.8} />
                  </div>

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

                  <p>
                    {mode === 'login'
                      ? 'Sign in to take control of recurring costs.'
                      : 'Bring all your subscriptions into one place.'}
                  </p>
                </div>

                <div className="auth-google-area">
                  {googleClientId ? (
                    <div
                      className="google-real-button"
                      ref={googleButtonRef}
                    />
                  ) : (
                    <button
                      type="button"
                      className="google-fallback-button"
                      onClick={() =>
                        setGoogleMessage(
                          'Google sign-in needs a configured OAuth client ID. Add VITE_GOOGLE_CLIENT_ID to your .env file first.',
                        )
                      }
                    >
                      <GoogleMark />
                      <span>Continue with Google</span>
                      <span className="google-button-spacer" />
                    </button>
                  )}
                </div>

                <div className="auth-divider">
                  <span />
                  <span>or continue with email</span>
                  <span />
                </div>

                <form
                  onSubmit={onSubmit}
                  noValidate
                  className="auth-form"
                >
                  <motion.div
                    className={`auth-field ${
                      errors.email ? 'has-error' : ''
                    } ${
                      touchedFields.email && !errors.email && email
                        ? 'is-valid'
                        : ''
                    }`}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 8 }
                    }
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
                      aria-describedby={
                        errors.email ? 'email-error' : undefined
                      }
                      {...register('email')}
                    />

                    <label htmlFor="auth-email">Email address</label>

                    {touchedFields.email && !errors.email && email && (
                      <Check
                        className="auth-field-check"
                        size={16}
                      />
                    )}
                  </motion.div>

                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        id="email-error"
                        className="auth-field-error"
                        initial={{ opacity: 0, height: 0, y: -4 }}
                        animate={{
                          opacity: 1,
                          height: 'auto',
                          y: 0,
                        }}
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
                    initial={
                      reduceMotion ? false : { opacity: 0, y: 8 }
                    }
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: reduceMotion ? 0 : 0.2 }}
                  >
                    <LockKeyhole
                      className="auth-field-icon"
                      size={17}
                    />

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
                      aria-describedby={
                        errors.password
                          ? 'password-error'
                          : undefined
                      }
                      {...register('password')}
                    />

                    <label htmlFor="auth-password">Password</label>

                    <button
                      className="password-visibility"
                      type="button"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      aria-label={
                        showPassword ? 'Hide password' : 'Show password'
                      }
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
                        animate={{
                          opacity: 1,
                          height: 'auto',
                          y: 0,
                        }}
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

                      <span
                        className={`strength-label ${strength.className}`}
                      >
                        {strength.label}
                      </span>
                    </motion.div>
                  )}

                  {mode === 'login' && (
                    <div className="auth-forgot-row">
                      <span>Forgot your password?</span>

                      <button
                        type="button"
                        onClick={() =>
                          setShowResetNote((value) => !value)
                        }
                      >
                        Reset it
                      </button>
                    </div>
                  )}

                  <AnimatePresence>
                    {showResetNote && mode === 'login' && (
                      <motion.div
                        className="auth-reset-note"
                        initial={{
                          opacity: 0,
                          y: -5,
                          height: 0,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          height: 'auto',
                        }}
                        exit={{
                          opacity: 0,
                          y: -5,
                          height: 0,
                        }}
                      >
                        <RotateCcw size={15} />
                        Demo mode: reset link would be sent.
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {(submitError || googleMessage) && (
                      <motion.div
                        className="auth-error-banner"
                        role="alert"
                        initial={{
                          opacity: 0,
                          y: -6,
                          height: 0,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          height: 'auto',
                        }}
                        exit={{
                          opacity: 0,
                          y: -6,
                          height: 0,
                        }}
                      >
                        <span className="error-dot" />
                        {submitError || googleMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    className="auth-submit"
                    type="submit"
                    disabled={isLoading}
                    whileHover={
                      reduceMotion ? undefined : { y: -2 }
                    }
                    whileTap={
                      reduceMotion ? undefined : { scale: 0.985 }
                    }
                  >
                    <span className="submit-shimmer" />

                    {isLoading ? (
                      <>
                        <span className="auth-spinner" />
                        {mode === 'login'
                          ? 'Signing in…'
                          : 'Creating account…'}
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
                      changeMode(
                        mode === 'login' ? 'signup' : 'login',
                      )
                    }
                  >
                    {mode === 'login' ? 'Sign up' : 'Log in'}
                  </button>
                </div>

                <div className="auth-trust-note">
                  <ShieldCheck size={14} />
                  <span>
                    Your money. Your choices. Your peace of mind.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="auth-panel-footer">
          <span>
            © {new Date().getFullYear()} Subscription Graveyard
          </span>
          <span className="footer-separator">·</span>
          <span>Your subscriptions, under control.</span>
        </div>
      </section>
    </main>
  );
}

export default Login;