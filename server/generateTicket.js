const { PDFDocument, rgb, StandardFonts } = require("pdf-lib")
const fs = require("fs")

async function generateTicket(ticketCode) {

    try {

        console.log("Loading template...")

        const templateBytes = fs.readFileSync("./tickets/ticket-template.png")

        const pdfDoc = await PDFDocument.create()

        const image = await pdfDoc.embedPng(templateBytes)

        const page = pdfDoc.addPage([image.width, image.height])

        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height
        })

        const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic)

        page.drawText(ticketCode, {
            x: 800,
            y: 200,
            size: 28,
            font: font,
            color: rgb(0.498, 0.208, 0.420)
        })

        const pdfBytes = await pdfDoc.save()

        fs.writeFileSync(`./tickets/${ticketCode}.pdf`, pdfBytes)

        console.log("Ticket generated:", ticketCode)

    } catch (err) {
        console.error("ERROR:", err)
    }

}

generateTicket("EPIC6-H03V1")