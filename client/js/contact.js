document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/config')
    .then(r => r.json())
    .then(data => {
      const num = data.whatsappNumber || '';
      const phoneEl = document.getElementById('contactPhone');
      const emailEl = document.getElementById('contactEmail');
      const waBtn = document.getElementById('contactWaBtn');
      if (num) {
        if (phoneEl) phoneEl.textContent = num;
        if (waBtn) {
          waBtn.href = getWhatsappUrl(num, 'Hello Joy World Farm, I have an enquiry.');
          waBtn.removeAttribute('hidden');
        }
      }
      if (data.email && emailEl) emailEl.textContent = data.email;
    })
    .catch(() => {});

  document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const toast = document.getElementById('toast');
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    try {
      const res = await fetch('/api/wholesale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: document.getElementById('msgName').value.trim(),
          customerPhone: document.getElementById('msgPhone').value.trim(),
          businessName: document.getElementById('msgEmail').value.trim() || undefined,
          productsRequired: 'General enquiry',
          estimatedQuantity: '-',
          notes: document.getElementById('msgBody').value.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.textContent = 'Message sent! We will get back to you.';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
        e.target.reset();
      } else {
        toast.textContent = 'Failed to send message. Please try WhatsApp instead.';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
      }
    } catch (err) {
      toast.textContent = 'Network error. Please try WhatsApp instead.';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4000);
    }
    btn.disabled = false;
    btn.textContent = 'Send Enquiry';
  });
});
