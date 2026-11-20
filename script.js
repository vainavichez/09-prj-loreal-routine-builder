/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const selectedProducts = [];

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map(
      (product) => {
        const isSelected = selectedProducts.some(
          (selectedProduct) => selectedProduct.id === product.id
        );

        return `
    <button
      type="button"
      class="product-card${isSelected ? " selected" : ""}"
      data-product-id="${product.id}"
      aria-pressed="${isSelected}"
    >
      <img src="${product.image}" alt="${product.name}">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p>${product.brand}</p>
      </div>
    </button>
  `;
      }
    )
    .join("");
}

/* Add or remove a product from the selected products list */
productsContainer.addEventListener("click", (e) => {
  const productCard = e.target.closest(".product-card");

  if (!productCard) {
    return;
  }

  const productId = Number(productCard.dataset.productId);
  const selectedIndex = selectedProducts.findIndex(
    (product) => product.id === productId
  );

  if (selectedIndex === -1) {
    const productName = productCard.querySelector("h3").textContent;
    const productBrand = productCard.querySelector("p").textContent;
    selectedProducts.push({
      id: productId,
      name: productName,
      brand: productBrand,
    });
  } else {
    selectedProducts.splice(selectedIndex, 1);
  }

  const isSelected = selectedIndex === -1;
  productCard.classList.toggle("selected", isSelected);
  productCard.setAttribute("aria-pressed", isSelected);

  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) =>
        `<div class="selected-product-item">${product.name} - ${product.brand}</div>`
    )
    .join("");
});

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});
