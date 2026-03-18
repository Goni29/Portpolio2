import Script from "next/script";

const noticePreview = [
  { id: 1, title: "2026년 설 연휴 진료 안내", created_at: "2026-01-20" },
  { id: 2, title: "3월 진료시간 변경 안내", created_at: "2026-02-28" },
  { id: 3, title: "신규 장비 도입 안내", created_at: "2026-03-05" },
];

const newsPreview = [
  { id: 1, title: "포트폴리오병원 확장 이전 안내", created_at: "2026-02-15", image_url: "/img/news1.webp" },
  { id: 2, title: "봄맞이 스케일링 이벤트", created_at: "2026-03-01", image_url: "/img/news2.webp" },
  { id: 3, title: "어린이 불소도포 무료 이벤트", created_at: "2026-03-10", image_url: "/img/news3.webp" },
];

export default function Home() {
  return (
    <>
      <Script
        id="set-body-class-home"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `document.body.classList.add('page-home');document.body.classList.remove('page-sub');`,
        }}
      />

      {/* HERO */}
      <section className="hero-wrap">
        <div
          id="heroCarousel"
          className="carousel slide hero-card"
          data-bs-ride="carousel"
          data-bs-pause="false"
        >
          <div className="carousel-inner">
            <div className="carousel-item active">
              <div
                className="hero-slide"
                style={{ backgroundImage: "url('/img/hero1.webp')" }}
              >
                <div className="hero-overlay"></div>
                <div className="hero-content">
                  <div className="hero-badge">PORTFOLIO HOSPITAL</div>
                  <h1 className="hero-title hero-title--single">
                    정확한 진단
                    <br className="m-br" /> 편안한 치료
                  </h1>
                  <p className="hero-lead">
                    환자 중심 진료와 체계적인 프로세스로
                    <br className="m-br" /> 신뢰를 드립니다.
                  </p>
                  <div className="hero-cta">
                    <a
                      className="hero-link hero-link--primary"
                      href="/reserve/calendar"
                    >
                      달력예약
                    </a>
                    <a className="hero-link" href="/guide/directions">
                      오시는길
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="carousel-item">
              <div
                className="hero-slide"
                style={{ backgroundImage: "url('/img/hero2.webp')" }}
              >
                <div className="hero-overlay"></div>
                <div className="hero-content">
                  <div className="hero-badge">DENTAL CARE</div>
                  <h2 className="hero-title hero-title--single">
                    불필요한 치료 없이
                    <br className="m-br" /> 꼭 필요한 치료만
                  </h2>
                  <p className="hero-lead">
                    상담 &gt; 정밀진단 &gt; 치료 &gt; 사후관리까지
                    <br className="m-br" /> 투명하게 안내합니다.
                  </p>
                  <div className="hero-cta">
                    <a
                      className="hero-link hero-link--primary"
                      href="/reserve/consult"
                    >
                      온라인 상담
                    </a>
                    <a className="hero-link" href="/intro/staff">
                      의료진 소개
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-controls">
            <button
              className="btn hero-nav"
              type="button"
              data-bs-target="#heroCarousel"
              data-bs-slide="prev"
            >
              &#8249;
            </button>
            <div className="hero-indicators">
              <button
                type="button"
                data-bs-target="#heroCarousel"
                data-bs-slide-to="0"
                className="active"
              ></button>
              <button
                type="button"
                data-bs-target="#heroCarousel"
                data-bs-slide-to="1"
              ></button>
            </div>
            <button
              className="btn hero-nav"
              type="button"
              data-bs-target="#heroCarousel"
              data-bs-slide="next"
            >
              &#8250;
            </button>
          </div>
        </div>
      </section>

      <div className="hero-scroll-hint" aria-hidden="true">
        <span className="hero-scroll-icon">
          <span className="hero-scroll-dot"></span>
        </span>
        <span className="hero-scroll-text">SCROLL</span>
      </div>

      {/* Statement */}
      <section className="statement fullbleed sec reveal">
        <div className="full-content">
          <h2 className="statement-title">
            환자마다 다른 고민,
            <br className="d-md-none" /> 맞춤 솔루션으로 해결합니다.
          </h2>
          <p className="statement-sub">
            정확한 진단과 섬세한 치료로 자연치아를 지켜드립니다.
          </p>
        </div>
      </section>

      {/* Treatment */}
      <section className="treat2-wrap sec reveal">
        <div className="container">
          <div className="treat2-head">
            <div className="section-head">
              <h2 className="sec-title">치료</h2>
              <p className="sec-sub">
                포트폴리오병원의 대표 진료 과목을 확인하세요.
              </p>
            </div>

            <ul className="treat2-tabs" id="treatTabs">
              <li>
                <button
                  className="treat2-tab is-active"
                  data-key="ortho"
                  type="button"
                >
                  치아교정
                </button>
              </li>
              <li>
                <button
                  className="treat2-tab"
                  data-key="implant"
                  type="button"
                >
                  임플란트
                </button>
              </li>
              <li>
                <button
                  className="treat2-tab"
                  data-key="neuro"
                  type="button"
                >
                  신경치료
                </button>
              </li>
              <li>
                <button className="treat2-tab" data-key="endo" type="button">
                  충치치료
                </button>
              </li>
              <li>
                <button
                  className="treat2-tab"
                  data-key="wisdom"
                  type="button"
                >
                  사랑니발치
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="treat2-full">
          <div className="treat2-viewport" id="treatViewport">
            <div className="treat2-rail" id="treatRail">
              <button
                className="treat2-card is-active"
                data-key="ortho"
                type="button"
              >
                <div
                  className="t2-bg"
                  style={{ backgroundImage: "url('/img/treat1.webp')" }}
                ></div>
                <div className="t2-dim"></div>
                <div className="t2-content">
                  <div className="t2-title">치아교정</div>
                  <div className="t2-desc">
                    기능과 심미를 고려한 맞춤
                    <br className="m-break" /> 교정 솔루션을 제공합니다.
                  </div>
                  <div className="t2-tags">
                    <span>#맞춤진료</span>
                    <span>#정밀진단</span>
                    <span>#사후관리</span>
                  </div>
                </div>
              </button>

              <button
                className="treat2-card"
                data-key="implant"
                type="button"
              >
                <div
                  className="t2-bg"
                  style={{ backgroundImage: "url('/img/treat2.webp')" }}
                ></div>
                <div className="t2-dim"></div>
                <div className="t2-content">
                  <div className="t2-title">임플란트</div>
                  <div className="t2-desc">
                    정밀 진단 기반의 안전한
                    <br className="m-break" /> 임플란트 치료를 진행합니다.
                  </div>
                  <div className="t2-tags">
                    <span>#안전시술</span>
                    <span>#사후관리</span>
                  </div>
                </div>
              </button>

              <button
                className="treat2-card"
                data-key="neuro"
                type="button"
              >
                <div
                  className="t2-bg"
                  style={{ backgroundImage: "url('/img/treat3.webp')" }}
                ></div>
                <div className="t2-dim"></div>
                <div className="t2-content">
                  <div className="t2-title">신경치료</div>
                  <div className="t2-desc">
                    통증을 줄이고 치아를 최대한
                    <br className="m-break" /> 보존하는 치료를 지향합니다.
                  </div>
                  <div className="t2-tags">
                    <span>#보존치료</span>
                    <span>#통증완화</span>
                  </div>
                </div>
              </button>

              <button className="treat2-card" data-key="endo" type="button">
                <div
                  className="t2-bg"
                  style={{ backgroundImage: "url('/img/treat4.webp')" }}
                ></div>
                <div className="t2-dim"></div>
                <div className="t2-content">
                  <div className="t2-title">충치치료</div>
                  <div className="t2-desc">
                    작은 충치부터 난이도 높은 케이스까지
                    <br className="m-break" /> 단계적으로 치료합니다.
                  </div>
                  <div className="t2-tags">
                    <span>#정밀치료</span>
                    <span>#보존</span>
                  </div>
                </div>
              </button>

              <button
                className="treat2-card"
                data-key="wisdom"
                type="button"
              >
                <div
                  className="t2-bg"
                  style={{ backgroundImage: "url('/img/treat5.webp')" }}
                ></div>
                <div className="t2-dim"></div>
                <div className="t2-content">
                  <div className="t2-title">사랑니발치</div>
                  <div className="t2-desc">
                    난이도 높은 케이스도
                    <br className="m-break" /> 체계적으로 진행합니다.
                  </div>
                  <div className="t2-tags">
                    <span>#정밀발치</span>
                    <span>#난발치</span>
                    <span>#안전</span>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor */}
      <section
        className="doctor3-wrap doctor3-fullbleed sec reveal"
        id="doctorSection"
      >
        <div className="doctor3-inner">
          <div className="doctor3-left">
            <div className="doctor3-kicker">DOCTOR</div>
            <h3 className="doctor3-title">
              정확한 진단,
              <br />
              믿을 수 있는 의료진
            </h3>
            <p className="doctor3-sub">
              전문성과 윤리의식이 함께하는 진료를 약속드립니다.
            </p>

            <div className="doctor3-info is-active" data-key="doc1">
              <div className="doctor3-role">대표원장</div>
              <div className="doctor3-name">김포트 원장</div>
              <div className="doctor3-dept">통합치의학과 · 교정/임플란트</div>
            </div>

            <div className="doctor3-info" data-key="doc2">
              <div className="doctor3-role">원장</div>
              <div className="doctor3-name">김의사 원장</div>
              <div className="doctor3-dept">통합치의학과 · 보철/보존</div>
            </div>

            <div className="doctor3-cta">
              <a
                className="btn btn-outline-secondary"
                href="/intro/staff"
              >
                자세히 보기
              </a>
              <a className="btn btn-primary" href="/reserve/calendar">
                예약하기
              </a>
            </div>
          </div>

          <div className="doctor3-right">
            <div className="doctor3-viewport" id="doctorViewport">
              <div className="doctor3-track" id="doctorTrack">
                <span className="doctor3-spacer" aria-hidden="true"></span>

                <button
                  className="doctor3-slide is-active"
                  type="button"
                  data-key="doc1"
                  aria-label="김포트 원장"
                >
                  <img
                    src="/img/doctor1.webp"
                    alt="대표원장 김포트"
                    loading="lazy"
                    decoding="async"
                  />
                </button>

                <button
                  className="doctor3-slide"
                  type="button"
                  data-key="doc2"
                  aria-label="김의사 원장"
                >
                  <img
                    src="/img/doctor2.webp"
                    alt="원장 김의사"
                    loading="lazy"
                    decoding="async"
                  />
                </button>

                <span className="doctor3-spacer" aria-hidden="true"></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facility */}
      <section className="facility-wrap fullbleed sec reveal">
        <div className="full-content">
          <div className="facility-head reveal">
            <div>
              <h3 className="sec-title">시설 안내</h3>
              <p className="sec-sub">
                따뜻함과 편안함이 머무는 진료 공간을 제공합니다.
              </p>
            </div>
          </div>

          <div className="facility-grid reveal-stagger">
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="fac-img">
                  <img
                    src="/img/facility1.webp"
                    alt="시설 사진 1"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="fac-img">
                  <img
                    src="/img/facility2.webp"
                    alt="시설 사진 2"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="fac-img">
                  <img
                    src="/img/facility3.webp"
                    alt="시설 사진 3"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* News */}
      <section className="news-wrap fullbleed sec reveal">
        <div className="full-content">
          <div className="news-head reveal">
            <h3 className="sec-title text-center">
              포트폴리오병원의
              <br className="d-md-none" /> 새로운 소식을 만나보세요.
            </h3>
            <p className="sec-sub text-center">
              공지사항과 병원소식을 한 번에 확인하세요.
            </p>
          </div>

          <ul className="nav news-tabs justify-content-center reveal">
            <li className="nav-item">
              <button
                className="nav-link active"
                data-bs-toggle="tab"
                data-bs-target="#n1"
                type="button"
              >
                공지사항
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link"
                data-bs-toggle="tab"
                data-bs-target="#n2"
                type="button"
              >
                병원소식
              </button>
            </li>
          </ul>

          <div className="tab-content mt-4 reveal-stagger">
            {/* Notice */}
            <div className="tab-pane fade show active" id="n1">
              <div className="news-center">
                <div className="news-list reveal-stagger">
                  {noticePreview.map((p) => (
                    <a
                      className="news-item"
                      href={`/community/notice`}
                      key={p.id}
                    >
                      <div className="news-item-title">{p.title}</div>
                      <div className="news-item-meta">
                        <span className="news-item-tag">공지</span>
                        <span className="news-item-date">
                          {p.created_at.replace(/-/g, ".")}
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* News */}
            <div className="tab-pane fade" id="n2">
              <div className="news-center">
                <div className="row g-3 reveal-stagger">
                  {newsPreview.map((p) => (
                    <div className="col-12 col-md-auto d-flex" key={p.id}>
                      <a className="news-card" href={`/community/news`}>
                        <div
                          className="news-thumb"
                          style={{
                            backgroundImage: `url('${p.image_url || "/img/news1.webp"}')`,
                          }}
                        ></div>
                        <div className="news-body">
                          <div className="news-title">{p.title}</div>
                          <div className="news-date">
                            {p.created_at.replace(/-/g, ".")}
                          </div>
                        </div>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq-wrap sec reveal">
        <div className="container">
          <h3 className="sec-title text-center">자주 묻는 질문</h3>

          <div className="accordion faq-acc mx-auto" id="faqAcc">
            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#faq1"
                >
                  예약 없이 방문해도 되나요?
                </button>
              </h2>
              <div
                id="faq1"
                className="accordion-collapse collapse show"
                data-bs-parent="#faqAcc"
              >
                <div className="accordion-body">
                  원활한 진료를 위해 예약을 권장합니다. 당일 접수도 가능하며 대기
                  시간이 발생할 수 있습니다.
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#faq2"
                >
                  임플란트 상담은 얼마나 걸리나요?
                </button>
              </h2>
              <div
                id="faq2"
                className="accordion-collapse collapse"
                data-bs-parent="#faqAcc"
              >
                <div className="accordion-body">
                  기본 상담은 15~30분 내외이며, 검사 항목에 따라 달라질 수
                  있습니다.
                </div>
              </div>
            </div>

            <div className="accordion-item">
              <h2 className="accordion-header">
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#faq3"
                >
                  교정 치료 기간은 어느 정도인가요?
                </button>
              </h2>
              <div
                id="faq3"
                className="accordion-collapse collapse"
                data-bs-parent="#faqAcc"
              >
                <div className="accordion-body">
                  개인 상태에 따라 다르며 정밀 진단 후 예상 기간을
                  안내드립니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <button className="fab-top" id="fabTop" type="button" aria-label="Back to top">
        <span className="fab-top-ico" aria-hidden="true">
          TOP
        </span>
      </button>
    </>
  );
}
