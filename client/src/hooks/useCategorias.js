import { useState, useEffect } from 'react';

const CATEGORIAS_PADRAO = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Outros'
];

export function useCategorias() {
  const [categorias, setCategorias] = useState(() => {
    const categoriasSalvas = localStorage.getItem('categorias');
    return categoriasSalvas ? JSON.parse(categoriasSalvas) : CATEGORIAS_PADRAO;
  });

  useEffect(() => {
    localStorage.setItem('categorias', JSON.stringify(categorias));
  }, [categorias]);

  const atualizarCategorias = (novasCategorias) => {
    setCategorias(novasCategorias);
  };

  return {
    categorias,
    atualizarCategorias
  };
} 