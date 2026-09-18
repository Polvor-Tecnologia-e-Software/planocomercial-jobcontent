import {
  BookOpen,
  FileText,
  Filter,
  GraduationCap,
  Handshake,
  Megaphone,
  MoreHorizontal,
  Search,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { ACTION_TYPE_COLOR, ACTION_TYPE_LABEL } from "@/lib/plan-action-types";
import { cn } from "@/lib/utils";
import type {
  ActionType,
  BlogBrief,
  CadenceBrief,
  CommercialPlan90Days,
  PaidTrafficBrief,
  PlanAction,
  RichMaterialBrief,
} from "@/schemas/commercial-plan";

const ACTION_TYPE_ICON: Record<ActionType, LucideIcon> = {
  content_blog: FileText,
  rich_material: BookOpen,
  paid_traffic: Megaphone,
  seo: Search,
  sales_process: Handshake,
  sales_training: GraduationCap,
  crm_pipeline: Filter,
  other: MoreHorizontal,
};

type Plan90DaysSectionProps = {
  plan: CommercialPlan90Days;
};

const PHASES: {
  key: keyof CommercialPlan90Days;
  range: string;
  label: string;
  gradient: string;
}[] = [
  {
    key: "days1to30",
    range: "Dias 1–30",
    label: "Corrigir / Estruturar",
    gradient: "bg-gradient-to-br from-brand-navy-800 to-brand-blue-dark",
  },
  {
    key: "days31to60",
    range: "Dias 31–60",
    label: "Validar / Ativar",
    gradient: "bg-gradient-blue-light",
  },
  {
    key: "days61to90",
    range: "Dias 61–90",
    label: "Escalar / Otimizar",
    gradient: "bg-gradient-brand-orange",
  },
];

/**
 * Seção 5 (BRD): as 3 fases em grid — `grid-cols-1` empilha no mobile,
 * `lg:grid-cols-3` vira colunas lado a lado no desktop. Sem Tabs/JS:
 * puro CSS resolve o requisito de "uma fase abaixo da outra" no celular.
 * Cada fase é um cartão em degradê (identidade visual); quando a fase
 * tem mais de uma ação, elas empilham dentro do mesmo cartão, separadas
 * por uma linha divisória sutil.
 */
export function Plan90DaysSection({ plan }: Plan90DaysSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-brand-navy-900 text-2xl font-extrabold">Plano de 90 dias</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {PHASES.map((phase) => (
          <div
            key={phase.key}
            className={cn("shadow-card flex flex-col gap-4 rounded-lg p-6 text-white", phase.gradient)}
          >
            <div>
              <span className="text-[11px] font-bold tracking-wide text-white/85 uppercase">
                {phase.range}
              </span>
              <p className="text-[15px] font-extrabold">{phase.label}</p>
            </div>
            <div className="flex flex-col gap-4 divide-y divide-white/15">
              {plan[phase.key].map((action, index) => (
                <ActionCard key={`${phase.key}-${index}`} action={action} isFirst={index === 0} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
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

/**
 * Desenvolvimento completo de blog/material rico/anúncio — bem mais longo
 * que os bullets de `details` (pedido explícito: as ideias precisavam vir
 * quase prontas pra produção, não só o título). Fica atrás de um
 * `<details>` nativo (sem estado/JS, sem depender de um componente de
 * accordion que este projeto não tem) pra não inflar a altura do card por
 * padrão — quem quiser o brief completo expande.
 */
function ContentBriefDisclosure({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="rounded-[10px] bg-white/15 px-3 py-2.5 text-xs open:bg-white/[0.18]">
      <summary className="cursor-pointer text-[11px] font-bold tracking-wide text-white/85 uppercase">
        {summary}
      </summary>
      <div className="mt-2.5 flex flex-col gap-2.5 text-[12.5px] text-white/90">{children}</div>
    </details>
  );
}

function BlogBriefDetails({ brief }: { brief: BlogBrief }) {
  return (
    <ContentBriefDisclosure summary="Ver desenvolvimento completo do post">
      <p className="italic text-white/85">{brief.subtitle}</p>
      {brief.sections.map((section, index) => (
        <div key={index}>
          <p className="font-bold text-white">{section.heading}</p>
          <p className="mt-0.5">{section.body}</p>
        </div>
      ))}
    </ContentBriefDisclosure>
  );
}

function RichMaterialBriefDetails({ brief }: { brief: RichMaterialBrief }) {
  return (
    <ContentBriefDisclosure summary={`Ver sumário completo do material (${brief.format})`}>
      <p className="italic text-white/85">{brief.subtitle}</p>
      <ol className="flex flex-col gap-1.5">
        {brief.sections.map((section, index) => (
          <li key={index}>
            <span className="font-bold text-white">
              {index + 1}. {section.title}
            </span>
            <p className="mt-0.5">{section.description}</p>
          </li>
        ))}
      </ol>
      <div>
        <p className="text-[11px] font-bold tracking-wide text-white/85 uppercase">Ideia de capa</p>
        <p className="mt-0.5">{brief.coverIdea}</p>
      </div>
    </ContentBriefDisclosure>
  );
}

function PaidTrafficBriefDetails({ brief }: { brief: PaidTrafficBrief }) {
  return (
    <ContentBriefDisclosure summary="Ver copy completo do anúncio">
      <div>
        <p className="font-bold text-white">{brief.headline}</p>
        <p className="mt-0.5">{brief.subheadline}</p>
      </div>
    </ContentBriefDisclosure>
  );
}

function CadenceBriefDetails({ brief }: { brief: CadenceBrief }) {
  return (
    <ContentBriefDisclosure summary="Ver copy completo da cadência">
      {brief.touchpoints.map((touchpoint, index) => (
        <div key={index}>
          <p className="font-bold text-white">
            {touchpoint.moment} · {touchpoint.channel}
          </p>
          <p className="mt-0.5">{touchpoint.copy}</p>
        </div>
      ))}
    </ContentBriefDisclosure>
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
      {action.blogBrief ? <BlogBriefDetails brief={action.blogBrief} /> : null}
      {action.richMaterialBrief ? <RichMaterialBriefDetails brief={action.richMaterialBrief} /> : null}
      {action.paidTrafficBrief ? <PaidTrafficBriefDetails brief={action.paidTrafficBrief} /> : null}
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
        <b className="mb-1 block text-[11px] tracking-wide text-white/85 uppercase">
          Critério de conclusão
        </b>
        {action.completionCriteria}
      </div>
    </div>
  );
}
