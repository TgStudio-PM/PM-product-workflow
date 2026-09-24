(() => {
  const STORAGE_KEY = "pmwf-material-submission-demo-v1";
  const form = document.querySelector("#application-form");
  const description = document.querySelector("#application-description");
  const checkboxes = [...document.querySelectorAll('input[name="materials"]')];
  const statusLabel = document.querySelector("#status-label");
  const indicator = document.querySelector("#draft-indicator");
  const descriptionError = document.querySelector("#description-error");
  const materialsError = document.querySelector("#materials-error");
  const characterCount = document.querySelector("#character-count");
  const checkedCount = document.querySelector("#checked-count");
  const saveButton = document.querySelector("#save-draft");
  const submitButton = document.querySelector("#submit-application");
  const resetButton = document.querySelector("#reset-demo");
  const submittedPanel = document.querySelector("#submitted-panel");
  const flowSteps = [...document.querySelectorAll(".steps-list li")];

  function readState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const value = JSON.parse(raw);
      if (!value || typeof value !== "object") return null;
      return {
        description: typeof value.description === "string" ? value.description.slice(0, 500) : "",
        materials: Array.isArray(value.materials) ? value.materials.filter(item => checkboxes.some(box => box.value === item)) : [],
        status: value.status === "已提交" ? "已提交" : "草稿"
      };
    } catch {
      return null;
    }
  }

  function updateCounters() {
    characterCount.textContent = `${description.value.length} / 500`;
    const count = checkboxes.filter(box => box.checked).length;
    checkedCount.textContent = String(count);
    return count;
  }

  function setStatus(status) {
    const submitted = status === "已提交";
    statusLabel.textContent = submitted ? "已提交" : "草稿";
    form.dataset.status = submitted ? "submitted" : "draft";
    description.readOnly = submitted;
    description.disabled = submitted;
    checkboxes.forEach(box => { box.disabled = submitted; });
    saveButton.disabled = submitted;
    submitButton.disabled = submitted;
    indicator.innerHTML = submitted ? "<span></span>内容已锁定" : "<span></span>草稿已暂存";
    submittedPanel.hidden = !submitted;
    flowSteps.forEach((step, index) => {
      step.classList.toggle("step-current", submitted ? index === 2 : index === 0);
    });
  }

  function saveDraft() {
    if (form.dataset.status === "submitted") return;
    const state = {
      description: description.value,
      materials: checkboxes.filter(box => box.checked).map(box => box.value),
      status: "草稿"
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStatus("草稿");
      indicator.innerHTML = "<span></span>草稿已暂存";
    } catch {
      indicator.innerHTML = "<span></span>暂存失败，请检查浏览器存储设置";
    }
  }

  function restoreDraft() {
    const state = readState();
    if (state) {
      description.value = state.description;
      checkboxes.forEach(box => { box.checked = state.materials.includes(box.value); });
      setStatus(state.status);
    } else {
      setStatus("草稿");
      indicator.innerHTML = "<span></span>新建草稿";
    }
    updateCounters();
  }

  description.addEventListener("input", () => {
    descriptionError.hidden = true;
    updateCounters();
    saveDraft();
  });
  checkboxes.forEach(box => box.addEventListener("change", () => {
    materialsError.hidden = true;
    updateCounters();
    saveDraft();
  }));
  saveButton.addEventListener("click", saveDraft);

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (form.dataset.status === "submitted") return;
    const descriptionValid = description.value.trim().length > 0;
    const materialsValid = updateCounters() === checkboxes.length;
    descriptionError.hidden = descriptionValid;
    materialsError.hidden = materialsValid;
    if (!descriptionValid) description.focus();
    if (!descriptionValid || !materialsValid) return;

    const state = {
      description: description.value,
      materials: checkboxes.map(box => box.value),
      status: "已提交"
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      indicator.innerHTML = "<span></span>本地保存不可用，无法完成演示提交";
      return;
    }
    setStatus("已提交");
    submittedPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  resetButton.addEventListener("click", () => {
    if (!window.confirm("清除本页保存的演示数据，并重新开始？")) return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      indicator.innerHTML = "<span></span>清除失败，请检查浏览器存储设置";
      return;
    }
    form.reset();
    descriptionError.hidden = true;
    materialsError.hidden = true;
    submittedPanel.hidden = true;
    setStatus("草稿");
    indicator.innerHTML = "<span></span>已清除，可重新填写";
    updateCounters();
    description.focus();
  });

  restoreDraft();
})();
