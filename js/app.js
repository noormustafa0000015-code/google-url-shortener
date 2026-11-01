
"use strict";

// Cloudflare Worker URL
const API_BASE_URL =
    "https://google-shortener-api.noormustafa0000015.workers.dev";

// Website elements
const form = document.getElementById("shortenerForm");
const input = document.getElementById("googleUrl");
const message = document.getElementById("message");
const button = document.getElementById("shortenButton");

// Maximum allowed URL length
const MAX_URL_LENGTH = 2048;

// Validate any public HTTPS website URL
function isValidURL(value) {
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

        // Require a public-looking domain name
        if (!hostname || !hostname.includes(".")) {
            return false;
        }

        // Reject IP addresses
        if (
            hostname.startsWith("[") ||
            /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
        ) {
            return false;
        }

        // Reject local and internal destinations
        if (
            hostname === "localhost" ||
            hostname.endsWith(".localhost") ||
            hostname.endsWith(".local") ||
            hostname.endsWith(".internal")
        ) {
            return false;
        }

        return true;

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

    // Copy button
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

    // Open button
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

    // Confirm the link was saved
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
            "Please paste a website URL first.",
            "error"
        );
        return;
    }

    if (originalURL.length > MAX_URL_LENGTH) {
        showMessage(
            "URL is too long. Maximum length is 2048 characters.",
            "error"
        );
        return;
    }

    if (!isValidURL(originalURL)) {
        showMessage(
            "Please enter a valid public HTTPS website URL.",
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
            error.message + " Please try again.",
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
