"use client";

import SubHero from "@/components/SubHero";
import SubPageWrapper from "@/components/SubPageWrapper";

const menuItems = [
  { label: "달력예약", slug: "reserve/calendar" },
  { label: "온라인 상담", slug: "reserve/consult" },
];

export default function ConsultWritePage() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.querySelector('[name="name"]') as HTMLInputElement)?.value.trim();
    const title = (form.querySelector('[name="title"]') as HTMLInputElement)?.value.trim();
    const content = (form.querySelector('[name="content"]') as HTMLTextAreaElement)?.value.trim();

    if (!name || !title || content.length < 5) {
      alert("이름/제목을 입력하고, 내용은 5자 이상 작성해주세요.");
      return;
    }

    alert("상담이 등록되었습니다. (데모)");
    window.location.href = "/reserve/consult";
  }

  return (
    <SubPageWrapper>
      <SubHero
        title="온라인 상담"
        menuTitle="예약·상담"
        activeSlug="reserve/consult"
        menuItems={menuItems}
      />

      <section className="sec consult-write-wrap">
        <div className="container">
          <div className="board-inner consult-panel">
            <div className="consult-head compact">
              <h2 className="consult-title">온라인 상담 신청</h2>
              <p className="consult-sub">남겨주신 내용을 확인 후 연락드리겠습니다.</p>
            </div>

            <form className="consult-form" onSubmit={handleSubmit} id="consultWriteForm">
              <div className="consult-grid">
                <label className="field">
                  <span>이름 *</span>
                  <input name="name" placeholder="홍길동" required />
                </label>
                <label className="field">
                  <span>연락처</span>
                  <input name="phone" placeholder="010-1234-5678" />
                </label>
              </div>

              <label className="field">
                <span>제목 *</span>
                <input name="title" placeholder="예) 치아 통증 상담" required maxLength={120} />
              </label>

              <label className="field">
                <span>내용 *</span>
                <textarea name="content" placeholder="증상/원하시는 상담 내용을 자세히 적어주세요." required minLength={5}></textarea>
              </label>

              <div className="consult-grid consult-grid--privacy">
                <div className="privacy-left field">
                  <span className="field-label"> </span>
                  <label className="check check--boxed">
                    <input type="checkbox" name="is_private" defaultChecked />
                    <span>비밀글</span>
                  </label>
                  <div className="privacy-hint">※ 비밀번호 입력 시, 상세 열람에 필요합니다.</div>
                </div>
                <div className="privacy-right field">
                  <span className="field-label">글 비밀번호(선택)</span>
                  <input name="post_password" placeholder="비밀글 확인용 (선택)" />
                </div>
              </div>

              <div className="consult-actions">
                <a className="btn btn-ghost" href="/reserve/consult" role="button">목록</a>
                <button className="btn btn-dark" type="submit">
                  <span aria-hidden="true">📝</span> 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </SubPageWrapper>
  );
}
