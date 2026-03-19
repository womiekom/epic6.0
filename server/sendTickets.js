const { Resend } = require("resend")

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendTicketsEmail(to, name, tickets) {

    const attachments = tickets.map(ticket => ({
        filename: `${ticket.ticket_code}.pdf`,
        path: ticket.ticket_url
    }))

    const { data, error } = await resend.emails.send({
        from: "EPIC <noreply@ekapaksicup.site>",
        to: [to],
        subject: "🎟️ Your EPIC Tickets",
        html: `
            <h2>Hello! ${name} 👋</h2>
            <p>Your tickets are ready!</p>
            <p>Total tickets: ${tickets.length}</p>
            <p>Below are attached PDFs 🎉</p>
        `,
        attachments
    })

    if (error) {
        console.error(error)
        throw error
    }

    return data
}

module.exports = sendTicketsEmail