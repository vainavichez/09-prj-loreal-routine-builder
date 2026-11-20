/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateRoutineButton = document.getElementById("generateRoutine");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendBtn");
const workerURL = "https://calm-morning-b2c8.chvainavi.workers.dev/";
const selectedProducts = [];
const messages = [];

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
        <p class="product-brand">${product.brand}</p>
      </div>
      <p class="product-description">${product.description}</p>
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
    const productBrand = productCard.querySelector(".product-brand").textContent;
    const productDescription = productCard.querySelector(
      ".product-description"
    ).textContent;
    selectedProducts.push({
      id: productId,
      name: productName,
      brand: productBrand,
      description: productDescription,
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

/* Add a safely rendered message to the chat window */
function addChatMessage(role, content) {
  const messageElement = document.createElement("p");
  messageElement.className = `chat-message ${role}`;

  const speaker = document.createElement("strong");
  speaker.textContent = role === "user" ? "You: " : "Advisor: ";
  messageElement.append(speaker, document.createTextNode(content));
  chatWindow.append(messageElement);
  chatWindow.scrollTop = chatWindow.scrollHeight;

  return messageElement;
}

/* Send a question and the conversation history to the Cloudflare Worker */
async function sendChatMessage(content) {
  const userMessage = { role: "user", content };
  addChatMessage("user", content);
  const loadingMessage = addChatMessage("assistant", "Thinking...");

  userInput.disabled = true;
  sendButton.disabled = true;
  generateRoutineButton.disabled = true;

  try {
    const response = await fetch(workerURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    });

    if (!response.ok) {
      throw new Error(`Worker request failed with status ${response.status}.`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content;

    if (typeof reply !== "string" || !reply.trim()) {
      throw new Error("The Worker response did not include a reply.");
    }

    messages.push(userMessage, { role: "assistant", content: reply });
    loadingMessage.remove();
    addChatMessage("assistant", reply);
  } catch (error) {
    loadingMessage.remove();
    console.error("Unable to get a response from the Cloudflare Worker:", error);
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    addChatMessage(
      "assistant",
      `Sorry, I couldn't get a response. ${errorMessage}`
    );
  } finally {
    userInput.disabled = false;
    sendButton.disabled = false;
    generateRoutineButton.disabled = false;
  }
}

/* Turn the selected products into the first question for the advisor */
generateRoutineButton.addEventListener("click", () => {
  if (selectedProducts.length === 0) {
    addChatMessage("assistant", "Select one or more products to get started.");
    return;
  }

  const productDetails = selectedProducts
    .map(
      (product) =>
        `- ${product.brand} ${product.name}: ${product.description}`
    )
    .join("\n");

  sendChatMessage(
    `Create a personalized routine using these selected products:\n${productDetails}`
  );
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

/* Send follow-up questions with the full conversation history */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const question = userInput.value.trim();

  if (question) {
    userInput.value = "";
    sendChatMessage(question);
  }
});
