const API_URL = "https://epic60-production-0374.up.railway.app/verify-ticket"

const resultBox = document.getElementById("resultBox")
const resultText = document.getElementById("resultText")
const ticketText = document.getElementById("ticketText")

/* =========================
AUDIO
========================= */

const successSound = new Audio("../assets/sounds/success.mp3")
const errorSound = new Audio("../assets/sounds/used.mp3")
const usedSound = new Audio("../assets/sounds/error.mp3")

/* =========================
SCANNER LOCK
========================= */

let scanningLocked = false

/* =========================
UPDATE UI
========================= */

function setResult(type, title, ticket = "") {

    resultBox.className = ""
    resultBox.classList.add(type)

    resultText.innerText = title
    ticketText.innerText = ticket
}

/* =========================
VERIFY
========================= */

async function verifyTicket(ticketCode) {

    try {

        setResult(
            "idle",
            "Checking...",
            ticketCode
        )

        const res = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ticket_code: ticketCode
            })
        })

        const data = await res.json()

        /* =========================
        VALID
        ========================= */

        if (data.success) {

            successSound.play()

            setResult(
                "valid",
                "VALID",
                ticketCode
            )
        }

        /* =========================
        USED
        ========================= */

        else if (
            data.status === "USED" ||
            data.status === "ALREADY_SCANNED"
        ) {

            usedSound.play()

            setResult(
                "used",
                "ALREADY USED",
                ticketCode
            )
        }

        /* =========================
        INVALID
        ========================= */

        else {

            errorSound.play()

            setResult(
                "invalid",
                "INVALID",
                ticketCode
            )
        }

    } catch (err) {

        console.error(err)

        errorSound.play()

        setResult(
            "invalid",
            "SERVER ERROR"
        )
    }
}

/* =========================
START QR
========================= */

const html5QrCode = new Html5Qrcode("reader")

Html5Qrcode.getCameras()
    .then(devices => {

        if (devices && devices.length) {

            const cameraId = devices[0].id

            html5QrCode.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: 250
                },

                async (decodedText) => {

                    // prevent spam
                    if (scanningLocked) return

                    scanningLocked = true

                    // PAUSE CAMERA
                    await html5QrCode.pause()

                    console.log("SCANNED:", decodedText)

                    let ticketCode = decodedText

                    /* =========================
                    EXTRACT URL CODE
                    ========================= */

                    try {

                        const url = new URL(decodedText)

                        const code =
                            url.searchParams.get("code")

                        if (code) {
                            ticketCode = code
                        }

                    } catch {
                        // raw text
                    }

                    console.log("EXTRACTED:", ticketCode)

                    await verifyTicket(ticketCode)

                    // 3 SECOND FREEZE
                    setTimeout(async () => {

                        await html5QrCode.resume()

                        setResult(
                            "idle",
                            "Ready To Scan"
                        )

                        scanningLocked = false

                    }, 3000)
                }
            )
        }

    })
    .catch(err => {

        console.error(err)

        setResult(
            "invalid",
            "CAMERA ERROR"
        )
    })