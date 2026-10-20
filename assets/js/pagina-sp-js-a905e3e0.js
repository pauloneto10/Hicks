(function(){var w=document.querySelector('.sp-wrap');if(!w)return;
var A=w.querySelector('.sp-audio'),btn=w.querySelector('.sp-btn'),bar=w.querySelector('.sp-bar i'),t0=w.querySelector('.sp-t0'),t1=w.querySelector('.sp-t1'),ttl=w.querySelector('.sp-meta .sp-title'),items=[].slice.call(w.querySelectorAll('.sp-q li')),cur=-1,cache={},n=0;
var f=function(s){s=Math.max(0,Math.floor(s||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function look(i,cb){if(cache[i]!==undefined)return cb(cache[i]);var li=items[i],q=li.querySelector('b').textContent.replace(/\(.*?\)/g,'')+' '+li.querySelector('span').textContent.split(',')[0];var name='hkIt'+(n++);window[name]=function(r){delete window[name];sc.remove();var x=(r&&r.results||[]).find(function(z){return z.previewUrl});cache[i]=x?x.previewUrl:null;cb(cache[i])};var sc=document.createElement('script');sc.src='https://itunes.apple.com/search?entity=song&limit=5&country=BR&term='+encodeURIComponent(q)+'&callback='+name;sc.onerror=function(){cache[i]=null;cb(null)};document.body.appendChild(sc)}
function pick(i,tries){tries=tries||0;if(tries>items.length)return;i=(i+items.length)%items.length;cur=i;items.forEach(function(l,k){l.classList.toggle('cur',k===i)});var li=items[i];ttl.textContent=li.querySelector('b').textContent;var q=w.querySelector('.sp-q');q.scrollTop=li.offsetTop-q.clientHeight/2+li.offsetHeight/2;
look(i,function(u){if(cur!==i)return;if(!u){return pick(i+1,tries+1)}A.src=u;A.play().catch(function(){})})}
items.forEach(function(l,k){l.querySelector('button').addEventListener('click',function(){pick(k)})});
btn.addEventListener('click',function(){if(cur<0)return pick(0);if(A.paused)A.play().catch(function(){});else A.pause()});
w.querySelector('.sp-back').addEventListener('click',function(){pick(cur<0?0:cur-1)});
w.querySelector('.sp-fwd').addEventListener('click',function(){pick(cur+1)});
w.querySelector('.sp-float').addEventListener('click',function(){A.pause()});
A.addEventListener('play',function(){w.classList.add('on');btn.setAttribute('aria-label','Pausar')});
A.addEventListener('pause',function(){w.classList.remove('on');btn.setAttribute('aria-label','Tocar')});
A.addEventListener('ended',function(){pick(cur+1)});
A.addEventListener('timeupdate',function(){var d=A.duration||30;bar.style.width=(A.currentTime/d*100).toFixed(2)+'%';t0.textContent=f(A.currentTime);t1.textContent='-'+f(d-A.currentTime)});
})();