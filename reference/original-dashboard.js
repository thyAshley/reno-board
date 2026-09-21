
(function(){
"use strict";
const fmt  = n => n.toLocaleString('en-SG',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmt0 = n => Math.round(n).toLocaleString('en-SG');
const fmtA = n => n < -0.004 ? '(' + fmt(-n) + ')' : (Math.abs(n) < 0.005 ? '\u2014' : fmt(n));
const fmtD = n => Math.abs(n) < 0.005 ? '\u2014' : '(' + fmt(n) + ')';
const esc  = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const ITEMS = [
  // gross = invoice price · disc = trade discount, rebate or promotion · net = capitalised cost
  {item:'Hitachi 617L 6-door fridge in Crystal Black (R-HW620WS XK)',        cat:'Kitchen',  room:'Kitchen & service yard', vendor:'Gain City',     grp:'Appliances', gross:4479,    disc:0, dim:'685 W × 738 D × 1833 H'},
  {item:'Otimmo GPro 52L built-in microwave steam oven (EMS8520E)',      cat:'Kitchen',  room:'Kitchen & service yard', vendor:'Gain City',     grp:'Appliances', gross:1999,    disc:200, dim:'595 W × 555 D × 455 H'},
  {item:'Otimmo 8 Series 73cm induction hob with magnetic knob, 2 zones (EIH8732E)',       cat:'Kitchen',  room:'Kitchen & service yard', vendor:'Gain City',     grp:'Appliances', gross:629.50,  disc:0, dim:'730 W × 430 D × 58 H'},
  {item:'Otimmo 90cm semi-integrated slimline hood in black (ECH3908F)',         cat:'Kitchen',  room:'Kitchen & service yard', vendor:'Gain City',     grp:'Appliances', gross:629.50,  disc:0, dim:'900 W × 425 D × 215 H'},
  {item:'Otimmo 22L built-in food warmer in black (EDW22LE), free gift',     cat:'Kitchen',  room:'Kitchen & service yard', vendor:'Gain City',     grp:'Appliances', gross:499,     disc:499, dim:'595 W × 561 D × 141 H'},
  {item:'LG QuadWash dishwasher, 14 place settings, in Prime Silver (DFC533FV)',    cat:'Kitchen',  room:'Kitchen & service yard', vendor:'Best Denki',    grp:'Appliances', gross:869,     disc:20, dim:'600 W × 600 D × 850 H'},
  {item:'AquaLuxe EliteTap 4-in-1 filtered water tap, hot, ambient, cold and sparkling, 5-year package',     cat:'Kitchen',  room:'Kitchen & service yard', vendor:'Aqua Luxe',     grp:'Appliances', gross:2499,    disc:100, dim:'not published'},
  {item:'AquaLuxe CO2 cylinder for the EliteTap',                        cat:'Kitchen',  room:'Kitchen & service yard', vendor:'Aqua Luxe',     grp:'Appliances', gross:80,      disc:0, dim:'not published'},
  {item:'Life by City Energy smart gas water heater in Orchid Pink (L10WFE, HDB model)', cat:'Kitchen', room:'Kitchen & service yard', vendor:'City Energy', grp:'Appliances', gross:620,    disc:0, dim:'300 W × 165 D × 450 H'},
  {item:'Gain City GroupBuy savings, kitchen and laundry order', cat:'Kitchen', room:'Kitchen & service yard', vendor:'Gain City', grp:'Appliances', gross:0, disc:1200, dim:''},
  {item:'Electrolux UltimateCare 700 11kg front load washing machine in white (EWF1143R7WC)', cat:'Laundry', room:'Kitchen & service yard', vendor:'Gain City',    grp:'Appliances', gross:1599,    disc:0, dim:'600 W × 659 D × 850 H'},
  {item:'Rinnai 6.5kg gas clothes dryer in white with wall mount rack (RDT-62-SG-W)',         cat:'Laundry',  room:'Kitchen & service yard', vendor:'City Energy',   grp:'Appliances', gross:1220,    disc:0, dim:'650 W × 561 D × 684 H'},
  {item:'LG Styler\u00ae with Dual TrueSteam\u00ae in Black Tint Mirror (SC5GMR80H)',   cat:'Laundry',  room:'Master bedroom',         vendor:'Best Denki',    grp:'Appliances', gross:2919,    disc:300, dim:'600 W × 620 D × 1965 H'},
  {item:'Mitsubishi Electric Starmex R32 System 4 inverter aircon, 5 ticks: one outdoor unit with four indoor units, two at 9,000 BTU, one at 12,000 BTU and one at 24,000 BTU', cat:'Climate',room:'Whole flat',             vendor:'Gain City',     grp:'Appliances', gross:5209,    disc:521, dim:'outdoor 840 × 330 × 710 &middot; 9,000 and 12,000 BTU indoor 799 × 232 × 290 &middot; 24,000 BTU indoor 923 × 250 × 305'},
  {item:'Gain City Premium 5 Plus extended warranty and service contract, 5 years, on the Mitsubishi Electric System 4',    cat:'Climate',  room:'Whole flat',             vendor:'Gain City',     grp:'Appliances', gross:479,     disc:0, dim:''},
  {item:'Mitsubishi Electric System 4 aircon installation charge, 4 indoor units',                   cat:'Climate',  room:'Whole flat',             vendor:'Gain City',     grp:'Appliances', gross:85,      disc:0, dim:''},
  {item:'Dreame X60 Master Extreme robot vacuum and mop with plumbed dock',       cat:'Cleaning', room:'Whole flat',             vendor:'Gain City',     grp:'Appliances', gross:1699,    disc:340, dim:'dock 416 W × 443 D × 249 H &middot; robot 350 × 350 × 89 (111 with the sensor lifted)'},
  {item:'Sol Luminaire Halo V2.5 10W recessed, white, 3000K ×10',  cat:'Lighting', room:'Whole flat',             vendor:'Sol Luminaire', grp:'Lighting', gross:890,     disc:0, dim:'not stated'},
  {item:'Sol Luminaire Eggy Exposed Double 20W, white, dim to warm ×2', cat:'Lighting', room:'Whole flat',             vendor:'Sol Luminaire', grp:'Lighting', gross:618,  disc:0, dim:'not stated'},
  {item:'Sol Luminaire Pressed 7W, gun metal, 2700K ×2',           cat:'Lighting', room:'Whole flat',             vendor:'Sol Luminaire', grp:'Lighting', gross:448.50,  disc:0, dim:'not stated'},
  {item:'Sol Luminaire Kepler V2 6W wall, full gold, USB-C and USB ×1', cat:'Lighting', room:'Whole flat',             vendor:'Sol Luminaire', grp:'Lighting', gross:309, disc:0, dim:'not stated'},
  {item:'Sol Luminaire Gypsum Boba 9W recessed, white, 3000K to 1800K ×1', cat:'Lighting', room:'Whole flat',             vendor:'Sol Luminaire', grp:'Lighting', gross:141.75, disc:0, dim:'not stated'},
  {item:'Sol Luminaire Basic Exposed Round Tritone 12W, white ×2', cat:'Lighting', room:'Whole flat',             vendor:'Sol Luminaire', grp:'Lighting', gross:118,     disc:0, dim:'not stated'},
  {item:'Sol Luminaire Boba Duo Wall S 16W, gold, dim to warm ×1', cat:'Lighting', room:'Whole flat',             vendor:'Sol Luminaire', grp:'Lighting', gross:111.75,  disc:0, dim:'not stated'},
  {item:'Sol Luminaire Eggy Funnel, gold ×4',                      cat:'Lighting', room:'Whole flat',             vendor:'Sol Luminaire', grp:'Lighting', gross:20,      disc:0, dim:'not stated'},
  {item:'Sol Luminaire Pressed Glass Ripple ×2, supplied at nil',  cat:'Lighting', room:'Whole flat',             vendor:'Sol Luminaire', grp:'Lighting', gross:0,       disc:0, dim:'not stated'},
  {item:'GST at 9% on the Sol Luminaire lighting invoice',            cat:'Lighting', room:'Whole flat',             vendor:'Sol Luminaire', grp:'Lighting', gross:239.13,  disc:0, dim:''}
];
ITEMS.forEach(i => i.amt = i.gross - i.disc);
const GROUPS = [
  {k:'Appliances',                 c:'var(--terracotta-500)'},
  {k:'Renovation works',           c:'var(--caramel-500)'},
  {k:'Bathroom & toilet fittings', c:'var(--clay-600)'},
  {k:'Lighting',                   c:'var(--gold-500)'},
  {k:'Furnishings',                c:'var(--sage-600)'}
];
const CATCOL = {
  Kitchen:'var(--terracotta-500)', Laundry:'var(--clay-600)', Climate:'var(--caramel-500)',
  Lighting:'var(--gold-500)', Cleaning:'var(--blush-500)'
};
const ROOMCOL = {
  'Kitchen & service yard':'var(--terracotta-500)',
  'Whole flat':'var(--caramel-500)', 'Master bedroom':'var(--gold-500)'
};
const TRADES = [
  {id:'prelim', l:'Preliminary, permit and final clean'},
  {id:'hack',   l:'Hacking and debris disposal'},
  {id:'part',   l:'Partition and false ceiling'},
  {id:'mason',  l:'Masonry, tiling and wet works'},
  {id:'carp',   l:'Carpentry'},
  {id:'stone',  l:'Worktop and table top'},
  {id:'plumb',  l:'Plumbing'},
  {id:'elec',   l:'Electrical rewiring and points'},
  {id:'paint',  l:'Painting'},
  {id:'polish', l:'Marble polishing'},
  {id:'alum',   l:'Aluminium and glass'},
  {id:'window', l:'Windows and doors'},
  {id:'other',  l:'Anything else'}
];
const TL = [
  ['Key collection','The flat is mine, bare, nothing in it'],
  ['Works start','The day after the keys'],
  ['Aircon goes in','<b>Day two of works.</b> <em>Four indoor positions, the condenser and the trunking route all have to be settled before the installer turns up</em>'],
  ['Water tap','Paid in full months ahead. <em>A missed slot is a rebooking, not a refund</em>'],
  ['Styler and dishwasher','The late delivery. <em>If the flat is ready sooner I pull it forward</em>'],
  ['Three orders','<em>No delivery date at all. Storage for a 125kg fridge is not a small problem</em>']
];

const MILESTONES = [
  // from / to are ISO dates in Singapore time. Leave both out while a stage has no date yet.
  {when:'20 Sep',       from:'2026-09-20', to:'2026-09-20', what:'Keys collection and measurements', why:'The flat is mine, bare, nothing in it. Every room measured the same day.'},
  {when:'21 to 23 Sep', from:'2026-09-21', to:'2026-09-23', what:'Hacking', why:'Three days of hacking and debris disposal.'},
  {when:'Dates to come', what:'Wet works and services', why:'Masonry, tiling, plumbing and electrical rewiring.'},
  {when:'Dates to come', what:'Windows and glassworks', why:'Windows, aluminium and glass.'},
  {when:'Dates to come', what:'Carpentry and painting', why:'Carpentry, worktops and paint.'},
  {when:'Dates to come', what:'Doors', why:'Bedroom doors and the storeroom door.'},
  {when:'Dates to come', what:'Feature wall'},
  {when:'Dates to come', what:'HIP works', why:'HDB\u2019s Home Improvement Programme works inside the flat. Around 10 business days.'},
  {when:'Dates to come', what:'Marble floor polishing'},
  {when:'Dates to come', what:'Defect checking'},
  {when:'Dates to come', what:'Cleaning'},
  {when:'Dates to come', what:'Moving in', why:'Deliveries and the move.'}
];

const WISH = [
  ['Kitchen','<b>Rigel sensor kitchen mixer tap in gun metal</b> (W2-R-MXK1400028PBB). <em>Hands-free at the sink, and gun metal to match the rest of the kitchen hardware</em>','Kitchen'],
  ['Kitchen','<b>Rigel scratch-resistant kitchen sink</b> in Linen (SNK7544SB-LINEN-250_C1). <em>Goes under the worktop, so it has to be decided before the stone is cut</em>','Kitchen'],
  ['Bathroom','<b>Rigel rain shower system in gun metal</b>, either the Piano series (TSME2031) or the bath and shower mixer with rain and handheld shower (W2-R-MXTE1513), which has a hydropowered display showing the water temperature. <em>The choice depends on where the water pipes run and the height available, so this waits for measurements on site</em>','Bathroom'],
  ['Bathroom','<b>Rigel basin taps in gun metal</b>, for both bathrooms. <em>To match the shower system, so every piece of metal in the bathrooms is the same finish</em>','Bathroom'],
  ['Bathroom','<b>Vanity mirror cabinets, two of them</b>. <em>One for each bathroom. Storage behind the mirror, so the counter stays clear</em>','Bathroom'],
  ['Bathroom','<b>Vanity counter</b>, possibly an integrated style with the basin and counter in one piece. <em>Fewer joins, easier to keep clean</em>','Bathroom'],
  ['Bathroom','<b>Bathroom storage cabinets</b>. <em>For everything that does not fit behind the mirror</em>','Bathroom'],
  ['Dining','<b>Skovby SM 33 round extending table</b>, designed by Per Haansbæk. <em>Round for everyday, extended when people come over. Very chio, and the most hassle-free extending table I have seen. The patented synchronous mechanism opens from the centre and the leaves unfold from the base, so there is nothing to store and nothing to fetch</em>','Dining'],
  ['Dining','<b>One statement piece of lighting for the dining area</b>. <em>Something to hang over the table. Open to suggestions</em>','Lighting'],
  ['Whole flat','<b>Ceiling fans in a wood grain finish, four of them</b>. <em>One per bedroom and one for the living space, so the aircon is not running all day</em>','Fans and ventilation'],
  ['Whole flat','<b>Corner fans in a wood grain finish, two of them</b>. <em>For the spots the ceiling fans will not reach</em>','Fans and ventilation'],
  ['Bathroom','<b>Toilet ventilation fans, two of them</b>. <em>One for each bathroom</em>','Fans and ventilation'],
  ['Service yard','<b>Laundry rack</b>. <em>Open to suggestions. Ceiling-mounted or wall-mounted, as long as it clears the dryer</em>','Laundry'],
  ['Bedrooms','<b>Bedroom doors, three of them</b>. <em>Ideally with a drop seal or flap along the bottom edge, so dust and noise stay on the other side of the door</em>','Doors and windows'],
  ['Storeroom','<b>Storeroom door with a louvre or some other ventilation design</b>. <em>A closed storeroom in this climate goes musty. The door needs to let air through</em>','Doors and windows'],
  ['Storeroom','<b>Small ceiling fan with a light for the storeroom</b>. <em>Keeps the air moving in there, and saves a separate light fitting</em>','Fans and ventilation'],
  ['Windows','<b>Double glazed windows with integral honeycomb blinds and insect mesh</b>. <em>A mouthful, and not easy to find for casement windows and corridor sliding windows. It is also the most expensive thing on this list by some distance, so this is the one I am watching prices on most closely</em>','Doors and windows'],
  ['Main door','<b>Digital lock for the fireproof main door</b>. <em>Keyless entry, and it has to be one that is approved for an HDB fire-rated door. It also has to be mechanically operable from the inside in an emergency or fire, so I can get out without a battery or a code</em>','Doors and windows'],
  ['Whole flat','<b>Skylights</b>. <em>Open to suggestions, and still working out where they can go</em>','Lighting']
];

const GROSS = ITEMS.reduce((s,i)=>s+i.gross,0);
const DISC  = ITEMS.reduce((s,i)=>s+i.disc,0);
const APPL  = GROSS - DISC;
const worksTotal = () => TRADES.reduce((s,t)=>s+(t.amt||0), 0);

// ---------- shell ----------
document.getElementById('root').innerHTML = `
<div class="wrap">
  <div class="masthead">
    <div class="mh-text">
      <div class="eyebrow">Void Deck Dreams &middot; the renovation</div>
      <h1>My renovation<em>dashboard</em></h1>
      <p class="viewnote">Best viewed on a desktop. On a phone, some columns of the appliance table are hidden to keep it readable.</p>
      <p class="standfirst">This is the dashboard I built to keep track of what my first flat is costing me, expenses and works, all in one place. I update it as accurately as I can, and I hope it gives you some idea of what is involved.</p>
      <p class="mh-cta"><a class="btn cta" href="#contact">Contact me</a></p>
    </div>
    <div class="mascotwrap" aria-hidden="true">
      <video class="mascot-vid" id="mascotVid" autoplay loop muted playsinline preload="auto" disablepictureinpicture>
        <source src="data:video/webm;base64,<<BASE64_BLOB_STRIPPED>>" type="video/webm">
      
      </video>
      <canvas class="mascot-vid" id="mascotCv" width="480" height="398" hidden></canvas>
      <video id="mascotSrc" data-src="data:video/mp4;base64,<<BASE64_BLOB_STRIPPED>>" muted playsinline loop preload="auto" disablepictureinpicture style="position:absolute;width:2px;height:2px;opacity:0;pointer-events:none"></video>
      <svg class="mascot" id="mascotSvg" hidden viewBox="0 0 220 220" role="presentation">
          <ellipse class="shadow" cx="98" cy="202" rx="60" ry="9" fill="var(--cream-300)"/>
          <g class="bob">
            <g class="arm-r">
              <rect x="152" y="84" width="30" height="17" rx="8.5" fill="var(--caramel-500)" stroke="var(--ink-700)" stroke-width="5"/>
              <g class="receipt">
                <path d="M172 92 h36 v76 l-6 -6.5 -6 6.5 -6 -6.5 -6 6.5 -6 -6.5 -6 6.5 Z"
                      fill="var(--cream-50)" stroke="var(--ink-700)" stroke-width="5" stroke-linejoin="round"/>
                <g stroke="var(--ink-500)" stroke-width="3.4" stroke-linecap="round">
                  <line x1="180" y1="110" x2="200" y2="110"/>
                  <line x1="180" y1="124" x2="200" y2="124"/>
                  <line x1="180" y1="138" x2="193" y2="138"/>
                </g>
              </g>
            </g>
            <rect x="18" y="110" width="30" height="17" rx="8.5" fill="var(--caramel-500)" stroke="var(--ink-700)" stroke-width="5"/>
            <path d="M42 60 q0 -14 14 -14 h84 q14 0 14 14 v106 q0 14 -14 14 h-84 q-14 0 -14 -14 Z"
                  fill="var(--caramel-500)" stroke="var(--ink-700)" stroke-width="5.5" stroke-linejoin="round"/>
            <path d="M42 60 q0 -14 14 -14 h16 v134 h-16 q-14 0 -14 -14 Z" fill="var(--caramel-600)" opacity="0.16"/>
            <path d="M56 46 q-7 -14 7 -14 h68 q14 0 7 14 Z" fill="var(--caramel-300)" stroke="var(--ink-700)" stroke-width="5" stroke-linejoin="round"/>
            <g fill="var(--cream-50)" stroke="var(--ink-700)" stroke-width="4.5">
              <path d="M58 180 v-25 q0 -13 13 -13 t13 13 v25 Z"/>
              <path d="M85 180 v-25 q0 -13 13 -13 t13 13 v25 Z"/>
              <path d="M112 180 v-25 q0 -13 13 -13 t13 13 v25 Z"/>
            </g>
            <ellipse cx="58" cy="122" rx="11" ry="7" fill="var(--blush-500)" opacity="0.8"/>
            <ellipse cx="136" cy="122" rx="11" ry="7" fill="var(--blush-500)" opacity="0.8"/>
            <g class="eyes">
              <ellipse class="eye" cx="79" cy="100" rx="16" ry="19" fill="var(--cream-50)" stroke="var(--ink-700)" stroke-width="4.5"/>
              <ellipse class="eye" cx="119" cy="100" rx="16" ry="19" fill="var(--cream-50)" stroke="var(--ink-700)" stroke-width="4.5"/>
              <circle cx="82" cy="103" r="7.5" fill="var(--ink-900)"/>
              <circle cx="122" cy="103" r="7.5" fill="var(--ink-900)"/>
              <circle cx="78.5" cy="97.5" r="2.8" fill="var(--cream-50)"/>
              <circle cx="118.5" cy="97.5" r="2.8" fill="var(--cream-50)"/>
            </g>
            <path d="M91 128 q7 8 14 0" fill="none" stroke="var(--ink-700)" stroke-width="4.2" stroke-linecap="round"/>
          </g>
        </svg>
    </div>
  </div>
  <aside class="disclaimer">
    <p class="eyebrow">Please read this bit</p>
    <p>These are my numbers, for my scope, on my dates, through my own channels. Please do not wave them at your ID, your contractor or a salesperson as if they were a going rate. You may not be offered the same, and you may well do better shopping it yourself. Neither I, my designer, my suppliers, nor any merchant who has sold me something on this page is under any obligation to match these prices, and none of us is liable if you are quoted differently.</p>
  </aside>

  <div class="tiles">
    <div class="tile lead" tabindex="0">
      <div class="lab">Renovation works</div><div class="val" id="tileWorks">S$0</div><div class="foot" id="tileWorksFoot">Not quoted yet</div></div>
    <div class="tile" tabindex="0">
      <div class="lab">Gross purchases</div><div class="val" data-count="${GROSS}" data-pre="S$">S$${fmt0(GROSS)}</div><div class="foot">Appliances, fittings and lighting at invoice price</div></div>
    <div class="tile" tabindex="0">
      <div class="lab">Less: discounts</div><div class="val" style="color:var(--sage-600)" data-count="${DISC}" data-paren="1">(${fmt0(DISC)})</div><div class="foot">Trade discounts, rebates and promotions</div></div>
    <div class="tile" tabindex="0">
      <div class="lab">Net cost to date</div><div class="val" data-count="${APPL}" data-pre="S$">S$${fmt0(APPL)}</div><div class="foot">What has actually been paid</div></div>
  </div>

  <section>
    <h2>The timeline so far</h2>
    <p class="note">The renovation is led by Frankie from <a href="https://www.blackalogyinterior.com/" target="_blank" rel="noopener">Blackalogy Interior</a>. It includes the HIP works, which will be done by the contractor assigned by HDB and will take around 10 business days. The sequence is not fixed. I will update it as we go along, so you get to see how everything turned out.</p>
    <ol class="ms" id="ms"></ol>
  </section>

  <section>
    <h2>Overview of expenses</h2>
    <p class="note">Net cost by expense type, after discounts. Bathroom fittings, furnishings and the renovation works have not been bought yet, so those headings sit at nil.</p>
    <div class="chips" id="cutChips">
      <button class="chip" data-cut="grp" aria-pressed="true">By expense type</button>
      <button class="chip" data-cut="cat" aria-pressed="false">By category</button>
      <button class="chip" data-cut="room" aria-pressed="false">By room</button>
      <button class="chip" data-cut="vendor" aria-pressed="false">By supplier</button>
    </div>
    <div class="bars" id="bars"></div>
    <div class="axisline"></div>
    <div class="ticks" id="ticks"></div>
  </section>

  <section class="chunky">
    <h2>Renovation works, trade by trade</h2>
    <p class="note" id="ledgerNote"></p>
    <div id="ledgerBody"></div>
    <div class="totrow">
      <span class="grand"><span class="l">Renovation works, grand total</span><span class="v" id="grand"></span></span>
    </div>
  </section>

  <section>
    <h2>Every appliance, line by line</h2>
    <p class="note">Prepared on the gross method: every line at its invoice price, with trade discounts, rebates and promotions shown as contra amounts in the middle column. Net is the capitalised cost. Click a heading to sort, or filter by category.</p>
    <div class="chips" id="filterChips"></div>
    <div class="scroll"><table id="reg">
      <thead><tr>
        <th data-k="item">Item</th><th class="dim">Size (mm)</th><th data-k="cat">Category</th><th data-k="room">Room</th>
        <th data-k="vendor">Supplier</th>
        <th data-k="gross" class="num">Gross (S$)</th>
        <th data-k="disc" class="num">Discount</th>
        <th data-k="amt" class="num">Net (S$)</th>
      </tr></thead>
      <tbody></tbody>
    </table></div>
  </section>

  <section>
    <h2>Wishlist and pending purchases</h2>
    <p class="note">Not bought yet. This is where I keep track of the things I still want for the flat and the prices I am seeing for them, so I know a good deal when one turns up. No figures here until something is actually paid for.</p>
    <div class="chips" id="wishChips"></div>
    <ul class="tl" id="wishList"></ul>
  </section>

  <section>
    <h2 class="tight">The flat, and which rooms took the money</h2>
    <div class="planwrap">
    <svg class="plan" viewBox="-320 -320 12140 10620" role="img" aria-label="Floor plan of a 4-room HDB flat. The kitchen and yard carry S$13,104 of appliances and the main bedroom S$2,919.">
      <polygon points="0,0 7350,0 9900,500 11430,9900 0,9900" fill="var(--cream-100)"/>
      <g stroke="var(--ink-700)" stroke-width="60" stroke-linejoin="round">
        <rect x="0" y="900" width="3750" height="3900" fill="var(--gold-500)" fill-opacity="0.22"/>
        <rect x="3300" y="200" width="1000" height="1600" fill="var(--cream-50)"/>
        <rect x="4300" y="200" width="1000" height="1600" fill="var(--cream-50)"/>
        <rect x="3750" y="1800" width="2550" height="3000" fill="var(--terracotta-500)" fill-opacity="0.24"/>
        <polygon points="6300,900 9965,900 10600,4800 6300,4800" fill="var(--cream-50)"/>
        <rect x="0" y="4800" width="2000" height="1200" fill="var(--cream-50)"/>
        <rect x="0" y="6000" width="3750" height="3900" fill="var(--cream-50)"/>
        <polygon points="2000,4800 10600,4800 11430,9900 3750,9900 3750,6000 2000,6000" fill="var(--cream-50)"/>
      </g>
      <polygon points="0,0 7350,0 9900,500 11430,9900 0,9900" fill="none" stroke="var(--ink-900)" stroke-width="120" stroke-linejoin="round"/>
      <g font-family="'Space Mono', ui-monospace, monospace" font-size="235" letter-spacing="22" fill="var(--ink-900)" text-anchor="middle">
        <text x="1875" y="2620">MAIN BEDROOM</text>
        <text x="3800" y="1090" font-size="170" letter-spacing="12">BATH</text>
        <text x="4800" y="1090" font-size="170" letter-spacing="12">BATH</text>
        <text x="5025" y="3120">KITCHEN &amp; YARD</text>
        <text x="8250" y="2950">BEDROOM 3</text>
        <text x="1000" y="5480" font-size="185" letter-spacing="14">STORE</text>
        <text x="1875" y="7950">BEDROOM 2</text>
        <text x="7300" y="7950">LIVING ROOM</text>
      </g>
      <g font-family="'Space Mono', ui-monospace, monospace" font-size="310" font-weight="700" text-anchor="middle">
        <text x="5025" y="3610" fill="var(--terracotta-600)">S$13,104</text>
        <text x="1875" y="3110" fill="var(--caramel-700)">S$2,619</text>
      </g>
    </svg>
    </div>
  </section>

  <section class="contact" id="contact">
    <h2>Come and say hello</h2>
    <p class="note">Ask me anything about what is on this page. If you would like to work on something together, or run a promotion with me, write to me too. Vendors, suppliers and merchants are welcome here, and so is anyone else partway through their own flat who wants company on the way.</p>
    <form id="cform" novalidate>
      <div class="frow">
        <label class="field"><span>Your name</span>
          <input id="cf_name" type="text" autocomplete="name" placeholder="Who am I speaking to?"></label>
        <label class="field"><span>Your email</span>
          <input id="cf_mail" type="email" autocomplete="email" placeholder="So I can write back"></label>
      </div>
      <label class="field"><span>What is this about?</span>
        <select id="cf_topic">
          <option>A question about the flat or the costs</option>
          <option>A collaboration</option>
          <option>A promotion or partnership</option>
          <option>I am doing my own flat and just want to say hello</option>
          <option>Something else</option>
        </select></label>
      <label class="field"><span>Your message</span>
        <textarea id="cf_msg" rows="5" placeholder="Tell me what you have in mind."></textarea></label>
      <div class="frow2">
        <button class="btn" type="submit">Write this email</button>
        <span class="fhint" id="cf_hint">This opens your own email app with the message ready. Nothing is sent until you press send there.</span>
      </div>
    </form>
    <p class="orline">Or write to me directly at <a class="mailto" href="mailto:voiddeckdreams@gmail.com">voiddeckdreams@gmail.com</a>
      <button class="copy" id="cf_copy" type="button">copy</button></p>
  </section>

  <p class="wordmark">Void Deck Dreams</p>
</div>
<div id="tip"></div>`;

// ---------- mascot: three routes. VP9 alpha video where it plays cleanly; a colour-plus-mask MP4
// composited on a canvas for Safari (which cannot decode VP9 alpha); the drawn SVG if autoplay is refused.
(function(){
  const v = document.getElementById('mascotVid'), g = document.getElementById('mascotSvg'),
        cv = document.getElementById('mascotCv'), src = document.getElementById('mascotSrc');
  if(!v || !g) return;
  const dbg = location.hash === '#mascotdebug' ? (m => { let d=document.getElementById('mdbg'); if(!d){ d=document.createElement('pre'); d.id='mdbg'; d.style.cssText='position:fixed;left:0;bottom:0;z-index:99;background:#000;color:#0f0;font:11px monospace;padding:6px;max-width:100%;white-space:pre-wrap'; document.body.appendChild(d);} d.textContent += m+'\n'; }) : (()=>{});
  const hide = el => el && el.setAttribute('hidden','');
  const useSvg = why => { dbg('svg: '+why); hide(v); hide(cv); v.removeAttribute('autoplay'); try{ v.pause(); src && src.pause(); }catch(e){} g.removeAttribute('hidden'); };
  const useCanvas = why => {
    dbg('canvas route: '+why);
    if(!cv || !src || !cv.getContext) return useSvg('no canvas support');
    const W = 480, H = 398;
    const ctx = cv.getContext('2d', {willReadFrequently:true});
    const off = document.createElement('canvas'); off.width = W; off.height = H*2;
    const octx = off.getContext('2d', {willReadFrequently:true});
    const out = ctx.createImageData(W, H), o = out.data, N = W*H*4;
    let frames = 0;
    const draw = () => {
      if(src.readyState < 2) return;
      octx.drawImage(src, 0, 0);
      const d = octx.getImageData(0, 0, W, H*2).data;
      for(let i=0;i<N;i+=4){
        let a = d[N+i]; if(a < 18) a = 0;
        if(a){ const k = 255/a;
          o[i]   = Math.min(255, d[i]*k);
          o[i+1] = Math.min(255, d[i+1]*k);
          o[i+2] = Math.min(255, d[i+2]*k);
        } else { o[i]=o[i+1]=o[i+2]=0; }
        o[i+3] = a;
      }
      ctx.putImageData(out, 0, 0);
      if(++frames === 1){ cv.removeAttribute('hidden'); hide(g); dbg('first frame drawn'); }
    };
    if(src.requestVideoFrameCallback){
      const cb = () => { draw(); src.requestVideoFrameCallback(cb); };
      src.requestVideoFrameCallback(cb);
    } else {
      const cb = () => { if(!src.paused) draw(); requestAnimationFrame(cb); };
      requestAnimationFrame(cb);
    }
    hide(v); v.removeAttribute('autoplay'); try{ v.pause(); }catch(e){}
    src.muted = true; src.setAttribute('muted',''); src.setAttribute('playsinline',''); src.setAttribute('webkit-playsinline','');
    const dataUri = src.getAttribute('data-src');
    let triedDirect = false;
    const attempt = (url, label) => {
      dbg('load via '+label);
      src.src = url; src.load();
      const p = src.play();
      if(p && p.then) p.then(()=>dbg('play() resolved')).catch(e => { dbg('play() rejected: '+(e && e.name)); fail('play rejected'); });
    };
    const fail = why => {
      if(!triedDirect){ triedDirect = true; attempt(dataUri, 'data uri'); return; }
      useSvg(why);
    };
    src.addEventListener('error', () => { dbg('media error '+(src.error && src.error.code)); fail('media error'); }, true);
    src.addEventListener('canplay', () => { dbg('canplay, readyState '+src.readyState); if(src.paused) src.play().catch(()=>{}); });
    setTimeout(() => { if(frames === 0) useSvg('no frame after 15s'); }, 15000);
    document.addEventListener('visibilitychange', () => { if(!document.hidden && src.paused && frames) src.play().catch(()=>{}); });
    if (window.fetch && window.URL && URL.createObjectURL) {
      fetch(dataUri).then(r => r.blob()).then(bl => attempt(URL.createObjectURL(bl), 'blob url'))
        .catch(e => { dbg('blob failed: '+e); fail('blob failed'); });
    } else fail('no fetch');
  };
  const ua = navigator.userAgent;
  const apple = /iP(hone|ad|od)/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                (/Safari/.test(ua) && !/Chrome|Chromium|Edg|OPR/.test(ua));
  const vp9 = v.canPlayType && v.canPlayType('video/webm; codecs="vp9"');
  dbg('ua: '+ua+'\napple='+apple+' vp9="'+vp9+'"');
  if (apple || !vp9) { useCanvas(apple ? 'apple device' : 'no vp9'); return; }
  const p = v.play && v.play();
  if (p && p.catch) p.catch(() => useCanvas('webm autoplay rejected'));
  v.addEventListener('error', () => useCanvas('webm error'), true);
  setTimeout(() => { if (v.paused || v.readyState < 2) useCanvas('webm not playing after 2.5s'); }, 2500);
})();

// ---------- tooltip ----------
const tip = document.getElementById('tip');
function bindTip(el, html){
  el.addEventListener('mousemove', e=>{
    tip.innerHTML = html; tip.style.opacity = 1;
    tip.style.left = Math.min(e.clientX+16, window.innerWidth-310)+'px';
    tip.style.top  = (e.clientY+18)+'px';
  });
  el.addEventListener('mouseleave', ()=>{ tip.style.opacity = 0; });
}

// ---------- tiles: count-up and detail on hover ----------
(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.tile').forEach(t=>{
    const v = t.querySelector('.val[data-count]');
    if(!v || reduce) return;
    const target = parseFloat(v.dataset.count), pre = v.dataset.pre || '', paren = v.dataset.paren;
    const t0 = performance.now(), dur = 1100;
    const step = now => {
      const k = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - k, 3);
      const n = fmt0(target * e);
      v.textContent = paren ? '(' + n + ')' : pre + n;
      if(k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
})();

// ---------- bars ----------
let cut = 'grp';
function drawBars(){
  let rows, denom;
  if(cut === 'grp'){
    const m = {};
    ITEMS.forEach(i=>{ m[i.grp] = (m[i.grp]||0) + i.amt; });
    m['Renovation works'] = worksTotal();
    rows = GROUPS.map(g=>({k:g.k, v:m[g.k]||0, c:g.c,
      n: g.k==='Renovation works' ? TRADES.filter(t=>(t.amt||0)>0).length : ITEMS.filter(i=>i.grp===g.k).length}));
    denom = rows.reduce((a,r)=>a+r.v,0) || 1;
  } else {
    const m = {};
    ITEMS.forEach(i=>{ m[i[cut]] = (m[i[cut]]||0) + i.amt; });
    rows = Object.entries(m).map(([k,v])=>({
      k, v,
      c: cut==='cat' ? CATCOL[k] : cut==='room' ? ROOMCOL[k] : CATCOL[ITEMS.find(i=>i.vendor===k).cat],
      n: ITEMS.filter(i=>i[cut]===k).length
    })).filter(r=>r.v!==0).sort((a,b)=>b.v-a.v);
    denom = APPL;
  }
  const max = Math.max.apply(null, rows.map(r=>Math.abs(r.v)).concat([1]));
  const host = document.getElementById('bars');
  host.innerHTML = rows.map(r=>`
    <div class="brow">
      <div class="name">${esc(r.k)}</div>
      <div class="track"><div class="bar" style="width:0;background:${r.c}"></div></div>
      <div class="amt" style="color:${r.v<0?'var(--sage-600)':r.v===0?'var(--ink-400)':'var(--ink-900)'}">${r.v===0?'&mdash;':(r.v<0?'('+fmt0(-r.v)+')':fmt0(r.v))}</div>
    </div>`).join('');
  requestAnimationFrame(()=>{
    host.querySelectorAll('.brow').forEach((el,i)=>{
      el.querySelector('.bar').style.width = (Math.abs(rows[i].v)/max*100)+'%';
      const r = rows[i];
      bindTip(el, r.v === 0
        ? '<b>Nothing spent yet</b><br>No costs recorded under this heading'
        : `<b>S$${fmt(Math.abs(r.v))}</b>${r.v<0?' credited back':''}<br>${r.n} line${r.n===1?'':'s'}, ${(Math.abs(r.v)/denom*100).toFixed(1)}% of the total`);
    });
  });
  const step = Math.ceil(max/4/1000)*1000, n = Math.ceil(max/step)+1;
  const t = document.getElementById('ticks');
  t.style.gridTemplateColumns = 'repeat('+n+',1fr)';
  const narrow = window.innerWidth <= 640;
  t.innerHTML = Array.from({length:n},(_,i)=>'<span>'+(i ? (narrow ? (i*step/1000)+'k' : fmt0(i*step)) : '0')+'</span>').join('');
}
document.getElementById('cutChips').addEventListener('click', e=>{
  const b = e.target.closest('.chip'); if(!b) return;
  cut = b.dataset.cut;
  document.querySelectorAll('#cutChips .chip').forEach(c=>c.setAttribute('aria-pressed', String(c===b)));
  drawBars();
});
drawBars();
let _rz; window.addEventListener('resize', ()=>{ clearTimeout(_rz); _rz=setTimeout(drawBars,150); });

// ---------- works ledger ----------
(function(){
  const recorded = TRADES.filter(t=>(t.amt||0) > 0);
  const act = worksTotal();
  const note = document.getElementById('ledgerNote');
  const bodyEl = document.getElementById('ledgerBody');

  if(recorded.length){
    note.textContent = 'What the renovation works themselves have cost: the contractor labour and materials on site, trade by trade. Appliances are not in here, they sit in the register below.';
    bodyEl.innerHTML = '<div class="scroll"><table>' +
      '<thead><tr><th>Trade</th><th class="num">Amount (S$)</th><th>Who quoted it, and what it covers</th></tr></thead><tbody>' +
      recorded.map(t=>'<tr><td class="item">'+t.l+'</td><td class="num">'+fmt(t.amt)+'</td><td>'+esc(t.note||'—')+'</td></tr>').join('') +
      '</tbody></table></div>';
  } else {
    note.textContent = 'This is where the cost of the renovation works goes: the contractor labour and materials on site, as against the appliances in the register below. Nothing here yet, because the works have not been quoted, so the honest number is zero.';
    bodyEl.innerHTML = '';
  }
  document.getElementById('tileWorks').textContent = 'S$' + fmt0(act);
  document.getElementById('grand').textContent     = fmtA(act);
  document.getElementById('tileWorksFoot').textContent =
    recorded.length ? recorded.length + ' of ' + TRADES.length + ' trades priced' : 'Not quoted yet';
})();


// ---------- contact form ----------
(function(){
  const EMAIL = 'voiddeckdreams@gmail.com';
  const f = document.getElementById('cform');
  const hint = document.getElementById('cf_hint');
  const baseHint = hint.textContent;
  f.addEventListener('submit', e=>{
    e.preventDefault();
    const name  = document.getElementById('cf_name').value.trim();
    const mail  = document.getElementById('cf_mail').value.trim();
    const topic = document.getElementById('cf_topic').value;
    const msg   = document.getElementById('cf_msg').value.trim();
    if(!msg){
      hint.className = 'fhint err';
      hint.textContent = 'Add a message first, then I will open your email app.';
      document.getElementById('cf_msg').focus();
      return;
    }
    const subject = 'Void Deck Dreams: ' + topic;
    const body = msg + '\n\n---\n' +
      (name ? 'From: ' + name + '\n' : '') +
      (mail ? 'Reply to: ' + mail + '\n' : '') +
      'About: ' + topic + '\n' +
      'Sent from the renovation dashboard';
    hint.className = 'fhint';
    hint.textContent = 'Opening your email app. If nothing happens, copy the address below and write to me there.';
    window.location.href = 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    setTimeout(()=>{ hint.textContent = baseHint; }, 9000);
  });
  const copy = document.getElementById('cf_copy');
  copy.addEventListener('click', async ()=>{
    const original = copy.textContent;
    try { await navigator.clipboard.writeText(EMAIL); copy.textContent = 'copied'; }
    catch(err){ copy.textContent = 'select it'; }
    setTimeout(()=>{ copy.textContent = original; }, 2200);
  });
})();

// ---------- register ----------
let filter = 'all', sortK = 'gross', sortDir = -1;
const cats = ['all'].concat(Array.from(new Set(ITEMS.map(i=>i.cat))));
document.getElementById('filterChips').innerHTML = cats.map(c=>
  `<button class="chip" data-c="${c}" aria-pressed="${c==='all'}">${c==='all'?'All lines':c}</button>`).join('');
function drawTable(){
  const rows = ITEMS.filter(i=>filter==='all'||i.cat===filter).slice().sort((a,b)=>{
    const x=a[sortK], y=b[sortK];
    return (typeof x==='number' ? x-y : String(x).localeCompare(String(y))) * sortDir;
  });
  const tG = rows.reduce((s,r)=>s+r.gross,0), tD = rows.reduce((s,r)=>s+r.disc,0);
  document.querySelector('#reg tbody').innerHTML = rows.map(r=>`
    <tr>
      <td class="item">${esc(r.item)}</td>
      <td class="dim">${r.dim || '&mdash;'}</td>
      <td><span class="cell"><i class="dot" style="background:${CATCOL[r.cat]}"></i>${r.cat}</span></td>
      <td>${r.room}</td>
      <td>${r.vendor}</td>
      <td class="num">${fmtA(r.gross)}</td>
      <td class="num" style="color:var(--sage-600)">${fmtD(r.disc)}</td>
      <td class="num">${fmtA(r.amt)}</td>
    </tr>`).join('') +
    `<tr class="tot"><td class="item">Total</td><td></td><td></td><td></td><td></td>
      <td class="num">${fmtA(tG)}</td>
      <td class="num" style="color:var(--sage-600)">${fmtD(tD)}</td>
      <td class="num rule">${fmtA(tG-tD)}</td></tr>`;
}
document.getElementById('filterChips').addEventListener('click', e=>{
  const b = e.target.closest('.chip'); if(!b) return;
  filter = b.dataset.c;
  document.querySelectorAll('#filterChips .chip').forEach(c=>c.setAttribute('aria-pressed', String(c===b)));
  drawTable();
});
document.querySelectorAll('#reg th').forEach(th=>{
  th.tabIndex = 0;
  const go = ()=>{ const k = th.dataset.k; sortDir = (k===sortK) ? -sortDir : (['amt','gross','disc'].includes(k) ? -1 : 1); sortK = k; drawTable(); };
  th.addEventListener('click', go);
  th.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); go(); } });
});
drawTable();

// ---------- wishlist ----------
// ---------- milestones ----------
(function(){
  let today;
  try{ today = new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Singapore'}); }
  catch(e){ today = new Date().toISOString().slice(0,10); }
  let nextTaken = false;
  document.getElementById('ms').innerHTML = MILESTONES.map(m=>{
    let cls='later', label='Not dated yet';
    if(m.from){
      if(today > m.to){ cls='done'; label='Done'; }
      else if(today >= m.from){ cls='now'; label = m.from===m.to ? 'Today' : 'In progress'; }
      else if(!nextTaken){ cls='next'; label='Up next'; nextTaken=true; }
      else { cls='next'; label='Scheduled'; }
    }
    return `<li class="${cls}"${cls==='now'?' aria-current="step"':''}><span class="pip" aria-hidden="true"></span>`+
      `${m.from?`<span class="when">${esc(m.when)}</span>`:''}<span class="what">${esc(m.what)}</span>`+
      `${m.why?`<span class="why">${esc(m.why)}</span>`:''}${cls==='later'?'':`<span class="state">${label}</span>`}</li>`;
  }).join('');
})();

const WCATS = ['all', ...WISH.map(w=>w[2]).filter((c,i,a)=>a.indexOf(c)===i)];
let wishCat = 'all';
document.getElementById('wishChips').innerHTML = WCATS.map(c=>
  `<button class="chip" data-c="${c}" aria-pressed="${c==='all'}">${c==='all'?'Everything':c}</button>`).join('');
function drawWish(){
  const rows = WISH.filter(w => wishCat==='all' || w[2]===wishCat);
  document.getElementById('wishList').innerHTML = rows.map(t=>`<li><span class="d">${t[0]}</span><span class="t">${t[1]}</span></li>`).join('');
}
document.getElementById('wishChips').addEventListener('click', e=>{
  const b = e.target.closest('.chip'); if(!b) return;
  wishCat = b.dataset.c;
  document.querySelectorAll('#wishChips .chip').forEach(c=>c.setAttribute('aria-pressed', String(c===b)));
  drawWish();
});
drawWish();
})();
