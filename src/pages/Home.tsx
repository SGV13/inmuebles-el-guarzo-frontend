import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-700 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg text-center">
        <div className="bg-white/10 backdrop-blur-md rounded-3xl shadow-2xl p-10 border border-white/20">
          <h1 className="text-4xl font-bold text-white mb-3">
            Inmuebles El Guarzo
          </h1>
          <p className="text-blue-100 text-base mb-10">
            Encuentra o publica tu inmueble con el respaldo de asesores expertos en el mercado colombiano.
          </p>

          <button
            type="button"
            onClick={() => navigate('/publish-property')}
            className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-semibold text-lg shadow-lg transition-all duration-200 mb-4"
          >
            Quiero publicar mi inmueble
          </button>

          <button
            type="button"
            onClick={() => navigate('/admin/login')}
            className="w-full py-3 px-6 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-sm font-medium transition-all duration-200 border border-white/20"
          >
            Acceso administrativo
          </button>
        </div>
      </div>
    </div>
  );
}