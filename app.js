var swiper = new Swiper(".swiper", {
    effect: "coverflow",
    initialSlide: 2,
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 90,
        modifier: 2,
        slideShadows: true
    },
    keyboard: {
        enabled: true
    },
    mousewheel: {
        thresholdDelta: 70
    },
    spaceBetween: 50,
    loop: true,
    roundLengths: true,
    loopAdditionalSlides: 30,
    pagination: {
        el: ".swiper-pagination",
        clickable: true
    }
});
