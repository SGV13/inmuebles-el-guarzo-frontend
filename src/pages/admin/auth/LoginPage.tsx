import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { getCurrentUser } from "../../../api/authApi";
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";

interface FormErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormErrors({});
    setIsLoading(true);

    const errors: FormErrors = {};
    if (!email.trim()) errors.email = "Ingresa tu correo electrónico";
    if (!password.trim()) errors.password = "Ingresa tu contraseña";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw new Error(error.message);

      const token = data.session.access_token;
      localStorage.setItem("token", token);

      const profile = await getCurrentUser(token);
      localStorage.setItem("user", JSON.stringify(profile));

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">

      <div
        className="absolute inset-0 bg-cover bg-center brightness-90"
        style={{
          backgroundImage: `url("https://res.cloudinary.com/dltwbjdgf/image/upload/v1764547537/FHC3HOUZKZBBXATJPW6S4ARTLI_bzppf7.jpg")`,
        }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="animate-slide-up relative z-10 w-full max-w-md px-8 py-10 sm:px-10 rounded-3xl shadow-2xl
                      bg-white/15 backdrop-blur-xl border border-white/30">

        <div className="flex justify-center mb-7">
          <div className="p-0.5 rounded-full bg-gradient-to-b from-white/50 to-white/10 shadow-2xl">
            <img
              src="https://res.cloudinary.com/dltwbjdgf/image/upload/v1764549645/Inmuebles-el-guarzo_g3mnsh.png"
              alt="Logo Inmuebles El Guarzo"
              className="w-24 h-24 rounded-full border-2 border-white/30"
            />
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-white text-center drop-shadow-md tracking-wide mb-2">
          Administración
        </h2>

        <p className="text-white/75 text-sm text-center font-light tracking-wide mb-8">
          Inicia sesión para acceder al panel
        </p>

        {error && (
          <div className="flex items-center gap-2 bg-red-500/80 text-white text-sm font-medium
                          px-4 py-3 rounded-xl mb-5 shadow-lg border border-red-300/40">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          <div className="space-y-1.5">
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-black-500 pointer-events-none"
              />
              <input
                type="email"
                placeholder="Correo electrónico"
                autoComplete="email"
                className={`w-full pl-11 pr-4 py-3 rounded-full bg-white/70 text-gray-800
                  backdrop-blur-md border text-sm transition-all duration-200 outline-none
                  placeholder:text-gray-500
                  ${formErrors.email
                    ? "border-red-400 ring-2 ring-red-300/50"
                    : "border-white/40 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400"
                  }`}
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            {formErrors.email && (
              <p className="flex items-center gap-1 text-red-200 text-xs px-4">
                <AlertCircle size={12} className="shrink-0" />
                {formErrors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-black-500 pointer-events-none"
              />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                autoComplete="current-password"
                className={`w-full pl-11 pr-12 py-3 rounded-full bg-white/70 text-gray-800
                  backdrop-blur-md border text-sm transition-all duration-200 outline-none
                  placeholder:text-gray-500
                  ${formErrors.password
                    ? "border-red-400 ring-2 ring-red-300/50"
                    : "border-white/40 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400"
                  }`}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {formErrors.password && (
              <p className="flex items-center gap-1 text-red-200 text-xs px-4">
                <AlertCircle size={12} className="shrink-0" />
                {formErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3.5 rounded-full text-white font-semibold shadow-xl
              transition-all duration-300 flex items-center justify-center gap-2
              ${isLoading
                ? "bg-gray-500/80 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-green-500 hover:from-blue-700 hover:to-green-600 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
              }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Iniciando...</span>
              </>
            ) : (
              <>
                <LogIn size={18} />
                <span>Iniciar sesión</span>
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6">
          <button
            onClick={() => navigate("/admin/forgot-password")}
            className="text-white/70 text-sm hover:text-blue-200 hover:underline transition-colors"
            disabled={isLoading}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </p>
      </div>
    </div>
  );
}
