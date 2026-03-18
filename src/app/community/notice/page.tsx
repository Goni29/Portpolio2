"use client";

import { useState } from "react";
import SubHero from "@/components/SubHero";
import SubPageWrapper from "@/components/SubPageWrapper";

const menuItems = [
  { label: "공지사항", slug: "community/notice" },
  { label: "병원소식", slug: "community/news" },
];

const demoPosts = [
  { id: 5, title: "2026년 여름 휴진 안내", created_at: "2026-03-15" },
  { id: 4, title: "주차장 이용 안내 변경", created_at: "2026-03-10" },
  { id: 3, title: "신규 장비 도입 안내", created_at: "2026-03-05" },
  { id: 2, title: "3월 진료시간 변경 안내", created_at: "2026-02-28" },
  { id: 1, title: "2026년 설 연휴 진료 안내", created_at: "2026-01-20" },
];

export default function NoticePage() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("latest");

  const filtered = demoPosts.filter((p) => {
    if (!q) return true;
    return p.title.includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === "oldest") return a.id - b.id;
    return b.id - a.id;
  });

  return (
    <SubPageWrapper>
      <SubHero
        title="공지사항"
        menuTitle="커뮤니티"
        activeSlug="community/notice"
        menuItems={menuItems}
      />

      <section className="sec consult-board-wrap community-board">
        <div className="container">
          <div className="board-inner">
            <div className="board-topbar">
              <div className="board-left">
                <div className="board-title">공지사항</div>
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
                    placeholder="제목/내용 검색"
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <button className="board-search-btn" type="submit" aria-label="검색">🔍</button>
                </form>
              </div>
              <div className="board-right"></div>
            </div>

            <div className="board-table-wrap">
              <table className="board-table">
                <thead>
                  <tr>
                    <th className="col-no">No</th>
                    <th className="col-title">제목</th>
                    <th className="col-date">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="board-empty">등록된 공지사항이 없습니다.</td>
                    </tr>
                  ) : (
                    sorted.map((p) => (
                      <tr key={p.id}>
                        <td className="col-no">{p.id}</td>
                        <td className="col-title">
                          <a className="board-link" href="#">{p.title}</a>
                        </td>
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
