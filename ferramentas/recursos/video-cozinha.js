  // Vídeo da cozinha (versão do montador, entra no lugar do trecho do design em scroll-motion.js).
  // - Começa a baixar quando a seção chega perto da tela, sem esperar o resto da página carregar
  //   (no 4G a página inteira levava 12 s e o vídeo ficava preto até lá).
  // - Mostra a capa (primeiro plano do vídeo) enquanto carrega ou se não puder tocar.
  // - Se o celular bloquear o play automático (iPhone em Modo de Pouca Energia, por exemplo), toca no
  //   primeiro toque na página; volta a tentar quando a seção reaparece na tela.
  // - Se a rede travar ou der erro, recarrega o vídeo (até 2 vezes).
  const lazyVid = document.querySelector('.kitchen-video[data-src]');
  if (lazyVid) {
    const v = lazyVid, GESTOS = ['pointerup', 'touchend', 'click', 'keydown'];
    let tentativas = 0, vigia = 0, aguardando = false;
    const aoTocar = () => { GESTOS.forEach(t => removeEventListener(t, aoTocar, true)); aguardando = false; tocar(); };
    const esperarToque = () => { if (aguardando) return; aguardando = true; GESTOS.forEach(t => addEventListener(t, aoTocar, { capture: true, passive: true })); };
    const tocar = () => { if (!v.getAttribute('src')) return; const p = v.play(); if (p && p.catch) p.catch(esperarToque); };
    const vigiar = () => { clearTimeout(vigia); vigia = setTimeout(() => { if (v.readyState < 2) refazer(); }, 8000); };
    const refazer = () => { if (tentativas >= 2) return; tentativas++; v.load(); tocar(); vigiar(); };
    const carregar = () => {
      if (v.getAttribute('src')) return;
      if (v.dataset.poster) v.poster = v.dataset.poster;
      v.muted = true; v.src = v.dataset.src; tocar(); vigiar();
    };
    v.addEventListener('loadeddata', () => clearTimeout(vigia));
    v.addEventListener('error', () => setTimeout(refazer, 1500));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => {
        if (!es.some(e => e.isIntersecting)) return;
        if (!v.getAttribute('src')) carregar(); else if (v.paused) tocar();
      }, { rootMargin: '300px 0px' }).observe(v);
    } else carregar();
  }
