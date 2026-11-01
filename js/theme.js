
"use strict";

// Get theme controls
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const themeMeta = document.querySelector('meta[name="theme-color"]');

// Apply selected theme
function applyTheme(theme) {
    const selectedTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", selectedTheme);

    if (themeIcon) {
        themeIcon.textContent = selectedTheme === "dark" ? "☀" : "☾";
    }

    if (themeMeta) {
        themeMeta.setAttribute(
            "content",
            selectedTheme === "dark" ? "#111522" : "#f8fafc"
        );
    }
}

// Load saved theme
let savedTheme = "light";

try {
    savedTheme = localStorage.getItem("googleShortenerTheme") || "light";
} catch (error) {
    console.warn("Theme preference could not be loaded.");
}

applyTheme(savedTheme);

// Switch theme when button is clicked
if (themeToggle) {
    themeToggle.addEventListener("click", function () {
        const currentTheme =
            document.documentElement.getAttribute("data-theme");

        const nextTheme = currentTheme === "dark" ? "light" : "dark";

        applyTheme(nextTheme);

        try {
            localStorage.setItem("googleShortenerTheme", nextTheme);
        } catch (error) {
            console.warn("Theme preference could not be saved.");
        }
    });
}
