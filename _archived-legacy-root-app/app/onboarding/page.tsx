"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Building2, Mail, Sparkles, CheckCircle2, TrendingUp } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  company_name: z.string().min(2, "Mínimo 2 caracteres").max(100, "Muito longo"),
  email: z.string().email("Email inválido").min(1, "Email obrigatório"),
});
type FormData = z.infer<typeof schema>;

const C = {
  bg:    "hsl(222 47% 6%)",
  muted: "hsl(215 20% 45%)",
  mutedLg: "hsl(215 20% 58%)",
  brand: "#0ea5e9",
  brandLt: "#38bdf8",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  const companyName = watch("company_name");
  const emailVal    = watch("email");

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    sessionStorage.setItem("gp_company", data.company_name);
    sessionStorage.setItem("gp_email", data.email);
    // Small delay for visual feedback
    await new Promise(r => setTimeout(r, 400));
    router.push("/diagnosis");
  }

  const inputBase: React.CSSProperties = {
    width: "100%", height: 50, borderRadius: 12,
    border: "1.5px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.04)",
    padding: "0 16px 0 44px",
    fontSize: 14, color: "white",
    outline: "none", boxSizing: "border-box",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>

      {/* Ambient */}
      <div aria-hidden style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -120, left: "50%", transform: "translateX(-50%)", width: 700, height: 500, borderRadius: "50%", background: "rgba(14,165,233,0.07)", filter: "blur(100px)" }} />
      </div>

      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 50, padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(10,14,23,0.85)", backdropFilter: "blur(16px)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp style={{ width: 14, height: 14, color: "white" }} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, color: "white" }}>
              Growth Planner <span style={{ color: C.brandLt }}>B2B</span>
            </span>
          </Link>
          <span style={{ fontSize: 12, color: C.muted }}>Etapa 1 de 3</span>
        </div>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1, position: "relative", zIndex: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "32px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 480 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Icon + Title */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
                style={{
                  width: 60, height: 60, borderRadius: 18,
                  background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 20px",
                  boxShadow: "0 8px 28px rgba(14,165,233,0.3)",
                }}
              >
                <Sparkles style={{ width: 28, height: 28, color: "white" }} />
              </motion.div>

              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
                Vamos começar
              </h1>
              <p style={{ color: C.mutedLg, fontSize: 14, lineHeight: 1.7, maxWidth: 360, margin: "0 auto" }}>
                Informe os dados da sua empresa para personalizar seu diagnóstico comercial.
              </p>
            </div>

            {/* Form card */}
            <form onSubmit={handleSubmit(onSubmit)}>
              <div
                className="glass"
                style={{ borderRadius: 20, padding: 28, marginBottom: 16 }}
              >
                {/* Company */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, marginBottom: 8, color: "hsl(210 40% 85%)" }}>
                    <Building2 style={{ width: 14, height: 14, color: C.brand }} />
                    Nome da empresa
                  </label>
                  <div style={{ position: "relative" }}>
                    <Building2 style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: C.muted, pointerEvents: "none" }} />
                    <input
                      {...register("company_name")}
                      type="text"
                      placeholder="Ex: Acme Tecnologia Ltda"
                      autoFocus
                      className="gp-input"
                      style={{ ...inputBase, padding: "0 16px 0 44px" }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.company_name && (
                      <motion.p
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 6 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        style={{ fontSize: 12, color: "#f87171" }}
                      >
                        {errors.company_name.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, marginBottom: 8, color: "hsl(210 40% 85%)" }}>
                    <Mail style={{ width: 14, height: 14, color: C.brand }} />
                    Email profissional
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: C.muted, pointerEvents: "none" }} />
                    <input
                      {...register("email")}
                      type="email"
                      placeholder="voce@empresa.com.br"
                      className="gp-input"
                      style={{ ...inputBase }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(14,165,233,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(14,165,233,0.1)"; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 6 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        style={{ fontSize: 12, color: "#f87171" }}
                      >
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Personalized preview */}
              <AnimatePresence>
                {companyName && companyName.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: "hidden", marginBottom: 16 }}
                  >
                    <div style={{
                      borderRadius: 12, padding: "12px 16px",
                      background: "rgba(14,165,233,0.07)",
                      border: "1px solid rgba(14,165,233,0.15)",
                    }}>
                      <p style={{ fontSize: 13, color: "#7dd3fc", lineHeight: 1.6 }}>
                        ✓ Vamos criar o plano de crescimento para{" "}
                        <strong style={{ color: "#bae6fd" }}>{companyName}</strong>
                        {" "}com base nos 3 pilares comerciais B2B.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={!isValid || isLoading}
                style={{
                  width: "100%", height: 52, borderRadius: 12,
                  background: isValid
                    ? "linear-gradient(135deg, #0ea5e9, #0284c7)"
                    : "rgba(255,255,255,0.06)",
                  color: isValid ? "white" : C.muted,
                  fontWeight: 700, fontSize: 15, border: "none",
                  cursor: isValid ? "pointer" : "not-allowed",
                  fontFamily: "inherit",
                  boxShadow: isValid ? "0 4px 20px rgba(14,165,233,0.3)" : "none",
                  transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.7s linear infinite" }} />
                    Preparando diagnóstico...
                  </>
                ) : (
                  <>
                    Iniciar diagnóstico
                    <ArrowRight style={{ width: 18, height: 18 }} />
                  </>
                )}
              </button>

              <p style={{ textAlign: "center", fontSize: 11, color: C.muted, marginTop: 14, lineHeight: 1.6 }}>
                Ao continuar, você concorda com nossos{" "}
                <a href="#" style={{ color: C.mutedLg, textDecoration: "underline" }}>Termos de Uso</a>{" "}
                e{" "}
                <a href="#" style={{ color: C.mutedLg, textDecoration: "underline" }}>Política de Privacidade</a>.
                Seus dados são protegidos pela LGPD.
              </p>
            </form>

            {/* Trust indicators */}
            <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 24, flexWrap: "wrap" }}>
              {["Gratuito", "8 minutos", "Sem spam"].map((t) => (
                <span key={t} style={{ fontSize: 12, color: C.muted, display: "flex", alignItems: "center", gap: 5 }}>
                  <CheckCircle2 style={{ width: 12, height: 12, color: "#10b981" }} />
                  {t}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
