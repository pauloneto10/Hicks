// Player da playlist da página principal (seção .sp-wrap). O montador coloca este arquivo no lugar do player
// do design, que buscava as músicas por um script da Apple (bloqueado pela política de segurança do site).
// Cada botão já traz o endereço da prévia (data-src, gravado na montagem por buscar-previas.cjs): a música
// toca no mesmo toque, inclusive no iPhone. Se a Apple trocar um endereço, o player busca de novo no iTunes.
(function(){var w=document.querySelector('.sp-wrap');if(!w)return;
var A=w.querySelector('.sp-audio'),btn=w.querySelector('.sp-btn'),bar=w.querySelector('.sp-bar i'),t0=w.querySelector('.sp-t0'),t1=w.querySelector('.sp-t1'),ttl=w.querySelector('.sp-meta .sp-title'),items=[].slice.call(w.querySelectorAll('.sp-q li')),cur=-1,cache={},refeita={},falhas=0;
var f=function(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function busca(i,cb){var li=items[i],q=li.querySelector('b').textContent.replace(/\(.*?\)/g,'')+' '+li.querySelector('span').textContent.split(',')[0];
fetch('https://itunes.apple.com/search?entity=song&limit=5&country=BR&term='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(r){var x=(r&&r.results||[]).find(function(z){return z.previewUrl});cache[i]=x?x.previewUrl:null;cb(cache[i])}).catch(function(){cache[i]=null;cb(null)})}
function look(i,cb){if(cache[i]!==undefined)return cb(cache[i]);var s=items[i].querySelector('button').getAttribute('data-src');if(s){cache[i]=s;return cb(s)}busca(i,cb)}
function toca(u){A.src=u;A.play().catch(function(){})}
function pick(i,tries){tries=tries||0;if(tries>items.length)return;i=(i+items.length)%items.length;cur=i;items.forEach(function(l,k){l.classList.toggle('cur',k===i)});var li=items[i];ttl.textContent=li.querySelector('b').textContent;var q=w.querySelector('.sp-q');q.scrollTop=li.offsetTop-q.clientHeight/2+li.offsetHeight/2;
look(i,function(u){if(cur!==i)return;if(!u){return pick(i+1,tries+1)}toca(u)})}
items.forEach(function(l,k){l.querySelector('button').addEventListener('click',function(){falhas=0;pick(k)})});
btn.addEventListener('click',function(){falhas=0;if(cur<0)return pick(0);if(A.paused)A.play().catch(function(){});else A.pause()});
w.querySelector('.sp-back').addEventListener('click',function(){falhas=0;pick(cur<0?0:cur-1)});
w.querySelector('.sp-fwd').addEventListener('click',function(){falhas=0;pick(cur+1)});
w.querySelector('.sp-float').addEventListener('click',function(){A.pause()});
A.addEventListener('play',function(){w.classList.add('on');btn.setAttribute('aria-label','Pausar')});
A.addEventListener('pause',function(){w.classList.remove('on');btn.setAttribute('aria-label','Tocar')});
A.addEventListener('playing',function(){falhas=0});
A.addEventListener('ended',function(){pick(cur+1)});
// Prévia que não carregou: busca o endereço novo no iTunes uma vez; se ainda falhar, pula para a próxima.
// Depois de 3 falhas seguidas (sem internet, por exemplo) o player para, em vez de girar a lista.
A.addEventListener('error',function(){if(cur<0||!A.getAttribute('src'))return;var i=cur;if(++falhas>3){w.classList.remove('on');return}
if(!refeita[i]){refeita[i]=1;delete cache[i];items[i].querySelector('button').removeAttribute('data-src');busca(i,function(u){if(cur!==i)return;if(!u)return pick(i+1);toca(u)})}else pick(i+1)});
A.addEventListener('timeupdate',function(){var d=A.duration||30;bar.style.width=(A.currentTime/d*100).toFixed(2)+'%';t0.textContent=f(A.currentTime);t1.textContent='-'+f(d-A.currentTime)});
})();
