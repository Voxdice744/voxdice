const caseConfigs = [
  { id: "aps", label: "Case 01 · APS" },
  { id: "dsd", label: "Case 02 · DSD" },
  { id: "rp", label: "Case 03 · RP" }
];

const comparisonRoot = document.getElementById("case-comparison");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function loadJson(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Unable to load ${path}`);
  }
  return response.json();
}

function audioGroupHtml(id, version, sampleNumbers) {
  const folder = version === "GRPO" ? "grpo" : "base";
  const clips = sampleNumbers.map((sampleNumber, displayIndex) => {
    const displayNumber = displayIndex + 1;
    return `
      <div class="audio-clip">
        <span>${displayNumber}</span>
        <audio controls preload="none" aria-label="${version} audio sample ${displayNumber}">
          <source src="static/audio/${id}/${folder}/run_${sampleNumber}.wav" type="audio/wav">
        </audio>
      </div>`;
  }).join("");

  return `
    <section class="audio-group ${version === "GRPO" ? "after" : "before"}" aria-label="${version} audio group">
      <h4>${version}</h4>
      <div class="audio-clip-grid">${clips}</div>
    </section>`;
}

function randomSampleNumbers() {
  return Array.from({ length: 10 }, (_, index) => index + 1)
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .sort((a, b) => a - b);
}

async function renderCase(config) {
  const basePath = `static/audio/${config.id}/base`;
  const baseMeta = await loadJson(`${basePath}/meta.json`);
  const sampleNumbers = randomSampleNumbers();

  return `
    <section class="comparison-case" aria-label="${config.label} before and after comparison">
      <div class="case-header">
        <div class="case-details">
          <p class="case-label">${config.label}</p>
          <p><span class="field-label">Synthesis Instruction</span>${escapeHtml(baseMeta.instruct)}</p>
        </div>
      </div>
      <div class="audio-group-comparison" aria-label="Baseline and GRPO audio groups">
        ${audioGroupHtml(config.id, "Baseline", sampleNumbers)}
        ${audioGroupHtml(config.id, "GRPO", sampleNumbers)}
      </div>
    </section>`;
}

if (comparisonRoot) {
  Promise.all(caseConfigs.map(renderCase))
    .then((cases) => {
      comparisonRoot.innerHTML = cases.join("");
    })
    .catch(() => {
      comparisonRoot.innerHTML = '<p class="comparison-error">Case comparison assets could not be loaded.</p>';
    });
}
