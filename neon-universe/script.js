
/* =========================================
   NEON UNIVERSE — INTERACTIVE EXPERIENCE
========================================= */

"use strict";

// Respect visitors who prefer reduced motion.
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

// =========================================
// 1. ANIMATED STARFIELD
// =========================================

const canvas = document.getElementById("starfield");
const ctx = canvas?.getContext("2d");

let stars = [];
let animationFrame = null;
let canvasWidth = 0;
let canvasHeight = 0;
let lastFrameTime = 0;

const pointer = {
  x: -1000,
  y: -1000,
  active: false
};

function createStar() {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    radius: Math.random() * 1.4 + 0.25,
    alpha: Math.random() * 0.6 + 0.15,
    twinkleSpeed: Math.random() * 0.0015 + 0.0004,
    phase: Math.random() * Math.PI * 2,
    drift: (Math.random() - 0.5) * 0.12
  };
}

function resizeCanvas() {
  if (!canvas || !ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;

  canvas.width = Math.round(canvasWidth * dpr);
  canvas.height = Math.round(canvasHeight * dpr);

  canvas.style.width = `${canvasWidth}px`;
  canvas.style.height = `${canvasHeight}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const starCount = Math.min(
    180,
    Math.floor((canvasWidth * canvasHeight) / 6500)
  );

  stars = Array.from({ length: starCount }, createStar);

  if (prefersReducedMotion) {
    drawStaticStars();
  }
}

function drawStaticStars() {
  if (!ctx) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(185, 205, 255, ${star.alpha})`;
    ctx.fill();
  });
}

function animateStars(timestamp = 0) {
  if (!ctx || prefersReducedMotion) return;

  // Limit drawing to approximately 30 frames per second.
  if (timestamp - lastFrameTime < 33) {
    animationFrame = requestAnimationFrame(animateStars);
    return;
  }

  lastFrameTime = timestamp;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  stars.forEach((star) => {
    star.phase += star.twinkleSpeed * 16;
    star.x += star.drift;

    if (star.x < 0) star.x = canvasWidth;
    if (star.x > canvasWidth) star.x = 0;

    const twinkle =
      0.55 + Math.sin(star.phase) * 0.35;

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

    ctx.fillStyle = `rgba(185, 205, 255, ${
      Math.max(0.08, star.alpha * twinkle)
    })`;

    ctx.fill();

    // Give nearby stars a subtle glow.
    if (star.radius > 1.2) {
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(90, 135, 255, ${
        star.alpha * twinkle * 0.12
      })`;
      ctx.fill();
    }

    // Gently repel stars near the pointer.
    if (pointer.active) {
      const dx = star.x - pointer.x;
      const dy = star.y - pointer.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = 100;

      if (distance > 0 && distance < radius) {
        const force = (radius - distance) / radius;

        star.x += (dx / distance) * force * 0.8;
        star.y += (dy / distance) * force * 0.8;
      }
    }
  });

  animationFrame = requestAnimationFrame(animateStars);
}

if (canvas && ctx) {
  resizeCanvas();

  if (!prefersReducedMotion) {
    animationFrame = requestAnimationFrame(animateStars);
  }

  window.addEventListener("resize", resizeCanvas, {
    passive: true
  });
}

// =========================================
// 2. POINTER INTERACTION
// =========================================

const supportsFinePointer = window.matchMedia(
  "(hover: hover) and (pointer: fine)"
).matches;

if (supportsFinePointer && !prefersReducedMotion) {
  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    },
    { passive: true }
  );

  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
}

// =========================================
// 3. MOBILE NAVIGATION
// =========================================

const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");

function closeMobileMenu() {
  if (!menuToggle || !navLinks) return;

  navLinks.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation");
}

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    const isOpen =
      menuToggle.getAttribute("aria-expanded") === "true";

    menuToggle.setAttribute("aria-expanded", String(!isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Open navigation" : "Close navigation"
    );

    navLinks.classList.toggle("open", !isOpen);
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      navLinks.classList.contains("open") &&
      !navLinks.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 680) {
      closeMobileMenu();
    }
  });
}

// =========================================
// 4. ACTIVE NAVIGATION
// =========================================

const navItems = document.querySelectorAll(".nav-link");
const observedSections = document.querySelectorAll(
  "#home, #explore, #projects, #about"
);

if ("IntersectionObserver" in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visibleSections = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (a, b) =>
            b.intersectionRatio - a.intersectionRatio
        );

      if (!visibleSections.length) return;

      let currentId = visibleSections[0].target.id;

      // Map the visual section to its top-level navigation item.
      if (currentId === "explore") {
        currentId = "home";
      }

      navItems.forEach((link) => {
        const isActive =
          link.getAttribute("href") === `#${currentId}`;

        link.classList.toggle("active", isActive);

        if (isActive) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    },
    {
      rootMargin: "-20% 0px -55% 0px",
      threshold: [0, 0.15, 0.4, 0.7]
    }
  );

  observedSections.forEach((section) => {
    sectionObserver.observe(section);
  });
}

// =========================================
// 5. SMOOTH IN-PAGE NAVIGATION FALLBACK
// =========================================

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const href = link.getAttribute("href");

    if (!href || href === "#") return;

    const target = document.querySelector(href);

    if (!target) return;

    event.preventDefault();

    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start"
    });

    // Update the URL without causing an abrupt page jump.
    if (window.location.hash !== href) {
      history.replaceState(null, "", href);
    }
  });
});

// =========================================
// 6. PROJECT CARD POINTER GLOW
// =========================================

if (supportsFinePointer && !prefersReducedMotion) {
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      card.style.background = `
        radial-gradient(
          circle at ${x}px ${y}px,
          rgba(65, 75, 170, 0.16),
          transparent 55%
        ),
        linear-gradient(
          145deg,
          rgba(20, 20, 49, 0.92),
          rgba(8, 8, 24, 0.98)
        )
      `;
    });

    card.addEventListener("pointerleave", () => {
      card.style.background = "";
    });
  });
}

// =========================================
// 7. INITIALIZE
// =========================================

document.documentElement.classList.add("js-ready");

console.log(
  "%c NEON UNIVERSE ",
  "background: #10102b; color: #20eaff; font-weight: bold; padding: 8px;"
);

console.log("Cosmic experience initialized successfully.");
