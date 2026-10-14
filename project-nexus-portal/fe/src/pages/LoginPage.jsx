import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { Layers, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage = () => {
  const { t } = useTranslation();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        await register({
          username: usernameOrEmail,
          email,
          password,
          fullName,
          roles: ['ROLE_ADMIN'],
        });
        await login(usernameOrEmail, password);
      } else {
        await login(usernameOrEmail, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || t('auth.authFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-lg relative z-10">
        {/* Language Switcher in Header of Form */}
        <div className="flex justify-end mb-2">
          <LanguageSwitcher variant="pill" />
        </div>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-13 h-13 rounded-2xl bg-gradient-to-r from-[#da8cff] to-[#9a55ff] flex items-center justify-center text-white shadow-md shadow-brand-500/20 mb-3 p-3">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {isRegisterMode ? t('auth.createAccount') : t('auth.welcome')}
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {isRegisterMode
              ? t('auth.registerSubtitle')
              : t('auth.signInSubtitle')}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  {t('auth.fullName')}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#b66dff] transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#b66dff] transition-colors"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              {isRegisterMode ? t('auth.username') : t('auth.usernameOrEmail')}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder={isRegisterMode ? t('auth.usernamePlaceholder') : t('auth.usernameOrEmailPlaceholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#b66dff] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#b66dff] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-gradient-to-r from-[#da8cff] to-[#9a55ff] hover:opacity-95 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>{isRegisterMode ? t('auth.completeRegistration') : t('auth.signIn')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {!isRegisterMode && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium mb-2.5 text-center">
              {t('auth.quickDemoAccounts')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setUsernameOrEmail('superadmin');
                  setPassword('password123');
                }}
                className="px-3 py-2 bg-slate-50 hover:bg-[#f8f2ff]/50 border border-slate-200 hover:border-[#e1c2ff] rounded-xl text-left transition-all"
              >
                <div className="text-[11px] font-semibold text-[#b66dff]">{t('auth.admin')}</div>
                <div className="text-xs text-slate-600 font-mono">superadmin</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUsernameOrEmail('individual_user');
                  setPassword('password123');
                }}
                className="px-3 py-2 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 rounded-xl text-left transition-all"
              >
                <div className="text-[11px] font-semibold text-emerald-700">{t('auth.student')}</div>
                <div className="text-xs text-slate-600 font-mono">individual_user</div>
              </button>
            </div>
          </div>
        )}

        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage('');
            }}
            className="text-xs text-[#b66dff] hover:text-[#b66dff] font-medium transition-colors"
          >
            {isRegisterMode
              ? t('auth.alreadyHaveAccount')
              : t('auth.dontHaveAccount')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
