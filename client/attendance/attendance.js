const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby78mDXpowhTXbFv4qz-JUudj6xzljcq41P2eKbI7eRnKt1HG36gex-0znHnyzvCvBP/exec";

const form = document.getElementById("absenForm");
const statusText = document.getElementById("status");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const division = document.getElementById("division").value;
    const otp = document.getElementById("code").value;

    statusText.innerText = "Validating...";

    try {
        const res = await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify({ name, division, otp })
        });

        const data = await res.json();

        if (data.success) {
            statusText.innerText = "Absen berhasil";
            statusText.style.color = "green";
            form.reset();
        } else {
            statusText.innerText = data.message;
            statusText.style.color = "red";
        }

    } catch (err) {
        statusText.innerText = "Server error";
        statusText.style.color = "red";
    }
});