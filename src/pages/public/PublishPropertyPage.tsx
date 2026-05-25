import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { submitPublicationRequest } from '../../api/publicationsApi';
import type {
  SubmitPublicationRequestBody,
  ProposedOfferType,
  OwnerDocumentType,
} from '../../types/publication';

interface FormState {
  ownerFullName: string;
  ownerEmail: string;
  ownerPhonePrimary: string;
  ownerPhoneSecondary: string;
  ownerDocumentType: string;
  ownerDocumentNumber: string;
  proposedOfferType: string;
  proposedLocation: string;
  proposedAreaM2: string;
  proposedDescription: string;
  proposedExpectedPrice: string;
  consentAccepted: boolean;
}

interface FormErrors {
  ownerFullName?: string;
  ownerEmail?: string;
  ownerPhonePrimary?: string;
  ownerPhoneSecondary?: string;
  ownerDocumentNumber?: string;
  proposedOfferType?: string;
  proposedLocation?: string;
  proposedDescription?: string;
  proposedAreaM2?: string;
  proposedExpectedPrice?: string;
  consent?: string;
  captcha?: string;
  submit?: string;
}

const INITIAL_FORM: FormState = {
  ownerFullName: '',
  ownerEmail: '',
  ownerPhonePrimary: '',
  ownerPhoneSecondary: '',
  ownerDocumentType: '',
  ownerDocumentNumber: '',
  proposedOfferType: '',
  proposedLocation: '',
  proposedAreaM2: '',
  proposedDescription: '',
  proposedExpectedPrice: '',
  consentAccepted: false,
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function PublishPropertyPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPriceFocused, setIsPriceFocused] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  function handlePriceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, proposedExpectedPrice: digits }));
    setErrors((prev) => ({ ...prev, proposedExpectedPrice: undefined, submit: undefined }));
  }

  function toggleLanguage() {
    const next = i18n.language.startsWith('es') ? 'en' : 'es';
    void i18n.changeLanguage(next);
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined, submit: undefined }));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    const PHONE_REGEX = /^[+\d\s\-()]+$/;

    if (!form.ownerFullName.trim())
      errs.ownerFullName = t('publishProperty.errors.ownerFullName.required');
    else if (form.ownerFullName.trim().length > 200)
      errs.ownerFullName = t('publishProperty.errors.ownerFullName.maxLength');

    if (!form.ownerEmail.trim())
      errs.ownerEmail = t('publishProperty.errors.ownerEmail.required');
    else if (!validateEmail(form.ownerEmail))
      errs.ownerEmail = t('publishProperty.errors.ownerEmail.invalid');

    if (!form.ownerPhonePrimary.trim())
      errs.ownerPhonePrimary = t('publishProperty.errors.ownerPhonePrimary.required');
    else if (!PHONE_REGEX.test(form.ownerPhonePrimary))
      errs.ownerPhonePrimary = t('publishProperty.errors.ownerPhonePrimary.format');
    else if (form.ownerPhonePrimary.length > 50)
      errs.ownerPhonePrimary = t('publishProperty.errors.ownerPhonePrimary.maxLength');

    if (form.ownerPhoneSecondary.trim()) {
      if (!PHONE_REGEX.test(form.ownerPhoneSecondary))
        errs.ownerPhoneSecondary = t('publishProperty.errors.ownerPhoneSecondary.format');
      else if (form.ownerPhoneSecondary.length > 50)
        errs.ownerPhoneSecondary = t('publishProperty.errors.ownerPhoneSecondary.maxLength');
    }

    if (form.ownerDocumentNumber.trim().length > 40)
      errs.ownerDocumentNumber = t('publishProperty.errors.ownerDocumentNumber.maxLength');

    if (!form.proposedOfferType)
      errs.proposedOfferType = t('publishProperty.errors.proposedOfferType.required');

    if (!form.proposedLocation.trim())
      errs.proposedLocation = t('publishProperty.errors.proposedLocation.required');
    else if (form.proposedLocation.trim().length > 300)
      errs.proposedLocation = t('publishProperty.errors.proposedLocation.maxLength');

    if (!form.proposedDescription.trim())
      errs.proposedDescription = t('publishProperty.errors.proposedDescription.required');
    else if (form.proposedDescription.trim().length < 20)
      errs.proposedDescription = t('publishProperty.errors.proposedDescription.minLength');
    else if (form.proposedDescription.trim().length > 2000)
      errs.proposedDescription = t('publishProperty.errors.proposedDescription.maxLength');

    if (form.proposedAreaM2 !== '') {
      const area = Number(form.proposedAreaM2);
      if (Number.isNaN(area) || area < 1)
        errs.proposedAreaM2 = t('publishProperty.errors.proposedAreaM2.min');
      else if (area > 100000)
        errs.proposedAreaM2 = t('publishProperty.errors.proposedAreaM2.max');
    }
    if (form.proposedExpectedPrice !== '') {
      const price = Number(form.proposedExpectedPrice);
      if (Number.isNaN(price) || price < 300000)
        errs.proposedExpectedPrice = t('publishProperty.errors.proposedExpectedPrice.min');
      else if (price > 50000000000)
        errs.proposedExpectedPrice = t('publishProperty.errors.proposedExpectedPrice.max');
    }
    if (!form.consentAccepted)
      errs.consent = t('publishProperty.errors.consent.required');
    if (!captchaToken)
      errs.captcha = t('publishProperty.errors.captcha.required');
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setIsSubmitting(true);
    setErrors({});

    const body: SubmitPublicationRequestBody = {
      ownerFullName: form.ownerFullName.trim(),
      ownerEmail: form.ownerEmail.trim(),
      ownerPhonePrimary: form.ownerPhonePrimary.trim(),
      proposedOfferType: form.proposedOfferType as ProposedOfferType,
      proposedLocation: form.proposedLocation.trim(),
      proposedDescription: form.proposedDescription.trim(),
      consentAccepted: true,
      captchaToken,
    };

    if (form.ownerPhoneSecondary.trim())
      body.ownerPhoneSecondary = form.ownerPhoneSecondary.trim();
    if (form.ownerDocumentType)
      body.ownerDocumentType = form.ownerDocumentType as OwnerDocumentType;
    if (form.ownerDocumentNumber.trim())
      body.ownerDocumentNumber = form.ownerDocumentNumber.trim();
    if (form.proposedAreaM2 !== '')
      body.proposedAreaM2 = Number(form.proposedAreaM2);
    if (form.proposedExpectedPrice !== '')
      body.proposedExpectedPrice = Number(form.proposedExpectedPrice);

    try {
      const response = await submitPublicationRequest(body);
      navigate('/publish-property/success', {
        state: {
          referenceNumber: response.referenceNumber,
          createdAt: response.createdAt,
        },
      });
    } catch (error: unknown) {
      turnstileRef.current?.reset();
      setCaptchaToken('');
      const axiosError = error as {
        response?: { status?: number; data?: { message?: string; error?: string } };
      };
      const status = axiosError?.response?.status;
      const backendMessage =
        axiosError?.response?.data?.message ?? axiosError?.response?.data?.error;

      if (status === 409)
        setErrors({ submit: t('publishProperty.errors.duplicate') });
      else if (status === 400)
        setErrors({ submit: backendMessage ?? t('publishProperty.errors.validation') });
      else
        setErrors({ submit: backendMessage ?? t('publishProperty.errors.generic') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-700 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-white/80 hover:text-white text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors px-4 py-1.5 rounded-full flex items-center gap-1.5"
          >
            ← {t('publishProperty.backToHome')}
          </button>
          <button
            type="button"
            onClick={toggleLanguage}
            className="text-white text-sm font-medium bg-white/20 hover:bg-white/30 transition-colors px-4 py-1.5 rounded-full"
          >
            {t('publishProperty.languageSelector')}
          </button>
        </div>

        <div className="rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <form onSubmit={handleSubmit} noValidate>

            <div className="bg-white/10 backdrop-blur-md px-8 pt-8 pb-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {t('publishProperty.pageTitle')}
                </h1>
                <p className="text-blue-100 text-sm">
                  {t('publishProperty.pageSubtitle')}
                </p>
              </div>

              <div>
                <h2 className="text-white font-semibold text-lg mb-4 border-b border-white/20 pb-2">
                  {t('publishProperty.sections.ownerData')}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-blue-100 text-sm font-medium mb-1">
                      {t('publishProperty.fields.ownerFullName.label')}
                      <span className="text-red-300 ml-1">*</span>
                    </label>
                    <input
                      name="ownerFullName"
                      type="text"
                      value={form.ownerFullName}
                      onChange={handleChange}
                      placeholder={t('publishProperty.fields.ownerFullName.placeholder')}
                      className="w-full px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    {errors.ownerFullName && (
                      <p className="text-red-300 text-xs mt-1 ml-4">{errors.ownerFullName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-blue-100 text-sm font-medium mb-1">
                      {t('publishProperty.fields.ownerEmail.label')}
                      <span className="text-red-300 ml-1">*</span>
                    </label>
                    <input
                      name="ownerEmail"
                      type="email"
                      value={form.ownerEmail}
                      onChange={handleChange}
                      placeholder={t('publishProperty.fields.ownerEmail.placeholder')}
                      className="w-full px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    {errors.ownerEmail && (
                      <p className="text-red-300 text-xs mt-1 ml-4">{errors.ownerEmail}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-blue-100 text-sm font-medium mb-1">
                        {t('publishProperty.fields.ownerPhonePrimary.label')}
                        <span className="text-red-300 ml-1">*</span>
                      </label>
                      <input
                        name="ownerPhonePrimary"
                        type="text"
                        value={form.ownerPhonePrimary}
                        onChange={handleChange}
                        placeholder={t('publishProperty.fields.ownerPhonePrimary.placeholder')}
                        className="w-full px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                      {errors.ownerPhonePrimary && (
                        <p className="text-red-300 text-xs mt-1 ml-4">{errors.ownerPhonePrimary}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-blue-100 text-sm font-medium mb-1">
                        {t('publishProperty.fields.ownerPhoneSecondary.label')}
                      </label>
                      <input
                        name="ownerPhoneSecondary"
                        type="text"
                        value={form.ownerPhoneSecondary}
                        onChange={handleChange}
                        placeholder={t('publishProperty.fields.ownerPhoneSecondary.placeholder')}
                        className="w-full px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                      {errors.ownerPhoneSecondary && (
                        <p className="text-red-300 text-xs mt-1 ml-4">{errors.ownerPhoneSecondary}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-blue-100 text-sm font-medium mb-1">
                        {t('publishProperty.fields.ownerDocumentType.label')}
                      </label>
                      <select
                        name="ownerDocumentType"
                        value={form.ownerDocumentType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                      >
                        <option value="" className="text-gray-800">
                          {t('publishProperty.fields.ownerDocumentType.placeholder')}
                        </option>
                        {(['CC', 'CE', 'TI', 'PP', 'NIT', 'RUT'] as const).map((type) => (
                          <option key={type} value={type} className="text-gray-800">
                            {t(`publishProperty.documentTypes.${type}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-blue-100 text-sm font-medium mb-1">
                        {t('publishProperty.fields.ownerDocumentNumber.label')}
                      </label>
                      <input
                        name="ownerDocumentNumber"
                        type="text"
                        value={form.ownerDocumentNumber}
                        onChange={handleChange}
                        placeholder={t('publishProperty.fields.ownerDocumentNumber.placeholder')}
                        className="w-full px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                      />
                      {errors.ownerDocumentNumber && (
                        <p className="text-red-300 text-xs mt-1 ml-4">{errors.ownerDocumentNumber}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white px-8 pt-6 pb-8 space-y-6">
              <div>
                <h2 className="text-blue-900 font-semibold text-lg mb-4 border-b border-gray-200 pb-2">
                  {t('publishProperty.sections.propertyData')}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      {t('publishProperty.fields.proposedOfferType.label')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      name="proposedOfferType"
                      value={form.proposedOfferType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-full bg-gray-50 border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    >
                      <option value="">
                        {t('publishProperty.fields.proposedOfferType.placeholder')}
                      </option>
                      {(['SALE', 'RENT', 'BOTH'] as const).map((type) => (
                        <option key={type} value={type}>
                          {t(`publishProperty.fields.proposedOfferType.options.${type}`)}
                        </option>
                      ))}
                    </select>
                    {errors.proposedOfferType && (
                      <p className="text-red-500 text-xs mt-1 ml-4">{errors.proposedOfferType}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      {t('publishProperty.fields.proposedLocation.label')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      name="proposedLocation"
                      type="text"
                      value={form.proposedLocation}
                      onChange={handleChange}
                      placeholder={t('publishProperty.fields.proposedLocation.placeholder')}
                      className="w-full px-4 py-3 rounded-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    />
                    {errors.proposedLocation && (
                      <p className="text-red-500 text-xs mt-1 ml-4">{errors.proposedLocation}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        {t('publishProperty.fields.proposedAreaM2.label')}
                      </label>
                      <input
                        name="proposedAreaM2"
                        type="number"
                        min={1}
                        max={100000}
                        value={form.proposedAreaM2}
                        onChange={handleChange}
                        placeholder={t('publishProperty.fields.proposedAreaM2.placeholder')}
                        className="w-full px-4 py-3 rounded-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      />
                      {errors.proposedAreaM2 && (
                        <p className="text-red-500 text-xs mt-1 ml-4">{errors.proposedAreaM2}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">
                        {t('publishProperty.fields.proposedExpectedPrice.label')}
                      </label>
                      <input
                        name="proposedExpectedPrice"
                        type="text"
                        inputMode="numeric"
                        value={
                          !isPriceFocused && form.proposedExpectedPrice
                            ? new Intl.NumberFormat('es-CO').format(Number(form.proposedExpectedPrice))
                            : form.proposedExpectedPrice
                        }
                        onChange={handlePriceChange}
                        onFocus={() => setIsPriceFocused(true)}
                        onBlur={() => setIsPriceFocused(false)}
                        placeholder={t('publishProperty.fields.proposedExpectedPrice.placeholder')}
                        className="w-full px-4 py-3 rounded-full bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                      />
                      {errors.proposedExpectedPrice && (
                        <p className="text-red-500 text-xs mt-1 ml-4">{errors.proposedExpectedPrice}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-1">
                      {t('publishProperty.fields.proposedDescription.label')}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <textarea
                      name="proposedDescription"
                      value={form.proposedDescription}
                      onChange={handleChange}
                      rows={4}
                      placeholder={t('publishProperty.fields.proposedDescription.placeholder')}
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/50 resize-none"
                    />
                    <p className="text-gray-500 text-xs mt-1 ml-4">
                      {form.proposedDescription.length}/2000
                    </p>
                    {errors.proposedDescription && (
                      <p className="text-red-500 text-xs mt-1 ml-4">{errors.proposedDescription}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Turnstile
                  ref={turnstileRef}
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken('')}
                  onError={() => setCaptchaToken('')}
                  options={{ theme: 'light' }}
                />
                {errors.captcha && (
                  <p className="text-red-500 text-xs">{errors.captcha}</p>
                )}
              </div>

              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    name="consentAccepted"
                    type="checkbox"
                    checked={form.consentAccepted}
                    onChange={handleChange}
                    className="mt-1 w-4 h-4 rounded accent-blue-600 flex-shrink-0"
                  />
                  <span className="text-gray-700 text-sm">
                    {t('publishProperty.consent.text')}
                  </span>
                </label>
                {errors.consent && (
                  <p className="text-red-500 text-xs mt-1 ml-7">{errors.consent}</p>
                )}
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-300 rounded-2xl px-4 py-3">
                  <p className="text-red-600 text-sm text-center">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-semibold text-lg shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? t('publishProperty.submitting') : t('publishProperty.submit')}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
