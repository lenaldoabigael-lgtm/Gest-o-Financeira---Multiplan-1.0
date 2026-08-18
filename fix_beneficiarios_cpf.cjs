const fs = require('fs');
let code = fs.readFileSync('components/ProposalModal.tsx', 'utf8');

const targetAdd = `  const handleAddBeneficiary = () => {
    if (!newBeneficiaryInput.nome) return;

    const newBeneficiary = {`;

const replacementAdd = `  const handleAddBeneficiary = () => {
    if (!newBeneficiaryInput.nome) return;
    
    if (newBeneficiaryInput.cpf && !validateCpfCnpj(newBeneficiaryInput.cpf)) {
      setAlertMessage('O CPF/CNPJ do beneficiário é inválido. Por favor, verifique.');
      return;
    }

    const newBeneficiary = {`;

const targetSubmit = `    if (!validateCpfCnpj(formData.cliente.cpfCnpj)) {
      setAlertMessage('O CPF ou CNPJ informado é inválido. Por favor, verifique os dígitos e tente novamente.');
      return;
    }`;

const replacementSubmit = `    if (!validateCpfCnpj(formData.cliente.cpfCnpj)) {
      setAlertMessage('O CPF ou CNPJ do Cliente é inválido. Por favor, verifique os dígitos e tente novamente.');
      return;
    }
    
    // Validate beneficiaries CPF if they exist
    const invalidBeneficiarios = formData.beneficiarios.filter(b => b.cpf && !validateCpfCnpj(b.cpf));
    if (invalidBeneficiarios.length > 0) {
      setAlertMessage(\`Existem beneficiários com CPF inválido: \${invalidBeneficiarios.map(b => b.nome).join(', ')}. Por favor, verifique.\`);
      return;
    }`;

if(code.includes(targetAdd)) {
  code = code.replace(targetAdd, replacementAdd);
  code = code.replace(targetSubmit, replacementSubmit);
  fs.writeFileSync('components/ProposalModal.tsx', code);
  console.log("Updated Beneficiarios CPF validation");
} else {
  console.log("Beneficiarios function target not found");
}
