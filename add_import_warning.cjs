const fs = require('fs');
let code = fs.readFileSync('components/ProposalsView.tsx', 'utf8');

const target1 = `                  <p className="text-sm font-bold text-slate-500">Foram encontradas {importPreviewData.length} propostas na planilha.</p>
                </div>
              </div>`;

const replacement1 = `                  <p className="text-sm font-bold text-slate-500">Foram encontradas {importPreviewData.length} propostas na planilha.</p>
                </div>
              </div>
              
              {importPreviewData.filter(p => p.contrato.startsWith('IMP-')).length > 0 && (
                <div className="ml-auto mr-4 flex items-center gap-3 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200">
                  <i className="fa-solid fa-triangle-exclamation text-amber-500 text-lg"></i>
                  <div className="text-xs font-bold">
                    <span className="block">{importPreviewData.filter(p => p.contrato.startsWith('IMP-')).length} proposta(s) sem contrato!</span>
                    <span className="text-[10px] opacity-80">IDs provisórios (IMP-...) foram gerados.</span>
                  </div>
                </div>
              )}`;

code = code.replace(target1, replacement1);

const target2 = `                  <td className="p-4">
                    <div className="font-bold text-blue-600">{p.contrato}</div>
                    <div className="text-[10px] text-slate-400 font-bold">{p.data}</div>
                  </td>`;

const replacement2 = `                  <td className="p-4">
                    <div className="font-bold text-blue-600 flex items-center gap-2">
                      {p.contrato}
                      {p.contrato.startsWith('IMP-') && (
                        <i className="fa-solid fa-triangle-exclamation text-amber-500" title="Número de contrato provisório (gerado automaticamente)"></i>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold">{p.data}</div>
                  </td>`;
code = code.replace(target2, replacement2);

const target3 = `                          <td className="p-4">
                            <div className="font-bold text-blue-600">{p.contrato}</div>
                          </td>`;

const replacement3 = `                          <td className="p-4">
                            <div className="font-bold text-blue-600 flex items-center gap-2">
                              {p.contrato}
                              {p.contrato.startsWith('IMP-') && (
                                <i className="fa-solid fa-triangle-exclamation text-amber-500" title="Número de contrato provisório (gerado automaticamente)"></i>
                              )}
                            </div>
                          </td>`;

code = code.replace(target3, replacement3);

fs.writeFileSync('components/ProposalsView.tsx', code);
