/* ============================================
   Sandoval Home Improvement - Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Mobile Nav Toggle ---- */
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navMenu.classList.toggle('hidden', !isOpen);
      // Animate hamburger → X
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const bars = navToggle.querySelectorAll('.bar');
      if (bars.length === 3) {
        bars[0].style.transform = isOpen ? 'translateY(8px) rotate(45deg)' : '';
        bars[1].style.opacity = isOpen ? '0' : '1';
        bars[2].style.transform = isOpen ? 'translateY(-8px) rotate(-45deg)' : '';
      }
    });
  }

  /* ---- Scroll Animations ---- */
  const fadeEls = document.querySelectorAll('.fade-up');
  if (fadeEls.length > 0 && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    fadeEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: show everything immediately
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  /* ---- Testimonials Carousel ---- */
  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const dots = document.querySelectorAll('.carousel-dot');

  if (track && prevBtn && nextBtn) {
    const slides = track.querySelectorAll('.carousel-slide');
    let current = 0;
    const total = slides.length;

    function goTo(idx) {
      current = (idx + total) % total;
      track.style.transform = `translateX(-${current * 100}%)`;
      dots.forEach((d, i) => {
        d.classList.toggle('bg-blue-600', i === current);
        d.classList.toggle('bg-gray-300', i !== current);
      });
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));
    dots.forEach((d, i) => d.addEventListener('click', () => goTo(i)));

    // Auto-play every 5 seconds
    let autoPlay = setInterval(() => goTo(current + 1), 5000);
    [prevBtn, nextBtn, ...dots].forEach(el => {
      el.addEventListener('click', () => {
        clearInterval(autoPlay);
        autoPlay = setInterval(() => goTo(current + 1), 5000);
      });
    });
  }

  /* ---- Gallery Lightbox ---- */
  const lightbox = document.getElementById('lightbox-overlay');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');

  if (lightbox) {
    document.querySelectorAll('[data-lightbox]').forEach(item => {
      item.addEventListener('click', () => {
        const src = item.dataset.lightbox;
        const caption = item.dataset.caption || '';
        lightboxImg.src = src;
        lightboxCaption.textContent = caption;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    });

    function closeLightbox() {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
      lightboxImg.src = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ---- Gallery Category Filter ---- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const cat = btn.dataset.filter;
        galleryItems.forEach(item => {
          const show = cat === 'all' || item.dataset.category === cat;
          item.style.display = show ? 'block' : 'none';
        });
      });
    });
  }

  /* ---- Request Quote Form ---- */
  const quoteForm = document.getElementById('quote-form');
  const quoteConfirm = document.getElementById('quote-confirm');

  if (quoteForm && quoteConfirm) {
    quoteForm.addEventListener('submit', e => {
      e.preventDefault();
      quoteForm.style.display = 'none';
      quoteConfirm.classList.remove('hidden');
      quoteConfirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ---- Appointment Scheduler ---- */
  const schedulerForm = document.getElementById('scheduler-form');
  const schedulerConfirm = document.getElementById('scheduler-confirm');
  const schedulerDateInput = document.getElementById('scheduler-date');

  if (schedulerDateInput) {
    // Block past dates
    const today = new Date().toISOString().split('T')[0];
    schedulerDateInput.setAttribute('min', today);
  }

  if (schedulerForm && schedulerConfirm) {
    schedulerForm.addEventListener('submit', e => {
      e.preventDefault();
      const date = document.getElementById('scheduler-date').value;
      const service = document.getElementById('scheduler-service').value;
      const checkedTime = document.querySelector('input[name="scheduler-time"]:checked');
      const time = checkedTime ? checkedTime.value : 'a flexible time';
      const confirmDetails = document.getElementById('scheduler-confirm-details');
      if (confirmDetails) {
        const serviceLabel = document.getElementById('scheduler-service').selectedOptions[0].text;
        confirmDetails.textContent = `${serviceLabel} on ${new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })} at ${time}`;
      }
      schedulerForm.classList.add('hidden');
      schedulerConfirm.classList.remove('hidden');
      schedulerConfirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ---- Contact Form ---- */
  const contactForm = document.getElementById('contact-form');
  const contactConfirm = document.getElementById('contact-confirm');

  if (contactForm && contactConfirm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      contactForm.style.display = 'none';
      contactConfirm.classList.remove('hidden');
      contactConfirm.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  /* ---- Preferred Date: block past dates ---- */
  const prefDate = document.getElementById('preferred-date');
  if (prefDate) {
    prefDate.setAttribute('min', new Date().toISOString().split('T')[0]);
  }

});
