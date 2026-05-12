const express = require("express")
const router = express.Router()

const { createClient } = require("@supabase/supabase-js")

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE
)

router.post("/", async (req, res) => {

    try {

        const { ticket_code } = req.body

        // =========================
        // VALIDATION
        // =========================
        if (!ticket_code) {
            return res.status(400).json({
                success: false,
                status: "NO_CODE"
            })
        }

        // =========================
        // CHECK TICKET EXISTENCE
        // =========================
        const { data: ticket, error: fetchError } = await supabase
            .from("tickets")
            .select("id, used, used_at")
            .eq("ticket_code", ticket_code)
            .single()

        if (fetchError || !ticket) {
            return res.status(404).json({
                success: false,
                status: "INVALID"
            })
        }

        // =========================
        // ALREADY USED
        // =========================
        if (ticket.used) {
            return res.status(409).json({
                success: false,
                status: "USED",
                used_at: ticket.used_at
            })
        }

        // =========================
        // ATOMIC UPDATE
        // =========================
        const { data: updatedTicket, error: updateError } =
            await supabase
                .from("tickets")
                .update({
                    used: true,
                    used_at: new Date().toISOString()
                })
                .eq("ticket_code", ticket_code)
                .eq("used", false)
                .select()
                .single()

        // =========================
        // RACE CONDITION PROTECTION
        // =========================
        if (updateError || !updatedTicket) {
            return res.status(409).json({
                success: false,
                status: "ALREADY_SCANNED"
            })
        }

        // =========================
        // SUCCESS
        // =========================
        return res.status(200).json({
            success: true,
            status: "VALID"
        })

    } catch (err) {

        console.error("VERIFY ERROR:", err)

        return res.status(500).json({
            success: false,
            status: "SERVER_ERROR"
        })
    }
})

module.exports = router