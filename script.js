const toast = document.getElementById("toast");
let toastTimer;

async function copyHex(hex) {
  try {
    await navigator.clipboard.writeText(hex);
    showToast(`Copied ${hex}`);
  } catch {
    const area = document.createElement("textarea");
    area.value = hex;
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showToast(`Copied ${hex}`);
  }
}

function showToast(message) {
  toast.hidden = false;
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 1600);
}

document.querySelectorAll("[data-hex]").forEach((el) => {
  el.addEventListener("click", () => {
    copyHex(el.dataset.hex);
  });
});
