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
   UA flags (Android/Kakao)
   ================================ */
function initUserAgentFlags() {
  if (window.__uaFlagsInit) return;
  window.__uaFlagsInit = true;
  const ua = navigator.userAgent || "";
  if (/KAKAOTALK|KAKAO|DaumApps/i.test(ua)) {
    document.documentElement.classList.add("ua-kakao");
  }
  if (/Android/i.test(ua)) {
    document.documentElement.classList.add("ua-android");
  }
  const isiOS =
    /iPad|iPhone|iPod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (isiOS) {
    document.documentElement.classList.add("ua-ios");
  }
}

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

  const mobileMQ = window.matchMedia("(max-width: 991.98px)");
  const isMobileLayout = () => mobileMQ.matches;

  const getCenterKey = () => {
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let best = null;
    let bestDist = Infinity;

    cards.forEach((c) => {
      const cCenter = c.offsetLeft + c.offsetWidth / 2;
      const dist = Math.abs(center - cCenter);
      if (dist < bestDist) {
        bestDist = dist;
        best = c;
      }
    });

    return best?.dataset.key || null;
  };

  const syncActiveFromScroll = () => {
    const key = getCenterKey();
    if (!key) return;
    const activeKey =
      tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
      rail.querySelector(".treat2-card.is-active")?.dataset.key;
    if (activeKey === key) return;
    setActive(key);
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
  let scrollRaf = null;
  let scrollEndTimer = null;

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

  const onResize = window.__PH.rafThrottle(() => {
    if (isMobileLayout()) {
      syncActiveFromScroll();
    }
    alignActive("auto");
  });
  window.addEventListener("resize", onResize, { passive: true });

  const scheduleScrollEnd = () => {
    if (scrollEndTimer) clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(() => {
      scrollEndTimer = null;
      if (!isMobileLayout()) return;
      if (isAnimating) return;
      syncActiveFromScroll();
    }, 120);
  };

  const onScroll = () => {
    if (!isMobileLayout()) return;
    if (scrollRaf) return;
    scrollRaf = requestAnimationFrame(() => {
      scrollRaf = null;
      if (isAnimating) return;
      syncActiveFromScroll();
      scheduleScrollEnd();
    });
  };

  viewport.addEventListener("scroll", onScroll, { passive: true });

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

  // Mobile: one-card-per-swipe
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartScroll = 0;
  let touchIntent = null;
  let touchStartKey = null;
  let touchStartT = 0;

  const getActiveKey = () =>
    tabWrap.querySelector(".treat2-tab.is-active")?.dataset.key ||
    rail.querySelector(".treat2-card.is-active")?.dataset.key ||
    cards[0]?.dataset.key;

  const getIndexByKey = (key) => cards.findIndex((c) => c.dataset.key === key);

  viewport.addEventListener(
    "touchstart",
    (e) => {
      if (!isMobileLayout()) return;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartScroll = viewport.scrollLeft;
      touchIntent = null;
      touchStartKey = getCenterKey() || getActiveKey();
      touchStartT = performance.now();
    },
    { passive: true }
  );

  viewport.addEventListener(
    "touchmove",
    (e) => {
      if (!isMobileLayout()) return;
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      if (!touchIntent && (absX > 6 || absY > 6)) {
        touchIntent = absX > absY * 1.1 ? "x" : "y";
      }

      if (touchIntent === "x") {
        e.preventDefault();
        viewport.scrollLeft = touchStartScroll - dx;
      }
    },
    { passive: false }
  );

  viewport.addEventListener(
    "touchend",
    (e) => {
      if (!isMobileLayout()) return;
      const t = e.changedTouches[0];
      if (!t) return;
      touchIntent = null;
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const dt = Math.max(1, performance.now() - touchStartT);
      const v = absX / dt;

      const isHorizontal = absX > absY * 1.1;
      const isSwipe = absX >= 14 && isHorizontal;
      const isFlick = dt <= 220 && v >= 0.22 && absX >= 8 && isHorizontal;
      if (!isSwipe && !isFlick) return;

      const baseKey = touchStartKey || getCenterKey() || getActiveKey();
      const baseIdx = getIndexByKey(baseKey);
      if (baseIdx < 0) return;

      const dir = dx < 0 ? 1 : -1;
      const targetIdx = clamp(baseIdx + dir, 0, cards.length - 1);
      if (targetIdx === baseIdx) {
        alignActive("smooth");
        return;
      }
      animateSwitch(cards[targetIdx].dataset.key);
      touchIntent = null;
    },
    { passive: true }
  );

  viewport.addEventListener(
    "touchcancel",
    () => {
      if (!isMobileLayout()) return;
      touchIntent = null;
    },
    { passive: true }
  );
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
   HERO scroll hint (HOME only)
   ================================ */
function initHeroScrollHint() {
  if (!document.body.classList.contains("page-home")) return;
  const hint = document.querySelector(".hero-scroll-hint");
  if (!hint || hint.__hintInit) return;
  hint.__hintInit = true;

  const update = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    hint.classList.toggle("is-hidden", y > 40);
  };

  const onScroll = window.__PH?.rafThrottle ? window.__PH.rafThrottle(update) : update;
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ================================
   Back-to-top (HOME, Android only)
   ================================ */
function initHomeBackToTop() {
  if (!document.body.classList.contains("page-home")) return;
  const btn = document.getElementById("fabTop");
  if (!btn || btn.__fabInit) return;
  btn.__fabInit = true;

  const update = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    btn.classList.toggle("is-visible", y > 240);
  };

  const onScroll = window.__PH?.rafThrottle ? window.__PH.rafThrottle(update) : update;
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const isMobile = window.matchMedia("(max-width: 991.98px)").matches;

  let index = slides.findIndex((s) => s.classList.contains("is-active"));
  if (index < 0) index = 0;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  if (isMobile) {
    const realSlides = slides.slice();
    const realByKey = new Map(realSlides.map((s) => [s.dataset.key, s]));
    const realIndexByKey = new Map(realSlides.map((s, i) => [s.dataset.key, i]));
    const len = realSlides.length;
    let allSlides = realSlides.slice();
    let headClones = [];
    let tailClones = [];
    let scrollRaf = null;
    let scrollEndTimer = null;
    let timerId = null;
    let paused = false;
    let suppressClickUntil = 0;
    let virtualIndex = index;
    let animToken = 0;
    let animating = false;
    const SLIDE_MS = 200;
    const SNAP_TYPE = "x mandatory";
    const setSnap = (on) => {
      viewport.style.scrollSnapType = on ? SNAP_TYPE : "none";
    };
    const getSwipeMin = () =>
      Math.max(12, Math.min(28, Math.round(viewport.clientWidth * 0.045)));

    const setActiveByKey = (key) => {
      allSlides.forEach((s) => {
        const matchKey = s.dataset.cloneFor || s.dataset.key;
        s.classList.toggle("is-active", matchKey === key);
      });

      infos.forEach((info) => info.classList.toggle("is-active", info.dataset.key === key));
    };

    const setIndexByKey = (key) => {
      const next = realIndexByKey.get(key);
      if (typeof next === "number") index = next;
    };

    const normalizeIndex = (v) => ((v % len) + len) % len;

    const scrollToSlide = (slide, behavior = "smooth") => {
      if (!slide) return;
      const vw = viewport.clientWidth;
      const max = viewport.scrollWidth - vw;
      if (max <= 0) return;

      const center = slide.offsetLeft + slide.offsetWidth / 2;
      let target = center - vw / 2;
      target = clamp(target, 0, max);

      if (behavior === "auto") {
        animToken += 1;
        animating = false;
        if (scrollEndTimer) {
          clearTimeout(scrollEndTimer);
          scrollEndTimer = null;
        }
        viewport.scrollLeft = target;
        setSnap(true);
        rebaseToReal();
      } else {
        if (scrollEndTimer) {
          clearTimeout(scrollEndTimer);
          scrollEndTimer = null;
        }
        setSnap(false);
        const start = viewport.scrollLeft;
        const delta = target - start;
        if (Math.abs(delta) < 0.5 || SLIDE_MS <= 0) {
          viewport.scrollLeft = target;
          return;
        }

        const token = ++animToken;
        animating = true;
        const t0 = performance.now();

        const easeInOut = (t) =>
          t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        const step = (now) => {
          if (token !== animToken) return;
          const p = Math.min(1, (now - t0) / SLIDE_MS);
          const eased = easeInOut(p);
          viewport.scrollLeft = start + delta * eased;
          if (p < 1) {
            requestAnimationFrame(step);
          } else {
            animating = false;
            setSnap(true);
            rebaseToReal();
          }
        };

        requestAnimationFrame(step);
      }
    };

    const ensureClones = () => {
      if (track.querySelector(".doctor3-slide[data-clone-for]")) {
        allSlides = Array.from(track.querySelectorAll(".doctor3-slide"));
        return;
      }

      const firstReal = realSlides[0];
      const endSpacer = track.querySelector(".doctor3-spacer:last-of-type");

      const headFrag = document.createDocumentFragment();
      const tailFrag = document.createDocumentFragment();
      const head = [];
      const tail = [];

      realSlides.forEach((s, i) => {
        const clone = s.cloneNode(true);
        clone.dataset.cloneFor = s.dataset.key || "";
        clone.dataset.clonePos = "head";
        clone.dataset.cloneIndex = String(i);
        clone.classList.remove("is-active");
        clone.setAttribute("aria-hidden", "true");
        clone.tabIndex = -1;
        head.push(clone);
        headFrag.appendChild(clone);
      });

      realSlides.forEach((s, i) => {
        const clone = s.cloneNode(true);
        clone.dataset.cloneFor = s.dataset.key || "";
        clone.dataset.clonePos = "tail";
        clone.dataset.cloneIndex = String(i);
        clone.classList.remove("is-active");
        clone.setAttribute("aria-hidden", "true");
        clone.tabIndex = -1;
        tail.push(clone);
        tailFrag.appendChild(clone);
      });

      track.insertBefore(headFrag, firstReal);
      track.insertBefore(tailFrag, endSpacer || null);

      headClones = head;
      tailClones = tail;
      allSlides = Array.from(track.querySelectorAll(".doctor3-slide"));
    };

    const setActive = (nextIndex, behavior = "smooth") => {
      virtualIndex = nextIndex;
      index = normalizeIndex(virtualIndex);

      const key = realSlides[index].dataset.key;
      setActiveByKey(key);

      let target = realSlides[index];
      if (virtualIndex >= len && tailClones.length) target = tailClones[index];
      if (virtualIndex < 0 && headClones.length) target = headClones[index];

      scrollToSlide(target, behavior);
    };

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
        setActive(virtualIndex + 1, "smooth");
        scheduleNext();
      }, 5000);
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

    const markSuppressClick = () => {
      suppressClickUntil = Date.now() + 240;
    };

    realSlides.forEach((s, i) => {
      s.addEventListener("click", (e) => {
        if (Date.now() < suppressClickUntil) return;
        e.preventDefault();
        setActive(i, "smooth");
        restart();
      });
    });

    const INTENT_MIN = 2;
    const SWIPE_AXIS = 0.6;
    let swipeActive = false;
    let swipeStartX = 0;
    let swipeStartY = 0;
    let swipeStartT = 0;
    let swipeIntent = null;
    let swipeStartScroll = 0;
    let swipeBaseIndex = 0;
    let swipeMaxX = 0;
    let swipeMaxY = 0;
    let swipeLastX = 0;
    let swipeLastT = 0;
    let swipePeakV = 0;
    let swipeMaxDx = 0;
    let swipeMinDx = 0;
    let swipePeakVX = 0;
    const rebaseToReal = () => {
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let best = null;
      let bestDist = Infinity;

      allSlides.forEach((s) => {
        const slideCenter = s.offsetLeft + s.offsetWidth / 2;
        const dist = Math.abs(center - slideCenter);
        if (dist < bestDist) {
          bestDist = dist;
          best = s;
        }
      });

      if (!best || !best.dataset.cloneFor) return;
      const key = best.dataset.cloneFor || best.dataset.key;
      const real = realByKey.get(key);
      if (!real) return;

      const delta = best.offsetLeft - real.offsetLeft;
      if (Math.abs(delta) < 1) return;

      viewport.classList.add("no-scale-anim");
      setSnap(false);
      const prevBehavior = viewport.style.scrollBehavior;
      viewport.style.scrollBehavior = "auto";
      viewport.scrollLeft -= delta;
      viewport.style.scrollBehavior = prevBehavior || "";
      setSnap(true);
      requestAnimationFrame(() => viewport.classList.remove("no-scale-anim"));

      const realIdx = realIndexByKey.get(key);
      if (typeof realIdx === "number") {
        virtualIndex = realIdx;
        index = normalizeIndex(virtualIndex);
      }
    };

    const getBaseVirtualFromView = () => {
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let best = null;
      let bestDist = Infinity;

      allSlides.forEach((s) => {
        const slideCenter = s.offsetLeft + s.offsetWidth / 2;
        const dist = Math.abs(center - slideCenter);
        if (dist < bestDist) {
          bestDist = dist;
          best = s;
        }
      });

      if (!best) return virtualIndex;
      const key = best.dataset.cloneFor || best.dataset.key;
      const realIdx = realIndexByKey.get(key);
      if (typeof realIdx !== "number") return virtualIndex;

      if (best.dataset.cloneFor) {
        return best.dataset.clonePos === "head" ? realIdx - len : realIdx + len;
      }
      return realIdx;
    };

    const onSwipeStart = (x, y) => {
      swipeActive = true;
      swipeIntent = null;
      swipeStartX = x;
      swipeStartY = y;
      swipeStartT = performance.now();
      rebaseToReal();
      swipeStartScroll = viewport.scrollLeft;
      swipeBaseIndex = getBaseVirtualFromView();
      virtualIndex = swipeBaseIndex;
      index = normalizeIndex(virtualIndex);
      setActiveByKey(realSlides[index].dataset.key);
      swipeMaxX = 0;
      swipeMaxY = 0;
      swipeLastX = x;
      swipeLastT = swipeStartT;
      swipePeakV = 0;
      swipeMaxDx = 0;
      swipeMinDx = 0;
      swipePeakVX = 0;
      stop();
      animToken += 1;
      animating = false;
      if (scrollEndTimer) {
        clearTimeout(scrollEndTimer);
        scrollEndTimer = null;
      }
      setSnap(false);
    };

    const onSwipeMove = (x, y, e) => {
      if (!swipeActive) return;
      const dx = x - swipeStartX;
      const dy = y - swipeStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      swipeMaxX = Math.max(swipeMaxX, absX);
      swipeMaxY = Math.max(swipeMaxY, absY);
      const now = performance.now();
      const dtMove = Math.max(1, now - swipeLastT);
      const v = Math.abs(x - swipeLastX) / dtMove;
      if (v > swipePeakV) swipePeakV = v;
      const vx = (x - swipeLastX) / dtMove;
      if (Math.abs(vx) > Math.abs(swipePeakVX)) swipePeakVX = vx;
      swipeLastX = x;
      swipeLastT = now;
      swipeMaxDx = Math.max(swipeMaxDx, dx);
      swipeMinDx = Math.min(swipeMinDx, dx);
      if (!swipeIntent) {
        if (absX < INTENT_MIN && absY < INTENT_MIN) return;
        swipeIntent = absX >= absY * SWIPE_AXIS ? "x" : "y";
      }
      if (swipeIntent === "x") {
        viewport.scrollLeft = swipeStartScroll - dx;
        e?.preventDefault?.();
      }
    };

    const onSwipeEnd = (x, y) => {
      if (!swipeActive) return;
      swipeActive = false;

      const dx = x - swipeStartX;
      const dy = y - swipeStartY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const SWIPE_MIN = getSwipeMin();
      const dt = Math.max(1, performance.now() - swipeStartT);
      const velocity = Math.max(absX, swipeMaxX) / dt;
      const isHorizontal =
        swipeIntent === "x" ||
        swipeMaxX >= swipeMaxY * 0.4 ||
        absX >= absY * 0.4;
      const minMove = swipeMaxX >= 3 || absX >= 3;
      const enoughDistance = swipeMaxX >= SWIPE_MIN || absX >= SWIPE_MIN;
      const fastSwipe = swipePeakV >= 0.22 || velocity >= 0.25;
      const shortFlick = dt <= 160 && (swipeMaxX >= 4 || absX >= 4);
      const horizIntent = swipeIntent === "x" && (swipeMaxX >= 2 || absX >= 2);
      let dirDx = dx;
      const maxAbsDx = Math.abs(swipeMaxDx) >= Math.abs(swipeMinDx) ? swipeMaxDx : swipeMinDx;
      if (Math.abs(maxAbsDx) >= 6) dirDx = maxAbsDx;
      else if (Math.abs(swipePeakVX) > 0.25) dirDx = swipePeakVX;
      else if (Math.abs(maxAbsDx) >= 2) dirDx = maxAbsDx;

      if ((horizIntent) || (isHorizontal && minMove && (enoughDistance || fastSwipe || shortFlick))) {
        markSuppressClick();
        setActive(swipeBaseIndex + (dirDx < 0 ? 1 : -1), "smooth");
        restart();
        return;
      }

      setActive(swipeBaseIndex, "smooth");
      restart();
    };

    const onSwipeCancel = () => {
      if (!swipeActive) return;
      swipeActive = false;
      setSnap(true);
      restart();
    };

    if ("PointerEvent" in window) {
      viewport.addEventListener("pointerdown", (e) => {
        if (e.pointerType !== "mouse") return;
        if (e.button !== 0) return;
        onSwipeStart(e.clientX, e.clientY);
      });

      viewport.addEventListener(
        "pointermove",
        (e) => {
          if (!swipeActive) return;
          if (e.pointerType !== "mouse") return;
          onSwipeMove(e.clientX, e.clientY, e);
        },
        { passive: false }
      );

      viewport.addEventListener("pointerup", (e) => {
        if (e.pointerType !== "mouse") return;
        onSwipeEnd(e.clientX, e.clientY);
      });

      viewport.addEventListener("pointercancel", (e) => {
        if (e.pointerType !== "mouse") return;
        onSwipeCancel();
      });
    }

    viewport.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length !== 1) return;
        const t = e.touches[0];
        onSwipeStart(t.clientX, t.clientY);
      },
      { passive: true }
    );

    viewport.addEventListener(
      "touchmove",
      (e) => {
        if (!swipeActive) return;
        if (e.touches.length !== 1) return;
        const t = e.touches[0];
        onSwipeMove(t.clientX, t.clientY, e);
      },
      { passive: false }
    );

    viewport.addEventListener(
      "touchend",
      (e) => {
        const t = e.changedTouches[0];
        if (!t) {
          onSwipeCancel();
          return;
        }
        onSwipeEnd(t.clientX, t.clientY);
      },
      { passive: true }
    );

    viewport.addEventListener("touchcancel", () => {
      onSwipeCancel();
    }, { passive: true });

    const getCenterSlide = () => {
      const center = viewport.scrollLeft + viewport.clientWidth / 2;
      let best = null;
      let bestDist = Infinity;

      allSlides.forEach((s) => {
        const slideCenter = s.offsetLeft + s.offsetWidth / 2;
        const dist = Math.abs(center - slideCenter);
        if (dist < bestDist) {
          bestDist = dist;
          best = s;
        }
      });

      return best;
    };

    const scheduleScrollEnd = () => {
      if (scrollEndTimer) clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(() => {
        scrollEndTimer = null;
        const best = getCenterSlide();
        if (!best) return;
        const key = best.dataset.cloneFor || best.dataset.key;
        if (!key) return;
        setActiveByKey(key);
        setIndexByKey(key);

        const realIdx = realIndexByKey.get(key);
        if (typeof realIdx === "number") {
          if (best.dataset.cloneFor) {
            virtualIndex =
              best.dataset.clonePos === "head" ? realIdx - len : realIdx + len;
          } else {
            virtualIndex = realIdx;
          }
        }

        rebaseToReal();
        restart();
      }, 120);
    };

    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        if (animating) return;
        const best = getCenterSlide();
        if (best) {
          const key = best.dataset.cloneFor || best.dataset.key;
          if (key) {
            setActiveByKey(key);
            if (!swipeActive) {
              setIndexByKey(key);
              const realIdx = realIndexByKey.get(key);
              if (typeof realIdx === "number") {
                if (best.dataset.cloneFor) {
                  virtualIndex =
                    best.dataset.clonePos === "head" ? realIdx - len : realIdx + len;
                } else {
                  virtualIndex = realIdx;
                }
              }
            }
          }
        }
        if (!swipeActive) scheduleScrollEnd();
      });
    };

    viewport.addEventListener("scroll", onScroll, { passive: true });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else start();
    });

    const onResize = window.__PH.rafThrottle(() => {
      scrollToSlide(realSlides[index], "auto");
      viewport.style.touchAction = "pan-y";
      setSnap(true);
    });
    window.addEventListener("resize", onResize, { passive: true });

    ensureClones();
    viewport.style.touchAction = "pan-y";
    setSnap(true);
    setActiveByKey(realSlides[index].dataset.key);
    scrollToSlide(realSlides[index], "auto");
    start();
    return;
  }

  const alignToActive = () => {
    const active = slides[index];
    if (!active) return;

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
    }, 5000);
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
   Navbar: iOS top bounce sync
   - rubber banding 구간에서 sticky header가 본문과 함께 움직이도록 보정
   ================================ */
function initNavbarBounceSync() {
  const header = document.querySelector("header.sticky-top");
  const nav = document.querySelector(".navbar.navbar-transparent");
  if (!header) return;

  const root = document.documentElement;
  const scroller = document.scrollingElement || root;
  const vv = window.visualViewport || null;
  const isIOS = root.classList.contains("ua-ios");
  const navIsFixed = !!nav && window.getComputedStyle(nav).position === "fixed";
  const target = navIsFixed ? nav : header;
  window.__PH = window.__PH || {};

  let prevTop = -1;
  let prevBottom = -1;
  let prevActive = null;
  let applyRAF = null;
  const EPS = 1.5;

  const publishRubber = (topPull, bottomPull) => {
    const top = Math.max(0, Math.round(topPull || 0));
    const bottom = Math.max(0, Math.round(bottomPull || 0));
    const active = top > 0 || bottom > 0;

    if (active === prevActive && top === prevTop && bottom === prevBottom) return;
    prevActive = active;
    prevTop = top;
    prevBottom = bottom;

    root.classList.toggle("ios-rubber-band", active);
    root.style.setProperty("--ios-rubber-top", `${top}px`);
    root.style.setProperty("--ios-rubber-bottom", `${bottom}px`);

    window.__PH.iosRubberBanding = { active, top, bottom };
    window.dispatchEvent(
      new CustomEvent("ph:ios-rubberband", {
        detail: { active, top, bottom }
      })
    );
  };

  const clearOffset = () => {
    target.style.removeProperty("top");
    root.style.setProperty("--vv-top-offset", "0px");
    publishRubber(0, 0);
  };

  if (!isIOS) {
    clearOffset();
    return;
  }

  const measure = () => {
    const rect = scroller.getBoundingClientRect();
    const viewportH = Math.round(window.innerHeight || root.clientHeight || 0);

    const vvOffsetTop = vv ? Math.max(0, Math.round(vv.offsetTop || 0)) : 0;
    const vvPageTop = vv && typeof vv.pageTop === "number" ? vv.pageTop : 0;
    const vvTopPull = vvPageTop < -EPS ? Math.round(Math.abs(vvPageTop)) : 0;

    const docTopPull = rect.top > EPS ? Math.round(rect.top) : 0;
    const docBottomPull =
      viewportH > 0 && rect.bottom < viewportH - EPS
        ? Math.round(viewportH - rect.bottom)
        : 0;

    return {
      topOffset: Math.max(vvOffsetTop, vvTopPull, docTopPull),
      bottomPull: Math.max(0, docBottomPull)
    };
  };

  const apply = () => {
    applyRAF = null;
    const { topOffset, bottomPull } = measure();
    target.style.top = `${topOffset}px`;
    root.style.setProperty("--vv-top-offset", `${topOffset}px`);
    publishRubber(topOffset, bottomPull);
  };

  const queueApply = () => {
    if (applyRAF) return;
    applyRAF = requestAnimationFrame(apply);
  };

  const tick = () => {
    if (!document.hidden) {
      queueApply();
    }
    requestAnimationFrame(tick);
  };

  apply();
  tick();
  window.addEventListener("scroll", queueApply, { passive: true });
  window.addEventListener("resize", queueApply, { passive: true });
  window.addEventListener("orientationchange", queueApply, { passive: true });
  window.addEventListener("pageshow", queueApply, { passive: true });
  document.addEventListener("visibilitychange", queueApply, { passive: true });
  if (vv) {
    vv.addEventListener("scroll", queueApply, { passive: true });
    vv.addEventListener("resize", queueApply, { passive: true });
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
  const vv = window.visualViewport;
  const isIOS = document.documentElement.classList.contains("ua-ios");
  const isRubberBanding = () => !!window.__PH?.iosRubberBanding?.active;
  const isViewportShifted = () => {
    if (!isIOS || !vv) return false;
    const offsetTop = Math.max(0, Number(vv.offsetTop || 0));
    const pageTop = typeof vv.pageTop === "number" ? vv.pageTop : 0;
    return offsetTop > 1 || pageTop < -1;
  };
  let lastViewportMotion = 0;
  const markViewportMotion = () => {
    lastViewportMotion = performance.now();
  };
  const isViewportSettling = () => performance.now() - lastViewportMotion < 180;

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
  const clearCloseTimer = () => {
    if (!t) return;
    clearTimeout(t);
    t = null;
  };

  const open = () => {
    if (!MQ.matches) return;
    if (isIOS && isRubberBanding()) return;
    clearCloseTimer();
    header.classList.add("mega-open");
    syncLayoutRAF();
  };

  const close = () => {
    if (!MQ.matches) return;
    if (isIOS && isViewportSettling()) {
      clearCloseTimer();
      return;
    }
    if (isIOS && (isViewportShifted() || isRubberBanding())) {
      clearCloseTimer();
      return;
    }
    clearCloseTimer();
    t = setTimeout(() => header.classList.remove("mega-open"), 90);
  };

  navWrap.addEventListener("mouseenter", open);
  mega.addEventListener("mouseenter", open);
  navWrap.addEventListener("mouseleave", close);
  mega.addEventListener("mouseleave", close);
  if (isIOS) {
    window.addEventListener("scroll", markViewportMotion, { passive: true });
    window.addEventListener("resize", markViewportMotion, { passive: true });
    if (vv) {
      vv.addEventListener("scroll", markViewportMotion, { passive: true });
      vv.addEventListener("resize", markViewportMotion, { passive: true });
    }

    window.addEventListener("ph:ios-rubberband", (e) => {
      if (!MQ.matches) return;
      if (!header.classList.contains("mega-open")) return;
      if (e?.detail?.active) {
        clearCloseTimer();
      }
    });
  }

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
   Scroll safety (desktop unlock)
   ================================ */
function initScrollSafety() {
  if (window.__scrollSafetyInit) return;
  window.__scrollSafetyInit = true;
  const mq = window.matchMedia("(max-width: 991.98px)");

  const unlockDesktop = () => {
    if (mq.matches) return;
    if (document.body.classList.contains("nav-lock")) {
      document.body.classList.remove("nav-lock");
    }
    document.body.__mnavScrollLocked = false;
    if (document.documentElement.style.overscrollBehavior) {
      document.documentElement.style.overscrollBehavior = "";
    }
  };

  const ensureScrollable = () => {
    if (mq.matches) return;
    if (document.body.classList.contains("modal-open")) return;
    if (document.body.classList.contains("nav-lock")) return;
    const style = getComputedStyle(document.body);
    if (style.overflowY === "hidden" || style.overflow === "hidden") {
      document.body.style.overflowY = "auto";
    }
  };

  const ensureMobileUnlock = () => {
    if (!mq.matches) return;
    const topNav = document.getElementById("topNav");
    const navOpen =
      topNav &&
      (topNav.classList.contains("show") ||
        topNav.classList.contains("mnav-nav-closing") ||
        topNav.classList.contains("mnav-nav-closing-run"));
    const modalOpen = !!document.querySelector(".modal.show");
    if (!navOpen && !modalOpen) {
      document.body.classList.remove("nav-lock");
      document.body.__mnavScrollLocked = false;
      if (document.documentElement.style.overscrollBehavior) {
        document.documentElement.style.overscrollBehavior = "";
      }
    }
  };

  unlockDesktop();
  ensureScrollable();

  mq.addEventListener?.("change", () => {
    unlockDesktop();
    ensureScrollable();
    ensureMobileUnlock();
  });

  window.addEventListener(
    "resize",
    () => {
      unlockDesktop();
      ensureScrollable();
      ensureMobileUnlock();
    },
    { passive: true }
  );

  window.addEventListener("orientationchange", ensureMobileUnlock, { passive: true });
  window.addEventListener("touchstart", ensureMobileUnlock, { passive: true });

  ensureMobileUnlock();
}

/* ================================
   Modal scroll unlock (Bootstrap)
   ================================ */
function initModalScrollFix() {
  if (window.__modalScrollFixInit) return;
  window.__modalScrollFixInit = true;

  const cleanup = () => {
    if (document.querySelector(".modal.show")) return;
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("overflow");
    document.body.style.removeProperty("padding-right");
  };

  document.addEventListener("hidden.bs.modal", cleanup);
  cleanup();
}

/* ================================
   Boot
   ================================ */
document.addEventListener("DOMContentLoaded", () => {
  initUserAgentFlags();
  initNavbarBounceSync();
  initTreat2();
  initHeroIndicators();
  initHeroScrollHint();
  initHomeBackToTop();
  initDoctorSlider();
  initScrollReveal();
  initTabsFadeReplay();
  initNavbarHomeTransparent();
  initMegaMenu();
  initScrollSafety();
  initModalScrollFix();
});

/* =========================================================
   Portfolio Hospital - MAIN.JS (MOBILE NAV STABLE FINAL)
   - PC 영향 최소화: 모바일(<=991.98px)에서만 커스텀
   - Bootstrap collapse는 PC에서 그대로 사용
   - Mobile:
     1) 토글 버튼의 data-bs-toggle/target을 모바일에서만 제거(Bootstrap 클릭 토글 차단)
     2) inst.show()/inst.hide()는 우리가 타이밍 제어(닫힘 애니메이션 후 hide)
     3) 상위메뉴 클릭 → 오른쪽 패널 하위메뉴 스왑
     4) 스위칭 중 작대기 고정, 패널만 살짝 접기
   ========================================================= */
(() => {
  "use strict";

  const mq = window.matchMedia("(max-width: 991.98px)");
  const isMobile = () => mq.matches;
  const ua = navigator.userAgent || "";
  const isKakao = () => /KAKAOTALK|KAKAO|DaumApps/i.test(ua);
  const isAndroidChrome = () => /Android/i.test(ua) && /Chrome/i.test(ua);

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  function initMobileMegaNavFinal() {
    const topNav = document.getElementById("topNav");
    if (!topNav) return;

    const panel = document.getElementById("mobileMegaPanel");
    const head = document.getElementById("mnavPanelHead");
    const body = document.getElementById("mnavPanelBody");
    if (!panel || !head || !body) return;

    const toggler = document.querySelector('.navbar-toggler[data-bs-target="#topNav"]');
    if (!toggler) return;

    const triggers = Array.from(
      topNav.querySelectorAll('.nav-mega-link[data-mobile-acc-btn="1"][data-mega-key]')
    );
    if (!triggers.length) return;

    const navList = topNav.querySelector(".navbar-nav");

    if (topNav.__mnavFinalBound) return;
    topNav.__mnavFinalBound = true;

    const inst = bootstrap.Collapse.getOrCreateInstance(topNav, { toggle: false });

    const NAV_CLOSE_MS = 320; // CSS --mnav-close-ms
    const OPEN_ANIM_MS = 420;
    const SWITCH_MS = 170;
    const PANEL_CLOSE_MS = 220;
    let navHideTimer = 0;
    let suppressNextOutsideClick = false;
    let suppressOutsideClickTimer = 0;

    const clearOutsideClickSuppress = () => {
      suppressNextOutsideClick = false;
      if (suppressOutsideClickTimer) {
        window.clearTimeout(suppressOutsideClickTimer);
        suppressOutsideClickTimer = 0;
      }
    };

    const armOutsideClickSuppress = () => {
      suppressNextOutsideClick = true;
      if (suppressOutsideClickTimer) window.clearTimeout(suppressOutsideClickTimer);
      suppressOutsideClickTimer = window.setTimeout(() => {
        suppressNextOutsideClick = false;
        suppressOutsideClickTimer = 0;
      }, 420);
    };

    const cancelNavClosing = () => {
      if (navHideTimer) {
        window.clearTimeout(navHideTimer);
        navHideTimer = 0;
      }
      topNav.__navClosing = false;
      topNav.classList.remove("mnav-nav-closing", "mnav-nav-closing-run", "mnav-closing");
    };

    /* ---------------------------------------------------------
       ✅ 0) 스크롤 고정/복원 (플리커 방지: rAF 사용 금지)
       --------------------------------------------------------- */
    // ✅ fixed 방식 제거: 이미지 섹션에서 white flash 방지
    let savedScrollY = 0;

    const lockScrollPreserve = () => {
      if (document.body.__mnavScrollLocked) return;
      document.body.__mnavScrollLocked = true;

      savedScrollY = window.scrollY || window.pageYOffset || 0;

      // ✅ 스크롤 잠금은 overflow로만
      document.body.classList.add("nav-lock");

      // ✅ iOS에서 rubber-band 스크롤 튐 방지(선택)
      document.documentElement.style.overscrollBehavior = "none";
    };

    const unlockScrollPreserve = () => {
      if (!document.body.__mnavScrollLocked) return;
      document.body.__mnavScrollLocked = false;

      // ✅ 먼저 잠금 해제
      document.body.classList.remove("nav-lock");
      document.documentElement.style.overscrollBehavior = "";

      // ✅ 원래 위치 복원 (smooth 금지)
      const prev = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      window.scrollTo(0, savedScrollY);
      document.documentElement.style.scrollBehavior = prev || "";
    };

    /* ---------------------------------------------------------
       1) 모바일에서 Bootstrap 클릭 토글 원천 차단 (PC는 복원)
       --------------------------------------------------------- */
    if (!toggler.__bsAttrsSaved) {
      toggler.__bsAttrsSaved = true;
      toggler.__bsToggle = toggler.getAttribute("data-bs-toggle");
      toggler.__bsTarget = toggler.getAttribute("data-bs-target");
    }

    const disableBootstrapClickToggle = () => {
      toggler.removeAttribute("data-bs-toggle");
      toggler.removeAttribute("data-bs-target");
    };

    const restoreBootstrapClickToggle = () => {
      if (toggler.__bsToggle) toggler.setAttribute("data-bs-toggle", toggler.__bsToggle);
      if (toggler.__bsTarget) toggler.setAttribute("data-bs-target", toggler.__bsTarget);
    };

    const applyToggleMode = () => {
      if (isMobile()) disableBootstrapClickToggle();
      else restoreBootstrapClickToggle();
    };

    applyToggleMode();

    /* ---------------------------------------------------------
       2) 하위메뉴 캐시
       --------------------------------------------------------- */
    triggers.forEach((t) => t.classList.add("has-mobile-sub"));

    const cache = new Map();
    triggers.forEach((t) => {
      const key = t.getAttribute("data-mega-key");
      const src = topNav.querySelector(`.mobile-mega-src[data-mega-src="${key}"]`);
      if (!src) return;

      const frag = document.createDocumentFragment();
      src.querySelectorAll("a").forEach((a) => frag.appendChild(a.cloneNode(true)));
      cache.set(key, frag);
    });

    const resetLeft = () => {
      triggers.forEach((t) => {
        t.classList.remove("is-open");
        t.setAttribute("aria-expanded", "false");
      });
    };

    const setEmpty = (on) => topNav.classList.toggle("mnav-empty", on);

    const pickTriggerByY = (clientY) => {
      if (!navList) return null;
      const rows = [...triggers];
      const reserve = navList.querySelector(".nav-reserve");
      if (reserve) rows.push(reserve);
      navList.querySelectorAll(".mobile-auth a").forEach((a) => rows.push(a));

      let best = null;
      let bestDist = Infinity;
      for (const t of rows) {
        const r = t.getBoundingClientRect();
        if (clientY >= r.top && clientY <= r.bottom) return t;
        const center = (r.top + r.bottom) / 2;
        const dist = Math.abs(clientY - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = t;
        }
      }
      const listRect = navList.getBoundingClientRect();
      if (clientY < listRect.top || clientY > listRect.bottom) return null;
      return best;
    };

    /* ---------------------------------------------------------
       3) 햄버거 open/close
       --------------------------------------------------------- */
    const openHamburger = () => {
      if (!isMobile()) return;
      if (topNav.__navClosing) cancelNavClosing();

      // ✅ 터치 표시/포커스 남음 방지
      document.activeElement?.blur?.();
      toggler.blur();

      lockScrollPreserve();

      topNav.classList.remove("mnav-nav-closing", "mnav-nav-closing-run");
      inst.show();
      toggler.setAttribute("aria-expanded", "true");
    };

    const closeHamburger = () => {
      if (!isMobile()) return;
      if (topNav.__navClosing) return;
      topNav.__navClosing = true;

      // ✅ 닫을 때도 포커스/터치 표시 제거
      document.activeElement?.blur?.();
      toggler.blur();

      topNav.classList.add("mnav-nav-closing");
      topNav.classList.remove("mnav-nav-closing-run");

      topNav.classList.add("mnav-closing");
      topNav.classList.remove("mnav-opening", "mnav-switching-out", "mnav-switching-in");

      requestAnimationFrame(() => {
        topNav.classList.add("mnav-nav-closing-run");
      });

      if (navHideTimer) window.clearTimeout(navHideTimer);
      navHideTimer = window.setTimeout(() => {
        navHideTimer = 0;
        inst.hide();
      }, NAV_CLOSE_MS);

      toggler.setAttribute("aria-expanded", "false");
    };

    if (!toggler.__mnavClickBound) {
      toggler.__mnavClickBound = true;

      toggler.addEventListener(
        "click",
        (e) => {
          if (!isMobile()) return;

          e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

          // ✅ 클릭 직후에도 남는 포커스 제거(모바일에서 종종 필요)
          setTimeout(() => {
            document.activeElement?.blur?.();
            toggler.blur();
          }, 0);

          if (topNav.__navClosing) {
            openHamburger();
            return;
          }

          const isShown = topNav.classList.contains("show");
          if (isShown) closeHamburger();
          else openHamburger();
        },
        true
      );
    }

    if (!topNav.__mnavDocCloseBound) {
      topNav.__mnavDocCloseBound = true;
      const docClose = (e) => {
        if (e.type === "click" && suppressNextOutsideClick) {
          const target = e.target;
          clearOutsideClickSuppress();
          if (target && target.closest(".navbar-toggler")) return;
          if (e.cancelable) e.preventDefault();
          e.stopPropagation();
          if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();
          return;
        }

        if (!isMobile()) return;
        if (!topNav.classList.contains("show")) return;
        const target = e.target;
        if (!target) return;
        if (target.closest("#topNav")) return;
        if (target.closest(".navbar-toggler")) return;

        // Close-on-outside should not click-through to underlying links.
        if (e.type === "touchstart") armOutsideClickSuppress();
        if (e.cancelable) e.preventDefault();
        e.stopPropagation();
        if (typeof e.stopImmediatePropagation === "function") e.stopImmediatePropagation();

        closeHamburger();
      };
      document.addEventListener("click", docClose, true);
      document.addEventListener("touchstart", docClose, { passive: false, capture: true });
    }

    /* ---------------------------------------------------------
       4) 오른쪽 패널(하위메뉴) 열기/스위칭/닫기
       --------------------------------------------------------- */
    let switching = false;
    let closeTimer = 0;

    const setSwitching = (on) => {
      switching = on;
      topNav.classList.toggle("nav-switching", on);
    };

    const resetForDesktop = () => {
      if (isMobile()) return;
      cancelNavClosing();
      clearOutsideClickSuppress();
      topNav.classList.remove(
        "mnav-has-open",
        "mnav-closing",
        "mnav-opening",
        "nav-switching",
        "mnav-switching-out",
        "mnav-switching-in",
        "mnav-nav-closing",
        "mnav-nav-closing-run"
      );
      resetLeft();
      setSwitching(false);
      head.textContent = "";
      body.replaceChildren();
      setEmpty(true);
      topNav.__navClosing = false;
      document.body.classList.remove("nav-lock");
      document.body.__mnavScrollLocked = false;
      document.documentElement.style.overscrollBehavior = "";
      if (topNav.classList.contains("show")) inst.hide();
    };

    const handleToggleChange = () => {
      applyToggleMode();
      resetForDesktop();
    };

    mq.addEventListener?.("change", handleToggleChange);
    window.addEventListener("resize", handleToggleChange, { passive: true });

    resetForDesktop();

    const playOpenAnim = (onlyPanel = false) => {
      topNav.classList.add("mnav-has-open");
      topNav.classList.remove("mnav-closing", "mnav-switching-out");

      if (onlyPanel) return;

      topNav.classList.remove("mnav-opening");
      void topNav.offsetWidth;
      topNav.classList.add("mnav-opening");
      window.setTimeout(() => topNav.classList.remove("mnav-opening"), OPEN_ANIM_MS);
    };

    const openWith = (t) => {
      const key = t.getAttribute("data-mega-key");
      const frag = cache.get(key);
      if (!frag) return;

      window.clearTimeout(closeTimer);
      topNav.classList.remove("mnav-closing");
      setSwitching(false);

      const wasOpen = topNav.classList.contains("mnav-has-open");

      resetLeft();
      t.classList.add("is-open");
      t.setAttribute("aria-expanded", "true");

      const applyContent = () => {
        head.textContent = "";
        body.replaceChildren(frag.cloneNode(true));
        setEmpty(false);
      };

      if (wasOpen) {
        setSwitching(true);
        topNav.classList.remove("mnav-opening");
        topNav.classList.add("mnav-switching-out");

        window.setTimeout(() => {
          applyContent();

          topNav.classList.remove("mnav-switching-in");
          void topNav.offsetWidth;
          topNav.classList.add("mnav-switching-in");
          window.setTimeout(() => topNav.classList.remove("mnav-switching-in"), OPEN_ANIM_MS);

          topNav.classList.add("mnav-has-open");
          topNav.classList.remove("mnav-closing", "mnav-switching-out");
          setSwitching(false);
        }, SWITCH_MS);
      } else {
        applyContent();
        playOpenAnim(false);
      }

      t.blur();
    };

    const closePanel = () => {
      if (!topNav.classList.contains("mnav-has-open")) return;

      setSwitching(true);
      topNav.classList.add("mnav-closing");

      closeTimer = window.setTimeout(() => {
        topNav.classList.remove("mnav-has-open", "mnav-closing", "mnav-opening");
        resetLeft();
        setSwitching(false);

        head.textContent = "";
        body.replaceChildren();
        setEmpty(true);
      }, PANEL_CLOSE_MS);
    };

    topNav.addEventListener(
      "click",
      (e) => {
        if (!isMobile()) return;

        let t = e.target.closest('.nav-mega-link[data-mobile-acc-btn="1"][data-mega-key]');
        if (!t) {
          if (!topNav.classList.contains("show") || !topNav.classList.contains("mnav-empty")) return;
          if (e.target.closest("a, button, input, select, textarea, label")) return;
          const picked = pickTriggerByY(e.clientY);
          if (!picked) return;
          if (!picked.classList.contains("nav-mega-link")) {
            picked.click();
            closeHamburger();
            return;
          }
          t = picked;
        }

        e.preventDefault();
        e.stopPropagation();

        if (switching) return;

        const isAlready =
          t.classList.contains("is-open") && topNav.classList.contains("mnav-has-open");

        if (isAlready) {
          closePanel();
          return;
        }

        openWith(t);
      },
      true
    );

    panel.addEventListener("click", (e) => {
      if (!isMobile()) return;
      const a = e.target.closest("a");
      if (!a) return;
      closeHamburger();
    });

    /* ---------------------------------------------------------
       5) collapse 이벤트 동기화 + 스크롤락
       --------------------------------------------------------- */
    topNav.addEventListener("shown.bs.collapse", () => {
      if (!isMobile()) return;

      setEmpty(true);
      topNav.classList.remove("mnav-nav-closing", "mnav-nav-closing-run");
      topNav.classList.remove("mnav-opening");
      void topNav.offsetWidth;
      topNav.classList.add("mnav-opening");
      window.setTimeout(() => topNav.classList.remove("mnav-opening"), OPEN_ANIM_MS);

      document.body.classList.add("nav-lock");
    });

    topNav.addEventListener("hidden.bs.collapse", () => {
      if (navHideTimer) {
        window.clearTimeout(navHideTimer);
        navHideTimer = 0;
      }
      clearOutsideClickSuppress();
      window.clearTimeout(closeTimer);
      topNav.classList.remove(
        "mnav-has-open",
        "mnav-closing",
        "mnav-opening",
        "nav-switching",
        "mnav-switching-out",
        "mnav-switching-in",
        "mnav-nav-closing",
        "mnav-nav-closing-run"
      );

      resetLeft();
      setSwitching(false);

      head.textContent = "";
      body.replaceChildren();
      setEmpty(true);

      topNav.__navClosing = false;

      // ✅ 터치 표시/포커스 제거 (끝까지)
      document.activeElement?.blur?.();
      toggler.blur();

      // ✅ 플리커 방지: 먼저 스크롤 복원(동기) → 그 다음 nav-lock 제거
      unlockScrollPreserve();
      document.body.classList.remove("nav-lock");
    });

    head.textContent = "";
    setEmpty(true);
  }
  function applySubNavOffset() {
    const mq = window.matchMedia("(max-width: 991.98px)");
    if (!mq.matches) return;

    const body = document.body;
    if (!body.classList.contains("page-sub")) return;

    const header = document.querySelector("header.sticky-top");
    if (!header) return;

    const pos = window.getComputedStyle(header).position;
    if (pos !== "fixed") {
      body.style.removeProperty("padding-top");
      return;
    }

    const h = Math.ceil(header.getBoundingClientRect().height || 64);

    // ✅ CSS !important를 이기도록 important로 지정
    body.style.setProperty("padding-top", `${h}px`, "important");
  }

  document.addEventListener("DOMContentLoaded", () => {
    applySubNavOffset();
    window.addEventListener("resize", applySubNavOffset, { passive: true });
    window.addEventListener("orientationchange", applySubNavOffset, { passive: true });
  });

  ready(() => {
    initMobileMegaNavFinal();

    // 기존 init들 (있으면 실행)
    const safeCall = (fnName) => {
      const fn = window[fnName];
      if (typeof fn === "function") fn();
    };

    safeCall("initTreat2");
    safeCall("initDoctor");
    safeCall("initDoctorSlider");
  });
})();

