"use client";

import { useState } from "react";
import SubHero from "@/components/SubHero";
import SubPageWrapper from "@/components/SubPageWrapper";

const menuItems = [
  { label: "달력예약", slug: "reserve/calendar" },
  { label: "온라인 상담", slug: "reserve/consult" },
];

const demoPosts = [
  { id: 5, title: "치아교정 상담 문의", name: "김민수", created_at: "2026-03-15", is_private: false, status: "답변완료" },
  { id: 4, title: "임플란트 비용 문의", name: "이영희", created_at: "2026-03-12", is_private: true, status: "답변대기" },
  { id: 3, title: "스케일링 예약 관련", name: "박지훈", created_at: "2026-03-10", is_private: false, status: "답변완료" },
  { id: 2, title: "신경치료 후 통증 문의", name: "최수아", created_at: "2026-03-05", is_private: true, status: "" },
  { id: 1, title: "진료 시간 문의드립니다", name: "정현우", created_at: "2026-02-28", is_private: false, status: "답변완료" },
];

function maskName(name: string) {
  if (name.length <= 1) return name;
  if (name.length === 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

export default function ConsultPage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("latest");

  const filtered = demoPosts.filter((p) => {
    if (!q) return true;
    return p.title.includes(q) || p.name.includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "oldest") return a.id - b.id;
    return b.id - a.id;
  });

  return (
    <SubPageWrapper>
      <SubHero
        title="온라인 상담"
        menuTitle="예약·상담"
        activeSlug="reserve/consult"
        menuItems={menuItems}
      />

      <section className="sec consult-board-wrap">
        <div className="container">
          <div className="board-inner">
            <div className="board-topbar">
              <div className="board-left">
                <a className="board-rss" href="#" aria-label="RSS">RSS</a>
              </div>
              <div className="board-mid">
                <form className="board-search" onSubmit={(e) => e.preventDefault()}>
                  <select
                    name="sort"
                    className="board-select"
                    aria-label="정렬"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option value="latest">최신순</option>
                    <option value="oldest">오래된순</option>
                  </select>
                  <input
                    name="q"
                    value={q}
                    className="board-input"
                    placeholder="제목/내용/작성자 검색"
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <button className="board-search-btn" type="submit" aria-label="검색">🔍</button>
                </form>
              </div>
              <div className="board-right">
                <a className="btn btn-dark" href="/reserve/consult/write" role="button">
                  <span aria-hidden="true">📝</span> 상담신청
                </a>
              </div>
            </div>

            <div className="board-table-wrap">
              <table className="board-table">
                <thead>
                  <tr>
                    <th className="col-no">No</th>
                    <th className="col-title">제목</th>
                    <th className="col-writer">작성자</th>
                    <th className="col-date">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="board-empty">등록된 상담이 없습니다.</td>
                    </tr>
                  ) : (
                    sorted.map((p) => (
                      <tr key={p.id}>
                        <td className="col-no">{p.id}</td>
                        <td className="col-title">
                          {p.is_private && <span className="lock">🔒</span>}
                          <a className="board-link" href="#">
                            {p.title}
                          </a>
                          {p.status && <span className="badge">{p.status}</span>}
                        </td>
                        <td className="col-writer">{maskName(p.name)}</td>
                        <td className="col-date">{p.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="board-pagination">
              <span className="pg is-disabled">이전</span>
              <span className="pg is-active">1</span>
              <span className="pg is-disabled">다음</span>
            </div>
          </div>
        </div>
      </section>
    </SubPageWrapper>
  );
}
