require("dotenv").config({ path: "../server/.env" })

const { createClient } = require("@supabase/supabase-js")
const { v4: uuidv4 } = require("uuid")

const generateTicket = require("../server/generateTicket")
const sendTicketsEmail = require("../server/sendTickets")

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
)

async function sendAllApproved() {

    console.log("\n=== EPIC BULK EMAIL SENDER ===\n")

    const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "approved")
        .eq("email_sent", false)

    if (error) {
        console.error(error)
        return
    }

    if (!orders || orders.length === 0) {
        console.log("No approved orders.")
        return
    }

    console.log("Orders to process:\n")

    orders.forEach((o, i) => {
        console.log(`${i + 1}. ${o.email} | qty: ${o.quantity}`)
    })

    console.log(`\nTotal: ${orders.length}\n`)

    for (const order of orders) {

        console.log("\nProcessing:", order.email)

        let { data: tickets } = await supabase
            .from("tickets")
            .select("*")
            .eq("order_id", order.id)

        // kalau belum ada ticket
        if (!tickets || tickets.length === 0) {

            console.log("No tickets found. Generating tickets...")

            tickets = []

            for (let i = 0; i < order.quantity; i++) {

                const ticketCode =
                    "EPIC-" + uuidv4().slice(0, 8).toUpperCase()

                try {

                    const ticketUrl = await generateTicket(
                        ticketCode,
                        supabase
                    )

                    const { data: newTicket, error: insertError } =
                        await supabase
                            .from("tickets")
                            .insert({
                                order_id: order.id,
                                ticket_code: ticketCode,
                                ticket_url: ticketUrl,
                            })
                            .select()
                            .single()

                    if (insertError) {
                        console.error("Insert failed:", insertError)
                        continue
                    }

                    tickets.push(newTicket)

                    console.log("Ticket created:", ticketCode)

                } catch (err) {

                    console.error("Generate failed:", err)
                }
            }
        }

        if (!tickets || tickets.length === 0) {
            console.log("No tickets available. Skipping email.")
            continue
        }

        const formattedTickets = tickets.map(t => ({
            ticket_code: t.ticket_code,
            ticket_url: t.ticket_url
        }))

        try {

            await sendTicketsEmail(
                order.email,
                order.name,
                formattedTickets
            )

            console.log("Email sent to:", order.email)

            await supabase
                .from("orders")
                .update({ email_sent: true })
                .eq("id", order.id)

        } catch (err) {

            console.error("Email failed:", err)
        }
    }

    console.log("\nDONE ALL EMAILS\n")
}

sendAllApproved()