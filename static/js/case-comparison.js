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

function metricsHtml(base, grpo) {
  return `
    <div class="metric-table" aria-label="Diversity metric comparison">
      <div class="metric-cell metric-name">Metric</div>
      <div class="metric-cell metric-name">Baseline / GRPO</div>
      <div class="metric-cell metric-name">Vendi Score</div>
      <div class="metric-cell"><strong>${base.vendi_score.toFixed(3)} / ${grpo.vendi_score.toFixed(3)}</strong></div>
      <div class="metric-cell metric-name">Average Cosine Distance</div>
      <div class="metric-cell"><strong>${base.avg_pairwise_cosine_distance.toFixed(3)} / ${grpo.avg_pairwise_cosine_distance.toFixed(3)}</strong></div>
    </div>`;
}

function audioGroupHtml(id, version, transcript) {
  const folder = version === "GRPO" ? "grpo" : "base";
  const clips = Array.from({ length: 10 }, (_, index) => {
    const sampleNumber = index + 1;
    return `
      <div class="audio-clip">
        <span>${String(sampleNumber).padStart(2, "0")}</span>
        <audio controls preload="none" aria-label="${version} audio sample ${sampleNumber}">
          <source src="static/audio/${id}/${folder}/run_${sampleNumber}.wav" type="audio/wav">
        </audio>
      </div>`;
  }).join("");

  return `
    <section class="audio-group ${version === "GRPO" ? "after" : "before"}" aria-label="${version} audio group">
      <h4>${version}</h4>
      <div class="audio-clip-grid">${clips}</div>
      <p class="transcript"><span class="field-label">Transcript</span>${escapeHtml(transcript.results[0]?.transcript || "Transcript unavailable.")}</p>
    </section>`;
}

async function renderCase(config) {
  const basePath = `static/audio/${config.id}/base`;
  const grpoPath = `static/audio/${config.id}/grpo`;
  const [baseMeta, grpoMeta, baseTranscript, grpoTranscript] = await Promise.all([
    loadJson(`${basePath}/meta.json`),
    loadJson(`${grpoPath}/meta.json`),
    loadJson(`${basePath}/transcript.json`),
    loadJson(`${grpoPath}/transcript.json`)
  ]);

  return `
    <section class="comparison-case" aria-label="${config.label} before and after comparison">
      <div class="case-header">
        <div class="case-details">
          <p class="case-label">${config.label}</p>
          <p><span class="field-label">Synthesis Instruction</span>${escapeHtml(baseMeta.instruct)}</p>
          <p><span class="field-label">Source Text</span>${escapeHtml(baseMeta.text)}</p>
        </div>
        ${metricsHtml(baseMeta, grpoMeta)}
      </div>
      <div class="audio-group-comparison" aria-label="Baseline and GRPO audio groups">
        ${audioGroupHtml(config.id, "Baseline", baseTranscript)}
        ${audioGroupHtml(config.id, "GRPO", grpoTranscript)}
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
