"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Download, X, CheckCircle2, Mail, Phone, Briefcase, Globe, Shield, Loader2, ExternalLink } from "lucide-react";
import type { ScoreEngineOutput } from "@/services/score-engine";
import type { GrowthPlan } from "@/services/ai/types";
import { useDeliver } from "@/hooks/useDeliver";
import { T } from "./tokens";

const schema = z.object({
  phone:     z.string().max(20).optional(),
  job_title: z.string().max(100).optional(),
  website:   z.string().max(200).optional(),
  lgpd:      z.literal(true, { message: "Você deve aceitar para continuar" }),
});

type FormData = z.infer<typeof schema>;

interface DeliveryModalProps {
  isOpen:      boolean;
  onClose:     () => void;
  engine:      ScoreEngineOutput;
  plan:        GrowthPlan;
  companyName: string;
  email:       string;
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 44, borderRadius: 10,
  border: `1.5px solid ${T.border}`,
  background: T.bgInput,
  padding: "0 14px 0 40px",
  fontSize: 13, color: T.text,
  outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

function Field({
  label, icon: Icon, error, children,
}: { label: string; icon: React.ElementType; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, marginBottom: 6, color: "hsl(210 40% 82%)" }}>
        <Icon style={{ width: 13, height: 13, color: T.brand }} />
        {label}
      </label>
      {children}
      {error && <p style={{ fontSize: 11, color: T.red, marginTop: 4 }}>{error}</p>}
    </div>
  );
}

export function DeliveryModal({ isOpen, onClose, engine, plan, companyName, email }: DeliveryModalProps) {
  const { status, result, error, step, deliver, reset } = useDeliver();

  const { register, handleSubmit, formState: { errors, isValid } } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
  });

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  async function onSubmit(data: FormData) {
    await deliver(
      { phone: data.phone ?? "", job_title: data.job_title ?? "", website: data.website ?? "", lgpd: data.lgpd },
      engine, plan, companyName, email,
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, backdropFilter: "blur(4px)" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed", zIndex: 101,
              top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              width: "min(480px, calc(100vw - 32px))",
              maxHeight: "90vh", overflowY: "auto",
              background: "hsl(222 47% 8%)",
              border: `1px solid ${T.borderMid}`,
              borderRadius: 20,
            }}
          >
            {/* Top accent */}
            <div style={{ height: 3, borderRadius: "20px 20px 0 0", background: "linear-gradient(to right, #0ea5e9, #10b981)" }} />

            <div style={{ padding: "24px 28px" }}>

              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 11, background: "linear-gradient(135deg, #0ea5e9, #0284c7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Download style={{ width: 18, height: 18, color: "white" }} />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: T.fontDisplay, fontSize: 17, fontWeight: 800 }}>Receber plano completo</h2>
                    <p style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>PDF executivo + envio por email</p>
                  </div>
                </div>
                <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.muted, padding: 4 }}>
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              {/* ── Done state ── */}
              {status === "done" && result && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: `${T.emerald}15`, border: `1px solid ${T.emerald}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <CheckCircle2 style={{ width: 28, height: 28, color: T.emerald }} />
                  </div>
                  <h3 style={{ fontFamily: T.fontDisplay, fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Plano enviado com sucesso!</h3>
                  <p style={{ fontSize: 13, color: T.mutedLg, lineHeight: 1.7, marginBottom: 20 }}>
                    Enviamos o plano para <strong style={{ color: T.text }}>{email}</strong>.
                    {result.rd_success && " Também registramos no seu CRM."}
                  </p>

                  {result.pdf_url && (
                    <a
                      href={result.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "12px 24px", borderRadius: 10,
                        background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
                        color: "white", fontWeight: 700, fontSize: 14,
                        textDecoration: "none", marginBottom: 12,
                        boxShadow: "0 4px 16px rgba(14,165,233,0.35)",
                      }}
                    >
                      <Download style={{ width: 16, height: 16 }} />
                      Baixar PDF agora
                      <ExternalLink style={{ width: 12, height: 12, opacity: 0.7 }} />
                    </a>
                  )}

                  {result.mocked && (
                    <p style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>
                      ⚠️ Supabase não configurado — PDF gerado localmente (sem URL pública)
                    </p>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
                    {[
                      `${result.file_size_kb}KB`,
                      result.rd_success ? "CRM atualizado" : "CRM pendente",
                      "LGPD registrado",
                    ].map((t) => (
                      <span key={t} style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
                        <CheckCircle2 style={{ width: 10, height: 10, color: T.emerald }} /> {t}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Generating state ── */}
              {status === "generating" && (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <Loader2 style={{ width: 36, height: 36, color: T.brand, margin: "0 auto 16px", animation: "spin 1s linear infinite" }} />
                  <p style={{ fontSize: 14, color: T.mutedLg }}>{step}</p>
                  <p style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>Isso leva alguns segundos...</p>
                </div>
              )}

              {/* ── Form ── */}
              {(status === "idle" || status === "error") && (
                <form onSubmit={handleSubmit(onSubmit)}>
                  {/* Pre-filled info */}
                  <div style={{ padding: "10px 14px", borderRadius: 10, background: T.bgCard, border: `1px solid ${T.border}`, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
                    <Mail style={{ width: 14, height: 14, color: T.brand, flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 11, color: T.muted }}>Enviando para</p>
                      <p style={{ fontSize: 13, fontWeight: 600 }}>{email} · {companyName}</p>
                    </div>
                  </div>

                  <Field label="Telefone (opcional)" icon={Phone} error={errors.phone?.message}>
                    <div style={{ position: "relative" }}>
                      <Phone style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: T.muted }} />
                      <input {...register("phone")} type="tel" placeholder="+55 (11) 99999-0000" style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = T.brand + "80"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = T.border; }} />
                    </div>
                  </Field>

                  <Field label="Cargo (opcional)" icon={Briefcase} error={errors.job_title?.message}>
                    <div style={{ position: "relative" }}>
                      <Briefcase style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: T.muted }} />
                      <input {...register("job_title")} type="text" placeholder="CEO, Diretor Comercial, SDR..." style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = T.brand + "80"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = T.border; }} />
                    </div>
                  </Field>

                  <Field label="Site da empresa (opcional)" icon={Globe} error={errors.website?.message}>
                    <div style={{ position: "relative" }}>
                      <Globe style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: T.muted }} />
                      <input {...register("website")} type="text" placeholder="https://empresa.com.br" style={inputStyle}
                        onFocus={(e) => { e.currentTarget.style.borderColor = T.brand + "80"; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = T.border; }} />
                    </div>
                  </Field>

                  {/* LGPD */}
                  <div style={{ padding: "12px 14px", borderRadius: 10, background: `${T.brand}07`, border: `1px solid ${T.brand}20`, marginBottom: 18 }}>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                      <input {...register("lgpd")} type="checkbox" style={{ width: 16, height: 16, marginTop: 1, accentColor: T.brand, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: T.mutedLg, lineHeight: 1.6 }}>
                        Autorizo o uso dos meus dados para envio do plano comercial e contato via email/WhatsApp, conforme a{" "}
                        <a href="#" style={{ color: T.brandLight }}>Política de Privacidade</a>.
                        Posso revogar a qualquer momento.
                      </span>
                    </label>
                    {errors.lgpd && <p style={{ fontSize: 11, color: T.red, marginTop: 6 }}>{errors.lgpd.message}</p>}
                  </div>

                  {/* Error */}
                  {status === "error" && error && (
                    <div style={{ padding: "10px 14px", borderRadius: 10, background: `${T.red}0a`, border: `1px solid ${T.red}25`, marginBottom: 14 }}>
                      <p style={{ fontSize: 12, color: T.redLt }}>⚠️ {error}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!isValid}
                    style={{
                      width: "100%", height: 48, borderRadius: 11,
                      background: isValid ? "linear-gradient(135deg, #0ea5e9, #0284c7)" : "rgba(255,255,255,0.06)",
                      color: isValid ? "white" : T.muted,
                      fontWeight: 700, fontSize: 15, border: "none",
                      cursor: isValid ? "pointer" : "not-allowed",
                      fontFamily: "inherit",
                      boxShadow: isValid ? "0 4px 18px rgba(14,165,233,0.35)" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 0.2s",
                    }}
                  >
                    <Download style={{ width: 16, height: 16 }} />
                    Gerar PDF e receber por email
                  </button>

                  <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
                    {["Dados criptografados", "Sem spam", "LGPD compliant"].map((t) => (
                      <span key={t} style={{ fontSize: 11, color: T.muted, display: "flex", alignItems: "center", gap: 4 }}>
                        <Shield style={{ width: 10, height: 10 }} /> {t}
                      </span>
                    ))}
                  </div>
                </form>
              )}
            </div>
          </motion.div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </>
      )}
    </AnimatePresence>
  );
}
