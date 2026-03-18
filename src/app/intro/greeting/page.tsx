import SubHero from "@/components/SubHero";
import SubPageWrapper from "@/components/SubPageWrapper";

const menuItems = [
  { label: "인사말", slug: "intro/greeting" },
  { label: "의료진소개", slug: "intro/staff" },
];

export default function GreetingPage() {
  return (
    <SubPageWrapper>
      <SubHero
        title="인사말"
        menuTitle="병원소개"
        activeSlug="intro/greeting"
        menuItems={menuItems}
      />

      {/* TOP VISUAL */}
      <section className="greet-hero fullbleed reveal">
        <div
          className="greet-hero-img"
          style={{ backgroundImage: "url('/img/clinic.webp')" }}
        ></div>
      </section>

      {/* CONTENT CARD */}
      <section className="greet-card-wrap sec reveal">
        <div className="container">
          <div className="greet-card">
            <div className="greet-head">
              <div className="page-kicker">INTRO · GREETING</div>
              <h1 className="page-title">병원 인사말</h1>
              <p className="page-sub">
                정확한 진단과 정직한 설명으로 신뢰를 드립니다.
              </p>
            </div>

            <div className="greet-steps">
              {/* STEP 01 */}
              <div className="greet-step reveal">
                <div className="greet-ico">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
                    <path
                      d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.6-7 10-7 10Z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <path
                      d="M12 9v5M9.5 11.5h5"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="greet-textbox">
                  <div className="greet-step-kicker">STEP 01</div>
                  <div className="greet-step-title">과잉진료 없는 정직한 진료</div>
                  <div className="greet-step-desc">
                    꼭 필요한 치료만 제안하고, 과정과 비용을 투명하게 안내합니다.
                  </div>
                </div>
              </div>

              <div className="greet-divider"></div>

              {/* STEP 02 */}
              <div className="greet-step reveal">
                <div className="greet-ico">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
                    <path
                      d="M12 2s7 6 7 13a7 7 0 0 1-14 0C5 8 12 2 12 2Z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <path
                      d="M12 11v4M10 13h4"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="greet-textbox">
                  <div className="greet-step-kicker">STEP 02</div>
                  <div className="greet-step-title">안전한 진료 환경</div>
                  <div className="greet-step-desc">
                    철저한 위생 관리와 체계적인 동선으로 안전한 진료를 제공합니다.
                  </div>
                </div>
              </div>

              <div className="greet-divider"></div>

              {/* STEP 03 */}
              <div className="greet-step reveal">
                <div className="greet-ico">
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden="true">
                    <path
                      d="M6 20v-1a6 6 0 0 1 12 0v1"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                    />
                    <path
                      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    />
                    <path
                      d="M9.8 8h4.4"
                      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="greet-textbox">
                  <div className="greet-step-kicker">STEP 03</div>
                  <div className="greet-step-title">진심 있는 소통</div>
                  <div className="greet-step-desc">
                    환자분이 이해하고 선택할 수 있도록 쉽고 친절하게 설명합니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SubPageWrapper>
  );
}
