import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { ShoppingBasket, AlertCircle, Phone, Mail, ArrowLeft, Loader2 } from 'lucide-react';

export default function Login() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState('select'); // 'select', 'email', 'phone'
  const [isSignUp, setIsSignUp] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  useEffect(() => {
    // Initialize RecaptchaVerifier once when the component mounts
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response) => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          setError('Recaptcha expired. Please try again.');
        }
      });
    }

    // Cleanup on unmount (important for React HMR and re-renders)
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized for OAuth. Please add it in your Firebase Console.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Try signing in.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const appVerifier = window.recaptchaVerifier;
      // Format number to E.164 if missing the + sign (basic check, assume user types it properly)
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
        setError('Please enter your phone number in E.164 format (e.g. +14155552671)');
        setIsLoading(false);
        return;
      }
      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Phone Authentication is not enabled. Please enable it in the Firebase Console.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Must include country code (e.g., +1).');
      } else {
        setError(err.message || 'Failed to send SMS.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await confirmationResult.confirm(otp);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid code. Please try again.');
      } else {
        setError(err.message || 'Failed to verify code.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Invisible container for reCAPTCHA */}
      <div id="recaptcha-container"></div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center relative">
          {mode !== 'select' && (
            <button 
              onClick={() => { setMode('select'); setError(''); setConfirmationResult(null); }}
              className="absolute left-4 top-4 text-white/80 hover:text-white transition p-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="bg-white/20 p-4 rounded-full inline-block mb-4 shadow-inner">
            <ShoppingBasket className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">SmartList AI</h1>
          <p className="text-indigo-100 font-medium text-sm">Your intelligent, predictive grocery assistant</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {mode === 'select' ? 'Sign in to your list' : mode === 'email' ? (isSignUp ? 'Create Account' : 'Welcome Back') : 'Phone Authentication'}
          </h2>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* MODE: SELECT */}
          {mode === 'select' && (
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium py-3 px-4 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continue with Google
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              
              <button
                onClick={() => setMode('email')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium py-3 px-4 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-100 disabled:opacity-50"
              >
                <Mail className="w-5 h-5" />
                Continue with Email
              </button>

              <button
                onClick={() => setMode('phone')}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-teal-50 text-teal-700 hover:bg-teal-100 font-medium py-3 px-4 rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-100 disabled:opacity-50"
              >
                <Phone className="w-5 h-5" />
                Continue with Phone
              </button>
            </div>
          )}

          {/* MODE: EMAIL */}
          {mode === 'email' && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-slate-50 text-slate-900"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-slate-50 text-slate-900"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition shadow-md shadow-indigo-200 disabled:opacity-70 flex justify-center items-center gap-2"
              >
                {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                {isSignUp ? 'Create Account' : 'Sign In'}
              </button>
              
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                </button>
              </div>
            </form>
          )}

          {/* MODE: PHONE */}
          {mode === 'phone' && (
            <div className="space-y-4">
              {!confirmationResult ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition bg-slate-50 text-slate-900"
                      placeholder="+1 555 123 4567"
                    />
                    <p className="text-xs text-slate-500 mt-2">Include your country code (e.g. +1 for US)</p>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-teal-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-teal-700 transition shadow-md shadow-teal-200 disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    Send SMS Code
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="bg-teal-50 p-4 rounded-lg text-teal-800 text-sm mb-4">
                    Code sent to <strong>{phoneNumber}</strong>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">6-Digit Code</label>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition tracking-widest text-center text-lg font-mono bg-slate-50 text-slate-900"
                      placeholder="------"
                      maxLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || otp.length < 6}
                    className="w-full bg-teal-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-teal-700 transition shadow-md shadow-teal-200 disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    Verify Code
                  </button>
                </form>
              )}
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-500 max-w-[16rem] mx-auto">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
