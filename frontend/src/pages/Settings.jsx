import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const Settings = () => {
  const [commissionPct, setCommissionPct] = useState(10);
  const [paymentFees, setPaymentFees] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Fee Form
  const [newName, setNewName] = useState('');
  const [newPct, setNewPct] = useState('');

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      setCommissionPct(res.data.commission_percentage || 10);
      setPaymentFees(res.data.payment_fees || []);
    } catch (e) {
      Swal.fire('Erro', 'Não foi possível carregar as configurações.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveCommission = async () => {
    try {
      await api.put('/settings', { commission_percentage: commissionPct });
      Swal.fire('Sucesso', 'Porcentagem base atualizada.', 'success');
    } catch (e) {
      Swal.fire('Erro', 'Falha ao atualizar porcentagem.', 'error');
    }
  };

  const handleAddFee = async (e) => {
    e.preventDefault();
    if (!newName || !newPct) return;

    const newFee = {
      id: Date.now(),
      name: newName,
      percentage: parseFloat(newPct)
    };

    const updatedFees = [...paymentFees, newFee];
    
    try {
      await api.put('/settings', { payment_fees: updatedFees });
      setPaymentFees(updatedFees);
      setNewName('');
      setNewPct('');
      Swal.fire({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
        icon: 'success', title: 'Taxa adicionada!'
      });
    } catch(e) {
      Swal.fire('Erro', 'Falha ao gravar taxa.', 'error');
    }
  };

  const handleRemoveFee = async (id) => {
    const updatedFees = paymentFees.filter(f => f.id !== id);
    try {
      await api.put('/settings', { payment_fees: updatedFees });
      setPaymentFees(updatedFees);
      Swal.fire({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
        icon: 'success', title: 'Taxa removida!'
      });
    } catch(e) {
      Swal.fire('Erro', 'Falha ao remover taxa.', 'error');
    }
  };

  if (loading) return <div className="p-5 text-center"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="p-4 bg-light min-vh-100">
      <div className="mb-4 p-3 bg-white rounded shadow-sm border-left border-primary border-4">
        <h1 className="h4 mb-0 font-weight-bold text-dark text-uppercase">Configurações de Comissionamento</h1>
        <small className="text-muted">Opções globais do sistema de pagamentos e taxas</small>
      </div>

      <div className="row">
        {/* Bloco Porcentagem Global */}
        <div className="col-md-5 mb-4">
          <div className="card shadow-sm border-0 rounded-lg">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="font-weight-bold text-primary mb-0"><i className="fas fa-percent mr-2"></i> Base de Comissão Global</h5>
            </div>
            <div className="card-body pt-3">
              <p className="text-muted small">Altere o repasse padrão calculado sobre o <b>lucro real</b> em novos lançamentos.</p>
              
              <div className="input-group input-group-lg mb-3">
                <input 
                  type="number" 
                  step="0.1" 
                  className="form-control font-weight-bold text-center border-right-0" 
                  value={commissionPct} 
                  onChange={e => setCommissionPct(e.target.value)} 
                />
                <div className="input-group-append">
                  <span className="input-group-text bg-white">%</span>
                </div>
              </div>
              
              <button className="btn btn-primary btn-block font-weight-bold shadow-sm" onClick={handleSaveCommission}>
                <i className="fas fa-save mr-2"></i> SALVAR PORCENTAGEM
              </button>
            </div>
          </div>
        </div>

        {/* Bloco Taxas Customizadas */}
        <div className="col-md-7 mb-4">
          <div className="card shadow-sm border-0 rounded-lg">
            <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
              <h5 className="font-weight-bold text-info mb-0"><i className="fas fa-credit-card mr-2"></i> Simulador & Taxas Retidas</h5>
            </div>
            <div className="card-body pt-3">
              <p className="text-muted small">Cadastre infinitas condições comerciais (ex: "Crédito 12x", "Link de Pagamento", "Pix").</p>
              
              <form className="mb-4 bg-light p-3 rounded border" onSubmit={handleAddFee}>
                <div className="row align-items-end">
                  <div className="col-md-6 form-group mb-0">
                    <label className="text-xs font-weight-bold text-muted text-uppercase mb-1">Nome da Regra</label>
                    <input type="text" className="form-control form-control-sm" placeholder="Ex: Cartão de Crédito 3x" value={newName} onChange={e => setNewName(e.target.value)} required />
                  </div>
                  <div className="col-md-4 form-group mb-0">
                    <label className="text-xs font-weight-bold text-muted text-uppercase mb-1">Retenção (%)</label>
                    <div className="input-group input-group-sm">
                      <input type="number" step="0.01" className="form-control" placeholder="1.25" value={newPct} onChange={e => setNewPct(e.target.value)} required />
                      <div className="input-group-append"><span className="input-group-text bg-white">%</span></div>
                    </div>
                  </div>
                  <div className="col-md-2 form-group mb-0 text-right">
                    <button type="submit" className="btn btn-info btn-sm w-100 font-weight-bold"><i className="fas fa-plus"></i></button>
                  </div>
                </div>
              </form>

              {paymentFees.length === 0 ? (
                <div className="text-center text-muted py-4"><i className="fas fa-inbox fa-3x mb-2 opacity-50"></i><br/>Nenhuma taxa cadastrada.</div>
              ) : (
                <ul className="list-group list-group-flush border rounded">
                  {paymentFees.map(fee => (
                    <li key={fee.id} className="list-group-item d-flex justify-content-between align-items-center bg-white">
                      <span><i className="fas fa-tag text-info mr-2 opacity-50"></i> <strong className="text-dark">{fee.name}</strong></span>
                      <div>
                        <span className="badge badge-light border text-danger mr-3 p-2 font-weight-bold">- {parseFloat(fee.percentage).toFixed(2)} %</span>
                        <button className="btn btn-link text-danger p-0" onClick={() => handleRemoveFee(fee.id)} title="Excluir taxa"><i className="fas fa-trash-alt"></i></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .opacity-50 { opacity: 0.5; }
        .text-xs { font-size: 0.70rem; }
      `}</style>
    </div>
  );
};

export default Settings;
