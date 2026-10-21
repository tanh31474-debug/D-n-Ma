document.addEventListener("DOMContentLoaded", function () {
    renderCartPage();

    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", handleCheckoutSubmit);
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            const successModal = document.getElementById("orderSuccessModal");
            if (successModal) successModal.style.display = "none";
            const trackingModal = document.getElementById("orderTrackingModal");
            if (trackingModal) trackingModal.style.display = "none";
        }
    });
});

function renderCartPage() {
    const emptyBox = document.getElementById("emptyCartBox");
    const layout = document.getElementById("cartPageLayout");
    const tableBody = document.getElementById("cartTableBody");
    const fsText = document.getElementById("cartPageFreeshipText");
    const fsFill = document.getElementById("cartPageFreeshipFill");

    if (!tableBody) return;

    const cart = getCart();

    if (cart.length === 0) {
        if (emptyBox) {
            emptyBox.style.display = "block";
            showFileProtocolHint(emptyBox);
        }
        if (layout) layout.style.display = "none";
        updateCartBadge();
        return;
    }

    if (emptyBox) emptyBox.style.display = "none";
    if (layout) layout.style.display = "grid";

    tableBody.innerHTML = "";
    let subtotal = 0;
    const products = getProducts();
    const cartChanged = syncCartWithProducts(cart, products);

    cart.forEach((item, idx) => {
        const prod = products.find(p => p.id === item.id);
        const qty = parseSafeQty(item.quantity, 1);
        const lineTotal = item.price * qty;
        if (prod) subtotal += lineTotal; // SP đã bị xóa khỏi kho không tính tiền
        const isExpired = prod && getDaysUntilExpiry(prod.expiryDate) < 0;
        const isKg = item.unit === "kg";
        const stepDelta = isKg ? 0.5 : 1;
        const isExceedStock = prod && qty > prod.stock;

        const isDiscontinued = !prod;
        const maxStock = prod ? prod.stock : 0;

        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid var(--border)";
        row.innerHTML = `
            <td style="padding: 12px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" style="width: 48px; height: 48px; border-radius: var(--radius-sm); object-fit: cover; border: 1px solid var(--border);" onerror="handleImageError(this)">
                    <div>
                        <strong style="color: var(--text-heading); font-size: 14px;">${escapeHTML(item.name)}</strong>
                        <div style="font-size: 11px; color: var(--text-muted);">
                            Đơn vị: ${escapeHTML(item.unit)} ${prod ? `• (Kho còn: ${formatQuantity(prod.stock, prod.unit)})` : '<span style="color: #dc2626; font-weight: 600;">• Ngừng kinh doanh</span>'}
                        </div>
                        ${isExceedStock ? `<div style="font-size: 11px; color: #dc2626; font-weight: 600;">⚠️ Số lượng vượt quá tồn kho hiện tại!</div>` : ''}
                        ${isExpired ? `<div style="font-size: 11px; color: #dc2626; font-weight: 600;">⚠️ Sản phẩm đã hết hạn sử dụng, vui lòng bỏ khỏi giỏ!</div>` : ''}
                        ${isDiscontinued ? `<div style="font-size: 11px; color: #dc2626; font-weight: 600;">⚠️ Sản phẩm đã bị xóa khỏi kho, vui lòng bỏ chọn!</div>` : ''}
                    </div>
                </div>
            </td>
            <td style="padding: 12px; font-weight: 500;">
                ${formatCurrency(item.price)}
            </td>
            <td style="padding: 12px;">
                <div class="drawer-stepper" style="width: 120px;">
                    <button type="button" class="drawer-step-btn" onclick="stepPageCartQty(${idx}, -${stepDelta})">-</button>
                    <input type="number" class="drawer-step-input" value="${formatQuantity(qty, item.unit)}" min="${stepDelta}" max="${maxStock}" step="${stepDelta}" onchange="handlePageCartQtyInput(${idx}, this.value)" style="width: 54px; text-align: center;" title="Nhập số lượng trực tiếp hoặc bấm +/-">
                    <button type="button" class="drawer-step-btn" onclick="stepPageCartQty(${idx}, ${stepDelta})">+</button>
                </div>
            </td>
            <td style="padding: 12px; font-weight: 700; color: var(--accent);">
                ${formatCurrency(lineTotal)}
            </td>
            <td style="padding: 12px; text-align: right;">
                <button type="button" onclick="removePageCartItem(${idx})" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer;" title="Xóa món">&times;</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    if (cartChanged) {
        saveCart(cart);
    }

    const threshold = 250000;
    const fsPct = Math.min(100, Math.round((subtotal / threshold) * 100));
    if (fsFill) fsFill.style.width = `${fsPct}%`;

    if (fsText) {
        if (subtotal >= threshold) {
            fsText.innerHTML = `🎉 <strong>Tuyệt vời!</strong> Đơn hàng của bạn đã đạt điều kiện Miễn Phí Vận Chuyển!`;
        } else {
            const needMore = threshold - subtotal;
            fsText.innerHTML = `Mua thêm <strong>${formatCurrency(needMore)}</strong> để được Miễn Phí Giao Hàng hỏa tốc!`;
        }
    }

    calculateTotals(subtotal);
    updateCartBadge();
}

function calculateTotals(subtotal) {
    if (typeof subtotal === "undefined") {
        subtotal = getCartSubtotal();
    }
    const voucher = getAppliedVoucher();
    let discount = 0;
    let shipping = subtotal >= 250000 ? 0 : 25000;
    let voucherValid = false;

    if (voucher) {
        if (voucher.discountPercent) {
            if (subtotal >= (voucher.minOrder || 0)) {
                discount = Math.min(voucher.maxDiscount || Infinity, Math.round(subtotal * (voucher.discountPercent / 100)));
                voucherValid = true;
            }
        }
        if (voucher.freeShipping) {
            if (subtotal >= (voucher.minOrder || 0)) {
                shipping = 0;
                voucherValid = true;
            }
        }
    }

    const grandTotal = Math.max(0, subtotal - discount + shipping);

    const subtotalEl = document.getElementById("summarySubtotal");
    const discountEl = document.getElementById("summaryDiscount");
    const shippingEl = document.getElementById("summaryShipping");
    const grandTotalEl = document.getElementById("summaryGrandTotal");

    if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
    if (discountEl) discountEl.textContent = discount > 0 ? `-${formatCurrency(discount)}` : "0 đ";
    if (shippingEl) shippingEl.textContent = shipping === 0 ? "Miễn phí" : formatCurrency(shipping);
    if (grandTotalEl) grandTotalEl.textContent = formatCurrency(grandTotal);

    const noticeWrap = document.getElementById("appliedVoucherNotice");
    const noticeText = document.getElementById("voucherNoticeText");
    if (voucher && noticeWrap && noticeText) {
        noticeWrap.style.display = "flex";
        if (voucherValid) {
            noticeWrap.style.background = "#ecfdf5";
            noticeWrap.style.borderColor = "#a7f3d0";
            noticeWrap.style.color = "#065f46";
            noticeText.innerHTML = `✓ Đang áp dụng <strong>${escapeHTML(voucher.code)}</strong> (${escapeHTML(voucher.description)})`;
        } else {
            noticeWrap.style.background = "#fffbeb";
            noticeWrap.style.borderColor = "#fde68a";
            noticeWrap.style.color = "#92400e";
            const need = (voucher.minOrder || 0) - subtotal;
            noticeText.innerHTML = `⚠️ Mã <strong>${escapeHTML(voucher.code)}</strong> cần mua thêm <strong>${formatCurrency(need)}</strong> để kích hoạt ưu đãi`;
        }
    } else if (noticeWrap) {
        noticeWrap.style.display = "none";
    }

    return {
        subtotal,
        discount,
        shipping,
        grandTotal,
        voucherValid
    };
}

function stepPageCartQty(idx, delta) {
    let cart = getCart();
    if (!cart[idx]) return;

    const products = getProducts();
    const prod = products.find(p => p.id === cart[idx].id);

    let currentQty = parseSafeQty(cart[idx].quantity, 1);
    let newQty = Math.round((currentQty + delta) * 10) / 10;
    const isKg = cart[idx].unit === "kg";
    const minQty = isKg ? 0.49 : 0.99;

    if (newQty < minQty) {
        removePageCartItem(idx);
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

    cart[idx].quantity = Math.round(newQty * 10) / 10;
    saveCart(cart);
    renderCartPage();
}

function handlePageCartQtyInput(idx, val) {
    let cart = getCart();
    if (!cart[idx]) return;

    const products = getProducts();
    const prod = products.find(p => p.id === cart[idx].id);
    const isKg = cart[idx].unit === "kg";
    const minStep = isKg ? 0.5 : 1;
    if (typeof val === "string") {
        val = val.replace(",", ".");
    }
    let num = parseFloat(val);

    if (isNaN(num) || num <= 0) {
        removePageCartItem(idx);
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

    cart[idx].quantity = num;
    saveCart(cart);
    renderCartPage();
}

function removePageCartItem(idx) {
    if (confirm("Xác nhận bỏ loại hoa quả này khỏi đơn hàng?")) {
        let cart = getCart();
        cart.splice(idx, 1);
        saveCart(cart);
        renderCartPage();
        showToast("Đã xóa sản phẩm khỏi giỏ");
    }
}

function clearAllCart() {
    if (confirm("Bạn có chắc chắn muốn làm trống toàn bộ giỏ hàng không?")) {
        saveCart([]);
        setAppliedVoucher(null);
        renderCartPage();
        showToast("Đã làm trống giỏ hàng");
    }
}

function applyVoucherAction() {
    const input = document.getElementById("voucherInput");
    if (!input) return;
    const code = input.value.trim().toUpperCase();
    if (!code) {
        showToast("Vui lòng nhập mã giảm giá", "error");
        return;
    }

    const allVouchers = (typeof validVouchers !== "undefined" ? validVouchers : (typeof window !== "undefined" ? window.validVouchers : null)) || {};
    if (allVouchers[code]) {
        const v = allVouchers[code];
        const subtotal = getCartSubtotal();

        if (subtotal < v.minOrder) {
            showToast(`Mã ${code} yêu cầu đơn hàng tối thiểu ${formatCurrency(v.minOrder)} (Hiện tại: ${formatCurrency(subtotal)})`, "error");
            return;
        }

        setAppliedVoucher(v);
        showToast(`Áp dụng thành công mã ưu đãi "${code}"!`);
        input.value = "";
        renderCartPage();
    } else {
        showToast(`Mã giảm giá "${code}" không hợp lệ hoặc đã hết hạn!`, "error");
    }
}

function quickApplyVoucher(code) {
    const input = document.getElementById("voucherInput");
    if (input) input.value = code;
    applyVoucherAction();
}

function removeVoucherAction() {
    setAppliedVoucher(null);
    showToast("Đã hủy áp dụng mã giảm giá");
    renderCartPage();
}

function handleCheckoutSubmit(e) {
    e.preventDefault();

    const cart = getCart();
    if (cart.length === 0) {
        showToast("Giỏ hàng của bạn đang trống!", "error");
        return;
    }

    const name = document.getElementById("custName").value.trim();
    const phone = document.getElementById("custPhone").value.trim();
    const address = document.getElementById("custAddress").value.trim();
    const slot = document.getElementById("deliverySlot").value;

    const payMethodEl = document.querySelector('input[name="payMethod"]:checked');
    const payMethod = payMethodEl ? payMethodEl.value : "COD";

    if (!name || name.length < 2) {
        showToast("Vui lòng điền họ và tên người nhận hợp lệ!", "error");
        document.getElementById("custName").focus();
        return;
    }

    const phoneClean = normalizePhone(phone);
    const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
    if (!phoneRegex.test(phoneClean)) {
        showToast("Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 số (ví dụ: 0901234567 hoặc +84901234567)", "error");
        document.getElementById("custPhone").focus();
        return;
    }

    if (!address || address.length < 6) {
        showToast("Vui lòng nhập địa chỉ nhận hàng chi tiết (số nhà, tên đường...)!", "error");
        document.getElementById("custAddress").focus();
        return;
    }

    let products = getProducts();
    syncCartWithProducts(cart, products);

    const aggregatedDemand = {};
    for (const item of cart) {
        const prod = products.find(p => p.id === item.id);
        if (!prod) {
            showToast(`Sản phẩm "${item.name}" hiện không còn trong kho. Vui lòng bỏ khỏi giỏ hàng!`, "error");
            renderCartPage();
            return;
        }
        if (getDaysUntilExpiry(prod.expiryDate) < 0) {
            showToast(`Sản phẩm "${prod.name}" đã hết hạn sử dụng. Vui lòng bỏ khỏi giỏ hàng!`, "error");
            renderCartPage();
            return;
        }
        const buyQty = parseSafeQty(item.quantity, 1);
        aggregatedDemand[item.id] = (aggregatedDemand[item.id] || 0) + buyQty;
    }

    for (const [id, reqQty] of Object.entries(aggregatedDemand)) {
        const prod = products.find(p => p.id === id);
        if (prod && prod.stock < reqQty) {
            showToast(`Sản phẩm "${prod.name}" trong kho chỉ còn ${formatQuantity(prod.stock, prod.unit)} ${prod.unit}, không đủ đáp ứng tổng số lượng ${formatQuantity(reqQty, prod.unit)} ${prod.unit} trong đơn hàng!`, "error");
            renderCartPage();
            return;
        }
    }

    for (const [id, reqQty] of Object.entries(aggregatedDemand)) {
        const prod = products.find(p => p.id === id);
        if (prod) {
            prod.stock = Math.max(0, Math.round((prod.stock - reqQty) * 10) / 10);
        }
    }
    saveProducts(products);

    const subtotal = cart.reduce((sum, it) => sum + (it.price * parseSafeQty(it.quantity, 1)), 0);
    const voucher = getAppliedVoucher();
    let discount = 0;
    let shipping = subtotal >= 250000 ? 0 : 25000;

    if (voucher) {
        if (voucher.discountPercent && subtotal >= (voucher.minOrder || 0)) {
            discount = Math.min(voucher.maxDiscount || Infinity, Math.round(subtotal * (voucher.discountPercent / 100)));
        }
        if (voucher.freeShipping && subtotal >= (voucher.minOrder || 0)) {
            shipping = 0;
        }
    }

    const grandTotal = Math.max(0, subtotal - discount + shipping);

    let orders = getOrders();
    let orderId = "DH" + Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 90);
    while (orders.some(o => o.id === orderId)) {
        orderId = "DH" + Date.now().toString().slice(-4) + Math.floor(10 + Math.random() * 90);
    }

    const newOrder = {
        id: orderId,
        customerName: name,
        phone: phoneClean,
        address: address,
        deliverySlot: slot,
        paymentMethod: payMethod,
        date: new Date().toLocaleString("vi-VN"),
        items: cart.map(it => {
            const q = parseSafeQty(it.quantity, 1);
            return {
                id: it.id,
                name: it.name,
                quantity: q,
                price: it.price,
                unit: it.unit || "kg",
                subtotal: it.price * q
            };
        }),
        subtotal: subtotal,
        discount: discount,
        shipping: shipping,
        total: grandTotal,
        status: "Chờ xác nhận"
    };

    orders.unshift(newOrder);
    saveOrders(orders);

    saveCart([]);
    setAppliedVoucher(null);

    const checkoutForm = document.getElementById("checkoutForm");
    if (checkoutForm && typeof checkoutForm.reset === "function") {
        checkoutForm.reset();
    }
    renderCartPage();

    document.getElementById("successOrderId").textContent = newOrder.id;
    document.getElementById("successCustName").textContent = newOrder.customerName;
    document.getElementById("successPhone").textContent = newOrder.phone;
    document.getElementById("successAddress").textContent = newOrder.address;
    document.getElementById("successSlot").textContent = newOrder.deliverySlot;
    document.getElementById("successPayMethod").textContent = newOrder.paymentMethod;
    document.getElementById("successTotal").textContent = formatCurrency(newOrder.total);

    const qrSec = document.getElementById("vietQrSection");
    if (!qrSec) {
        // trang không có khung QR (ví dụ gio-hang.html cũ): bỏ qua, vẫn hiện thông báo thành công
    } else if (payMethod === "Chuyển khoản QR") {
        qrSec.style.display = "block";
        const memo = `THANH TOAN ${newOrder.id}`; // chỉ mã đơn, không gửi SĐT khách ra dịch vụ bên ngoài
        document.getElementById("vietQrMemo").textContent = memo;
        const qrImg = document.getElementById("vietQrImage");
        const fallbackText = document.getElementById("vietQrFallbackText");
        if (fallbackText) fallbackText.style.display = "none";
        if (qrImg) {
            qrImg.style.display = "block";
            qrImg.src = `https://img.vietqr.io/image/970422-9999999999-compact2.png?amount=${newOrder.total}&addInfo=${encodeURIComponent(memo)}&accountName=CUAHANG%20HOAQUA`;
        }
    } else {
        qrSec.style.display = "none";
    }

    const printBtn = document.getElementById("btnSuccessPrint");
    if (printBtn) {
        printBtn.onclick = function () {
            printOrderInvoice(newOrder.id);
        };
    }

    document.getElementById("orderSuccessModal").style.display = "flex";
}

// Tạm tính chỉ gồm sản phẩm còn tồn tại trong kho
function getCartSubtotal() {
    const products = getProducts();
    return getCart()
        .filter(it => products.some(p => p.id === it.id))
        .reduce((sum, it) => sum + it.price * parseSafeQty(it.quantity, 1), 0);
}

// Mở file trực tiếp (file://) thì nhiều trình duyệt tách localStorage theo từng file
// -> giỏ hàng thêm ở index.html sẽ không thấy ở gio-hang.html
function showFileProtocolHint(box) {
    if (location.protocol !== "file:" || document.getElementById("fileProtocolHint")) return;
    const hint = document.createElement("p");
    hint.id = "fileProtocolHint";
    hint.style.cssText = "margin-top:16px;font-size:12px;color:#b45309;";
    hint.textContent = "Nếu bạn vừa thêm hàng mà giỏ vẫn trống: trình duyệt (Firefox/Zen) đang tách dữ liệu giữa các trang khi mở file trực tiếp. Hãy đóng trang này và nhấp đúp file MO_WEB.bat trong thư mục dự án, hoặc mở index.html bằng Chrome/Edge.";
    box.appendChild(hint);
}

function closeOrderSuccessModal() {
    const modal = document.getElementById("orderSuccessModal");
    if (modal) modal.style.display = "none";
}

function closeOrderSuccessOnBackdrop(e) {
    if (e.target.id === "orderSuccessModal") {
        closeOrderSuccessModal();
    }
}

if (typeof window !== "undefined") {
    window.closeOrderSuccessModal = closeOrderSuccessModal;
    window.closeOrderSuccessOnBackdrop = closeOrderSuccessOnBackdrop;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        renderCartPage,
        calculateTotals,
        stepPageCartQty,
        handlePageCartQtyInput,
        removePageCartItem,
        clearAllCart,
        applyVoucherAction,
        quickApplyVoucher,
        removeVoucherAction,
        handleCheckoutSubmit,
        closeOrderSuccessModal,
        closeOrderSuccessOnBackdrop
    };
}
