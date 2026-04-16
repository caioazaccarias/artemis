import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Swal from 'sweetalert2';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error(error);
      Swal.fire('Erro!', 'Erro ao carregar usuários ou acesso negado.', 'error');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onSubmit = async (data) => {
    try {
      const payload = {
        nome: data.nome,
        email: data.email,
        role: data.role
      };

      if (data.senha) {
        payload.senha = data.senha;
      }

      if (editingId) {
        await api.put(`/users/${editingId}`, payload);
        Swal.fire('Sucesso!', 'Usuário atualizado com sucesso.', 'success');
      } else {
        await api.post('/users', payload);
        Swal.fire('Sucesso!', 'Usuário recém cadastrado com sucesso.', 'success');
      }
      reset();
      setEditingId(null);
      setShowModal(false);
      loadUsers();
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao salvar usuário.';
      Swal.fire('Erro!', msg, 'error');
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    reset({
      nome: user.nome,
      email: user.email,
      role: user.role,
      senha: '' // só para criar ou sobrescrever
    });
    setShowModal(true);
  };

  const handleOpenNewModal = () => {
    setEditingId(null);
    reset({
      nome: '',
      email: '',
      role: 'user',
      senha: ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Tem certeza?',
        text: "Excluir esse usuário vai também apagar as transações associadas a ele!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!'
      });

      if (result.isConfirmed) {
        await api.delete(`/users/${id}`);
        Swal.fire('Excluído!', 'Usuário excluído.', 'success');
        loadUsers();
      }
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao excluir.';
      Swal.fire('Erro!', msg, 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="content-header">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <h1 className="m-0">Gestão de Usuários</h1>
          <button className="btn btn-primary" onClick={handleOpenNewModal}>
            <i className="fas fa-user-plus"></i> Novo Usuário
          </button>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="card border-top border-primary rounded">
            <div className="card-header">
              <h3 className="card-title mt-1">Lista Cadastrada</h3>
              <div className="card-tools">
                <div className="input-group input-group-sm" style={{ width: '200px' }}>
                  <input 
                    type="text" 
                    className="form-control float-right" 
                    placeholder="Pesquisar..." 
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
            <div className="card-body p-0 table-responsive text-nowrap">
              <table className="table table-striped table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Perfil</th>
                    <th style={{ width: '130px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id}>
                      <td className="font-weight-bold align-middle">{u.nome}</td>
                      <td className="align-middle text-muted">{u.email}</td>
                      <td className="align-middle">
                        <span className={`badge px-3 py-2 text-uppercase font-weight-bold ${u.role === 'admin' ? 'badge-primary' : 'badge-secondary'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="align-middle">
                         <button className="btn btn-sm btn-outline-info mr-2" onClick={() => handleEdit(u)} title="Editar Usuário">
                           <i className="fas fa-user-edit"></i>
                         </button>
                         <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u.id)} title="Excluir Usuário">
                           <i className="fas fa-user-times"></i>
                         </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-muted">Ainda não há usuários aqui...</td>
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
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', overflowY: 'auto' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-lg">
              <div className="modal-header bg-light border-bottom-0">
                <h4 className="modal-title font-weight-bold text-dark w-100 text-center">
                  {editingId ? 'Editar Usuário' : 'Criar Novo Usuário'}
                </h4>
                <button type="button" className="close text-dark" onClick={() => { setShowModal(false); setEditingId(null); }}>
                  <span>&times;</span>
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body p-4">
                  <div className="form-group mb-4">
                    <label className="text-muted mb-1 text-sm">Nome Completo</label>
                    <input 
                       type="text" 
                       className={`form-control ${errors.nome ? 'is-invalid' : ''}`} 
                       placeholder="Ex: João da Silva"
                       {...register('nome', { required: 'Nome é obrigatório' })} 
                    />
                    {errors.nome && <span className="invalid-feedback">{errors.nome.message}</span>}
                  </div>
                  
                  <div className="form-group mb-4">
                    <label className="text-muted mb-1 text-sm">Email</label>
                    <input 
                       type="email" 
                       className={`form-control ${errors.email ? 'is-invalid' : ''}`} 
                       placeholder="joao@example.com"
                       {...register('email', { required: 'E-mail é obrigatório' })} 
                    />
                    {errors.email && <span className="invalid-feedback">{errors.email.message}</span>}
                  </div>

                  <div className="form-row">
                    <div className="form-group col-md-6 mb-4">
                      <label className="text-muted mb-1 text-sm">Nível de Acesso (Perfil)</label>
                      <select className="form-control" {...register('role')}>
                        <option value="user">Usuário Básico</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                    
                    <div className="form-group col-md-6 mb-4">
                      <label className="text-muted mb-1 text-sm">Senha {editingId && '(Opcional)'}</label>
                      <input 
                         type="password" 
                         className={`form-control ${errors.senha ? 'is-invalid' : ''}`} 
                         placeholder={editingId ? 'Preencha para alterar' : 'Senha segura'}
                         {...register('senha', { 
                           required: !editingId ? 'Senha inicial é obrigatória' : false 
                         })} 
                      />
                      {errors.senha && <span className="invalid-feedback">{errors.senha.message}</span>}
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-light border-top-0 d-flex justify-content-between">
                  <button type="button" className="btn btn-outline-secondary px-4 py-2" onClick={() => { setShowModal(false); setEditingId(null); }}>Cancelar</button>
                  <button type="submit" className="btn btn-primary px-4 py-2 font-weight-bold">
                    <i className="fas fa-save mr-2"></i> {editingId ? 'Salvar Edição' : 'Criar Conta'}
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

export default Users;
