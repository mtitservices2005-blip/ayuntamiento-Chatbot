const toggle = document.querySelector(".nav__toggle");
const menu = document.querySelector("#menu-principal");
const reply = document.querySelector(".assistant-card__reply");

const replies = {
  "Reportar incidencia":
    "Te llevaremos al Citizen Portal V2 demo para crear una incidencia sin duplicar lógica en esta portada.",
  "Consultar ticket":
    "Usa la consulta demo del Citizen Portal V2 para revisar el estado de un ticket ciudadano.",
  "Horario municipal":
    "Horario demo: lunes a viernes, 8:00 a. m. a 4:00 p. m. Confirma siempre con fuentes oficiales.",
};

toggle?.addEventListener("click", () => {
  const isOpen = menu.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", String(isOpen));
});

menu?.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    menu.classList.remove("is-open");
    toggle?.setAttribute("aria-expanded", "false");
  }
});

document.querySelectorAll("[data-suggestion]").forEach((button) => {
  button.addEventListener("click", () => {
    reply.textContent =
      replies[button.dataset.suggestion] ?? "Orientación demo no disponible.";
  });
});
