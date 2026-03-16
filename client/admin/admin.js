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

    const actionCell = document.getElementById(`action-${id}`)
    actionCell.innerHTML = "Processing..."

    await client
        .from("orders")
        .update({ status: "approved" })
        .eq("id", id)

    for (let i = 0; i < quantity; i++) {

        const code = generateTicketCode()

        await client
            .from("tickets")
            .insert({
                order_id: id,
                ticket_code: code
            })

    }

    loadOrders()
}

/* ===============================
REJECT ORDER
=============================== */

async function rejectOrder(id) {
    await client
        .from("orders")
        .update({ status: "rejected" })
        .eq("id", id)

    loadOrders()
}

function generateTicketCode() {

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

    let result = "EPIC6-"

    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    return result
}