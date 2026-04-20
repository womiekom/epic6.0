/* ===============================
MODAL ELEMENTS
=============================== */

const modalOverlay = document.getElementById("modal-overlay")
const modalTitle = document.getElementById("modal-title")
const modalMessage = document.getElementById("modal-message")
const modalEmailText = document.getElementById("modal-email-text")

const modalLoading = document.getElementById("modal-loading")
const modalButtons = document.getElementById("modal-buttons")

const modalCancel = document.getElementById("modal-cancel")
const modalSubmit = document.getElementById("modal-submit")

function showModal() {

    modalOverlay.classList.remove("hidden")

    modalTitle.innerText = "Submit Payment"

    modalMessage.innerText =
        "Are you sure you want to submit this proof of payment?"

    modalEmailText.innerText = orderData.email

    modalLoading.classList.add("hidden")
    modalButtons.classList.remove("hidden")
}

function hideModal() {
    modalOverlay.classList.add("hidden")
}

modalCancel.onclick = hideModal

/* ===============================
GET TICKET TYPE FROM URL
=============================== */
let isSubmitting = false
const params = new URLSearchParams(window.location.search)
const ticket = params.get("ticket")
const type = params.get("type")

const ticketText = document.getElementById("ticket-type")

const bundleConfig1 = {
    solo: {
        quantity: 1,
        price: 55000
    },
    duo: {
        quantity: 2,
        price: 105000
    },
    trio: {
        quantity: 3,
        price: 150000
    }
}

const bundleConfig2 = {
    solo: {
        quantity: 1,
        price: 95000
    },
    duo: {
        quantity: 2,
        price: 180000
    },
    trio: {
        quantity: 3,
        price: 270000
    },
    five: {
        quantity: 5,
        price: 450000
    },
    seven: {
        quantity: 7,
        price: 630000
    }
}

// safety check
if (!type) {
    ticketText.innerText = "Unknown Ticket"
} else {
    if (type === "solo") {
        ticketText.innerText = "1 Ticket"
    }
    else if (type === "duo") {
        ticketText.innerText = "Duo Pawtners (2 Tickets)"
    }
    else if (type === "trio") {
        ticketText.innerText = "Three Pawventure (3 Tickets)"
    }
    else if (type === "five") {
        ticketText.innerText = "Meowdy Five (5 Tickets)"
    }
    else if (type === "seven") {
        ticketText.innerText = "Meowdy Seven (7 Tickets)"
    }
}


/* ===============================
FORM & PAYMENT TOGGLE
=============================== */

const form = document.getElementById("purchase-form")
const purchaseContainer = document.getElementById("purchase-container")
const paymentContainer = document.getElementById("payment-container")
const backBtn = document.getElementById("back-btn")

let orderData = {}

form.addEventListener("submit", function (e) {

    e.preventDefault()

    const name = document.getElementById("name").value
    const email = document.getElementById("email").value
    const phone = document.getElementById("phone").value

    const bundle = bundleConfig2[type]

    if (!bundle) {
        alert("Invalid ticket type")
        return
    }

    orderData = {
        name: name,
        email: email,
        phone: phone,
        ticket: ticket,
        type: type,
        quantity: bundle.quantity,
        total_price: bundle.price
    }

    // fade out purchase form
    purchaseContainer.style.opacity = "0"

    setTimeout(() => {

        purchaseContainer.style.display = "none"
        paymentContainer.style.display = "block"
        // small delay so CSS transition works
        setTimeout(() => {
            paymentContainer.style.opacity = "1"
        }, 50)

    }, 500)

})


/* ===============================
BACK BUTTON
=============================== */

backBtn.addEventListener("click", function () {
    paymentContainer.style.opacity = "0"
    setTimeout(() => {
        paymentContainer.style.display = "none"
        purchaseContainer.style.display = "block"
        setTimeout(() => {
            purchaseContainer.style.opacity = "1"
        }, 50)

    }, 500)

})

const supabaseUrl = "https://gzrjjjjzojjvxpgalgzp.supabase.co"
const supabaseKey = "sb_publishable_sp8LBo0QCA4Z9PKhd2nVOA_dRRin-Mg"

const { createClient } = supabase
const client = createClient(supabaseUrl, supabaseKey)

const submitProofBtn = document.getElementById("submit-proof")

function showError(message) {
    modalOverlay.classList.remove("hidden") // ← pastiin modal selalu muncul

    modalLoading.classList.add("hidden")

    modalTitle.innerText = "Failed"
    modalMessage.innerText = message
    modalEmailText.innerText = orderData.email

    modalButtons.classList.add("hidden")

    isSubmitting = false
    submitProofBtn.disabled = false
    submitProofBtn.innerText = "Submit"

    setTimeout(() => {
        hideModal()
    }, 2000)
}

submitProofBtn.addEventListener("click", function () {
    if (!orderData.email) {
        showError("Please fill purchase form first")
        return
    }
    showModal()
})

modalSubmit.addEventListener("click", submitOrder)
async function submitOrder() {

    if (isSubmitting) return
    isSubmitting = true

    modalButtons.classList.add("hidden")
    modalLoading.classList.remove("hidden")

    const fileInput = document.getElementById("proof")
    const file = fileInput.files[0]

    submitProofBtn.disabled = true
    submitProofBtn.innerText = "Processing..."

    if (!file) {
        showError("Please upload proof of payment")
        return
    }

    if (file.size > 2000000) {
        showError("Please upload file under 2MB")
        return
    }

    try {

        // =========================
        // 1. UPLOAD FILE
        // =========================
        const fileName = Date.now() + "_" + file.name

        const { error: uploadError } = await client.storage
            .from("payment-proofs")
            .upload(fileName, file, {
                contentType: file.type
            })

        if (uploadError) throw uploadError

        const { data } = client.storage
            .from("payment-proofs")
            .getPublicUrl(fileName)

        const proofUrl = data.publicUrl

        // =========================
        // 2. SEND TO BACKEND (QUOTA CHECK HERE)
        // =========================
        const res = await fetch("https://epic60-production-0374.up.railway.app/create-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: orderData.name,
                email: orderData.email,
                phone: orderData.phone,
                ticket_type: orderData.ticket,
                bundle_type: orderData.type,
                quantity: orderData.quantity,
                total_price: orderData.total_price,
                proof_url: proofUrl
            })
        })

        const result = await res.json()

        if (!res.ok) {
            showError(result.error || "Tickets sold out")
            return
        }

        // =========================
        // 3. SUCCESS UI
        // =========================
        modalLoading.classList.add("hidden")

        modalTitle.innerText = "Success"
        modalMessage.innerText =
            "Upload sent! We will email the e-ticket soon."

        modalEmailText.innerText = orderData.email

        submitProofBtn.innerText = "Submitted!"

        isSubmitting = false

        setTimeout(() => {
            window.location.href = "../index.html"
        }, 3000)

    } catch (err) {
        console.error(err)
        showError("Failed to send, please resend it")
    }

}