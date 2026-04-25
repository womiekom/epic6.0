const API_URL = "https://script.google.com/macros/s/AKfycby78mDXpowhTXbFv4qz-JUudj6xzljcq41P2eKbI7eRnKt1HG36gex-0znHnyzvCvBP/exec";

const otpEl = document.getElementById("otp");
const statusEl = document.getElementById("status");

async function fetchOTP() {
    try {
        const res = await fetch(API_URL + "?t=" + Date.now());
        const data = await res.json();

        otpEl.innerText = data.otp;
        statusEl.innerText = "Live • " + new Date().toLocaleTimeString();

    } catch (err) {
        otpEl.innerText = "ERROR";
        statusEl.innerText = "Failed to fetch OTP";
    }
}

fetchOTP();
setInterval(fetchOTP, 30000);