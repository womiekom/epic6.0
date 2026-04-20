const supabaseUrl = "https://gzrjjjjzojjvxpgalgzp.supabase.co"
const supabaseKey = "sb_publishable_sp8LBo0QCA4Z9PKhd2nVOA_dRRin-Mg"

const { createClient } = supabase
const client = createClient(supabaseUrl, supabaseKey)

/* ===============================
ELEMENTS
=============================== */

const loginContainer = document.getElementById("login-container")
const dashboardContainer = document.getElementById("dashboard-container")

const loginForm = document.getElementById("login-form")
const logoutBtn = document.getElementById("logout-btn")

const ordersBody = document.getElementById("orders-body")

const modalOverlay = document.getElementById("modal-overlay")
const modalTitle = document.getElementById("modal-title")
const modalMessage = document.getElementById("modal-message")

const modalCancelApprove = document.getElementById("modal-cancel-approve")
const modalCancelReject = document.getElementById("modal-cancel-reject")
const modalApprove = document.getElementById("modal-approve")
const modalReject = document.getElementById("modal-reject")

const modalButtons1 = document.getElementById("modal-buttons1")
const modalButtons2 = document.getElementById("modal-buttons2")
const modalLoading = document.getElementById("modal-loading")

console.log(loginContainer)
console.log(dashboardContainer)
/* ===============================
LOGIN
=============================== */

loginForm.addEventListener("submit", async (e) => {

    e.preventDefault()

    const email = document.getElementById("admin-email").value
    const password = document.getElementById("admin-password").value

    const { error } = await client.auth.signInWithPassword({
        email,
        password
    })

    if (error) {
        alert("Login failed")
        return
    }

    showDashboard()
    loadOrders()

})

/* ===============================
SESSION CHECK
=============================== */

async function checkSession() {

    const { data } = await client.auth.getSession()

    if (data.session) {
        showDashboard()
        loadOrders()
    }

}

checkSession()

client.auth.onAuthStateChange((event, session) => {

    if (session) {
        showDashboard()
        loadOrders()
    } else {
        showLogin()
    }

})

/* ===============================
UI STATE CONTROL
=============================== */

function showDashboard() {

    loginContainer.classList.add("hidden")
    dashboardContainer.classList.remove("hidden")

}

function showLogin() {

    dashboardContainer.classList.add("hidden")
    loginContainer.classList.remove("hidden")

}

function showModal(title, message, type) {

    modalTitle.innerText = title
    modalMessage.innerText = message

    modalOverlay.classList.remove("hidden")

    modalLoading.classList.add("hidden")

    if (type === "approve") {
        modalButtons1.classList.remove("hidden")
        modalButtons2.classList.add("hidden")
    }

    if (type === "reject") {
        modalButtons2.classList.remove("hidden")
        modalButtons1.classList.add("hidden")
    }
}

function hideModal() {
    modalOverlay.classList.add("hidden")
}

modalCancelApprove.onclick = hideModal
modalCancelReject.onclick = hideModal

/* ===============================
LOAD ORDERS
=============================== */

async function loadOrders() {

    const { data, error } = await client
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })

    if (error) {
        console.error(error)
        return
    }

    ordersBody.innerHTML = ""

    data.forEach(order => {

        const row = document.createElement("tr")

        row.innerHTML = `
        <td>${order.name}</td>
        <td>${order.email}</td>
        <td>${order.phone}</td>
        <td>${order.ticket_type}</td>
        <td>${order.bundle_type}</td>
        <td>${order.quantity}</td>
        <td>${order.total_price}</td>
        <td><a href="${order.proof_url}" target="_blank">View</a></td>
        <td>${order.status}</td>
        <td id="action-${order.id}">
        ${order.status === "pending"
                ? `<button onclick="approveOrder('${order.id}', ${order.quantity})">Approve</button>
               <button onclick="rejectOrder('${order.id}')">Reject</button>`
                : "Processed"
            }
        </td>
        `
        ordersBody.appendChild(row)

    })

}

/* ===============================
LOGOUT
=============================== */

logoutBtn.addEventListener("click", async () => {

    await client.auth.signOut()

    showLogin()

})

/* ===============================
APPROVE ORDER
=============================== */

async function approveOrder(id, quantity) {

    showModal(
        "Approve Order",
        "Are you sure you want to approve this order and generate tickets?",
        "approve"
    )

    modalApprove.onclick = async () => {

        modalButtons1.classList.add("hidden")
        modalLoading.classList.remove("hidden")
        await fetch("https://epic60-production-0374.up.railway.app/generate-ticket", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                order_id: id,
                quantity: quantity
            })
        })

        try {

            await client
                .from("orders")
                .update({ status: "approved" })
                .eq("id", id)

            await fetch(
                "https://epic60-production-0374.up.railway.app/generate-ticket",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        order_id: id,
                        quantity: quantity
                    })
                }
            )

            modalTitle.innerText = "Success"
            modalMessage.innerText =
                "Ticket generated and email sent successfully"

            setTimeout(() => {
                hideModal()
                loadOrders()
            }, 1500)

        } catch (err) {

            modalTitle.innerText = "Error"
            modalMessage.innerText = "Failed to approve order"

            setTimeout(hideModal, 2000)
        }
    }
}

/* ===============================
REJECT ORDER
=============================== */

async function rejectOrder(id) {

    showModal(
        "Reject Order",
        "Are you sure you want to reject this order?",
        "reject"
    )

    modalReject.onclick = async () => {

        modalButtons2.classList.add("hidden")
        modalLoading.classList.remove("hidden")

        try {

            await client
                .from("orders")
                .update({ status: "rejected" })
                .eq("id", id)

            modalTitle.innerText = "Rejected"
            modalMessage.innerText =
                "Order has been rejected"

            setTimeout(() => {
                hideModal()
                loadOrders()
            }, 1200)

        } catch (err) {

            modalTitle.innerText = "Error"
            modalMessage.innerText =
                "Failed to reject order"

            setTimeout(hideModal, 2000)
        }
    }
}
loadOrders()
