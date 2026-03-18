import SubHero from "@/components/SubHero";
import SubPageWrapper from "@/components/SubPageWrapper";

const menuItems = [
  { label: "시설안내", slug: "guide/facility" },
  { label: "오시는길", slug: "guide/directions" },
];

export default function DirectionsPage() {
  return (
    <SubPageWrapper>
      <SubHero
        title="오시는길"
        menuTitle="이용안내"
        activeSlug="guide/directions"
        menuItems={menuItems}
      />

      <section className="sec location-page">
        <div className="container">
          <div className="address-head">
            <div className="address-kicker">ADDRESS</div>
            <div className="address-line">서울특별시 ○○구 ○○로 123 (예시)</div>
            <div className="address-rule" aria-hidden="true"></div>
          </div>

          <div className="address-map">
            <iframe
              title="병원 위치 지도"
              src="https://maps.google.com/maps?q=Seoul&t=&z=15&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </SubPageWrapper>
  );
}
