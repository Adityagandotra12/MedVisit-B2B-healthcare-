import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa6';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Input } from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';
import { validateLoginForm } from '../utils/validators';
import loginHero from '../assets/login-hero.svg';
import { Loader } from '../components/common/Loader';

export default function LoginPage() {
  const {
    user,
    authReady,
    login,
    loginWithGoogle,
    loading,
    error,
    isFirebaseConfigured,
    missingFirebaseEnvKeys,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
  const [googleLoading, setGoogleLoading] = useState(false);

  const formError = useMemo(() => validateLoginForm(email, password), [email, password]);

  if (!authReady || loading) {
    return (
      <section className="auth-shell">
        <Loader />
        <p style={{ textAlign: 'center', marginTop: '0.75rem', color: 'var(--text-secondary)' }}>
          {googleLoading ? 'Completing Google sign-in...' : 'Loading...'}
        </p>
      </section>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (Object.keys(formError).length) {
      setLocalErrors(formError);
      return;
    }
    setLocalErrors({});
    try {
      await login(email, password);
    } catch {
      // Error already tracked by context state.
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch {
      setGoogleLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <Card className="login-layout">
        <div className="login-visual">
          <img src={loginHero} alt="Healthcare platform illustration" className="login-visual-image" />
          <h3>Smart care operations</h3>
          <p>Manage patients, appointments, and outcomes from one secure platform.</p>
        </div>

        <div className="login-form-wrap">
          <h2 className="login-title">MedVisit</h2>
          <p className="login-subtitle">Smart patient flow - from check-in to follow-up</p>
          <form onSubmit={handleSubmit}>
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={localErrors.email}
              placeholder="admin@healthops.com"
            />
            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={localErrors.password}
              placeholder="••••••••"
            />
            <div className="form-inline-actions">
              <button
                type="button"
                className="text-button"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />} {showPassword ? 'Hide' : 'Show'} password
              </button>
              <label className="remember-box">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                />
                Remember me
              </label>
            </div>
            <button type="button" className="text-button" style={{ marginTop: '0.4rem' }}>
              Forgot password?
            </button>
            {error ? <p className="error">{error}</p> : null}
            {!isFirebaseConfigured ? (
              <p className="error">
                Configure Firebase in <code>.env.local</code> (same folder as <code>package.json</code>
                ), then restart <code>npm run dev</code>.
                {missingFirebaseEnvKeys.length > 0
                  ? ` Missing: ${missingFirebaseEnvKeys.join(', ')}.`
                  : null}
              </p>
            ) : null}
            <Button
              type="submit"
              disabled={loading || !isFirebaseConfigured}
              style={{ width: '100%', marginTop: '0.6rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="login-divider">
              <span>or</span>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={loading || googleLoading || !isFirebaseConfigured}
              onClick={handleGoogleSignIn}
              className="google-sign-in-button"
              style={{ width: '100%' }}
            >
              <FaGoogle /> {googleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
            </Button>
          </form>
        </div>
      </Card>
    </section>
  );
}
