/* =========================================================
   CAUS MARCENARIA — script.js (Vanilla JS)
   - Menu mobile + smooth scroll
   - Header sticky hide/show
   - Reveal via IntersectionObserver
   - Ferramentas flutuantes (SVG) com parallax suave
   - 2 carrosséis (Residencial + Comercial) com dots + swipe
   - Back to top
   - Mini CTA flutuante (aparece ao rolar)
   - Tracking simples (console + dataLayer se existir)
   ========================================================= */

(function () {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const qs = (sel, el = document) => el.querySelector(sel);
  const qsa = (sel, el = document) => Array.from(el.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function smoothScrollTo(y) {
    window.scrollTo({ top: y, behavior: prefersReducedMotion ? "auto" : "smooth" });
  }

  /* ---------------------------
     Tracking simples
  --------------------------- */
  function track(name) {
    // Se tiver GTM/dataLayer, manda pra lá. Se não, pelo menos aparece no console.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "caus_track", action: name });
    // eslint-disable-next-line no-console
    console.log("[TRACK]", name);
  }

  qsa(".js-track").forEach(el => {
    el.addEventListener("click", () => {
      const name = el.getAttribute("data-track") || "click";
      track(name);
    });
  });

  /* ---------------------------
     Mobile menu
  --------------------------- */
  const navToggle = qs(".nav__toggle");
  const menu = qs("[data-menu]");
  if (navToggle && menu) {
    navToggle.addEventListener("click", () => {
      const open = menu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    qsa(".js-scroll", menu).forEach(a => {
      a.addEventListener("click", () => {
        menu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("is-open")) return;
      const inside = menu.contains(e.target) || navToggle.contains(e.target);
      if (!inside) {
        menu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------------------------
     Smooth scroll anchors + logo home
  --------------------------- */
  qsa("a.js-scroll").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const target = qs(href);
      if (!target) return;

      e.preventDefault();
      const header = qs(".header");
      const headerH = header ? header.getBoundingClientRect().height : 0;
      const y = target.getBoundingClientRect().top + window.pageYOffset - headerH + 2;
      smoothScrollTo(y);
    });
  });

  const home = qs(".js-home");
  if (home) home.addEventListener("click", (e) => { e.preventDefault(); smoothScrollTo(0); });

  /* ---------------------------
     Header sticky: scrolled + hide/show
  --------------------------- */
  const header = qs(".header");
  let lastY = window.scrollY;
  let ticking = false;

  function onScrollHeader() {
    if (!header) return;
    const y = window.scrollY;

    header.classList.toggle("is-scrolled", y > 10);

    const goingDown = y > lastY;
    const nearTop = y < 120;

    if (!nearTop && goingDown && y - lastY > 8) header.classList.add("is-hidden");
    if (!goingDown) header.classList.remove("is-hidden");
    if (nearTop) header.classList.remove("is-hidden");

    lastY = y;
  }

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      onScrollHeader();
      ticking = false;
    });
  }, { passive: true });

  onScrollHeader();

  /* ---------------------------
     Back to top button
  --------------------------- */
  const backToTop = qs("#backToTop");
  function updateBackToTop() {
    if (!backToTop) return;
    backToTop.classList.toggle("is-visible", window.scrollY > 600);
  }
  if (backToTop) {
    backToTop.addEventListener("click", () => smoothScrollTo(0));
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    updateBackToTop();
  }

  /* ---------------------------
     Mini CTA flutuante
  --------------------------- */
  const miniCta = qs("#miniCta");
  const miniCtaClose = qs("#miniCtaClose");
  const MINI_KEY = "caus_mini_cta_closed";

  function updateMiniCta() {
    if (!miniCta) return;
    const closed = localStorage.getItem(MINI_KEY) === "1";
    if (closed) return;

    const show = window.scrollY > 420;
    miniCta.classList.toggle("is-visible", show);
  }

  if (miniCta && miniCtaClose) {
    miniCtaClose.addEventListener("click", () => {
      localStorage.setItem(MINI_KEY, "1");
      miniCta.classList.remove("is-visible");
      track("mini_cta_close");
    });
    window.addEventListener("scroll", updateMiniCta, { passive: true });
    updateMiniCta();
  }

  /* ---------------------------
     Reveal
  --------------------------- */
  (function initReveal() {
    const items = qsa(".reveal");
    if (!items.length) return;

    if (prefersReducedMotion) {
      items.forEach(el => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const stagger = parseInt(el.getAttribute("data-stagger") || "0", 10);
        el.style.transitionDelay = clamp(stagger * 80, 0, 700) + "ms";

        el.classList.add("is-visible");
        io.unobserve(el);
      });
    }, { threshold: 0.12 });

    items.forEach(el => io.observe(el));
  })();

  /* ---------------------------
     Floating tools background (SVG)
     - performance: menos itens no mobile
     - parallax suave
  --------------------------- */
  function toolSvg(type) {
    // SVGs minimalistas (stroke currentColor)
    switch (type) {
      case "hammer":
        return `
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M14 3l3 3-3 3-3-3 3-3Z" stroke="currentColor" stroke-width="1.6"/>
            <path d="M11 7l-7 7 3 3 7-7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            <path d="M6 17l-2 2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>`;
      case "saw":
        return `
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 14c4-7 10-9 16-10-2 7-5 13-12 16-2 1-4 0-4-2 0-1 .2-2 .8-4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M7 15l1 1M9 14l1 1M11 13l1 1M13 12l1 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>`;
      case "ruler":
        return `
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M4 8l12-4 4 12-12 4L4 8Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M8 9l.8 2.4M10 8.3l.6 1.8M12 7.6l.8 2.4M14 6.9l.6 1.8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>`;
      case "drill":
        return `
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M6 10h9a3 3 0 0 1 3 3v1H6v-4Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M6 14v4h4v-4" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M15 10V8h2V6h-4v2" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M18 12h2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>`;
      case "square":
      default:
        return `
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 5h14v4H9v10H5V5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>
            <path d="M9 9h6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>`;
    }
  }

  (function initFloatingTools() {
    const layer = qs("#floatLayer");
    if (!layer) return;

    const isMobile = window.matchMedia("(max-width: 720px)").matches;
    const count = isMobile ? 10 : 18;

    const types = ["hammer", "saw", "ruler", "drill", "square"];
    const rand = (min, max) => min + Math.random() * (max - min);

    const tools = [];
    for (let i = 0; i < count; i++) {
      const el = document.createElement("div");
      el.className = "float-tool";
      const type = types[Math.floor(Math.random() * types.length)];
      el.innerHTML = toolSvg(type);

      const size = isMobile ? rand(44, 62) : rand(48, 74);
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;

      el.style.left = `${rand(-5, 105)}vw`;
      el.style.top = `${rand(-10, 110)}vh`;
      el.style.opacity = `${rand(0.28, 0.85)}`;

      // variação de cor/ênfase
      if (Math.random() > 0.6) el.style.color = "rgba(255,255,255,.78)";

      const speed = rand(0.25, 0.75);
      const driftX = rand(-18, 18);
      const driftY = rand(-20, 20);
      const rot = rand(-30, 30);
      const bob = rand(4, 10);

      tools.push({ el, speed, driftX, driftY, rot, bob });
      layer.appendChild(el);
    }

    if (prefersReducedMotion) return;

    let mx = 0, my = 0;
    window.addEventListener("mousemove", (e) => {
      mx = (e.clientX / window.innerWidth) * 2 - 1;
      my = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });

    const start = performance.now();
    function anim(now) {
      const t = (now - start) / 1000;

      tools.forEach((s, idx) => {
        const wobble = Math.sin(t * (0.7 + s.speed) + idx) * s.bob;
        const px = mx * (7 + s.speed * 12);
        const py = my * (7 + s.speed * 12);

        const tx = (s.driftX * Math.sin(t * s.speed) + wobble + px);
        const ty = (s.driftY * Math.cos(t * s.speed) + wobble + py);

        s.el.style.transform = `translate3d(${tx}px, ${ty}px, 0) rotate(${s.rot + wobble * 0.5}deg)`;
      });

      requestAnimationFrame(anim);
    }
    requestAnimationFrame(anim);
  })();

  /* ---------------------------
     Carrossel (2) com swipe + dots
  --------------------------- */

  // ======================================================
  // EDITAR AQUI: Projetos e imagens (troque à vontade)
  // Coloque as imagens em: /assets/projetos/
  // ======================================================

  const projetosResidencial = [
    { url: "/assets/projetos/01.jpg", titulo: "Cozinha planejada (placeholder)" },
    { url: "/assets/projetos/02.jpg", titulo: "Closet sob medida (placeholder)" },
    { url: "/assets/projetos/03.jpg", titulo: "Painel de TV premium (placeholder)" }
  ];

  const projetosComercial = [
    { url: "/assets/projetos/04.jpg", titulo: "Recepção comercial (placeholder)" },
    { url: "/assets/projetos/05.jpg", titulo: "Mobiliário para loja (placeholder)" },
    { url: "/assets/projetos/06.jpg", titulo: "Escritório sob medida (placeholder)" }
  ];

  class Carousel {
    constructor(root, items) {
      this.root = root;
      this.items = items;
      this.track = qs(".carousel__track", root);
      this.dots = qs(".carousel__dots", root);
      this.btnPrev = qs(".carousel__btn.prev", root);
      this.btnNext = qs(".carousel__btn.next", root);

      this.index = 0;
      this.startX = 0;
      this.currentX = 0;
      this.isDragging = false;

      this.render();
      this.bind();
      this.goTo(0, false);
    }

    render() {
      if (!this.track || !this.dots) return;
      this.track.innerHTML = "";
      this.dots.innerHTML = "";

      this.items.forEach((item, i) => {
        const slide = document.createElement("div");
        slide.className = "slide";
        slide.innerHTML = `
          <img src="${item.url}" alt="${item.titulo}" loading="lazy" width="1200" height="800" />
          <div class="slide__caption">
            <strong>${item.titulo}</strong>
            <span>${i + 1}/${this.items.length}</span>
          </div>
        `;
        this.track.appendChild(slide);

        const dot = document.createElement("button");
        dot.className = "dotbtn";
        dot.type = "button";
        dot.setAttribute("aria-label", `Ir para o slide ${i + 1}`);
        dot.addEventListener("click", () => this.goTo(i));
        this.dots.appendChild(dot);
      });
    }

    bind() {
      if (this.btnPrev) this.btnPrev.addEventListener("click", () => this.prev());
      if (this.btnNext) this.btnNext.addEventListener("click", () => this.next());

      const viewport = qs(".carousel__viewport", this.root);
      if (!viewport) return;

      const onDown = (x) => {
        this.isDragging = true;
        this.startX = x;
        this.currentX = x;
        this.track.style.transition = "none";
      };

      const onMove = (x) => {
        if (!this.isDragging) return;
        this.currentX = x;
        const dx = this.currentX - this.startX;
        const offset = -this.index * this.root.clientWidth + dx;
        this.track.style.transform = `translate3d(${offset}px, 0, 0)`;
      };

      const onUp = () => {
        if (!this.isDragging) return;
        this.isDragging = false;

        const dx = this.currentX - this.startX;
        const threshold = this.root.clientWidth * 0.12;

        this.track.style.transition = prefersReducedMotion ? "none" : "transform .7s cubic-bezier(.16, 1, .3, 1)";

        if (dx > threshold) this.prev();
        else if (dx < -threshold) this.next();
        else this.goTo(this.index);

        this.startX = 0;
        this.currentX = 0;
      };

      viewport.addEventListener("touchstart", (e) => onDown(e.touches[0].clientX), { passive: true });
      viewport.addEventListener("touchmove", (e) => onMove(e.touches[0].clientX), { passive: true });
      viewport.addEventListener("touchend", onUp, { passive: true });

      viewport.addEventListener("mousedown", (e) => {
        e.preventDefault();
        onDown(e.clientX);
      });
      window.addEventListener("mousemove", (e) => onMove(e.clientX));
      window.addEventListener("mouseup", onUp);

      window.addEventListener("resize", () => this.goTo(this.index, false));
    }

    updateDots() {
      const dots = qsa(".dotbtn", this.dots);
      dots.forEach((d, i) => d.classList.toggle("is-active", i === this.index));
    }

    goTo(i, animate = true) {
      this.index = (i + this.items.length) % this.items.length;

      if (animate && !prefersReducedMotion) {
        this.track.style.transition = "transform .7s cubic-bezier(.16, 1, .3, 1)";
      } else {
        this.track.style.transition = "none";
      }

      const offset = -this.index * this.root.clientWidth;
      this.track.style.transform = `translate3d(${offset}px, 0, 0)`;

      this.updateDots();
    }

    next() { this.goTo(this.index + 1); }
    prev() { this.goTo(this.index - 1); }
  }

  (function initCarousels() {
    const car1 = qs('[data-carousel="residencial"]');
    const car2 = qs('[data-carousel="comercial"]');

    if (car1) new Carousel(car1, projetosResidencial);
    if (car2) new Carousel(car2, projetosComercial);
  })();

})();
