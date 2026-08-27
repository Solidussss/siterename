const styleButtons = document.querySelectorAll(".style-option");
const demoSite = document.getElementById("demoSite");
const leadForm = document.getElementById("leadForm");
const formStatus = document.getElementById("formStatus");
const year = document.getElementById("year");

styleButtons.forEach((button) => {
  button.addEventListener("click", () => {
    styleButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    const style = button.dataset.style;

    demoSite.classList.remove("style-premium", "style-bold");

    if (style === "premium") {
      demoSite.classList.add("style-premium");
    }

    if (style === "bold") {
      demoSite.classList.add("style-bold");
    }
  });
});

leadForm.addEventListener("submit", (event) => {
  event.preventDefault();

  formStatus.textContent =
    "Form is ready visually. We'll connect the real submission system next.";
});

year.textContent = new Date().getFullYear();