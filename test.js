const p = { cliente: "ESMERALDA BARBOZA DA SILVA", cpfCnpj: "123", contrato: "ABC" };
const searchTerm = "ESMERALDA   BARBOZA";
const searchTerms = searchTerm.toLowerCase().trim().split(/\s+/);
const matchSearch = searchTerms.every(term => 
  (p.cliente || '').toLowerCase().includes(term) || 
  (p.cpfCnpj || '').toLowerCase().includes(term) || 
  (p.contrato || '').toLowerCase().includes(term)
);
console.log(matchSearch);
