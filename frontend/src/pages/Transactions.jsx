import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Swal from 'sweetalert2';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentDate = new Date();
  const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [filterMonth, setFilterMonth] = useState(currentMonthYear);
  
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const watchType = watch('type');

  const loadTransactions = async () => {
    try {
      const [transRes, catRes] = await Promise.all([
        api.get('/transactions'),
        api.get('/categories')
      ]);
      setTransactions(transRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const onSubmit = async (data) => {
    try {
      let parsedAmount = String(data.amount);
      if (parsedAmount.includes(',')) {
        parsedAmount = parsedAmount.replace(/\./g, '').replace(',', '.');
      }

      if (editingId) {
        await api.put(`/transactions/${editingId}`, {
          descricao: data.description,
          valor: Number(parsedAmount),
          tipo: data.type,
          categoria_id: data.categoria_id || null,
          data: data.date,
          paga: data.paga
        });
        Swal.fire('Sucesso!', 'Transação atualizada com sucesso.', 'success');
      } else {
        await api.post('/transactions', {
          descricao: data.description,
          valor: Number(parsedAmount),
          tipo: data.type,
          categoria_id: data.categoria_id || null,
          data: data.date,
          paga: data.paga
        });
        Swal.fire('Sucesso!', 'Transação cadastrada com sucesso.', 'success');
      }
      reset();
      setEditingId(null);
      setShowModal(false);
      loadTransactions();
    } catch (error) {
      Swal.fire('Erro!', 'Erro ao salvar transação.', 'error');
    }
  };

  const handleEdit = (transaction) => {
    setEditingId(transaction.id);
    let formattedDate = '';
    if (transaction.data) {
      formattedDate = new Date(transaction.data).toISOString().split('T')[0];
    } else if (transaction.createdAt) {
      formattedDate = new Date(transaction.createdAt).toISOString().split('T')[0];
    }

    reset({
      description: transaction.descricao,
      amount: Number(transaction.valor).toFixed(2).replace('.', ','),
      type: transaction.tipo,
      categoria_id: transaction.categoria_id || '',
      date: formattedDate,
      paga: transaction.paga
    });
    setShowModal(true);
  };

  const handleOpenNewModal = () => {
    setEditingId(null);
    reset({
      description: '',
      amount: '',
      type: 'entrada',
      categoria_id: '',
      date: '',
      paga: false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Tem certeza?',
        text: "Você não poderá reverter isso!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!'
      });

      if (result.isConfirmed) {
        await api.delete(`/transactions/${id}`);
        Swal.fire('Excluído!', 'Sua transação foi excluída.', 'success');
        loadTransactions();
      }
    } catch (error) {
      Swal.fire('Erro!', 'Erro ao excluir.', 'error');
    }
  };

  const handleTogglePaymentStatus = async (transaction) => {
    try {
      await api.put(`/transactions/${transaction.id}`, { paga: !transaction.paga });
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500
      });
      Toast.fire({ icon: 'success', title: 'Status atualizado!' });
      loadTransactions();
    } catch (error) {
      Swal.fire('Erro!', 'Erro ao atualizar status.', 'error');
    }
  };

  // Change category select when Type changes so we don't save an invalid category
  useEffect(() => {
    setValue('categoria_id', '');
  }, [watchType, setValue]);

  const filteredTransactions = transactions.filter(t => {
    const textMatch = t.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let monthMatch = true;
    if (filterMonth) {
      const tDate = new Date(t.data || t.createdAt);
      const tMonthYear = `${tDate.getUTCFullYear()}-${String(tDate.getUTCMonth() + 1).padStart(2, '0')}`;
      monthMatch = tMonthYear === filterMonth;
    }
    
    return textMatch && monthMatch;
  });

  return (
    <div>
      <div className="content-header">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <h1 className="m-0">Transações</h1>
          <button className="btn btn-primary" onClick={handleOpenNewModal}>
            <i className="fas fa-plus"></i> Nova Transação
          </button>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title mt-1">Lista de Transações</h3>
              <div className="card-tools d-flex">
                <div className="input-group input-group-sm mr-2" style={{ width: '150px' }}>
                  <input 
                    type="month" 
                    className="form-control float-right" 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    title="Filtrar por Mês"
                  />
                </div>
                <div className="input-group input-group-sm" style={{ width: '200px' }}>
                  <input 
                    type="text" 
                    className="form-control float-right" 
                    placeholder="Pesquisar por descrição..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="input-group-append">
                    <button type="button" className="btn btn-default">
                      <i className="fas fa-search"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Descrição</th>
                    <th>Valor</th>
                    <th>Tipo</th>
                    <th>Data</th>
                    <th style={{ width: '100px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div className="font-weight-bold">{t.descricao}</div>
                        {t.categoriaData && <span className="badge badge-light text-muted mt-1"><i className="fas fa-tag mr-1 text-info"></i>{t.categoriaData.nome}</span>}
                      </td>
                      <td className={t.tipo === 'entrada' ? 'text-success' : 'text-danger'}>
                        R$ {Number(t.valor).toFixed(2)}
                      </td>
                      <td>
                        <span className={`badge ${t.tipo === 'entrada' ? 'badge-success' : 'badge-danger'}`}>
                          {t.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                        {t.tipo === 'saida' && (
                          <div className="custom-control custom-switch d-inline-block ml-2" title="Clique para alternar o status">
                            <input 
                              type="checkbox" 
                              className="custom-control-input" 
                              id={`tableSwitch-${t.id}`} 
                              checked={t.paga || false} 
                              onChange={() => handleTogglePaymentStatus(t)} 
                            />
                            <label className="custom-control-label" htmlFor={`tableSwitch-${t.id}`} style={{ cursor: 'pointer' }}>
                              {t.paga ? 'Paga' : 'Pendente'}
                            </label>
                          </div>
                        )}
                      </td>
                      <td>{new Date(t.data || t.createdAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                      <td>
                         <button className="btn btn-sm btn-info mr-2" onClick={() => handleEdit(t)}>
                           <i className="fas fa-edit"></i>
                         </button>
                         <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}>
                           <i className="fas fa-trash"></i>
                         </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center">Nenhuma transação encontrada.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h4 className="modal-title">{editingId ? 'Editar Transação' : 'Nova Transação'}</h4>
                <button type="button" className="close" onClick={() => { setShowModal(false); setEditingId(null); }}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Descrição</label>
                    <input type="text" className="form-control" {...register('description', { required: true })} />
                  </div>
                  <div className="form-group">
                    <label>Valor (R$)</label>
                    <input type="text" placeholder="Ex: 1500,50" className="form-control" {...register('amount', { required: true })} />
                  </div>
                  <div className="form-group">
                    <label>Data</label>
                    <input type="date" className="form-control" {...register('date', { required: true })} />
                  </div>
                  <div className="form-group">
                    <label>Tipo</label>
                    <select className="form-control" {...register('type', { required: true })}>
                      <option value="entrada">Entrada</option>
                      <option value="saida">Saída</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Categoria</label>
                    <select className="form-control" {...register('categoria_id')}>
                      <option value="">-- Nenhuma Categoria --</option>
                      {categories.filter(c => c.tipo === watchType).map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>
                  {watchType === 'saida' && (
                    <div className="form-group custom-control custom-switch ml-1">
                      <input type="checkbox" className="custom-control-input" id="pagaSwitch" {...register('paga')} />
                      <label className="custom-control-label" htmlFor="pagaSwitch" style={{ cursor: 'pointer' }}>Esta conta já foi paga?</label>
                    </div>
                  )}
                </div>
                <div className="modal-footer justify-content-between">
                  <button type="button" className="btn btn-default" onClick={() => { setShowModal(false); setEditingId(null); }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">Salvar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;
