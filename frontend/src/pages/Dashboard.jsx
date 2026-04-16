import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [resume, setResume] = useState({ totalEntradas: 0, totalSaidas: 0, saldo: 0 });
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const response = await api.get('/transactions/summary');
        const { totalEntradas, totalSaidas, saldoTotal } = response.data;

        setResume({
          totalEntradas: totalEntradas || 0,
          totalSaidas: totalSaidas || 0,
          saldo: saldoTotal || 0
        });
      } catch (error) {
        console.error('Erro ao buscar resumo', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const dataChart = [
    { name: 'Entradas', value: resume.totalEntradas, color: '#28a745' },
    { name: 'Saídas', value: resume.totalSaidas, color: '#dc3545' },
  ];

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="content-header">
        <div className="container-fluid">
          <h1 className="m-0">
            Dashboard
            <button
              onClick={() => setShowValues(!showValues)}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
              className="ml-3 text-secondary"
              title={showValues ? "Ocultar Valores" : "Exibir Valores"}
            >
              <i className={`fas ${showValues ? 'fa-eye-slash' : 'fa-eye'}`}></i>
            </button>
          </h1>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-4 col-6">
              <div className="small-box bg-success">
                <div className="inner">
                  <h3>{showValues ? `R$ ${resume.totalEntradas.toFixed(2)}` : 'R$ ****'}</h3>
                  <p>Total de Entradas</p>
                </div>
                <div className="icon">
                  <i className="fas fa-arrow-up"></i>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 col-6">
              <div className="small-box bg-danger">
                <div className="inner">
                  <h3>{showValues ? `R$ ${resume.totalSaidas.toFixed(2)}` : 'R$ ****'}</h3>
                  <p>Total de Saídas</p>
                </div>
                <div className="icon">
                  <i className="fas fa-arrow-down"></i>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-12">
              <div className={`small-box ${resume.saldo >= 0 ? 'bg-info' : 'bg-warning'}`}>
                <div className="inner">
                  <h3>{showValues ? `R$ ${resume.saldo.toFixed(2)}` : 'R$ ****'}</h3>
                  <p>Saldo Atual</p>
                </div>
                <div className="icon">
                  <i className="fas fa-wallet"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-md-6 offset-md-3">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Resumo Financeiro</h3>
                </div>
                <div className="card-body">
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={dataChart}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          label
                        >
                          {dataChart.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
