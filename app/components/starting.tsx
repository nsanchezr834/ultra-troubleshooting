"use client";

import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function StartingPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Obtener el token CSRF al montar el componente
  useEffect(() => {
    async function fetchCsrf() {
      try {
        const res = await fetch("/api/auth/csrf");
        if (res.ok) {
          const data = await res.json();
          setCsrfToken(data.csrfToken);
        } else {
          setError("Error de inicialización de seguridad.");
        }
      } catch (err) {
        console.error("Error al obtener token CSRF:", err);
        setError("Error de conexión segura.");
      }
    }
    fetchCsrf();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password,
          csrfToken,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        // Recargar la página para que el Server Component vuelva a evaluar la sesión
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setError(data.error || "Credenciales incorrectas.");
        setLoading(false);
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setError("No se pudo conectar con el servidor.");
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#090a0f] overflow-hidden font-sans select-none">
      {/* ── Fondo Abstracto Premium con Orbes Ultra Orange ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Orbe 1 - Arriba a la derecha */}
        <div 
          className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.15] blur-[150px] transition-all duration-1000"
          style={{ backgroundColor: "#FF5A00" }}
        />
        {/* Orbe 2 - Abajo a la izquierda */}
        <div 
          className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[120px] transition-all duration-1000"
          style={{ backgroundColor: "#FF5A00" }}
        />
        {/* Línea o patrón de rejilla tecnológico sutil */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* ── Contenedor de Vidrio Esmerilado (Glassmorphism) ── */}
      <div className="relative z-10 w-full max-w-[420px] mx-4 transition-all duration-500">
        <div className="bg-[#12131a]/65 backdrop-blur-[24px] rounded-2xl border border-white/[0.07] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] shadow-[#FF5A00]/5 flex flex-col items-center">
          
          {/* Encabezado */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-full bg-white/[0.02] border border-white/[0.08] flex items-center justify-center mb-4 shadow-inner shadow-white/5 relative group">
              {/* Resplandor trasero para el icono */}
              <div className="absolute inset-0 rounded-full bg-[#FF5A00] opacity-0 group-hover:opacity-10 blur-md transition-opacity duration-300" />
              <Lock className="w-6 h-6 text-[#FF5A00] transition-transform duration-300 group-hover:scale-105" />
            </div>
            <h1 className="text-xl font-semibold text-white tracking-wide">
              Acceso Seguro
            </h1>
            <p className="text-xs text-gray-400 mt-1.5 text-center px-4">
              Ingresa la clave de acceso de Ultra para continuar
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            {/* Campo de Contraseña */}
            <div className="flex flex-col gap-2">
              <label 
                htmlFor="password" 
                className="text-xs font-medium text-gray-300 tracking-wider uppercase pl-0.5"
              >
                Contraseña
              </label>
              
              <div className="relative w-full">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || success}
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[#0d0e12]/80 border border-white/[0.08] focus:border-[#FF5A00]/70 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-all duration-300 pr-11 shadow-inner shadow-black/40"
                />
                
                {/* Botón Mostrar/Ocultar contraseña */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors focus:outline-none"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de Iniciar Sesión */}
            <button
              type="submit"
              disabled={loading || success}
              className="relative overflow-hidden w-full bg-[#FF5A00] hover:bg-[#E04F00] active:scale-[0.98] disabled:active:scale-100 text-white text-sm font-semibold py-3 rounded-lg transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-75 shadow-lg shadow-[#FF5A00]/25 mt-2 flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : success ? (
                <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
              ) : (
                "Entrar"
              )}
              {success && <span>Acceso Autorizado</span>}
            </button>
          </form>

          {/* Espacio reservado para mensajes de error / notificaciones */}
          <div className="h-10 mt-4 flex items-center justify-center w-full">
            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-950/20 border border-red-500/20 px-3 py-1.5 rounded-md text-xs animate-in fade-in slide-in-from-bottom-2 duration-300 w-full justify-center">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">{error}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
