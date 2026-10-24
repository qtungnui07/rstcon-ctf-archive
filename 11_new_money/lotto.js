<title>Caps Lotto-Matic</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=VT323&family=Oswald:wght@400;500;600;700&display=swap">
<style>
  /* Layout: a Vault-Tec CRT lottery terminal — reel window, side lever, caps tray below.
     Single deliberate look: amber-green phosphor on irradiated steel. */
  :root {
    --steel:      #1b2420;   /* machine body */
    --steel-dk:   #0c110e;   /* page void */
    --bezel:      #2c3a32;   /* panel edges */
    --phos:       #35ff9e;   /* pip-boy phosphor green */
    --phos-dim:   #1c7d52;
    --amber:      #ffb54a;   /* nuka / caps gold */
    --nuka:       #e23b4b;   /* nuka-cola red */
    --crt-bg:     #06140d;   /* screen glass */
    --ink:        #d8ffe9;
    color-scheme: dark;
  }

  html, body { height: 100%; }
  body {
    margin: 0;
    background:
      radial-gradient(120% 90% at 50% -10%, #12241a 0%, var(--steel-dk) 60%, #03070500 100%),
      var(--steel-dk);
    color: var(--ink);
    font-family: "Oswald", system-ui, sans-serif;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-left: max(16px, env(safe-area-inset-left, 0px));
    padding-right: max(16px, env(safe-area-inset-right, 0px));
    padding-block: clamp(14px, 3vh, 34px);
    gap: 18px;
    overflow-x: hidden;
  }

  /* faint radioactive scanline haze over everything */
  body::after {
    content: "";
    position: fixed; inset: 0;
    pointer-events: none; z-index: 60;
    background: repeating-linear-gradient(0deg, #00000026 0 2px, #0000 2px 4px);
    mix-blend-mode: multiply;
  }

  a { color: var(--amber); }

  .wordmark {
    text-align: center;
    line-height: 0.95;
    margin-top: 4px;
  }
  .wordmark .vt {
    font-family: "Oswald"; font-weight: 700;
    letter-spacing: 0.32em;
    font-size: clamp(11px, 2.2vw, 14px);
    color: var(--amber);
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .wordmark h1 {
    margin: 0;
    font-family: "VT323", "VT323 Fallback", monospace;
    font-weight: 400;
    font-size: clamp(42px, 10vw, 76px);
    color: var(--phos);
    text-shadow: 0 0 10px #35ff9e88, 0 0 26px #35ff9e40;
    letter-spacing: 0.02em;
    text-wrap: balance;
  }
  .wordmark .sub {
    font-family: "VT323", monospace;
    font-size: clamp(15px, 3.4vw, 20px);
    color: var(--nuka);
    letter-spacing: 0.12em;
    text-shadow: 0 0 8px #e23b4b55;
  }

  /* ---- the machine ---- */
  .machine {
    width: min(560px, 100%);
    background:
      linear-gradient(180deg, #273530 0%, var(--steel) 55%, #141c18 100%);
    border: 2px solid #05080699;
    border-radius: 20px;
    padding: 20px 18px 22px;
    box-shadow:
      0 0 0 3px #3a4a40 inset,
      0 1px 0 #567 inset,
      0 26px 60px -22px #000,
      0 0 50px -10px #35ff9e22;
    position: relative;
  }
  .rivets { position: absolute; inset: 10px; pointer-events: none; }
  .rivets i {
    position: absolute; width: 9px; height: 9px; border-radius: 50%;
    background: radial-gradient(circle at 35% 30%, #9fb0a6, #39443d 70%, #141a16);
    box-shadow: 0 1px 1px #000;
  }
  .rivets i:nth-child(1){ top:0; left:0 } .rivets i:nth-child(2){ top:0; right:0 }
  .rivets i:nth-child(3){ bottom:0; left:0 } .rivets i:nth-child(4){ bottom:0; right:0 }

  .top-row {
    display: flex; justify-content: space-between; align-items: stretch;
    gap: 10px; margin-bottom: 14px;
  }
  .gauge {
    flex: 1; min-width: 0;
    background: #0a120d;
    border: 1px solid var(--bezel);
    border-radius: 8px;
    padding: 7px 10px;
    text-align: center;
    box-shadow: 0 0 12px #35ff9e14 inset;
  }
  .gauge .lab {
    font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
    color: var(--phos-dim); font-weight: 600;
  }
  .gauge .val {
    font-family: "VT323", monospace;
    font-size: clamp(26px, 7vw, 38px); line-height: 1;
    color: var(--amber);
    text-shadow: 0 0 10px #ffb54a66;
    font-variant-numeric: tabular-nums;
  }
  .gauge.win .val { color: var(--phos); text-shadow: 0 0 12px #35ff9e77; }

  /* CRT screen holding the reels */
  .screen {
    position: relative;
    background:
      radial-gradient(130% 120% at 50% 0%, #0d241a 0%, var(--crt-bg) 70%);
    border: 2px solid #05100a;
    border-radius: 14px;
    padding: 14px;
    box-shadow:
      0 0 0 6px #10171399 inset,
      0 0 40px #35ff9e1f inset;
    overflow: hidden;
  }
  .screen::before { /* screen glare */
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(135deg, #ffffff10 0%, #fff0 30%);
    border-radius: 12px;
  }
  .screen::after { /* scanlines inside glass */
    content: ""; position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(0deg, #00000000 0 3px, #0009 3px 4px);
    opacity: .5;
  }

  .reels {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .reel {
    position: relative;
    height: 120px;
    overflow: hidden;
    background: #04100a;
    border: 1px solid #1c3a2b;
    border-radius: 8px;
    box-shadow: 0 0 16px #000 inset;
  }
  .reel-strip {
    display: flex; flex-direction: column;
    will-change: transform;
  }
  .cell {
    height: 120px;
    display: flex; align-items: center; justify-content: center;
    font-family: "VT323", monospace;
    font-size: 72px; line-height: 1;
    color: var(--phos);
    text-shadow: 0 0 10px #35ff9e66;
    user-select: none;
  }
  .cell.s-rad   { color: var(--amber);  text-shadow: 0 0 12px #ffb54a77; }
  .cell.s-atom  { color: #7fd0ff;       text-shadow: 0 0 12px #7fd0ff77; }
  .cell.s-seven { color: var(--nuka);   text-shadow: 0 0 12px #e23b4b88; font-weight: 700; }
  .cell.s-star  { color: #fff;          text-shadow: 0 0 12px #ffffff99; }
  .cell.s-skull { color: #9fb6a9;       text-shadow: 0 0 10px #9fb6a966; }

  /* mini bottlecap used both as reel symbol and as payout tokens */
  .cap {
    width: 64px; height: 64px; border-radius: 50%;
    background:
      radial-gradient(circle at 38% 32%, #fff2cf 0%, #ffcf5e 22%, #e2962a 60%, #9c5a14 100%);
    box-shadow: 0 0 10px #ffb54a66, 0 2px 4px #000a;
    position: relative;
    display: grid; place-items: center;
    -webkit-mask: radial-gradient(circle at 50% 50%, #000 61%, #0000 62%),
      conic-gradient(from 0deg, #000 0 6deg, #0000 6deg 15deg);
    mask: radial-gradient(circle at 50% 50%, #000 61%, #0000 62%),
      conic-gradient(from 0deg, #000 0 6deg, #0000 6deg 15deg);
    -webkit-mask-composite: source-over; mask-composite: add;
  }
  .cap::after {
    content: "★";
    font-family: "VT323", monospace;
    font-size: 30px; color: #7a3f0e;
    text-shadow: 0 1px 0 #ffe0a0;
  }
  .cell .cap { width: 70px; height: 70px; }

  /* payline marker */
  .payline {
    position: absolute; left: 6px; right: 6px; top: 50%;
    height: 2px; transform: translateY(-50%);
    background: linear-gradient(90deg, #35ff9e00, #35ff9e 50%, #35ff9e00);
    pointer-events: none; z-index: 3; opacity: .55;
  }
  .reel.hit { box-shadow: 0 0 16px #000 inset, 0 0 0 2px var(--amber), 0 0 22px #ffb54a66; }

  .ticker {
    margin-top: 12px;
    background: #04100a;
    border: 1px solid #1c3a2b;
    border-radius: 6px;
    padding: 7px 10px;
    font-family: "VT323", monospace;
    font-size: clamp(18px, 4.6vw, 24px);
    color: var(--phos);
    text-align: center;
    min-height: 1.3em;
    letter-spacing: 0.04em;
    text-shadow: 0 0 8px #35ff9e55;
  }
  .ticker.bad  { color: var(--nuka);  text-shadow: 0 0 8px #e23b4b66; }
  .ticker.good { color: var(--amber); text-shadow: 0 0 10px #ffb54a77; }

  /* control deck: lever + spin */
  .deck {
    display: flex; gap: 14px; align-items: stretch;
    margin-top: 14px;
  }
  .btn {
    flex: 1; min-width: 0;
    font-family: "Oswald"; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em;
    font-size: clamp(14px, 3.6vw, 17px);
    padding: 15px 10px;
    border-radius: 10px;
    border: 2px solid #05080699;
    cursor: pointer;
    background: linear-gradient(180deg, #2f6b49, #17422c);
    color: var(--ink);
    box-shadow: 0 1px 0 #5fbf8a inset, 0 6px 0 #0b241799, 0 10px 18px -8px #000;
    transition: transform .05s, box-shadow .05s, filter .12s;
  }
  .btn:active { transform: translateY(4px); box-shadow: 0 1px 0 #5fbf8a inset, 0 2px 0 #0b241799; }
  .btn:focus-visible { outline: 3px solid var(--amber); outline-offset: 2px; }
  .btn.spin { background: linear-gradient(180deg, #e8505f, #a51f2c); box-shadow: 0 1px 0 #ff9aa4 inset, 0 6px 0 #5c0e15, 0 10px 18px -8px #000; }
  .btn.spin:active { box-shadow: 0 1px 0 #ff9aa4 inset, 0 2px 0 #5c0e15; }
  .btn:disabled { filter: grayscale(.7) brightness(.6); cursor: not-allowed; }
  .btn .cost { display: block; font-size: 11px; opacity: .85; letter-spacing: 0.14em; margin-top: 2px; }

  .lever {
    width: 54px; flex: 0 0 54px;
    background: #0a120d; border: 1px solid var(--bezel); border-radius: 12px;
    position: relative; cursor: pointer;
    box-shadow: 0 0 10px #000 inset;
  }
  .lever:focus-visible { outline: 3px solid var(--amber); outline-offset: 2px; }
  .lever .track { position: absolute; left: 50%; top: 10px; bottom: 10px; width: 6px; transform: translateX(-50%); background: #05100a; border-radius: 4px; }
  .lever .knob {
    position: absolute; left: 50%; top: 8px;
    width: 34px; height: 34px; border-radius: 50%;
    transform: translate(-50%, 0);
    background: radial-gradient(circle at 36% 30%, #ff8a93, var(--nuka) 55%, #7c141f);
    box-shadow: 0 0 12px #e23b4b88, 0 4px 6px #000a;
    transition: transform .18s cubic-bezier(.3,1.4,.5,1);
  }
  .lever.pulled .knob { transform: translate(-50%, 44px); }

  /* caps payout tray */
  .tray {
    width: min(560px, 100%);
    height: 92px;
    position: relative;
    background: linear-gradient(180deg, #141c18, #0a0f0c);
    border: 2px solid #05080699;
    border-radius: 0 0 16px 16px;
    box-shadow: 0 10px 24px -14px #000, 0 0 0 3px #3a4a40 inset;
    overflow: hidden;
  }
  .tray .slot-lip {
    position: absolute; top: -2px; left: 50%; transform: translateX(-50%);
    width: 120px; height: 10px; background: #04100a;
    border: 1px solid #1c3a2b; border-top: none; border-radius: 0 0 8px 8px;
  }
  .tray .lab {
    position: absolute; bottom: 6px; left: 0; right: 0; text-align: center;
    font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase;
    color: #3f5248; font-weight: 600; pointer-events: none;
  }
  .drop {
    position: absolute; top: -40px;
    width: 26px; height: 26px; pointer-events: none;
    animation: fall 0.9s cubic-bezier(.4,.2,.7,1) forwards;
  }
  .drop .cap { width: 26px; height: 26px; }
  .drop .cap::after { font-size: 12px; }
  @keyframes fall {
    0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
    12%  { opacity: 1; }
    70%  { transform: translateY(72px) rotate(220deg); }
    82%  { transform: translateY(58px) rotate(260deg); }
    100% { transform: translateY(66px) rotate(300deg); opacity: 1; }
  }

  .legend {
    width: min(560px, 100%);
    background: #0a120d;
    border: 1px solid var(--bezel);
    border-radius: 12px;
    padding: 12px 14px 14px;
  }
  .legend h2 {
    margin: 0 0 8px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--amber); font-weight: 700;
  }
  .paytable { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; }
  .prow {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px; font-family: "VT323", monospace; font-size: 20px;
    border-bottom: 1px dashed #1c3a2b; padding-bottom: 2px;
  }
  .prow .sym { color: var(--phos); letter-spacing: 0.1em; }
  .prow .sym .cap { width: 18px; height: 18px; display: inline-block; vertical-align: -3px; }
  .prow .sym .cap::after { font-size: 9px; }
  .prow .pay { color: var(--amber); }
  .note {
    font-family: "Oswald"; font-size: 12px; color: #6f857a; margin-top: 10px;
    text-align: center; letter-spacing: 0.04em;
  }

  .toprow-right { display: flex; gap: 8px; align-items: center; }
  .sndbtn {
    background: #0a120d; border: 1px solid var(--bezel); color: var(--phos-dim);
    border-radius: 8px; width: 40px; cursor: pointer; font-size: 18px;
    font-family: "VT323", monospace;
  }
  .sndbtn.on { color: var(--phos); border-color: var(--phos-dim); }
  .sndbtn:focus-visible { outline: 2px solid var(--amber); }

  @media (max-width: 400px) {
    .cell { font-size: 56px; }
    .cell .cap { width: 56px; height: 56px; }
    .reel, .reel-strip > * { height: 100px; }
    .reel { height: 100px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .wordmark h1 { text-shadow: 0 0 6px #35ff9e66; }
  }

  /* grand-prize redeem panel */
  .prize {
    width: min(560px, 100%);
    background: linear-gradient(180deg, #14211a, #0a120d);
    border: 1px solid var(--bezel);
    border-radius: 12px;
    padding: 14px;
  }
  .prize h2 {
    margin: 0 0 6px; font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--nuka); font-weight: 700;
  }
  .prize-copy { margin: 0 0 12px; font-size: 13px; color: #9db3a7; line-height: 1.45; }
  .redeem { display: flex; gap: 10px; }
  .serial-in {
    flex: 1; min-width: 0;
    background: #04100a; border: 1px solid #1c3a2b; border-radius: 8px;
    color: var(--phos); font-family: "VT323", monospace; font-size: 22px;
    letter-spacing: 0.08em; padding: 8px 12px;
  }
  .serial-in::placeholder { color: #2f5a46; }
  .serial-in:focus-visible { outline: 2px solid var(--amber); }
  .redeem-btn {
    flex: 0 0 auto;
    background: linear-gradient(180deg, #e8b24a, #b67b16);
    box-shadow: 0 1px 0 #ffe29a inset, 0 6px 0 #6e4a0c, 0 10px 18px -8px #000;
    color: #241703;
  }
  .redeem-btn:active { box-shadow: 0 1px 0 #ffe29a inset, 0 2px 0 #6e4a0c; }
  .prize-out {
    margin-top: 12px; font-family: "VT323", monospace; font-size: 20px;
    color: #6f857a; word-break: break-all; min-height: 1.3em;
  }
  .prize-out.good { color: var(--phos); text-shadow: 0 0 10px #35ff9e66; }
  .prize-out.bad { color: var(--nuka); }
</style>

<div class="wordmark">
  <div class="vt">Vault-Tec · Approved Entertainment</div>
  <h1>Caps Lotto-Matic</h1>
  <div class="sub">★ FEED IT CAPS · WIN MORE CAPS ★</div>
</div>

<div class="machine">
  <div class="rivets"><i></i><i></i><i></i><i></i></div>

  <div class="top-row">
    <div class="gauge" id="balGauge">
      <div class="lab">Caps in Pocket</div>
      <div class="val" id="balVal">100</div>
    </div>
    <div class="gauge win">
      <div class="lab">Last Payout</div>
      <div class="val" id="payVal">0</div>
    </div>
    <div class="toprow-right">
      <button class="sndbtn" id="sndBtn" title="Toggle sound" aria-pressed="false">♪</button>
    </div>
  </div>

  <div class="screen">
    <div class="payline"></div>
    <div class="reels" id="reels"></div>
    <div class="ticker" id="ticker">INSERT 5 CAPS · PULL THE LEVER</div>
  </div>

  <div class="deck">
    <button class="btn spin" id="spinBtn">Pull Lever<span class="cost">−5 CAPS PER SPIN</span></button>
    <div class="lever" id="lever" role="button" tabindex="0" aria-label="Pull the lever to spin">
      <div class="track"></div>
      <div class="knob"></div>
    </div>
  </div>
</div>

<div class="tray" id="tray">
  <div class="slot-lip"></div>
  <div class="lab">Payout Tray</div>
</div>

<div class="legend">
  <h2>Payout Table — matched on the payline</h2>
  <div class="paytable" id="paytable"></div>
  <div class="note" id="brokeNote"></div>
</div>

<div class="prize">
  <h2>Vault-Tec Grand Prize</h2>
  <p class="prize-copy">Line up three bottlecaps and the machine prints a winning ticket serial. Punch that serial in below to redeem the sealed Grand Prize.</p>
  <form class="redeem" id="redeemForm">
    <input id="serial" class="serial-in" inputmode="numeric" autocomplete="off" spellcheck="false" placeholder="WINNING TICKET SERIAL" aria-label="Winning ticket serial">
    <button class="btn redeem-btn" type="submit">Redeem</button>
  </form>
  <div class="prize-out" id="prizeOut">SEALED — no winning ticket redeemed yet.</div>
</div>

<script>!function(){"use strict";var e={A:1664525,C:1013904223,M:4294967296,SEED:3405691582,POOL:[0,1,1,2,2,2,3,3,3,3,4,4,4,4,4,5,5,5,5,5,5],IV:"Ap89oAD+nv/sLj5m",CT:"M8KK2DP+IYuYMvu3PgAT581HZkdj5F62u2rmdu7z6ld32sZWuboj096hbO5n0q/mK1RH3A=="},t=e.SEED,n=0;function a(e){for(var t=atob(e),n=new Uint8Array(t.length),a=0;a<t.length;a++)n[a]=t.charCodeAt(a);return n}var o=[{id:"cap",cls:"s-cap",cap:!0,three:250,two:12},{id:"rad",cls:"s-rad",glyph:"☢",three:80,two:3},{id:"atom",cls:"s-atom",glyph:"⚛",three:40,two:1},{id:"seven",cls:"s-seven",glyph:"7",three:25,two:0},{id:"star",cls:"s-star",glyph:"★",three:15,two:0},{id:"skull",cls:"s-skull",glyph:"☠",three:10,two:0}],r={cap:1,rad:2,atom:3,seven:4,star:5,skull:6},c=[];o.forEach((function(e,t){for(var n=0;n<r[e.id];n++)c.push(t)}));var i=window.claude&&window.claude.hot&&window.claude.hot.data||{},s={balance:"number"==typeof i.balance?i.balance:function(){try{var e=localStorage.getItem("caps-lotto-balance");if(null!==e)return Math.max(0,parseInt(e,10)||0)}catch(e){}return 100}(),spinning:!1,sound:!1};function l(){try{localStorage.setItem("caps-lotto-balance",String(s.balance))}catch(e){}}window.claude&&window.claude.hot&&window.claude.hot.snapshot((function(){return{balance:s.balance}}));var d=document.getElementById("reels"),u=document.getElementById("balVal"),m=document.getElementById("payVal"),p=document.getElementById("ticker"),f=document.getElementById("spinBtn"),h=document.getElementById("lever"),v=document.getElementById("tray"),g=document.getElementById("sndBtn"),y=document.getElementById("brokeNote"),E=document.getElementById("prizeOut"),w=document.getElementById("redeemForm");for(var b,C=[],T=0;T<3;T++){var I=document.createElement("div");I.className="reel";var A=document.createElement("div");A.className="reel-strip";for(var L=0;L<13;L++)for(var x=0;x<o.length;x++){var M=document.createElement("div");M.className="cell "+o[x].cls,M.innerHTML=(b=o[x]).cap?'<div class="cap"></div>':b.glyph,A.appendChild(M)}I.appendChild(A),d.appendChild(I),C.push({reel:I,strip:A})}function k(e,t){var n=C[e].strip;n.style.transition="none",n.style.transform="translateY("+120*-t+"px)"}function S(){return t=(e.A*t+e.C)%e.M,e.POOL[t%e.POOL.length]}[0,2,4].forEach((function(e,t){k(t,e)}));var B,N=document.getElementById("paytable");o.forEach((function(e){var t=document.createElement("div");t.className="prow";var n=function(e){return e.cap?'<span class="cap"></span>':"<span>"+e.glyph+"</span>"}(e);t.innerHTML='<span class="sym">'+n+n+n+'</span><span class="pay">'+e.three+"</span>",N.appendChild(t)})),(B=document.createElement("div")).className="prow",B.innerHTML='<span class="sym" style="font-size:16px">PAIR (CAP/RAD/ATOM)</span><span class="pay">1–12</span>',N.appendChild(B);var O=null;function D(){if(!O)try{O=new(window.AudioContext||window.webkitAudioContext)}catch(e){}O&&"suspended"===O.state&&O.resume()}function P(e,t,n,a){if(s.sound&&O)try{var o=O.createOscillator(),r=O.createGain();o.type=n||"square",o.frequency.value=e,r.gain.value=null==a?.05:a,o.connect(r),r.connect(O.destination);var c=O.currentTime;r.gain.setValueAtTime(r.gain.value,c),r.gain.exponentialRampToValueAtTime(1e-4,c+t),o.start(c),o.stop(c+t)}catch(e){}}function H(){P(140,.12,"square",.08)}function z(){P(880+500*Math.random(),.08,"triangle",.05)}function K(){[523,659,784,1047].forEach((function(e,t){setTimeout((function(){P(e,.16,"square",.05)}),110*t)}))}function R(){P(90,.25,"sawtooth",.06)}function V(){u.textContent=s.balance;var e=s.balance>=5&&!s.spinning;if(f.disabled=!e,h.style.pointerEvents=e?"auto":"none",h.style.opacity=e?"1":"0.5",s.balance<5&&!s.spinning){y.innerHTML='Out of caps? <a href="#" id="scavenge">Scavenge the Wasteland</a> for 25 more.';var t=document.getElementById("scavenge");t&&t.addEventListener("click",(function(e){e.preventDefault(),s.balance+=25,l(),q("You scavenged 25 caps from a wrecked vending machine.","good"),z(),V()}))}else y.textContent="Caps are the coin of the Wasteland. These wheels aren't as random as they look."}function q(e,t){p.textContent=e,p.className="ticker"+(t?" "+t:"")}function j(){if(s.spinning||s.balance<5)s.balance<5&&R();else{D(),s.spinning=!0,s.balance-=5,l(),m.textContent="0",document.getElementById("balGauge"),C.forEach((function(e){e.reel.classList.remove("hit")})),q("Spinning the wheels of fortune...",""),V(),H(),h.classList.add("pulled"),setTimeout((function(){h.classList.remove("pulled")}),420);var e=[S(),S(),S()];n=t,e.forEach((function(e,t){var n=C[t].strip;k(t,e),n.offsetHeight;var a=6+2*t,r=e+o.length*a,c=2+.55*t;n.style.transition="transform "+c+"s cubic-bezier(.11,.66,.2,1)",n.style.transform="translateY("+120*-r+"px)",setTimeout((function(){C[t].reel.classList.add("hit"),setTimeout((function(){C[t].reel.classList.remove("hit")}),260),H()}),1e3*c)}));setTimeout((function(){!function(e){var t=function(e){var t=e[0],n=e[1],a=e[2];if(t===n&&n===a)return o[t].three;var r=t===n?t:n===a?n:t===a?t:-1;return-1!==r?o[r].two:0}(e);if(s.spinning=!1,t>0){var a={};e.forEach((function(e){a[e]=(a[e]||0)+1}));var r=Object.keys(a).filter((function(e){return a[e]>=2})).map(Number);C.forEach((function(t,n){-1!==r.indexOf(e[n])&&t.reel.classList.add("hit")}));var c=t>=250,i=1===new Set(e).size;if(q(c?"☢ JACKPOT! The machine coughs up a fortune! +"+t+" CAPS":i?"THREE OF A KIND! +"+t+" CAPS":"A pair pays out. +"+t+" CAPS","good"),m.textContent=t,c?K():P(660,.14,"square",.05),function(e){var t=Math.min(e,36),n=e/t;if(window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches)return s.balance+=e,l(),void V();for(var a=0;a<t;a++)!function(e){setTimeout((function(){var a=document.createElement("div");a.className="drop",a.style.left=18+64*Math.random()+"%",a.innerHTML='<div class="cap"></div>',v.appendChild(a),setTimeout((function(){z(),s.balance=Math.round(s.balance+n),e===t-1&&(s.balance=s.balance),u.textContent=s.balance}),700),setTimeout((function(){a.remove()}),1600+600*Math.random())}),70*e)}(a);var o=s.balance;setTimeout((function(){s.balance=o+e,u.textContent=s.balance,l(),V()}),70*t+900)}(t),c){var d=document.getElementById("serial");d&&(d.value=String(n)),G(String(n))}}else q("No match","bad"),R(),l(),V()}(e)}),3220)}}function G(t){if(t=String(t).trim(),!/^[0-9]+$/.test(t))return E.textContent="INVALID TICKET — serials are numeric.",E.className="prize-out bad",void R();(function(t){if(!e.CT||0===e.CT.indexOf("PLACEHOLDER"))return Promise.reject(new Error("no prize"));var n=(new TextEncoder).encode(t);return crypto.subtle.digest("SHA-256",n).then((function(e){return crypto.subtle.importKey("raw",e,{name:"AES-GCM"},!1,["decrypt"])})).then((function(t){return crypto.subtle.decrypt({name:"AES-GCM",iv:a(e.IV)},t,a(e.CT))})).then((function(e){return(new TextDecoder).decode(e)}))})(t).then((function(e){E.textContent="GRAND PRIZE UNLOCKED  →  "+e,E.className="prize-out good",K()})).catch((function(){E.textContent="INVALID TICKET — the vault stays sealed.",E.className="prize-out bad",R()}))}function Y(){V()}g.addEventListener("click",(function(){s.sound=!s.sound,D(),g.classList.toggle("on",s.sound),g.setAttribute("aria-pressed",String(s.sound)),g.textContent=s.sound?"♫":"♪",s.sound&&z()})),w.addEventListener("submit",(function(e){e.preventDefault(),D(),G(document.getElementById("serial").value)})),f.addEventListener("click",j),h.addEventListener("click",j),h.addEventListener("keydown",(function(e){"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),j())})),document.addEventListener("keydown",(function(e){"Space"===e.code&&e.target===document.body&&(e.preventDefault(),j())})),window.claude&&window.claude.hot&&window.claude.hot.ready?window.claude.hot.ready(Y):Y()}();</script>
