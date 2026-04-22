import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addMonths, format, parseISO } from 'date-fns';

const Commissions = () => {
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [globalSettings, setGlobalSettings] = useState({ commission_percentage: 10, payment_fees: [] });

  const [filterPeriod, setFilterPeriod] = useState(format(new Date(), 'yyyy-MM'));
  const [mesAtual, anoAtual] = useMemo(() => {
    if (!filterPeriod) return [null, null];
    const [y, m] = filterPeriod.split('-');
    return [parseInt(m), parseInt(y)];
  }, [filterPeriod]);
  const [search, setSearch] = useState('');

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      data_os: format(new Date(), 'yyyy-MM-dd'),
      data: format(new Date(), 'yyyy-MM-dd'),
      num_os: '',
      cliente: '',
      total: 0,
      tem_taxas: false,
      taxa_id: '',
      pecas: 0,
      despesas: 0,
      repeticao_tipo: 'single',
      repetir_vezes: 1,
      observacoes: ''
    }
  });

  const watchValues = watch();

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      setGlobalSettings({
        commission_percentage: response.data.commission_percentage || 10,
        payment_fees: response.data.payment_fees || []
      });
    } catch (e) {
      console.warn('Erro ao carregar taxas globais');
    }
  };

  const loadCommissions = useCallback(async () => {
    try {
      setLoading(true);
      const mesParam = mesAtual || '';
      const anoParam = anoAtual || '';
      const url = `/commissions?mes=${mesParam}&ano=${anoParam}&search=${search}`;
      const response = await api.get(url);
      setCommissions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      Swal.fire('Erro!', 'Erro ao carregar comissões.', 'error');
    } finally {
      setLoading(false);
    }
  }, [mesAtual, anoAtual, search]);

  useEffect(() => { loadSettings(); }, []);
  useEffect(() => { loadCommissions(); }, [loadCommissions]);

  // Transformar cliente em caixa alta
  useEffect(() => {
    if (watchValues.cliente) {
      const upper = watchValues.cliente.toUpperCase();
      if (upper !== watchValues.cliente) setValue('cliente', upper);
    }
  }, [watchValues.cliente, setValue]);

  const lucroPrevisto = useMemo(() => {
    const total = parseFloat(watchValues.total) || 0;
    const pecas = parseFloat(watchValues.pecas) || 0;
    const despesas = parseFloat(watchValues.despesas) || 0;
    let taxa_valor = 0;

    if (watchValues.tem_taxas && watchValues.taxa_id) {
      const taxa_obj = globalSettings.payment_fees.find(f => f.id.toString() === watchValues.taxa_id.toString());
      if (taxa_obj) taxa_valor = total * (parseFloat(taxa_obj.percentage) / 100);
    }

    return total - taxa_valor - pecas - despesas;
  }, [watchValues.total, watchValues.pecas, watchValues.despesas, watchValues.tem_taxas, watchValues.taxa_id, globalSettings.payment_fees]);

  const comissaoPrevista = useMemo(() => {
    let pct = parseFloat(globalSettings.commission_percentage) / 100;
    return lucroPrevisto * pct;
  }, [lucroPrevisto, globalSettings.commission_percentage]);

  const totalComissaoGeral = useMemo(() => {
    return commissions.reduce((acc, curr) => acc + (parseFloat(curr.total_comissao) || 0), 0);
  }, [commissions]);

  const handleOpenNewModal = () => {
    setEditingId(null);
    reset({
      data_os: format(new Date(), 'yyyy-MM-dd'), data: format(new Date(), 'yyyy-MM-dd'),
      num_os: '', cliente: '', total: '', tem_taxas: false, taxa_id: '',
      pecas: '', despesas: '', repeticao_tipo: 'single', repetir_vezes: 1, observacoes: ''
    });
    setShowModal(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    let current_taxa_id = '';
    if (item.tem_taxas && item.nome_taxa_aplicada) {
      const feeItem = globalSettings.payment_fees.find(f => f.name === item.nome_taxa_aplicada);
      if (feeItem) current_taxa_id = feeItem.id;
    }
    let repeticao_tipo = item.is_fixo ? 'fixo' : (item.parent_id && item.parent_id !== item.id ? 'custom' : 'single');

    reset({
      data_os: item.data_os || format(new Date(), 'yyyy-MM-dd'), data: item.data,
      num_os: item.num_os, cliente: item.cliente, total: item.total,
      tem_taxas: item.tem_taxas, taxa_id: current_taxa_id, pecas: item.pecas,
      despesas: item.despesas, repeticao_tipo, repetir_vezes: 1, observacoes: item.observacoes
    });
    setShowModal(true);
  };

  const handleDelete = async (item) => {
    try {
      let delete_future = false;
      if (item.is_fixo || item.parent_id) {
        const result = await Swal.fire({
          title: 'Excluir Série?', text: "Este item pertence a uma série de recorrência.",
          icon: 'warning', showCancelButton: true, showDenyButton: true, confirmButtonColor: '#3085d6', denyButtonColor: '#d33',
          confirmButtonText: 'Apenas este mês', denyButtonText: 'Este e Futuros'
        });
        if (result.isDismissed) return;
        if (result.isDenied) delete_future = true;
      } else {
        const result = await Swal.fire({ title: 'Excluir?', text: 'Deseja apagar este registro avulso?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Sim' });
        if (!result.isConfirmed) return;
      }
      await api.delete(`/commissions/${item.id}?delete_future=${delete_future}`);
      loadCommissions();
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Removido com sucesso!' });
    } catch (e) { Swal.fire('Erro!', 'Falha ao excluir.', 'error'); }
  };

  const onSubmit = async (data) => {
    try {
      const payload = { ...data };
      if (editingId) {
        let update_future = false;
        const currentItem = commissions.find(c => c.id === editingId);
        if (currentItem?.is_fixo || currentItem?.parent_id || payload.repeticao_tipo === 'fixo') {
          const res = await Swal.fire({ title: 'Editar Série?', showCancelButton: true, showDenyButton: true, confirmButtonText: 'Apenas para este mês', denyButtonText: 'Para todos os meses futuros' });
          if (res.isDismissed) return;
          if (res.isDenied) update_future = true;
        }
        await api.put(`/commissions/${editingId}`, { ...payload, update_future });
      } else {
        await api.post('/commissions', payload);
      }
      setShowModal(false);
      loadCommissions();
      Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, icon: 'success', title: 'Salvo com sucesso!' });
    } catch (e) { Swal.fire('Erro!', 'Falha ao salvar.', 'error'); }
  };

  const handlePurgeAll = async () => {
    try {
      if (commissions.length === 0) return;

      const result = await Swal.fire({
        title: 'LIMPAR TUDO?',
        text: 'Você está prestes a apagar TODOS os seus registros de comissão cadastrados. Esta ação não pode ser desfeita!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, apagar tudo!',
        cancelButtonText: 'Não, cancelar'
      });

      if (result.isConfirmed) {
        setLoading(true);
        await api.delete('/commissions/purge/all');
        loadCommissions();
        Swal.fire('Limpo!', 'Todos os seus registros de comissão foram removidos.', 'success');
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Erro!', 'Não foi possível limpar os registros.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    if (commissions.length === 0) return;

    const { value: additionalNote, isDismissed } = await Swal.fire({
      title: 'Observação Adicional (Excel)',
      input: 'textarea',
      inputLabel: 'Deseja adicionar alguma nota geral ao relatório?',
      inputPlaceholder: 'Digite aqui...',
      showCancelButton: true,
      confirmButtonText: 'Exportar Excel',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#28a745'
    });

    if (isDismissed) return;

    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthName = monthNames[mesAtual - 1].toUpperCase();
    const title = `COMISSIONAMENTO - ${monthName} - ${anoAtual}`;

    // Construção do conteúdo do Excel usando Array of Arrays (aoa) para maior controle
    const rows = [
      [title],
      [],
      ["DATA", "OS", "CLIENTE", "TOTAL", "PEÇAS", "DESPESAS", "TAXAS", "PARC.", "COMISSÃO", "%"]
    ];

    commissions.forEach(c => {
      rows.push([
        c.data_os ? format(parseISO(c.data_os), 'dd/MM/yyyy') : '',
        c.num_os,
        c.cliente,
        parseFloat(c.total) || 0,
        parseFloat(c.pecas) || 0,
        parseFloat(c.despesas) || 0,
        parseFloat(c.valor_taxas) || 0,
        c.is_fixo ? 'Fixo' : (c.parent_id ? 'Parc.' : '1'),
        parseFloat(c.total_comissao) || 0,
        `${parseFloat(c.porcentagem_comissao)}%`
      ]);
    });

    const totalComissaoGeral = commissions.reduce((acc, curr) => acc + (parseFloat(curr.total_comissao) || 0), 0);
    rows.push(['', '', '', '', '', '', '', 'TOTAL:', totalComissaoGeral, '']);

    // Seção de Observações Detalhadas
    const obsItems = commissions.filter(c => c.observacoes && c.observacoes.trim() !== '');
    if (obsItems.length > 0 || (additionalNote && additionalNote.trim() !== '')) {
      rows.push([]);
      rows.push(["OBSERVAÇÕES DETALHADAS"]);
      
      if (additionalNote && additionalNote.trim() !== '') {
        rows.push(["NOTA GERAL:"]);
        rows.push([additionalNote]);
        rows.push([]);
      }

      if (obsItems.length > 0) {
        rows.push(["REF (OS)", "CLIENTE", "OBSERVAÇÃO"]);
        obsItems.forEach(c => {
          rows.push([c.num_os, c.cliente, c.observacoes]);
        });
      }
    }

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Comissionamento");
    XLSX.writeFile(workbook, `${title}.xlsx`);
  };

  const handleExportPDF = async () => {
    if (commissions.length === 0) return;

    const { value: additionalNote, isDismissed } = await Swal.fire({
      title: 'Observação Adicional',
      input: 'textarea',
      inputLabel: 'Deseja adicionar alguma nota geral ao relatório?',
      inputPlaceholder: 'Digite aqui...',
      showCancelButton: true,
      confirmButtonText: 'Exportar PDF',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0061ff'
    });

    if (isDismissed) return;

    const doc = new jsPDF('landscape');
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    const monthName = monthNames[mesAtual - 1].toUpperCase();
    const title = `COMISSIONAMENTO - ${monthName} - ${anoAtual}`;
    
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.text(title, pageWidth / 2, 15, { align: 'center' });
    
    const totalComissaoGeralExport = commissions.reduce((acc, curr) => acc + (parseFloat(curr.total_comissao) || 0), 0);
    
    const tableColumn = ["DATA", "OS", "CLIENTE", "TOTAL", "PEÇAS", "DESPESAS", "TAXAS", "PARC.", "COMISSÃO", "%"];
    const tableRows = commissions.map(c => [
      c.data_os ? format(parseISO(c.data_os), 'dd/MM/yyyy') : '',
      c.num_os,
      c.cliente,
      `R$ ${parseFloat(c.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${parseFloat(c.pecas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${parseFloat(c.despesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `R$ ${parseFloat(c.valor_taxas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      c.is_fixo ? 'Fixo' : (c.parent_id ? 'Parc.' : '1'),
      `R$ ${parseFloat(c.total_comissao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      `${parseFloat(c.porcentagem_comissao)}%`
    ]);

    // Linha de Total
    tableRows.push([
      { content: 'TOTAL:', colSpan: 8, styles: { halign: 'right', fontStyle: 'bold' } },
      { content: `R$ ${totalComissaoGeralExport.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
      ''
    ]);
    
    autoTable(doc, { 
      head: [tableColumn], 
      body: tableRows, 
      startY: 25, 
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [0, 97, 255], halign: 'center' },
      columnStyles: {
        3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' }, 
        6: { halign: 'right' }, 7: { halign: 'center' }, 8: { halign: 'right' }, 
        9: { halign: 'center' }
      }
    });

    // Seção de Observações no final
    const obsRows = commissions
      .filter(c => c.observacoes && c.observacoes.trim() !== '')
      .map(c => [c.num_os, c.cliente, c.observacoes]);

    if (obsRows.length > 0 || (additionalNote && additionalNote.trim() !== '')) {
      const finalY = doc.lastAutoTable.finalY || 25;
      
      // Verifica se precisa de nova página
      let currentY = finalY + 15;
      if (currentY > 180) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.text("OBSERVAÇÕES DETALHADAS", 14, currentY);
      currentY += 10;

      if (additionalNote && additionalNote.trim() !== '') {
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text("NOTA GERAL:", 14, currentY);
        doc.setFont(undefined, 'normal');
        const splitNote = doc.splitTextToSize(additionalNote, pageWidth - 28);
        doc.text(splitNote, 14, currentY + 5);
        currentY += (splitNote.length * 5) + 10;
      }

      if (obsRows.length > 0) {
        autoTable(doc, {
          head: [['REF (OS)', 'CLIENTE', 'OBSERVAÇÃO']],
          body: obsRows,
          startY: currentY,
          theme: 'striped',
          styles: { fontSize: 9 },
          headStyles: { fillColor: [100, 100, 100] }
        });
      }
    }
    
    doc.save(`${title}.pdf`);
  };

  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded shadow-sm border-left border-primary border-4">
        <div>
          <h1 className="h4 mb-0 font-weight-bold text-dark text-uppercase">Comissionamento</h1>
        </div>
        <div className="d-flex" style={{ gap: '10px' }}>
          <div className="btn-group shadow-sm">
            <button className="btn btn-outline-success btn-sm px-3" onClick={handleExportExcel} disabled={!commissions.length}><i className="fas fa-file-excel mr-1"></i> Excel</button>
            <button className="btn btn-outline-danger btn-sm px-3" onClick={handleExportPDF} disabled={!commissions.length}><i className="fas fa-file-pdf mr-1"></i> PDF</button>
          </div>
          <button className="btn btn-outline-danger btn-sm px-3 font-weight-bold shadow-sm" onClick={handlePurgeAll} disabled={!commissions.length}><i className="fas fa-trash-alt mr-1"></i> LIMPAR TUDO</button>
          <button className="btn btn-primary btn-sm px-4 font-weight-bold shadow-sm" onClick={handleOpenNewModal}><i className="fas fa-plus mr-2"></i> ADICIONAR REGISTRO</button>
        </div>
      </div>

      <div className="card shadow-sm border-0 mb-4 rounded-lg">
        <div className="card-body py-4 bg-white">
          <div className="row align-items-center">
            <div className="col-md-3 mb-3 mb-md-0">
              <label className="text-xs font-weight-bold text-muted text-uppercase mb-2 d-block">Período Referência</label>
              <div className="input-group input-group-sm" style={{ width: '220px' }}>
                <input
                  type="month"
                  className="form-control shadow-none"
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                />
                {filterPeriod && (
                  <div className="input-group-append">
                    <button className="btn btn-outline-secondary" onClick={() => setFilterPeriod('')} title="Limpar Filtro">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="col-md-5 mb-3 mb-md-0">
              <label className="text-xs font-weight-bold text-muted text-uppercase mb-2 d-block">Pesquisar OS ou Cliente</label>
              <div className="input-group input-group-sm rounded shadow-none">
                <div className="input-group-prepend"><span className="input-group-text bg-white border-right-0"><i className="fas fa-search text-muted"></i></span></div>
                <input type="text" className="form-control border-left-0" placeholder="Ex: Nome da empresa..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-4 text-right d-flex align-items-center justify-content-end" style={{ gap: '10px' }}>
              <span className="badge badge-light border px-3 py-2 text-primary font-weight-bold">{commissions.length} registros</span>
              <span className="badge bg-success-soft border px-3 py-2 text-success font-weight-bold">
                TOTAL: R$ {totalComissaoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="card shadow-sm border-0 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-dark text-white text-xs text-uppercase font-weight-bold">
                <tr>
                  <th className="py-3 px-4 border-0">DATA OS</th>
                  <th className="py-3 border-0">DATA</th>
                  <th className="py-3 border-0">Nº OS / REF</th>
                  <th className="py-3 border-0">CLIENTE</th>
                  <th className="py-3 border-0 text-right">TOTAL</th>
                  <th className="py-3 border-0 text-right">LUCRO</th>
                  <th className="py-3 border-0 text-right">COMISSÃO</th>
                  <th className="py-3 px-4 border-0 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {commissions.length === 0 ? (
                  <tr><td colSpan="8" className="text-center py-5 text-muted">Nenhuma comissão listada.</td></tr>
                ) : (
                  commissions.map(c => (
                    <tr key={c.id}>
                      <td className="align-middle px-4 text-muted small">{c.data_os ? format(parseISO(c.data_os), 'dd/MM/yyyy') : '-'}</td>
                      <td className="align-middle text-dark font-weight-bold small">{format(parseISO(c.data), 'dd/MM/yyyy')}</td>
                      <td className="align-middle">
                        <span className="font-weight-bold text-dark">{c.num_os}</span>
                        {c.is_fixo && !c.parent_id && <span className="badge badge-info ml-2 text-xxs px-2 py-1">FIXO MESTRE</span>}
                        {c.is_fixo && c.parent_id && <span className="badge badge-light border text-xxs px-2 py-1 ml-1 text-muted"><i className="fas fa-sync-alt"></i> RECORRENTE</span>}
                        {!c.is_fixo && c.parent_id && <span className="badge badge-light border text-xxs px-2 py-1 ml-1 text-muted"><i className="fas fa-layer-group"></i> PARCELA</span>}
                      </td>
                      <td className="align-middle font-weight-bold text-muted small">{c.cliente}</td>
                      <td className="align-middle text-right text-nowrap font-weight-bold text-dark">R$ {parseFloat(c.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="align-middle text-right text-nowrap text-primary font-weight-bold">R$ {parseFloat(c.lucro).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="align-middle text-right text-nowrap text-success font-weight-bold bg-success-soft">R$ {parseFloat(c.total_comissao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="align-middle text-right px-4">
                        <div className="btn-group">
                          <button className="btn btn-link btn-sm text-info p-1 mr-2" onClick={() => handleEdit(c)}><i className="fas fa-edit"></i></button>
                          <button className="btn btn-link btn-sm text-danger p-1" onClick={() => handleDelete(c)}><i className="fas fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-xl">
              <div className="modal-header border-0 bg-primary text-white py-4 px-4">
                <h5 className="modal-title font-weight-bold" style={{ fontSize: '1.25rem' }}>{editingId ? 'EDITAR LANÇAMENTO / SÉRIE' : 'NOVO LANÇAMENTO'}</h5>
                <button type="button" className="close text-white" onClick={() => setShowModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body p-4 bg-light">
                  <div className="row mb-4">
                    <div className="col-md-3"><label className="text-sm font-weight-bold text-muted text-uppercase mb-2">DATA CADASTRO / OS</label><input type="date" className="form-control shadow-none" {...register('data_os', { required: true })} /></div>
                    <div className="col-md-3"><label className="text-sm font-weight-bold text-primary text-uppercase mb-2">MÊS DE LANÇAMENTO</label><input type="date" className="form-control shadow-none font-weight-bold" {...register('data', { required: true })} /></div>
                    <div className="col-md-6"><label className="text-sm font-weight-bold text-muted text-uppercase mb-2">Nº OS / Referência</label><input type="text" className="form-control shadow-none" placeholder="" {...register('num_os', { required: true })} /></div>
                  </div>
                  <div className="row mb-4">
                    <div className="col-md-5"><label className="text-sm font-weight-bold text-muted text-uppercase mb-2">Cliente</label><input type="text" className="form-control shadow-none font-weight-bold text-dark" placeholder="" {...register('cliente', { required: true })} /></div>
                    <div className="col-md-4"><label className="text-sm font-weight-bold text-muted text-uppercase mb-2">TOTAL BRUTO (R$)</label><div className="input-group"><div className="input-group-prepend"><span className="input-group-text bg-white">R$</span></div><input type="number" step="0.01" className="form-control font-weight-bold text-dark border-left-0" {...register('total', { required: true })} /></div></div>
                    <div className="col-md-3 d-flex align-items-center pt-4">
                      <div className="custom-control custom-switch">
                        <input type="checkbox" className="custom-control-input" id="swTaxa" {...register('tem_taxas')} />
                        <label className="custom-control-label text-sm font-weight-bold text-nowrap" htmlFor="swTaxa" style={{ whiteSpace: 'nowrap' }}>TEVE TAXA?</label>
                      </div>
                    </div>
                  </div>
                  {watchValues.tem_taxas && (
                    <div className="row mb-4 mx-0">
                      <div className="col-12 p-3 bg-white rounded border"><select className="form-control shadow-none border-info" {...register('taxa_id', { required: watchValues.tem_taxas })}><option value="">Selecione o modelo de taxa (Global)...</option>{globalSettings.payment_fees.map(f => <option key={f.id} value={f.id}>{f.name} ({f.percentage}%)</option>)}</select></div>
                    </div>
                  )}
                  <div className="row mb-4">
                    <div className="col-md-3"><label className="text-sm font-weight-bold text-danger text-uppercase mb-2">Peças</label><div className="input-group"><div className="input-group-prepend"><span className="input-group-text bg-white">R$</span></div><input type="number" step="0.01" className="form-control shadow-none border-left-0" {...register('pecas')} /></div></div>
                    <div className="col-md-3"><label className="text-sm font-weight-bold text-danger text-uppercase mb-2">Despesas</label><div className="input-group"><div className="input-group-prepend"><span className="input-group-text bg-white">R$</span></div><input type="number" step="0.01" className="form-control shadow-none border-left-0" {...register('despesas')} /></div></div>
                    <div className="col-md-6"><label className="text-sm font-weight-bold text-muted text-uppercase mb-2">Observações</label><input type="text" className="form-control shadow-none" placeholder="Opcional..." {...register('observacoes')} /></div>
                  </div>
                  <div className="alert bg-success-soft shadow-sm rounded-lg d-flex justify-content-between py-3 px-4 border-0 mb-4 align-items-center">
                    <div className="d-flex align-items-center gap-4">
                      <div className="mr-5"><span className="text-sm font-weight-bold text-uppercase opacity-75 text-dark mr-2">LUCRO:</span><span className="h5 mb-0 font-weight-bold text-dark">R$ {parseFloat(lucroPrevisto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                      <div><span className="text-sm font-weight-bold text-uppercase opacity-75 text-success mr-2">COMISSÃO ({(parseFloat(globalSettings.commission_percentage)).toFixed(1)}%):</span><span className="h5 mb-0 font-weight-bold text-success">R$ {parseFloat(comissaoPrevista).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                    </div>
                  </div>
                  <div className="bg-white p-3 px-4 rounded border">
                    <div className="row align-items-center">
                      <div className="col-md-3"><span className="text-sm font-weight-bold text-info text-uppercase"><i className="fas fa-layer-group mr-2"></i> REPETIÇÃO:</span></div>
                      <div className="col-md-9 d-flex justify-content-between">
                        <div className="custom-control custom-radio"><input className="custom-control-input" type="radio" id="rSingle" value="single" {...register('repeticao_tipo')} /><label className="custom-control-label font-weight-bold text-sm" htmlFor="rSingle">AVULSO</label></div>
                        {!editingId && <div className="custom-control custom-radio"><input className="custom-control-input" type="radio" id="rCustom" value="custom" {...register('repeticao_tipo')} /><label className="custom-control-label font-weight-bold text-sm" htmlFor="rCustom">PARCELADO</label></div>}
                        <div className="custom-control custom-radio"><input className="custom-control-input" type="radio" id="rFixo" value="fixo" {...register('repeticao_tipo')} /><label className="custom-control-label font-weight-bold text-sm text-primary" htmlFor="rFixo">RECORRENTE FIXO</label></div>
                      </div>
                    </div>
                    {watchValues.repeticao_tipo === 'custom' && !editingId && (
                      <div className="mt-3 text-center border-top pt-3"> <span className="text-sm font-weight-bold mr-3">QUANTIDADE DE PARCELAS:</span> <input type="number" min="2" max="120" className="form-control d-inline-block w-auto text-center font-weight-bold" {...register('repetir_vezes')} style={{ width: '80px' }} /> </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer border-0 py-4 px-4 bg-white">
                  <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setShowModal(false)}>CANCELAR</button>
                  <button type="submit" className="btn btn-primary px-5 font-weight-bold shadow">{editingId ? 'SALVAR ALTERAÇÕES' : 'CONFIRMAR LANÇAMENTO'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <style>{`
        .text-xxs { font-size: 0.65rem; letter-spacing: 0.5px; }
        .text-xs { font-size: 0.75rem; }
        .rounded-xl { border-radius: 12px !important; }
        .form-control-sm { border-radius: 6px; }
        .shadow-none:focus { box-shadow: none !important; border-color: #0061ff; }
        .bg-success-soft { background-color: #f0fdf4; border: 1px solid #bbf7d0 !important; }
        .modal-dialog-scrollable .modal-content { max-height: 95vh; }
      `}</style>
    </div>
  );
};

export default Commissions;
