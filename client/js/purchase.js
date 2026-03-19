/* ===============================
GET TICKET TYPE FROM URL
=============================== */
let isSubmitting = false
const params = new URLSearchParams(window.location.search)
const ticket = params.get("ticket")
const type = params.get("type")

const ticketText = document.getElementById("ticket-type")

const bundleConfig = {
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

// safety check
if (!type) {
    ticketText.innerText = "Unknown Ticket"
} else {
    if (type === "solo") {
        ticketText.innerText = "1 Ticket"
    }
    else if (type === "duo") {
        ticketText.innerText = "Duo Quest (2 Tickets)"
    }
    else if (type === "trio") {
        ticketText.innerText = "Three Muskepaws (3 Tickets)"
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

    const bundle = bundleConfig[type]

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

submitProofBtn.addEventListener("click", submitOrder)
async function submitOrder() {

    if (isSubmitting) return
    isSubmitting = true

    const fileInput = document.getElementById("proof")
    const file = fileInput.files[0]
    const notification = document.getElementById("notification")

    submitProofBtn.disabled = true
    submitProofBtn.innerText = "Processing..."

    if (!file) {
        alert("Please upload proof of payment")
        isSubmitting = false
        submitProofBtn.disabled = false
        return
    }

    if (file.size > 2000000) {
        alert("File too large (max 2MB)")
        isSubmitting = false
        submitProofBtn.disabled = false
        return
    }

    try {

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

        const { error: insertError } = await client
            .from("orders")
            .insert([
                {
                    name: orderData.name,
                    email: orderData.email,
                    phone: orderData.phone,
                    ticket_type: orderData.ticket,
                    bundle_type: orderData.type,
                    quantity: orderData.quantity,
                    total_price: orderData.total_price,
                    proof_url: proofUrl,
                    status: "pending"
                }
            ])

        if (insertError) throw insertError

        notification.classList.add("show")

        setTimeout(() => {
            notification.classList.remove("show")
        }, 3000)

    } catch (err) {
        console.error(err)
        alert(err.message)

        isSubmitting = false
        submitProofBtn.disabled = false
        submitProofBtn.innerText = "Submit"

        return
    }

    submitProofBtn.innerText = "Submitted!"
}