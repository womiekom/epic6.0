require("dotenv").config({ path: __dirname + "/../server/.env" })

const { createClient } = require("@supabase/supabase-js")
const { v4: uuidv4 } = require("uuid")

const generateTicket = require("../server/generateTicket")
const sendTicketsEmail = require("../server/sendTickets")

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
)

// GANTI SALAH SATU (ID atau EMAIL)
const TARGET = {
    id: null, // contoh: "order-uuid"
    email: "aileenrizkyaisyah@gmail.com"
}

async function sendSingleOrder() {
    console.log("\n=== SEND SINGLE ORDER ===\n")

    let query = supabase.from("orders").select("*")

    if (TARGET.id) {
        query = query.eq("id", TARGET.id)
    } else if (TARGET.email) {
        query = query.eq("email", TARGET.email)
    } else {
        console.log("❌ Harus isi TARGET.id atau TARGET.email")
        return
    }

    const { data, error } = await query.limit(1)

    if (error || !data || data.length === 0) {
        console.error("❌ Order not found:", error)
        return
    }

    const order = data[0]

    console.log("Target:", order.email)
    console.log("Name:", order.name)
    console.log("Qty:", order.quantity)

    // Ambil ticket
    let { data: tickets } = await supabase
        .from("tickets")
        .select("*")
        .eq("order_id", order.id)

    // Generate kalau belum ada
    if (!tickets || tickets.length === 0) {
        console.log("⚠ No tickets found. Generating...")

        tickets = []

        for (let i = 0; i < order.quantity; i++) {
            const ticketCode = "EPIC-" + uuidv4().slice(0, 8).toUpperCase()

            try {
                const ticketUrl = await generateTicket(ticketCode, supabase)

                const { data: newTicket, error: insertError } = await supabase
                    .from("tickets")
                    .insert({
                        order_id: order.id,
                        ticket_code: ticketCode,
                        ticket_url: ticketUrl
                    })
                    .select()
                    .single()

                if (insertError) {
                    console.error("Insert failed:", insertError)
                    continue
                }

                tickets.push(newTicket)
                console.log("Created:", ticketCode)

            } catch (err) {
                console.error("Generate failed:", err)
            }
        }
    }

    if (!tickets || tickets.length === 0) {
        console.log("No tickets available. Abort.")
        return
    }

    const formattedTickets = tickets.map(t => ({
        ticket_code: t.ticket_code,
        ticket_url: t.ticket_url
    }))

    // SAFETY CONFIRMATION
    console.log("\n⚠ READY TO SEND EMAIL")
    console.log("To:", order.email)
    console.log("Tickets:", formattedTickets.length)

    const readline = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    })

    readline.question("\nType 'YES' to continue: ", async (answer) => {
        if (answer !== "YES") {
            console.log(" Cancelled.")
            readline.close()
            return
        }

        try {
            await sendTicketsEmail(
                order.email,
                order.name,
                formattedTickets
            )

            console.log(" Email sent to:", order.email)

            await supabase
                .from("orders")
                .update({ email_sent: true })
                .eq("id", order.id)

        } catch (err) {
            console.error("❌ Email failed:", err)
        }

        readline.close()
    })
}

sendSingleOrder()