import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Lock, Eye, EyeOff, AlertCircle, ArrowLeft, KeyRound } from "lucide-react";
import { supabase } from "../../../lib/supabase";

interface FormValues {
  password: string;
  confirmPassword: string;
}

type PageState = "loading" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setPageState("ready");
      }
    });

    // Fallback: if after 3 s no PASSWORD_RECOVERY event arrived, mark invalid
    const timeout = setTimeout(() => {
      setPageState((current) => current === "loading" ? "invalid" : current);
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const onSubmit = async ({ password }: FormValues) => {
    setIsLoading(true);
    setSubmitError("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      toast.success("Contraseña actualizada correctamente");
      navigate("/admin/login");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al actualizar la contraseña";
      setSubmitError(message);
      toast.error(message);
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
          Nueva contraseña
        </h2>

        <p className="text-white/75 text-sm text-center font-light tracking-wide mb-8">
          Elige una contraseña segura para tu cuenta
        </p>

        {pageState === "loading" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <svg className="animate-spin h-8 w-8 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-white/70 text-sm">Verificando enlace...</p>
          </div>
        )}

        {pageState === "invalid" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-2 bg-red-500/80 text-white text-sm font-medium
                            px-4 py-3 rounded-xl shadow-lg border border-red-300/40 w-full">
              <AlertCircle size={16} className="shrink-0" />
              <span>
                El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.
              </span>
            </div>
            <button
              onClick={() => navigate("/admin/forgot-password")}
              className="flex items-center gap-1.5 text-white/70 text-sm hover:text-blue-200 hover:underline transition-colors mt-2"
            >
              <ArrowLeft size={15} />
              Solicitar nuevo enlace
            </button>
          </div>
        )}

        {pageState === "ready" && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {submitError && (
              <div className="flex items-center gap-2 bg-red-500/80 text-white text-sm font-medium
                              px-4 py-3 rounded-xl shadow-lg border border-red-300/40">
                <AlertCircle size={16} className="shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-black-500 pointer-events-none"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  autoComplete="new-password"
                  disabled={isLoading}
                  className={`w-full pl-11 pr-12 py-3 rounded-full bg-white/70 text-gray-800
                    backdrop-blur-md border text-sm transition-all duration-200 outline-none
                    placeholder:text-gray-500
                    ${errors.password
                      ? "border-red-400 ring-2 ring-red-300/50"
                      : "border-white/40 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400"
                    }`}
                  {...register("password", {
                    required: "Ingresa tu nueva contraseña",
                    minLength: {
                      value: 8,
                      message: "La contraseña debe tener al menos 8 caracteres",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 text-red-200 text-xs px-4">
                  <AlertCircle size={12} className="shrink-0" />
                  {errors.password.message}
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
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  autoComplete="new-password"
                  disabled={isLoading}
                  className={`w-full pl-11 pr-12 py-3 rounded-full bg-white/70 text-gray-800
                    backdrop-blur-md border text-sm transition-all duration-200 outline-none
                    placeholder:text-gray-500
                    ${errors.confirmPassword
                      ? "border-red-400 ring-2 ring-red-300/50"
                      : "border-white/40 focus:ring-2 focus:ring-blue-400/60 focus:border-blue-400"
                    }`}
                  {...register("confirmPassword", {
                    required: "Confirma tu nueva contraseña",
                    validate: (value) =>
                      value === watch("password") || "Las contraseñas no coinciden",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  title={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
                  disabled={isLoading}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="flex items-center gap-1 text-red-200 text-xs px-4">
                  <AlertCircle size={12} className="shrink-0" />
                  {errors.confirmPassword.message}
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
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <KeyRound size={18} />
                  <span>Establecer contraseña</span>
                </>
              )}
            </button>

            <p className="text-center">
              <button
                type="button"
                onClick={() => navigate("/admin/login")}
                className="flex items-center gap-1.5 text-white/70 text-sm hover:text-blue-200 hover:underline transition-colors mx-auto"
                disabled={isLoading}
              >
                <ArrowLeft size={15} />
                Volver al inicio de sesión
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
