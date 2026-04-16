import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Swal from 'sweetalert2';

const TransactionModal = ({ show, onClose, onSuccess, editingData = null }) => {
  const [categories, setCategories] = useState([]);
  const { register, handleSubmit, reset, watch, setValue } = useForm();
  const watchType = watch('type');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data);
      } catch (error) {
        console.error('Erro ao buscar categorias', error);
      }
    };

    if (show) {
      loadCategories();
      if (editingData) {
        let formattedDate = '';
        if (editingData.data) {
          formattedDate = new Date(editingData.data).toISOString().split('T')[0];
        } else if (editingData.createdAt) {
          formattedDate = new Date(editingData.createdAt).toISOString().split('T')[0];
        }

        reset({
          description: editingData.descricao,
          amount: Number(editingData.valor).toFixed(2).replace('.', ','),
          type: editingData.tipo,
          categoria_id: editingData.categoria_id || '',
          date: formattedDate,
          paga: editingData.paga
        });
      } else {
        reset({
          description: '',
          amount: '',
          type: 'entrada',
          categoria_id: '',
          date: new Date().toISOString().split('T')[0],
          paga: false
        });
      }
    }
  }, [show, editingData, reset]);

  useEffect(() => {
    if (show && !editingData) {
      setValue('categoria_id', '');
    }
  }, [watchType, setValue, show, editingData]);

  const onSubmit = async (data) => {
    try {
      let parsedAmount = String(data.amount);
      if (parsedAmount.includes(',')) {
        parsedAmount = parsedAmount.replace(/\./g, '').replace(',', '.');
      }

      const payload = {
        descricao: data.description,
        valor: Number(parsedAmount),
        tipo: data.type,
        categoria_id: data.categoria_id || null,
        data: data.date,
        paga: data.paga
      };

      if (editingData) {
        await api.put(`/transactions/${editingData.id}`, payload);
        Swal.fire('Sucesso!', 'Transação atualizada com sucesso.', 'success');
      } else {
        await api.post('/transactions', payload);
        Swal.fire('Sucesso!', 'Transação cadastrada com sucesso.', 'success');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      Swal.fire('Erro!', 'Erro ao salvar transação.', 'error');
    }
  };

  if (!show) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title font-weight-bold">
              {editingData ? <i className="fas fa-edit mr-2 text-info"></i> : <i className="fas fa-plus mr-2 text-primary"></i>}
              {editingData ? 'Editar Transação' : 'Nova Transação'}
            </h4>
            <button type="button" className="close" onClick={onClose}>
              <span>&times;</span>
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              <div className="form-group">
                <label>Descrição</label>
                <input type="text" className="form-control" placeholder="Ex: Mercado, Aluguel..." {...register('description', { required: true })} />
              </div>
              <div className="form-group">
                <label>Valor (R$)</label>
                <input type="text" placeholder="Ex: 1.500,50" className="form-control" {...register('amount', { required: true })} />
              </div>
              <div className="form-group">
                <label>Data</label>
                <input type="date" className="form-control" {...register('date', { required: true })} />
              </div>
              <div className="form-group">
                <label>Tipo</label>
                <select className="form-control" {...register('type', { required: true })}>
                  <option value="entrada">Entrada (Receita)</option>
                  <option value="saida">Saída (Despesa)</option>
                </select>
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select className="form-control" {...register('categoria_id')}>
                  <option value="">-- Sem Categoria --</option>
                  {categories.filter(c => c.tipo === watchType).map(c => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              {watchType === 'saida' && (
                <div className="form-group custom-control custom-switch ml-1">
                  <input type="checkbox" className="custom-control-input" id="modalPagaSwitch" {...register('paga')} />
                  <label className="custom-control-label" htmlFor="modalPagaSwitch" style={{ cursor: 'pointer' }}>Esta conta já foi paga?</label>
                </div>
              )}
            </div>
            <div className="modal-footer justify-content-between bg-light">
              <button type="button" className="btn btn-default shadow-sm" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn btn-primary shadow-sm font-weight-bold px-4">Salvar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
