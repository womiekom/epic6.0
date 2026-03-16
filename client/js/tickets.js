const grid = document.querySelector(".ticket-grid")
const detail = document.querySelector(".ticket-detail")
const backBtn = document.querySelector(".back-btn")
const buttons = document.querySelectorAll(".ticket-card .ticket-btn")

buttons.forEach(btn => {

    btn.addEventListener("click", () => {

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