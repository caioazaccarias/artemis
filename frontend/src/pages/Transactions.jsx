import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import TransactionModal from '../components/TransactionModal';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const currentDate = new Date();
  const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [filterMonth, setFilterMonth] = useState(currentMonthYear);
  
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const loadTransactions = async () => {
    try {
      const transRes = await api.get('/transactions');
      setTransactions(transRes.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleTransactionSuccess = (newTransaction) => {
    if (newTransaction && newTransaction.data) {
      // Ajusta o filtro para o mês da transação recém salva
      const tDate = new Date(newTransaction.data);
      const tMonthYear = `${tDate.getUTCFullYear()}-${String(tDate.getUTCMonth() + 1).padStart(2, '0')}`;
      setFilterMonth(tMonthYear);
    }
    loadTransactions();
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowModal(true);
  };

  const handleOpenNewModal = () => {
    setEditingTransaction(null);
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

  const filteredTransactions = Array.isArray(transactions) ? transactions.filter(t => {
    const textMatch = t.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
    
    let monthMatch = true;
    if (filterMonth) {
      const tDate = new Date(t.data || t.createdAt);
      const tMonthYear = `${tDate.getUTCFullYear()}-${String(tDate.getUTCMonth() + 1).padStart(2, '0')}`;
      monthMatch = tMonthYear === filterMonth;
    }
    
    return textMatch && monthMatch;
  }) : [];

  return (
    <div>
      <div className="content-header">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <h1 className="m-0">Transações</h1>
          <button className="btn btn-primary shadow-sm font-weight-bold" onClick={handleOpenNewModal}>
            <i className="fas fa-plus mr-2"></i> Nova Transação
          </button>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card shadow-sm">
            <div className="card-header border-bottom-0">
              <h3 className="card-title font-weight-bold mt-1">Lista de Transações</h3>
              <div className="card-tools d-flex">
                <div className="input-group input-group-sm mr-2" style={{ width: '180px' }}>
                  <input 
                    type="month" 
                    className="form-control" 
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    title="Filtrar por Mês"
                  />
                  {filterMonth && (
                    <div className="input-group-append">
                      <button className="btn btn-outline-secondary" onClick={() => setFilterMonth('')} title="Limpar Filtro de Mês">
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                </div>
                <div className="input-group input-group-sm" style={{ width: '220px' }}>
                  <input 
                    type="text" 
                    className="form-control float-right" 
                    placeholder="Pesquisar descrição..." 
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
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th className="border-top-0">Descrição</th>
                      <th className="border-top-0">Valor</th>
                      <th className="border-top-0">Status / Tipo</th>
                      <th className="border-top-0">Data</th>
                      <th className="border-top-0" style={{ width: '120px' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(t => (
                      <tr key={t.id}>
                        <td>
                          <div className="font-weight-bold text-dark">{t.descricao}</div>
                          {t.categoriaData && <span className="badge badge-light text-muted mt-1 border"><i className="fas fa-tag mr-1 text-info"></i>{t.categoriaData.nome}</span>}
                        </td>
                        <td className={`font-weight-bold ${t.tipo === 'entrada' ? 'text-success' : 'text-danger'}`}>
                          R$ {formatCurrency(t.valor)}
                        </td>
                        <td>
                          <span className={`badge ${t.tipo === 'entrada' ? 'badge-success' : 'badge-danger'} px-2 py-1`}>
                            {t.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </span>
                          {t.tipo === 'saida' && (
                            <div className="custom-control custom-switch d-inline-block ml-3" title="Alternar Status de Pagamento">
                              <input 
                                type="checkbox" 
                                className="custom-control-input" 
                                id={`tableSwitch-${t.id}`} 
                                checked={t.paga || false} 
                                onChange={() => handleTogglePaymentStatus(t)} 
                              />
                              <label className="custom-control-label font-weight-normal text-muted" htmlFor={`tableSwitch-${t.id}`} style={{ cursor: 'pointer', fontSize: '13px' }}>
                                {t.paga ? 'Paga' : 'Pendente'}
                              </label>
                            </div>
                          )}
                        </td>
                        <td>{new Date(t.data || t.createdAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                        <td>
                           <button className="btn btn-sm btn-outline-info mr-2" onClick={() => handleEdit(t)} title="Editar">
                             <i className="fas fa-edit"></i>
                           </button>
                           <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(t.id)} title="Excluir">
                             <i className="fas fa-trash"></i>
                           </button>
                        </td>
                      </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-5 text-muted">
                          <i className="fas fa-search fa-2x mb-3 opacity-25"></i>
                          <p className="mb-0">Nenhuma transação encontrada para este período ou busca.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TransactionModal 
        show={showModal} 
        onClose={() => setShowModal(false)} 
        onSuccess={handleTransactionSuccess}
        editingData={editingTransaction}
      />
    </div>
  );
};

export default Transactions;
