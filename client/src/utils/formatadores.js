export const formatarMoeda = (valor) => {
  if (valor === null || valor === undefined) return 'R$ 0,00';
  return `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatarNumero = (valor) => {
  if (valor === null || valor === undefined) return '0,00';
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const formatarQuantidade = (valor) => {
  if (valor === null || valor === undefined) return '0';
  return Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}; 