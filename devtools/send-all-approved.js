require("dotenv").config()

const { createClient } = require("@supabase/supabase-js")
const sendTicketsEmail = require("../server/sendTickets")

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
)

async function sendAllApproved() {

    console.log("Starting bulk email sender...")

    // ambil semua order approved & belum dikirim
    const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "approved")
        .eq("email_sent", false)

    if (error) {
        console.error(error)
        return
    }

    console.log(`Found ${orders.length} orders`)

    for (const order of orders) {

        console.log(`\nProcessing order: ${order.id}`)

        try {

            // ambil tickets
            const { data: tickets } = await supabase
                .from("tickets")
                .select("*")
                .eq("order_id", order.id)

            if (!tickets || tickets.length === 0) {
                console.log("No tickets found, skipping...")
                continue
            }

            // format biar sesuai sendTickets.js
            const formattedTickets = tickets.map(t => ({
                ticket_code: t.ticket_code,
                ticket_url: t.ticket_url
            }))

            // kirim email
            await sendTicketsEmail(
                order.email,
                order.name,
                formattedTickets
            )

            console.log(`Email sent to ${order.email}`)

            // update status
            await supabase
                .from("orders")
                .update({ email_sent: true })
                .eq("id", order.id)

        } catch (err) {
            console.error(`Failed for ${order.id}`, err)
        }

    }

    console.log("\nDONE ALL EMAILS")
}

sendAllApproved()