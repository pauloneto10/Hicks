(function(){var svg=document.querySelector('.rg5-clock');var st=document.getElementById('rg5-status');if(!svg||!st)return;var H=svg.querySelector('.ck-h'),M=svg.querySelector('.ck-m'),S=svg.querySelector('.ck-s'),T=st.querySelector('.st-t'),C=st.querySelector('.st-c');
var fmt=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',hour12:false,weekday:'short',hour:'2-digit',minute:'2-digit',second:'2-digit'});var WD={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
function now(){var o={};fmt.formatToParts(new Date()).forEach(function(p){o[p.type]=p.value});return{d:WD[o.weekday],h:(+o.hour)%24,m:+o.minute,s:+o.second}}
function pad(n){return n<10?'0'+n:''+n}function left(mins){var h=Math.floor(mins/60),m=mins%60;return h?h+'h'+(m?pad(m):''):m+' min'}
function openDay(d){return d!==2}
function set(cls,txt,cnt){st.className='rg5-status ready '+cls;if(T.innerHTML!==txt)T.innerHTML=txt;C.textContent=cnt||''}
function tick(){var n=now(),mm=n.h*60+n.m;
H.setAttribute('transform','rotate('+((n.h%12)*30+n.m*.5)+')');M.setAttribute('transform','rotate('+(n.m*6+n.s*.1)+')');S.setAttribute('transform','rotate('+(n.s*6)+')');
var O=18*60,X=23*60;
if(openDay(n.d)&&mm>=O&&mm<X){var r=X-mm;if(r<=30)set('closing','Última chance');else set('open','Aberto agora');return}
if(openDay(n.d)&&mm<O){var a=O-mm;if(a<=60)set('soon','Perto de abrir');else set('','Abre às 18h');return}
var nd=(n.d+1)%7;var msg=openDay(nd)?(nd===n.d+1||nd===0&&n.d===6?'amanhã':'')+'':'';
if(n.d===2&&mm<O)set('','Fechado hoje');
else if(!openDay(nd))set('','Volta quarta');
else set('','Fechado agora')}
tick();setInterval(tick,1000)})();