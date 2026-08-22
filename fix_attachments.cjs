const fs = require('fs');
let code = fs.readFileSync('components/ProposalModal.tsx', 'utf8');

const targetAdd = `  const handleAddDocument = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const newDoc = {
          id: Math.random().toString(36).substr(2, 9),
          nome: file.name,
          data: new Date().toLocaleDateString('pt-BR'),
          tamanho: (file.size / 1024).toFixed(1) + ' KB',
          url: URL.createObjectURL(file)
        };
        setFormData(prev => ({
          ...prev,
          documentos: [...prev.documentos, newDoc]
        }));
      }
    };
    input.click();
  };`;

const replacementAdd = `  const handleAddDocument = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        // Verificar limite de tamanho (ex: 5MB) para evitar estourar o banco JSON
        if (file.size > 5 * 1024 * 1024) {
          setAlertMessage('O arquivo é muito grande. O tamanho máximo permitido é de 5MB.');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target?.result as string;
          const newDoc = {
            id: Math.random().toString(36).substr(2, 9),
            nome: file.name,
            data: new Date().toLocaleDateString('pt-BR'),
            tamanho: (file.size / 1024).toFixed(1) + ' KB',
            url: base64Url
          };
          setFormData(prev => ({
            ...prev,
            documentos: [...prev.documentos, newDoc]
          }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };`;

if(code.includes(targetAdd)) {
  code = code.replace(targetAdd, replacementAdd);
  fs.writeFileSync('components/ProposalModal.tsx', code);
  console.log("Updated Document Upload Logic");
} else {
  console.log("Document Upload function target not found");
}
