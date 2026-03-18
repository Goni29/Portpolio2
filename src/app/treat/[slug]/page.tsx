import { notFound } from "next/navigation";
import SubHero from "@/components/SubHero";
import SubPageWrapper from "@/components/SubPageWrapper";

const menuItems = [
  { label: "치아교정", slug: "treat/ortho" },
  { label: "임플란트", slug: "treat/implant" },
  { label: "신경치료", slug: "treat/endo" },
  { label: "충치치료", slug: "treat/caries" },
  { label: "사랑니발치", slug: "treat/wisdom" },
];

interface TreatData {
  title: string;
  process_img: string;
  process_card_title: string;
  process_kicker: string;
  process_title: string;
  process_sub: string;
  cards: { idx: string; title: string; desc: string }[];
  note_title: string;
  note_list: string[];
  cta_title: string;
  cta_sub: string;
}

const TREAT_PAGES: Record<string, TreatData> = {
  ortho: {
    title: "치아교정",
    process_img: "img/treat1.webp",
    process_card_title: "치아교정 진행과정",
    process_kicker: "PROCESS",
    process_title: "치아교정 진행과정",
    process_sub: "상담부터 유지장치까지, 단계별로 꼼꼼하게 진행합니다.",
    cards: [
      { idx: "01", title: "정밀 상담 및 진단", desc: "구강검사·문진을 통해 현재 상태와 목표를 함께 설정합니다." },
      { idx: "02", title: "맞춤 치료계획", desc: "진단 데이터를 기반으로 기간·장치·관리 포인트를 안내합니다." },
      { idx: "03", title: "장치 부착 및 조정", desc: "정기 내원으로 교정력을 조절하고 변화를 체크합니다." },
      { idx: "04", title: "유지관리", desc: "치료 후 유지장치로 재발을 예방하고 안정화를 돕습니다." },
    ],
    note_title: "안내사항",
    note_list: [
      "개인 상태에 따라 치료기간과 계획은 달라질 수 있습니다.",
      "정기 내원과 위생 관리가 결과에 큰 영향을 줍니다.",
      "통증/불편감은 초기 2~3일 내 완화되는 경우가 많습니다.",
    ],
    cta_title: "상담으로 정확히 확인해보세요.",
    cta_sub: "비용/기간/방법을 맞춤 안내해드립니다.",
  },
  implant: {
    title: "임플란트",
    process_img: "img/treat2.webp",
    process_card_title: "임플란트 진행과정",
    process_kicker: "PROCESS",
    process_title: "임플란트 진행과정",
    process_sub: "진단부터 보철까지 체계적으로 진행합니다.",
    cards: [
      { idx: "01", title: "정밀 진단", desc: "CT·구강검사로 잇몸뼈 상태와 식립 가능 여부를 확인합니다." },
      { idx: "02", title: "식립 계획", desc: "안전한 위치·각도·깊이를 계획하고 안내합니다." },
      { idx: "03", title: "식립 및 회복", desc: "식립 후 회복 기간 동안 안정화를 기다립니다." },
      { idx: "04", title: "보철 장착", desc: "개인 교합에 맞춘 보철을 제작·장착합니다." },
    ],
    note_title: "안내사항",
    note_list: [
      "전신질환/복용약에 따라 치료가 달라질 수 있습니다.",
      "흡연은 치유를 방해할 수 있어 금연을 권장합니다.",
      "식립 후 정기검진으로 장기 유지에 도움을 줍니다.",
    ],
    cta_title: "임플란트, 정확한 진단이 먼저입니다.",
    cta_sub: "CT 기반으로 안전하게 안내해드립니다.",
  },
  endo: {
    title: "신경치료",
    process_img: "img/treat3.webp",
    process_card_title: "신경치료 진행과정",
    process_kicker: "PROCESS",
    process_title: "신경치료 진행과정",
    process_sub: "통증의 원인을 정확히 찾아 단계적으로 치료합니다.",
    cards: [
      { idx: "01", title: "원인 진단", desc: "통증/염증 부위를 확인하고 치료 범위를 결정합니다." },
      { idx: "02", title: "신경 제거 및 소독", desc: "감염된 신경을 제거하고 근관을 세척·소독합니다." },
      { idx: "03", title: "근관 충전", desc: "재감염을 막기 위해 내부를 밀봉합니다." },
      { idx: "04", title: "보강 및 마무리", desc: "필요 시 크라운 등으로 치아를 보호합니다." },
    ],
    note_title: "안내사항",
    note_list: [
      "치료 후 일시적 통증이 있을 수 있습니다.",
      "치아가 약해질 수 있어 보강치료가 필요할 수 있습니다.",
      "증상이 지속되면 내원하여 확인이 필요합니다.",
    ],
    cta_title: "통증이 있다면 빠르게 진단하세요.",
    cta_sub: "치아를 살릴 수 있는 골든타임이 있습니다.",
  },
  caries: {
    title: "충치치료",
    process_img: "img/treat4.webp",
    process_card_title: "충치치료 진행과정",
    process_kicker: "PROCESS",
    process_title: "충치치료 진행과정",
    process_sub: "상태에 따라 적절한 재료와 방법으로 치료합니다.",
    cards: [
      { idx: "01", title: "충치 범위 확인", desc: "검사로 진행 정도를 확인하고 치료 범위를 정합니다." },
      { idx: "02", title: "우식 제거", desc: "충치 부위를 제거하고 건강한 치질을 보존합니다." },
      { idx: "03", title: "수복 치료", desc: "레진/인레이 등으로 형태와 기능을 회복합니다." },
      { idx: "04", title: "관리 안내", desc: "재발 방지를 위해 칫솔질·생활습관을 안내합니다." },
    ],
    note_title: "안내사항",
    note_list: [
      "초기 충치는 통증이 없을 수 있습니다.",
      "단 음식/탄산은 치아 건강에 영향을 줄 수 있습니다.",
      "정기검진으로 조기 발견이 중요합니다.",
    ],
    cta_title: "충치, 방치하지 마세요.",
    cta_sub: "간단한 치료로 끝낼 수 있습니다.",
  },
  wisdom: {
    title: "사랑니발치",
    process_img: "img/treat5.webp",
    process_card_title: "사랑니 발치 진행과정",
    process_kicker: "PROCESS",
    process_title: "사랑니 발치 진행과정",
    process_sub: "진단부터 회복까지 꼼꼼히 안내합니다.",
    cards: [
      { idx: "01", title: "정밀 검사", desc: "X-ray/CT로 매복 정도와 신경 위치를 확인합니다." },
      { idx: "02", title: "발치 계획", desc: "난이도에 따라 발치 방법과 주의사항을 안내합니다." },
      { idx: "03", title: "발치 및 지혈", desc: "안전하게 발치 후 지혈·처치를 진행합니다." },
      { idx: "04", title: "회복 관리", desc: "부기/통증 관리와 식이·생활 주의사항을 안내합니다." },
    ],
    note_title: "안내사항",
    note_list: [
      "발치 후 2~3일은 무리한 운동/음주를 피해주세요.",
      "지혈 거즈는 안내 시간만큼 유지해주세요.",
      "심한 통증/출혈/열이 지속되면 내원해주세요.",
    ],
    cta_title: "난이도는 진단 후 정확히 알 수 있어요.",
    cta_sub: "CT 기반으로 안전하게 안내해드립니다.",
  },
};

export function generateStaticParams() {
  return Object.keys(TREAT_PAGES).map((slug) => ({ slug }));
}

export default async function TreatDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = TREAT_PAGES[slug];

  if (!t) {
    notFound();
  }

  return (
    <SubPageWrapper>
      <SubHero
        title={t.title}
        menuTitle="치료"
        activeSlug={`treat/${slug}`}
        menuItems={menuItems}
      />

      {/* PROCESS (OVERLAP) */}
      <section className="sec treat-process-overlap">
        <div className="container">
          <div className="treat-block-head">
            <div className="treat-block-kicker">{t.process_kicker}</div>
            <h3 className="treat-h3">{t.process_title}</h3>
            <p className="treat-sub">{t.process_sub}</p>
          </div>

          <div className="treat-overlap-stage">
            <div className="treat-overlap-bg">
              <img
                src={`/${t.process_img}`}
                alt={`${t.title} 프로세스 배경 이미지`}
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="treat-overlap-card">
              <div className="treat-overlap-card-title">
                {t.process_card_title}
              </div>

              <div className="treat-grid treat-grid--overlap">
                {t.cards.map((c, idx) => (
                  <div className="treat-card treat-card--overlap" key={idx}>
                    <div className="treat-card-top">
                      <div className="treat-card-idx">{c.idx}</div>
                      <div className="treat-card-title">{c.title}</div>
                    </div>
                    <div className="treat-card-desc">{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SubPageWrapper>
  );
}
