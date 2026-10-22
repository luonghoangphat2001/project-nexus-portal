import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { formatApiError } from '../utils/errorHandler';
import { Layers, Lock, User, AlertCircle, ArrowRight, BookOpen, ClipboardCheck, GraduationCap, UsersRound } from 'lucide-react';
import { inputClass } from '../components/common/CommonUi';

const DEMO_ACCOUNTS = [
  { label: 'Trưởng khoa', username: 'principal', icon: GraduationCap },
  { label: 'Giáo viên', username: 'teacher', icon: BookOpen },
  { label: 'Sinh viên chưa có đề tài', username: 'individual_user', icon: User },
  { label: 'Sinh viên đã có đề tài', username: 'student', icon: ClipboardCheck },
  { label: 'Hội đồng', username: 'council', icon: UsersRound },
];

const DEMO_PASSWORD = 'password123';

export const LoginPage = () => {
  const { t, language } = useTranslation();
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

  const from = location.state?.from?.pathname || '/';

  const fillDemoAccount = (username) => {
    setUsernameOrEmail(username);
    setPassword(DEMO_PASSWORD);
    setErrorMessage('');
  };

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
      setErrorMessage(formatApiError(err, language));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 shadow-sm relative z-10">
        {/* Language Switcher in Header of Form */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher variant="pill" />
        </div>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-13 h-13 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xs mb-3 p-3">
            <Layers className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isRegisterMode ? t('auth.createAccount') : t('auth.welcome')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isRegisterMode
              ? t('auth.registerSubtitle')
              : t('auth.signInSubtitle')}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-center space-x-2.5 text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t('auth.fullName')} *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('auth.fullNamePlaceholder')}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t('auth.email')} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  className={inputClass}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {isRegisterMode ? t('auth.username') : t('auth.usernameOrEmail')} *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="text"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder={isRegisterMode ? t('auth.usernamePlaceholder') : t('auth.usernameOrEmailPlaceholder')}
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              {t('auth.password')} *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`${inputClass} pl-10`}
              />
            </div>
          </div>

          {!isRegisterMode && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5" aria-label="Tài khoản mẫu">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Tài khoản mẫu</p>
                <span className="text-[11px] text-slate-400">Bấm để tự điền</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map(({ label, username, icon: Icon }) => (
                  <button
                    key={username}
                    type="button"
                    onClick={() => fillDemoAccount(username)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-left text-xs font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-blue-600" />
                    <span className="leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50 text-sm cursor-pointer"
          >
            <span>{isRegisterMode ? t('auth.createAccount') : t('auth.signIn')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setErrorMessage('');
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 transition cursor-pointer"
          >
            {isRegisterMode
              ? t('auth.hasAccountSignIn')
              : t('auth.noAccountRegister')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
