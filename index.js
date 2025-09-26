const API_URL = "http://127.0.0.1:3001/events";
let currentFilter = "";
let currentSearch = "";
let currentPriceFilter = "";

document.addEventListener("DOMContentLoaded", () => {
  loadEvents();

  // filter
  document.querySelectorAll("#sport-tabs button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#sport-tabs button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.sport;
      loadEvents();
    });
  });

  // Search
  document.getElementById("search-input").addEventListener("input", (e) => {
    currentSearch = e.target.value.trim();
    loadEvents();
  });

  // Reset
  document.getElementById("btn-reset").addEventListener("click", () => {
    currentFilter = "";
    currentSearch = "";
    document.getElementById("search-input").value = "";
    document.querySelectorAll("#sport-tabs button").forEach(b => b.classList.remove("active"));
    loadEvents();
  });
});

document.getElementById("filter-input").addEventListener("input", (e) => {
  currentSearch = e.target.value.trim(); 
  loadEvents();
});

// Price filter dropdown
document.getElementById("price-filter").addEventListener("change", (e) => {
  currentPriceFilter = e.target.value; 
  loadEvents();
});


async function loadEvents() {
  const container = document.getElementById("product-container");
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Fetch failed");
    let data = await res.json();

    if (currentFilter) {
      data = data.filter(ev => ev.sport.toLowerCase() === currentFilter.toLowerCase());
    }
    if (currentSearch) {
      data = data.filter(ev => ev.title.toLowerCase().includes(currentSearch.toLowerCase()));
    }
    if (currentPriceFilter) {
      data = data.filter(ev => {
        const price = Number(ev.price);
        if (currentPriceFilter === "low") return price < 500;
        if (currentPriceFilter === "mid") return price >= 500 && price <= 1000;
        if (currentPriceFilter === "high") return price > 1000;
        return true;
      });
    }

    renderEvents(data);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div class="col-12"><div class="alert alert-danger"> Failed to load games</div></div>`;
  }
}


function renderEvents(events) {
  const container = document.getElementById("product-container");
  container.innerHTML = "";
  if (!events.length) {
    container.innerHTML = `<div class="col-12"><div class="alert alert-info">No events found</div></div>`;
    return;
  }

  events.forEach(ev => {
    container.innerHTML += `
      <div class="col-lg-4 col-md-6 mb-3">
        <div class="card h-100 shadow-sm">
          <img src="${ev.thumbnail}" class="card-img-top" alt="${ev.title}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${ev.title}</h5>
            <p class="small text-muted">${ev.sport} • ${ev.date} ${ev.time}</p>
            <p class="card-text">${ev.stadium}</p>
            <div class="mt-auto d-flex justify-content-between align-items-center">
              <span class="badge bg-primary">Ksh ${ev.price}</span>
              <span class="badge bg-secondary">${ev.tickets} tickets</span>
              ${ev.tickets > 0 
  ? `<button class="btn btn-sm btn-success" onclick="buyTicket(${ev.id})">Buy</button>` 
  : `<span class="badge bg-danger">Sold Out</span>`}
            </div>
          </div>
        </div>
      </div>`;
  });
}


async function buyTicket(id) {
  try {
    // Fetch the latest event data
    const res = await fetch(`${API_URL}/${id}`);
    if (!res.ok) throw new Error("Failed to fetch event");

    const ev = await res.json();

    if (ev.tickets <= 0) {
      alert("Tickets sold out!");
      return;
    }

    // Update tickets count
    const updatedEvent = { ...ev, tickets: Number(ev.tickets) - 1 };

    const updateRes = await fetch(`${API_URL}/${id}`, {
      method: "PUT", // 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedEvent)
    });

    if (!updateRes.ok) throw new Error("Failed to update tickets");

    // Refresh events
    loadEvents();
  } catch (err) {
    console.error("❌ Error processing ticket:", err);
    alert("Error processing ticket purchase. Try again.");
  }
}
