let currentCategory = "all";
let currentPriceFilter = "all";
let currentSort = "default";
let searchQuery = "";

let activeModalProduct = null;
let activeModalWeight = 1.0;
let activeModalMax = 0; // số lượng còn có thể thêm = tồn kho - đã có trong giỏ

document.addEventListener("DOMContentLoaded", function () {
    updateCartBadge();
    updateMiniCartDrawer();

    const searchInput = document.getElementById("searchInput");
    const searchClearBtn = document.getElementById("searchClearBtn");
    const categoryButtons = document.querySelectorAll(".cat-item-btn");
    const priceButtons = document.querySelectorAll(".price-pill");
    const sortSelect = document.getElementById("sortSelect");

    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            searchQuery = e.target.value.trim();
            if (searchClearBtn) {
                searchClearBtn.style.display = searchQuery ? "block" : "none";
            }
            renderProducts();
        });
    }

    categoryButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            categoryButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentCategory = this.getAttribute("data-category");
            renderProducts();
        });
    });

    priceButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            priceButtons.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentPriceFilter = this.getAttribute("data-price");
            renderProducts();
        });
    });

    if (sortSelect) {
        sortSelect.addEventListener("change", function () {
            currentSort = this.value;
            renderProducts();
        });
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeQuickView();
            closeCartDrawer();
            closeOrderTrackingModal();
        }
    });

    renderProducts();
});

function renderProducts() {
    const productListEl = document.getElementById("productList");
    if (!productListEl) return;

    let products = getProducts();

    if (currentCategory !== "all") {
        products = products.filter(p => p.category === currentCategory);
    }

    if (searchQuery) {
        const qNorm = removeVietnameseTones(searchQuery);
        products = products.filter(p =>
            removeVietnameseTones(p.name).includes(qNorm) ||
            removeVietnameseTones(p.origin).includes(qNorm) ||
            (p.taste && removeVietnameseTones(p.taste).includes(qNorm)) ||
            (p.id && p.id.toLowerCase().includes(qNorm))
        );
    }

    if (currentPriceFilter === "under-50") {
        products = products.filter(p => p.price < 50000);
    } else if (currentPriceFilter === "50-150") {
        products = products.filter(p => p.price >= 50000 && p.price <= 150000);
    } else if (currentPriceFilter === "over-150") {
        products = products.filter(p => p.price > 150000);
    }

    if (currentSort === "price-asc") {
        products.sort((a, b) => a.price - b.price);
    } else if (currentSort === "price-desc") {
        products.sort((a, b) => b.price - a.price);
    } else if (currentSort === "brix-desc") {
        products.sort((a, b) => (b.brix || 0) - (a.brix || 0));
    } else if (currentSort === "rating-desc") {
        products.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    productListEl.innerHTML = "";

    if (products.length === 0) {
        productListEl.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px 16px; background: #ffffff; border: 1px solid var(--border); border-radius: var(--radius);">
                <div style="font-size: 40px; margin-bottom: 12px;">🍎</div>
                <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Không tìm thấy hoa quả nào phù hợp</h3>
                <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">Vui lòng thử tìm với từ khóa khác hoặc bỏ các bộ lọc giá.</p>
                <button class="btn-quickview" onclick="resetAllFilters()">Đặt lại bộ lọc</button>
            </div>
        `;
        return;
    }

    products.forEach(product => {
        const isOutOfStock = product.stock <= 0;
        const isExpired = typeof getDaysUntilExpiry === "function" ? getDaysUntilExpiry(product.expiryDate) < 0 : false;
        const isDisabled = isOutOfStock || isExpired;
        const card = document.createElement("div");
        card.className = `product-card ${isDisabled ? "out-of-stock" : ""}`;

        let badgeClass = "badge-cert";
        let badgeText = product.badge || product.standard;
        if (isOutOfStock) {
            badgeClass = "badge-hot";
            badgeText = "Tạm hết hàng";
        } else if (isExpired) {
            badgeClass = "badge-hot";
            badgeText = "Hết hạn sử dụng";
        } else if (product.badge === "Bán chạy" || (product.badge && product.badge.includes("date"))) {
            badgeClass = "badge-hot";
        } else if (product.standard === "Organic") {
            badgeClass = "badge-organic";
        }

        const stockText = isOutOfStock
            ? "Tạm hết hàng"
            : (isExpired ? "Hết hạn sử dụng" : `Còn ${formatQuantity(product.stock, product.unit)} ${product.unit}`);

        card.innerHTML = `
            <div class="product-thumb-container">
                <img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" class="product-thumb-img" loading="lazy" onerror="handleImageError(this)">
                <span class="card-badge ${badgeClass}">${escapeHTML(badgeText)}</span>
                <span class="card-stock-tag ${isDisabled ? 'tag-out' : ''}">${escapeHTML(stockText)}</span>
            </div>

            <div class="product-body">
                <div class="product-rating">
                    <span class="stars">★★★★★</span>
                    <span>${product.rating || 4.9} (${product.reviewsCount || 28})</span>
                </div>

                <h3 class="product-title" title="${escapeHTML(product.name)}">${escapeHTML(product.name)}</h3>

                <div class="product-origin-row">
                    <span>Xuất xứ:</span>
                    <span class="origin-badge">${escapeHTML(product.origin)}</span>
                    <span style="color: #94a3b8;">•</span>
                    <span style="color: var(--primary-dark); font-weight: 500;">Brix ${product.brix || 12}°</span>
                </div>

                <div class="product-price-section">
                    <div>
                        <span class="price-current">${formatCurrency(product.price)}</span>
                        <span class="price-unit-label">/ ${escapeHTML(product.unit)}</span>
                        ${product.originalPrice ? `<span class="price-original">${formatCurrency(product.originalPrice)}</span>` : ""}
                    </div>
                </div>

                <div class="product-card-actions">
                    <button class="btn-quickview" onclick="openQuickView(${jsArg(product.id)})">
                        Xem chi tiết
                    </button>
                    ${isDisabled ? `
                        <button class="btn-add-cart-primary btn-disabled" disabled title="${isExpired ? 'Sản phẩm đã hết hạn sử dụng' : 'Sản phẩm tạm thời hết hàng'}">
                            ${isExpired ? 'Hết hạn' : 'Hết hàng'}
                        </button>
                    ` : `
                        <button class="btn-add-cart-primary" onclick="quickAddToCart(${jsArg(product.id)})">
                            + Thêm giỏ
                        </button>
                    `}
                </div>
            </div>
        `;
        productListEl.appendChild(card);
    });
}

function quickAddToCart(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (product.stock <= 0) {
        showToast(`Rất tiếc, "${product.name}" hiện đã tạm hết hàng!`, "error");
        return;
    }

    if (typeof getDaysUntilExpiry === "function" && getDaysUntilExpiry(product.expiryDate) < 0) {
        showToast(`Rất tiếc, "${product.name}" đã hết hạn sử dụng!`, "error");
        return;
    }

    let cart = getCart();
    const existing = cart.find(it => it.id === productId);
    const isKg = product.unit === "kg";
    const currentQty = existing ? parseSafeQty(existing.quantity, 0) : 0;

    let addQty = isKg ? Math.min(1.0, product.stock) : 1;

    if (Math.round((currentQty + addQty) * 10) / 10 > product.stock) {
        const remaining = Math.max(0, Math.round((product.stock - currentQty) * 10) / 10);
        if (remaining > 0) {
            addQty = remaining;
        } else {
            showToast(`Kho chỉ còn ${formatQuantity(product.stock, product.unit)} ${product.unit}, bạn đã thêm tối đa trong giỏ!`, "error");
            return;
        }
    }

    if (existing) {
        existing.quantity = Math.round((currentQty + addQty) * 10) / 10;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            image: product.image,
            quantity: addQty
        });
    }

    saveCart(cart);
    showToast(`Đã thêm ${formatQuantity(addQty, product.unit)} ${product.unit} "${product.name}" vào giỏ hàng`);
    openCartDrawer();
}

function openQuickView(productId) {
    const products = getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    activeModalProduct = product;
    const isKg = product.unit === "kg";
    const minStep = isKg ? 0.5 : 1;
    const currentCart = getCart();
    const existingInCart = currentCart.find(it => it.id === product.id);
    const inCartQty = existingInCart ? parseSafeQty(existingInCart.quantity, 0) : 0;
    const maxAvailable = Math.max(0, Math.round((product.stock - inCartQty) * 10) / 10);
    activeModalMax = maxAvailable;
    const isExpired = typeof getDaysUntilExpiry === "function" ? getDaysUntilExpiry(product.expiryDate) < 0 : false;

    if (maxAvailable <= 0 || isExpired) {
        activeModalWeight = 0;
    } else if (isKg) {
        activeModalWeight = Math.min(1.0, maxAvailable);
    } else {
        activeModalWeight = Math.min(1, maxAvailable);
    }

    const modalImg = document.getElementById("modalImg");
    modalImg.src = product.image;
    modalImg.onerror = function () { handleImageError(this); };

    document.getElementById("modalTitle").textContent = product.name;
    const modalBadge = document.getElementById("modalBadge");
    if (modalBadge) {
        let badgeClass = "badge-cert";
        let badgeText = product.badge || product.standard;
        if (product.stock <= 0) {
            badgeClass = "badge-hot";
            badgeText = "Tạm hết hàng";
        } else if (isExpired) {
            badgeClass = "badge-hot";
            badgeText = "Hết hạn sử dụng";
        } else if (product.badge === "Bán chạy" || (product.badge && product.badge.includes("date"))) {
            badgeClass = "badge-hot";
        } else if (product.standard === "Organic") {
            badgeClass = "badge-organic";
        }
        modalBadge.className = `card-badge ${badgeClass}`;
        modalBadge.textContent = badgeText;
    }
    document.getElementById("modalRatingText").textContent = `${product.rating} (${product.reviewsCount} đánh giá tin cậy)`;
    document.getElementById("modalPrice").textContent = formatCurrency(product.price);
    document.getElementById("modalUnit").textContent = `/ ${product.unit}`;
    document.getElementById("modalDesc").textContent = product.description;
    document.getElementById("modalOrigin").textContent = product.origin;
    document.getElementById("modalStandard").textContent = product.standard;

    const stockMsg = product.stock <= 0
        ? `<strong style="color: #dc2626;">Đã hết hàng</strong>`
        : (isExpired ? `<strong style="color: #dc2626;">Đã hết hạn sử dụng</strong>` : `Còn ${formatQuantity(product.stock, product.unit)} ${escapeHTML(product.unit)}`);
    document.getElementById("modalExpiry").innerHTML = `${escapeHTML(product.expiryDate)} (${stockMsg})`;
    document.getElementById("modalStorage").textContent = product.storage;
    document.getElementById("modalBrixVal").textContent = `${product.brix || 13}° Brix`;

    const brixPct = Math.min(100, Math.round(((product.brix || 12) / 20) * 100));
    document.getElementById("modalBrixFill").style.width = `${brixPct}%`;

    const chipsContainer = document.getElementById("weightChips");
    if (chipsContainer) {
        if (isKg) {
            const weights = [0.5, 1.0, 1.5, 2.0, 3.0];
            chipsContainer.innerHTML = weights.map(w => {
                const isExceed = w > maxAvailable;
                const isActive = Math.abs(w - activeModalWeight) < 0.05 && !isExceed;
                return `<button type="button" class="weight-chip ${isActive ? 'active' : ''} ${isExceed ? 'chip-disabled' : ''}"
                    onclick="selectWeight(${w}, this)" ${isExceed ? 'disabled title="Vượt quá tồn kho"' : ''}>${w.toFixed(1)} kg</button>`;
            }).join("");
        } else {
            const weights = [1, 2, 3, 5];
            chipsContainer.innerHTML = weights.map(w => {
                const isExceed = w > maxAvailable;
                const isActive = Math.abs(w - activeModalWeight) < 0.05 && !isExceed;
                return `<button type="button" class="weight-chip ${isActive ? 'active' : ''} ${isExceed ? 'chip-disabled' : ''}"
                    onclick="selectWeight(${w}, this)" ${isExceed ? 'disabled title="Vượt quá tồn kho"' : ''}>${w} ${escapeHTML(product.unit)}</button>`;
            }).join("");
        }
    }

    const customInput = document.getElementById("modalCustomWeightInput");
    if (customInput) {
        customInput.value = formatQuantity(activeModalWeight, product.unit);
        customInput.min = minStep;
        customInput.max = maxAvailable;
        customInput.step = minStep;
    }
    const customUnit = document.getElementById("modalCustomWeightUnit");
    if (customUnit) {
        customUnit.textContent = product.unit;
    }

    const stepDownBtn = document.getElementById("modalStepDownBtn");
    const stepUpBtn = document.getElementById("modalStepUpBtn");
    if (stepDownBtn) stepDownBtn.setAttribute("onclick", `stepModalWeight(-${minStep})`);
    if (stepUpBtn) stepUpBtn.setAttribute("onclick", `stepModalWeight(${minStep})`);

    updateModalCalcTotal();

    const addBtn = document.getElementById("modalAddToCartBtn");
    if (product.stock <= 0 || isExpired || maxAvailable <= 0) {
        addBtn.disabled = true;
        addBtn.className = "btn-add-cart-primary btn-disabled";
        if (isExpired) {
            addBtn.textContent = "Sản phẩm đã hết hạn sử dụng";
        } else if (product.stock <= 0) {
            addBtn.textContent = "Sản phẩm tạm thời hết hàng";
        } else {
            addBtn.textContent = "Đã thêm tối đa vào giỏ";
        }
        addBtn.onclick = null;
    } else {
        addBtn.disabled = false;
        addBtn.className = "btn-add-cart-primary";
        addBtn.textContent = "Thêm vào giỏ hàng";
        addBtn.onclick = function () {
            const fresh = getProducts().find(p => p.id === product.id);
            if (!fresh || fresh.stock <= 0 || getDaysUntilExpiry(fresh.expiryDate) < 0) {
                showToast("Sản phẩm không còn khả dụng!", "error");
                closeQuickView();
                renderProducts();
                return;
            }
            product.stock = fresh.stock;
            let cart = getCart();
            const existing = cart.find(it => it.id === product.id);
            const currentQty = existing ? parseSafeQty(existing.quantity, 0) : 0;

            if (Math.round((currentQty + activeModalWeight) * 10) / 10 > product.stock) {
                showToast(`Kho chỉ còn ${formatQuantity(product.stock, product.unit)} ${product.unit}!`, "error");
                return;
            }

            if (existing) {
                existing.quantity = Math.round((currentQty + activeModalWeight) * 10) / 10;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    unit: product.unit,
                    image: product.image,
                    quantity: activeModalWeight
                });
            }

            saveCart(cart);
            closeQuickView();
            showToast(`Đã thêm ${formatQuantity(activeModalWeight, product.unit)} ${product.unit} "${product.name}" vào giỏ hàng`);
            openCartDrawer();
        };
    }

    document.getElementById("quickViewModal").style.display = "flex";
}

function closeQuickView() {
    const modal = document.getElementById("quickViewModal");
    if (modal) modal.style.display = "none";
}

function closeQuickViewOnBackdrop(e) {
    if (e.target.id === "quickViewModal") {
        closeQuickView();
    }
}

function clampModalWeight(val) {
    if (val > activeModalMax) {
        showToast(`Chỉ có thể thêm tối đa ${formatQuantity(activeModalMax, activeModalProduct.unit)} ${activeModalProduct.unit} (kho còn ${formatQuantity(activeModalProduct.stock, activeModalProduct.unit)}, đã có trong giỏ phần còn lại)!`, "error");
        return activeModalMax;
    }
    return val;
}

function selectWeight(weight, btnEl) {
    if (!activeModalProduct) return;
    if (typeof weight === "string") {
        weight = weight.replace(",", ".");
    }
    const requested = parseFloat(weight);

    activeModalWeight = clampModalWeight(requested);

    if (btnEl && btnEl.parentElement) {
        btnEl.parentElement.querySelectorAll(".weight-chip").forEach(ch => ch.classList.remove("active"));
        btnEl.classList.add("active");
    }

    const customInput = document.getElementById("modalCustomWeightInput");
    if (customInput) {
        customInput.value = formatQuantity(activeModalWeight, activeModalProduct.unit);
    }

    updateModalCalcTotal();
}

function stepModalWeight(delta) {
    if (!activeModalProduct) return;
    const isKg = activeModalProduct.unit === "kg";
    const step = isKg ? 0.5 : 1.0;
    const actualDelta = delta > 0 ? step : -step;
    let nextVal = activeModalWeight + actualDelta;

    if (isKg) {
        nextVal = Math.round(nextVal * 10) / 10;
        if (nextVal < 0.5) nextVal = 0.5;
    } else {
        nextVal = Math.round(nextVal);
        if (nextVal < 1) nextVal = 1;
    }

    activeModalWeight = clampModalWeight(nextVal);

    const chipsContainer = document.getElementById("weightChips");
    if (chipsContainer) {
        chipsContainer.querySelectorAll(".weight-chip").forEach(ch => {
            const val = parseFloat(ch.textContent);
            if (Math.abs(val - activeModalWeight) < 0.05) {
                ch.classList.add("active");
            } else {
                ch.classList.remove("active");
            }
        });
    }

    const customInput = document.getElementById("modalCustomWeightInput");
    if (customInput) {
        customInput.value = formatQuantity(activeModalWeight, activeModalProduct.unit);
    }

    updateModalCalcTotal();
}

function changeModalWeight(val) {
    if (!activeModalProduct) return;
    const isKg = activeModalProduct.unit === "kg";
    const minStep = isKg ? 0.5 : 1;
    if (typeof val === "string") {
        val = val.replace(",", ".");
    }
    let num = parseFloat(val);

    if (isNaN(num) || num < minStep) {
        num = minStep;
    }

    if (isKg) {
        num = Math.round(num * 10) / 10;
    } else {
        num = Math.round(num);
    }

    activeModalWeight = clampModalWeight(num);

    const customInput = document.getElementById("modalCustomWeightInput");
    if (customInput) {
        customInput.value = formatQuantity(activeModalWeight, activeModalProduct.unit);
    }

    const chipsContainer = document.getElementById("weightChips");
    if (chipsContainer) {
        chipsContainer.querySelectorAll(".weight-chip").forEach(ch => {
            const chipVal = parseFloat(ch.textContent);
            if (Math.abs(chipVal - activeModalWeight) < 0.05) {
                ch.classList.add("active");
            } else {
                ch.classList.remove("active");
            }
        });
    }

    updateModalCalcTotal();
}

function updateModalCalcTotal() {
    if (!activeModalProduct) return;
    const total = activeModalProduct.price * activeModalWeight;
    document.getElementById("modalCalcTotal").textContent = formatCurrency(total);
}

function openCartDrawer() {
    try {
        updateMiniCartDrawer();
    } catch (e) {
        console.error("Lỗi khi cập nhật giỏ hàng trượt:", e);
    }
    const bd = document.getElementById("drawerBackdrop");
    const drawer = document.getElementById("cartDrawer");
    if (drawer && bd) {
        bd.style.display = "block";
        drawer.classList.add("open");
    } else {

        window.location.href = "gio-hang.html";
    }
}

function closeCartDrawer() {
    const bd = document.getElementById("drawerBackdrop");
    const drawer = document.getElementById("cartDrawer");
    if (bd) bd.style.display = "none";
    if (drawer) drawer.classList.remove("open");
}

function updateMiniCartDrawer() {
    const listEl = document.getElementById("drawerItemsList");
    const subtotalEl = document.getElementById("drawerSubtotal");
    const freeshipText = document.getElementById("freeshipText");
    const freeshipFill = document.getElementById("freeshipFill");
    if (!listEl) return;

    const cart = getCart();

    if (cart.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; padding: 40px 0; color: var(--text-muted);">
                <div style="font-size: 32px; margin-bottom: 8px;">🛒</div>
                <p>Giỏ hàng của bạn đang trống</p>
            </div>
        `;
        if (subtotalEl) subtotalEl.textContent = "0 đ";
        if (freeshipFill) freeshipFill.style.width = "0%";
        if (freeshipText) freeshipText.innerHTML = `Mua thêm <strong>250.000 đ</strong> để được Miễn Phí Vận Chuyển!`;
        return;
    }

    let subtotal = 0;
    listEl.innerHTML = "";
    const products = getProducts();
    const priceUpdated = syncCartWithProducts(cart, products);

    cart.forEach((item, idx) => {
        const prod = products.find(p => p.id === item.id);
        const qty = parseSafeQty(item.quantity, 1);
        const itemTotal = item.price * qty;
        if (prod) subtotal += itemTotal;
        const isKg = item.unit === "kg";
        const stepDelta = isKg ? 0.5 : 1;

        const row = document.createElement("div");
        row.className = "drawer-item";
        const maxStock = prod ? prod.stock : 0;
        row.innerHTML = `
            <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" class="drawer-item-thumb" onerror="handleImageError(this)">
            <div class="drawer-item-info">
                <div class="drawer-item-name">${escapeHTML(item.name)}</div>
                <div class="drawer-item-price">${formatCurrency(itemTotal)}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${formatCurrency(item.price)} / ${escapeHTML(item.unit)}</div>
                ${!prod ? '<div style="font-size: 11px; color: #dc2626;">Ngừng kinh doanh</div>' : ''}
            </div>
            <div class="drawer-stepper">
                <button type="button" class="drawer-step-btn" onclick="stepCartQty(${idx}, -${stepDelta})">-</button>
                <input type="number" class="drawer-step-input" value="${formatQuantity(qty, item.unit)}" min="${stepDelta}" max="${maxStock}" step="${stepDelta}" onchange="handleDrawerQtyInput(${idx}, this.value)" title="Gõ số lượng hoặc bấm +/-">
                <button type="button" class="drawer-step-btn" onclick="stepCartQty(${idx}, ${stepDelta})">+</button>
            </div>
            <button class="drawer-item-delete" onclick="removeDrawerItem(${idx})" title="Xóa món">&times;</button>
        `;
        listEl.appendChild(row);
    });

    if (priceUpdated) {
        saveCart(cart);
    }

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);

    const threshold = 250000;
    const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
    if (freeshipFill) freeshipFill.style.width = `${pct}%`;

    if (freeshipText) {
        if (subtotal >= threshold) {
            freeshipText.innerHTML = `🎉 <strong>Chúc mừng!</strong> Đơn hàng đã được Miễn Phí Vận Chuyển!`;
        } else {
            const needMore = threshold - subtotal;
            freeshipText.innerHTML = `Mua thêm <strong>${formatCurrency(needMore)}</strong> để được Miễn Phí Vận Chuyển!`;
        }
    }
}

function stepCartQty(index, delta) {
    let cart = getCart();
    if (!cart[index]) return;

    const products = getProducts();
    const prod = products.find(p => p.id === cart[index].id);

    let currentQty = parseSafeQty(cart[index].quantity, 1);
    let newQty = Math.round((currentQty + delta) * 10) / 10;
    const isKg = cart[index].unit === "kg";
    const minQty = isKg ? 0.49 : 0.99;

    if (newQty < minQty) {
        removeDrawerItem(index);
        return;
    }

    if (prod && newQty > prod.stock) {
        const maxQty = prod.unit === "kg" ? prod.stock : Math.floor(prod.stock);
        if (maxQty <= 0) {
            showToast(`"${prod.name}" đã hết hàng, vui lòng xóa khỏi giỏ!`, "error");
            return;
        }
        showToast(`Kho chỉ còn ${formatQuantity(prod.stock, prod.unit)} ${prod.unit}!`, "error");
        newQty = maxQty;
    }

    cart[index].quantity = Math.round(newQty * 10) / 10;
    saveCart(cart);
}

function handleDrawerQtyInput(index, val) {
    let cart = getCart();
    if (!cart[index]) return;

    const products = getProducts();
    const prod = products.find(p => p.id === cart[index].id);
    const isKg = cart[index].unit === "kg";
    const minStep = isKg ? 0.5 : 1;
    if (typeof val === "string") {
        val = val.replace(",", ".");
    }
    let num = parseFloat(val);

    if (isNaN(num) || num <= 0) {
        removeDrawerItem(index);
        return;
    }

    if (isKg) {
        num = Math.max(minStep, Math.round(num * 10) / 10);
    } else {
        num = Math.max(1, Math.round(num));
    }

    if (prod && num > prod.stock) {
        const maxQty = prod.unit === "kg" ? prod.stock : Math.floor(prod.stock);
        if (maxQty <= 0) {
            showToast(`"${prod.name}" đã hết hàng, vui lòng xóa khỏi giỏ!`, "error");
            return;
        }
        showToast(`Kho chỉ còn ${formatQuantity(prod.stock, prod.unit)} ${prod.unit}!`, "error");
        num = maxQty;
    }

    cart[index].quantity = num;
    saveCart(cart);
}

function removeDrawerItem(index) {
    let cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    showToast("Đã xóa hoa quả khỏi giỏ hàng");
}

function copyVoucher(code) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
            showToast(`Đã sao chép mã voucher "${code}". Hãy dán vào ô giảm giá khi thanh toán!`);
        }).catch(() => {
            showToast(`Mã voucher của bạn: ${code}`);
        });
    } else {
        showToast(`Mã voucher của bạn: ${code}`);
    }
}

function clearSearch() {
    const input = document.getElementById("searchInput");
    if (input) {
        input.value = "";
        searchQuery = "";
        const clearBtn = document.getElementById("searchClearBtn");
        if (clearBtn) clearBtn.style.display = "none";
        renderProducts();
    }
}

function resetAllFilters() {
    currentCategory = "all";
    currentPriceFilter = "all";
    currentSort = "default";
    searchQuery = "";

    document.querySelectorAll(".cat-item-btn").forEach(b => b.classList.remove("active"));
    const allCatBtn = document.querySelector(".cat-item-btn[data-category='all']");
    if (allCatBtn) allCatBtn.classList.add("active");

    document.querySelectorAll(".price-pill").forEach(b => b.classList.remove("active"));
    const allPriceBtn = document.querySelector(".price-pill[data-price='all']");
    if (allPriceBtn) allPriceBtn.classList.add("active");

    const sortEl = document.getElementById("sortSelect");
    if (sortEl) sortEl.value = "default";

    clearSearch();
    renderProducts();
}

function openOrderTrackingModal() {
    const modal = document.getElementById("orderTrackingModal");
    if (!modal) return;
    modal.style.display = "flex";
    searchTrackOrders();
}

function closeOrderTrackingModal() {
    const modal = document.getElementById("orderTrackingModal");
    if (modal) modal.style.display = "none";
}

function closeOrderTrackingOnBackdrop(e) {
    if (e.target.id === "orderTrackingModal") {
        closeOrderTrackingModal();
    }
}

function searchTrackOrders() {
    const input = document.getElementById("trackQueryInput");
    const resultBox = document.getElementById("trackResultsBox");
    if (!resultBox) return;

    const query = input ? input.value.trim() : "";

    if (!query) {
        resultBox.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
                <p>Vui lòng nhập Mã đơn hàng hoặc Số điện thoại để tra cứu.</p>
            </div>
        `;
        return;
    }

    const phoneClean = normalizePhone(query);
    const allOrders = getOrders();

    const matched = allOrders.filter(o => {
        const matchId = o.id.toLowerCase() === query.toLowerCase();
        const matchPhone = phoneClean ? normalizePhone(o.phone) === phoneClean : false;
        return matchId || matchPhone;
    });

    resultBox.innerHTML = "";

    if (matched.length === 0) {
        resultBox.innerHTML = `
            <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                <div style="font-size: 32px; margin-bottom: 8px;">🔍</div>
                <p>Không tìm thấy đơn hàng nào phù hợp với từ khóa "${escapeHTML(query)}".</p>
                <span style="font-size: 12px;">Vui lòng kiểm tra lại Mã đơn hàng (ví dụ: DH1001) hoặc Số điện thoại đặt hàng.</span>
            </div>
        `;
        return;
    }

    matched.forEach(ord => {

        let step1 = "step-item done";
        let step2 = "step-item";
        let step3 = "step-item";

        if (ord.status === "Đang giao hàng") {
            step2 = "step-item active";
        } else if (ord.status === "Đã hoàn thành") {
            step2 = "step-item done";
            step3 = "step-item done";
        } else if (ord.status === "Đã hủy") {
            step1 = "step-item error";
            step2 = "step-item";
            step3 = "step-item";
        } else {
            step1 = "step-item active";
        }

        let statusClass = "status-cho-xac-nhan";
        if (ord.status === "Đang giao hàng") statusClass = "status-dang-giao";
        else if (ord.status === "Đã hoàn thành") statusClass = "status-hoan-thanh";
        else if (ord.status === "Đã hủy") statusClass = "status-da-huy";

        const itemsList = ord.items.map(it => `
            <div style="display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; border-bottom: 1px dashed var(--border);">
                <span>${escapeHTML(it.name)} <strong>x ${formatQuantity(it.quantity, it.unit || 'kg')} ${escapeHTML(it.unit || '')}</strong></span>
                <span>${formatCurrency(it.subtotal || (it.price * parseSafeQty(it.quantity, 1)))}</span>
            </div>
        `).join("");

        const card = document.createElement("div");
        card.className = "track-order-card";
        card.innerHTML = `
            <div class="track-order-header">
                <div>
                    <span style="font-size: 15px; font-weight: 800; color: var(--accent);">${escapeHTML(ord.id)}</span>
                    <span style="font-size: 12px; color: var(--text-muted); margin-left: 8px;">(${escapeHTML(ord.date)})</span>
                </div>
                <span class="track-status-pill ${statusClass}">${escapeHTML(ord.status)}</span>
            </div>
            ${ord.status === "Đã hủy" ? `
                <div style="background: #fee2e2; color: #991b1b; padding: 8px 12px; border-radius: var(--radius-sm); font-size: 12px; margin: 10px 0; font-weight: 600;">
                    ❌ Đơn hàng này đã được nhân viên cửa hàng hủy xử lý.
                </div>
            ` : `
                <div class="order-status-stepper">
                    <div class="${step1}">
                        <div class="step-circle">1</div>
                        <div class="step-text">Chờ xác nhận</div>
                    </div>
                    <div class="step-line"></div>
                    <div class="${step2}">
                        <div class="step-circle">2</div>
                        <div class="step-text">Đang giao hàng</div>
                    </div>
                    <div class="step-line"></div>
                    <div class="${step3}">
                        <div class="step-circle">3</div>
                        <div class="step-text">Đã hoàn thành</div>
                    </div>
                </div>
            `}

            <div style="margin-top: 12px; font-size: 12px; line-height: 1.6; background: #f8fafc; padding: 10px 12px; border-radius: var(--radius-sm);">
                <div><strong>Người nhận:</strong> ${escapeHTML(ord.customerName)} - <strong>SĐT:</strong> ${escapeHTML(ord.phone)}</div>
                <div><strong>Địa chỉ:</strong> ${escapeHTML(ord.address)}</div>
                <div><strong>Hẹn giờ:</strong> ${escapeHTML(ord.deliverySlot)} | <strong>Thanh toán:</strong> ${escapeHTML(ord.paymentMethod)}</div>
            </div>

            <div style="margin-top: 10px;">
                <div style="font-size: 12px; font-weight: 700; color: var(--text-heading); margin-bottom: 4px;">Danh sách hoa quả:</div>
                ${itemsList}
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--border);">
                <div>
                    <span style="font-size: 12px; color: var(--text-muted);">Tổng thanh toán:</span>
                    <strong style="font-size: 16px; color: var(--accent); margin-left: 6px;">${formatCurrency(ord.total)}</strong>
                </div>
                <button type="button" class="btn-quickview" onclick="printOrderInvoice(${jsArg(ord.id)})" style="display: flex; align-items: center; gap: 4px; padding: 5px 10px; font-size: 12px;">
                    🖨️ In hóa đơn
                </button>
            </div>
        `;
        resultBox.appendChild(card);
    });
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        renderProducts,
        quickAddToCart,
        openQuickView,
        closeQuickView,
        closeQuickViewOnBackdrop,
        selectWeight,
        stepModalWeight,
        changeModalWeight,
        getActiveModalWeight: () => activeModalWeight,
        updateMiniCartDrawer,
        stepCartQty,
        handleDrawerQtyInput,
        openOrderTrackingModal,
        closeOrderTrackingModal,
        closeOrderTrackingOnBackdrop,
        searchTrackOrders
    };
}
