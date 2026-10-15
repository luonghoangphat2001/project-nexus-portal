import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  CheckCircle,
  AlertCircle,
  Save,
  Lock,
  IdCard,
  UserCheck,
  Globe
} from 'lucide-react';
import { PageHeader, StatusBadge, buttonClass, inputClass } from '../components/common/CommonUi';

export const ProfilePage = () => {
  const { user: authUser, updateUser } = useAuth();
  const { t } = useTranslation();

  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    avatarUrl: '',
    studentCode: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (authUser) {
      setProfile({
        fullName: authUser.fullName || '',
        phone: authUser.phone || '',
        avatarUrl: authUser.avatarUrl || '',
        studentCode: authUser.studentCode || '',
      });
    }
  }, [authUser]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const res = await userService.updateProfile(profile);
      setProfileSuccess(t('profile.updateSuccess', 'Cập nhật hồ sơ thành công!'));
      if (res && res.data) {
        updateUser(res.data);
      }
    } catch (err) {
      setProfileError(err.message || t('profile.updateFailed', 'Cập nhật hồ sơ thất bại'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess('');
    setPasswordError('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError(t('profile.passwordMismatch', 'Mật khẩu xác nhận không khớp!'));
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError(t('profile.passwordMinLength', 'Mật khẩu mới phải từ 6 ký tự trở lên!'));
      setPasswordLoading(false);
      return;
    }

    try {
      await authService.changePassword(passwordData);
      setPasswordSuccess(t('profile.passwordSuccess', 'Đổi mật khẩu thành công!'));
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message || t('profile.passwordFailed', 'Đổi mật khẩu thất bại'));
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('profile.title')}
        description={t('profile.desc')}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Profile Card & Language Preferences */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 text-center">
            <div className="relative inline-block mb-4">
              <img
                src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || authUser?.username || 'User')}&background=2563eb&color=fff&size=128`}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 shadow-xs mx-auto"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser?.username || 'User')}&background=2563eb&color=fff&size=128`;
                }}
              />
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>

            <h2 className="text-base font-bold text-slate-900">{authUser?.fullName || 'User'}</h2>
            <p className="text-sm text-slate-500 font-medium mb-3">@{authUser?.username}</p>

            <div className="flex flex-wrap justify-center gap-1.5 mb-6">
              {authUser?.roles?.map((role) => (
                <StatusBadge key={role} value={role} type="role" />
              ))}
            </div>

            <div className="border-t border-slate-100 pt-4 text-left space-y-3 text-sm">
              <div className="flex items-center text-slate-600 gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{authUser?.email}</span>
              </div>
              <div className="flex items-center text-slate-600 gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{authUser?.phone || t('common.notUpdated', 'Chưa cập nhật')}</span>
              </div>
              <div className="flex items-center text-slate-600 gap-3">
                <IdCard className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{t('users.studentCode')}: <strong className="text-slate-900 font-semibold">{authUser?.studentCode || 'N/A'}</strong></span>
              </div>
              <div className="flex items-center text-slate-600 gap-3">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t('common.status')}: <strong className="text-emerald-700 font-semibold">{t('enums.status.ACTIVE')}</strong></span>
              </div>
            </div>
          </div>

          {/* Language Preference Card */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">{t('profile.languagePreference')}</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">{t('profile.languagePreferenceDesc')}</p>
            <div className="flex justify-center">
              <LanguageSwitcher variant="pill" className="w-full justify-around py-1.5" />
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form 1: Profile information */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">{t('profile.personalInfo')}</h2>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t('profile.fullName')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className={inputClass}
                    placeholder={t('profile.fullName')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t('profile.phone')}
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className={inputClass}
                    placeholder={t('profile.phonePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t('profile.studentCode')}
                  </label>
                  <input
                    type="text"
                    value={profile.studentCode}
                    onChange={(e) => setProfile({ ...profile, studentCode: e.target.value })}
                    className={inputClass}
                    placeholder={t('profile.studentCodePlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    value={profile.avatarUrl}
                    onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                    className={inputClass}
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className={buttonClass('primary')}
                >
                  <Save className="w-4 h-4" />
                  <span>{profileLoading ? t('common.saving') : t('profile.saveProfile')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Form 2: Change password */}
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Key className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">{t('profile.changePassword')}</h2>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t('profile.currentPassword')} *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className={inputClass}
                    placeholder="••••••••"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t('profile.newPassword')} *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className={inputClass}
                      placeholder="••••••••"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {t('profile.confirmPassword')} *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className={inputClass}
                      placeholder="••••••••"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className={buttonClass('primary')}
                >
                  <Key className="w-4 h-4" />
                  <span>{passwordLoading ? t('common.saving') : t('profile.updatePassword')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
