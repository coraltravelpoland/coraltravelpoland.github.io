var swiper = new Swiper(".swiper", {
    effect: "coverflow",
    grabCursor: true,
    centeredSlides: true,
    slidesPerView: "auto",
    coverflowEffect: {
      rotate: 0,
      stretch: 0,
      depth: 100,
      modifier: 2,
      slideShadows: true
    },
    keyboard: {
      enabled: true
    },
    spaceBetween: 10,
    loop: true,
    speed: 1000,
    autoplay: {
        delay: 3000,
    },
    initialSlide: 2,
    slideToClickedSlide: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true
    }
  });



const swiper_text = new Swiper(".swiper-txt", {
    loop: true, 
    slidesPerView: 1,
    allowTouchMove: false,
})
const swiper_main = new Swiper('.swiper-img', {
loop: true,                         
pagination: {
    el: '.swiper-pagination',
},                  
navigation: {                       
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
},
thumbs: {                           //add
    swiper: swiper_text,            //add
},                                  //add
})