const themeToggle = document.getElementById("themeToggle");
const demoScroll = document.getElementById("demoScroll");

themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
});

demoScroll.addEventListener("click", () => {
    document.getElementById("features").scrollIntoView({ behavior: "smooth" });
});