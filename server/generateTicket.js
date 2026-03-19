const { PDFDocument, rgb, StandardFonts } = require("pdf-lib")
const fs = require("fs")
const QRCode = require("qrcode")

async function generateTicket(ticketCode, supabase) {

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
        x: 700,
        y: 200,
        size: 30,
        font,
        color: rgb(0.498, 0.208, 0.420)
    })

    const qrImage = await QRCode.toBuffer(
        `https://ekapaksicup.site/checkin?code=${ticketCode}`,
        { margin: 1 }
    )

    const qrEmbed = await pdfDoc.embedPng(qrImage)

    page.drawImage(qrEmbed, {
        x: 145,
        y: 80,
        width: 160,
        height: 160
    })

    const pdfBytes = await pdfDoc.save()

    const fileName = `${ticketCode}.pdf`

    const { error: uploadError } = await supabase.storage
        .from("tickets-pdf")
        .upload(fileName, pdfBytes, {
            contentType: "application/pdf",
            upsert: true
        })

    if (uploadError) throw uploadError

    const { data } = supabase.storage
        .from("tickets-pdf")
        .getPublicUrl(fileName)

    return data.publicUrl
}

module.exports = generateTicket