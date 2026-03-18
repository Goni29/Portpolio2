"use client";

import { useState } from "react";
import SubHero from "@/components/SubHero";
import SubPageWrapper from "@/components/SubPageWrapper";

const menuItems = [
  { label: "공지사항", slug: "community/notice" },
  { label: "병원소식", slug: "community/news" },
];

const demoPosts = [
  { id: 3, title: "어린이 불소도포 무료 이벤트", created_at: "2026-03-10", image_url: "/img/news3.webp" },
  { id: 2, title: "봄맞이 스케일링 이벤트", created_at: "2026-03-01", image_url: "/img/news2.webp" },
  { id: 1, title: "포트폴리오병원 확장 이전 안내", created_at: "2026-02-15", image_url: "/img/news1.webp" },
];

export default function NewsPage() {
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
        title="병원소식"
        menuTitle="커뮤니티"
        activeSlug="community/news"
        menuItems={menuItems}
      />

      <section className="sec consult-board-wrap community-board">
        <div className="container">
          <div className="board-inner">
            <div className="board-topbar">
              <div className="board-left">
                <div className="board-title">병원소식</div>
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
                    <th className="col-thumb"></th>
                    <th className="col-title">제목</th>
                    <th className="col-date">등록일</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="board-empty">등록된 병원소식이 없습니다.</td>
                    </tr>
                  ) : (
                    sorted.map((p) => (
                      <tr key={p.id}>
                        <td className="col-thumb">
                          {p.image_url ? (
                            <img className="thumb" src={p.image_url} alt="" loading="lazy" decoding="async" />
                          ) : (
                            <div className="thumb thumb--empty"></div>
                          )}
                        </td>
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
