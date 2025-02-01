var swiper = new Swiper(".swiper", {
    effect: "coverflow",
    loop: true,
    centeredSlides: true,
    coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 90,
        modifier: 2,
        slideShadows: true
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true
    }
});
