import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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
  UserCheck
} from 'lucide-react';

export const ProfilePage = () => {
  const { user: authUser, updateUser } = useAuth();

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
      setProfileSuccess('Profile updated successfully!');
      if (res && res.data) {
        updateUser(res.data);
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile');
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
      setPasswordError('New password and confirmation password do not match!');
      setPasswordLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long!');
      setPasswordLoading(false);
      return;
    }

    try {
      await authService.changePassword(passwordData);
      setPasswordSuccess('Password changed successfully! New credentials are now active.');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return <span key={role} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">System Admin</span>;
      case 'ROLE_PRINCIPAL':
        return <span key={role} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">Faculty / Dept Head</span>;
      case 'ROLE_TEACHER':
        return <span key={role} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Thesis Advisor</span>;
      case 'ROLE_COUNCIL':
        return <span key={role} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-200">Evaluation Council</span>;
      case 'ROLE_USER':
      default:
        return <span key={role} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Student</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <User className="w-7 h-7 text-indigo-600" />
            User Profile & Security
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your academic identity profile and update your sign-in credentials
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="relative inline-block mb-4">
              <img
                src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.fullName || authUser?.username || 'User')}&background=6366f1&color=fff&size=128`}
                alt="Avatar"
                className="w-28 h-28 rounded-full object-cover border-4 border-indigo-50 shadow-md mx-auto"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(authUser?.username || 'User')}&background=6366f1&color=fff&size=128`;
                }}
              />
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>

            <h2 className="text-lg font-bold text-slate-800">{authUser?.fullName || 'User'}</h2>
            <p className="text-sm text-slate-500 font-medium mb-3">@{authUser?.username}</p>

            <div className="flex flex-wrap justify-center gap-1.5 mb-6">
              {authUser?.roles?.map(getRoleBadge)}
            </div>

            <div className="border-t border-slate-100 pt-4 text-left space-y-3 text-sm">
              <div className="flex items-center text-slate-600 gap-3">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{authUser?.email}</span>
              </div>
              <div className="flex items-center text-slate-600 gap-3">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{authUser?.phone || 'Phone not provided'}</span>
              </div>
              <div className="flex items-center text-slate-600 gap-3">
                <IdCard className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Student/Staff ID: <strong className="text-slate-800">{authUser?.studentCode || 'N/A'}</strong></span>
              </div>
              <div className="flex items-center text-slate-600 gap-3">
                <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Status: <strong className="text-emerald-600">Active</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form 1: Profile information */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">Update Identity Profile</h2>
            </div>

            {profileSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {profileSuccess}
              </div>
            )}

            {profileError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profile.fullName}
                    onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Student / Lecturer Code</label>
                  <input
                    type="text"
                    value={profile.studentCode}
                    onChange={(e) => setProfile({ ...profile, studentCode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    placeholder="STD2026001"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Avatar Image URL</label>
                  <input
                    type="url"
                    value={profile.avatarUrl}
                    onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {profileLoading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>

          {/* Form 2: Change password */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Key className="w-5 h-5 text-amber-600" />
              <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password *</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                    placeholder="••••••••"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">New Password (Min. 6 characters) *</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                      placeholder="••••••••"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Confirm New Password *</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm"
                      placeholder="••••••••"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <Key className="w-4 h-4" />
                  {passwordLoading ? 'Processing...' : 'Update Password'}
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
