import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Swal from 'sweetalert2';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const availablePermissions = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-tachometer-alt' },
    { id: 'transactions', label: 'Transações', icon: 'fa-list' },
    { id: 'categories', label: 'Categorias', icon: 'fa-tags' },
    { id: 'users', label: 'Usuários', icon: 'fa-users' },
    { id: 'roles', label: 'Perfis e Permissões', icon: 'fa-user-tag' },
    { id: 'backup', label: 'Backup do Sistema', icon: 'fa-database' }
  ];

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      nome: '',
      permissoes: []
    }
  });

  const watchPermissions = watch('permissoes');

  const loadRoles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roles');
      setRoles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error(error);
      Swal.fire('Erro!', 'Erro ao carregar perfis.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (editingId) {
        await api.put(`/roles/${editingId}`, data);
        Swal.fire('Sucesso!', 'Perfil atualizado com sucesso.', 'success');
      } else {
        await api.post('/roles', data);
        Swal.fire('Sucesso!', 'Perfil criado com sucesso.', 'success');
      }
      reset();
      setEditingId(null);
      setShowModal(false);
      loadRoles();
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao salvar perfil.';
      Swal.fire('Erro!', msg, 'error');
    }
  };

  const handleEdit = (role) => {
    setEditingId(role.id);
    let permissoes = role.permissoes || [];
    if (typeof permissoes === 'string') {
      try { permissoes = JSON.parse(permissoes); } catch (e) { permissoes = []; }
    }
    
    reset({
      nome: role.nome,
      permissoes: permissoes
    });
    setShowModal(true);
  };

  const handleOpenNewModal = () => {
    setEditingId(null);
    reset({
      nome: '',
      permissoes: []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Tem certeza?',
        text: "Essa ação não pode ser revertida e usuários com este perfil ficarão sem acesso!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!'
      });

      if (result.isConfirmed) {
        await api.delete(`/roles/${id}`);
        Swal.fire('Excluído!', 'Perfil removido.', 'success');
        loadRoles();
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao excluir perfil.';
      Swal.fire('Erro!', msg, 'error');
    }
  };

  const togglePermission = (permId) => {
    const current = watchPermissions || [];
    if (current.includes(permId)) {
      setValue('permissoes', current.filter(p => p !== permId));
    } else {
      setValue('permissoes', [...current, permId]);
    }
  };

  return (
    <div>
      <div className="content-header">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <h1 className="m-0">Gestão de Perfis</h1>
          <button className="btn btn-primary font-weight-bold shadow-sm" onClick={handleOpenNewModal}>
            <i className="fas fa-plus-circle mr-2"></i> Novo Perfil
          </button>
        </div>
      </div>

      <section className="content mt-3">
        <div className="container-fluid">
          <div className="card shadow-sm border-top border-primary rounded">
            <div className="card-header border-bottom-0">
              <h3 className="card-title font-weight-bold">
                <i className="fas fa-user-shield mr-2 text-primary"></i> Perfis Cadastrados
              </h3>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center p-5">
                   <div className="spinner-border text-primary" role="status">
                     <span className="sr-only">Carregando...</span>
                   </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Nome do Perfil</th>
                        <th>Permissões</th>
                        <th style={{ width: '130px' }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roles.map(role => (
                        <tr key={role.id}>
                          <td className="align-middle font-weight-bold text-dark">
                            {role.nome}
                            {role.id === 1 && <span className="badge badge-info ml-2">Sistema (Root)</span>}
                            {role.id === 2 && <span className="badge badge-secondary ml-2">Sistema (Basic)</span>}
                          </td>
                          <td className="align-middle">
                            <div className="d-flex flex-wrap" style={{ gap: '4px' }}>
                              {(() => {
                                let perms = role.permissoes || [];
                                if (typeof perms === 'string') {
                                  try { perms = JSON.parse(perms); } catch (e) { perms = []; }
                                }
                                if (!Array.isArray(perms)) perms = [];
                                
                                return perms.map(p => (
                                  <span key={p} className="badge badge-light border text-xs py-1 px-2">
                                    {availablePermissions.find(ap => ap.id === p)?.label || p}
                                  </span>
                                ));
                              })()}
                              {(!role.permissoes || role.permissoes.length === 0) && <span className="text-muted text-xs">Nenhuma permissão</span>}
                            </div>
                          </td>
                          <td className="align-middle">
                            <button className="btn btn-sm btn-outline-info mr-2" onClick={() => handleEdit(role)} title="Editar Perfil">
                              <i className="fas fa-edit"></i>
                            </button>
                            {role.id > 2 && (
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(role.id)} title="Excluir Perfil">
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-light">
                <h4 className="modal-title font-weight-bold">
                  {editingId ? <i className="fas fa-edit mr-2 text-info"></i> : <i className="fas fa-plus mr-2 text-primary"></i>}
                  {editingId ? 'Editar Perfil' : 'Novo Perfil'}
                </h4>
                <button type="button" className="close" onClick={() => { setShowModal(false); setEditingId(null); }}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body p-4">
                  <div className="form-group mb-4">
                    <label className="text-muted text-sm font-weight-bold">Nome do Perfil</label>
                    <input 
                      type="text" 
                      className={`form-control form-control-lg ${errors.nome ? 'is-invalid' : ''}`}
                      placeholder="Ex: Gerente, Visualizador..."
                      {...register('nome', { required: 'Nome é obrigatório' })}
                      disabled={editingId === 1}
                    />
                    {errors.nome && <div className="invalid-feedback">{errors.nome.message}</div>}
                  </div>

                  <label className="text-muted text-sm font-weight-bold mb-3">Definir Permissões de Acesso</label>
                  <div className="row">
                    {availablePermissions.map(perm => (
                      <div className="col-md-6 mb-3" key={perm.id}>
                        <div 
                          className={`p-3 border rounded d-flex align-items-center justify-content-between position-relative ${watchPermissions?.includes(perm.id) ? 'border-primary bg-light' : ''}`}
                          style={{ cursor: editingId === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                          onClick={() => editingId !== 1 && togglePermission(perm.id)}
                        >
                          <div className="d-flex align-items-center">
                            <div className={`mr-3 rounded-circle d-flex align-items-center justify-content-center ${watchPermissions?.includes(perm.id) ? 'bg-primary text-white' : 'bg-secondary text-light'}`} style={{ width: '35px', height: '35px' }}>
                               <i className={`fas ${perm.icon}`}></i>
                            </div>
                            <div>
                               <div className="font-weight-bold text-dark">{perm.label}</div>
                               <div className="text-xs text-muted">Acesso ao módulo de {perm.label.toLowerCase()}</div>
                            </div>
                          </div>
                          <div className="custom-control custom-checkbox">
                             <input 
                                type="checkbox" 
                                className="custom-control-input" 
                                id={`check-${perm.id}`} 
                                checked={Array.isArray(watchPermissions) && watchPermissions.includes(perm.id)}
                                onChange={() => {}} // dummy, handle via div click
                                disabled={editingId === 1}
                             />
                             <label className="custom-control-label" htmlFor={`check-${perm.id}`}></label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {editingId === 1 && (
                    <div className="alert alert-warning mt-3 mb-0">
                      <i className="fas fa-exclamation-triangle mr-2"></i>
                      O perfil de Administrador do sistema possui todas as permissões e não pode ser editado.
                    </div>
                  )}
                </div>
                <div className="modal-footer bg-light border-top-0 d-flex justify-content-between">
                  <button type="button" className="btn btn-outline-secondary px-4" onClick={() => { setShowModal(false); setEditingId(null); }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary px-4 font-weight-bold" disabled={editingId === 1}>
                    <i className="fas fa-save mr-2"></i> Salvar Perfil
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

export default Roles;
