import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPublicationRequests } from '../../../api/publicationsApi';
import type {
  PublicationRequestSummary,
  PublicationRequestStatus,
  ListPublicationRequestsQuery,
} from '../../../types/publication';

const STATUS_LABELS: Record<PublicationRequestStatus, string> = {
  PENDING_REVIEW: 'Pendiente',
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

const PAGE_SIZE = 10;

export default function PublicationsListPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<PublicationRequestSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<PublicationRequestStatus | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const query: ListPublicationRequestsQuery = {
          page,
          limit: PAGE_SIZE,
        };
        if (statusFilter) query.status = statusFilter;
        const response = await listPublicationRequests(query);
        setItems(response.items);
        setTotal(response.total);
      } catch {
        setError('No se pudieron cargar las solicitudes. Intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    }
    void fetchData();
  }, [page, statusFilter]);

  function handleStatusFilter(value: string) {
    setStatusFilter(value as PublicationRequestStatus | '');
    setPage(1);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Solicitudes de publicación
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {total} solicitud{total !== 1 ? 'es' : ''} en total
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Volver al panel
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-2">
          {(['', 'PENDING_REVIEW', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s === '' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <p className="text-gray-400">Cargando solicitudes...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <>
            {items.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <p className="text-gray-400">No hay solicitudes para mostrar.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Referencia</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Propietario</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Teléfono</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Tipo oferta</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Ubicación</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Estado</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Fecha</th>
                        <th className="text-left px-4 py-3 text-gray-500 font-medium">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">
                            {item.referenceNumber}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-900">{item.ownerFullName}</div>
                            <div className="text-gray-400 text-xs">{item.ownerEmail}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{item.ownerPhonePrimary}</td>
                          <td className="px-4 py-3 text-gray-600">
                            {OFFER_TYPE_LABELS[item.proposedOfferType] ?? item.proposedOfferType}
                          </td>
                          <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                            {item.proposedLocation}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                              {STATUS_LABELS[item.status]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => navigate(`/admin/publications/${item.id}`)}
                              className="text-blue-600 hover:text-blue-800 font-medium text-xs"
                            >
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Página {page} de {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1 rounded text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}