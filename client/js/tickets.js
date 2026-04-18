const grid = document.querySelector(".ticket-grid")
const button = document.querySelector("#ticket-btn")
const detail = document.querySelector(".ticket-detail.presale2")
const backBtn = detail.querySelector(".back-btn")

button.addEventListener("click", () => {

    // fade out grid
    grid.classList.add("hidden")

    setTimeout(() => {

        grid.style.display = "none"

        detail.style.display = "block"

        requestAnimationFrame(() => {
            detail.classList.remove("hidden")
        })

    }, 450)

})

backBtn.addEventListener("click", () => {

    // fade out detail
    detail.classList.add("hidden")

    setTimeout(() => {

        detail.style.display = "none"

        grid.style.display = "grid"

        requestAnimationFrame(() => {
            grid.classList.remove("hidden")
        })

    }, 450)

})

function goToPurchase(ticket, type) {

    window.location.href =
        `purchase.html?ticket=${ticket}&type=${type}`

}

async function loadTicketCount() {

    try {
        const res = await fetch("https://epic60-production.up.railway.app/tickets-left")
        const data = await res.json()

        const el = document.getElementById("ticket-count")
        const btn = document.getElementById("ticket-btn")

        if (data.left <= 0) {
            el.innerText = "SOLD OUT"
            btn.innerText = "Sold Out"
            btn.style.pointerEvents = "none"
            btn.style.opacity = "0.5"
        } else {
            el.innerText = `ONLY ${data.left} TICKETS AVAILABLE!!`
        }

    } catch (err) {
        console.error(err)
    }

}

loadTicketCount()