// Khóa trang quản trị bằng mật khẩu (phía client).
// Mật khẩu mặc định: admin@123 — đổi bằng cách mở Console và chạy: await hashPassword("mat-khau-moi")
// rồi dán chuỗi kết quả vào ADMIN_PASSWORD_HASH.
const ADMIN_PASSWORD_HASH = "7676aaafb027c825bd9abab78b234070e702752f625b752e55e55b48e607e358";
const AUTH_KEY = "fruit_admin_auth";
const LOCK_KEY = "fruit_admin_lock";
const MAX_TRIES = 5;
const LOCK_MS = 30000;

async function hashPassword(pw) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function isAdminLoggedIn() {
    return sessionStorage.getItem(AUTH_KEY) === ADMIN_PASSWORD_HASH;
}

function getLock() {
    try { return JSON.parse(sessionStorage.getItem(LOCK_KEY)) || { tries: 0, until: 0 }; }
    catch (e) { return { tries: 0, until: 0 }; }
}

async function handleAdminLogin(e) {
    e.preventDefault();
    const input = document.getElementById("adminPassword");
    const msg = document.getElementById("adminLoginMsg");
    const lock = getLock();

    if (Date.now() < lock.until) {
        msg.textContent = `Nhập sai quá nhiều lần. Thử lại sau ${Math.ceil((lock.until - Date.now()) / 1000)} giây.`;
        return;
    }

    if (await hashPassword(input.value) === ADMIN_PASSWORD_HASH) {
        sessionStorage.setItem(AUTH_KEY, ADMIN_PASSWORD_HASH);
        sessionStorage.removeItem(LOCK_KEY);
        unlockAdmin();
        return;
    }

    lock.tries += 1;
    if (lock.tries >= MAX_TRIES) {
        lock.until = Date.now() + LOCK_MS;
        lock.tries = 0;
    }
    sessionStorage.setItem(LOCK_KEY, JSON.stringify(lock));
    msg.textContent = lock.until > Date.now() ? "Sai mật khẩu. Tạm khóa 30 giây." : `Sai mật khẩu (còn ${MAX_TRIES - lock.tries} lần thử).`;
    input.value = "";
    input.focus();
}

function unlockAdmin() {
    document.body.classList.remove("admin-locked");
    const gate = document.getElementById("adminLoginGate");
    if (gate) gate.remove();
}

function adminLogout() {
    sessionStorage.removeItem(AUTH_KEY);
    location.reload();
}

document.addEventListener("DOMContentLoaded", function () {
    if (isAdminLoggedIn()) {
        unlockAdmin();
        return;
    }
    document.getElementById("adminLoginForm").addEventListener("submit", handleAdminLogin);
    document.getElementById("adminPassword").focus();
});
