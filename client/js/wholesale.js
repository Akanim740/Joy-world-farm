document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/config')
    .then(r => r.json())
    .then(data => {
      const num = data.whatsappNumber || data.businessPhone || data.phone || '';
      const waBtn = document.getElementById('waEnquiryBtn');
      const hoursEl = document.getElementById('wholesaleHours');
      if (hoursEl) hoursEl.textContent = data.businessHours || 'Business hours to be announced';
      if (num && waBtn) {
        const msg = 'Hello Joy World Farm, I would like to enquire about wholesale prices for bulk poultry or catfish supply.';
        if (typeof getWhatsappUrl === 'function') {
          waBtn.href = getWhatsappUrl(num, msg);
        } else {
          waBtn.href = `https://wa.me/${String(num).replace(/[^0-9]/g,'')}?text=${encodeURIComponent(msg)}`;
        }
        waBtn.removeAttribute('hidden');
      }
    })
    .catch(() => {});

  document.getElementById('wholesaleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('whSubmitBtn');
    const errorsBox = document.getElementById('whErrors');
    const msgBox = document.getElementById('formMsg');

    errorsBox.hidden = true;
    msgBox.hidden = true;
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');

    const name = document.getElementById('whName').value.trim();
    const phone = document.getElementById('whPhone').value.trim();

    let hasErrors = false;
    if (!name) { document.getElementById('err-whName').textContent = 'Name is required'; hasErrors = true; }
    if (!phone || !/^[0-9+\-\s()]{7,20}$/.test(phone)) { document.getElementById('err-whPhone').textContent = 'Valid phone number is required'; hasErrors = true; }
    if (hasErrors) {
      errorsBox.hidden = false;
      errorsBox.textContent = 'Please correct the errors above.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Submitting...';

    try {
      const res = await fetch('/api/wholesale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          businessName: document.getElementById('whBusiness').value.trim() || undefined,
          productsRequired: document.getElementById('whProducts').value.trim() || undefined,
          estimatedQuantity: document.getElementById('whQty').value.trim() || undefined,
          notes: document.getElementById('whNotes').value.trim() || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        msgBox.hidden = false;
        msgBox.textContent = 'Your enquiry has been received. We will contact you shortly.';
        e.target.reset();
      } else {
        errorsBox.hidden = false;
        errorsBox.textContent = data.message || (data.errors && data.errors.map(x => x.msg).join('; ')) || 'Failed to submit. Please try again.';
      }
    } catch (err) {
      errorsBox.hidden = false;
      errorsBox.textContent = 'Network error. Please try again.';
    }
    btn.disabled = false;
    btn.textContent = 'Submit Enquiry';
  });
});
