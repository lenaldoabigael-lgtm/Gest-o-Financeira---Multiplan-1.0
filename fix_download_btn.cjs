const fs = require('fs');
let code = fs.readFileSync('components/ProposalModal.tsx', 'utf8');

code = code.replace(
  /<button className="text-blue-500 hover:text-blue-700">\s*<i className="fa-solid fa-download text-\[10px\]"><\/i>\s*<\/button>/,
  `<button 
                          className="text-blue-500 hover:text-blue-700"
                          onClick={(e) => {
                            e.preventDefault();
                            if (doc.url) {
                              const link = document.createElement('a');
                              link.href = doc.url;
                              link.download = doc.nome;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              alert('Não foi possível fazer o download do documento. Arquivo original não encontrado.');
                            }
                          }}
                        >
                          <i className="fa-solid fa-download text-[10px]"></i>
                        </button>`
);

fs.writeFileSync('components/ProposalModal.tsx', code);
