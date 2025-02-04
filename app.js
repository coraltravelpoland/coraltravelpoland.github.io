var swiper = new Swiper(".swiper-odkryj", {
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
    loop: false, 
    slidesPerView: 1,
    allowTouchMove: false
});

const swiper_main = new Swiper('.swiper-img', {
loop: false,   
slidesPerView: 1,                      
pagination: {
    el: '.swiper-pagination2',
},                  
navigation: {                       
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
},
thumbs: {                           //add
    swiper: swiper_text            //add
}                 
}

);

function czytajWiecej(event) {
    var dots = event.target.previousElementSibling.querySelector(".dots");
    var moreText = event.target.previousElementSibling.querySelector(".more");
    var btnText = event.target;
  
    if (dots.style.display === "none") {
      dots.style.display = "inline";
      btnText.innerHTML = "Czytaj więcej";
      moreText.style.display = "none";
    } else {
      dots.style.display = "none";
      btnText.innerHTML = "Czytaj mniej";
      moreText.style.display = "inline";
    }
  }




  window.addEventListener('load', () => {
    aos.init();
});
