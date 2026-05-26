import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getPublicationRequestDetail,
  startReviewPublicationRequest,
  approvePublicationRequest,
  rejectPublicationRequest,
} from '../../../api/publicationsApi';
import { getFeatureFlags, type FeatureFlags } from '../../../api/featureFlagsApi';
import type {
  PublicationRequestDetail,
  PublicationRequestStatus,
} from '../../../types/publication';

const STATUS_LABELS: Record<PublicationRequestStatus, string> = {
  PENDING_REVIEW: 'Pendiente de revisión',
  UNDER_REVIEW: 'En revisión',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  WITHDRAWN: 'Retirada',
};

const STATUS_COLORS: Record<PublicationRequestStatus, string> = {
  PENDING_REVIEW: 'bg-yellow-100 text-yellow-800',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  WITHDRAWN: 'bg-gray-100 text-gray-600',
};

const OFFER_TYPE_LABELS: Record<string, string> = {
  SALE: 'Venta',
  RENT: 'Arriendo',
  BOTH: 'Venta y Arriendo',
};

function Field({ label, value }: { label: string; value?: string | number | boolean | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div>
      <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{String(value)}</dd>
    </div>
  );
}

export default function PublicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<PublicationRequestDetail | null>(null);
  const [flags, setFlags] = useState<FeatureFlags>({ showOwnerContact: true, showExpectedPrice: true });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isActing, setIsActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectMotive, setRejectMotive] = useState('');
  const [rejectMotiveError, setRejectMotiveError] = useState<string | null>(null);

  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [data, featureFlags] = await Promise.all([
        getPublicationRequestDetail(id),
        getFeatureFlags(),
      ]);
      setDetail(data);
      setFlags(featureFlags);
    } catch {
      setError('No se pudo cargar el detalle de la solicitud.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    async function run() {
      await fetchDetail();
    }
    void run();
  }, [fetchDetail]);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleStartReview() {
    if (!id) return;
    setIsActing(true);
    setActionError(null);
    try {
      await startReviewPublicationRequest(id);
      showToast('Revisión iniciada correctamente.');
      await fetchDetail();
    } catch {
      setActionError('No se pudo iniciar la revisión. Intenta de nuevo.');
    } finally {
      setIsActing(false);
    }
  }

  async function handleApprove() {
    if (!id) return;
    setIsActing(true);
    setActionError(null);
    setShowApproveConfirm(false);
    try {
      await approvePublicationRequest(id);
      showToast('Solicitud aprobada correctamente.');
      await fetchDetail();
    } catch {
      setActionError('No se pudo aprobar la solicitud. Intenta de nuevo.');
    } finally {
      setIsActing(false);
    }
  }

  async function handleReject() {
    if (!id) return;
    if (!rejectMotive.trim()) {
      setRejectMotiveError('El motivo de rechazo es obligatorio.');
      return;
    }
    setIsActing(true);
    setActionError(null);
    setRejectMotiveError(null);
    try {
      await rejectPublicationRequest(id, { decisionMotive: rejectMotive.trim() });
      showToast('Solicitud rechazada correctamente.');
      setShowRejectForm(false);
      setRejectMotive('');
      await fetchDetail();
    } catch {
      setActionError('No se pudo rechazar la solicitud. Intenta de nuevo.');
    } finally {
      setIsActing(false);
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Cargando detalle...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error ?? 'Solicitud no encontrada.'}
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/publications')}
            className="mt-4 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Volver al listado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {toast && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
            {toast}
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Solicitud {detail.referenceNumber}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Recibida el {formatDate(detail.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/publications')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Volver al listado
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[detail.status]}`}>
            {STATUS_LABELS[detail.status]}
          </span>
          {detail.decisionAt && (
            <span className="text-xs text-gray-400">
              Decidida el {formatDate(detail.decisionAt)}
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Datos del propietario
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nombre completo" value={detail.ownerFullName} />
            {flags.showOwnerContact && (
              <>
                <Field label="Correo electrónico" value={detail.ownerEmail} />
                <Field label="Teléfono principal" value={detail.ownerPhonePrimary} />
                <Field label="Teléfono secundario" value={detail.ownerPhoneSecondary} />
              </>
            )}
            <Field label="Tipo de documento" value={detail.ownerDocumentType} />
            <Field label="Número de documento" value={detail.ownerDocumentNumber} />
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Datos del inmueble propuesto
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Tipo de oferta"
              value={OFFER_TYPE_LABELS[detail.proposedOfferType] ?? detail.proposedOfferType}
            />
            <Field label="Ubicación" value={detail.proposedLocation} />
            <Field label="Área (m²)" value={detail.proposedAreaM2} />
            {flags.showExpectedPrice && (
              <Field
                label="Precio esperado"
                value={
                  detail.proposedExpectedPrice
                    ? `$${detail.proposedExpectedPrice.toLocaleString('es-CO')}`
                    : undefined
                }
              />
            )}
          </dl>
          <div className="mt-4">
            <dt className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              Descripción
            </dt>
            <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
              {detail.proposedDescription}
            </dd>
          </div>
        </div>

        {detail.status === 'REJECTED' && detail.decisionMotive && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-xs text-red-500 font-medium uppercase tracking-wide mb-1">
              Motivo de rechazo
            </p>
            <p className="text-sm text-red-800">{detail.decisionMotive}</p>
          </div>
        )}

        {actionError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
        )}

        {detail.status === 'PENDING_REVIEW' && (
          <div className="bg-white rounded-xl shadow-sm p-4">
            <button
              type="button"
              onClick={() => void handleStartReview()}
              disabled={isActing}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isActing ? 'Procesando...' : 'Iniciar revisión'}
            </button>
          </div>
        )}

        {detail.status === 'UNDER_REVIEW' && (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowApproveConfirm(true)}
                disabled={isActing || showRejectForm}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Aprobar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowRejectForm(true);
                  setShowApproveConfirm(false);
                }}
                disabled={isActing || showApproveConfirm}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Rechazar
              </button>
            </div>

            {showApproveConfirm && (
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <p className="text-sm text-green-800 mb-3">
                  ¿Estás seguro de que deseas aprobar esta solicitud?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleApprove()}
                    disabled={isActing}
                    className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium disabled:opacity-50"
                  >
                    {isActing ? 'Aprobando...' : 'Sí, aprobar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowApproveConfirm(false)}
                    disabled={isActing}
                    className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {showRejectForm && (
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <label className="block text-sm text-red-800 font-medium mb-2">
                  Motivo del rechazo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectMotive}
                  onChange={(e) => {
                    setRejectMotive(e.target.value);
                    setRejectMotiveError(null);
                  }}
                  rows={3}
                  placeholder="Explica al propietario por qué se rechaza su solicitud..."
                  className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                />
                {rejectMotiveError && (
                  <p className="text-red-600 text-xs mt-1">{rejectMotiveError}</p>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => void handleReject()}
                    disabled={isActing}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium disabled:opacity-50"
                  >
                    {isActing ? 'Rechazando...' : 'Confirmar rechazo'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectMotive('');
                      setRejectMotiveError(null);
                    }}
                    disabled={isActing}
                    className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}