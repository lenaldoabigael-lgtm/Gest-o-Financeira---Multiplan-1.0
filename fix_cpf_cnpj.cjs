const fs = require('fs');
let code = fs.readFileSync('components/ProposalModal.tsx', 'utf8');

const targetFunction = `const formatCpfCnpj = (value: string) => {
  const digits = value.replace(/\\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\\d{3})(\\d)/, '$1.$2')
      .replace(/(\\d{3})(\\d)/, '$1.$2')
      .replace(/(\\d{3})(\\d{1,2})/, '$1-$2')
      .replace(/(-\\d{2})\\d+?$/, '$1');
  } else {
    return digits
      .replace(/(\\d{2})(\\d)/, '$1.$2')
      .replace(/(\\d{3})(\\d)/, '$1.$2')
      .replace(/(\\d{3})(\\d)/, '$1/$2')
      .replace(/(\\d{4})(\\d{1,2})/, '$1-$2')
      .replace(/(-\\d{2})\\d+?$/, '$1');
  }
};`;

const replacementFunction = `const formatCpfCnpj = (value: string) => {
  const digits = value.replace(/\\D/g, '');
  if (digits.length <= 11) {
    return digits
      .replace(/(\\d{3})(\\d)/, '$1.$2')
      .replace(/(\\d{3})(\\d)/, '$1.$2')
      .replace(/(\\d{3})(\\d{1,2})/, '$1-$2')
      .replace(/(-\\d{2})\\d+?$/, '$1');
  } else {
    return digits
      .replace(/(\\d{2})(\\d)/, '$1.$2')
      .replace(/(\\d{3})(\\d)/, '$1.$2')
      .replace(/(\\d{3})(\\d)/, '$1/$2')
      .replace(/(\\d{4})(\\d{1,2})/, '$1-$2')
      .replace(/(-\\d{2})\\d+?$/, '$1');
  }
};

const validateCpfCnpj = (value: string) => {
  const digits = value.replace(/\\D/g, '');
  if (!digits) return false;

  if (digits.length === 11) {
    if (/^(\\d)\\1+$/.test(digits)) return false;
    let sum = 0;
    let remainder;
    for (let i = 1; i <= 9; i++) sum += parseInt(digits.substring(i - 1, i)) * (11 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(digits.substring(i - 1, i)) * (12 - i);
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.substring(10, 11))) return false;
    return true;
  } else if (digits.length === 14) {
    if (/^(\\d)\\1+$/.test(digits)) return false;
    let size = digits.length - 2;
    let numbers = digits.substring(0, size);
    const digitsCNPJ = digits.substring(size);
    let sum = 0;
    let pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digitsCNPJ.charAt(0))) return false;
    
    size = size + 1;
    numbers = digits.substring(0, size);
    sum = 0;
    pos = size - 7;
    for (let i = size; i >= 1; i--) {
      sum += parseInt(numbers.charAt(size - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digitsCNPJ.charAt(1))) return false;
    return true;
  }
  return false;
};`;

const targetSubmit = `    if (!formData.proposta.contrato || formData.proposta.contrato.trim() === '' || formData.proposta.contrato.startsWith('IMP-') || formData.proposta.contrato === 'NOVO') {
      setAlertMessage('Não é possível salvar a proposta sem um número de contrato definitivo. Por favor, insira o número do contrato.');
      return;
    }`;

const replacementSubmit = `    if (!validateCpfCnpj(formData.cliente.cpfCnpj)) {
      setAlertMessage('O CPF ou CNPJ informado é inválido. Por favor, verifique os dígitos e tente novamente.');
      return;
    }

    if (!formData.proposta.contrato || formData.proposta.contrato.trim() === '' || formData.proposta.contrato.startsWith('IMP-') || formData.proposta.contrato === 'NOVO') {
      setAlertMessage('Não é possível salvar a proposta sem um número de contrato definitivo. Por favor, insira o número do contrato.');
      return;
    }`;

if(code.includes(targetFunction)) {
  code = code.replace(targetFunction, replacementFunction);
  code = code.replace(targetSubmit, replacementSubmit);
  fs.writeFileSync('components/ProposalModal.tsx', code);
  console.log("Updated ProposalModal.tsx com validação e mascara");
} else {
  console.log("Function target not found");
}
