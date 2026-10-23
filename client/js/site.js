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

  const footerContent = document.querySelector('.footer-content');
  if (footerContent && !document.getElementById('footerPolicies')) {
    const section = document.createElement('div');
    section.className = 'footer-section';
    section.id = 'footerPolicies';
    section.innerHTML = `
      <h3>Policies</h3>
      <ul>
        <li><a href="/delivery-info">Delivery Information</a></li>
        <li><a href="/returns">Returns &amp; Cancellations</a></li>
        <li><a href="/privacy">Privacy Policy</a></li>
        <li><a href="/terms">Terms of Service</a></li>
      </ul>`;
    footerContent.appendChild(section);
  }

  fetch('/api/config')
    .then(r => r.json())
    .then(data => {
      const num = data.whatsappNumber || data.businessPhone || data.phone || '';
      const email = data.email || data.businessEmail || '';
      const location = data.location || 'Port Harcourt, Rivers State, Nigeria';
      const hours = data.businessHours || 'Business hours to be announced';

      const phoneEl = document.getElementById('contactPhone');
      if (phoneEl) {
        if (num) phoneEl.textContent = num;
        else phoneEl.textContent = 'Contact number coming soon';
      }

      const locEl = document.getElementById('contactLocation');
      if (locEl) locEl.textContent = location;

      const emailEl = document.getElementById('contactEmail');
      if (emailEl) {
        if (email) emailEl.textContent = email;
        else emailEl.textContent = 'Email address coming soon';
      }

      const hoursEl = document.getElementById('businessHours');
      if (hoursEl) hoursEl.textContent = hours;

      const footerContact = document.getElementById('footerContact');
      if (footerContact) footerContact.textContent = num || 'Contact number coming soon';

      const footerEmail = document.getElementById('footerEmail');
      if (footerEmail) footerEmail.textContent = email || 'Email address coming soon';

      ['heroWhatsappBtn', 'ctaWhatsappBtn', 'whatsappNavBtn', 'contactWaBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (num) {
          const text = btn.id === 'contactWaBtn' ? 'Hello Joy World Farm, I have an enquiry.' : 'Hello Joy World Farm, I would like to make an enquiry.';
          if (typeof getWhatsappUrl === 'function') {
            btn.href = getWhatsappUrl(num, text);
          } else {
            btn.href = `https://wa.me/${String(num).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
          }
          btn.removeAttribute('hidden');
        }
      });

      const callBtn = document.getElementById('contactCallBtn');
      if (callBtn && num) {
        callBtn.href = `tel:${num}`;
        callBtn.removeAttribute('hidden');
      }
    })
    .catch(() => {});
});
