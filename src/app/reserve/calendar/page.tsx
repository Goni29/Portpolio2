"use client";

import { useEffect } from "react";
import SubHero from "@/components/SubHero";
import SubPageWrapper from "@/components/SubPageWrapper";
import Script from "next/script";

const menuItems = [
  { label: "달력예약", slug: "reserve/calendar" },
  { label: "온라인 상담", slug: "reserve/consult" },
];

export default function CalendarPage() {
  useEffect(() => {
    // Calendar initialization runs via inline script below
  }, []);

  return (
    <SubPageWrapper>
      <SubHero
        title="달력예약"
        menuTitle="예약·상담"
        activeSlug="reserve/calendar"
        menuItems={menuItems}
      />

      <section className="sec reserve-cal">
        <div className="container">
          <div className="cal-head">
            <div className="cal-month-wrap">
              <button className="cal-nav" type="button" id="calPrev" aria-label="이전 달">&#8249;</button>
              <div className="cal-month" id="calMonthText">2026년 03월</div>
              <button className="cal-nav" type="button" id="calNext" aria-label="다음 달">&#8250;</button>
            </div>
            <div className="cal-sub">원하시는 예약 날짜를 선택해주세요.</div>
          </div>

          <div className="cal-cta">
            <button className="btn btn-dark cal-confirm" type="button" id="calConfirmBtn">
              <span className="cal-confirm-ico" aria-hidden="true">📅</span>{" "}
              <span className="cal-confirm-txt">예약확인</span>
            </button>
          </div>

          <div className="cal-divider"></div>

          <div className="cal-wrap">
            <div className="cal-week cal-week--head">
              <div className="cal-dow sun">일요일</div>
              <div className="cal-dow">월요일</div>
              <div className="cal-dow">화요일</div>
              <div className="cal-dow">수요일</div>
              <div className="cal-dow">목요일</div>
              <div className="cal-dow">금요일</div>
              <div className="cal-dow sat">토요일</div>
            </div>
            <div className="cal-grid" id="calGrid"></div>
          </div>
        </div>
      </section>

      {/* Confirm Modal */}
      <div className="modal fade" id="confirmModal" tabIndex={-1} aria-hidden="true" data-bs-backdrop="false">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content rsv-modal">
            <div className="modal-header rsv-head">
              <div className="rsv-title">예약자 정보</div>
              <button type="button" className="rsv-x" data-bs-dismiss="modal" aria-label="닫기">&times;</button>
            </div>
            <div className="modal-body rsv-body">
              <form className="rsv-form" id="reserveForm" onSubmit={(e) => e.preventDefault()}>
                <div className="rsv-grid">
                  <div className="rsv-row">
                    <div className="rsv-label">예약 선택일</div>
                    <div className="rsv-field">
                      <input className="rsv-input" id="cfDateInput" readOnly />
                    </div>
                  </div>
                  <div className="rsv-row">
                    <div className="rsv-label">예약 선택 시간</div>
                    <div className="rsv-field">
                      <select className="rsv-input" id="cfTimeSelect">
                        <option value="">예약 시간을 선택해주세요.</option>
                      </select>
                      <svg className="rsv-select-arrow" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                  <div className="rsv-row">
                    <div className="rsv-label">이름</div>
                    <div className="rsv-field">
                      <input className="rsv-input" id="cfName" placeholder="이름" />
                    </div>
                  </div>
                  <div className="rsv-row">
                    <div className="rsv-label">연락처</div>
                    <div className="rsv-field">
                      <input className="rsv-input" id="cfPhone" placeholder="- 를 제외한 숫자만 입력" />
                    </div>
                  </div>
                  <div className="rsv-row">
                    <div className="rsv-label">생년월일</div>
                    <div className="rsv-field">
                      <input className="rsv-input" id="cfBirth" placeholder="생년월일(YYYY-MM-DD)" />
                    </div>
                  </div>
                  <div className="rsv-row">
                    <div className="rsv-label">성별</div>
                    <div className="rsv-field">
                      <div className="rsv-radio">
                        <label className="rsv-radio-item">
                          <input type="radio" name="cfGender" value="남" />
                          <span>남</span>
                        </label>
                        <label className="rsv-radio-item">
                          <input type="radio" name="cfGender" value="여" />
                          <span>여</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="rsv-row">
                    <div className="rsv-label">진료종류</div>
                    <div className="rsv-field">
                      <div className="rsv-radio">
                        <label className="rsv-radio-item">
                          <input type="radio" name="cfVisitType" value="초진" />
                          <span>초진</span>
                        </label>
                        <label className="rsv-radio-item">
                          <input type="radio" name="cfVisitType" value="재진" />
                          <span>재진</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="rsv-row rsv-row--textarea">
                    <div className="rsv-label">희망진료사항</div>
                    <div className="rsv-field">
                      <textarea className="rsv-input rsv-textarea" id="cfMemo" placeholder="증상/요청사항을 간단히 적어주세요."></textarea>
                    </div>
                  </div>
                </div>

                <div className="rsv-note">
                  2024년 5월 20일부터 건강보험 본인확인 의무화 제도가 시행되며 병원 방문 시 신분증을 필수로 제시해주어야합니다.
                </div>

                <div className="rsv-consent">
                  <label className="rsv-check rsv-check--all">
                    <input type="checkbox" id="agreeAll" />
                    <span>모두 동의합니다</span>
                  </label>
                  <div className="rsv-consent-list">
                    <label className="rsv-check">
                      <input type="checkbox" className="agree-item" id="agreeUse" />
                      <span>이용약관 동의 <a href="javascript:void(0)" className="rsv-link">약관보기</a></span>
                    </label>
                    <label className="rsv-check">
                      <input type="checkbox" className="agree-item" id="agreePrivacy" />
                      <span>개인정보 취급방침 동의 <a href="javascript:void(0)" className="rsv-link">약관보기</a></span>
                    </label>
                  </div>
                </div>

                <div className="rsv-actions">
                  <button className="rsv-submit" type="button" id="cfSubmitBtn">예약신청</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Check Modal */}
      <div className="modal fade" id="checkModal" tabIndex={-1} aria-hidden="true" data-bs-backdrop="false">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content rsv-modal">
            <div className="modal-header rsv-head">
              <div className="rsv-title">예약확인</div>
              <button type="button" className="rsv-x" data-bs-dismiss="modal" aria-label="닫기">&times;</button>
            </div>
            <div className="modal-body rsv-body">
              <div id="checkFormWrap">
                <form className="rsv-form" id="checkForm" onSubmit={(e) => e.preventDefault()}>
                  <div className="rsv-grid">
                    <div className="rsv-row">
                      <div className="rsv-label">예약자 이름</div>
                      <div className="rsv-field">
                        <input className="rsv-input" id="chkName" placeholder="예약자 이름을 입력해 주세요." />
                      </div>
                    </div>
                    <div className="rsv-row">
                      <div className="rsv-label">휴대폰 번호</div>
                      <div className="rsv-field">
                        <input className="rsv-input" id="chkPhone" placeholder="- 없이 숫자만 입력해 주세요." />
                      </div>
                    </div>
                    <div className="rsv-row">
                      <div className="rsv-label">생년월일</div>
                      <div className="rsv-field">
                        <input className="rsv-input" id="chkBirth" placeholder="생년월일(YYYY-MM-DD)" />
                      </div>
                    </div>
                  </div>
                  <div className="rsv-actions">
                    <button className="rsv-submit" type="button" id="chkSubmitBtn">조회하기</button>
                  </div>
                </form>
              </div>
              <div className="rsv-result" id="checkResultWrap" hidden>
                <div className="rsv-result-list" id="checkResultList"></div>
                <div className="rsv-actions">
                  <button className="rsv-submit" type="button" id="chkBackBtn">다시 조회</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Script id="calendar-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
(function () {
  const monthText = document.getElementById("calMonthText");
  const grid = document.getElementById("calGrid");
  const prev = document.getElementById("calPrev");
  const next = document.getElementById("calNext");
  const confirmBtnTop = document.getElementById("calConfirmBtn");
  const checkFormWrap = document.getElementById("checkFormWrap");
  const checkResultWrap = document.getElementById("checkResultWrap");
  const checkResultList = document.getElementById("checkResultList");
  const chkBackBtn = document.getElementById("chkBackBtn");

  if (!monthText || !grid || !prev || !next) return;

  const TIME_SLOTS = ["10:00","10:30","11:00","11:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00"];
  const TIME_SLOTS_SAT = ["10:00","10:30","11:00","11:30","12:00","12:30","13:00"];

  let selectedDate = null;
  let selectedTime = null;

  function pad(n) { return String(n).padStart(2, "0"); }
  function keyFromDateObj(date) {
    return date.getFullYear()+"-"+pad(date.getMonth()+1)+"-"+pad(date.getDate());
  }
  function getDowFromKey(key) {
    if (!key) return -1;
    const p = String(key).split("-");
    if (p.length !== 3) return -1;
    return new Date(Number(p[0]), Number(p[1])-1, Number(p[2])).getDay();
  }
  function getTimeSlotsForDate(key) {
    return getDowFromKey(key) === 6 ? TIME_SLOTS_SAT : TIME_SLOTS;
  }
  function isPastTimeSlot(dateKey, timeStr) {
    if (!dateKey || !timeStr) return false;
    const today = new Date();
    if (dateKey !== keyFromDateObj(today)) return false;
    const p = timeStr.split(":");
    const slotMin = Number(p[0])*60+Number(p[1]);
    const nowMin = today.getHours()*60+today.getMinutes();
    return slotMin <= nowMin;
  }
  function isAfterTodayCutoff(date) {
    const today = new Date();
    if (keyFromDateObj(date) !== keyFromDateObj(today)) return false;
    const nowMin = today.getHours()*60+today.getMinutes();
    const dow = date.getDay();
    const cutoff = dow === 6 ? 13*60 : 17*60;
    return nowMin > cutoff;
  }
  function isClosed(date) {
    const dow = date.getDay();
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d < today || dow === 0 || isAfterTodayCutoff(date);
  }

  let reserveModal = null;
  function getReserveModal() {
    const el = document.getElementById("confirmModal");
    if (!el || !window.bootstrap) return null;
    if (!reserveModal) reserveModal = new bootstrap.Modal(el, {backdrop:false,keyboard:true,focus:true});
    return reserveModal;
  }
  let checkModal = null;
  function getCheckModal() {
    const el = document.getElementById("checkModal");
    if (!el || !window.bootstrap) return null;
    if (!checkModal) checkModal = new bootstrap.Modal(el, {backdrop:false,keyboard:true,focus:true});
    return checkModal;
  }

  function fillReserveModal() {
    const dateInput = document.getElementById("cfDateInput");
    const timeSelect = document.getElementById("cfTimeSelect");
    if (dateInput) dateInput.value = selectedDate || "";
    if (timeSelect) {
      timeSelect.innerHTML = '<option value="">예약 시간을 선택해주세요.</option>';
      getTimeSlotsForDate(selectedDate).forEach(function(t) {
        const opt = document.createElement("option");
        opt.value = t; opt.textContent = t;
        if (isPastTimeSlot(selectedDate, t)) opt.disabled = true;
        if (selectedTime === t) opt.selected = true;
        timeSelect.appendChild(opt);
      });
      timeSelect.onchange = function() { selectedTime = timeSelect.value || null; };
    }
  }
  function resetReserveForm() {
    ["cfPhone","cfBirth","cfMemo"].forEach(function(id){var el=document.getElementById(id);if(el)el.value="";});
    var ni=document.getElementById("cfName");if(ni)ni.value="";
    document.querySelectorAll('input[name="cfGender"]').forEach(function(r){r.checked=false;});
    document.querySelectorAll('input[name="cfVisitType"]').forEach(function(r){r.checked=false;});
    var ts=document.getElementById("cfTimeSelect");if(ts)ts.value="";
    var aa=document.getElementById("agreeAll");if(aa)aa.checked=false;
    document.querySelectorAll(".agree-item").forEach(function(c){c.checked=false;});
    selectedDate=null;selectedTime=null;
    var di=document.getElementById("cfDateInput");if(di)di.value="";
  }
  function openReserveModal() {
    if (!selectedDate) return;
    fillReserveModal();
    var m = getReserveModal();
    if (m) m.show(); else alert("Bootstrap 모달이 아직 로드되지 않았습니다.");
  }

  if (confirmBtnTop) {
    confirmBtnTop.addEventListener("click", function() {
      resetCheckModal();
      var m = getCheckModal();
      if (m) m.show();
    });
  }

  var agreeAll = document.getElementById("agreeAll");
  var agreeItems = Array.from(document.querySelectorAll(".agree-item"));
  if (agreeAll && agreeItems.length) {
    agreeAll.addEventListener("change", function() { agreeItems.forEach(function(c){c.checked=agreeAll.checked;}); });
    agreeItems.forEach(function(c) { c.addEventListener("change", function() { agreeAll.checked = agreeItems.every(function(x){return x.checked;}); }); });
  }

  var cfSubmitBtn = document.getElementById("cfSubmitBtn");
  if (cfSubmitBtn) {
    cfSubmitBtn.addEventListener("click", function() {
      var name = (document.getElementById("cfName")?.value||"").trim();
      var phone = (document.getElementById("cfPhone")?.value||"").replace(/\\D/g,"");
      var birth = (document.getElementById("cfBirth")?.value||"").trim();
      var timeVal = (document.getElementById("cfTimeSelect")?.value||"").trim();
      var okTerms = document.getElementById("agreeUse")?.checked;
      var okPrivacy = document.getElementById("agreePrivacy")?.checked;
      if (!selectedDate) return alert("예약 날짜를 선택해주세요.");
      if (!timeVal) return alert("예약 시간을 선택해주세요.");
      if (!name) return alert("이름을 입력해주세요.");
      if (!phone) return alert("연락처를 입력해주세요.");
      if (!birth) return alert("생년월일을 입력해주세요.");
      if (!okTerms || !okPrivacy) return alert("필수 약관에 동의해주세요.");
      alert("예약이 접수되었습니다. (데모)\\n날짜: "+selectedDate+"\\n시간: "+timeVal+"\\n이름: "+name);
      resetReserveForm();
      var m = getReserveModal();
      if (m) m.hide();
    });
  }

  var chkSubmitBtn = document.getElementById("chkSubmitBtn");
  if (chkSubmitBtn) {
    chkSubmitBtn.addEventListener("click", function() {
      var n = (document.getElementById("chkName")?.value||"").trim();
      var p = (document.getElementById("chkPhone")?.value||"").replace(/\\D/g,"");
      var b = (document.getElementById("chkBirth")?.value||"").trim();
      if (!n) return alert("예약자 이름을 입력해 주세요.");
      if (!p) return alert("휴대폰 번호를 입력해 주세요.");
      if (!b) return alert("생년월일을 입력해 주세요.");
      alert("조회된 예약이 없습니다. (데모)");
    });
  }

  function resetCheckModal() {
    if (checkFormWrap) checkFormWrap.hidden = false;
    if (checkResultWrap) checkResultWrap.hidden = true;
    if (checkResultList) checkResultList.innerHTML = "";
  }
  if (chkBackBtn) { chkBackBtn.addEventListener("click", function() { resetCheckModal(); }); }

  var cur = new Date();
  cur = new Date(cur.getFullYear(), cur.getMonth(), 1);

  function render() {
    var y = cur.getFullYear(), m = cur.getMonth();
    monthText.textContent = y+"년 "+pad(m+1)+"월";
    grid.innerHTML = "";
    var first = new Date(y, m, 1);
    var last = new Date(y, m+1, 0);
    var startDow = first.getDay();
    var totalDays = last.getDate();
    for (var i=0;i<startDow;i++) { var c=document.createElement("div"); c.className="cal-cell is-empty"; grid.appendChild(c); }
    for (var day=1;day<=totalDays;day++) {
      var date = new Date(y, m, day);
      var dow = date.getDay();
      var cell = document.createElement("div");
      cell.className = "cal-cell";
      if (dow===0) cell.classList.add("is-sun");
      if (dow===6) cell.classList.add("is-sat");
      var top = document.createElement("div"); top.className="cal-top";
      var num = document.createElement("div"); num.className="cal-num"; num.textContent=day;
      var holEl = document.createElement("div"); holEl.className="cal-hol";
      top.appendChild(num); top.appendChild(holEl);
      var badge = document.createElement("div"); badge.className="cal-badge";
      var yyyyMMdd = y+"-"+pad(m+1)+"-"+pad(day);
      if (isClosed(date)) {
        badge.classList.add("is-closed");
        badge.innerHTML='<span class="cal-badge-line">예약종료</span>';
      } else {
        badge.classList.add("is-open");
        badge.innerHTML='<span class="cal-badge-line">예약가능</span>';
        cell.classList.add("is-clickable");
        (function(dd) {
          cell.addEventListener("click", function() {
            selectedDate = dd;
            selectedTime = null;
            openReserveModal();
          });
        })(yyyyMMdd);
      }
      cell.appendChild(top);
      cell.appendChild(badge);
      grid.appendChild(cell);
    }
    var cells = grid.children.length;
    var remainder = cells % 7;
    if (remainder !== 0) {
      for (var j=0;j<7-remainder;j++) { var ec=document.createElement("div"); ec.className="cal-cell is-empty"; grid.appendChild(ec); }
    }
  }

  prev.addEventListener("click", function() { cur = new Date(cur.getFullYear(), cur.getMonth()-1, 1); render(); });
  next.addEventListener("click", function() { cur = new Date(cur.getFullYear(), cur.getMonth()+1, 1); render(); });
  render();
})();
      ` }} />
    </SubPageWrapper>
  );
}
