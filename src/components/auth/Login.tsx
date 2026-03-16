import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as loginRequest, getCurrentUser } from "@/api/auth";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Veuillez saisir votre email et votre mot de passe.");
      setLoading(false);
      return;
    }

    try {
      const data = await loginRequest({ email, password });
      try {
        if (data) {
          localStorage.setItem("session", JSON.stringify(data));
        }
        // Immediately fetch current user after successful login
        const me = await getCurrentUser();
        localStorage.setItem("currentUser", JSON.stringify(me));
      } catch {
        // ignore storage errors
      }

      navigate("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la connexion.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#0f172a,_transparent_60%),radial-gradient(circle_at_bottom,_#1d3a5f,_transparent_60%)] opacity-60 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="mb-6 flex items-center gap-3 justify-center">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center shadow-[0_0_24px_rgba(19,127,236,0.65)]">
            <img
              src="/ags_logo.png"
              alt="Alliance Solution Group"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-left">
            <p className="text-slate-200 text-xs uppercase tracking-[0.25em]">
              Portail ERP
            </p>
            <p className="text-white font-black text-lg tracking-tight">
              Alliance Solution Group
            </p>
          </div>
        </div>

        <div className="bg-[#020817]/90 border border-slate-800 rounded-2xl shadow-2xl shadow-slate-900/70 backdrop-blur-sm p-6 space-y-6">
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">
              Connexion administrateur
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Accédez au tableau de bord de gestion des ventes et des stocks.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Adresse email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base">
                  mail
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@entreprise.com"
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/60 focus:ring-1 focus:ring-[#137fec]/40"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Mot de passe
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-base">
                  lock
                </span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/70 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#137fec]/60 focus:ring-1 focus:ring-[#137fec]/40"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-900 text-[#137fec] focus:ring-0"
                />
                <span>Se souvenir de moi</span>
              </label>
              <button
                type="button"
                className="text-[#8abcff] hover:text-[#b5d6ff] font-medium"
              >
                Mot de passe oublié ?
              </button>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#137fec] hover:bg-[#0f6bcc] disabled:opacity-70 disabled:cursor-not-allowed text-sm font-medium text-white py-2.5 shadow-[0_18px_40px_rgba(19,127,236,0.35)] transition-colors"
            >
              {loading && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Se connecter</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center">
            En vous connectant, vous acceptez les{" "}
            <span className="text-slate-300 underline underline-offset-2">
              conditions d&apos;utilisation
            </span>{" "}
            et la{" "}
            <span className="text-slate-300 underline underline-offset-2">
              politique de confidentialité
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

