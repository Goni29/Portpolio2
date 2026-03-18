import SubHero from "@/components/SubHero";
import SubPageWrapper from "@/components/SubPageWrapper";

const menuItems = [
  { label: "인사말", slug: "intro/greeting" },
  { label: "의료진소개", slug: "intro/staff" },
];

export default function StaffPage() {
  return (
    <SubPageWrapper>
      <SubHero
        title="의료진소개"
        menuTitle="병원소개"
        activeSlug="intro/staff"
        menuItems={menuItems}
      />

      <section className="sec no-top reveal">
        <div className="container">
          <div className="staff-grid reveal-stagger"></div>
        </div>
      </section>

      {/* DOCTOR LIST */}
      <section className="sec reveal staff-list-sec">
        <div className="container">
          <div className="staff-grid reveal-stagger">
            {/* Doctor 1 */}
            <a className="staff-card" href="#doc-kimport">
              <div className="staff-photo">
                <img src="/img/doctor1.webp" alt="대표원장 김포트" loading="lazy" decoding="async" />
              </div>
              <div className="staff-body">
                <div className="staff-role">대표원장</div>
                <div className="staff-name">김포트 원장</div>
                <div className="staff-dept">통합치의학과 · 교정/임플란트</div>
                <div className="staff-tags">
                  <span>#정밀진단</span><span>#맞춤진료</span><span>#사후관리</span>
                </div>
              </div>
            </a>

            {/* Doctor 2 */}
            <a className="staff-card" href="#doc-kimdoctor">
              <div className="staff-photo">
                <img src="/img/doctor2.webp" alt="원장 김의사" loading="lazy" decoding="async" />
              </div>
              <div className="staff-body">
                <div className="staff-role">원장</div>
                <div className="staff-name">김의사 원장</div>
                <div className="staff-dept">통합치의학과 · 보철/보존</div>
                <div className="staff-tags">
                  <span>#보존치료</span><span>#통증완화</span><span>#꼼꼼한상담</span>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* DETAIL: Doctor 1 */}
      <section className="sec reveal" id="doc-kimport">
        <div className="container">
          <div className="staff-detail">
            <div className="staff-detail-left">
              <div className="staff-detail-photo">
                <img src="/img/doctor1.webp" alt="대표원장 김포트" loading="lazy" decoding="async" />
              </div>
            </div>
            <div className="staff-detail-right">
              <div className="detail-head">
                <div className="doctor3-role">대표원장</div>
                <div className="doctor3-name">김포트 원장</div>
                <div className="doctor3-dept">통합치의학과 · 교정/임플란트</div>
              </div>
              <div className="detail-block">
                <h3 className="detail-title">진료 철학</h3>
                <p className="detail-text">
                  환자 중심의 설명과 정밀 진단을 바탕으로, 꼭 필요한 치료만 투명하게 안내드립니다.
                  치료 이후까지 고려한 장기 플랜을 제시합니다.
                </p>
              </div>
              <div className="detail-block">
                <h3 className="detail-title">주요 진료</h3>
                <ul className="detail-list">
                  <li>교정 상담 및 맞춤 교정 계획 수립</li>
                  <li>임플란트 정밀 진단(CT 기반) 및 수술 플랜</li>
                  <li>복합 케이스 협진 및 사후관리</li>
                </ul>
              </div>
              <div className="detail-block">
                <h3 className="detail-title">약력</h3>
                <ul className="detail-list">
                  <li>○○대학교 치의학과 졸업</li>
                  <li>통합치의학과 전문과정 수료</li>
                  <li>임플란트/교정 심화 과정 수료</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DETAIL: Doctor 2 */}
      <section className="sec reveal" id="doc-kimdoctor">
        <div className="container">
          <div className="staff-detail">
            <div className="staff-detail-left">
              <div className="staff-detail-photo">
                <img src="/img/doctor2.webp" alt="원장 김의사" loading="lazy" decoding="async" />
              </div>
            </div>
            <div className="staff-detail-right">
              <div className="detail-head">
                <div className="doctor3-role">원장</div>
                <div className="doctor3-name">김의사 원장</div>
                <div className="doctor3-dept">통합치의학과 · 보철/보존</div>
              </div>
              <div className="detail-block">
                <h3 className="detail-title">진료 철학</h3>
                <p className="detail-text">
                  통증을 줄이고 치아를 최대한 보존하는 치료를 우선합니다.
                  환자분이 이해할 수 있도록 쉬운 언어로 설명합니다.
                </p>
              </div>
              <div className="detail-block">
                <h3 className="detail-title">주요 진료</h3>
                <ul className="detail-list">
                  <li>충치/신경치료(보존 중심)</li>
                  <li>보철 치료(크라운/브릿지 등) 플랜</li>
                  <li>치료 후 유지관리 및 예방관리</li>
                </ul>
              </div>
              <div className="detail-block">
                <h3 className="detail-title">약력</h3>
                <ul className="detail-list">
                  <li>○○대학교 치의학과 졸업</li>
                  <li>보존/보철 임상 과정 수료</li>
                  <li>심미 보철 세미나 수료</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SubPageWrapper>
  );
}
