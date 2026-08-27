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

leadForm.addEventListener('submit', (event) => {
  event.preventDefault();
  formStatus.textContent = "Thanks — the form design is ready. We'll connect real submissions next.";
});

year.textContent = new Date().getFullYear();
