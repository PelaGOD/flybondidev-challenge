let dataset = [];

// Cargar dataset.json
async function loadDataset() {
  try {
    const response = await fetch("dataset.json");
    if (!response.ok) throw new Error("Error al cargar dataset.json");
    dataset = await response.json();

    // Inicializar select de orígenes
    const origins = Array.from(new Set(dataset.map(d => d.origin))).sort();
    const originSelect = document.getElementById("originSelect");
    origins.forEach(o => {
      const opt = document.createElement("option");
      opt.value = o;
      opt.textContent = o;
      originSelect.appendChild(opt);
    });
  } catch (error) {
    console.error("No se pudo cargar el dataset:", error);
  }
}

// Utils
const parseDate = s => new Date(s);
const daysBetween = (a, b) => Math.round((b - a) / (1000 * 60 * 60 * 24));

// Buscar combinaciones
function doSearch() {
  const origin = document.getElementById("originSelect").value;
  const budget = Number(document.getElementById("budgetInput").value) || 0;
  const maxDays = Number(document.getElementById("maxDays").value) || Infinity;
  const sortBy = document.getElementById("sortBy").value;

  const outbounds = dataset.filter(f => f.origin === origin);
  const inbounds = dataset.filter(f => f.destination === origin);

  const destinos = {};
  outbounds.forEach(out => {
    inbounds.forEach(back => {
      if (out.destination !== back.origin) return;

      const outDate = parseDate(out.date);
      const backDate = parseDate(back.date);
      if (outDate >= backDate) return;

      const duration = daysBetween(outDate, backDate);
      if (duration > maxDays) return;

      const totalPrice = out.price + back.price;
      const availability = Math.min(out.availability, back.availability);
      if (totalPrice > budget) return;

      const key = out.destination;
      const combo = { origin, destination: key, out, back, totalPrice, availability, duration };

      if (!destinos[key]) destinos[key] = [];
      destinos[key].push(combo);
    });
  });

  let results = Object.values(destinos).map(list => {
    list.sort((a, b) => a.totalPrice - b.totalPrice || a.duration - b.duration);
    return list[0];
  });

  if (sortBy === "price") results.sort((a, b) => a.totalPrice - b.totalPrice);
  if (sortBy === "duration") results.sort((a, b) => a.duration - b.duration);
  if (sortBy === "availability") results.sort((a, b) => b.availability - a.availability);

  renderResults(results);
}

// Render resultados
function renderResults(items) {
  const out = document.getElementById("output");
  out.innerHTML = "";

  if (items.length === 0) {
    out.innerHTML = '<div class="card empty">No hay opciones dentro del presupuesto.</div>';
    return;
  }

  items.forEach(it => {
    const div = document.createElement("div");
    div.className = "card flight";
    div.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-weight:700">${it.origin} → ${it.destination} → ${it.origin}</div>
          <div class="small">Salida: ${it.out.date} • Vuelta: ${it.back.date} • ${it.duration} días</div>
        </div>
        <div style="text-align:right">
          <div class="price">$ ${it.totalPrice.toFixed(2)}</div>
          <div class="small">${it.availability} asientos</div>
        </div>
      </div>
    `;
    out.appendChild(div);
  });
}

// Event listener
document.getElementById("searchBtn").addEventListener("click", doSearch);

// Inicializar
loadDataset();
