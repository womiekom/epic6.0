require("dotenv").config()

const express = require("express")
const cors = require("cors")
const { createClient } = require("@supabase/supabase-js")
const generateTicket = require("./generateTicket")

const app = express()
app.use(cors())
app.use(express.json())

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
)

// GENERATE RANDOM CODE IN BACKEND 
function generateTicketCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let result = "EPIC6-"
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

// MAIN ENDPOINT
const sendTicketsEmail = require("./sendTickets")

app.post("/generate-ticket", async (req, res) => {

    const { order_id, quantity } = req.body

    try {

        const { data: existing } = await supabase
            .from("tickets")
            .select("*")
            .eq("order_id", order_id)

        if (existing.length > 0) {
            return res.json({ message: "Tickets already exist" })
        }

        // ambil data order (buat email)
        const { data: order } = await supabase
            .from("orders")
            .select("*")
            .eq("id", order_id)
            .single()

        const results = []

        for (let i = 0; i < quantity; i++) {

            const code = generateTicketCode()
            const ticketUrl = await generateTicket(code, supabase)

            await supabase
                .from("tickets")
                .insert({
                    order_id,
                    ticket_code: code,
                    ticket_url: ticketUrl,
                })

            results.push({
                ticket_code: code,
                ticket_url: ticketUrl
            })
        }

        // SEND EMAIL
        await sendTicketsEmail(
            order.email,
            order.name,
            results
        )

        res.json({ success: true, tickets: results })

    } catch (err) {
        console.error(err)
        res.status(500).json({ error: "Failed to generate ticket" })
    }

})

app.post("/create-order", async (req, res) => {

    const {
        name,
        email,
        phone,
        ticket_type,
        bundle_type,
        quantity,
        total_price,
        proof_url
    } = req.body

    try {

        const { data: orders } = await supabase
            .from("orders")
            .select("quantity")
            .eq("ticket_type", ticket_type)
            .in("status", ["pending", "approved"])

        const totalSold = orders.reduce((sum, o) => sum + o.quantity, 0)

        if (totalSold + quantity > 450) {
            return res.status(400).json({
                error: "Tickets sold out"
            })
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

app.get("/tickets-left", async (req, res) => {

    try {

        const { data: orders } = await supabase
            .from("orders")
            .select("quantity")
            .eq("ticket_type", "presale2")
            .in("status", ["pending", "approved"])

        const totalSold = orders.reduce((sum, o) => sum + o.quantity, 0)

        const total = 450
        const left = total - totalSold

        res.json({ total, sold: totalSold, left })

    } catch (err) {
        res.status(500).json({ error: err.message })
    }

})

const PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log(`Server running on ${PORT}`))
