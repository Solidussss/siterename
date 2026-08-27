const styleButtons = document.querySelectorAll('.style-option');
const demos = document.querySelectorAll('[data-demo]');
const leadForm = document.getElementById('leadForm');
const formStatus = document.getElementById('formStatus');
const year = document.getElementById('year');

styleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const style = button.dataset.style;
    styleButtons.forEach((item) => item.classList.toggle('active', item === button));
    demos.forEach((demo) => demo.classList.toggle('active', demo.dataset.demo === style));
  });
});

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('visible'));
}

leadForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const submitButton = leadForm.querySelector('button[type="submit"]');
  const originalLabel = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = 'Sending…';
  formStatus.className = 'form-status';
  formStatus.textContent = 'Sending your project…';

  try {
    const formData = new FormData(leadForm);
    const payload = Object.fromEntries(formData.entries());

    const response = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) {
      throw new Error(result.message || 'Unable to send your project.');
    }

    leadForm.reset();
    formStatus.className = 'form-status success';
    formStatus.textContent = result.message || 'Project received. We’ll get back to you soon.';
  } catch (error) {
    formStatus.className = 'form-status error';
    formStatus.textContent = error.message || 'Something went wrong. Please email hello@siteremade.com.';
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});

year.textContent = new Date().getFullYear();
