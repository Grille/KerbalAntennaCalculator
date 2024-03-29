let tables
let config1 = {}, config2 = {};
let globalZ = 0;

function createAntenna(power, relay, comb, amount) {
  return { power, relay, comb, amount }
}
function addAntennaType(antennas, power, relay, comb, amount){
  antennas.push({ power, relay, comb, amount });
} 
function deleteAntennaType(antennas, id) {
  antennas[id] = null;
  for (let i = id + 1; i < antennas.length; i++) {
    antennas[i - 1] = antennas[i];
  }
  antennas.length -= 1;
}
function calcAntennaPower(config, relay) {
  let { antennas } = config;
  let maxPower = 0;
  let maxSinglePower = 0;
  let sumPower = 0;
  for (let i = 0; i < antennas.length; i++) {
    let antenna = antennas[i];
    if (!relay || antenna.relay) {
      if (antenna.comb) {
        sumPower += antenna.power * antenna.amount;
        maxPower = Math.max(maxPower, antenna.power);
      }
      else {
        maxSinglePower = Math.max(maxSinglePower, antenna.power);
      }
    }
  }
  let combinabilityExp = (sumPower * 0.75) / sumPower;
  let resultPower; 
  if (maxPower > 0)
    resultPower = maxPower * Math.pow(sumPower / maxPower, combinabilityExp);
  else
    resultPower = 0;
  return Math.max(resultPower, maxSinglePower);
}
function round(number) {
  return ((number * 1E3) | 0) / 1E3;
}
function formatNumber(number) {
  if (number >= 1E15) return round(number / 1E15) + "P";
  else if (number >= 1E12) return round(number / 1E12) + "T";
  else if (number >= 1E9) return round(number / 1E9) + "G";
  else if (number >= 1E6) return round(number / 1E6) + "M";
  else if (number >= 1E3) return round(number / 1E3) + "K";
  else return number + "";
}
function parseNumber(text){
  text = text.trim().replace(/,/g, '');
  let unit = text.slice(-1).toUpperCase();
  let float = parseFloat(text);
  if (float === NaN) return 0;
  switch (unit) {
    case "K": return float *= 1E3;
    case "M": return float *= 1E6;
    case "G": return float *= 1E9;
    case "T": return float *= 1E12;
    case "P": return float *= 1E15;
    default: return float;
  }
}
function refreshSum(id, config){
  config.directPower = calcAntennaPower(config, false);
  window[id + "_directPower"].innerText = formatNumber(config.directPower);
  config.relayPower = calcAntennaPower(config, true);
  window[id + "_relayPower"].innerText = formatNumber(config.relayPower);
  refreshResult();
}
function initPanel(id, config) {
  let newAntenna = { power: 5000, relay: false, combinable: true, amount: 1 };
  refreshSum(id, config);
  refreshTable(config, id, newAntenna);
}
function initDragbar(panel, dragbar) {
  let down = false;
  panel.onmousedown = () => {
    panel.style.zIndex = ++globalZ;
  }
  dragbar.onmousedown = () => {
    down = true;
    if (window.getSelection) {window.getSelection().removeAllRanges();}
    else if (document.selection) {document.selection.empty();}
    document.body.style.userSelect = "none";
    dragbar.style.cursor = "grabbing"
  }
  window.addEventListener("mouseup", () => {
    down = false;
    document.body.style.userSelect = "auto";
    dragbar.style.cursor = "grab"
  });
  window.addEventListener("mousemove", (e) => {
    if (down) {
      if (panel.style.left === "") panel.style.left = "0px";
      panel.style.left = (parseInt(panel.style.left) + e.movementX) + "px";
      if (panel.style.top === "") panel.style.top = "0px";
      let parsed = parseInt(panel.style.top);
      if (parsed < 0) parsed = 0;
      panel.style.top = (parsed + e.movementY) + "px";
    }
  });
}
function addRow(html, antenna, id) {
  html += `<th><input id="${id}_p" value="${formatNumber(antenna.power)}" spellcheck="false"></th>`;
  html += `<th><input id="${id}_r" ${antenna.relay ? 'checked' : ''} type="checkbox"><label for="${id}_r"><span></span></label></th>`;
  html += `<th><input id="${id}_c" ${antenna.comb ? 'checked' : ''} type="checkbox"><label for="${id}_c"><span></span></label></th>`;
  html += `<th><input id="${id}_a" value="${antenna.amount}" spellcheck="false"></th>`;
  return html;
}
function setRowEvents(antenna, id, i, config) {
  let idi = `${id}_${i}`;
  window[`${idi}_p`].onkeydown = window[`${idi}_p`].oninput = () => {
    antenna.power = parseNumber(window[`${idi}_p`].value);
    refreshSum(id, config);
  }
  window[`${idi}_r`].onkeydown = window[`${idi}_r`].oninput = () => {
    antenna.relay = window[`${idi}_r`].checked;
    refreshSum(id, config);
  }
  window[`${idi}_c`].onkeydown = window[`${idi}_c`].oninput = () => {
    antenna.comb = window[`${idi}_c`].checked;
    refreshSum(id, config);
  }
  window[`${idi}_a`].onkeydown = window[`${idi}_a`].oninput = () => {
    antenna.amount = parseNumber(window[`${idi}_a`].value) | 0;
    refreshSum(id, config);
  }
}
function refreshTable(config, id, newAntenna) {
  let {antennas} = config;
  let div = window[id + "_table"];
  let html = ``;
  html += `<table>`;
  html += `<tr>`;
  html += `<th><h4>Power</h4></th>`;
  html += `<th><h4>Relay</h4></th>`;
  html += `<th><h4>Combinable</h4></th>`;
  html += `<th><h4>Amount</h4></th>`;
  html += `<th><button id="${id}_add" class="add">+</button></th>`;
  html += `</tr>`;
  for (let i = 0; i < antennas.length; i++) {
    let antenna = antennas[i];
    html += `<tr>`;
    html = addRow(html, antenna, `${id}_${i}`);
    html += `<th><button id="${id}_${i}_d" class="delete">X</button></th>`;
    html += `</tr>`;
  }
  html += `</table>`;
  div.innerHTML = html;

  for (let i = 0; i < antennas.length; i++) {
    let antenna = antennas[i];
    setRowEvents(antenna, id, i, config);
    window[`${id}_${i}_d`].onclick = () => {
      deleteAntennaType(antennas, i);
      refreshTable(config, id, newAntenna);
    }
  }
  window[`${id}_add`].onclick = () => {
    let antenna = antennas.length > 0 ? antennas[antennas.length - 1] : { power: 5000, relay: false, combinable: true, amount: 1 };
    addAntennaType(antennas, antenna.power, antenna.relay, antenna.comb, antenna.amount);
    refreshTable(config, id, newAntenna);
  }
  refreshSum(id, config);
}
initPanel("html_panel1", config1 = {
  name: "Tracking Station III",
  antennas: [createAntenna(250E9, true, false, 1)],
});
initPanel("html_panel2", config2 = {
  name: "Comsat I",
  antennas: [createAntenna(20E6, true, true, 4), createAntenna(100E9, false, false, 1)],
});
initDragbar(html_panel1, html_panel1_dragbar);
initDragbar(html_panel2, html_panel2_dragbar);
initDragbar(html_panel, html_panel_dragbar);

function refreshResult() {
  let id = "html_panel";
  window[id + "_directDist"].innerText = formatNumber(Math.sqrt(config1.directPower * config2.directPower)) + "m";
  window[id + "_relayDist"].innerText = formatNumber(Math.sqrt(config1.relayPower * config2.relayPower)) + "m";
}

