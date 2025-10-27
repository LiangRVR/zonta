// Zonta Club of Naples - Main JavaScript
import { includePartials } from "./nav-footer-share.js";

// Load header and footer partials
await includePartials();

// Mobile menu toggle
const mobileMenu = document.getElementById("mobileMenu");
const navLinks = document.getElementById("navLinks");
const header = document.getElementById("header");

if (mobileMenu && navLinks) {
  mobileMenu.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// Close mobile menu when clicking a link
document
  .querySelectorAll(".nav-links a")
  .forEach((link) => {
    link.addEventListener("click", () => {
      if (navLinks) {
        navLinks.classList.remove("active");
      }
    });
  });

// Header scroll effect
let lastScroll = 0;
window.addEventListener("scroll", () => {
  const currentScroll = window.pageYOffset;

  if (header) {
    if (currentScroll > 100) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }

  lastScroll = currentScroll;
});

// Smooth scrolling for anchor links
document
  .querySelectorAll('a[href^="#"]')
  .forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(
        this.getAttribute("href")
      );
      if (target) {
        const headerOffset = 80;
        const elementPosition =
          target.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition +
          window.pageYOffset -
          headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    });
  });

// Intersection Observer for scroll animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.animation =
        "fadeInUp 0.8s ease forwards";
      entry.target.style.opacity = "1";
    }
  });
}, observerOptions);

// Observe elements for animation
document
  .querySelectorAll(
    ".icon-card, .scholarship-card, .service-card, .benefit-item, .stat-item"
  )
  .forEach((el) => {
    el.style.opacity = "0";
    observer.observe(el);
  });

// Counter animation for stats
const animateCounter = (element, target) => {
  let current = 0;
  const increment = target / 50;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target + "+";
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current) + "+";
    }
  }, 30);
};

// Trigger counter animation when stats section is visible
const statsObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        document
          .querySelectorAll(".stat-number")
          .forEach((stat) => {
            const target = parseInt(
              stat.textContent.replace(/\D/g, "")
            );
            animateCounter(stat, target);
          });
        statsObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

const statsSection = document.querySelector(".stats");
if (statsSection) {
  statsObserver.observe(statsSection);
}
