import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Swal from 'sweetalert2';

const Dashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(false);
  const [chartView, setChartView] = useState('tipo'); // 'tipo' ou 'categoria'

  const currentDate = new Date();
  const currentMonthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const [filterMonth, setFilterMonth] = useState(currentMonthYear);

  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c'];

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/transactions');
      setTransactions(res.data || []);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar transações pelo mês selecionado e calcular resumo
  const filteredData = Array.isArray(transactions) ? transactions.filter(t => {
    const tDate = new Date(t.data || t.createdAt);
    const tMonthYear = `${tDate.getUTCFullYear()}-${String(tDate.getUTCMonth() + 1).padStart(2, '0')}`;
    return tMonthYear === filterMonth;
  }) : [];

  const totals = filteredData.reduce((acc, t) => {
    const val = parseFloat(t.valor);
    if (t.tipo === 'entrada') acc.totalEntradas += val;
    else acc.totalSaidas += val;
    return acc;
  }, { totalEntradas: 0, totalSaidas: 0 });

  const saldo = totals.totalEntradas - totals.totalSaidas;

  const upcomingBills = Array.isArray(transactions) ? transactions
    .filter(t => t.tipo === 'saida' && !t.paga)
    .sort((a, b) => new Date(a.data || a.createdAt) - new Date(b.data || b.createdAt)) : [];

  const dataChartTipo = [
    { name: 'Entradas', value: totals.totalEntradas, color: '#28a745' },
    { name: 'Saídas', value: totals.totalSaidas, color: '#dc3545' },
  ];

  const categoryMap = filteredData
    .filter(t => t.tipo === 'saida')
    .reduce((acc, t) => {
      const catName = t.categoriaData?.nome || 'Sem Categoria';
      acc[catName] = (acc[catName] || 0) + parseFloat(t.valor);
      return acc;
    }, {});

  const dataChartCategoria = Object.keys(categoryMap).map((name, index) => ({
    name,
    value: categoryMap[name],
    color: colors[index % colors.length]
  }));

  const handlePayBill = async (transaction) => {
    try {
      await api.put(`/transactions/${transaction.id}`, { paga: true });
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 2000
      });
      Toast.fire({ icon: 'success', title: 'Conta marcada como paga!' });
      loadData();
    } catch (error) {
      Swal.fire('Erro!', 'Erro ao atualizar o status da conta.', 'error');
    }
  };

  if (loading) return <div className="p-4">Carregando Dashboard...</div>;

  const dataChart = chartView === 'tipo' ? dataChartTipo : dataChartCategoria;

  return (
    <div>
      <div className="content-header">
        <div className="container-fluid d-flex justify-content-between align-items-center flex-wrap">
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
          <div className="d-flex align-items-center mt-2 mt-md-0">
            <span className="mr-2 text-muted font-weight-bold">Período:</span>
            <input 
              type="month" 
              className="form-control" 
              style={{ width: '180px' }}
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

      <section className="content">
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-4 col-md-6 col-12 mb-3">
              <div className="small-box bg-success shadow-sm">
                <div className="inner">
                  <h3>{showValues ? `R$ ${totals.totalEntradas.toFixed(2).replace('.', ',')}` : 'R$ ****'}</h3>
                  <p>Entradas (Mês)</p>
                </div>
                <div className="icon">
                  <i className="fas fa-arrow-up"></i>
                </div>
              </div>
            </div>
            
            <div className="col-lg-4 col-md-6 col-12 mb-3">
              <div className="small-box bg-danger shadow-sm">
                <div className="inner">
                  <h3>{showValues ? `R$ ${totals.totalSaidas.toFixed(2).replace('.', ',')}` : 'R$ ****'}</h3>
                  <p>Saídas (Mês)</p>
                </div>
                <div className="icon">
                  <i className="fas fa-arrow-down"></i>
                </div>
              </div>
            </div>

            <div className="col-lg-4 col-md-12 col-12 mb-3">
              <div className={`small-box shadow-sm ${saldo >= 0 ? 'bg-info' : 'bg-warning'}`}>
                <div className="inner">
                  <h3>{showValues ? `R$ ${saldo.toFixed(2).replace('.', ',')}` : 'R$ ****'}</h3>
                  <p>Saldo (Mês)</p>
                </div>
                <div className="icon">
                  <i className="fas fa-wallet"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-2">
            <div className="col-md-6 mb-4">
              <div className="card h-100 shadow-sm">
                <div className="card-header border-bottom-0 d-flex align-items-center">
                  <h3 className="card-title font-weight-bold">
                    <i className="fas fa-chart-pie mr-2 text-primary"></i>Resumo Financeiro
                  </h3>
                  <div className="btn-group btn-group-toggle ml-auto shadow-sm" style={{ height: '28px' }}>
                    <button 
                      className={`btn btn-xs py-0 px-2 ${chartView === 'tipo' ? 'btn-primary' : 'btn-light border'}`} 
                      onClick={() => setChartView('tipo')}
                    >
                      Por Tipo
                    </button>
                    <button 
                      className={`btn btn-xs py-0 px-2 ${chartView === 'categoria' ? 'btn-primary' : 'btn-light border'}`} 
                      onClick={() => setChartView('categoria')}
                    >
                      Categorias
                    </button>
                  </div>
                </div>
                <div className="card-body">
                  {dataChart.some(d => d.value > 0) ? (
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
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {dataChart.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => showValues ? `R$ ${value.toFixed(2).replace('.', ',')}` : 'R$ ****'} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center text-muted py-5 my-4">
                      <i className="fas fa-chart-pie fa-3x mb-3 text-light"></i>
                      <p className="mb-0">Nenhuma movimentação {chartView === 'categoria' ? 'de saída ' : ''}neste período.</p>
                      <small>Tente mudar o mês no seletor acima.</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-4">
              <div className="card h-100 shadow-sm border-top border-warning">
                <div className="card-header">
                  <h3 className="card-title font-weight-bold">
                    <i className="fas fa-calendar-alt mr-2 text-warning"></i>Próximas Contas (Pendentes)
                  </h3>
                </div>
                <div className="card-body p-0" style={{ maxHeight: '380px', overflowY: 'auto' }}>
                  <ul className="products-list product-list-in-card pl-3 pr-3">
                    {upcomingBills.map(bill => (
                      <li className="item d-flex justify-content-between align-items-center py-3 border-bottom" key={bill.id}>
                        <div style={{ maxWidth: '60%' }}>
                          <div className="product-title font-weight-bold text-dark">{bill.descricao}</div>
                          <span className="product-description text-xs text-danger mt-1">
                            <i className="far fa-clock mr-1"></i>
                            Vence em: {new Date(bill.data || bill.createdAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                          </span>
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="badge badge-danger text-sm mr-2 p-2">
                            {showValues ? `R$ ${Number(bill.valor).toFixed(2).replace('.', ',')}` : 'R$ ****'}
                          </span>
                          <button 
                            className="btn btn-sm btn-outline-success border-2" 
                            onClick={() => handlePayBill(bill)} 
                            title="Marcar como paga"
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        </div>
                      </li>
                    ))}
                    {upcomingBills.length === 0 && (
                      <div className="text-center text-muted py-5 my-4">
                        <i className="fas fa-check-circle text-success fa-3x mb-3 opacity-50"></i>
                        <p className="mb-0">Ufa! Não temos contas pendentes.</p>
                        <small>Tudo em dia por aqui!</small>
                      </div>
                    )}
                  </ul>
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
