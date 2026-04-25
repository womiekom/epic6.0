const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby78mDXpowhTXbFv4qz-JUudj6xzljcq41P2eKbI7eRnKt1HG36gex-0znHnyzvCvBP/exec";

const form = document.getElementById("absenForm");
const statusText = document.getElementById("status");
const button = form.querySelector("button");

let isSubmitting = false;

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isSubmitting) return; // 🔥 block spam

    const name = document.getElementById("name").value;
    const division = document.getElementById("division").value;
    const otp = document.getElementById("code").value;

    isSubmitting = true;
    button.disabled = true;
    button.innerText = "Submitting...";

    statusText.innerText = "Validating...";
    statusText.style.color = "white";

    try {
        const res = await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify({ name, division, otp })
        });

        const data = await res.json();

        if (data.success) {
            statusText.innerText = "Absen berhasil";
            statusText.style.color = "green";

            button.innerText = "Success ✔";
            button.style.background = "green";

            form.reset();
        } else {
            statusText.innerText = data.message;
            statusText.style.color = "red";

            isSubmitting = false;
            button.disabled = false;
            button.innerText = "Absen";
        }

    } catch (err) {
        statusText.innerText = "Server error";
        statusText.style.color = "red";

        isSubmitting = false;
        button.disabled = false;
        button.innerText = "Absen";
    }
});