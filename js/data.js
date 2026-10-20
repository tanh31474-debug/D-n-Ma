const DEFAULT_FRUIT_IMG = "data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22400%22%20height%3D%22300%22%20viewBox%3D%220%200%20400%20300%22%3E%3Crect%20fill%3D%22%23f8fafc%22%20width%3D%22400%22%20height%3D%22300%22%2F%3E%3Crect%20x%3D%2210%22%20y%3D%2210%22%20width%3D%22380%22%20height%3D%22280%22%20rx%3D%228%22%20fill%3D%22%23f1f5f9%22%20stroke%3D%22%23cbd5e1%22%20stroke-dasharray%3D%224%204%22%2F%3E%3Ctext%20fill%3D%22%2315803d%22%20font-family%3D%22Segoe%20UI%2C%20sans-serif%22%20font-size%3D%2232%22%20font-weight%3D%22bold%22%20text-anchor%3D%22middle%22%20x%3D%22200%22%20y%3D%22135%22%3E%F0%9F%8D%8E%20Hoa%20Qu%E1%BA%A3%20T%C6%B0%C6%A1i%3C%2Ftext%3E%3Ctext%20fill%3D%22%2364748b%22%20font-family%3D%22Segoe%20UI%2C%20sans-serif%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%20x%3D%22200%22%20y%3D%22170%22%3EN%C3%B4ng%20S%E1%BA%A3n%20Xanh%20%E2%80%A2%20VietGAP%3C%2Ftext%3E%3C%2Fsvg%3E";

function handleImageError(imgEl) {
    if (imgEl) {
        imgEl.onerror = null;
        imgEl.src = DEFAULT_FRUIT_IMG;
    }
}

function escapeHTML(str) {
    if (str === null || str === undefined) return "";
    return String(str).replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[tag] || tag));
}

// Truyền giá trị an toàn vào onclick="fn(...)" (escapeHTML thôi là không đủ trong ngữ cảnh JS)
function jsArg(v) {
    return escapeHTML(JSON.stringify(String(v)));
}

// Chuẩn hóa SĐT: bỏ khoảng trắng/dấu, +84 -> 0
function normalizePhone(phone) {
    return String(phone || "").replace(/[\s.-]/g, "").replace(/^\+84/, "0");
}

function parseSafeQty(qty, defaultVal = 1) {
    if (typeof qty === "string") {
        qty = qty.replace(",", ".");
    }
    const n = parseFloat(qty);
    return isNaN(n) ? defaultVal : n;
}

function safeSetLocalStorage(key, value) {
    if (typeof localStorage === "undefined") return false;
    try {
        const valStr = typeof value === "string" ? value : JSON.stringify(value);
        localStorage.setItem(key, valStr);
        return true;
    } catch (e) {
        console.error(`Lỗi khi ghi ${key} vào localStorage:`, e);
        if (typeof showToast === "function") {
            showToast("Bộ nhớ trình duyệt đã đầy hoặc bị chặn lưu trữ!", "error");
        }
        return false;
    }
}

// Ngày dạng YYYY-MM-DD theo giờ máy, cách hôm nay n ngày.
// Dữ liệu mẫu dùng hàm này để hạn dùng luôn "tươi" dù mở web vào ngày nào.
function daysFromToday(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    const pad = x => String(x).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const initialProducts = [
    {
        id: "HQ01",
        name: "Táo Đỏ New Zealand (Size 70)",
        category: "nhap-khau",
        price: 135000,
        originalPrice: 155000,
        unit: "kg",
        origin: "New Zealand",
        standard: "GlobalGAP",
        expiryDate: daysFromToday(13),
        stock: 45,
        rating: 4.9,
        reviewsCount: 42,
        brix: 14.5,
        taste: "Ngọt đậm, thịt giòn tan, thơm dịu",
        storage: "Bảo quản ngăn mát 3 - 5°C, bọc túi kín",
        description: "Táo đỏ giòn ngọt cao cấp nhập khẩu từ New Zealand, vỏ đỏ ruby bóng bẩy, độ ngọt tự nhiên không gắt, phù hợp cho cả gia đình và làm giỏ quà biếu.",
        image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&q=80",
        badge: "Bán chạy"
    },
    {
        id: "HQ02",
        name: "Cam Sành Bố Hạ Tiền Giang (Mọng nước)",
        category: "noi-dia",
        price: 35000,
        originalPrice: 42000,
        unit: "kg",
        origin: "Tiền Giang",
        standard: "VietGAP",
        expiryDate: daysFromToday(3),
        stock: 80,
        rating: 4.8,
        reviewsCount: 56,
        brix: 11.2,
        taste: "Chua ngọt thanh mát, cực nhiều nước",
        storage: "Bảo quản nơi thoáng mát hoặc ngăn mát 7 ngày",
        description: "Cam sành vườn Tiền Giang trái tròn đều, mỏng vỏ, tép cam mọng nước, giàu Vitamin C tự nhiên, vắt nước uống giải nhiệt mỗi ngày.",
        image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=600&q=80",
        badge: "Cận date -17%"
    },
    {
        id: "HQ03",
        name: "Dưa Hấu Không Hạt Mặt Trời Đỏ",
        category: "noi-dia",
        price: 26000,
        originalPrice: 30000,
        unit: "kg",
        origin: "Long An",
        standard: "VietGAP",
        expiryDate: daysFromToday(5),
        stock: 60,
        rating: 4.7,
        reviewsCount: 29,
        brix: 12.0,
        taste: "Ngọt mát lịm, ruột đỏ au không hạt",
        storage: "Để ngoài thoáng mát 5 ngày, ngon hơn khi ướp lạnh",
        description: "Dưa hấu Long An chuẩn VietGAP ruột đỏ chắc thịt, không hạt hoặc chỉ có hạt lép trắng, ngọt đậm vị giải khát hoàn hảo.",
        image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&q=80",
        badge: "Mới về"
    },
    {
        id: "HQ04",
        name: "Xoài Cát Hòa Lộc Chín Cây",
        category: "noi-dia",
        price: 85000,
        originalPrice: 105000,
        unit: "kg",
        origin: "Đồng Tháp",
        standard: "VietGAP",
        expiryDate: daysFromToday(3),
        stock: 30,
        rating: 5.0,
        reviewsCount: 68,
        brix: 16.5,
        taste: "Ngọt lịm như mật, thơm nức mũi, không xơ",
        storage: "Ăn ngay khi vỏ chuyển vàng đều, hoặc để ngăn mát 3 ngày",
        description: "Đặc sản nức tiếng Đồng Tháp, thịt xoài dẻo mịn, mùi thơm quyến rũ lan tỏa khắp phòng, ăn một lần là nhớ mãi.",
        image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&q=80",
        badge: "Đặc sản"
    },
    {
        id: "HQ05",
        name: "Nho Mẫu Đơn Shine Muscat Hàn Quốc",
        category: "nhap-khau",
        price: 320000,
        originalPrice: 360000,
        unit: "hộp",
        origin: "Hàn Quốc",
        standard: "Organic",
        expiryDate: daysFromToday(10),
        stock: 20,
        rating: 4.9,
        reviewsCount: 34,
        brix: 18.0,
        taste: "Thơm mùi xoài và hoa sữa, ngọt giòn không hạt",
        storage: "Không rửa trước khi cho vào ngăn mát, để được 10 ngày",
        description: "Dòng nho quý tộc thượng hạng, từng quả nho to tròn căng mọng như ngọc bích, độ ngọt ngào đỉnh cao chuẩn Organic Hàn Quốc.",
        image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&q=80",
        badge: "Cao cấp"
    },
    {
        id: "HQ06",
        name: "Bơ Sáp 034 Cơm Vàng Dẻo Đắk Lắk",
        category: "noi-dia",
        price: 55000,
        originalPrice: 65000,
        unit: "kg",
        origin: "Đắk Lắk",
        standard: "VietGAP",
        expiryDate: daysFromToday(5),
        stock: 40,
        rating: 4.8,
        reviewsCount: 47,
        brix: 8.5,
        taste: "Dẻo quánh, béo ngậy vị bơ rừng nguyên chất",
        storage: "Để cuống bơ tự rụng khi chín mềm tay thì dùng",
        description: "Bơ 034 dáng dài cơm vàng hạt lép, béo ngậy tự nhiên, lý tưởng cho món salad ăn kiêng healthy hoặc sinh tố bơ thơm lừng.",
        image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=600&q=80",
        badge: "Healthy"
    },
    {
        id: "HQ07",
        name: "Kiwi Vàng New Zealand (Hộp 4 quả)",
        category: "nhap-khau",
        price: 160000,
        originalPrice: 185000,
        unit: "hộp",
        origin: "New Zealand",
        standard: "GlobalGAP",
        expiryDate: daysFromToday(8),
        stock: 25,
        rating: 4.9,
        reviewsCount: 22,
        brix: 14.0,
        taste: "Ngọt thanh mát lành, tép vàng óng ả",
        storage: "Bảo quản ngăn mát tủ lạnh dùng dần trong 2 tuần",
        description: "Kiwi vàng New Zealand gấp 3 lần Vitamin C của quả cam, vị ngọt mát dịu dàng, vỏ nhẵn mịn dễ bóc, bổ dưỡng cho mọi lứa tuổi.",
        image: "https://images.unsplash.com/photo-1585059895524-72359e06133a?w=600&q=80",
        badge: "Giàu Vitamin"
    },
    {
        id: "HQ08",
        name: "Dâu Tây Giống Nhật Hana Đà Lạt (Hộp 500g)",
        category: "noi-dia",
        price: 180000,
        originalPrice: 210000,
        unit: "hộp",
        origin: "Đà Lạt",
        standard: "VietGAP",
        expiryDate: daysFromToday(3),
        stock: 15,
        rating: 4.9,
        reviewsCount: 63,
        brix: 13.5,
        taste: "Ngọt thơm nồng nàn, chua dịu nhẹ ở hậu vị",
        storage: "Dùng khăn giấy lót đáy hộp để tủ mát, dùng trong 2-3 ngày",
        description: "Dâu Hana trồng theo công nghệ nhà kính bán thủy canh tại Đà Lạt, quả đỏ tươi mọng nước, hương thơm ngào ngạt tự nhiên.",
        image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&q=80",
        badge: "Best Seller"
    },
    {
        id: "HQ09",
        name: "Bưởi Da Xanh Bến Tre Ruột Hồng (Quả 1.5 - 1.8kg)",
        category: "noi-dia",
        price: 68000,
        originalPrice: 80000,
        unit: "kg",
        origin: "Bến Tre",
        standard: "VietGAP",
        expiryDate: daysFromToday(16),
        stock: 35,
        rating: 4.8,
        reviewsCount: 31,
        brix: 12.5,
        taste: "Tép hồng giòn tan, ngọt thanh không đắng",
        storage: "Để nơi khô ráo thoáng mát được đến 30 ngày",
        description: "Bưởi da xanh chính gốc Bến Tre, vỏ mỏng xanh mướt, tép bưởi hồng mọng ráo nước, róc vỏ dễ bóc, thích hợp bày mâm ngũ quả và tráng miệng.",
        image: "https://images.unsplash.com/photo-1577234286642-fc512a5f8f11?w=600&q=80",
        badge: "Bảo quản lâu"
    },
    {
        id: "HQ10",
        name: "Giỏ Quà Trái Cây Thượng Hạng Sum Vầy",
        category: "gio-qua",
        price: 650000,
        originalPrice: 750000,
        unit: "giỏ",
        origin: "Việt Nam & Nhập khẩu",
        standard: "Premium Gift",
        expiryDate: daysFromToday(13),
        stock: 12,
        rating: 5.0,
        reviewsCount: 19,
        brix: 15.0,
        taste: "Tổng hợp 6 loại hoa quả nhập khẩu và đặc sản",
        storage: "Bảo quản trong phòng mát hoặc ngăn lạnh sau khi mở nơ",
        description: "Set giỏ quà thiết kế sang trọng gồm Táo Đỏ New Zealand, Nho Mẫu Đơn, Kiwi Vàng, Cam Sành và Lê Hàn Quốc, kèm nơ ruy băng lụa và thiệp chúc mừng viết tay cao cấp.",
        image: "https://images.unsplash.com/photo-1546548970-71785318a17b?w=600&q=80",
        badge: "Quà tặng"
    }
];

const validVouchers = {
    "TRAICAY10": {
        code: "TRAICAY10",
        discountPercent: 10,
        maxDiscount: 50000,
        minOrder: 200000,
        description: "Giảm 10% (tối đa 50k) cho đơn từ 200k"
    },
    "FREESHIP": {
        code: "FREESHIP",
        freeShipping: true,
        minOrder: 100000,
        description: "Miễn phí vận chuyển cho đơn từ 100k"
    }
};

if (typeof window !== "undefined") {
    window.validVouchers = validVouchers;
}

const sampleOrders = [
    {
        id: "DH1001",
        customerName: "Khách Hàng Mẫu 01",
        phone: "0901000001",
        address: "Số 18 Đường Mẫu, Phường 1",
        deliverySlot: "Giao hỏa tốc 1 - 2 giờ (Đóng đá gel giữ lạnh)",
        note: "Chọn quả già, chín tới ăn liền",
        paymentMethod: "COD",
        date: "14/10/2026 09:30",
        items: [
            { id: "HQ01", name: "Táo Đỏ New Zealand (Size 70)", quantity: 2, price: 135000, subtotal: 270000, unit: "kg" },
            { id: "HQ02", name: "Cam Sành Bố Hạ Tiền Giang (Mọng nước)", quantity: 1.5, price: 35000, subtotal: 52500, unit: "kg" }
        ],
        subtotal: 322500,
        discount: 0,
        shipping: 0,
        total: 322500,
        status: "Đang giao hàng",
        stockRestored: true // đơn mẫu chưa từng trừ kho -> hủy không được cộng lại
    },
    {
        id: "DH1002",
        customerName: "Khách Hàng Mẫu 02",
        phone: "0902000002",
        address: "Căn hộ B-02, Tòa Nhà Demo",
        deliverySlot: "Buổi chiều nay (14:00 - 17:00)",
        note: "Giao giờ hành chính",
        paymentMethod: "COD",
        date: "14/10/2026 11:15",
        items: [
            { id: "HQ05", name: "Nho Mẫu Đơn Shine Muscat Hàn Quốc", quantity: 1, price: 320000, subtotal: 320000, unit: "hộp" }
        ],
        subtotal: 320000,
        discount: 32000,
        shipping: 0,
        total: 288000,
        status: "Đã hoàn thành",
        stockRestored: true
    }
];

function initData() {
    if (typeof localStorage === "undefined") return;
    try {
        if (localStorage.getItem("fruit_products") === null) {
            safeSetLocalStorage("fruit_products", initialProducts);
        }
    } catch (e) {
        safeSetLocalStorage("fruit_products", initialProducts);
    }

    try {
        if (localStorage.getItem("fruit_cart") === null) {
            safeSetLocalStorage("fruit_cart", []);
        }
    } catch (e) {
        safeSetLocalStorage("fruit_cart", []);
    }

    if (localStorage.getItem("fruit_applied_voucher") === null) {
        safeSetLocalStorage("fruit_applied_voucher", null);
    }

    try {
        if (localStorage.getItem("fruit_orders") === null) {
            safeSetLocalStorage("fruit_orders", sampleOrders);
        }
    } catch (e) {
        safeSetLocalStorage("fruit_orders", sampleOrders);
    }
}

function normalizeProduct(p) {
    if (!p) return null;
    const res = {
        id: p.id || ("HQ" + Math.floor(Math.random() * 100)),
        name: p.name || "Hoa quả tươi",
        category: p.category || "noi-dia",
        price: Number(p.price) || 0,
        originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
        unit: p.unit || "kg",
        origin: p.origin || "Việt Nam",
        standard: p.standard || "VietGAP",
        expiryDate: p.expiryDate || daysFromToday(7),
        stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
        rating: Number(p.rating) || 5.0,
        reviewsCount: Number(p.reviewsCount) || 10,
        brix: p.brix !== undefined && p.brix !== null ? Number(p.brix) : 12.0,
        taste: p.taste || "Ngọt mát tự nhiên",
        storage: p.storage || "Bảo quản ngăn mát 3 - 5°C",
        description: p.description || "Hoa quả sạch tiêu chuẩn an toàn thực phẩm.",
        image: p.image || DEFAULT_FRUIT_IMG,
        badge: p.badge || ""
    };
    if (p.preFefoPrice !== undefined) res.preFefoPrice = Number(p.preFefoPrice);
    if (p.preFefoOriginalPrice !== undefined) res.preFefoOriginalPrice = p.preFefoOriginalPrice !== null ? Number(p.preFefoOriginalPrice) : null;
    if (p.preFefoBadge !== undefined) res.preFefoBadge = p.preFefoBadge;
    return res;
}

function removeVietnameseTones(str) {
    if (!str) return "";
    return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D")
        .toLowerCase();
}

function getProducts() {
    initData();
    try {
        const raw = localStorage.getItem("fruit_products");
        if (raw !== null) {
            const prods = JSON.parse(raw);
            if (Array.isArray(prods)) {
                return prods.map(normalizeProduct).filter(Boolean);
            }
        }
        return initialProducts.map(normalizeProduct);
    } catch (e) {
        return initialProducts.map(normalizeProduct);
    }
}

function saveProducts(products) {
    safeSetLocalStorage("fruit_products", products);
}

function getCart() {
    initData();
    try {
        const cart = JSON.parse(localStorage.getItem("fruit_cart"));
        if (!Array.isArray(cart)) return [];
        return cart
            .filter(it => it && it.id && it.price > 0 && parseSafeQty(it.quantity, 0) > 0)
            .map(it => ({
                id: it.id,
                name: it.name || "Hoa quả",
                price: Number(it.price) || 0,
                unit: it.unit || "kg",
                image: it.image || DEFAULT_FRUIT_IMG,
                quantity: Math.round(parseSafeQty(it.quantity, 1) * 10) / 10
            }));
    } catch (e) {
        return [];
    }
}

// Đồng bộ giỏ với kho (giá, tên, ảnh, đơn vị). Trả về true nếu có thay đổi.
function syncCartWithProducts(cart, products) {
    let changed = false;
    cart.forEach(item => {
        const prod = products.find(p => p.id === item.id);
        if (!prod) return;
        if (item.price !== prod.price || item.unit !== prod.unit || item.name !== prod.name || item.image !== prod.image) {
            item.price = prod.price;
            item.unit = prod.unit;
            item.name = prod.name;
            item.image = prod.image;
            changed = true;
        }
        if (item.unit !== "kg" && !Number.isInteger(item.quantity)) {
            item.quantity = Math.max(1, Math.round(item.quantity));
            changed = true;
        }
    });
    return changed;
}

function saveCart(cart) {
    safeSetLocalStorage("fruit_cart", cart);
    updateCartBadge();
    if (typeof updateMiniCartDrawer === "function") {
        updateMiniCartDrawer();
    }
}

function getOrders() {
    initData();
    try {
        const orders = JSON.parse(localStorage.getItem("fruit_orders"));
        return Array.isArray(orders) ? orders : [];
    } catch (e) {
        return [];
    }
}

function saveOrders(orders) {
    safeSetLocalStorage("fruit_orders", orders);
}

function getAppliedVoucher() {
    try {
        const raw = JSON.parse(localStorage.getItem("fruit_applied_voucher"));
        if (!raw || !raw.code) return null;
        return validVouchers[raw.code] || null;
    } catch (e) {
        return null;
    }
}

function setAppliedVoucher(voucher) {
    safeSetLocalStorage("fruit_applied_voucher", voucher);
}

function getDaysUntilExpiry(expiryDateStr) {
    if (!expiryDateStr) return 99;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr + "T00:00:00");
    if (isNaN(expiry.getTime())) return 99;
    const diff = expiry.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('vi-VN') + " đ";
}

function formatQuantity(qty, unit = "kg") {
    if (typeof qty === "string") {
        qty = qty.replace(",", ".");
    }
    const num = parseFloat(qty) || 0;
    if (unit === "kg") {
        const rounded = Math.round(num * 10) / 10;
        return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
    }
    return Math.round(num).toString();
}

function showToast(message, type = "success") {
    if (typeof document === "undefined") return;
    let container = document.getElementById("toastContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast-item toast-${type}`;

    const icon = type === "success"
        ? `<svg class="toast-svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>`
        : `<svg class="toast-svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>`;

    toast.innerHTML = `
        <div class="toast-content">
            ${icon}
            <span class="toast-msg-text"></span>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()" aria-label="Đóng">&times;</button>
    `;

    const msgSpan = toast.querySelector(".toast-msg-text");
    if (msgSpan) {
        msgSpan.textContent = message;
    }

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-fade-out");
        setTimeout(() => {
            if (typeof toast.remove === "function") {
                toast.remove();
            } else if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 2800);
}

function updateCartBadge() {
    if (typeof document === "undefined") return;
    const badges = document.querySelectorAll("#cartBadge, .cart-badge-pill, .cart-count");
    const subtotalHeader = document.getElementById("cartHeaderTotal");
    const cart = getCart();

    const subtotal = cart.reduce((sum, item) => sum + (item.price * parseSafeQty(item.quantity, 1)), 0);

    const formattedQty = String(cart.length);

    badges.forEach(b => {
        b.textContent = formattedQty;
    });

    if (subtotalHeader) {
        subtotalHeader.textContent = formatCurrency(subtotal);
    }
}

function printOrderInvoice(orderId) {
    if (typeof document === "undefined") return;
    const orders = getOrders();
    const ord = orders.find(o => o.id === orderId);
    if (!ord) {
        showToast("Không tìm thấy đơn hàng cần in", "error");
        return;
    }

    let printArea = document.getElementById("orderPrintArea");
    if (!printArea) {
        printArea = document.createElement("div");
        printArea.id = "orderPrintArea";
        printArea.className = "order-print-area";
        document.body.appendChild(printArea);
    }

    const itemsRows = ord.items.map((it, i) => `
        <tr>
            <td style="text-align: center; padding: 6px 8px; border: 1px solid #333;">${i + 1}</td>
            <td style="padding: 6px 8px; border: 1px solid #333;">
                <strong>${escapeHTML(it.name)}</strong>
            </td>
            <td style="text-align: center; padding: 6px 8px; border: 1px solid #333;">${escapeHTML(it.unit || "kg")}</td>
            <td style="text-align: center; padding: 6px 8px; border: 1px solid #333;">${escapeHTML(formatQuantity(it.quantity, it.unit))}</td>
            <td style="text-align: right; padding: 6px 8px; border: 1px solid #333;">${formatCurrency(it.price)}</td>
            <td style="text-align: right; padding: 6px 8px; border: 1px solid #333;"><strong>${formatCurrency(it.subtotal || (it.price * it.quantity))}</strong></td>
        </tr>
    `).join("");

    printArea.innerHTML = `
        <div class="print-bill-wrap">
            <div style="text-align: center; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 12px;">
                <h1 style="font-size: 20px; font-weight: 800; margin: 0; text-transform: uppercase;">CỬA HÀNG HOA QUẢ TƯƠI</h1>
                <p style="margin: 3px 0; font-size: 13px;">Địa chỉ: Số 3 Cầu Giấy, Láng Thượng, Hà Nội (UTC) | 450 Lê Văn Việt, TP. Thủ Đức, TP.HCM (UTC2)</p>
                <p style="margin: 3px 0; font-size: 13px;">Hotline hỗ trợ: 1900 xxxx - Dịch vụ đặt hàng trực tuyến</p>
                <h2 style="font-size: 17px; margin-top: 10px; font-weight: 800;">HÓA ĐƠN BÁN LẺ & PHIẾU GIAO HÀNG</h2>
                <div style="font-size: 13px; font-style: italic;">Mã đơn: <strong>${escapeHTML(ord.id)}</strong> — Ngày đặt: ${escapeHTML(ord.date)}</div>
            </div>

            <div style="margin-bottom: 14px; font-size: 13px; line-height: 1.6;">
                <div><strong>Khách hàng:</strong> ${escapeHTML(ord.customerName)}</div>
                <div><strong>Số điện thoại:</strong> ${escapeHTML(ord.phone)}</div>
                <div><strong>Địa chỉ nhận hàng:</strong> ${escapeHTML(ord.address)}</div>
                <div><strong>Khung giờ hẹn giao:</strong> ${escapeHTML(ord.deliverySlot)}</div>
                <div><strong>Phương thức thanh toán:</strong> ${escapeHTML(ord.paymentMethod)}</div>
            </div>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 14px;">
                <thead>
                    <tr style="background: #f1f5f9;">
                        <th style="padding: 6px 8px; border: 1px solid #333; width: 35px;">STT</th>
                        <th style="padding: 6px 8px; border: 1px solid #333; text-align: left;">Tên mặt hàng hoa quả</th>
                        <th style="padding: 6px 8px; border: 1px solid #333; width: 60px;">ĐVT</th>
                        <th style="padding: 6px 8px; border: 1px solid #333; width: 65px;">Số lượng</th>
                        <th style="padding: 6px 8px; border: 1px solid #333; width: 95px; text-align: right;">Đơn giá</th>
                        <th style="padding: 6px 8px; border: 1px solid #333; width: 110px; text-align: right;">Thành tiền</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRows}
                </tbody>
            </table>

            <div style="display: flex; justify-content: flex-end; margin-bottom: 20px; font-size: 13px;">
                <div style="width: 280px; line-height: 1.8;">
                    <div style="display: flex; justify-content: space-between;">
                        <span>Tiền hàng (Tạm tính):</span>
                        <strong>${formatCurrency(ord.subtotal)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Giảm giá ưu đãi:</span>
                        <span>${ord.discount > 0 ? "-" + formatCurrency(ord.discount) : "0 đ"}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span>Phí giao hàng:</span>
                        <span>${ord.shipping === 0 ? "Miễn phí" : formatCurrency(ord.shipping)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 15px; border-top: 1px solid #000; padding-top: 4px; margin-top: 4px;">
                        <strong>TỔNG THANH TOÁN:</strong>
                        <strong style="font-size: 16px;">${formatCurrency(ord.total)}</strong>
                    </div>
                </div>
            </div>

            <div style="display: flex; justify-content: space-between; text-align: center; margin-top: 24px; font-size: 13px;">
                <div>
                    <strong>Người lập phiếu</strong><br>
                    <span style="font-size: 11px; font-style: italic;">(Ký, ghi rõ họ tên)</span>
                    <div style="height: 45px;"></div>
                    <span>Thu ngân</span>
                </div>
                <div>
                    <strong>Nhân viên giao hàng</strong><br>
                    <span style="font-size: 11px; font-style: italic;">(Ký, ghi rõ họ tên)</span>
                    <div style="height: 45px;"></div>
                    <span>Shipper</span>
                </div>
                <div>
                    <strong>Khách hàng nhận hàng</strong><br>
                    <span style="font-size: 11px; font-style: italic;">(Ký nhận hoa quả nguyên vẹn)</span>
                    <div style="height: 45px;"></div>
                    <span>${escapeHTML(ord.customerName)}</span>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; padding-top: 10px; border-top: 1px dashed #666; font-size: 12px; font-style: italic;">
                🌿 Cửa hàng cam kết bao ăn 1 đổi 1 trong vòng 24 giờ nếu phát hiện hoa quả dập nát, hỏng cuống.<br>
                Chân thành cảm ơn quý khách đã tin tưởng và ủng hộ!
            </div>
        </div>
    `;

    document.body.classList.add("printing-mode");
    window.print();
}

if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("storage", function (e) {
        if (!e.key) {

            initData();
            updateCartBadge();
            if (typeof renderProducts === "function") renderProducts();
            if (typeof renderCartPage === "function") renderCartPage();
            if (typeof refreshAdminDashboard === "function") refreshAdminDashboard();
            if (typeof updateMiniCartDrawer === "function") updateMiniCartDrawer();
            return;
        }
        if (e.key === "fruit_cart" || e.key === "fruit_applied_voucher") {
            updateCartBadge();
            if (typeof updateMiniCartDrawer === "function") updateMiniCartDrawer();
            if (typeof renderCartPage === "function") renderCartPage();
        }
        if (e.key === "fruit_products") {
            if (typeof renderProducts === "function") renderProducts();
            if (typeof renderCartPage === "function") renderCartPage();
            if (typeof refreshAdminDashboard === "function") refreshAdminDashboard();
        }
        if (e.key === "fruit_orders") {
            if (typeof refreshAdminDashboard === "function") refreshAdminDashboard();
            if (typeof searchTrackOrders === "function") {
                const trackModal = document.getElementById("orderTrackingModal");
                if (trackModal && trackModal.style.display === "flex") {
                    searchTrackOrders();
                }
            }
        }
    });

    window.addEventListener("afterprint", function () {
        if (document.body) {
            document.body.classList.remove("printing-mode");
        }
        const printArea = document.getElementById("orderPrintArea");
        if (printArea) {
            printArea.innerHTML = "";
        }
    });

    window.addEventListener("keydown", handleModalFocusTrap);
}

function handleModalFocusTrap(e) {
    if (!e || e.key !== "Tab") return;

    if (typeof document === "undefined") return;
    const modals = document.querySelectorAll(".modal-overlay[role='dialog']");
    let activeModal = null;
    for (const m of modals) {
        const style = m.style ? m.style.display : "";
        if (style && style !== "none") {
            activeModal = m;
            break;
        }
    }
    if (!activeModal) return;

    const focusables = Array.from(activeModal.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
    if (!focusables || focusables.length === 0) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        return;
    }

    const firstEl = focusables[0];
    const lastEl = focusables[focusables.length - 1];

    if (e.shiftKey) {
        if (document.activeElement === firstEl || !activeModal.contains(document.activeElement)) {
            if (typeof e.preventDefault === "function") e.preventDefault();
            if (lastEl && typeof lastEl.focus === "function") lastEl.focus();
        }
    } else {
        if (document.activeElement === lastEl || !activeModal.contains(document.activeElement)) {
            if (typeof e.preventDefault === "function") e.preventDefault();
            if (firstEl && typeof firstEl.focus === "function") firstEl.focus();
        }
    }
}

const STORAGE_KEYS = ["fruit_products", "fruit_orders", "fruit_cart", "fruit_applied_voucher"];

function resetSeedData() {
    if (!confirm("Bạn có muốn đặt lại toàn bộ dữ liệu mẫu (10 loại hoa quả, voucher, đơn hàng mẫu) không?")) return;
    STORAGE_KEYS.forEach(k => localStorage.removeItem(k)); // không dùng clear() để tránh xóa dữ liệu của trang khác
    initData();
    location.reload();
}

function exportDatabaseJson() {
    const data = {
        products: getProducts(),
        orders: getOrders(),
        cart: getCart(),
        exportDate: new Date().toISOString()
    };
    const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const dlAnchor = document.createElement("a");
    dlAnchor.setAttribute("href", jsonStr);
    dlAnchor.setAttribute("download", `nongsanxanh_backup_${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
    showToast("Đã xuất file sao lưu dữ liệu JSON thành công!");
}

initData();

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        DEFAULT_FRUIT_IMG,
        initialProducts,
        validVouchers,
        sampleOrders,
        escapeHTML,
        jsArg,
        daysFromToday,
        normalizePhone,
        syncCartWithProducts,
        resetSeedData,
        parseSafeQty,
        safeSetLocalStorage,
        initData,
        normalizeProduct,
        removeVietnameseTones,
        getProducts,
        saveProducts,
        getCart,
        saveCart,
        getOrders,
        saveOrders,
        getAppliedVoucher,
        setAppliedVoucher,
        formatCurrency,
        formatQuantity,
        showToast,
        updateCartBadge,
        printOrderInvoice,
        handleModalFocusTrap,
        getDaysUntilExpiry
    };
}
