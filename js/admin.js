let currentOrderFilter = "all";
let adminOrderSearchQuery = "";

document.addEventListener("DOMContentLoaded", function () {
    initAdminTabs();
    refreshAdminDashboard();

    const addForm = document.getElementById("addProductForm");
    if (addForm) {
        addForm.addEventListener("submit", handleAddProductSubmit);
    }

    const editForm = document.getElementById("editProductForm");
    if (editForm) {
        editForm.addEventListener("submit", handleEditProductSubmit);
    }

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
            closeAddProductModal();
            closeEditProductModal();
            closeOrderDetailModal();
        }
    });
});

function initAdminTabs() {
    const tabButtons = document.querySelectorAll(".tab-nav-btn");
    const tabPanels = document.querySelectorAll(".admin-tab-panel");

    tabButtons.forEach(btn => {
        btn.addEventListener("click", function () {
            tabButtons.forEach(b => b.classList.remove("active"));
            tabPanels.forEach(p => p.style.display = "none");

            this.classList.add("active");
            const targetId = this.getAttribute("data-tab");
            const panel = document.getElementById(targetId);
            if (panel) {
                panel.style.display = "block";
            }
        });
    });
}

function refreshAdminDashboard() {
    updateAdminMetrics();
    renderInventoryTable();
    renderFefoTable();
    renderOrdersTable();
}

function updateAdminMetrics() {
    const products = getProducts();
    const orders = getOrders();

    const completedRev = orders
        .filter(o => o.status === "Đã hoàn thành")
        .reduce((sum, ord) => sum + (ord.total || 0), 0);

    const pendingOrders = orders.filter(o => o.status === "Chờ xác nhận").length;
    const nearExpiryCount = products.filter(p => {
        const d = getDaysUntilExpiry(p.expiryDate);
        return p.stock > 0 && d >= 0 && d <= 3;
    }).length;

    const elRev = document.getElementById("metricRevenue");
    const elOrders = document.getElementById("metricOrders");
    const elPending = document.getElementById("metricPendingOrders");
    const elProducts = document.getElementById("metricProducts");
    const elNear = document.getElementById("metricNearExpiry");

    if (elRev) elRev.textContent = formatCurrency(completedRev);
    if (elOrders) elOrders.textContent = orders.length;
    if (elPending) elPending.textContent = `${pendingOrders} đơn đang chờ xác nhận`;
    if (elProducts) elProducts.textContent = products.length;
    if (elNear) elNear.textContent = nearExpiryCount;
}

function renderInventoryTable(filterKeyword = "") {
    const tbody = document.getElementById("adminProductTable");
    if (!tbody) return;

    let products = getProducts();

    if (filterKeyword) {
        const qNorm = removeVietnameseTones(filterKeyword);
        products = products.filter(p =>
            removeVietnameseTones(p.name).includes(qNorm) ||
            (p.id && p.id.toLowerCase().includes(qNorm)) ||
            removeVietnameseTones(p.origin).includes(qNorm)
        );
    }

    tbody.innerHTML = "";

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">Không tìm thấy hoa quả nào trong kho</td></tr>`;
        return;
    }

    products.forEach(p => {
        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid var(--border)";

        const catName = p.category === "noi-dia" ? "Việt Nam" : (p.category === "nhap-khau" ? "Nhập khẩu" : "Giỏ quà");
        const isOutOfStock = p.stock <= 0;

        row.innerHTML = `
            <td style="padding: 10px 12px;"><code style="font-weight: 700; color: #0369a1;">${escapeHTML(p.id)}</code></td>
            <td style="padding: 10px 12px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" style="width: 38px; height: 38px; border-radius: 4px; object-fit: cover; border: 1px solid var(--border);" onerror="handleImageError(this)">
                    <div>
                        <strong style="color: var(--text-heading); font-size: 13px;">${escapeHTML(p.name)}</strong>
                        <div style="font-size: 11px; color: var(--text-muted);">${escapeHTML(p.standard || "VietGAP")} • Brix ${p.brix || 12}°</div>
                    </div>
                </div>
            </td>
            <td style="padding: 10px 12px;"><span class="origin-badge">${escapeHTML(catName)}</span></td>
            <td style="padding: 10px 12px;">${escapeHTML(p.origin)}</td>
            <td style="padding: 10px 12px; font-weight: 700; color: var(--accent);">
                ${formatCurrency(p.price)} / ${escapeHTML(p.unit)}
                ${p.originalPrice ? `<div style="font-size: 10px; color: #94a3b8; text-decoration: line-through;">${formatCurrency(p.originalPrice)}</div>` : ''}
            </td>
            <td style="padding: 10px 12px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <span style="font-weight: 700; ${isOutOfStock ? 'color: #dc2626;' : ''}">
                        ${formatQuantity(p.stock, p.unit)} ${escapeHTML(p.unit)}
                    </span>
                    <button type="button" onclick="quickAdjustStock(${jsArg(p.id)}, -5)" title="Giảm 5" style="border: 1px solid var(--border); background: #f8fafc; border-radius: 3px; padding: 1px 5px; cursor: pointer; font-size: 10px;">-5</button>
                    <button type="button" onclick="quickAdjustStock(${jsArg(p.id)}, 5)" title="Nhập thêm 5" style="border: 1px solid var(--border); background: #f8fafc; border-radius: 3px; padding: 1px 5px; cursor: pointer; font-size: 10px;">+5</button>
                </div>
            </td>
            <td style="padding: 10px 12px; font-size: 12px;">${escapeHTML(p.expiryDate)}</td>
            <td style="padding: 10px 12px; text-align: right; white-space: nowrap;">
                <button type="button" onclick="openEditProductModal(${jsArg(p.id)})" style="background: none; border: 1px solid #bae6fd; color: #0284c7; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-right: 4px;">
                    ✏️ Sửa
                </button>
                <button type="button" onclick="deleteProductAction(${jsArg(p.id)})" style="background: none; border: 1px solid #fecaca; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                    🗑️ Xóa
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterAdminProducts() {
    const input = document.getElementById("adminSearchInput");
    const q = input ? input.value.trim() : "";
    renderInventoryTable(q);
}

function quickAdjustStock(id, delta) {
    let products = getProducts();
    const p = products.find(prod => prod.id === id);
    if (!p) return;

    p.stock = Math.max(0, Math.round((p.stock + delta) * 10) / 10);
    saveProducts(products);
    showToast(`Đã cập nhật tồn kho [${p.name}]: ${formatQuantity(p.stock, p.unit)} ${p.unit}`);
    refreshAdminDashboard();
}

function renderFefoTable() {
    const tbody = document.getElementById("adminFefoTable");
    if (!tbody) return;

    let products = getProducts();

    products.sort((a, b) => getDaysUntilExpiry(a.expiryDate) - getDaysUntilExpiry(b.expiryDate));

    tbody.innerHTML = "";

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">Không có dữ liệu hoa quả cần theo dõi hạn dùng</td></tr>`;
        return;
    }

    products.forEach(p => {
        const days = getDaysUntilExpiry(p.expiryDate);
        let badgeHtml = "";
        let actionBtn = "";
        const isDiscounted = p.badge && p.badge.includes("Xả cận date");

        if (p.stock <= 0) {
            badgeHtml = `<span style="background: #f1f5f9; color: #64748b; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Hết hàng (Tồn 0)</span>`;
            actionBtn = `<span style="font-size: 11px; color: var(--text-muted);">Không khả dụng</span>`;
        } else if (days < 0) {
            badgeHtml = `<span style="background: #fee2e2; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">Đã quá hạn (${Math.abs(days)} ngày) — Cần xuất hủy</span>`;
            actionBtn = `<button type="button" onclick="quickFefoScrap(${jsArg(p.id)})" style="background: #fee2e2; border: 1px solid #ef4444; color: #991b1b; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600;">Xuất hủy kho</button>`;
        } else if (days <= 3) {
            badgeHtml = `<span style="background: #fef3c7; color: #92400e; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">Cận date (còn ${days} ngày) — Ưu tiên giảm giá xả hàng</span>`;
            if (isDiscounted) {
                actionBtn = `<button type="button" onclick="quickFefoDiscount(${jsArg(p.id)})" style="background: #ecfdf5; border: 1px solid #10b981; color: #047857; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 700;">✓ Đã giảm 20% (Hoàn giá)</button>`;
            } else {
                actionBtn = `<button type="button" onclick="quickFefoDiscount(${jsArg(p.id)})" style="background: #fef3c7; border: 1px solid #f59e0b; color: #92400e; padding: 3px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 700;">⚡ Giảm 20% xả hàng</button>`;
            }
        } else {
            badgeHtml = `<span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">Còn tươi (${days} ngày)</span>`;
            actionBtn = `<span style="font-size: 11px; color: var(--text-muted);">Ổn định</span>`;
        }

        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid var(--border)";
        row.innerHTML = `
            <td style="padding: 10px 12px;"><code style="font-weight: 700;">${escapeHTML(p.id)}</code></td>
            <td style="padding: 10px 12px;"><strong>${escapeHTML(p.name)}</strong></td>
            <td style="padding: 10px 12px; font-weight: 600;">${formatQuantity(p.stock, p.unit)} ${escapeHTML(p.unit)}</td>
            <td style="padding: 10px 12px;">${escapeHTML(p.expiryDate)}</td>
            <td style="padding: 10px 12px;"><strong>${days} ngày</strong></td>
            <td style="padding: 10px 12px;">${badgeHtml}</td>
            <td style="padding: 10px 12px; text-align: right;">${actionBtn}</td>
        `;
        tbody.appendChild(row);
    });
}

function quickFefoDiscount(productId) {
    let products = getProducts();
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    if (p.badge && p.badge.includes("Xả cận date")) {
        if (p.preFefoPrice === undefined) {
            showToast(`Không có giá gốc đã lưu cho "${p.name}". Hãy sửa giá thủ công trong mục Sửa.`, "error");
            return;
        }
        const restorePrice = p.preFefoPrice;
        if (confirm(`Sản phẩm "${p.name}" hiện đang giảm giá 20%. Bạn có muốn khôi phục về giá ban đầu (${formatCurrency(restorePrice)}) không?`)) {
            p.price = restorePrice;
            p.originalPrice = p.preFefoOriginalPrice !== undefined ? p.preFefoOriginalPrice : null;
            p.badge = p.preFefoBadge || "";
            delete p.preFefoPrice;
            delete p.preFefoOriginalPrice;
            delete p.preFefoBadge;
            saveProducts(products);
            showToast(`Đã khôi phục giá ban đầu cho "${p.name}"!`);
            refreshAdminDashboard();
        }
        return;
    }

    if (confirm(`Kích hoạt giảm giá 20% cho "${p.name}" để đẩy nhanh tiến độ xả hàng cận date?`)) {
        p.preFefoPrice = p.price;
        p.preFefoOriginalPrice = p.originalPrice;
        p.preFefoBadge = p.badge;
        if (!p.originalPrice || p.originalPrice < p.price) {
            p.originalPrice = p.price;
        }
        p.price = Math.round((p.price * 0.8) / 1000) * 1000;
        p.badge = "Xả cận date -20%";
        saveProducts(products);
        showToast(`Đã áp dụng giảm giá 20% xả hàng cho "${p.name}"!`);
        refreshAdminDashboard();
    }
}

function quickFefoScrap(productId) {
    let products = getProducts();
    const p = products.find(prod => prod.id === productId);
    if (!p) return;

    if (confirm(`Xác nhận xuất hủy ${formatQuantity(p.stock, p.unit)} ${p.unit} [${p.name}] đã quá hạn sử dụng? Tồn kho sẽ chuyển về 0.`)) {
        p.stock = 0;
        p.badge = "Đã xuất hủy";
        saveProducts(products);
        showToast(`Đã xuất hủy tồn kho sản phẩm [${p.name}]!`);
        refreshAdminDashboard();
    }
}

function renderOrdersTable() {
    const tbody = document.getElementById("adminOrderTable");
    if (!tbody) return;

    let orders = getOrders();

    if (currentOrderFilter !== "all") {
        orders = orders.filter(o => o.status === currentOrderFilter);
    }

    if (adminOrderSearchQuery) {
        const qNorm = removeVietnameseTones(adminOrderSearchQuery);
        const phoneClean = normalizePhone(adminOrderSearchQuery);
        orders = orders.filter(o => {
            const matchId = o.id.toLowerCase().includes(adminOrderSearchQuery.toLowerCase());
            const matchPhone = phoneClean ? normalizePhone(o.phone).includes(phoneClean) : false;
            const matchName = removeVietnameseTones(o.customerName).includes(qNorm);
            const matchAddress = removeVietnameseTones(o.address).includes(qNorm);
            const matchItems = o.items.some(it => removeVietnameseTones(it.name).includes(qNorm));
            return matchId || matchPhone || matchName || matchAddress || matchItems;
        });
    }

    tbody.innerHTML = "";

    if (orders.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-muted); padding: 30px;">Không tìm thấy đơn hàng nào phù hợp</td></tr>`;
        return;
    }

    orders.forEach(ord => {
        const itemsText = ord.items.map(it => `${it.name} (${formatQuantity(it.quantity, it.unit || 'kg')} ${it.unit || ''})`).join(", ");

        let statusColor = "#ea580c";
        if (ord.status === "Đang giao hàng") statusColor = "#0284c7";
        if (ord.status === "Đã hoàn thành") statusColor = "#15803d";
        if (ord.status === "Đã hủy") statusColor = "#dc2626";

        const row = document.createElement("tr");
        row.style.borderBottom = "1px solid var(--border)";
        row.innerHTML = `
            <td style="padding: 10px 12px;"><code style="font-weight: 800; color: var(--accent);">${escapeHTML(ord.id)}</code></td>
            <td style="padding: 10px 12px;">
                <strong>${escapeHTML(ord.customerName)}</strong>
            </td>
            <td style="padding: 10px 12px;">${escapeHTML(ord.phone)}</td>
            <td style="padding: 10px 12px; font-size: 12px; max-width: 150px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${escapeHTML(ord.address)}">${escapeHTML(ord.address)}</td>
            <td style="padding: 10px 12px; font-size: 12px; max-width: 180px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;" title="${escapeHTML(itemsText)}">${escapeHTML(itemsText)}</td>
            <td style="padding: 10px 12px; font-weight: 700; color: var(--accent);">${formatCurrency(ord.total)}</td>
            <td style="padding: 10px 12px; font-size: 12px;">${escapeHTML(ord.paymentMethod || "COD")}</td>
            <td style="padding: 10px 12px;">
                <select onchange="updateOrderStatus(${jsArg(ord.id)}, this.value, this)" style="padding: 4px 6px; border: 1px solid var(--border); border-radius: 4px; font-size: 11px; cursor: pointer; color: ${statusColor}; font-weight: 700;">
                    <option value="Chờ xác nhận" ${ord.status === 'Chờ xác nhận' ? 'selected' : ''}>Chờ xác nhận</option>
                    <option value="Đang giao hàng" ${ord.status === 'Đang giao hàng' ? 'selected' : ''}>Đang giao hàng</option>
                    <option value="Đã hoàn thành" ${ord.status === 'Đã hoàn thành' ? 'selected' : ''}>Đã hoàn thành</option>
                    <option value="Đã hủy" ${ord.status === 'Đã hủy' ? 'selected' : ''}>Đã hủy</option>
                </select>
            </td>
            <td style="padding: 10px 12px; text-align: right; white-space: nowrap;">
                <button type="button" onclick="openOrderDetailModal(${jsArg(ord.id)})" title="Xem chi tiết" style="background: none; border: 1px solid #bae6fd; color: #0284c7; padding: 3px 7px; border-radius: 3px; font-size: 11px; cursor: pointer; margin-right: 4px;">
                    👁️ Chi tiết
                </button>
                <button type="button" onclick="printOrderInvoice(${jsArg(ord.id)})" title="In phiếu giao hàng" style="background: none; border: 1px solid #cbd5e1; color: var(--text-body); padding: 3px 7px; border-radius: 3px; font-size: 11px; cursor: pointer;">
                    🖨️ In
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterOrdersByStatus(status, btnEl) {
    currentOrderFilter = status;
    const filterBtns = document.querySelectorAll(".order-filter-pill");
    filterBtns.forEach(b => b.classList.remove("active"));
    if (btnEl) btnEl.classList.add("active");
    renderOrdersTable();
}

function filterAdminOrders() {
    const input = document.getElementById("adminOrderSearchInput");
    adminOrderSearchQuery = input ? input.value.trim() : "";
    renderOrdersTable();
}

function updateOrderStatus(orderId, newStatus, selectEl) {
    let orders = getOrders();
    const ord = orders.find(o => o.id === orderId);
    if (!ord) {
        if (selectEl && selectEl.oldStatus) selectEl.value = selectEl.oldStatus;
        return;
    }

    const oldStatus = ord.status;
    if (newStatus === oldStatus) return;

    // Đơn đã giao xong: hàng đã rời kho, không được hủy (tránh cộng kho ảo, trừ doanh thu)
    if (oldStatus === "Đã hoàn thành" && newStatus === "Đã hủy") {
        showToast(`Đơn ${ord.id} đã giao thành công, không thể hủy!`, "error");
        if (selectEl) selectEl.value = oldStatus;
        return;
    }

    if (newStatus === "Đã hủy") {
        const confirmed = confirm(`Xác nhận hủy đơn hàng ${ord.id}? Số lượng hoa quả sẽ được hoàn lại vào kho.`);
        if (!confirmed) {

            if (selectEl) {
                selectEl.value = oldStatus;
                if (selectEl.dataset) selectEl.dataset.currentStatus = oldStatus;
            }
            renderOrdersTable();
            return;
        }

        if (!ord.stockRestored) {
            let products = getProducts();
            ord.items.forEach(it => {
                const prod = products.find(p => (it.id && p.id === it.id) || p.name === it.name);
                if (prod) {
                    const q = parseSafeQty(it.quantity, 1);
                    prod.stock = Math.round((prod.stock + q) * 10) / 10;
                }
            });
            ord.stockRestored = true;
            saveProducts(products);
            showToast(`Đã hoàn lại số lượng hoa quả của đơn ${ord.id} về kho!`);
        }
    }

    if (oldStatus === "Đã hủy" && newStatus !== "Đã hủy") {
        let products = getProducts();

        const aggregatedDemand = {};
        for (const it of ord.items) {
            const prod = products.find(p => (it.id && p.id === it.id) || p.name === it.name);
            const reqQty = parseSafeQty(it.quantity, 1);
            const targetId = prod ? prod.id : (it.id || it.name);
            aggregatedDemand[targetId] = (aggregatedDemand[targetId] || 0) + reqQty;
        }

        for (const [targetId, reqQty] of Object.entries(aggregatedDemand)) {
            const prod = products.find(p => p.id === targetId || p.name === targetId);
            if (!prod || prod.stock < reqQty) {
                const prodName = prod ? prod.name : targetId;
                showToast(`Không thể phục hồi đơn hàng! Sản phẩm "${prodName}" trong kho không còn đủ hàng (còn ${prod ? formatQuantity(prod.stock, prod.unit) : 0}).`, "error");
                if (selectEl) {
                    selectEl.value = oldStatus;
                    if (selectEl.dataset) selectEl.dataset.currentStatus = oldStatus;
                }
                renderOrdersTable();
                return;
            }
        }

        for (const [targetId, reqQty] of Object.entries(aggregatedDemand)) {
            const prod = products.find(p => p.id === targetId || p.name === targetId);
            if (prod) {
                prod.stock = Math.max(0, Math.round((prod.stock - reqQty) * 10) / 10);
            }
        }
        ord.stockRestored = false;
        saveProducts(products);
        showToast(`Đã trừ lại tồn kho cho đơn ${ord.id} khi phục hồi đơn hàng!`);
    }

    ord.status = newStatus;
    saveOrders(orders);
    showToast(`Đã cập nhật đơn ${ord.id} thành "${newStatus}"`);
    refreshAdminDashboard();
}

function deleteProductAction(id) {
    if (confirm(`Bạn có chắc chắn muốn xóa mã sản phẩm [${id}] khỏi hệ thống kho?`)) {
        let products = getProducts();
        products = products.filter(p => p.id !== id);
        saveProducts(products);
        showToast(`Đã xóa sản phẩm [${id}]`);
        refreshAdminDashboard();
    }
}

function openAddProductModal() {
    const modal = document.getElementById("addProductModal");
    if (modal) modal.style.display = "flex";
}

function closeAddProductModal() {
    const modal = document.getElementById("addProductModal");
    if (modal) modal.style.display = "none";
}

function closeAddProductOnBackdrop(e) {
    if (e.target.id === "addProductModal") closeAddProductModal();
}

// Kiểm tra chung cho form thêm/sửa. Trả về chuỗi lỗi hoặc "" nếu hợp lệ.
function validateProductInput(name, origin, unit, stock) {
    if (!name) return "Tên hoa quả không được để trống!";
    if (!origin) return "Xuất xứ không được để trống!";
    if (unit !== "kg" && !Number.isInteger(stock)) return `Đơn vị "${unit}" chỉ nhận tồn kho là số nguyên!`;
    return "";
}

function handleAddProductSubmit(e) {
    e.preventDefault();

    const name = document.getElementById("addName").value.trim();
    const category = document.getElementById("addCategory").value;
    const priceVal = (document.getElementById("addPrice").value || "").replace(",", ".");
    const price = parseFloat(priceVal);

    if (isNaN(price) || price < 1000) {
        showToast("Giá bán không hợp lệ! Vui lòng nhập tối thiểu 1.000 đ.", "error");
        const el = document.getElementById("addPrice");
        if (el && typeof el.focus === "function") el.focus();
        return;
    }

    const origPriceVal = document.getElementById("addOriginalPrice") ? (document.getElementById("addOriginalPrice").value || "").replace(",", ".") : "";
    let originalPrice = origPriceVal ? parseFloat(origPriceVal) : null;
    if (!(originalPrice > price)) originalPrice = null; // giá gốc phải lớn hơn giá bán mới hiển thị gạch ngang
    const unit = document.getElementById("addUnit").value;
    const origin = document.getElementById("addOrigin").value.trim();
    const standard = document.getElementById("addStandard").value.trim() || "VietGAP";
    const expiryDate = document.getElementById("addExpiryDate").value;
    const stockVal = (document.getElementById("addStock").value || "").replace(",", ".");
    const stock = parseFloat(stockVal);

    if (isNaN(stock) || stock < 0) {
        showToast("Số lượng tồn kho không hợp lệ!", "error");
        const el = document.getElementById("addStock");
        if (el && typeof el.focus === "function") el.focus();
        return;
    }

    const addErr = validateProductInput(name, origin, unit, stock);
    if (addErr) {
        showToast(addErr, "error");
        return;
    }

    const brix = parseFloat(document.getElementById("addBrix").value) || 12.0;
    const image = document.getElementById("addImage").value.trim() || DEFAULT_FRUIT_IMG;
    const desc = document.getElementById("addDesc").value.trim() || "Hoa quả tươi ngon, nguồn gốc rõ ràng, đảm bảo tiêu chuẩn an toàn thực phẩm.";
    const taste = (document.getElementById("addTaste") && document.getElementById("addTaste").value.trim()) || "Thơm ngon tự nhiên";
    const storage = (document.getElementById("addStorage") && document.getElementById("addStorage").value.trim()) || "Bảo quản ngăn mát 3 - 5°C";

    const products = getProducts();

    const maxId = products.reduce((max, p) => {
        const m = (p.id || "").match(/^HQ(\d+)$/i);
        return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    const newId = "HQ" + String(maxId + 1).padStart(2, "0");

    const newProd = {
        id: newId,
        name: name,
        category: category,
        price: price,
        originalPrice: originalPrice,
        unit: unit,
        origin: origin,
        standard: standard,
        expiryDate: expiryDate,
        stock: stock,
        brix: brix,
        rating: 5.0,
        reviewsCount: 1,
        taste: taste,
        storage: storage,
        description: desc,
        image: image,
        badge: "Mới về"
    };

    products.push(newProd);
    saveProducts(products);

    showToast(`Đã thêm mới thành công "${name}" vào kho!`);
    const formEl = document.getElementById("addProductForm");
    if (formEl && typeof formEl.reset === "function") formEl.reset();
    closeAddProductModal();
    refreshAdminDashboard();
}

function openEditProductModal(productId) {
    const products = getProducts();
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    document.getElementById("editId").value = prod.id;
    document.getElementById("editName").value = prod.name;
    document.getElementById("editCategory").value = prod.category;
    document.getElementById("editPrice").value = prod.price;
    document.getElementById("editOriginalPrice").value = prod.originalPrice || "";
    document.getElementById("editUnit").value = prod.unit;
    document.getElementById("editOrigin").value = prod.origin;
    document.getElementById("editStandard").value = prod.standard;
    document.getElementById("editExpiryDate").value = prod.expiryDate;
    document.getElementById("editStock").value = prod.stock;
    document.getElementById("editBrix").value = prod.brix || 12.0;
    document.getElementById("editBadge").value = prod.badge || "";
    document.getElementById("editImage").value = prod.image;
    document.getElementById("editDesc").value = prod.description;

    const editTaste = document.getElementById("editTaste");
    if (editTaste) editTaste.value = prod.taste || "";
    const editStorage = document.getElementById("editStorage");
    if (editStorage) editStorage.value = prod.storage || "";

    document.getElementById("editProductModal").style.display = "flex";
}

function closeEditProductModal() {
    const modal = document.getElementById("editProductModal");
    if (modal) modal.style.display = "none";
}

function closeEditProductOnBackdrop(e) {
    if (e.target.id === "editProductModal") closeEditProductModal();
}

function handleEditProductSubmit(e) {
    e.preventDefault();

    const id = document.getElementById("editId").value;
    let products = getProducts();
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    const priceVal = (document.getElementById("editPrice").value || "").replace(",", ".");
    const price = parseFloat(priceVal);

    if (isNaN(price) || price < 1000) {
        showToast("Giá bán không hợp lệ! Vui lòng nhập tối thiểu 1.000 đ.", "error");
        const el = document.getElementById("editPrice");
        if (el && typeof el.focus === "function") el.focus();
        return;
    }

    const stockVal = (document.getElementById("editStock").value || "").replace(",", ".");
    const stock = parseFloat(stockVal);
    if (isNaN(stock) || stock < 0) {
        showToast("Số lượng tồn kho không hợp lệ!", "error");
        const el = document.getElementById("editStock");
        if (el && typeof el.focus === "function") el.focus();
        return;
    }

    const editName = document.getElementById("editName").value.trim();
    const editOrigin = document.getElementById("editOrigin").value.trim();
    const editUnit = document.getElementById("editUnit").value;
    const editErr = validateProductInput(editName, editOrigin, editUnit, stock);
    if (editErr) {
        showToast(editErr, "error");
        return;
    }

    prod.name = editName;
    prod.category = document.getElementById("editCategory").value;
    prod.price = price;
    const origPrice = parseFloat(document.getElementById("editOriginalPrice").value);
    prod.originalPrice = origPrice > price ? origPrice : null;
    prod.unit = editUnit;
    prod.origin = editOrigin;
    prod.standard = document.getElementById("editStandard").value.trim();
    prod.expiryDate = document.getElementById("editExpiryDate").value;
    prod.stock = stock;
    prod.brix = parseFloat(document.getElementById("editBrix").value) || 12.0;
    prod.badge = document.getElementById("editBadge").value.trim();
    prod.image = document.getElementById("editImage").value.trim() || DEFAULT_FRUIT_IMG;
    prod.description = document.getElementById("editDesc").value.trim();

    const editTaste = document.getElementById("editTaste");
    if (editTaste && editTaste.value.trim()) {
        prod.taste = editTaste.value.trim();
    }
    const editStorage = document.getElementById("editStorage");
    if (editStorage && editStorage.value.trim()) {
        prod.storage = editStorage.value.trim();
    }

    saveProducts(products);
    showToast(`Đã lưu thay đổi cho sản phẩm [${prod.name}]!`);
    closeEditProductModal();
    refreshAdminDashboard();
}

function openOrderDetailModal(orderId) {
    const orders = getOrders();
    const ord = orders.find(o => o.id === orderId);
    if (!ord) return;

    document.getElementById("adminDetailId").textContent = ord.id;
    document.getElementById("adminDetailDate").textContent = ord.date;
    document.getElementById("adminDetailCust").textContent = `${ord.customerName} (${ord.phone})`;
    document.getElementById("adminDetailAddress").textContent = ord.address;
    document.getElementById("adminDetailSlot").textContent = ord.deliverySlot;
    document.getElementById("adminDetailPay").textContent = ord.paymentMethod;
    document.getElementById("adminDetailStatus").textContent = ord.status;

    const itemsTbody = document.getElementById("adminDetailItemsTbody");
    if (itemsTbody) {
        itemsTbody.innerHTML = ord.items.map((it, idx) => `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding: 8px;">${idx + 1}</td>
                <td style="padding: 8px;"><strong>${escapeHTML(it.name)}</strong></td>
                <td style="padding: 8px; text-align: center;">${escapeHTML(it.unit || 'kg')}</td>
                <td style="padding: 8px; text-align: center;">${formatQuantity(it.quantity, it.unit || 'kg')}</td>
                <td style="padding: 8px; text-align: right;">${formatCurrency(it.price)}</td>
                <td style="padding: 8px; text-align: right; font-weight: 700; color: var(--accent);">${formatCurrency(it.subtotal || (it.price * parseSafeQty(it.quantity, 1)))}</td>
            </tr>
        `).join("");
    }

    document.getElementById("adminDetailSubtotal").textContent = formatCurrency(ord.subtotal);
    document.getElementById("adminDetailDiscount").textContent = ord.discount > 0 ? `-${formatCurrency(ord.discount)}` : "0 đ";
    document.getElementById("adminDetailShipping").textContent = ord.shipping === 0 ? "Miễn phí" : formatCurrency(ord.shipping);
    document.getElementById("adminDetailTotal").textContent = formatCurrency(ord.total);

    const printBtn = document.getElementById("adminDetailPrintBtn");
    if (printBtn) {
        printBtn.onclick = function () {
            printOrderInvoice(ord.id);
        };
    }

    document.getElementById("adminOrderDetailModal").style.display = "flex";
}

function closeOrderDetailModal() {
    const modal = document.getElementById("adminOrderDetailModal");
    if (modal) modal.style.display = "none";
}

function closeOrderDetailOnBackdrop(e) {
    if (e.target.id === "adminOrderDetailModal") closeOrderDetailModal();
}

if (typeof window !== "undefined") {
    window.closeAddProductOnBackdrop = closeAddProductOnBackdrop;
    window.closeEditProductOnBackdrop = closeEditProductOnBackdrop;
    window.closeOrderDetailOnBackdrop = closeOrderDetailOnBackdrop;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        initAdminTabs,
        refreshAdminDashboard,
        updateAdminMetrics,
        renderInventoryTable,
        filterAdminProducts,
        quickAdjustStock,
        renderFefoTable,
        quickFefoDiscount,
        quickFefoScrap,
        renderOrdersTable,
        filterOrdersByStatus,
        filterAdminOrders,
        updateOrderStatus,
        deleteProductAction,
        openAddProductModal,
        closeAddProductModal,
        closeAddProductOnBackdrop,
        handleAddProductSubmit,
        openEditProductModal,
        closeEditProductModal,
        closeEditProductOnBackdrop,
        handleEditProductSubmit,
        openOrderDetailModal,
        closeOrderDetailModal,
        closeOrderDetailOnBackdrop
    };
}
