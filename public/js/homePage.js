document.addEventListener("DOMContentLoaded", () => {
  const firstTitle = document.getElementById("first-title");
  const secondTitle = document.getElementById("second-title");
  if (firstTitle) {
    firstTitle.style.color = "#0b2c4d";
    firstTitle.style.fontSize = "clamp(2rem, 4vw, 3.7rem)";
  }
  if (secondTitle) {
    secondTitle.style.color = "#23425f";
    secondTitle.style.fontSize = "clamp(1.05rem, 2vw, 1.55rem)";
  }
});
