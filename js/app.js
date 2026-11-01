
"use strict";

// Cloudflare Worker URL
const API_BASE_URL =
    "https://google-shortener-api.noormustafa0000015.workers.dev";

// Website elements
const form = document.getElementById("shortenerForm");
const input = document.getElementById("googleUrl");
const message = document.getElementById("message");
const button = document.getElementById("shortenButton");

// Google domains allowed by the frontend
const allowedDomains = [
    "google.com",
    "google.co.uk",
    "google.ca",
    "google.com.pk",
    "google.com.au",
    "google.co.in",
    "google.de",
    "google.fr",
    "google.co.jp",
    "goo.gl",
    "g.co"
];

// Validate Google URL
function isGoogleURL(value) {
    try {
        const url = new URL(value);

        if (
            url.protocol !== "https:" ||
            url.username ||
            url.password ||
            url.port
        ) {
            return false;
        }

        const hostname = url.hostname.toLowerCase();

        return allowedDomains.some(domain =>
            hostname === domain ||
            hostname.endsWith("." + domain)
        );

    } catch {
        return false;
    }
}

// Show messages
function showMessage(text, type) {
    message.textContent = text;
    message.className = "message " + type;
    message.hidden = false;
}

// Display saved short link
function showShortLink(data) {
    message.textContent = "";

    const wrapper = document.createElement("div");
    wrapper.className = "success-result";

    const heading = document.createElement("p");
    heading.textContent = "Your short link is ready!";
    heading.style.fontWeight = "bold";

    const description = document.createElement("p");
    description.textContent = "Your link has been saved successfully.";

    const link = document.createElement("a");
    link.href = data.shortUrl;
    link.textContent = data.shortUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "short-link";

    const actions = document.createElement("div");
    actions.className = "short-link-actions";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "Copy Link";
    copyButton.className = "copy-button";

    copyButton.addEventListener("click", async function () {
        try {
            await navigator.clipboard.writeText(data.shortUrl);

            copyButton.textContent = "Copied!";
            showMessage(
                "Short link copied successfully!",
                "success"
            );

            setTimeout(() => {
                copyButton.textContent = "Copy Link";
            }, 2000);

        } catch (error) {
            console.error("Copy error:", error);

            showMessage(
                "Could not copy automatically. Please select and copy the link.",
                "error"
            );
        }
    });

    const openButton = document.createElement("a");
    openButton.href = data.shortUrl;
    openButton.target = "_blank";
    openButton.rel = "noopener noreferrer";
    openButton.textContent = "Open Link";
    openButton.className = "open-button";

    actions.appendChild(copyButton);
    actions.appendChild(openButton);

    wrapper.appendChild(heading);
    wrapper.appendChild(description);
    wrapper.appendChild(link);
    wrapper.appendChild(actions);

    message.appendChild(wrapper);
    message.className = "message success";
    message.hidden = false;
}

// Send URL to Cloudflare Worker
async function generateShortId(originalUrl) {
    const response = await fetch(
        API_BASE_URL + "/api/shorten",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                originalUrl: originalUrl
            })
        }
    );

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok || !data.success) {
        throw new Error(data.error || "Something went wrong.");
    }

    // Make sure the backend returned a saved short link
    if (
        data.status !== "saved" ||
        !data.shortId ||
        !data.shortUrl
    ) {
        throw new Error(
            "The server did not return a saved short link. Please check the Worker deployment."
        );
    }

    return data;
}

// Handle form submission
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const originalURL = input.value.trim();

    if (!originalURL) {
        showMessage(
            "Please paste a Google URL first.",
            "error"
        );
        return;
    }

    if (!isGoogleURL(originalURL)) {
        showMessage(
            "Please enter a supported Google HTTPS URL.",
            "error"
        );
        return;
    }

    button.disabled = true;
    button.textContent = "Saving Link...";

    try {
        const result = await generateShortId(originalURL);

        showShortLink(result);

        console.log("Short link successfully saved:", result);

    } catch (error) {
        console.error("Shortener error:", error);

        showMessage(
            error.message +
            " Please try again.",
            "error"
        );

    } finally {
        button.disabled = false;
        button.innerHTML = 'Shorten URL <span>→</span>';
    }
});

// Clear old messages when input changes
input.addEventListener("input", function() {
    message.hidden = true;
    message.textContent = "";
    message.className = "message";
});
