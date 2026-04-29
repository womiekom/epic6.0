require("dotenv").config()

const express = require("express")
const cors = require("cors")
const { createClient } = require("@supabase/supabase-js")
const sendTicketsEmail = require("./sendTickets")
const generateTicket = require("./generateTicket")
const rateLimit = require("express-rate-limit")

const app = express()

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}))

app.use(cors({
    origin: [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "https://ekapaksicup.site"
    ]
}))

app.use(express.json())

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
)

/* ===============================
AUTH CHECK
=============================== */
async function verifyUser(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({ error: "No token" })
    }

    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    req.user = data.user
    next()
}

/* ===============================
ADMIN CHECK (IMPORTANT)
=============================== */
function verifyAdmin(req, res, next) {
    const ADMIN_EMAIL = "ekapaksicup6.0@gmail.com"

    if (req.user.email !== ADMIN_EMAIL) {
        return res.status(403).json({ error: "Not admin" })
    }

    next()
}

/* ===============================
UTIL
=============================== */
function generateTicketCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = "EPIC6-"
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

async function generateTickets(order) {

    const { data: existing } = await supabase
        .from("tickets")
        .select("*")
        .eq("order_id", order.id)

    if (existing.length >= order.quantity) return

    const results = []

    for (let i = 0; i < order.quantity; i++) {

        const code = generateTicketCode()
        const ticketUrl = await generateTicket(code, supabase)

        await supabase
            .from("tickets")
            .insert({
                order_id: order.id,
                ticket_code: code,
                ticket_url: ticketUrl,
            })

        results.push({ ticket_code: code, ticket_url: ticketUrl })
    }

    await sendTicketsEmail(order.email, order.name, results)
}

/* ===============================
CREATE ORDER
=============================== */
app.post("/create-order", async (req, res) => {

    const { name, email, phone, ticket_type, bundle_type, quantity, total_price, proof_url } = req.body

    if (!name || !email || !phone) {
        return res.status(400).json({ error: "Missing fields" })
    }

    if (quantity <= 0 || quantity > 10) {
        return res.status(400).json({ error: "Invalid quantity" })
    }

    try {

        const { data: orders } = await supabase
            .from("orders")
            .select("quantity")
            .eq("ticket_type", ticket_type)
            .in("status", ["pending", "approved"])

        const totalSold = orders.reduce((sum, o) => sum + o.quantity, 0)

        if (totalSold + quantity > 300) {
            return res.status(400).json({ error: "Sold out" })
        }

        const { data, error } = await supabase
            .from("orders")
            .insert({
                name,
                email,
                phone,
                ticket_type,
                bundle_type,
                quantity,
                total_price,
                proof_url,
                status: "pending"
            })
            .select()

        if (error) throw error

        res.json({ success: true, data })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

/* ===============================
APPROVE ORDER (SECURE)
=============================== */
app.post("/approve-order", verifyUser, verifyAdmin, async (req, res) => {

    const { order_id } = req.body

    try {

        const { data: order } = await supabase
            .from("orders")
            .select("*")
            .eq("id", order_id)
            .single()

        if (!order) {
            return res.status(404).json({ error: "Order not found" })
        }

        if (order.status === "approved") {
            return res.json({ message: "Already approved" })
        }

        await supabase
            .from("orders")
            .update({ status: "approved" })
            .eq("id", order_id)

        await generateTickets(order)

        res.json({ success: true })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to approve order" })
    }
})

app.get("/tickets-left", async (req, res) => {

    try {

        const { data: orders } = await supabase
            .from("orders")
            .select("quantity")
            .eq("ticket_type", "presale2")
            .in("status", ["pending", "approved"])

        const totalSold = orders.reduce((sum, o) => sum + o.quantity, 0)

        const total = 300
        const left = total - totalSold

        res.json({ total, sold: totalSold, left })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }

})

/* ===============================
RUN SERVER
=============================== */
const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on ${PORT}`))