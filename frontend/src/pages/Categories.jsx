import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Swal from 'sweetalert2';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Erro!', 'Erro ao carregar categorias.', 'error');
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, data);
        Swal.fire('Sucesso!', 'Categoria atualizada.', 'success');
      } else {
        await api.post('/categories', data);
        Swal.fire('Sucesso!', 'Categoria cadastrada.', 'success');
      }
      reset();
      setEditingId(null);
      setShowModal(false);
      loadCategories();
    } catch (error) {
      Swal.fire('Erro!', 'Erro ao salvar categoria.', 'error');
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id);
    reset({
      nome: category.nome,
      tipo: category.tipo
    });
    setShowModal(true);
  };

  const handleOpenNewModal = () => {
    setEditingId(null);
    reset({
      nome: '',
      tipo: 'saida'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Tem certeza?',
        text: "Essa categoria será excluída.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!'
      });

      if (result.isConfirmed) {
        await api.delete(`/categories/${id}`);
        Swal.fire('Excluído!', 'Sua categoria foi excluída.', 'success');
        loadCategories();
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao excluir.';
      Swal.fire('Erro!', msg, 'error');
    }
  };

  return (
    <div>
      <div className="content-header px-2">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <h1 className="m-0 text-dark font-weight-bold" style={{ fontSize: '1.8rem' }}>Categorias</h1>
          <button className="btn btn-primary font-weight-bold shadow-sm d-flex align-items-center" onClick={handleOpenNewModal}>
            <i className="fas fa-plus-circle mr-sm-2"></i> 
            <span className="d-none d-sm-inline">Nova Categoria</span>
          </button>
        </div>
      </div>

      <section className="content mt-2">
        <div className="container-fluid">
          <div className="card shadow-sm border-0 rounded-lg">
            <div className="card-header bg-white border-bottom-0 pt-4 px-4">
              <h3 className="card-title font-weight-bold text-muted">
                <i className="fas fa-th-large mr-2 text-info"></i> Organização Financeira
              </h3>
            </div>
            <div className="card-body p-3">
              <div className="row mx-0">
                {categories.length === 0 && (
                  <div className="col-12 text-center text-muted py-5">
                    <i className="fas fa-folder-open mb-3" style={{ fontSize: '3.5rem', opacity: 0.3 }}></i>
                    <h5>Nenhuma categoria cadastrada</h5>
                    <p>Crie categorias para classificar suas receitas e despesas.</p>
                  </div>
                )}
                {categories.map(c => (
                  <div className="col-xl-3 col-lg-4 col-md-6 col-12 px-2 mb-3" key={c.id}>
                    <div className={`info-box shadow-none border rounded-lg h-100 mb-0 transition-all ${c.tipo === 'entrada' ? 'border-success-light' : 'border-danger-light'}`} 
                         style={{ 
                            minHeight: '85px', 
                            borderLeft: `5px solid ${c.tipo === 'entrada' ? '#28a745' : '#dc3545'}`,
                            transition: 'transform .2s ease-in-out'
                         }}>
                      <span className={`info-box-icon elevation-0 rounded-circle my-auto ml-2 ${c.tipo === 'entrada' ? 'bg-success' : 'bg-danger'}`} 
                            style={{ width: '42px', height: '42px', minWidth: '42px' }}>
                        <i className={`fas ${c.tipo === 'entrada' ? 'fa-arrow-up' : 'fa-arrow-down'}`} style={{ fontSize: '1rem' }}></i>
                      </span>
                      
                      <div className="info-box-content py-2 pl-3 d-flex flex-column justify-content-center">
                        <span className="info-box-text text-uppercase text-xs font-weight-bold opacity-70" style={{ color: c.tipo === 'entrada' ? '#28a745' : '#dc3545' }}>
                          {c.tipo === 'entrada' ? 'Receita' : 'Despesa'}
                        </span>
                        <span className="info-box-number text-md font-weight-bold text-dark m-0 truncate">{c.nome}</span>
                      </div>
                      
                      <div className="info-box-actions d-flex align-items-center pr-2 ml-auto">
                        <button className="btn btn-xs btn-link text-muted p-2 hover-text-info" onClick={() => handleEdit(c)} title="Editar">
                          <i className="fas fa-pencil-alt"></i>
                        </button>
                        <button className="btn btn-xs btn-link text-muted p-2 hover-text-danger" onClick={() => handleDelete(c.id)} title="Excluir">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-lg">
              <div className="modal-header bg-light border-bottom-0">
                <h4 className="modal-title font-weight-bold text-dark w-100 text-center">
                  <i className="fas fa-tag mr-2 text-info"></i>{editingId ? 'Editar Categoria' : 'Nova Categoria'}
                </h4>
                <button type="button" className="close text-dark" onClick={() => { setShowModal(false); setEditingId(null); }}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body p-4">
                  <div className="form-group mb-4">
                    <label className="text-muted mb-1 text-sm font-weight-bold">Nome da Categoria</label>
                    <input 
                       type="text" 
                       className={`form-control form-control-lg text-md ${errors.nome ? 'is-invalid' : ''}`} 
                       placeholder="Ex: Alimentação, Salário..."
                       {...register('nome', { required: 'O nome é obrigatório' })} 
                    />
                    {errors.nome && <span className="invalid-feedback">{errors.nome.message}</span>}
                  </div>
                  
                  <div className="form-group mb-2">
                    <label className="text-muted mb-1 text-sm font-weight-bold">Tipo da Categoria</label>
                    <div className="d-flex bg-light p-2 rounded">
                      <div className="custom-control custom-radio mr-4">
                        <input className="custom-control-input custom-control-input-danger" type="radio" id="tipoSaida" value="saida" {...register('tipo')} defaultChecked />
                        <label htmlFor="tipoSaida" className="custom-control-label" style={{ cursor: 'pointer' }}>Despesa (Saída)</label>
                      </div>
                      <div className="custom-control custom-radio">
                        <input className="custom-control-input custom-control-input-success" type="radio" id="tipoEntrada" value="entrada" {...register('tipo')} />
                        <label htmlFor="tipoEntrada" className="custom-control-label" style={{ cursor: 'pointer' }}>Receita (Entrada)</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-top-0 d-flex justify-content-between">
                  <button type="button" className="btn btn-outline-secondary px-4 py-2 font-weight-bold" onClick={() => { setShowModal(false); setEditingId(null); }}>Cancelar</button>
                  <button type="submit" className="btn btn-info px-4 py-2 font-weight-bold text-white shadow-sm">
                    <i className="fas fa-save mr-2"></i> Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
