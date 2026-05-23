const state = {
  imageData: "",
  latestListing: null,
};

const form = document.querySelector("#listingForm");
const fileInput = document.querySelector("#itemImage");
const preview = document.querySelector("#preview");
const uploadBox = document.querySelector(".upload-box");
const generatedTitle = document.querySelector("#generatedTitle");
const generatedDescription = document.querySelector("#generatedDescription");
const generatedPrice = document.querySelector("#generatedPrice");
const priceReason = document.querySelector("#priceReason");
const marketLinks = document.querySelector("#marketLinks");
const productGrid = document.querySelector("#productGrid");
const template = document.querySelector("#productTemplate");
const copyButton = document.querySelector("#copyListing");
const clearButton = document.querySelector("#clearListings");
const adminPasscode = document.querySelector("#adminPasscode");
const adminSignIn = document.querySelector("#adminSignIn");
const adminStatus = document.querySelector("#adminStatus");
const adminTools = document.querySelector("#adminTools");
const adminLogin = document.querySelector("#adminLogin");
const ownerEmail = document.querySelector("#ownerEmail");
const paymentLink = document.querySelector("#paymentLink");
const saveOwnerProfileButton = document.querySelector("#saveOwnerProfile");
const exportListings = document.querySelector("#exportListings");
const lockAdmin = document.querySelector("#lockAdmin");
const ownerSaveStatus = document.querySelector("#ownerSaveStatus");
const ownerEmailLink = document.querySelector("#ownerEmailLink");
const ownerPaymentLink = document.querySelector("#ownerPaymentLink");

const ownerPasscode = "booduh-admin";

const pricing = {
  clothing: { min: 12, max: 58, words: ["fit", "streetwear", "clean", "ready to wear"] },
  electronics: { min: 25, max: 160, words: ["tested", "useful", "daily-ready", "quick pickup"] },
  music: { min: 35, max: 220, words: ["studio", "sound", "creative", "workflow"] },
  home: { min: 15, max: 90, words: ["home", "functional", "clean", "easy pickup"] },
  collectible: { min: 20, max: 140, words: ["limited", "display", "collector", "harder to find"] },
  other: { min: 10, max: 85, words: ["practical", "priced to move", "useful", "available now"] },
};

const conditionMultiplier = {
  new: 1.18,
  "like-new": 1.08,
  good: 0.92,
  fair: 0.68,
  parts: 0.38,
};

function titleCase(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\.[^/.]+$/, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getListings() {
  try {
    return JSON.parse(localStorage.getItem("booduhListings") || "[]");
  } catch {
    return [];
  }
}

function saveListings(listings) {
  localStorage.setItem("booduhListings", JSON.stringify(listings));
}

function getOwnerProfile() {
  try {
    return JSON.parse(localStorage.getItem("booduhOwnerProfile") || "{}");
  } catch {
    return {};
  }
}

function saveOwnerProfile(profile) {
  localStorage.setItem("booduhOwnerProfile", JSON.stringify(profile));
}

function applyOwnerProfile() {
  const profile = getOwnerProfile();
  const email = profile.email || "brianalbert37@gmail.com";
  const payment = profile.payment || "";

  ownerEmail.value = email;
  paymentLink.value = payment;
  ownerEmailLink.href = `mailto:${email}?subject=BooDuh%20work%20or%20store%20request`;
  ownerEmailLink.textContent = email;

  if (payment) {
    ownerPaymentLink.href = payment;
    ownerPaymentLink.textContent = "Pay BooDuh";
    ownerPaymentLink.target = "_blank";
    ownerPaymentLink.rel = "noreferrer";
  } else {
    ownerPaymentLink.href = `mailto:${email}?subject=BooDuh%20payment%20link%20request`;
    ownerPaymentLink.textContent = "Request payment link";
    ownerPaymentLink.removeAttribute("target");
    ownerPaymentLink.removeAttribute("rel");
  }
}

function inferKeywords() {
  const typed = document.querySelector("#keywords").value.trim();
  if (typed) return typed;
  const file = fileInput.files?.[0];
  if (file?.name) return titleCase(file.name);
  return "Quality item";
}

function estimatePrice(category, condition, floorPrice) {
  const band = pricing[category] || pricing.other;
  const multiplier = conditionMultiplier[condition] || 0.9;
  const low = Math.max(5, Math.round(band.min * multiplier));
  const high = Math.max(low + 5, Math.round(band.max * multiplier));
  const fastSale = Math.round((low * 0.42 + high * 0.58) * 0.86);
  const ask = Math.max(Number(floorPrice) || 0, fastSale);
  return { low, high, ask };
}

function createDescription({ keywords, category, condition, notes, ask }) {
  const band = pricing[category] || pricing.other;
  const descriptor = band.words[Math.floor(Math.random() * band.words.length)];
  const conditionText = condition.replace("-", " ");
  const noteLine = notes ? ` Details: ${notes.trim()}` : "";
  return `${keywords} in ${conditionText} condition, priced to move today. This is a ${descriptor} pickup for someone who wants value without paying retail.${noteLine} Asking $${ask}, but serious same-day buyers can message with a fair offer.`;
}

function buildMarketLinks(keywords) {
  const query = encodeURIComponent(`${keywords} used sold price`);
  const links = [
    ["eBay sold", `https://www.ebay.com/sch/i.html?_nkw=${query}&LH_Sold=1&LH_Complete=1`],
    ["Google", `https://www.google.com/search?q=${query}`],
    ["Facebook", `https://www.facebook.com/marketplace/search/?query=${encodeURIComponent(keywords)}`],
  ];
  marketLinks.replaceChildren(
    ...links.map(([label, href]) => {
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.target = "_blank";
      anchor.rel = "noreferrer";
      anchor.textContent = label;
      return anchor;
    }),
  );
}

function renderGenerated(listing) {
  state.latestListing = listing;
  generatedTitle.textContent = listing.title;
  generatedDescription.textContent = listing.description;
  generatedPrice.textContent = `$${listing.ask}`;
  priceReason.textContent = `Comparable quick-sale range: $${listing.low}-$${listing.high}. The ask is discounted to help it move fast.`;
  buildMarketLinks(listing.keywords);
}

function renderProducts() {
  const listings = getListings();
  productGrid.replaceChildren();

  if (!listings.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No saved listings yet. Generate one above and it will appear here.";
    productGrid.append(empty);
    return;
  }

  listings.forEach((listing) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.querySelector("img").src = listing.imageData || "assets/images/twist-cover.png";
    node.querySelector("img").alt = listing.title;
    node.querySelector(".product-meta").textContent = `${listing.category} / ${listing.condition.replace("-", " ")}`;
    node.querySelector("h3").textContent = listing.title;
    node.querySelector("strong").textContent = `$${listing.ask}`;
    node.querySelector("button").addEventListener("click", () => {
      saveListings(getListings().filter((item) => item.id !== listing.id));
      renderProducts();
    });
    productGrid.append(node);
  });
}

fileInput.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.imageData = reader.result;
    preview.src = state.imageData;
    preview.hidden = false;
    uploadBox.classList.add("has-image");
  });
  reader.readAsDataURL(file);
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const category = document.querySelector("#category").value;
  const condition = document.querySelector("#condition").value;
  const floorPrice = document.querySelector("#floorPrice").value;
  const notes = document.querySelector("#notes").value;
  const keywords = inferKeywords();
  const estimate = estimatePrice(category, condition, floorPrice);
  const title = `${titleCase(keywords)} - priced to move`;
  const description = createDescription({ keywords, category, condition, notes, ask: estimate.ask });
  const listing = {
    id: crypto.randomUUID(),
    title,
    description,
    keywords,
    category,
    condition,
    imageData: state.imageData,
    ...estimate,
    createdAt: new Date().toISOString(),
  };

  renderGenerated(listing);
  saveListings([listing, ...getListings()].slice(0, 24));
  renderProducts();
});

copyButton.addEventListener("click", async () => {
  if (!state.latestListing) return;
  const text = `${state.latestListing.title}\n\n${state.latestListing.description}\n\nPrice: $${state.latestListing.ask}`;
  await navigator.clipboard.writeText(text);
  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = "Copy listing";
  }, 1400);
});

clearButton.addEventListener("click", () => {
  saveListings([]);
  renderProducts();
});

adminSignIn.addEventListener("click", () => {
  if (adminPasscode.value.trim() !== ownerPasscode) {
    adminStatus.textContent = "Wrong passcode";
    return;
  }

  adminLogin.hidden = true;
  adminTools.hidden = false;
  adminStatus.textContent = "Unlocked";
});

lockAdmin.addEventListener("click", () => {
  adminPasscode.value = "";
  adminLogin.hidden = false;
  adminTools.hidden = true;
  adminStatus.textContent = "Locked";
});

saveOwnerProfileButton.addEventListener("click", () => {
  saveOwnerProfile({
    email: ownerEmail.value.trim() || "brianalbert37@gmail.com",
    payment: paymentLink.value.trim(),
    updatedAt: new Date().toISOString(),
  });
  applyOwnerProfile();
  ownerSaveStatus.textContent = "Saved on this device";
});

exportListings.addEventListener("click", async () => {
  const payload = JSON.stringify(
    {
      owner: getOwnerProfile(),
      listings: getListings(),
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  );
  await navigator.clipboard.writeText(payload);
  ownerSaveStatus.textContent = "Listings copied";
});

applyOwnerProfile();
renderProducts();
