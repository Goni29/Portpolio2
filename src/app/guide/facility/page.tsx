import SubHero from "@/components/SubHero";
import SubPageWrapper from "@/components/SubPageWrapper";

const menuItems = [
  { label: "시설안내", slug: "guide/facility" },
  { label: "오시는길", slug: "guide/directions" },
];

export default function FacilityPage() {
  return (
    <SubPageWrapper>
      <SubHero
        title="시설안내"
        menuTitle="이용안내"
        activeSlug="guide/facility"
        menuItems={menuItems}
      />

      <section className="sec facility-page">
        <div className="container">
          <div className="page-head-center">
            <div className="page-kicker">GUIDE · FACILITY</div>
            <h2 className="page-title">시설안내</h2>
            <p className="page-sub">편안한 동선과 위생 중심의 진료 환경을 제공합니다.</p>
          </div>

          <div
            id="facilityCarousel"
            className="carousel slide facility-carousel"
            data-bs-ride="carousel"
            data-bs-interval="4500"
          >
            <div className="carousel-indicators">
              <button type="button" data-bs-target="#facilityCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1"></button>
              <button type="button" data-bs-target="#facilityCarousel" data-bs-slide-to="1" aria-label="Slide 2"></button>
              <button type="button" data-bs-target="#facilityCarousel" data-bs-slide-to="2" aria-label="Slide 3"></button>
            </div>

            <div className="carousel-inner">
              <div className="carousel-item active">
                <div className="facility-slide">
                  <img src="/img/facility1.webp" alt="시설 이미지 1" loading="lazy" decoding="async" />
                  <div className="facility-cap">
                    <div className="facility-cap-title">접수/대기 공간</div>
                    <div className="facility-cap-sub">편안한 대기와 안내 동선</div>
                  </div>
                </div>
              </div>

              <div className="carousel-item">
                <div className="facility-slide">
                  <img src="/img/facility2.webp" alt="시설 이미지 2" loading="lazy" decoding="async" />
                  <div className="facility-cap">
                    <div className="facility-cap-title">상담실</div>
                    <div className="facility-cap-sub">프라이빗 상담 환경</div>
                  </div>
                </div>
              </div>

              <div className="carousel-item">
                <div className="facility-slide">
                  <img src="/img/facility3.webp" alt="시설 이미지 3" loading="lazy" decoding="async" />
                  <div className="facility-cap">
                    <div className="facility-cap-title">진료실</div>
                    <div className="facility-cap-sub">위생 중심 진료 시스템</div>
                  </div>
                </div>
              </div>
            </div>

            <button className="carousel-control-prev" type="button" data-bs-target="#facilityCarousel" data-bs-slide="prev" aria-label="이전">
              <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            </button>

            <button className="carousel-control-next" type="button" data-bs-target="#facilityCarousel" data-bs-slide="next" aria-label="다음">
              <span className="carousel-control-next-icon" aria-hidden="true"></span>
            </button>
          </div>

          <div className="subpage-cta subpage-cta--center">
            <div className="cta-copy cta-copy--center">
              <div className="cta-copy-title">시설을 직접 보고 상담받아보세요.</div>
              <div className="cta-copy-sub">예약 후 방문하시면 더 빠르게 안내해드립니다.</div>
            </div>
          </div>
        </div>
      </section>
    </SubPageWrapper>
  );
}
