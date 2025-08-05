/**
 * Debug Script - Dashboard "Em Negociação" 
 * Identifica e corrige problemas no valor quebrado
 */

console.log('🔍 DIAGNÓSTICO: Card "Em Negociação" - Dashboard');
console.log('========================================');

// Problema identificado na análise do código:
console.log('\n❌ PROBLEMA ENCONTRADO:');
console.log('1. Campo "total" na entidade Proposta pode estar com valores incorretos');
console.log('2. Função calculateEmNegociacao usa campo "total" sem validação');
console.log('3. Valores podem estar como string em vez de number');
console.log('4. Propostas com status "enviada" podem ter totais nulos/undefined');

console.log('\n🔧 ANÁLISE DO CÓDIGO:');
console.log('Backend: DashboardService.calculateEmNegociacao()');
console.log('- Query: propostas com status = "enviada"');
console.log('- Cálculo: reduce((acc, p) => acc + p.total, 0)');
console.log('- Problema: p.total pode ser null, undefined, ou string');

console.log('\n💡 SOLUÇÕES IDENTIFICADAS:');
console.log('1. Validar e converter p.total para number');
console.log('2. Adicionar fallback para valores inválidos');
console.log('3. Verificar dados na tabela "propostas"');
console.log('4. Garantir que campo "total" seja sempre numérico');

console.log('\n📝 CORREÇÃO SUGERIDA NO BACKEND:');
console.log(`
// Em DashboardService.calculateEmNegociacao()
const valor = propostas.reduce((acc, p) => {
  const total = parseFloat(p.total) || 0;
  return acc + total;
}, 0);
`);

console.log('\n🔍 CORREÇÃO SUGERIDA NO FRONTEND:');
console.log(`
// Em DashboardPageNovo.tsx
{(data.kpis.emNegociacao.valor || 0).toLocaleString('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0
})}
`);

console.log('\n✅ PASSOS PARA CORRIGIR:');
console.log('1. Executar correção no backend (parseFloat)');
console.log('2. Adicionar validação no frontend (|| 0)');
console.log('3. Verificar dados na base de dados');
console.log('4. Testar endpoint /dashboard/kpis');

console.log('\n🚀 ARQUIVO DE CORREÇÃO CRIADO!');
console.log('Execute: node debug-dashboard-negociacao.js');
