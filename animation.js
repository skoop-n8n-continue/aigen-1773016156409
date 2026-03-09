// ====================================================
// DESIGN DECISION: We show 1 product at a time for "Object Worship"
// ====================================================
const PRODUCTS_PER_CYCLE = 1;

let PRODUCTS = [];

async function loadProducts() {
  try {
    const response = await fetch('./products.json', { cache: 'no-store' });
    const data = await response.json();
    PRODUCTS = data.products || [];
  } catch (error) {
    console.error('Failed to load products.json:', error);
    PRODUCTS = [];
  }

  createDustParticles();
  startCycle();
}

function createDustParticles() {
  const container = document.getElementById('background-effects');
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'dust-particle';
    const size = Math.random() * 4 + 1;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    container.appendChild(particle);

    gsap.to(particle, {
      y: `-=${Math.random() * 200 + 100}`,
      x: `+=${Math.random() * 100 - 50}`,
      opacity: Math.random() * 0.4 + 0.1,
      duration: Math.random() * 10 + 10,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: Math.random() * -10
    });
  }
}

function getBatch(batchIndex) {
  const start = (batchIndex * PRODUCTS_PER_CYCLE) % Math.max(PRODUCTS.length, 1);
  const batch = [];
  for (let i = 0; i < PRODUCTS_PER_CYCLE; i++) {
    if (PRODUCTS.length > 0) {
      batch.push(PRODUCTS[(start + i) % PRODUCTS.length]);
    }
  }
  return batch;
}

function renderBatch(products) {
  const container = document.getElementById('products-container');
  container.innerHTML = '';

  products.forEach((product, index) => {
    const productEl = document.createElement('div');
    productEl.className = 'product';
    productEl.dataset.index = index;

    const originalPrice = parseFloat(product.price) || 0;
    const discountedPrice = parseFloat(product.discounted_price) || 0;

    let priceHtml = '';
    if (discountedPrice > 0 && discountedPrice < originalPrice) {
      priceHtml = `
        <div class="price-original">$${originalPrice.toFixed(2)}</div>
        <div class="price-discounted">$${discountedPrice.toFixed(2)}</div>
      `;
    } else {
      priceHtml = `
        <div class="price-discounted">$${originalPrice.toFixed(2)}</div>
      `;
    }

    const metaInfo = [product.brand, product.category, product.unit_weight ? `${product.unit_weight}${product.unit_weight_unit}` : ''].filter(Boolean).join(' | ');

    productEl.innerHTML = `
      <div class="product-vendor">${product.vendor || 'MPX NJ'}</div>
      <div class="product-image-container">
        <div class="product-image-halo"></div>
        <img class="product-image" src="${product.image_url}" alt="${product.name}">
      </div>
      <div class="product-details">
        <h2 class="product-name">${product.name}</h2>
        <div class="price-container">
          ${priceHtml}
        </div>
        <div class="product-meta">${metaInfo}</div>
      </div>
    `;

    container.appendChild(productEl);
  });
}

function animateCycle(batchIndex) {
  const batch = getBatch(batchIndex);
  if (!batch.length) return; // safeguard

  renderBatch(batch);

  const productEl = document.querySelector('.product');
  const vendor = productEl.querySelector('.product-vendor');
  const imageContainer = productEl.querySelector('.product-image-container');
  const image = productEl.querySelector('.product-image');
  const halo = productEl.querySelector('.product-image-halo');
  const title = productEl.querySelector('.product-name');
  const priceOg = productEl.querySelector('.price-original');
  const priceDisc = productEl.querySelector('.price-discounted');
  const meta = productEl.querySelector('.product-meta');
  const xLines = document.querySelectorAll('.x-line');

  // We use SplitText to split the title
  let splitTitle = null;
  if (typeof SplitText !== "undefined") {
    splitTitle = new SplitText(title, {type: "words,chars"});
  }

  const tl = gsap.timeline({
    onComplete: () => animateCycle(batchIndex + 1)
  });

  // Background subtle pulse
  gsap.to('#background', {
    scale: 1.05,
    duration: 15,
    ease: "sine.inOut",
    yoyo: true,
    repeat: 1
  });

  // Setup initial states
  gsap.set(vendor, { opacity: 0, y: 20, letterSpacing: "12px" });
  gsap.set(imageContainer, { opacity: 0, scale: 0.8, y: 50 });
  gsap.set(halo, { opacity: 0, scale: 0.5 });
  gsap.set(priceDisc, { opacity: 0, scale: 0.8, filter: "blur(10px)" });
  if (priceOg) gsap.set(priceOg, { opacity: 0, x: -20 });
  gsap.set(meta, { opacity: 0, y: 20 });
  if (splitTitle) gsap.set(splitTitle.chars, { opacity: 0, y: 20 });

  // 1. Entrance (The Moment Before)
  tl.to(xLines, { opacity: 0.3, duration: 2, ease: "power2.inOut" }, 0)
    .to(vendor, { opacity: 0.8, y: 0, letterSpacing: "8px", duration: 1.5, ease: "power3.out" }, 0.5)
    .to(imageContainer, { opacity: 1, scale: 1, y: 0, duration: 2, ease: "power4.out" }, 1)
    .to(halo, { opacity: 1, scale: 1, duration: 2.5, ease: "sine.inOut" }, 1.5);

  if (splitTitle) {
    tl.to(splitTitle.chars, { opacity: 1, y: 0, duration: 0.8, stagger: 0.02, ease: "back.out(1.5)" }, 1.8);
  } else {
    tl.fromTo(title, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, 1.8);
  }

  if (priceOg) {
    tl.to(priceOg, { opacity: 1, x: 0, duration: 1, ease: "power2.out" }, 2.5);
  }

  tl.to(priceDisc, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.2, ease: "back.out(1.2)" }, 2.8)
    .to(meta, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 3);

  // 2. Living Moment (Object Worship)
  // Floating the product
  tl.to(image, {
    y: -15,
    rotationZ: 2,
    rotationY: 10,
    duration: 3,
    ease: "sine.inOut",
    yoyo: true,
    repeat: 1
  }, 2);

  // 3. Exit (The X cuts through)
  tl.to(xLines, { opacity: 0, duration: 1.5, ease: "power2.in" }, 8)
    .to([vendor, title, priceDisc, meta, halo], { opacity: 0, y: -20, duration: 1.5, stagger: 0.1, ease: "power3.in" }, 8.5);

  if (priceOg) {
    tl.to(priceOg, { opacity: 0, x: 20, duration: 1, ease: "power3.in" }, 8.5);
  }

  tl.to(imageContainer, { opacity: 0, scale: 1.1, y: -50, duration: 1.5, ease: "power4.in" }, 9);

}

window.addEventListener('DOMContentLoaded', loadProducts);
