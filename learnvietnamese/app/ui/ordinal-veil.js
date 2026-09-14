/**
 * Ordinal Veil — Sliding Segmented Station Selector (01–12)
 * Adapted from Enochian Knobs & Keys Control Atlas §6.1 & Freeform Mockup
 */

export class OrdinalVeilComponent {
  constructor(options = {}) {
    this.stations = options.stations || [
      { id: "station_01", label: "01", name: "01 Restaurant", available: true, hasFullLesson: false },
      { id: "station_02", label: "02", name: "02 Taxi", available: true, hasFullLesson: false },
      { id: "station_03", label: "03", name: "03 Café", available: true, hasFullLesson: true },
      { id: "station_04", label: "04", name: "04 Art Class", available: true, hasFullLesson: false },
      { id: "station_05", label: "05", name: "05 Gym", available: true, hasFullLesson: false },
      { id: "station_06", label: "06", name: "06 Meeting", available: true, hasFullLesson: false },
      { id: "station_07", label: "07", name: "07 Wi-Fi", available: true, hasFullLesson: false },
      { id: "station_08", label: "08", name: "08 Shopping", available: true, hasFullLesson: false },
      { id: "station_09", label: "09", name: "09 Directions", available: true, hasFullLesson: false },
      { id: "station_10", label: "10", name: "10 Everyday", available: true, hasFullLesson: false },
      { id: "station_11", label: "11", name: "11 Repair", available: true, hasFullLesson: false },
      { id: "station_12", label: "12", name: "12 Problem-Solving", available: true, hasFullLesson: false }
    ];
    this.activeStationId = options.activeStationId || "station_03";
    this.onStationChange = options.onStationChange || (() => {});
    this.element = null;
  }

  render() {
    const wrap = document.createElement("div");
    wrap.className = "npillwrap";
    wrap.id = "ordinal-veil";
    wrap.setAttribute("role", "radiogroup");
    wrap.setAttribute("aria-label", "Station selector");

    this.stations.forEach(station => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("role", "radio");
      const isActive = station.id === this.activeStationId;
      btn.setAttribute("aria-checked", String(isActive));
      btn.setAttribute("aria-label", station.name ? (station.available ? station.name : `${station.name} (Coming Soon)`) : `Station ${station.label}`);
      btn.className = isActive ? "is-active" : "";
      btn.textContent = station.label;

      btn.addEventListener("click", () => {
        this.setActiveStation(station.id);
        this.onStationChange(station.id);
      });

      btn.addEventListener("keydown", (e) => {
        const currentIndex = this.stations.findIndex(s => s.id === station.id);
        let targetIndex = -1;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          targetIndex = (currentIndex + 1) % this.stations.length;
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          targetIndex = (currentIndex - 1 + this.stations.length) % this.stations.length;
        } else if (e.key === "Home") {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          targetIndex = 0;
        } else if (e.key === "End") {
          if (typeof e.preventDefault === 'function') e.preventDefault();
          targetIndex = this.stations.length - 1;
        }

        if (targetIndex !== -1) {
          const targetStation = this.stations[targetIndex];
          this.setActiveStation(targetStation.id);
          this.onStationChange(targetStation.id);
          const allBtns = wrap.querySelectorAll("button");
          if (allBtns[targetIndex] && typeof allBtns[targetIndex].focus === 'function') {
            allBtns[targetIndex].focus();
          }
        }
      });

      wrap.appendChild(btn);
    });

    this.element = wrap;
    return wrap;
  }

  setActiveStation(stationId) {
    this.activeStationId = stationId;
    if (!this.element) return;
    const buttons = this.element.querySelectorAll("button");
    buttons.forEach((btn, idx) => {
      const station = this.stations[idx];
      if (!station) return;
      const isActive = station.id === stationId;
      btn.setAttribute("aria-checked", String(isActive));
      if (isActive) {
        btn.classList.add("is-active");
      } else {
        btn.classList.remove("is-active");
      }
    });
  }
}
