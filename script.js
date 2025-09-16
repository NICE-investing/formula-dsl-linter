import init, {
  lint_to_json,
  lint_is_valid,
} from "./pkg/formula_linter_wasm.js";

let wasmModule = null;

function logDebug(message) {
  console.log(message);
  const debugDiv = document.getElementById("debug-content");
  const timestamp = new Date().toLocaleTimeString();
  debugDiv.innerHTML += `<div class="debug-item">${timestamp}: ${message}</div>`;
  debugDiv.scrollTop = debugDiv.scrollHeight;
}

function setFormula(e) {
  if (e.target.classList.contains("example-item")) {
    const formula = e.target.textContent.trim();
    document.getElementById("formula").value = formula;
    document.getElementById("formula").focus();
  }
}

function handleSubmit(event) {
  event.preventDefault();
  lintFormula();
}

async function initWasm() {
  try {
    logDebug("Starting WASM initialization...");
    wasmModule = await init();
    logDebug("WASM module loaded successfully");
    document.getElementById("result-content").innerHTML =
      '<span style="color: #059669;">✅ WASM module ready!</span>';
    document.getElementById("result-content").className =
      "result-content success";
  } catch (error) {
    logDebug(`Failed to load WASM module: ${error}`);
    document.getElementById(
      "result-content"
    ).innerHTML = `<span style="color: #dc2626;">❌ WASM load error: ${error}</span>`;
    document.getElementById("result-content").className =
      "result-content error";
  }
}

function initEvent() {
  document
    .querySelector(".formula-form")
    .addEventListener("submit", handleSubmit);
  document
    .querySelector(".lint-button")
    .addEventListener("click", handleSubmit);
  document.querySelector(".examples").addEventListener("click", setFormula);
}

const lintFormula = async function () {
  const formula = document.getElementById("formula").value;
  const resultDiv = document.getElementById("result-content");

  logDebug(`Linting formula: "${formula}"`);

  if (!wasmModule) {
    const errorMsg = "WASM module not loaded";
    logDebug(errorMsg);
    resultDiv.innerHTML = `<span style="color: #dc2626;">❌ ${errorMsg}</span>`;
    resultDiv.className = "result-content error";
    return;
  }

  try {
    logDebug("Calling lint_to_json...");
    const result = lint_to_json(formula);
    logDebug(`Got result: ${JSON.stringify(result)}`);

    const diagnostics = result.results;
    const isValid = result.is_valid;

    console.log(result);
    if (isValid) {
      // JSON 문자열을 파싱해서 예쁘게 포맷팅
      const jsonString = diagnostics[0].Success;
      let formattedJson;
      try {
        const parsedJson = JSON.parse(jsonString);
        formattedJson = JSON.stringify(parsedJson, null, 2);
      } catch (e) {
        // 파싱 실패시 원본 문자열 사용
        formattedJson = jsonString;
      }

      resultDiv.innerHTML =
        '<span style="color: #059669;">✅ Formula is valid!</span>' +
        '<div style="margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 6px; font-family: monospace; font-size: 12px;">' +
        "<strong>Generated JSON:</strong><br>" +
        '<pre style="margin: 8px 0; white-space: pre-wrap; color: #374151;">' +
        formattedJson.replace(/"/g, "&quot;") +
        "</pre>" +
        "</div>";
      resultDiv.className = "result-content success";
    } else {
      let html = '<span style="color: #dc2626;">❌ Formula has errors:</span>';

      if (diagnostics.length > 0) {
        html += '<ul class="diagnostic-list">';
        diagnostics.forEach((diagnostic) => {
          const error = diagnostic.Error;
          const severity = error.severity;
          const message = error.message;
          const severityClass = severity.toLowerCase().replace(" ", "-");
          html += `<li class="diagnostic-item ${severityClass}">${severity}: ${message}</li>`;
        });
        html += "</ul>";
      }

      resultDiv.innerHTML = html;
      resultDiv.className = "result-content error";
    }

    logDebug("Lint completed successfully");
  } catch (error) {
    const errorMsg = `Error during linting: ${error}`;
    logDebug(errorMsg);
    resultDiv.innerHTML = `<span style="color: #dc2626;">❌ ${errorMsg}</span>`;
    resultDiv.className = "result-content error";
  }
};

// Initialize WASM when page loads
logDebug("Page loaded, initializing WASM...");
initWasm();
initEvent();
