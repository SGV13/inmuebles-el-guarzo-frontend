import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SuccessState {
  referenceNumber: string;
  createdAt: string;
}

export default function PublishPropertySuccessPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as SuccessState | null;

  useEffect(() => {
    if (!state?.referenceNumber) {
      navigate('/publish-property', { replace: true });
    }
  }, [state, navigate]);

  if (!state?.referenceNumber) return null;

  const formattedDate = new Date(state.createdAt).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-700 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20 text-center">
          <div className="w-20 h-20 bg-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">
            {t('publishSuccess.title')}
          </h1>
          <p className="text-blue-100 text-sm mb-6">
            {t('publishSuccess.message')}
          </p>

          <div className="bg-white/10 rounded-2xl px-6 py-4 mb-4">
            <p className="text-blue-200 text-xs mb-1">{t('publishSuccess.referenceLabel')}</p>
            <p className="text-white text-2xl font-mono font-bold tracking-wider">
              {state.referenceNumber}
            </p>
            <p className="text-blue-200 text-xs mt-2">{formattedDate}</p>
          </div>

          <p className="text-blue-200 text-xs mb-8">{t('publishSuccess.emailNotice')}</p>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-semibold shadow-lg transition-all duration-200"
          >
            {t('publishSuccess.backToHome')}
          </button>
        </div>
      </div>
    </div>
  );
}