document.addEventListener('DOMContentLoaded',()=>{
// Dark Mode
const html=document.documentElement;
const themeToggle=document.getElementById('themeToggle');
const themeIcon=document.getElementById('themeIcon');
const savedTheme=localStorage.getItem('theme')||'light';
html.setAttribute('data-theme',savedTheme);
if(themeIcon)themeIcon.className=savedTheme==='dark'?'fas fa-sun':'fas fa-moon';
themeToggle&&themeToggle.addEventListener('click',()=>{
  const next=html.getAttribute('data-theme')==='dark'?'light':'dark';
  html.setAttribute('data-theme',next);localStorage.setItem('theme',next);
  if(themeIcon)themeIcon.className=next==='dark'?'fas fa-sun':'fas fa-moon';
});

// Navbar scroll
const navbar=document.getElementById('navbar');
window.addEventListener('scroll',()=>{
  navbar&&navbar.classList.toggle('scrolled',window.scrollY>20);
  document.getElementById('backToTop')?.classList.toggle('visible',window.scrollY>300);
});
document.getElementById('backToTop')?.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));

// Hamburger
const hamburger=document.getElementById('hamburger');
const navMenu=document.getElementById('navMenu');
hamburger?.addEventListener('click',()=>navMenu?.classList.toggle('open'));

// Search
const searchBar=document.getElementById('searchBar');
const searchInput=document.getElementById('globalSearch');
const searchResults=document.getElementById('searchResults');
document.getElementById('searchToggle')?.addEventListener('click',()=>{searchBar?.classList.add('open');setTimeout(()=>searchInput?.focus(),100);});
document.getElementById('searchClose')?.addEventListener('click',()=>searchBar?.classList.remove('open'));
let st;
searchInput?.addEventListener('input',(e)=>{
  clearTimeout(st);const q=e.target.value.trim();
  if(q.length<2){searchResults.innerHTML='';return;}
  st=setTimeout(async()=>{
    try{const res=await fetch('/api/products/search?q='+encodeURIComponent(q));const data=await res.json();
    if(!data.length){searchResults.innerHTML='<p style="padding:12px;color:var(--c-text3);font-size:14px">Produk tidak ditemukan</p>';return;}
    searchResults.innerHTML=data.map(p=>`<div class="search-result-item" onclick="location.href='/shop/${p.slug}'">${p.image?`<img src="/images/products/${p.image}" alt="">`:
    '<div class="no-img"><i class="fas fa-leaf"></i></div>'}<div><strong style="font-size:14px">${p.name}</strong><br><span style="font-size:13px;color:var(--c-text3)">Rp ${Number(p.price).toLocaleString('id-ID')}</span></div></div>`).join('');}catch{}
  },300);
});

// Flash auto dismiss
const flash=document.getElementById('flashAlert');
if(flash)setTimeout(()=>flash.remove(),5000);

// Toast
function showToast(msg,type='success'){
  const ex=document.getElementById('toastMsg');if(ex)ex.remove();
  const t=document.createElement('div');t.id='toastMsg';
  t.className='alert alert-'+type;
  t.innerHTML=`<i class="fas fa-${type==='success'?'check-circle':'exclamation-circle'}"></i> ${msg}<button onclick="this.parentElement.remove()">×</button>`;
  document.body.appendChild(t);setTimeout(()=>t.remove(),4000);
}
window.showToast=showToast;

// Add to cart
document.querySelectorAll('.add-to-cart').forEach(btn=>{
  btn.addEventListener('click',async()=>{
    const id=btn.dataset.id,qty=btn.dataset.qty||1;
    btn.disabled=true;const orig=btn.innerHTML;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>';
    try{const res=await fetch('/shop/cart/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:id,qty})});
    const data=await res.json();
    if(data.success){document.getElementById('cartCount').textContent=data.cartCount;
    btn.innerHTML='<i class="fas fa-check"></i> Ditambahkan!';showToast(data.message,'success');
    setTimeout(()=>{btn.innerHTML=orig;btn.disabled=false;},2000);}
    else{showToast(data.message||'Gagal','error');btn.innerHTML=orig;btn.disabled=false;}}
    catch{btn.innerHTML=orig;btn.disabled=false;}
  });
});

// Cart qty
document.querySelectorAll('.qty-btn').forEach(btn=>{
  btn.addEventListener('click',async()=>{
    const action=btn.dataset.action,id=btn.dataset.id;
    const inp=document.querySelector('.qty-input[data-id="'+id+'"]');if(!inp)return;
    let qty=parseInt(inp.value)||1;
    if(action==='plus')qty++;else if(action==='minus')qty=Math.max(1,qty-1);
    inp.value=qty;
    try{const res=await fetch('/shop/cart/update',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:id,qty})});
    const data=await res.json();
    if(data.success){document.getElementById('cartCount').textContent=data.cartCount;
    const sub=document.querySelector('.cart-subtotal[data-id="'+id+'"]');
    const p=parseFloat(document.querySelector('.cart-price[data-id="'+id+'"]')?.dataset.price||0);
    if(sub)sub.textContent='Rp '+(p*qty).toLocaleString('id-ID');}}catch{}
  });
});

// Remove from cart
document.querySelectorAll('.remove-cart-item').forEach(btn=>{
  btn.addEventListener('click',async()=>{
    if(!confirm('Hapus item dari keranjang?'))return;const id=btn.dataset.id;
    try{const res=await fetch('/shop/cart/remove',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:id})});
    const data=await res.json();if(data.success){document.querySelector('.cart-item[data-id="'+id+'"]')?.remove();document.getElementById('cartCount').textContent=data.cartCount;}}catch{}
  });
});

// Wishlist
document.querySelectorAll('.product-wishlist-btn').forEach(btn=>{
  btn.addEventListener('click',async(e)=>{
    e.stopPropagation();const id=btn.dataset.id;
    try{const res=await fetch('/shop/wishlist/toggle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:id})});
    const data=await res.json();
    if(data.success){btn.classList.toggle('active',data.inWishlist);btn.querySelector('i').className=data.inWishlist?'fas fa-heart':'far fa-heart';
    showToast(data.inWishlist?'Ditambahkan ke wishlist!':'Dihapus dari wishlist',data.inWishlist?'success':'info');}
    else if(data.message?.includes('Login'))location.href='/auth/login';}catch{}
  });
});

// Payment method
document.querySelectorAll('.payment-option').forEach(opt=>{
  opt.addEventListener('click',()=>{
    document.querySelectorAll('.payment-option').forEach(o=>o.classList.remove('selected'));
    opt.classList.add('selected');opt.querySelector('input').checked=true;
    const method=opt.querySelector('input').value;
    document.querySelectorAll('.payment-detail').forEach(d=>d.style.display='none');
    document.getElementById('detail-'+method)?.style.setProperty('display','block');
  });
});

// Copy
document.querySelectorAll('.copy-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    navigator.clipboard.writeText(btn.dataset.copy).then(()=>{const o=btn.textContent;btn.textContent='Tersalin!';setTimeout(()=>btn.textContent=o,2000);});
  });
});

// Upload proof
const uploadForm=document.getElementById('uploadProofForm');
uploadForm?.addEventListener('submit',async(e)=>{
  e.preventDefault();const fd=new FormData(uploadForm);const id=uploadForm.dataset.orderId;
  const btn=uploadForm.querySelector('[type=submit]');btn.disabled=true;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i> Mengunggah...';
  try{const res=await fetch('/shop/payment/'+id+'/upload',{method:'POST',body:fd});const data=await res.json();
  if(data.success){showToast('Bukti pembayaran berhasil diunggah!','success');setTimeout(()=>location.reload(),1500);}
  else{showToast(data.message||'Gagal','error');btn.disabled=false;btn.innerHTML='<i class="fas fa-upload"></i> Upload Bukti';}}
  catch{showToast('Terjadi kesalahan','error');btn.disabled=false;}
});

// Waste type
document.querySelectorAll('.waste-type-card').forEach(card=>{
  card.addEventListener('click',()=>{
    document.querySelectorAll('.waste-type-card').forEach(c=>c.classList.remove('selected'));
    card.classList.add('selected');
    const inp=document.getElementById('wasteTypeInput');if(inp)inp.value=card.dataset.type;
  });
});

// File preview
document.querySelectorAll('input[type=file]').forEach(input=>{
  input.addEventListener('change',(e)=>{
    const file=e.target.files[0];if(!file||!file.type.startsWith('image/'))return;
    const reader=new FileReader();reader.onload=ev=>{
      const prev=document.getElementById(input.dataset.preview);
      if(prev){prev.src=ev.target.result;prev.style.display='block';}
    };reader.readAsDataURL(file);
  });
});

// Upload zones
document.querySelectorAll('.upload-zone').forEach(zone=>{
  const inp=zone.querySelector('input[type=file]');
  zone.addEventListener('click',()=>inp?.click());
  zone.addEventListener('dragover',e=>{e.preventDefault();zone.classList.add('dragover');});
  zone.addEventListener('dragleave',()=>zone.classList.remove('dragover'));
  zone.addEventListener('drop',e=>{e.preventDefault();zone.classList.remove('dragover');
    if(inp&&e.dataTransfer.files.length){inp.files=e.dataTransfer.files;inp.dispatchEvent(new Event('change'));}
  });
});

// Notifications
const notifBtn=document.getElementById('notifBtn');
const notifDropdown=document.getElementById('notifDropdown');
if(notifBtn){
  notifBtn.addEventListener('click',e=>{e.stopPropagation();notifDropdown?.classList.toggle('open');});
  document.addEventListener('click',()=>notifDropdown?.classList.remove('open'));
  loadNotifications();setInterval(loadNotifications,30000);
}
async function loadNotifications(){
  try{const res=await fetch('/user/notifications');const data=await res.json();
  const badge=document.getElementById('notifBadge');
  if(badge){badge.textContent=data.unread;badge.style.display=data.unread>0?'flex':'none';}
  const list=document.getElementById('notifList');
  if(list&&data.notifications)list.innerHTML=data.notifications.length?
  data.notifications.map(n=>`<div class="notif-item ${n.is_read?'':'unread'}" onclick="${n.link?`location.href='${n.link}'`:''}"><div class="notif-icon"><i class="fas fa-${n.type==='order'?'box':n.type==='points'?'star':'bell'}"></i></div><div class="notif-content"><strong>${n.title}</strong><p>${n.message}</p></div></div>`).join('')
  :'<p class="notif-empty">Tidak ada notifikasi</p>';}catch{}
}
document.getElementById('markAllRead')?.addEventListener('click',async()=>{await fetch('/user/notifications/read',{method:'POST'});loadNotifications();});

// Chatbot
const chatbotToggle=document.getElementById('chatbotToggle');
const chatbotWindow=document.getElementById('chatbotWindow');
const chatSend=document.getElementById('chatSend');
const chatInput=document.getElementById('chatInput');
const chatMessages=document.getElementById('chatMessages');
const chatIcon=document.getElementById('chatIcon');
const chatCloseIcon=document.getElementById('chatCloseIcon');
chatbotToggle?.addEventListener('click',()=>{
  const isOpen=chatbotWindow.classList.toggle('open');
  if(chatIcon){chatIcon.style.display=isOpen?'none':'flex';chatCloseIcon.style.display=isOpen?'flex':'none';}
});
document.getElementById('chatbotClose')?.addEventListener('click',()=>{chatbotWindow.classList.remove('open');
  if(chatIcon){chatIcon.style.display='flex';chatCloseIcon.style.display='none';}
});
async function sendChat(msg){
  if(!msg.trim())return;
  appendMsg('user',msg);if(chatInput)chatInput.value='';
  const typing=appendTyping();
  try{const res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})});
  const data=await res.json();typing.remove();appendMsg('bot',data.reply);}
  catch{typing.remove();appendMsg('bot','Maaf, terjadi kesalahan.');}
  if(chatMessages)chatMessages.scrollTop=chatMessages.scrollHeight;
}
function appendMsg(sender,text){
  const div=document.createElement('div');div.className='chat-msg '+sender;
  div.innerHTML='<div class="chat-bubble">'+text+'</div>';
  chatMessages?.appendChild(div);if(chatMessages)chatMessages.scrollTop=chatMessages.scrollHeight;return div;
}
function appendTyping(){
  const div=document.createElement('div');div.className='chat-msg bot';
  div.innerHTML='<div class="chat-bubble"><div class="chat-typing"><span></span><span></span><span></span></div></div>';
  chatMessages?.appendChild(div);if(chatMessages)chatMessages.scrollTop=chatMessages.scrollHeight;return div;
}
chatSend?.addEventListener('click',()=>sendChat(chatInput.value));
chatInput?.addEventListener('keypress',e=>{if(e.key==='Enter')sendChat(chatInput.value);});
window.sendQuick=(msg)=>{chatbotWindow?.classList.add('open');sendChat(msg);};

// Admin Charts (Chart.js)
const rc=document.getElementById('revenueChart');
if(rc&&window.Chart){
  const labels=JSON.parse(rc.dataset.labels||'[]'),values=JSON.parse(rc.dataset.values||'[]');
  new Chart(rc,{type:'line',data:{labels,datasets:[{label:'Pendapatan',data:values,borderColor:'#2d7a47',backgroundColor:'rgba(45,122,71,.1)',tension:.4,fill:true,pointRadius:4,pointBackgroundColor:'#2d7a47'}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{ticks:{callback:v=>'Rp'+Number(v).toLocaleString('id-ID')}}}}});
}
const oc=document.getElementById('ordersChart');
if(oc&&window.Chart){
  const labels=JSON.parse(oc.dataset.labels||'[]'),values=JSON.parse(oc.dataset.values||'[]');
  new Chart(oc,{type:'bar',data:{labels,datasets:[{label:'Pesanan',data:values,backgroundColor:'#c8e87a',borderRadius:8}]},options:{responsive:true,plugins:{legend:{display:false}}}});
}

// Tabs
document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');document.getElementById(btn.dataset.tab)?.classList.add('active');
  });
});

// Pickup date min
const pd=document.getElementById('pickup_date');
if(pd){const t=new Date();t.setDate(t.getDate()+1);pd.min=t.toISOString().split('T')[0];}

// Particles
const pw=document.querySelector('.hero-particles');
if(pw){for(let i=0;i<20;i++){const p=document.createElement('div');p.className='particle';const s=Math.random()*8+4;
p.style.cssText=`width:${s}px;height:${s}px;left:${Math.random()*100}%;animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*10}s`;pw.appendChild(p);}}

// Animate on scroll
const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.style.opacity='1';e.target.style.transform='translateY(0)';}});},{threshold:.1});
document.querySelectorAll('.feature-card,.product-card,.testimonial-card,.stat-card').forEach(el=>{el.style.opacity='0';el.style.transform='translateY(24px)';el.style.transition='opacity .5s ease,transform .5s ease';obs.observe(el);});

// Admin product modal
window.openProductModal=function(d){
  const m=document.getElementById('productModal');if(!m)return;
  if(d){m.querySelector('[name=name]').value=d.name||'';m.querySelector('[name=description]').value=d.description||'';
  m.querySelector('[name=price]').value=d.price||'';m.querySelector('[name=stock]').value=d.stock||'';
  m.querySelector('[name=eco_label]').value=d.eco_label||'';m.querySelector('form').action='/admin/products/'+d.id;}
  else{m.querySelector('form').action='/admin/products';m.querySelector('form').reset();}
  m.classList.add('open');
};
window.closeModal=function(id){document.getElementById(id)?.classList.remove('open');};
});

// Global addToCart function (called from onclick)
window.addToCart = async function(id, btn, qty=1) {
  if(btn){btn.disabled=true;const o=btn.innerHTML;btn.innerHTML='<i class="fas fa-spinner fa-spin"></i>';
  try{const r=await fetch('/shop/cart/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:id,qty})});
  const d=await r.json();
  if(d.success){document.getElementById('cartCount').textContent=d.cartCount;showToast(d.message);btn.innerHTML='<i class="fas fa-check"></i> Ditambahkan!';setTimeout(()=>{btn.innerHTML=o;btn.disabled=false;},2000);}
  else{showToast(d.message||'Gagal menambahkan','error');btn.innerHTML=o;btn.disabled=false;}}
  catch(e){btn.innerHTML=o;btn.disabled=false;showToast('Terjadi kesalahan','error');}
  }else{
  try{const r=await fetch('/shop/cart/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:id,qty})});
  const d=await r.json();
  if(d.success){document.getElementById('cartCount').textContent=d.cartCount;showToast(d.message||'Ditambahkan ke keranjang!');}
  else{showToast(d.message||'Gagal','error');}}catch{showToast('Terjadi kesalahan','error');}
  }
};

// Global toggleWishlist
window.toggleWishlist = async function(id, btn) {
  try{const r=await fetch('/shop/wishlist/toggle',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product_id:id})});
  const d=await r.json();
  if(d.success){btn.classList.toggle('active',d.inWishlist);showToast(d.inWishlist?'Ditambahkan ke wishlist!':'Dihapus dari wishlist',d.inWishlist?'success':'info');}
  else if(d.message==='Login terlebih dahulu'){if(confirm('Login untuk menyimpan wishlist. Ke halaman login?'))location.href='/auth/login';}
  }catch(e){showToast('Terjadi kesalahan','error');}
};

// Global markRead
window.markRead = async function() {
  try{await fetch('/user/notifications/read',{method:'POST'});
  document.querySelectorAll('.notif-item.unread').forEach(el=>el.classList.remove('unread'));
  document.getElementById('notifBadge')&&(document.getElementById('notifBadge').style.display='none');}
  catch{}
};
