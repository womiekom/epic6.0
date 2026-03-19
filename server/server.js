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

const PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log(`Server running on ${PORT}`))
