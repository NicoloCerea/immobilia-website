(function(){
  var tb=document.querySelector('.title-block');
  if(!tb||!document.querySelector('.gallery'))return;
  var b=document.body,h=document.querySelector('header');
  b.classList.add('home','listing');
  var first=document.querySelector('.gallery .g-main img')||document.querySelector('.gallery img');
  var hero=document.createElement('section');hero.className='lux-hero';
  var bg=document.createElement('div');bg.className='lux-hero-bg';bg.style.backgroundImage="url('"+first.getAttribute('src')+"')";
  var inn=document.createElement('div');inn.className='lux-hero-in';
  while(tb.firstChild)inn.appendChild(tb.firstChild);
  var acts=document.createElement('div');acts.className='lux-hero-actions';
  acts.innerHTML='<a class="lux-btn" href="#prenota">Prenota</a><button class="lux-btn ghost" type="button">Tutte le foto</button>';
  acts.querySelector('button').onclick=function(){if(window.openLightbox)openLightbox(0)};
  inn.appendChild(acts);
  hero.appendChild(bg);hero.appendChild(inn);
  tb.parentNode.insertBefore(hero,tb);tb.remove();
  var bk=document.querySelector('.booking-full');if(bk&&!bk.id)bk.id='prenota';
  var g=document.querySelector('.gallery'),main=g.querySelector('.g-main');if(main)main.classList.add('lux-dup');
  function onS(){var y=scrollY;h.classList.toggle('scrolled',y>60);if(y<1000){bg.style.transform='translateY('+(y*.25)+'px) scale(1.08)';inn.style.opacity=Math.max(0,1-y/560);inn.style.transform='translateY('+(y*.12)+'px)'}}
  addEventListener('scroll',onS,{passive:true});onS();
  var io=new IntersectionObserver(function(e){e.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12});
  document.querySelectorAll('.gallery .g-tile,.booking-full,section,.wrap > h2,.amenity').forEach(function(el){if(!el.closest('.lux-hero')){el.classList.add('rv');io.observe(el)}});
})();
