const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://wpjehsjzeuxdtoovkocp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwamVoc2p6ZXV4ZHRvb3Zrb2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NjkxMTAsImV4cCI6MjA4NDM0NTExMH0.XuoSR8DoILZFXBFoHOBgoNrnNDnxYLjk6bPUzVug258');

async function fixDB() {
  console.log('Iniciando correção do Banco de Dados...');
  
  // 1. Encontra o lote que ficou com valor 0 e está PAGO
  const { data: lots } = await supabase.from('payment_lots').select('*').eq('valorTotal', 0).eq('status', 'PAGO');
  console.log('Lotes pagos com valor 0 encontrados:', lots ? lots.length : 0);
  
  for (const lot of lots || []) {
    // Pega as propostas desse lote
    const { data: props } = await supabase.from('proposals').select('*').eq('lote_id', lot.id);
    
    if (props && props.length > 0) {
      console.log(`Lote ${lot.codigo} tem ${props.length} propostas. Recalculando...`);
      const { data: impostos } = await supabase.from('proposal_requirements').select('*').eq('tipo', 'IMPOSTO_CORRETOR');
      
      let totalValue = 0;
      for (const p of props) {
        const comissaoBase = Number(p.comissao || 0);
        const corretor = p.corretor.toUpperCase();
        const operadora = p.operadora.toUpperCase();
        const tipoPlano = (p.detalhes?.proposta?.tipoPlano || '').toUpperCase();
        
        const baseSearch = [`${corretor} - ${operadora}`, `TODOS - ${operadora}`, `${corretor} - TODAS`, `TODOS - TODAS`];
        let pctStr;
        for (const base of baseSearch) {
          pctStr = (impostos||[]).find(r => r.nome.startsWith(`${base} - ${tipoPlano} - `)) ||
                   (impostos||[]).find(r => r.nome.startsWith(`${base} - TODOS OS TIPOS - `)) ||
                   (impostos||[]).find(r => r.nome.startsWith(`${base} - TODOS - `)) ||
                   (impostos||[]).find(r => r.nome.split(' - ').length === 3 && r.nome.startsWith(`${base} - `));
          if (pctStr) break;
        }
        
        let txPercentual = 0;
        if (pctStr) {
          const parts = pctStr.nome.split(' - ');
          txPercentual = parseFloat(parts[parts.length - 1]) || 0;
        }
        
        const desconto = Number((comissaoBase * (txPercentual / 100)).toFixed(2));
        totalValue += (comissaoBase - desconto);
      }
      
      console.log(`Novo valor calculado para o lote ${lot.codigo}: R$ ${totalValue}`);
      
      if (totalValue > 0) {
        // Atualiza Lote
        await supabase.from('payment_lots').update({ valorTotal: totalValue }).eq('id', lot.id);
        console.log(`✅ Lote ${lot.codigo} atualizado!`);
        
        // Atualiza a transação gerada
        const { data: txs } = await supabase.from('transactions').select('*').like('descricao', `%${lot.codigo}%`);
        if (txs && txs.length > 0) {
          await supabase.from('transactions').update({ valor: totalValue }).eq('id', txs[0].id);
          console.log(`✅ Transação do lote atualizada!`);
        }
      }
    }
  }
  
  // 2. Propostas que ficaram travadas (Lote Pago mas proposta não atualizou na época do bug de segurança)
  const { data: allPaidLots } = await supabase.from('payment_lots').select('id').eq('status', 'PAGO');
  if (allPaidLots && allPaidLots.length > 0) {
    const lotIds = allPaidLots.map(l => l.id);
    const { data: stuckProps } = await supabase.from('proposals').select('*').in('lote_id', lotIds).neq('status', 'PAGO');
    
    if (stuckProps && stuckProps.length > 0) {
      console.log(`Encontradas ${stuckProps.length} propostas travadas em lotes pagos. Consertando status para PAGO...`);
      for (const p of stuckProps) {
        await supabase.from('proposals').update({ status: 'PAGO' }).eq('id', p.id);
        console.log(`✅ Proposta ${p.contrato} atualizada para PAGO!`);
      }
    } else {
      console.log('Nenhuma proposta travada encontrada.');
    }
  }
}

fixDB().then(() => console.log('Processo finalizado.'));
