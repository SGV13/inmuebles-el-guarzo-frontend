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
  const turnstileRef = useRef<TurnstileInstance | null>(null);

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
    if (!form.ownerFullName.trim())
      errs.ownerFullName = t('publishProperty.errors.ownerFullName.required');
    if (!form.ownerEmail.trim())
      errs.ownerEmail = t('publishProperty.errors.ownerEmail.required');
    else if (!validateEmail(form.ownerEmail))
      errs.ownerEmail = t('publishProperty.errors.ownerEmail.invalid');
    if (!form.ownerPhonePrimary.trim())
      errs.ownerPhonePrimary = t('publishProperty.errors.ownerPhonePrimary.required');
    if (!form.proposedOfferType)
      errs.proposedOfferType = t('publishProperty.errors.proposedOfferType.required');
    if (!form.proposedLocation.trim())
      errs.proposedLocation = t('publishProperty.errors.proposedLocation.required');
    if (!form.proposedDescription.trim())
      errs.proposedDescription = t('publishProperty.errors.proposedDescription.required');
    else if (form.proposedDescription.trim().length < 20)
      errs.proposedDescription = t('publishProperty.errors.proposedDescription.minLength');
    if (form.proposedAreaM2 !== '') {
      const area = Number(form.proposedAreaM2);
      if (isNaN(area) || area < 1)
        errs.proposedAreaM2 = t('publishProperty.errors.proposedAreaM2.min');
      else if (area > 100000)
        errs.proposedAreaM2 = t('publishProperty.errors.proposedAreaM2.max');
    }
    if (form.proposedExpectedPrice !== '') {
      const price = Number(form.proposedExpectedPrice);
      if (isNaN(price) || price < 300000)
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
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 409)
        setErrors({ submit: t('publishProperty.errors.duplicate') });
      else if (status === 400)
        setErrors({ submit: t('publishProperty.errors.validation') });
      else
        setErrors({ submit: t('publishProperty.errors.generic') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-700 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-2xl">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={toggleLanguage}
            className="text-white text-sm font-medium bg-white/20 hover:bg-white/30 transition-colors px-4 py-1.5 rounded-full"
          >
            {t('publishProperty.languageSelector')}
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-8 border border-white/20">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {t('publishProperty.pageTitle')}
            </h1>
            <p className="text-blue-100 text-sm">
              {t('publishProperty.pageSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-white font-semibold text-lg mb-4 border-b border-white/20 pb-2">
                {t('publishProperty.sections.propertyData')}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-1">
                    {t('publishProperty.fields.proposedOfferType.label')}
                    <span className="text-red-300 ml-1">*</span>
                  </label>
                  <select
                    name="proposedOfferType"
                    value={form.proposedOfferType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <option value="" className="text-gray-800">
                      {t('publishProperty.fields.proposedOfferType.placeholder')}
                    </option>
                    {(['SALE', 'RENT', 'BOTH'] as const).map((type) => (
                      <option key={type} value={type} className="text-gray-800">
                        {t(`publishProperty.fields.proposedOfferType.options.${type}`)}
                      </option>
                    ))}
                  </select>
                  {errors.proposedOfferType && (
                    <p className="text-red-300 text-xs mt-1 ml-4">{errors.proposedOfferType}</p>
                  )}
                </div>

                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-1">
                    {t('publishProperty.fields.proposedLocation.label')}
                    <span className="text-red-300 ml-1">*</span>
                  </label>
                  <input
                    name="proposedLocation"
                    type="text"
                    value={form.proposedLocation}
                    onChange={handleChange}
                    placeholder={t('publishProperty.fields.proposedLocation.placeholder')}
                    className="w-full px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  {errors.proposedLocation && (
                    <p className="text-red-300 text-xs mt-1 ml-4">{errors.proposedLocation}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-blue-100 text-sm font-medium mb-1">
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
                      className="w-full px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    {errors.proposedAreaM2 && (
                      <p className="text-red-300 text-xs mt-1 ml-4">{errors.proposedAreaM2}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-blue-100 text-sm font-medium mb-1">
                      {t('publishProperty.fields.proposedExpectedPrice.label')}
                    </label>
                    <input
                      name="proposedExpectedPrice"
                      type="number"
                      min={300000}
                      value={form.proposedExpectedPrice}
                      onChange={handleChange}
                      placeholder={t('publishProperty.fields.proposedExpectedPrice.placeholder')}
                      className="w-full px-4 py-3 rounded-full bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                    />
                    {errors.proposedExpectedPrice && (
                      <p className="text-red-300 text-xs mt-1 ml-4">{errors.proposedExpectedPrice}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-blue-100 text-sm font-medium mb-1">
                    {t('publishProperty.fields.proposedDescription.label')}
                    <span className="text-red-300 ml-1">*</span>
                  </label>
                  <textarea
                    name="proposedDescription"
                    value={form.proposedDescription}
                    onChange={handleChange}
                    rows={4}
                    placeholder={t('publishProperty.fields.proposedDescription.placeholder')}
                    className="w-full px-4 py-3 rounded-2xl bg-white/20 border border-white/30 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none"
                  />
                  <p className="text-blue-200 text-xs mt-1 ml-4">
                    {form.proposedDescription.length}/20 mín.
                  </p>
                  {errors.proposedDescription && (
                    <p className="text-red-300 text-xs mt-1 ml-4">{errors.proposedDescription}</p>
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
                <p className="text-red-300 text-xs">{errors.captcha}</p>
              )}
            </div>

            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  name="consentAccepted"
                  type="checkbox"
                  checked={form.consentAccepted}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded accent-emerald-400 flex-shrink-0"
                />
                <span className="text-blue-100 text-sm">
                  {t('publishProperty.consent.text')}
                </span>
              </label>
              {errors.consent && (
                <p className="text-red-300 text-xs mt-1 ml-7">{errors.consent}</p>
              )}
            </div>

            {errors.submit && (
              <div className="bg-red-500/20 border border-red-400/40 rounded-2xl px-4 py-3">
                <p className="text-red-200 text-sm text-center">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-semibold text-lg shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? t('publishProperty.submitting') : t('publishProperty.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}