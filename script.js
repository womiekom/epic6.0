// ===================================
// EPIC 6.0 - Event Website JavaScript
// ===================================

// ===================================
// HAMBURGER MENU TOGGLE
// Mobile navigation menu functionality
// ===================================
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');

    hamburger.addEventListener('click', function() {
        // Toggle active class on hamburger icon
        hamburger.classList.toggle('active');

        // Toggle active class on navigation menu
        nav.classList.toggle('active');
    });

    // Close menu when clicking on a navigation link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
        });
    });

    // Close menu when clicking outside of it
    document.addEventListener('click', function(event) {
        const isClickInsideNav = nav.contains(event.target);
        const isClickOnHamburger = hamburger.contains(event.target);

        if (!isClickInsideNav && !isClickOnHamburger && nav.classList.contains('active')) {
            hamburger.classList.remove('active');
            nav.classList.remove('active');
        }
    });
});

// ===================================
// SMOOTH SCROLLING
// Smooth scroll behavior for anchor links
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();

        const targetId = this.getAttribute('href');

        // Handle special case for #hero (scroll to top)
        if (targetId === '#hero') {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        } else {
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetElement.offsetTop - headerHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
});

// ===================================
// HEADER SCROLL EFFECT
// Add shadow to header on scroll
// ===================================
let lastScrollTop = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', function() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Add/remove shadow based on scroll position
    if (scrollTop > 50) {
        header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
    } else {
        header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }

    lastScrollTop = scrollTop;
});

// ===================================
// CARD ANIMATION ON SCROLL
// Animate cards when they come into view
// ===================================
const cards = document.querySelectorAll('.card');

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const cardObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Initially hide cards and prepare for animation
cards.forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    cardObserver.observe(card);
});

// ===================================
// ACTIVE NAVIGATION LINK HIGHLIGHT
// Highlight current section in navigation
// ===================================
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

const sectionObserverOptions = {
    threshold: 0.3
};

const sectionObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const sectionId = entry.target.getAttribute('id');

            navLinks.forEach(link => {
                link.classList.remove('active');

                if (link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}, sectionObserverOptions);

sections.forEach(section => {
    sectionObserver.observe(section);
});

const regScroll = document.querySelector('.reg-scroll');

regScroll.addEventListener('wheel', (e) => {
    e.preventDefault();
    regScroll.scrollLeft += e.deltaY;
}, { passive: false });

// ===================================
// CONSOLE WELCOME MESSAGE
// Display welcome message in browser console
// ===================================
console.log('%c🎉 Welcome to EPIC 6.0! 🎉', 'font-size: 24px; font-weight: bold; color: #4A148C;');
console.log('%cEvent Website Built with ❤️', 'font-size: 14px; color: #1565C0;');
