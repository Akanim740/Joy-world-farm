document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const expanded = navLinks.classList.toggle('active');
      menuBtn.setAttribute('aria-expanded', expanded);
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  fetch('/api/config')
    .then(r => r.json())
    .then(data => {
      const num = data.whatsappNumber || '';
      const phoneEl = document.getElementById('contactPhone');
      if (phoneEl && !num) {
        phoneEl.textContent = 'WhatsApp number coming soon';
      } else if (phoneEl && num) {
        phoneEl.textContent = num;
      }
      const locEl = document.getElementById('contactLocation');
      if (locEl && data.location) locEl.textContent = data.location;
      const emailEl = document.getElementById('contactEmail');
      if (emailEl && data.email) emailEl.textContent = data.email;

      ['heroWhatsappBtn', 'ctaWhatsappBtn', 'whatsappNavBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (num) {
          btn.href = getWhatsappUrl(num, 'Hello Joy World Farm, I would like to make an enquiry.');
          btn.removeAttribute('hidden');
        }
      });
    })
    .catch(() => {});
});
