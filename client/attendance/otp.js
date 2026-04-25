const API_URL = "https://script.google.com/macros/s/AKfycby4n1KoOafDv9G4naqLn_zaIdurgUupmX82lFNonqVbUxLbNa7ENCupyIq4KnWJr8VC/exec";

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