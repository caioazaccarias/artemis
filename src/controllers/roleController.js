const { Role, User } = require('../models');

exports.index = async (req, res) => {
  try {
    const roles = await Role.findAll({ order: [['id', 'ASC']] });
    return res.json(roles);
  } catch (err) {
    return res.status(500).json({ error: 'Erro ao buscar perfis', details: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { nome, permissoes } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'O nome do perfil é obrigatório' });
    }

    const role = await Role.create({
      nome,
      permissoes: permissoes || []
    });

    return res.status(201).json(role);
  } catch (err) {
    return res.status(400).json({ error: 'Falha ao criar perfil', details: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, permissoes } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Proteger edição do Administrador principal (ID 1)
    if (role.id === 1) {
      return res.status(403).json({ error: 'O perfil de Administrador raiz não pode ser modificado.' });
    }

    await role.update({ nome, permissoes });

    return res.json(role);
  } catch (err) {
    return res.status(400).json({ error: 'Falha ao atualizar perfil', details: err.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    // Proteger deleção de perfis sensíveis (Admin ID 1 e User Básico ID 2)
    if (role.id === 1 || role.id === 2) {
      return res.status(403).json({ error: 'Os perfis de sistema padrão (Admin e User) não podem ser excluídos.' });
    }

    // Verificar se há usuários associados a este perfil
    const associadosCount = await User.count({ where: { role_id: id } });
    if (associadosCount > 0) {
      return res.status(400).json({ error: 'Não é possível excluir um perfil que possui usuários associados.' });
    }

    await role.destroy();

    return res.status(204).send();
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao deletar perfil', details: err.message });
  }
};
