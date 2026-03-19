require("dotenv").config()

const { createClient } = require("@supabase/supabase-js")
const generateTicket = require("../server/generateTicket")

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
)

async function backfill() {

    console.log("🚀 Starting PDF backfill...")

    // ambil tickets yang belum punya PDF
    const { data: tickets, error } = await supabase
        .from("tickets")
        .select("*")
        .is("ticket_url", null)

    if (error) {
        console.error(error)
        return
    }

    for (const ticket of tickets) {

        console.log(`\nProcessing ticket: ${ticket.ticket_code}`)

        try {

            const ticketUrl = await generateTicket(ticket.ticket_code, supabase)

            const { error: updateError } = await supabase
                .from("tickets")
                .update({ ticket_url: ticketUrl })
                .eq("id", ticket.id)

            if (updateError) throw updateError

            console.log(`✅ PDF generated for ${ticket.ticket_code}`)

        } catch (err) {
            console.error(`❌ Failed for ${ticket.ticket_code}`, err)
        }
    }

    console.log("\n🎉 PDF backfill done!")
}

backfill()