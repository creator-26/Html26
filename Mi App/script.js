const UNITS = [
  {id:'us', label:'Microsegundo', abbr:'µs', sec:1e-6},
  {id:'ms', label:'Milisegundo', abbr:'ms', sec:1e-3},
  {id:'s', label:'Segundo', abbr:'s', sec:1},
  {id:'min', label:'Minuto', abbr:'min', sec:60},
  {id:'h', label:'Hora', abbr:'h', sec:3600},
  {id:'d', label:'Día', abbr:'d', sec:86400},
  {id:'w', label:'Semana', abbr:'sem', sec:604800},
  {id:'mo', label:'Mes', abbr:'mes', sec:2629800},
  {id:'y', label:'Año', abbr:'año', sec:31557600},
  {id:'dec', label:'Década', abbr:'déc', sec:315576000},
  {id:'c', label:'Siglo', abbr:'sig', sec:3155760000}
];
const unitById = id => UNITS.find(u => u.id === id);

function pluralLabel(u){
  const map = {us:'microsegundos',ms:'milisegundos',s:'segundos',min:'minutos',h:'horas',d:'días',w:'semanas',mo:'meses',y:'años',dec:'décadas',c:'siglos'};
  return map[u.id];
}

function roundSmart(n){
  if(!isFinite(n)) return 0;
  const m = Math.abs(n);
  let d;
  if(m === 0) d = 0; else if(m >= 1000) d = 2; else if(m >= 1) d = 4; else d = 8;
  return parseFloat(n.toFixed(d));
}
function formatNice(n){
  return new Intl.NumberFormat('es-ES', {maximumFractionDigits: 6}).format(roundSmart(n));
}
function computeFormula(fU, tU){
  const ratio = fU.sec / tU.sec;
  if(ratio >= 1) return 'Fórmula: multiplica el valor por ' + formatNice(ratio);
  return 'Fórmula: divide el valor entre ' + formatNice(1/ratio);
}

const fromValueEl = document.getElementById('fromValue');
const toValueEl = document.getElementById('toValue');
const fromUnitEl = document.getElementById('fromUnit');
const toUnitEl = document.getElementById('toUnit');
const fromSuffix = document.getElementById('fromSuffix');
const toSuffix = document.getElementById('toSuffix');
const fromEcho = document.getElementById('fromEcho');
const resultBig = document.getElementById('resultBig');
const formulaText = document.getElementById('formulaText');
const swapBtn = document.getElementById('swapBtn');

function populate(sel){
  UNITS.forEach(u => {
    const o = document.createElement('option');
    o.value = u.id;
    o.textContent = u.label;
    sel.appendChild(o);
  });
}
populate(fromUnitEl);
populate(toUnitEl);
fromUnitEl.value = 'h';
toUnitEl.value = 'd';
fromUnitEl.dataset.prev = 'h';
toUnitEl.dataset.prev = 'd';

function updateDisplay(fU, tU, fv, tv){
  fromEcho.textContent = formatNice(fv) + ' ' + pluralLabel(fU);
  resultBig.textContent = '= ' + formatNice(tv) + ' ' + pluralLabel(tU);
  formulaText.textContent = computeFormula(fU, tU);
  fromSuffix.textContent = fU.abbr;
  toSuffix.textContent = tU.abbr;
}
function recalcFromTo(){
  const fU = unitById(fromUnitEl.value), tU = unitById(toUnitEl.value);
  const fv = parseFloat(fromValueEl.value) || 0;
  const tv = fv * fU.sec / tU.sec;
  toValueEl.value = roundSmart(tv);
  updateDisplay(fU, tU, fv, tv);
}
function recalcToFrom(){
  const fU = unitById(fromUnitEl.value), tU = unitById(toUnitEl.value);
  const tv = parseFloat(toValueEl.value) || 0;
  const fv = tv * tU.sec / fU.sec;
  fromValueEl.value = roundSmart(fv);
  updateDisplay(fU, tU, fv, tv);
}
fromValueEl.addEventListener('input', recalcFromTo);
toValueEl.addEventListener('input', recalcToFrom);
fromUnitEl.addEventListener('change', () => {
  const newVal = fromUnitEl.value;
  if(newVal === toUnitEl.value){
    toUnitEl.value = fromUnitEl.dataset.prev;
    toUnitEl.dataset.prev = toUnitEl.value;
  }
  fromUnitEl.dataset.prev = newVal;
  recalcFromTo();
});
toUnitEl.addEventListener('change', () => {
  const newVal = toUnitEl.value;
  if(newVal === fromUnitEl.value){
    fromUnitEl.value = toUnitEl.dataset.prev;
    fromUnitEl.dataset.prev = fromUnitEl.value;
  }
  toUnitEl.dataset.prev = newVal;
  recalcFromTo();
});
swapBtn.addEventListener('click', () => {
  const fu = fromUnitEl.value, tu = toUnitEl.value;
  const fv = fromValueEl.value, tv = toValueEl.value;
  fromUnitEl.value = tu;
  toUnitEl.value = fu;
  fromUnitEl.dataset.prev = tu;
  toUnitEl.dataset.prev = fu;
  fromValueEl.value = tv;
  toValueEl.value = fv;
  recalcFromTo();
});
recalcFromTo();
  
