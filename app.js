var swiper = new Swiper(".swiper", {
    loop: true,
    speed: 1000,
    autoplay: {
        delay: 3000,
    },
    effect: "coverflow",
    initialSlide: 2,
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    coverflowEffect: {
        rotate: 0,
        stretch: 0,
        depth: 90,
        modifier: 1,
        slideShadows: true
    },
    keyboard: {
        enabled: true
    },
    spaceBetween: 50,
    roundLengths: true,
    loopAdditionalSlides: 30,
    pagination: {
        el: ".swiper-pagination",
        clickable: true
    }
});
