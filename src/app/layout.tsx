import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "포트폴리오병원",
  description: "포트폴리오병원 - 정확한 진단, 편안한 치료",
};

const SITE_NAME = "포트폴리오병원";

const NAV = [
  {
    title: "병원소개",
    items: [
      { label: "인사말", slug: "intro/greeting" },
      { label: "의료진소개", slug: "intro/staff" },
    ],
  },
  {
    title: "치료",
    items: [
      { label: "치아교정", slug: "treat/ortho" },
      { label: "임플란트", slug: "treat/implant" },
      { label: "신경치료", slug: "treat/endo" },
      { label: "충치치료", slug: "treat/caries" },
      { label: "사랑니발치", slug: "treat/wisdom" },
    ],
  },
  {
    title: "이용안내",
    items: [
      { label: "시설안내", slug: "guide/facility" },
      { label: "오시는길", slug: "guide/directions" },
    ],
  },
  {
    title: "예약·상담",
    items: [
      { label: "달력예약", slug: "reserve/calendar" },
      { label: "온라인 상담", slug: "reserve/consult" },
    ],
  },
  {
    title: "커뮤니티",
    items: [
      { label: "공지사항", slug: "community/notice" },
      { label: "병원소식", slug: "community/news" },
    ],
  },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        <link href="/css/style.css" rel="stylesheet" />
      </head>
      <body>
        <div id="pageScroll" className="page-scroll">
          <header className="sticky-top">
            <nav className="navbar navbar-expand-lg navbar-light navbar-transparent">
              <div className="container">
                <a className="navbar-brand fw-bold" href="/">
                  {SITE_NAME}
                </a>

                <button
                  className="navbar-toggler"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target="#topNav"
                  aria-controls="topNav"
                  aria-expanded="false"
                  aria-label="Toggle navigation"
                >
                  <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="topNav">
                  <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2 nav-mega">
                    {NAV.map((menu, idx) => (
                      <li className="nav-item nav-mega-item" key={idx}>
                        <a
                          className="nav-link fw-semibold nav-mega-link"
                          href="#"
                          data-mega-key={idx}
                          data-mobile-acc-btn="1"
                        >
                          {menu.title}
                        </a>

                        <div
                          className="d-lg-none mobile-mega-src"
                          data-mega-src={idx}
                          hidden
                        >
                          {menu.items.map((item, iIdx) => (
                            <a
                              className="mobile-mega-link"
                              href={`/${item.slug}`}
                              key={iIdx}
                            >
                              {item.label}
                            </a>
                          ))}
                        </div>
                      </li>
                    ))}

                    <li className="nav-item ms-lg-2">
                      <a
                        className="btn btn-primary btn-sm px-3 nav-reserve"
                        href="/reserve/calendar"
                      >
                        예약하기
                      </a>
                    </li>

                    <li className="nav-item d-lg-none mt-3 pt-3 border-top mobile-auth">
                      <a className="d-block py-2" href="#">
                        로그인
                      </a>
                      <a className="d-block py-2" href="#">
                        회원가입
                      </a>
                    </li>
                  </ul>

                  <div
                    className="d-lg-none mnav-divider"
                    aria-hidden="true"
                  ></div>

                  <div
                    className="d-lg-none mnav-panel"
                    id="mobileMegaPanel"
                    aria-hidden="true"
                  >
                    <div className="mnav-panel-inner">
                      <div className="mnav-panel-head" id="mnavPanelHead">
                        메뉴를 선택하세요
                      </div>
                      <div className="mnav-panel-body" id="mnavPanelBody">
                        <div className="mnav-panel-placeholder">
                          왼쪽에서 상위 메뉴를 누르면 하위 메뉴가 표시됩니다.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="mega-global d-none d-lg-block"
                    aria-hidden="true"
                  >
                    <div className="mega-global-inner">
                      <div className="container mega-rail">
                        {NAV.map((menu, idx) => (
                          <div
                            className="mega-col"
                            data-mega-col={idx}
                            key={idx}
                          >
                            <div className="mega-col-title">{menu.title}</div>
                            <div className="mega-col-list">
                              {menu.items.map((item, iIdx) => (
                                <a
                                  className="mega-col-link"
                                  href={`/${item.slug}`}
                                  key={iIdx}
                                >
                                  {item.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="nav-auth-dock d-none d-lg-flex">
                <a className="nav-auth-link" href="#">
                  로그인
                </a>
                <a className="nav-auth-link" href="#">
                  회원가입
                </a>
              </div>
            </nav>
          </header>

          <main>{children}</main>

          <div className="floating-quick d-none d-lg-flex">
            <a className="fq-item" href="/guide/directions">
              <div className="fq-ico">📍</div>
              <div className="fq-txt">오시는길</div>
            </a>
            <a className="fq-item" href="/reserve/calendar">
              <div className="fq-ico">📅</div>
              <div className="fq-txt">달력예약</div>
            </a>
            <a className="fq-item" href="/reserve/consult">
              <div className="fq-ico">💬</div>
              <div className="fq-txt">온라인상담</div>
            </a>
          </div>

          <footer className="border-top mt-5">
            <div className="container py-5">
              <div className="row g-4">
                <div className="col-lg-4">
                  <div className="fw-bold mb-2">{SITE_NAME}</div>
                  <div className="text-muted small">
                    서울특별시 ○○구 ○○로 123 (예시)
                    <br />
                    대표번호 02-000-0000 · 진료문의 010-0000-0000
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="fw-semibold mb-2">진료시간</div>
                  <div className="text-muted small">
                    평일 09:30 - 18:30
                    <br />
                    토요일 09:30 - 14:00
                    <br />
                    점심 13:00 - 14:00 (토요일 제외)
                    <br />
                    일/공휴일 휴진
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="fw-semibold mb-2">바로가기</div>
                  <div className="d-flex flex-wrap gap-2">
                    <a className="btn btn-light btn-sm" href="/guide/directions">
                      오시는길
                    </a>
                    <a className="btn btn-light btn-sm" href="/community/notice">
                      공지사항
                    </a>
                    <a className="btn btn-light btn-sm" href="/intro/staff">
                      의료진소개
                    </a>
                  </div>
                </div>
              </div>

              <div className="text-muted small mt-4">
                &copy; {SITE_NAME}. All rights reserved.
              </div>
            </div>
          </footer>
        </div>

        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
        <Script src="/js/main.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
