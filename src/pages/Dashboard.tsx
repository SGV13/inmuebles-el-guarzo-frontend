import { logout } from "../hooks/useAuth";

export default function Dashboard() {
  const user = localStorage.getItem("user");

  return (
    <div className="min-h-screen bg-gray-100 p-10">
      <h1 className="text-3xl font-bold mb-4">
        Dashboard Administrativo
      </h1>

      <p className="mb-6">
        Usuario actual: {user}
      </p>

      <button
        onClick={logout}
        className="bg-red-600 text-white px-4 py-2 rounded-lg"
      >
        Cerrar sesión
      </button>
    </div>
  );
}
