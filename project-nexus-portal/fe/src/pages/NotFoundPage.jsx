import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center p-6">
      <div className="text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-emerald-400 mb-4 font-mono">
        404
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{t('notFound.title')}</h1>
      <p className="text-slate-500 text-sm max-w-md mb-8">
        {t('notFound.desc')}
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('notFound.returnDashboard')}</span>
      </Link>
    </div>
  );
};

export default NotFoundPage;

