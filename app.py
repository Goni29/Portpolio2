from flask import Flask, jsonify, render_template, request, redirect, url_for, flash, session, abort
from jinja2 import TemplateNotFound
from datetime import datetime, timedelta
import os
import json
import requests
from functools import wraps

app = Flask(__name__)
app.secret_key = "your-secret-key"

# =========================
# Admin Auth (Portfolio Demo)
# =========================
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "1234")  # 포트폴리오용 기본값

def is_admin():
    return session.get("is_admin") is True

def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not is_admin():
            flash("관리자 로그인이 필요합니다.", "danger")
            return redirect(url_for("login", next=request.path))
        return fn(*args, **kwargs)
    return wrapper

# =========================
# NAV / META
# =========================
NAV = [
    {
        "title": "병원소개",
        "items": [
            {"label": "인사말", "slug": "intro/greeting"},
            {"label": "의료진소개", "slug": "intro/staff"},
        ],
    },
    {
        "title": "치료",
        "items": [
            {"label": "치아교정", "slug": "treat/ortho"},
            {"label": "임플란트", "slug": "treat/implant"},
            {"label": "신경치료", "slug": "treat/endo"},
            {"label": "충치치료", "slug": "treat/caries"},
            {"label": "사랑니발치", "slug": "treat/wisdom"},
        ],
    },
    {
        "title": "이용안내",
        "items": [
            {"label": "시설안내", "slug": "guide/facility"},
            {"label": "오시는길", "slug": "guide/directions"},
        ],
    },
    {
        "title": "예약·상담",
        "items": [
            {"label": "달력예약", "slug": "reserve/calendar"},
            {"label": "온라인 상담", "slug": "reserve/consult"},
        ],
    },
    {
        "title": "커뮤니티",
        "items": [
            {"label": "공지사항", "slug": "community/notice"},
            {"label": "병원소식", "slug": "community/news"},
        ],
    },
]

PAGE_META = {
    "intro/greeting": {"title": "인사말", "lead": "포트폴리오병원에 오신 것을 환영합니다."},
    "intro/staff": {"title": "의료진소개", "lead": "환자 중심의 진료를 약속드립니다."},

    "treat/ortho": {"title": "치아교정", "lead": "기능과 심미를 고려한 맞춤 교정."},
    "treat/implant": {"title": "임플란트", "lead": "정밀 진단 기반의 안전한 임플란트."},
    "treat/endo": {"title": "신경치료", "lead": "자연치아 보존을 우선으로 합니다."},
    "treat/caries": {"title": "충치치료", "lead": "통증은 줄이고, 재발은 최소화."},
    "treat/wisdom": {"title": "사랑니발치", "lead": "난이도 높은 케이스도 체계적으로."},

    "guide/facility": {"title": "시설안내", "lead": "편안하고 위생적인 진료 환경."},
    "guide/directions": {"title": "오시는길", "lead": "주소/대중교통/주차 안내."},

    "reserve/calendar": {"title": "달력예약", "lead": "원하시는 날짜와 시간에 예약하세요."},
    "reserve/consult": {"title": "온라인 상담", "lead": "간단한 증상도 편하게 문의하세요."},

    "community/notice": {"title": "공지사항", "lead": "병원 공지 및 안내를 확인하세요."},
    "community/news": {"title": "병원소식", "lead": "병원 소식과 이벤트를 전합니다."},
}


# =========================
# HERO (Sub pages)
# =========================
DEFAULT_HERO = "img/subhero.png"
SECTION_HERO = {k: DEFAULT_HERO for k in ["intro", "treat", "guide", "reserve", "community"]}


# =========================
# Global inject (NAV/active/hero)
# =========================
@app.context_processor
def inject_globals():
    path = (request.path or "").strip("/")
    slug = ""
    if path.startswith("pages/"):
        slug = path.replace("pages/", "", 1)

    active_menu = None
    active_item = None

    if slug:
        for m in NAV:
            for it in m.get("items", []):
                if it.get("slug") == slug:
                    active_menu = m
                    active_item = it
                    break
            if active_menu:
                break

    section = slug.split("/", 1)[0] if slug else ""
    hero_img = SECTION_HERO.get(section, "img/subhero_intro.jpg")

    return {
        "NAV": NAV,
        "SITE_NAME": "포트폴리오병원",
        "ACTIVE_SLUG": slug,
        "ACTIVE_MENU": active_menu,
        "ACTIVE_ITEM": active_item,
        "HERO_IMG": hero_img,
        "IS_ADMIN": is_admin(),
        "ADMIN_USERNAME": ADMIN_USERNAME
    }

# =========================
# Demo Auth pages (Signup/Login are UI-only)
# =========================
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        flash("포트폴리오 데모 화면입니다. 실제 회원가입은 동작하지 않습니다.", "info")
        return redirect(url_for("signup"))
    return render_template("auth/signup.html", meta={"title": "회원가입"})


@app.route("/login", methods=["GET", "POST"])
def login():
    next_url = request.args.get("next") or "/"

    if request.method == "POST":
        u = (request.form.get("username") or request.form.get("email") or "").strip()
        p = (request.form.get("password") or "").strip()

        # ✅ 관리자면 실제 로그인
        if u == ADMIN_USERNAME and p == ADMIN_PASSWORD:
            session["is_admin"] = True
            flash("관리자 로그인 완료!", "success")
            return redirect(next_url)

        # ❗ 일반 유저 로그인은 데모 안내만
        flash("포트폴리오 데모 화면입니다. 일반 로그인은 동작하지 않습니다.", "info")
        return redirect(url_for("login", next=next_url))

    return render_template("auth/login.html", meta={"title": "로그인"}, next=next_url)

@app.route("/logout")
def logout():
    session.pop("is_admin", None)
    flash("로그아웃되었습니다.", "success")
    return redirect("/")

# =========================
# Helpers
# =========================
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

NOTICE_FILE = os.path.join(DATA_DIR, "notice.json")
NEWS_FILE = os.path.join(DATA_DIR, "news.json")


def _nav_context(slug: str):
    meta = {"title": slug.split("/")[-1]}
    active_menu = None

    try:
        for m in NAV:
            for it in m.get("items", []):
                if it.get("slug") == slug:
                    active_menu = m
                    meta = {"title": it.get("label") or meta["title"]}
                    break
            if active_menu:
                break
    except Exception:
        pass

    return meta, active_menu


def _paginate(items, page: int, per_page: int):
    total = len(items)
    pages = max(1, (total + per_page - 1) // per_page)
    page = max(1, min(page, pages))
    start = (page - 1) * per_page
    end = start + per_page
    return {
        "items": items[start:end],
        "page": page,
        "per_page": per_page,
        "total": total,
        "pages": pages,
        "has_prev": page > 1,
        "has_next": page < pages,
        "prev_num": page - 1,
        "next_num": page + 1,
    }


# ✅ 메인 페이지 프리뷰용 (공지/소식 최신 N개)
def _load_preview_json(path: str, limit: int):
    try:
        if not os.path.exists(path):
            return []
        if os.path.getsize(path) == 0:
            return []
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        items = data.get("items", []) or []
        items = sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)
        return items[:limit]
    except Exception:
        return []


# =========================
# Index (MAIN)  ✅ 여기서 공지/소식 연결
# =========================
@app.route("/")
def index():
    notice_preview = _load_preview_json(NOTICE_FILE, 5)
    news_preview = _load_preview_json(NEWS_FILE, 3)
    return render_template(
        "index.html",
        notice_preview=notice_preview,
        news_preview=news_preview,
    )


# =========================
# Catch-all pages (sub pages)
# =========================
@app.route("/pages/<path:slug>")
def page(slug):
    tpl = f"pages/{slug}.html"

    meta = {"title": slug.split("/")[-1]}
    active_menu = None
    active_slug = slug

    try:
        for m in NAV:
            for it in m.get("items", []):
                if it.get("slug") == slug:
                    active_menu = m
                    meta = {"title": it.get("label") or meta["title"]}
                    break
            if active_menu:
                break
    except Exception:
        pass

    try:
        return render_template(
            tpl,
            meta=meta,
            ACTIVE_MENU=active_menu,
            ACTIVE_SLUG=active_slug
        )
    except TemplateNotFound:
        abort(404)


# =========================
# Treat pages
# =========================
TREAT_TABS = [
    {"key": "ortho", "label": "치아교정"},
    {"key": "implant", "label": "임플란트"},
    {"key": "endo", "label": "신경치료"},
    {"key": "caries", "label": "충치치료"},
    {"key": "wisdom", "label": "사랑니발치"},
]

TREAT_PAGES = {
    "ortho": {
        "title": "치아교정",
        "process_img": "img/treat1.png",
        "process_card_title": "치아교정 진행과정",
        "process_kicker": "PROCESS",
        "process_title": "치아교정 진행과정",
        "process_sub": "상담부터 유지장치까지, 단계별로 꼼꼼하게 진행합니다.",
        "cards": [
            {"idx": "01", "title": "정밀 상담 및 진단", "desc": "구강검사·문진을 통해 현재 상태와 목표를 함께 설정합니다."},
            {"idx": "02", "title": "맞춤 치료계획", "desc": "진단 데이터를 기반으로 기간·장치·관리 포인트를 안내합니다."},
            {"idx": "03", "title": "장치 부착 및 조정", "desc": "정기 내원으로 교정력을 조절하고 변화를 체크합니다."},
            {"idx": "04", "title": "유지관리", "desc": "치료 후 유지장치로 재발을 예방하고 안정화를 돕습니다."},
        ],
        "note_title": "안내사항",
        "note_list": [
            "개인 상태에 따라 치료기간과 계획은 달라질 수 있습니다.",
            "정기 내원과 위생 관리가 결과에 큰 영향을 줍니다.",
            "통증/불편감은 초기 2~3일 내 완화되는 경우가 많습니다."
        ],
        "cta_title": "상담으로 정확히 확인해보세요.",
        "cta_sub": "비용/기간/방법을 맞춤 안내해드립니다."
    },

    "implant": {
        "title": "임플란트",
        "kicker": "MORE DENTAL IMPLANT",
        "headline": "자연치아처럼 편안한 임플란트",
        "lead": "정확한 진단과 안전한 식립 계획으로 기능과 심미를 함께 회복합니다.",
        "process_img": "img/treat2.png",
        "process_card_title": "임플란트 진행과정",
        "process_kicker": "PROCESS",
        "process_title": "임플란트 진행과정",
        "process_sub": "진단부터 보철까지 체계적으로 진행합니다.",
        "cards": [
            {"idx": "01", "title": "정밀 진단", "desc": "CT·구강검사로 잇몸뼈 상태와 식립 가능 여부를 확인합니다."},
            {"idx": "02", "title": "식립 계획", "desc": "안전한 위치·각도·깊이를 계획하고 안내합니다."},
            {"idx": "03", "title": "식립 및 회복", "desc": "식립 후 회복 기간 동안 안정화를 기다립니다."},
            {"idx": "04", "title": "보철 장착", "desc": "개인 교합에 맞춘 보철을 제작·장착합니다."},
        ],
        "note_title": "안내사항",
        "note_list": [
            "전신질환/복용약에 따라 치료가 달라질 수 있습니다.",
            "흡연은 치유를 방해할 수 있어 금연을 권장합니다.",
            "식립 후 정기검진으로 장기 유지에 도움을 줍니다."
        ],
        "cta_title": "임플란트, 정확한 진단이 먼저입니다.",
        "cta_sub": "CT 기반으로 안전하게 안내해드립니다."
    },

    "endo": {
        "title": "신경치료",
        "kicker": "MORE ENDODONTIC CARE",
        "headline": "치아를 살리는 신경치료",
        "lead": "염증을 제거하고 내부를 깨끗이 소독해 치아 기능을 유지하도록 돕습니다.",
        "process_img": "img/treat3.png",
        "process_card_title": "신경치료 진행과정",
        "process_kicker": "PROCESS",
        "process_title": "신경치료 진행과정",
        "process_sub": "통증의 원인을 정확히 찾아 단계적으로 치료합니다.",
        "cards": [
            {"idx": "01", "title": "원인 진단", "desc": "통증/염증 부위를 확인하고 치료 범위를 결정합니다."},
            {"idx": "02", "title": "신경 제거 및 소독", "desc": "감염된 신경을 제거하고 근관을 세척·소독합니다."},
            {"idx": "03", "title": "근관 충전", "desc": "재감염을 막기 위해 내부를 밀봉합니다."},
            {"idx": "04", "title": "보강 및 마무리", "desc": "필요 시 크라운 등으로 치아를 보호합니다."},
        ],
        "note_title": "안내사항",
        "note_list": [
            "치료 후 일시적 통증이 있을 수 있습니다.",
            "치아가 약해질 수 있어 보강치료가 필요할 수 있습니다.",
            "증상이 지속되면 내원하여 확인이 필요합니다."
        ],
        "cta_title": "통증이 있다면 빠르게 진단하세요.",
        "cta_sub": "치아를 살릴 수 있는 골든타임이 있습니다."
    },

    "caries": {
        "title": "충치치료",
        "kicker": "MORE CARIES TREATMENT",
        "headline": "충치치료는 빠를수록 부담이 적습니다",
        "lead": "초기에는 간단한 치료로 끝날 수 있어 조기 진단이 중요합니다.",
        "process_img": "img/treat4.png",
        "process_card_title": "충치치료 진행과정",
        "process_kicker": "PROCESS",
        "process_title": "충치치료 진행과정",
        "process_sub": "상태에 따라 적절한 재료와 방법으로 치료합니다.",
        "cards": [
            {"idx": "01", "title": "충치 범위 확인", "desc": "검사로 진행 정도를 확인하고 치료 범위를 정합니다."},
            {"idx": "02", "title": "우식 제거", "desc": "충치 부위를 제거하고 건강한 치질을 보존합니다."},
            {"idx": "03", "title": "수복 치료", "desc": "레진/인레이 등으로 형태와 기능을 회복합니다."},
            {"idx": "04", "title": "관리 안내", "desc": "재발 방지를 위해 칫솔질·생활습관을 안내합니다."},
        ],
        "note_title": "안내사항",
        "note_list": [
            "초기 충치는 통증이 없을 수 있습니다.",
            "단 음식/탄산은 치아 건강에 영향을 줄 수 있습니다.",
            "정기검진으로 조기 발견이 중요합니다."
        ],
        "cta_title": "충치, 방치하지 마세요.",
        "cta_sub": "간단한 치료로 끝낼 수 있습니다."
    },

    "wisdom": {
        "title": "사랑니발치",
        "kicker": "MORE WISDOM TOOTH CARE",
        "headline": "안전한 사랑니 발치",
        "lead": "매복/염증 여부를 확인하고 안전한 발치를 우선으로 진행합니다.",
        "process_img": "img/treat5.png",
        "process_card_title": "사랑니 발치 진행과정",
        "process_kicker": "PROCESS",
        "process_title": "사랑니 발치 진행과정",
        "process_sub": "진단부터 회복까지 꼼꼼히 안내합니다.",
        "cards": [
            {"idx": "01", "title": "정밀 검사", "desc": "X-ray/CT로 매복 정도와 신경 위치를 확인합니다."},
            {"idx": "02", "title": "발치 계획", "desc": "난이도에 따라 발치 방법과 주의사항을 안내합니다."},
            {"idx": "03", "title": "발치 및 지혈", "desc": "안전하게 발치 후 지혈·처치를 진행합니다."},
            {"idx": "04", "title": "회복 관리", "desc": "부기/통증 관리와 식이·생활 주의사항을 안내합니다."},
        ],
        "note_title": "안내사항",
        "note_list": [
            "발치 후 2~3일은 무리한 운동/음주를 피해주세요.",
            "지혈 거즈는 안내 시간만큼 유지해주세요.",
            "심한 통증/출혈/열이 지속되면 내원해주세요."
        ],
        "cta_title": "난이도는 진단 후 정확히 알 수 있어요.",
        "cta_sub": "CT 기반으로 안전하게 안내해드립니다."
    },
}


@app.route("/pages/treat/<key>")
def treat_page(key):
    t = TREAT_PAGES.get(key)
    if not t:
        abort(404)
    return render_template(
        "treat/treat_detail.html",
        t=t,
        tabs=TREAT_TABS,
        active_key=key,
        meta={"title": t["title"]},
        ACTIVE_SLUG=f"treat/{key}"
    )


# =========================
# Holiday API
# =========================
HOLIDAY_API_KEY = os.getenv("HOLIDAY_API_KEY")

_holiday_cache = {}  # {year: {"dates": set(), "map": dict}}

def fetch_holidays_korea(year: int):
    if year in _holiday_cache:
        cached = _holiday_cache[year]
        return cached["dates"], cached["map"]

    url = "https://tools.olaf.kr/api/holidays"
    params = {"year": str(year)}

    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()

    items = (data.get("result", {}) or {}).get("data", []) or []
    dates = set()
    holiday_map = {}

    for it in items:
        start_s = str(it.get("start", ""))
        end_s = str(it.get("end", ""))
        name = str(it.get("summary", "")).strip() or "공휴일"

        if len(start_s) < 10 or len(end_s) < 10:
            continue

        start_dt = datetime.fromisoformat(start_s)
        end_dt = datetime.fromisoformat(end_s)

        d = start_dt.date()
        end_exclusive = end_dt.date()

        while d < end_exclusive:
            key = d.isoformat()
            dates.add(key)

            if key in holiday_map and holiday_map[key] != name:
                if name not in holiday_map[key]:
                    holiday_map[key] = f"{holiday_map[key]} · {name}"
            else:
                holiday_map[key] = name

            d += timedelta(days=1)

    _holiday_cache[year] = {"dates": dates, "map": holiday_map}
    return dates, holiday_map


@app.route("/api/holidays")
def api_holidays():
    year = int(request.args.get("year", datetime.now().year))
    dates, holiday_map = fetch_holidays_korea(year)
    return jsonify({
        "year": year,
        "dates": sorted(list(dates)),
        "map": holiday_map
    })


# =========================
# Consult (JSON store)
# =========================
CONSULT_DATA_DIR = os.path.join(BASE_DIR, "data")
CONSULT_DATA_FILE = os.path.join(CONSULT_DATA_DIR, "consult.json")

def _ensure_consult_store():
    os.makedirs(CONSULT_DATA_DIR, exist_ok=True)

    if not os.path.exists(CONSULT_DATA_FILE):
        with open(CONSULT_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump({"seq": 0, "items": []}, f, ensure_ascii=False, indent=2)
        return

    try:
        if os.path.getsize(CONSULT_DATA_FILE) == 0:
            with open(CONSULT_DATA_FILE, "w", encoding="utf-8") as f:
                json.dump({"seq": 0, "items": []}, f, ensure_ascii=False, indent=2)
    except Exception:
        with open(CONSULT_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump({"seq": 0, "items": []}, f, ensure_ascii=False, indent=2)


def _load_consults():
    _ensure_consult_store()
    try:
        with open(CONSULT_DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        payload = {"seq": 0, "items": []}
        with open(CONSULT_DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        return payload


def _save_consults(payload: dict):
    _ensure_consult_store()
    with open(CONSULT_DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def _mask_name(name: str) -> str:
    if not name:
        return ""
    name = str(name)
    if len(name) == 1:
        return name
    if len(name) == 2:
        return name[0] + "*"
    return name[0] + ("*" * (len(name) - 2)) + name[-1]


@app.template_filter("mask_name")
def mask_name_filter(name):
    return _mask_name(name)


@app.route("/pages/reserve/consult")
def consult_board():
    data = _load_consults()
    items = data.get("items", [])

    q = (request.args.get("q") or "").strip().lower()
    sort = (request.args.get("sort") or "latest").strip()
    page = request.args.get("page", 1, type=int)
    per_page = 10

    if q:
        def hit(x):
            return (
                q in (x.get("title") or "").lower()
                or q in (x.get("content") or "").lower()
                or q in (x.get("name") or "").lower()
                or q in (x.get("phone") or "").lower()
            )
        items = [x for x in items if hit(x)]

    if sort == "oldest":
        items = sorted(items, key=lambda x: x.get("created_at", ""))
    else:
        items = sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)

    pagination = _paginate(items, page, per_page)

    meta, active_menu = _nav_context("reserve/consult")

    return render_template(
        "pages/reserve/consult.html",
        meta=meta,
        ACTIVE_MENU=active_menu,
        ACTIVE_SLUG="reserve/consult",
        posts=pagination["items"],
        pagination=pagination,
        q=request.args.get("q", ""),
        sort=sort,
    )


@app.route("/pages/reserve/consult/write", methods=["GET", "POST"])
def consult_write():
    if request.method == "POST":
        name = (request.form.get("name") or "").strip()
        phone = (request.form.get("phone") or "").strip()
        title = (request.form.get("title") or "").strip()
        content = (request.form.get("content") or "").strip()
        is_private = True if request.form.get("is_private") == "on" else False
        post_password = (request.form.get("post_password") or "").strip()

        errors = []
        if not name:
            errors.append("이름을 입력해주세요.")
        if not title:
            errors.append("제목을 입력해주세요.")
        if not content or len(content) < 5:
            errors.append("내용을 5자 이상 입력해주세요.")

        if errors:
            for e in errors:
                flash(e, "danger")
            return redirect("/pages/reserve/consult/write")

        data = _load_consults()
        data["seq"] = int(data.get("seq", 0)) + 1
        new_id = data["seq"]

        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        item = {
            "id": new_id,
            "title": title,
            "content": content,
            "name": name,
            "phone": phone,
            "is_private": bool(is_private),
            "post_password": post_password if post_password else None,
            "status": "대기",
            "created_at": now,
        }

        data.setdefault("items", [])
        data["items"].append(item)
        _save_consults(data)

        flash("상담 신청이 등록되었습니다. 빠르게 확인 후 연락드리겠습니다.", "success")
        return redirect("/pages/reserve/consult")

    meta, active_menu = _nav_context("reserve/consult")
    return render_template(
        "pages/reserve/consult_write.html",
        meta=meta,
        ACTIVE_MENU=active_menu,
        ACTIVE_SLUG="reserve/consult",
    )


@app.route("/pages/reserve/consult/<int:post_id>", methods=["GET", "POST"])
def consult_view(post_id):
    data = _load_consults()
    items = data.get("items", [])
    post = next((x for x in items if int(x.get("id")) == post_id), None)
    if not post:
        abort(404)

    meta, active_menu = _nav_context("reserve/consult")

    if post.get("is_private"):
        authed_key = f"consult_authed_{post_id}"
        if session.get(authed_key) is not True:
            if request.method == "POST":
                pw = (request.form.get("pw") or "").strip()
                saved = (post.get("post_password") or "").strip()

                if saved and pw == saved:
                    session[authed_key] = True
                    return redirect(f"/pages/reserve/consult/{post_id}")
                elif not saved:
                    session[authed_key] = True
                    return redirect(f"/pages/reserve/consult/{post_id}")

                flash("비밀번호가 올바르지 않습니다.", "danger")

            return render_template(
                "pages/reserve/consult_password.html",
                meta=meta,
                ACTIVE_MENU=active_menu,
                ACTIVE_SLUG="reserve/consult",
                post=post,
            )

    return render_template(
        "pages/reserve/consult_view.html",
        meta=meta,
        ACTIVE_MENU=active_menu,
        ACTIVE_SLUG="reserve/consult",
        post=post,
    )


# =========================
# Community (Notice/News) JSON Store
# =========================
def _ensure_store(path: str):
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(path):
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"seq": 0, "items": []}, f, ensure_ascii=False, indent=2)
        return
    try:
        if os.path.getsize(path) == 0:
            with open(path, "w", encoding="utf-8") as f:
                json.dump({"seq": 0, "items": []}, f, ensure_ascii=False, indent=2)
    except Exception:
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"seq": 0, "items": []}, f, ensure_ascii=False, indent=2)


def _load_store(path: str):
    _ensure_store(path)
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        payload = {"seq": 0, "items": []}
        with open(path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        return payload


def _save_store(path: str, payload: dict):
    _ensure_store(path)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)


def _board_list(path: str, template: str, slug: str, title: str):
    data = _load_store(path)
    items = data.get("items", [])

    q = (request.args.get("q") or "").strip().lower()
    sort = (request.args.get("sort") or "latest").strip()
    page = request.args.get("page", 1, type=int)
    per_page = 10

    if q:
        def hit(x):
            return (
                q in (x.get("title") or "").lower()
                or q in (x.get("content") or "").lower()
            )
        items = [x for x in items if hit(x)]

    if sort == "oldest":
        items = sorted(items, key=lambda x: x.get("created_at", ""))
    else:
        items = sorted(items, key=lambda x: x.get("created_at", ""), reverse=True)

    pagination = _paginate(items, page, per_page)
    meta, active_menu = _nav_context(slug)

    return render_template(
        template,
        meta=meta if meta else {"title": title},
        ACTIVE_MENU=active_menu,
        ACTIVE_SLUG=slug,
        posts=pagination["items"],
        pagination=pagination,
        q=request.args.get("q", ""),
        sort=sort,
        page_title=title,
    )


def _board_write(path: str, template: str, redirect_to: str, slug: str, title: str):
    if request.method == "POST":
        t = (request.form.get("title") or "").strip()
        c = (request.form.get("content") or "").strip()

        errors = []
        if not t:
            errors.append("제목을 입력해주세요.")
        if not c or len(c) < 5:
            errors.append("내용을 5자 이상 입력해주세요.")

        if errors:
            for e in errors:
                flash(e, "danger")
            return redirect(redirect_to)

        data = _load_store(path)
        data["seq"] = int(data.get("seq", 0)) + 1
        new_id = data["seq"]

        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        item = {
            "id": new_id,
            "title": t,
            "content": c,
            "created_at": now,
        }

        data.setdefault("items", [])
        data["items"].append(item)
        _save_store(path, data)

        flash("게시글이 등록되었습니다.", "success")
        return redirect(redirect_to.replace("/write", ""))

    meta, active_menu = _nav_context(slug)
    return render_template(
        template,
        meta=meta if meta else {"title": title},
        ACTIVE_MENU=active_menu,
        ACTIVE_SLUG=slug,
        page_title=title,
    )


def _board_view(path: str, template: str, post_id: int, slug: str, title: str):
    data = _load_store(path)
    items = data.get("items", [])
    post = next((x for x in items if int(x.get("id")) == post_id), None)
    if not post:
        abort(404)

    meta, active_menu = _nav_context(slug)
    return render_template(
        template,
        meta=meta if meta else {"title": title},
        ACTIVE_MENU=active_menu,
        ACTIVE_SLUG=slug,
        page_title=title,
        post=post,
    )


# Notice
@app.route("/pages/community/notice")
def community_notice():
    return _board_list(
        NOTICE_FILE,
        "pages/community/notice.html",
        slug="community/notice",
        title="공지사항",
    )


@app.route("/pages/community/notice/write", methods=["GET", "POST"])
@admin_required
def community_notice_write():
    return _board_write(
        NOTICE_FILE,
        "pages/community/board_write.html",
        redirect_to="/pages/community/notice/write",
        slug="community/notice",
        title="공지사항",
    )


@app.route("/pages/community/notice/<int:post_id>")
def community_notice_view(post_id):
    return _board_view(
        NOTICE_FILE,
        "pages/community/board_view.html",
        post_id=post_id,
        slug="community/notice",
        title="공지사항",
    )


# News
@app.route("/pages/community/news")
def community_news():
    return _board_list(
        NEWS_FILE,
        "pages/community/news.html",
        slug="community/news",
        title="병원소식",
    )


@app.route("/pages/community/news/write", methods=["GET", "POST"])
@admin_required
def community_news_write():
    if request.method == "POST":
        t = (request.form.get("title") or "").strip()
        c = (request.form.get("content") or "").strip()
        image_url = (request.form.get("image_url") or "").strip()

        errors = []
        if not t:
            errors.append("제목을 입력해주세요.")
        if not c or len(c) < 5:
            errors.append("내용을 5자 이상 입력해주세요.")

        if errors:
            for e in errors:
                flash(e, "danger")
            return redirect("/pages/community/news/write")

        data = _load_store(NEWS_FILE)
        data["seq"] = int(data.get("seq", 0)) + 1
        new_id = data["seq"]

        now = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        item = {
            "id": new_id,
            "title": t,
            "content": c,
            "image_url": image_url if image_url else None,
            "created_at": now,
        }

        data.setdefault("items", [])
        data["items"].append(item)
        _save_store(NEWS_FILE, data)

        flash("게시글이 등록되었습니다.", "success")
        return redirect("/pages/community/news")

    meta, active_menu = _nav_context("community/news")
    return render_template(
        "pages/community/news_write.html",
        meta=meta,
        ACTIVE_MENU=active_menu,
        ACTIVE_SLUG="community/news",
        page_title="병원소식",
    )


@app.route("/pages/community/news/<int:post_id>")
def community_news_view(post_id):
    return _board_view(
        NEWS_FILE,
        "pages/community/board_view.html",
        post_id=post_id,
        slug="community/news",
        title="병원소식",
    )

# =========================
# Community Delete (Admin only)
# =========================
@app.route("/pages/community/<board>/<int:post_id>/delete", methods=["POST"])
@admin_required
def community_delete(board, post_id):
    if board == "notice":
        path = NOTICE_FILE
        redirect_url = "/pages/community/notice"
    elif board == "news":
        path = NEWS_FILE
        redirect_url = "/pages/community/news"
    else:
        abort(404)

    data = _load_store(path)
    items = data.get("items", [])

    before = len(items)
    items = [x for x in items if int(x.get("id", 0)) != int(post_id)]
    data["items"] = items
    _save_store(path, data)

    if len(items) == before:
        flash("삭제할 글을 찾지 못했습니다.", "danger")
    else:
        flash("삭제되었습니다.", "success")

    return redirect(redirect_url)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)