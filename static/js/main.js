/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});/* =========================================================
   Portfolio Hospital - MAIN.JS (정리본)
   - 기존 동작 유지(롤백 정상 상태 기준)
   - 기능별 init 분리 + 중복 DOMContentLoaded 제거
   - resize/scroll 최적화(rAF throttle)
   ========================================================= */

/* ================================
   Utils
   ================================ */
(() => {
  // rAF로 연속 호출을 1프레임에 1번으로 합치기
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        fn(...args);
      });
    };
  };

  // 전역 공유 (필요한 init에서 사용)
  window.__PH = window.__PH || {};
  window.__PH.rafThrottle = rafThrottle;
})();

/* ================================
   Treat2 (치료 탭 + 카드 레일)
   ================================ */
function initTreat2() {
  const viewport = document.getElementById("treatViewport");
  const rail = document.getElementById("treatRail");
  const tabWrap = document.getElementById("treatTabs");
  if (!viewport || !rail || !tabWrap) return;

  const tabs = Array.from(tabWrap.querySelectorAll(".treat2-tab"));
  const cards = Array.from(rail.querySelectorAll(".treat2-card"));
  if (!tabs.length || !cards.length) return;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const setActive = (key) => {
    tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.key === key));
    cards.forEach((c) => c.classList.toggle("is-active", c.dataset.key === key));
  };

  const alignActive = (behavior = "smooth") => {
    const active = rail.querySelector(".treat2-card.is-active");
    if (!active) return;

    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (maxScroll <= 0) return;

    const style = getComputedStyle(viewport);
    const pad = parseFloat(style.paddingLeft) || 0;

    const aLeft = active.offsetLeft;
    const aRight = aLeft + active.offsetWidth;
    const aCenter = aLeft + active.offsetWidth / 2;

    let target = aCenter - viewport.clientWidth / 2;
    target = clamp(target, 0, maxScroll);

    if (aLeft - pad < target) target = aLeft - pad;
    if (aRight + pad > target + viewport.clientWidth) {
      target = aRight - viewport.clientWidth + pad;
    }
    target = clamp(target, 0, maxScroll);

    viewport.scrollTo({ left: target, behavior });
  };

  let isAnimating = false;

  const animateSwitch = (key) => {
    if (isAnimating) return;
    isAnimating = true;

    const prev = rail.querySelector(".treat2-card.is-active");
    if (prev) prev.classList.add("is-leaving");

    rail.classList.add("is-switching");
    setActive(key);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        alignActive("smooth");
        rail.classList.remove("is-switching");

        setTimeout(() => {
          if (prev) prev.classList.remove("is-leaving");
          isAnimating = false;
        }, 320);
      });
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(tab.dataset.key);
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      animateSwitch(card.dataset.key);
    });
  });

  const initKey =
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0].dataset.key;

  setActive(initKey);
  requestAnimationFrame(() => alignActive("auto"));

  const onResize = window.__PH.rafThrottle(() => alignActive("auto"));
  window.addEventListener("resize", onResize, { passive: true });

  // Drag-to-scroll
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  viewport.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = viewport.scrollLeft;
    viewport.classList.add("is-dragging");
  });

  window.addEventListener("mouseup", () => {
    if (!isDown) return;
    isDown = false;
    viewport.classList.remove("is-dragging");
    if (moved) setTimeout(() => alignActive("smooth"), 80);
  });

  viewport.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();
    const walk = (e.pageX - startX) * 1.1;
    if (Math.abs(e.pageX - startX) > 6) moved = true;
    viewport.scrollLeft = startScroll - walk;
  });
}

/* ================================
   HERO indicator sync (visibility-based)
   ================================ */
function initHeroIndicators() {
  const hero = document.querySelector(".hero-card");
  if (!hero) return;

  const slides = Array.from(hero.querySelectorAll(".hero-slide"));
  const dotsWrap = hero.querySelector(".hero-indicators");
  if (!slides.length || !dotsWrap) return;

  const dots = Array.from(dotsWrap.querySelectorAll("button, .dot, span, i, a"))
    .filter((el) => el.offsetParent !== null);

  if (!dots.length) return;

  const setDot = (idx) => {
    dots.forEach((d, i) => {
      d.classList.toggle("active", i === idx);
      d.classList.toggle("is-active", i === idx);
      if (d.tagName === "BUTTON") {
        d.setAttribute("aria-current", i === idx ? "true" : "false");
      }
    });
  };

  let ratios = new Array(slides.length).fill(0);
  let lastIdx = -1;

  const pickMax = () => {
    let max = -1, idx = 0;
    for (let i = 0; i < ratios.length; i++) {
      if (ratios[i] > max) { max = ratios[i]; idx = i; }
    }
    if (idx !== lastIdx) {
      lastIdx = idx;
      setDot(idx);
    }
  };

  const thresholds = Array.from({ length: 21 }, (_, i) => i / 20);

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const i = slides.indexOf(e.target);
      if (i >= 0) ratios[i] = e.intersectionRatio || 0;
    }
    pickMax();
  }, { root: null, threshold: thresholds });

  slides.forEach((s) => io.observe(s));

  requestAnimationFrame(() => {
    const visibleIdx = slides.findIndex((s) => {
      const st = getComputedStyle(s);
      return st.display !== "none" && st.visibility !== "hidden" && Number(st.opacity || 1) > 0.2;
    });
    setDot(visibleIdx >= 0 ? visibleIdx : 0);
  });
}

/* ================================
   Doctor slider (auto + click)
   ================================ */
function initDoctorSlider() {
  if (window.__doctorSliderInit) return;
  window.__doctorSliderInit = true;

  const viewport = document.getElementById("doctorViewport");
  const track = document.getElementById("doctorTrack");
  if (!viewport || !track) return;

  const slides = Array.from(track.querySelectorAll(".doctor3-slide"));
  const infos = Array.from(document.querySelectorAll(".doctor3-info"));
  if (slides.length < 2) return;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const alignToActive = () => {
    const active = slides[index];
    const vw = viewport.clientWidth;
    const max = track.scrollWidth - vw;
    if (max <= 0) return;

    const center = active.offsetLeft + active.offsetWidth / 2;
    let target = center - vw / 2;
    target = clamp(target, 0, max);

    track.style.transform = `translate3d(${-target}px, 0, 0)`;
  };

  const setActive = (i) => {
    index = (i + slides.length) % slides.length;

    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === index));

    const key = slides[index].dataset.key;
    infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));

    alignToActive();
  };

  const DELAY = 5000;
  let timerId = null;
  let paused = false;

  const stop = () => {
    paused = true;
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const scheduleNext = () => {
    if (paused) return;
    if (timerId) return;

    timerId = setTimeout(() => {
      timerId = null;
      setActive(index + 1);
      scheduleNext();
    }, DELAY);
  };

  const start = () => {
    paused = false;
    scheduleNext();
  };

  const restart = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    paused = false;
    scheduleNext();
  };

  slides.forEach((s, i) => {
    s.addEventListener("click", (e) => {
      e.preventDefault();
      setActive(i);
      restart();
    });
  });

  viewport.addEventListener("pointerdown", stop);
  window.addEventListener("pointerup", start);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stop();
    else start();
  });

  const onResize = window.__PH.rafThrottle(() => alignToActive());
  window.addEventListener("resize", onResize, { passive: true });

  setActive(index);
  start();
}

/* ================================
   Scroll reveal (HOME ONLY)
   ================================ */
function initScrollReveal() {
  if (!document.body.classList.contains("page-home")) return;

  document.documentElement.classList.add("js");

  const targets = document.querySelectorAll(".reveal, .reveal-stagger");
  if (!targets.length) return;

  const IN = 0.16;
  const OUT = 0.02;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const el = entry.target;
      const r = entry.intersectionRatio || 0;

      if (r >= IN) el.classList.add("is-visible");
      else if (r <= OUT) el.classList.remove("is-visible");
    });
  }, {
    threshold: [0, OUT, IN, 0.35, 0.7, 1],
    rootMargin: "0px 0px -12% 0px"
  });

  targets.forEach((el) => io.observe(el));
}

/* ================================
   Bootstrap Tabs: fade replay (HOME ONLY)
   ================================ */
function initTabsFadeReplay() {
  if (!document.body.classList.contains("page-home")) return;

  document.querySelectorAll('[data-bs-toggle="tab"]').forEach((tabBtn) => {
    tabBtn.addEventListener("shown.bs.tab", (e) => {
      const targetSel = e.target.getAttribute("data-bs-target");
      if (!targetSel) return;

      const pane = document.querySelector(targetSel);
      if (!pane) return;

      const nodes = pane.querySelectorAll(".reveal, .reveal-stagger");
      if (!nodes.length) return;

      nodes.forEach((el) => el.classList.remove("is-visible"));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nodes.forEach((el) => el.classList.add("is-visible"));
        });
      });
    });
  });
}

/* ================================
   Navbar: transparent on HOME hero only
   - 기존 로직 유지 (hero가 없으면 solid)
   ================================ */
function initNavbarHomeTransparent() {
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!nav) return;

  const hero = document.querySelector(".hero-wrap");
  const isHome = document.body.classList.contains("page-home");

  if (!isHome) return; // 서브는 현재 로직 유지(필요하면 여기서 분기 확장)

  if (hero) {
    const io = new IntersectionObserver((entries) => {
      const entry = entries[0];
      nav.classList.toggle("is-solid", !entry.isIntersecting);
    }, {
      root: null,
      threshold: 0,
      rootMargin: "-120px 0px 0px 0px"
    });

    io.observe(hero);
  } else {
    nav.classList.add("is-solid");
  }
}

/* ================================
   Mega menu (Desktop only)
   - 현재 style.css의 "Mega menu FINAL" 구조 그대로
   - header.sticky-top 에 mega-open 토글
   - --nav-h 갱신 + 상단 메뉴 좌표 → mega-col 배치
   ================================ */
function initMegaMenu() {
  const header = document.querySelector("header.sticky-top");
  const navEl = document.querySelector("header.sticky-top .navbar");
  const navWrap = document.querySelector(".nav-mega");
  const mega = document.querySelector(".mega-global");
  const rail = document.querySelector(".mega-rail");

  const links = document.querySelectorAll(".nav-mega-link[data-mega-key]");
  const cols = document.querySelectorAll(".mega-col[data-mega-col]");

  if (!header || !navEl || !navWrap || !mega || !rail || !links.length || !cols.length) return;

  const MQ = window.matchMedia("(min-width: 992px)");

  const setNavH = () => {
    // desktop에서만 의미 있음
    const h = Math.round(navEl.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--nav-h", `${h}px`);
  };

  const layoutCols = () => {
    if (!MQ.matches) return;

    const railRect = rail.getBoundingClientRect();
    const railW = railRect.width;

    links.forEach((a) => {
      const k = a.getAttribute("data-mega-key");
      const col = rail.querySelector(`.mega-col[data-mega-col="${k}"]`);
      if (!col) return;

      const r = a.getBoundingClientRect();

      // 컬럼 폭: 상단 메뉴 폭 + 여유(최소폭 보장)
      const colW = Math.max(170, Math.round(r.width + 80));

      // 상단 메뉴의 “가운데” 기준으로 정렬
      const centerX = (r.left + r.width / 2) - railRect.left;
      let left = Math.round(centerX - colW / 2);

      // rail 밖으로 안 나가게 clamp
      left = Math.max(0, Math.min(left, railW - colW));

      col.style.left = `${left}px`;
      col.style.width = `${colW}px`;
    });

    // rail 높이: 가장 큰 컬럼에 맞춤
    let maxH = 0;
    cols.forEach((c) => { maxH = Math.max(maxH, c.scrollHeight); });
    rail.style.height = `${Math.max(200, maxH)}px`;
  };

  const syncLayout = () => {
    if (!MQ.matches) return;
    setNavH();
    layoutCols();
  };

  const syncLayoutRAF = window.__PH.rafThrottle(syncLayout);

  // 열림/닫힘 (hover)
  let t = null;

  const open = () => {
    if (!MQ.matches) return;
    if (t) { clearTimeout(t); t = null; }
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);

  // href="#" 튐 방지(Desktop/ Mobile 상관없이 안전)
  links.forEach((a) => a.addEventListener("click", (e) => e.preventDefault()));

  // 최초 1회
  syncLayout();

  // resize/scroll 시 보정(Desktop only에서만 의미)
  window.addEventListener("resize", syncLayoutRAF, { passive: true });
  window.addEventListener("scroll", syncLayoutRAF, { passive: true });

  // breakpoint 전환 시 정리
  const handleMQ = () => {
    if (!MQ.matches) {
      header.classList.remove("mega-open");
      // 모바일에서 CSS 변수는 크게 의미 없지만 값은 유지해도 무방
    } else {
      syncLayoutRAF();
    }
  };
  MQ.addEventListener?.("change", handleMQ);
}

/* =========================================================
   Mega menu - auth hover also opens mega
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("header.sticky-top");
  const megaGlobal = document.querySelector(".mega-global");
  const megaInner = document.querySelector(".mega-global-inner");

  // 메가가 없는 페이지면 종료
  if (!header || !megaGlobal || !megaInner) return;

  const openMega = () => header.classList.add("mega-open");
  const closeMega = () => header.classList.remove("mega-open");

  // ✅ 로그인/회원가입/로그아웃 hover도 메가 오픈 트리거로 추가
  const authLinks = document.querySelectorAll(".nav-auth-dock .nav-auth-link, .nav-auth .nav-auth-link");
  authLinks.forEach((a) => {
    a.addEventListener("mouseenter", openMega);
    a.addEventListener("focus", openMega);
  });

  // ✅ 메가 영역에서 나가면 닫기(기존 로직 있으면 중복 추가 X)
  // 기존에 이미 비슷한 close 로직이 있다면 아래는 생략해도 됨.
  let closeTimer = null;
  const scheduleClose = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeMega, 120);
  };
  const cancelClose = () => {
    clearTimeout(closeTimer);
  };

  header.addEventListener("mouseleave", scheduleClose);
  header.addEventListener("mouseenter", cancelClose);
  megaGlobal.addEventListener("mouseenter", cancelClose);
  megaGlobal.addEventListener("mouseleave", scheduleClose);
});

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTreat2();
  initHeroIndicators();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
});