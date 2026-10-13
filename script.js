"use strict";
// Dữ liệu khởi tạo. Được phép chỉnh sửa hoặc thêm thuộc tính nếu cần.
const items = [
  { "id": 1, "title": "Viết báo cáo HTML",       "dueDate": "2026-10-20", "priority": "Cao",        "status": "pending" },
  { "id": 2, "title": "Ôn Flexbox",              "dueDate": "2026-10-23", "priority": "Trung bình", "status": "pending" },
  { "id": 3, "title": "Làm bài DOM",             "dueDate": "2026-10-19", "priority": "Cao",        "status": "done" },
  { "id": 4, "title": "Đọc tài liệu CSS",        "dueDate": "2026-10-25", "priority": "Thấp",       "status": "pending" },
  { "id": 5, "title": "Thiết kế trang cá nhân",  "dueDate": "2026-10-21", "priority": "Trung bình", "status": "done" }
];

// ---------- Tham chiếu DOM ----------
const form = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const dueInput = document.querySelector("#task-due");
const priorityInput = document.querySelector("#task-priority");
const errorBox = document.querySelector("#form-error");
const searchInput = document.querySelector("#search-input");
const statusFilter = document.querySelector("#status-filter");
const listEl = document.querySelector("#task-list");
const emptyEl = document.querySelector("#empty-state");
const countEl = document.querySelector("#task-count");

// ---------- Hàm hỗ trợ ----------
// Chuyển "Trung bình" -> "trung-binh" để dùng làm tên class CSS
function slugify(text) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .toLowerCase().trim().replace(/\s+/g, "-");
}

// "2026-10-20" -> "20/10/2026"
function formatDate(iso) {
  if (!iso) return "Không có hạn";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Quá hạn: chưa hoàn thành và hạn < hôm nay
function isOverdue(item) {
  if (item.status === "done" || !item.dueDate) return false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return item.dueDate < today;
}

function createBadge(text, className) {
  const span = document.createElement("span");
  span.className = `badge ${className}`;
  span.textContent = text;
  return span;
}

function createButton(text, className, action, id) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn ${className}`;
  btn.textContent = text;
  btn.dataset.action = action;
  btn.dataset.id = id;
  return btn;
}

// ---------- C1: Hiển thị dữ liệu từ mảng lên DOM ----------
function createTaskElement(item) {
  const li = document.createElement("li");
  li.className = `task-item prio-${slugify(item.priority)}`;
  if (item.status === "done") li.classList.add("is-done");

  const main = document.createElement("div");
  main.className = "task-main";

  const title = document.createElement("h3");
  title.className = "task-title";
  title.textContent = item.title;

  const meta = document.createElement("div");
  meta.className = "task-meta";
  meta.append(
    createBadge(item.priority, `badge-${slugify(item.priority)}`),
    createBadge(item.status === "done" ? "Đã hoàn thành" : "Chưa hoàn thành",
                item.status === "done" ? "badge-done" : "badge-pending")
  );
  if (isOverdue(item)) meta.append(createBadge("Quá hạn", "badge-overdue"));
  const due = document.createElement("span");
  due.textContent = `Hạn: ${formatDate(item.dueDate)}`;
  meta.append(due);

  main.append(title, meta);

  const actions = document.createElement("div");
  actions.className = "task-actions";
  actions.append(
    createButton(item.status === "done" ? "Hoàn tác" : "Hoàn thành", "btn-done", "toggle", item.id),
    createButton("Xóa", "btn-delete", "delete", item.id)
  );

  li.append(main, actions);
  return li;
}

// C3: lấy danh sách đã qua tìm kiếm (không phân biệt hoa/thường) và lọc trạng thái
function getVisibleItems() {
  const keyword = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  return items.filter(item =>
    item.title.toLowerCase().includes(keyword) &&
    (status === "all" || item.status === status)
  );
}

function render() {
  const visible = getVisibleItems();
  listEl.replaceChildren(...visible.map(createTaskElement));
  emptyEl.hidden = visible.length > 0;

  const doneCount = items.filter(i => i.status === "done").length;
  countEl.textContent = `Hiển thị ${visible.length}/${items.length} công việc · ${doneCount} đã hoàn thành`;
}

// ---------- C2: Thêm công việc từ form ----------
function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
  titleInput.classList.add("invalid");
  titleInput.focus();
}

function clearError() {
  errorBox.textContent = "";
  errorBox.hidden = true;
  titleInput.classList.remove("invalid");
}

form.addEventListener("submit", event => {
  event.preventDefault();
  const title = titleInput.value.trim();

  if (title === "") {
    showError("Vui lòng nhập tên công việc!");
    return;
  }

  clearError();
  const nextId = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
  items.push({
    id: nextId,
    title: title,
    dueDate: dueInput.value,
    priority: priorityInput.value,
    status: "pending"
  });

  form.reset();          // xóa nội dung form
  priorityInput.value = "Trung bình";
  titleInput.focus();
  render();              // cập nhật ngay, không tải lại trang
});

titleInput.addEventListener("input", clearError);

// ---------- C3: Tìm kiếm và lọc ----------
searchInput.addEventListener("input", render);
statusFilter.addEventListener("change", render);

// ---------- C4: Đánh dấu hoàn thành và xóa đúng công việc theo ID ----------
listEl.addEventListener("click", event => {
  const btn = event.target.closest("button[data-action]");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  if (btn.dataset.action === "toggle") {
    const item = items.find(i => i.id === id);
    if (item) item.status = item.status === "done" ? "pending" : "done";
  } else if (btn.dataset.action === "delete") {
    const index = items.findIndex(i => i.id === id);
    if (index !== -1) items.splice(index, 1);
  }
  render();
});

// Hiển thị lần đầu
render();