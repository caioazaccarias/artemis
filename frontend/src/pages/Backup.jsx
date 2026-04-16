import React, { useState } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';

const BackupData = () => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/backup');
      
      // Gera o blob do JSON
      const dataStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      
      const exportFileDefaultName = `backup_financeiro_${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      window.URL.revokeObjectURL(url);
      
      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: 'Backup gerado e baixado com sucesso.',
        timer: 3000
      });
    } catch (error) {
      console.error(error);
      Swal.fire('Erro!', 'Falha ao gerar backup. Verifique os logs do servidor.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Confirmação dupla para ação crítica
    const result = await Swal.fire({
      title: 'Tem absoluta certeza?',
      text: 'Esta ação apagará TODAS as transações e categorias atuais para restaurar as do arquivo. Isso não pode ser desfeito!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, desejo restaurar!',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          setLoading(true);
          const backupData = JSON.parse(e.target.result);
          
          const response = await api.post('/admin/restore', backupData);
          
          Swal.fire({
            icon: 'success',
            title: 'Restauração Concluída!',
            text: `Foram restauradas ${response.data.summary.categories} categorias e ${response.data.summary.transactions} transações.`,
            confirmButtonText: 'Ótimo!'
          });
        } catch (error) {
          console.error(error);
          Swal.fire('Erro!', 'O arquivo de backup é inválido ou ocorreu um erro na importação.', 'error');
        } finally {
          setLoading(false);
          event.target.value = ''; // Reseta o input
        }
      };
      reader.readAsText(file);
    } else {
        event.target.value = ''; // Reseta o input se cancelado
    }
  };

  return (
    <div>
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0 font-weight-bold text-dark">
            <i className="fas fa-shield-alt mr-2 text-primary"></i>Admin: Backup
          </h1>
          <p className="text-muted mt-1">Gerencie a segurança dos seus dados financeiros exportando ou restaurando cópias de segurança.</p>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-6">
              <div className="card card-primary card-outline shadow-sm h-100">
                <div className="card-header">
                  <h3 className="card-title font-weight-bold">
                    <i className="fas fa-download mr-1"></i> Exportar Dados
                  </h3>
                </div>
                <div className="card-body text-center d-flex flex-column justify-content-center py-5">
                  <div className="mb-4">
                    <i className="fas fa-database fa-4x text-primary opacity-25"></i>
                  </div>
                  <p className="text-muted mb-4 px-3">
                    Cria uma cópia completa de todas as **Categorias** e **Transações** registradas no sistema em formato JSON.
                  </p>
                  <div>
                    <button 
                      className="btn btn-primary btn-lg px-5 shadow-sm font-weight-bold" 
                      onClick={handleExport}
                      disabled={loading}
                    >
                      {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-file-export mr-2"></i>}
                      Gerar Cópia de Segurança
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card card-danger card-outline shadow-sm h-100">
                <div className="card-header">
                  <h3 className="card-title font-weight-bold">
                    <i className="fas fa-upload mr-1"></i> Restaurar Dados
                  </h3>
                </div>
                <div className="card-body text-center d-flex flex-column justify-content-center py-5">
                  <div className="mb-4">
                    <i className="fas fa-history fa-4x text-danger opacity-25"></i>
                  </div>
                  <p className="text-danger mb-4 px-3 font-weight-bold">
                    AVISO: A restauração substituirá todos os dados atuais. Certifique-se de que o arquivo seja de uma fonte confiável.
                  </p>
                  <div>
                    <label className="btn btn-outline-danger btn-lg px-5 shadow-sm font-weight-bold cursor-pointer">
                      {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-upload mr-2"></i>}
                      Selecionar Arquivo .json
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleImport} 
                        style={{ display: 'none' }} 
                        disabled={loading}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-12">
              <div className="callout callout-info shadow-sm bg-white border-left-info">
                <h5><i className="fas fa-info-circle mr-2 text-info"></i> Notas Importantes</h5>
                <ul className="mb-0 text-muted">
                  <li>O backup contém apenas transações e categorias. Usuários e configurações de conta não são afetados.</li>
                  <li>Recomendamos realizar backups semanais para garantir a integridade das suas informações.</li>
                  <li>Arquivos grandes podem levar alguns segundos para serem processados. Não feche a aba durante a restauração.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BackupData;
