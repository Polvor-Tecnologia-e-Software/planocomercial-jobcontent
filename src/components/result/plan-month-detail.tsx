"use client";

import {
  BookOpen,
  FileText,
  Filter,
  GraduationCap,
  Handshake,
  LayoutTemplate,
  Megaphone,
  MoreHorizontal,
  Search,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { ContentMockup } from "@/components/result/plan-content-mockup";
import { PlanFrontsMatrix } from "@/components/result/plan-fronts-matrix";
import { PlanLockedTeaser } from "@/components/result/plan-locked-teaser";
import {
  ACTION_TYPE_COLOR,
  ACTION_TYPE_LABEL,
  cadenceChannelsLabel,
  cadenceDayLabel,
} from "@/lib/plan-action-types";
import { buildPlanFronts, PLAN_MONTHS, type PlanPhaseKey } from "@/lib/plan-timeline";
import { cn } from "@/lib/utils";
import type {
  ActionType,
  BlogBrief,
  CadenceBrief,
  CommercialPlan90Days,
  PlanAction,
  PlanPhaseSummaries,
  PlaybookBrief,
} from "@/schemas/commercial-plan";

const ACTION_TYPE_ICON: Record<ActionType, LucideIcon> = {
  content_blog: FileText,
  rich_material: BookOpen,
  landing_page: LayoutTemplate,
  paid_traffic: Megaphone,
  seo: Search,
  sales_process: Handshake,
  sales_training: GraduationCap,
  crm_pipeline: Filter,
  other: MoreHorizontal,
};

/** Degradê por mês — mesma identidade visual usada em outras partes da tela (ver bg-gradient-* em globals.css). */
const MONTH_GRADIENT: Record<PlanPhaseKey, string> = {
  days1to30: "bg-gradient-to-br from-brand-navy-800 to-brand-blue-dark",
  days31to60: "bg-gradient-blue-light",
  days61to90: "bg-gradient-brand-orange",
};

const CONTENT_TYPES = new Set<ActionType>(["content_blog", "rich_material", "landing_page", "paid_traffic"]);

type PlanMonthDetailProps = {
  plan: CommercialPlan90Days;
  phaseSummaries: PlanPhaseSummaries;
  companyName: string;
  /** Domínio real da empresa (já normalizado) — null quando não informou site; o mockup de anúncio some a linha de domínio nesse caso, nunca inventa um. */
  companyWebsite: string | null;
};

/**
 * Ações práticas mês a mês — abas client-side (pedido explícito: "a ideia
 * das abas de blog, material rico mês a mês") trocando qual mês fica em
 * detalhe. Pra cada mês selecionado: as ações comerciais (tudo que não é
 * content_blog/rich_material/landing_page/paid_traffic) num cartão escuro
 * (reaproveita o mesmo ActionCard de antes), e as sugestões de conteúdo e
 * mídia (blog/material rico/landing page/anúncio) num cartão claro, no
 * estilo revista do layout de referência — sempre expandido, sem
 * `<details>`, porque aqui a ideia é mostrar o conteúdo pronto, não
 * esconder atrás de um clique. O anúncio de tráfego pago aparece SEMPRE,
 * pra qualquer objetivo — pedido explícito do usuário — e nunca troca
 * lugar com nem reduz as ações comerciais, as duas coisas são aditivas.
 */
export function PlanMonthDetail({ plan, phaseSummaries, companyName, companyWebsite }: PlanMonthDetailProps) {
  const [selected, setSelected] = useState(0);
  const month = PLAN_MONTHS[selected];
  const actions = plan[month.key];
  const summary = phaseSummaries[month.key];
  const fronts = buildPlanFronts(plan);

  const otherActions = actions.filter((action) => !CONTENT_TYPES.has(action.actionType));
  const blogs = actions.filter(
    (action): action is PlanAction & { blogBrief: BlogBrief } =>
      action.actionType === "content_blog" && action.blogBrief !== null,
  );
  const richMaterial = actions.find(
    (action) => action.actionType === "rich_material" && action.richMaterialBrief !== null,
  );
  const landingPage = actions.find(
    (action) => action.actionType === "landing_page" && action.landingPageBrief !== null,
  );
  const paidTraffic = actions.find(
    (action) => action.actionType === "paid_traffic" && action.paidTrafficBrief !== null,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-brand-navy-900 text-xl font-extrabold">Ações práticas mês a mês</h3>
          <p className="text-muted-foreground mt-1 max-w-xl text-sm">
            Cada aba é um mês: as ações comerciais, e logo abaixo as sugestões de conteúdo e mídia (blog,
            material rico, landing page e anúncio) prontas para produção.
          </p>
        </div>
        <div className="bg-muted flex gap-1.5 self-start rounded-2xl p-1.5">
          {PLAN_MONTHS.map((m, index) => {
            const active = index === selected;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={active}
                aria-label={`Selecionar ${m.tab}`}
                className={cn(
                  "flex min-h-12 flex-col rounded-xl px-4 py-2 text-left transition-colors",
                  active ? "bg-white shadow-card" : "hover:bg-white/60",
                )}
              >
                <span className="text-muted-foreground text-[11px] font-semibold">{m.days}</span>
                <span className="text-[15px] font-extrabold" style={active ? { color: m.color } : undefined}>
                  {m.tab}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="shadow-card flex flex-col gap-4 rounded-xl p-6 text-white sm:flex-row sm:items-center sm:justify-between"
        style={{ backgroundColor: month.color }}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-wide text-white/85 uppercase">
            {month.days} · {month.tab}
          </span>
          <p className="text-xl font-extrabold">{month.name}</p>
          <p className="max-w-xl text-[14px] leading-relaxed text-white/90">{summary.goal}</p>
        </div>
        <div className="min-w-[220px] rounded-lg bg-white/15 px-4 py-3">
          <span className="text-[11px] font-semibold text-white/85 uppercase">Marco de sucesso do mês</span>
          <p className="mt-1 text-[15px] leading-snug font-bold">{summary.milestone}</p>
        </div>
      </div>

      <PlanFrontsMatrix fronts={fronts} selected={selected} onSelect={setSelected} />

      {otherActions.length > 0 ? (
        <div className={cn("shadow-card flex flex-col gap-4 rounded-lg p-6 text-white", MONTH_GRADIENT[month.key])}>
          <div>
            <span className="text-[11px] font-bold tracking-wide text-white/85 uppercase">{month.days}</span>
            <p className="text-[15px] font-extrabold">Ações comerciais</p>
          </div>
          <div className="flex flex-col gap-4 divide-y divide-white/15">
            {otherActions.map((action, index) => (
              <ActionCard key={index} action={action} isFirst={index === 0} />
            ))}
          </div>
        </div>
      ) : null}

      {blogs.length > 0 || richMaterial || landingPage || paidTraffic ? (
        <div className="flex flex-col gap-7 rounded-xl bg-white p-6 shadow-card sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-brand-orange-deep text-[12px] font-bold tracking-wide uppercase">
                {month.tab}
              </span>
              <h4 className="text-brand-navy-900 text-xl font-extrabold">Sugestões de conteúdo</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {blogs.length > 0 ? <CountBadge n={blogs.length} label="posts de blog" tone="orange" /> : null}
              {richMaterial ? <CountBadge n={1} label="material rico" tone="orange" /> : null}
              {paidTraffic ? <CountBadge n={1} label="anúncio" tone="blue" /> : null}
              {landingPage ? <CountBadge n={1} label="landing page" tone="blue" /> : null}
            </div>
          </div>

          {blogs.length > 0 ? <BlogGrid blogs={blogs} /> : null}
          {richMaterial ? <RichMaterialShowcase action={richMaterial} companyName={companyName} /> : null}
          {paidTraffic ? (
            <PaidTrafficShowcase action={paidTraffic} companyName={companyName} companyWebsite={companyWebsite} />
          ) : null}
          {landingPage ? (
            <LandingPageShowcase action={landingPage} companyWebsite={companyWebsite} />
          ) : null}
        </div>
      ) : null}

      <PlanLockedTeaser monthLabel={month.tab} actionsCount={actions.length} />
    </div>
  );
}

function CountBadge({ n, label, tone }: { n: number; label: string; tone: "orange" | "blue" }) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold",
        tone === "orange" ? "bg-[#FDE7D8] text-[#9A3F0B]" : "bg-[#E4EDFB] text-brand-blue-dark",
      )}
    >
      <span className="text-[17px]">{n}</span> {label}
    </span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-muted-foreground text-[11px] font-bold tracking-wide uppercase">{label}</p>
      <p className="mt-0.5 text-[14.5px] leading-relaxed text-[#3A465C]">{children}</p>
    </div>
  );
}

function BlogGrid({ blogs }: { blogs: (PlanAction & { blogBrief: BlogBrief })[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 border-t border-[#E6EAF1] pt-6 md:grid-cols-2">
      {blogs.map((action, index) => (
        <article key={index} className="flex flex-col gap-4 rounded-xl border border-[#E0E5EE] p-6">
          <span className="text-brand-navy-900 text-[12px] font-extrabold tracking-wide">
            BLOG {String(index + 1).padStart(2, "0")}
          </span>
          <h5 className="text-brand-navy-900 text-[18px] leading-snug font-extrabold">{action.title}</h5>
          <Field label="Subtítulo">{action.blogBrief.subtitle}</Field>
          {action.blogBrief.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="flex flex-col gap-1.5 rounded-lg bg-[#F6F8FB] p-4">
              <div className="flex items-start gap-2.5">
                <span className="bg-brand-blue mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[11px] font-extrabold text-white">
                  H2
                </span>
                <span className="text-brand-navy-900 text-[15px] leading-snug font-bold">{section.heading}</span>
              </div>
              <p className="text-[13.5px] leading-relaxed text-[#3A465C]">{section.body}</p>
            </div>
          ))}
        </article>
      ))}
    </div>
  );
}

/**
 * Cabeçalho do bloco de conteúdo com letra fixa — blog A (ainda sem este
 * cabeçalho, cada tipo só ganha o tratamento quando tem seu próprio
 * layout de referência), material rico B, landing page C. O anúncio
 * (PaidTrafficShowcase) não usa esse cabeçalho — o layout de referência
 * dele não tinha letra, só o rótulo "Anúncio para Meta Ads". Ordem fixa
 * porque a cadência do mês sempre traz os 4 tipos (ver
 * CONTENT_CADENCE_BLOCK em commercial-plan-prompt.ts), nunca pula uma
 * letra mesmo que a ordem de exibição na tela não seja a mesma (anúncio
 * aparece entre material rico e landing page).
 */
function ContentSectionHeader({ letter, title }: { letter: string; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="bg-brand-navy-900 flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-extrabold text-white">
        {letter}
      </span>
      <h4 className="text-brand-navy-900 text-lg font-extrabold">{title}</h4>
    </div>
  );
}

function InfoTile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-[#F6F8FB] p-4">
      <p className="text-muted-foreground text-[11px] font-bold tracking-wide uppercase">{label}</p>
      <p className="text-brand-navy-900 text-[15px] font-bold">{children}</p>
    </div>
  );
}

function RichMaterialShowcase({ action, companyName }: { action: PlanAction; companyName: string }) {
  const brief = action.richMaterialBrief!;
  return (
    <div className="flex flex-col gap-5 border-t border-[#E6EAF1] pt-6">
      <ContentSectionHeader letter="B" title="Material rico do mês" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <ContentMockup eyebrow={brief.format} title={action.title} companyName={companyName} />
          <Field label="Ideia visual para o mockup">{brief.coverIdea}</Field>
        </div>
        <div className="flex flex-col gap-4 lg:col-span-3">
          <span className="text-brand-orange-deep text-[12px] font-bold tracking-wide uppercase">
            Material rico · {brief.format}
          </span>
          <h5 className="text-brand-navy-900 text-xl leading-snug font-extrabold">{action.title}</h5>
          <Field label="Subtítulo">{brief.subtitle}</Field>
          <div>
            <p className="text-brand-navy-900 text-[15px] font-bold">O que a pessoa encontrará no material</p>
            <ol className="mt-2.5 flex flex-col gap-2.5">
              {brief.sections.map((section, index) => (
                <li key={index} className="flex gap-3 rounded-lg bg-[#F6F8FB] p-3.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#FDE7D8] text-[13px] font-extrabold text-[#9A3F0B]">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-brand-navy-900 text-[14px] font-bold">{section.title}</p>
                    <p className="mt-0.5 text-[13.5px] text-[#3A465C]">{section.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Simulação do hero da landing page (pedido explícito a partir do
 * layout de referência: "precisa incluir a simulação do hero de cada
 * landing page") — diferente do mockup padrão de material rico
 * (plan-content-mockup.tsx), aqui o formulário real aparece DESENHADO
 * dentro do mockup (hero em 2 colunas: texto + cartão de formulário),
 * porque é exatamente isso que o layout de referência pede para a LP. A
 * barra de endereço mostra o domínio real da empresa (companyWebsite, já
 * normalizado) + a URL sugerida pela IA — some o domínio quando a
 * empresa não informou site, nunca inventa um.
 */
function LandingPageShowcase({
  action,
  companyWebsite,
}: {
  action: PlanAction;
  companyWebsite: string | null;
}) {
  const brief = action.landingPageBrief!;
  const addressBarPath = companyWebsite ? `${companyWebsite}${brief.url}` : brief.url;

  return (
    <div className="flex flex-col gap-5 border-t border-[#E6EAF1] pt-6">
      <ContentSectionHeader letter="C" title="Landing page do mês · sugestão de hero" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <InfoTile label="Landing page">{brief.name}</InfoTile>
        <InfoTile label="URL sugerida">{brief.url}</InfoTile>
        <InfoTile label="Objetivo">{brief.goal}</InfoTile>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E0E5EE]">
        <div className="flex items-center gap-2 bg-[#EEF1F5] px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#C3CBD8]" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-[#C3CBD8]" aria-hidden="true" />
          <span className="size-2.5 rounded-full bg-[#C3CBD8]" aria-hidden="true" />
          <span className="text-muted-foreground ml-2 truncate rounded-md bg-white px-3 py-1 text-xs">
            {addressBarPath}
          </span>
        </div>
        <div className="bg-brand-navy-900 flex flex-col gap-8 p-8 sm:flex-row sm:items-center sm:justify-between lg:p-12">
          <div className="flex max-w-xl flex-col gap-3">
            <span className="text-[11px] font-bold tracking-wide text-[#F59A5E] uppercase">
              Hero · Primeira dobra
            </span>
            <h5 className="text-2xl leading-snug font-extrabold text-white sm:text-3xl">{brief.heroHeadline}</h5>
            <p className="text-[15px] leading-relaxed text-white/80">{brief.heroSubheadline}</p>
          </div>
          <div className="w-full shrink-0 rounded-xl bg-white p-5 sm:max-w-xs">
            <p className="text-muted-foreground text-[11px] font-bold tracking-wide uppercase">
              Campos do formulário
            </p>
            <div className="mt-3 flex flex-col gap-2.5">
              {brief.formFields.map((field, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-[#D5DCE7] px-3.5 py-2.5 text-[13px] text-[#8993A4]"
                >
                  {field}
                </div>
              ))}
            </div>
            <div className="bg-brand-orange-deep mt-3 rounded-lg px-4 py-3 text-center text-[13.5px] font-bold text-white">
              {brief.buttonText}
            </div>
          </div>
        </div>
      </div>

      <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {brief.sections.map((section, index) => (
          <li key={index} className="rounded-lg bg-[#F6F8FB] p-3.5">
            <p className="text-brand-navy-900 text-[14px] font-bold">
              {index + 1}. {section.title}
            </p>
            <p className="mt-0.5 text-[13.5px] text-[#3A465C]">{section.description}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Simulação do anúncio como ele apareceria no feed do Meta Ads — pedido
 * explícito a partir do layout de referência: posicionado logo abaixo do
 * material rico (o anúncio promove a MESMA oferta do material rico do
 * mês, ver CONTENT_CADENCE_BLOCK em commercial-plan-prompt.ts), com o
 * nome real da empresa e a inicial dela no avatar (dado real, nunca
 * inventado) e o domínio real (companyWebsite, já normalizado) — some a
 * linha de domínio quando a empresa não informou site, nunca inventa um.
 */
function PaidTrafficShowcase({
  action,
  companyName,
  companyWebsite,
}: {
  action: PlanAction;
  companyName: string;
  companyWebsite: string | null;
}) {
  const brief = action.paidTrafficBrief!;
  return (
    <div className="grid grid-cols-1 gap-6 border-t border-[#E6EAF1] pt-6 lg:grid-cols-5">
      <div className="flex flex-col gap-3 lg:col-span-2">
        <span className="text-[11px] font-bold tracking-wide text-[#6B7280] uppercase">
          Anúncio para Meta Ads
        </span>
        <div className="overflow-hidden rounded-xl border border-[#E0E5EE] bg-white">
          <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
            <span className="bg-brand-navy-900 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white">
              {companyName.charAt(0).toUpperCase()}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-brand-navy-900 text-[13.5px] font-bold">{companyName}</span>
              <span className="text-muted-foreground text-[11.5px]">Patrocinado</span>
            </div>
          </div>
          <p className="px-4 pb-3 text-[13px] leading-relaxed text-[#3A465C]">{brief.primaryText}</p>
          <div className="bg-brand-navy-900 flex flex-col gap-2.5 px-6 py-14">
            <span aria-hidden="true" className="bg-brand-orange-deep h-[3px] w-9 rounded-full" />
            <p className="text-[21px] leading-snug font-extrabold text-white">{brief.headline}</p>
            <p className="text-[13.5px] leading-relaxed text-white/75">{brief.subheadline}</p>
          </div>
          <div className="flex items-center justify-between gap-3 bg-[#F3F5F8] px-4 py-3">
            <div className="min-w-0">
              {companyWebsite ? (
                <p className="text-muted-foreground truncate text-[11px] font-semibold uppercase">
                  {companyWebsite}
                </p>
              ) : null}
              <p className="text-brand-navy-900 truncate text-[13px] font-bold">{brief.headline}</p>
            </div>
            <span className="shrink-0 rounded-md bg-[#E0E5EE] px-3.5 py-2 text-[13px] font-bold text-[#0B1A33]">
              {brief.ctaText}
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-4 lg:col-span-3">
        <span className="text-[12px] font-bold tracking-wide text-[#C2410C] uppercase">
          Anúncio de tráfego pago
        </span>
        <h5 className="text-brand-navy-900 text-xl leading-snug font-extrabold">{action.title}</h5>
        <Field label="Texto de apoio">{brief.primaryText}</Field>
        <Field label="Headline do criativo">{brief.headline}</Field>
        <Field label="Linha de apoio">{brief.subheadline}</Field>
        <Field label="Botão">{brief.ctaText}</Field>
      </div>
    </div>
  );
}

function ActionTypeBadge({ actionType }: { actionType: ActionType }) {
  const Icon = ACTION_TYPE_ICON[actionType];
  const color = ACTION_TYPE_COLOR[actionType];

  return (
    <span
      className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold"
      style={{ color }}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {ACTION_TYPE_LABEL[actionType]}
    </span>
  );
}

/** Bloco claro dentro do cartão escuro de ações comerciais (cadência, playbook) — sempre aberto, sem clique. */
function CommercialBriefBox({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[10px] bg-white/15 px-3.5 py-3">
      <p className="text-[11px] font-bold tracking-wide text-white/85 uppercase">{title}</p>
      <div className="mt-2.5 flex flex-col gap-2 text-[12.5px] text-white/90">{children}</div>
    </div>
  );
}

/**
 * Cadência de 5 dias — pedido explícito: a ESTRUTURA (canais + objetivo
 * de cada dia, ex.: "Dia 01 · E-mail + WhatsApp"), nunca a copy.
 */
function CadenceBriefDetails({ brief }: { brief: CadenceBrief }) {
  return (
    <CommercialBriefBox title="Cadência de 5 dias">
      <ol className="flex flex-col gap-1.5">
        {brief.days.map((day, index) => (
          <li key={index} className="flex gap-3">
            <span className="w-12 shrink-0 font-extrabold text-white">{cadenceDayLabel(index)}</span>
            <span>
              <b className="font-bold text-white">{cadenceChannelsLabel(day)}</b>
              <span className="text-white/80"> — {day.goal}</span>
            </span>
          </li>
        ))}
      </ol>
    </CommercialBriefBox>
  );
}

/** Passo a passo de como montar o playbook (sales_process) — pedido explícito. */
function PlaybookBriefDetails({ brief }: { brief: PlaybookBrief }) {
  return (
    <CommercialBriefBox title="Como montar o playbook">
      <ol className="flex flex-col gap-2.5">
        {brief.steps.map((step, index) => (
          <li key={index} className="flex gap-2.5">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-extrabold text-[#0B1A33]">
              {index + 1}
            </span>
            <span>
              <b className="block font-bold text-white">{step.title}</b>
              {step.howTo}
            </span>
          </li>
        ))}
      </ol>
      <p className="border-t border-white/20 pt-2">
        <b className="font-bold text-white">Para manter vivo: </b>
        {brief.adoptionTip}
      </p>
    </CommercialBriefBox>
  );
}

function ActionCard({ action, isFirst }: { action: PlanAction; isFirst: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3", !isFirst && "pt-4")}>
      <ActionTypeBadge actionType={action.actionType} />
      <div>
        <h3 className="text-[15.5px] font-extrabold">{action.title}</h3>
        <p className="mt-1 text-[13px] text-white/90">{action.objective}</p>
      </div>
      {action.details.length > 0 ? (
        <ul className="flex flex-col gap-1 text-[12.5px] text-white/90">
          {action.details.map((detail, index) => (
            <li key={index} className="flex gap-1.5">
              <span aria-hidden="true">•</span>
              <span>{detail}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {action.playbookBrief ? <PlaybookBriefDetails brief={action.playbookBrief} /> : null}
      {action.cadenceBrief ? <CadenceBriefDetails brief={action.cadenceBrief} /> : null}
      <div className="flex justify-between text-[11.5px] text-white/85">
        <span>
          Responsável
          <br />
          <b className="text-[12.5px] font-bold text-white">{action.suggestedOwner}</b>
        </span>
        <span>
          Prazo
          <br />
          <b className="text-[12.5px] font-bold text-white">{action.deadline}</b>
        </span>
        <span>
          Indicador
          <br />
          <b className="text-[12.5px] font-bold text-white">{action.indicator}</b>
        </span>
      </div>
      <div className="rounded-[10px] bg-white/15 px-3 py-2.5 text-xs">
        <b className="mb-1 block text-[11px] tracking-wide text-white/85 uppercase">Critério de conclusão</b>
        {action.completionCriteria}
      </div>
    </div>
  );
}
