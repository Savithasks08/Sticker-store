// Fetch products dynamically (simulate API)
async function loadProducts() {
  try {
    const res = await fetch("product.json"); // ✅ fixed filename
    const products = await res.json();
    renderProducts(products);

    // Search
    document.getElementById('searchInput')?.addEventListener('input', function () {
      const term = this.value.toLowerCase();
      const filtered = products.filter(p => p.name.toLowerCase().includes(term));
      renderProducts(filtered);
    });

    // Sort
    document.getElementById('sortSelect')?.addEventListener('change', function () {
      let sorted = [...products];
      if (this.value === "price-asc") sorted.sort((a, b) => a.price - b.price);
      if (this.value === "price-desc") sorted.sort((a, b) => b.price - a.price);
      if (this.value === "name-asc") sorted.sort((a, b) => a.name.localeCompare(b.name));
      if (this.value === "name-desc") sorted.sort((a, b) => b.name.localeCompare(a.name));
      renderProducts(sorted);
    });
  } catch (err) {
    console.error("Error loading products:", err);
  }
}

loadProducts();

// Render products
function renderProducts(list) {
  const productList = document.getElementById('product-list');
  if (!productList) return;

  productList.innerHTML = "";
  list.forEach(product => {
    const div = document.createElement('div');
    div.classList.add('product');
    div.innerHTML = `
      <img src="${product.image}" alt="${product.name}" onclick="viewProduct(${product.id})">
      <h3>${product.name}</h3>
      <p>Rs.${product.price}</p>
      <button onclick="addToCart(${product.id})">Add to Cart</button>
    `;
    productList.appendChild(div);
  });
}

// Toast function
function showToast(message, type = "success") {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "bottom",
    position: "right",
    backgroundColor: type === "success" ? "green" : type === "error" ? "red" : "blue"
  }).showToast();
}

// Cart with expiry (30 mins default)
function getCart() {
  const cartData = JSON.parse(localStorage.getItem('cartData'));
  if (!cartData) return [];

  const { cart, expiry } = cartData;
  if (Date.now() > expiry) {
    localStorage.removeItem('cartData'); // expired
    return [];
  }
  return cart;
}

function saveCart(cart) {
  const expiryTime = Date.now() + 30 * 60 * 1000; // 30 mins
  localStorage.setItem('cartData', JSON.stringify({ cart, expiry: expiryTime }));
}

// Add to Cart
function addToCart(id) {
  fetch("product.json") // ✅ fixed filename
    .then(res => res.json())
    .then(products => {
      let cart = getCart();
      let product = products.find(p => p.id === id);
      let existing = cart.find(item => item.id === id);

      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ ...product, qty: 1 });
      }

      saveCart(cart);
      updateCartUI();
      showToast(`${product.name} added to cart!`);
    });
}

// View Product
function viewProduct(id) {
  fetch("product.json") // ✅ fixed filename
    .then(res => res.json())
    .then(products => {
      const product = products.find(p => p.id === id);
      showToast(`Name: ${product.name} | Rs.${product.price}`, "info");
    });
}

// Render cart (for cart.html)
function updateCartUI() {
  const cartTableBody = document.querySelector('#cart-items tbody');
  let cart = getCart();

  if (cartTableBody) {
    cartTableBody.innerHTML = "";

    if (cart.length === 0) {
      cartTableBody.innerHTML = `<tr><td colspan="5">Your cart is empty.</td></tr>`;
    } else {
      cart.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${item.name}</td>
          <td>${item.qty}</td>
          <td>Rs.${item.price}</td>
          <td>Rs.${item.price * item.qty}</td>
          <td><button onclick="removeItem(${item.id})">Remove</button></td>
        `;
        cartTableBody.appendChild(row);
      });

      const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
      document.getElementById('total').innerText = `Total: Rs.${total}`;
    }
  }

  // Update cart count (nav link)
  const cartLink = document.getElementById('cart-link');
  if (cartLink) {
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    cartLink.textContent = count > 0 ? `🛒 Cart (${count})` : "🛒 Cart";
  }
}

// Remove item (no reload)
function removeItem(id) {
  let cart = getCart();
  cart = cart.filter(item => item.id !== id);
  saveCart(cart);
  updateCartUI();
  showToast("Item removed", "error");
}

// Checkout form
document.getElementById('checkoutForm')?.addEventListener('submit', function (e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const address = document.getElementById('address').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!name || !address || !email) {
    showToast("Please fill out all fields correctly.", "error");
    return;
  }

  localStorage.removeItem('cartData');
  document.getElementById('confirmation').innerHTML = `<h2>Thank you for your order, ${name}!</h2>`;
  updateCartUI();
  this.reset();
});

// Load cart UI initially
updateCartUI();
