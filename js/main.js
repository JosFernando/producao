import { firebaseAuth, handleLogin, handleRegister, handleLogout, handleForgotPassword, togglePasswordVisibility } from './auth.js';
import { handleNavClick, closeModal, getOnConfirmCallback } from './ui.js';
import { handleNewCliente, saveCliente, handleClienteListClick, handleNewProduto, saveProduto, handleProdutoListClick, handleNewUser, saveUser, handleUserListClick, applyFiltersAndRender } from './data.js';
import { handleGenerateReport, saveEcopontoRegisto, handleEcopontoListClick } from './reports.js';

document.addEventListener('DOMContentLoaded', function() {
    firebaseAuth();
    setupEventListeners();
    document.getElementById('copyright-year').textContent = new Date().getFullYear();
    createCharts();
    document.querySelectorAll('button[type="submit"], #generate-report-btn').forEach(btn => {
        btn.dataset.originalText = btn.innerHTML;
    });
});

function setupEventListeners() {
    // Auth Toggles
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('forgot-password-view').classList.add('hidden');
        document.getElementById('register-view').classList.remove('hidden');
    });
    document.getElementById('show-login-from-register').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('register-view').classList.add('hidden');
        document.getElementById('forgot-password-view').classList.add('hidden');
        document.getElementById('login-view').classList.remove('hidden');
    });
    document.getElementById('forgot-password-link').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('login-view').classList.add('hidden');
        document.getElementById('register-view').classList.add('hidden');
        document.getElementById('forgot-password-view').classList.remove('hidden');
    });
    document.getElementById('show-login-from-forgot').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('forgot-password-view').classList.add('hidden');
        document.getElementById('register-view').classList.add('hidden');
        document.getElementById('login-view').classList.remove('hidden');
    });

    // Auth Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('forgot-password-form').addEventListener('submit', handleForgotPassword);
    document.getElementById('password-toggle').addEventListener('click', togglePasswordVisibility);

    // Confirmation Modal
    document.getElementById('confirm-modal-confirm-btn').addEventListener('click', () => {
        const callback = getOnConfirmCallback();
        if (typeof callback === 'function') {
            callback();
        }
        closeModal();
    });

    document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', handleNavClick));
    document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));
    window.addEventListener('click', (e) => { if (e.target.classList.contains('modal')) closeModal(); });

    // Botões "Novo"
    document.getElementById('add-cliente-btn').addEventListener('click', handleNewCliente);
    document.getElementById('add-produto-btn').addEventListener('click', handleNewProduto);
    document.getElementById('add-equipamento-btn').addEventListener('click', handleNewEquipamento);
    document.getElementById('add-materia-prima-btn').addEventListener('click', handleNewMateriaPrima);
    document.getElementById('add-user-btn').addEventListener('click', handleNewUser);

    // Forms
    document.getElementById('cliente-form').addEventListener('submit', saveCliente);
    document.getElementById('produto-form').addEventListener('submit', saveProduto);
    document.getElementById('equipamento-form').addEventListener('submit', saveEquipamento);
    document.getElementById('materia-prima-form').addEventListener('submit', saveMateriaPrima);
    document.getElementById('user-form').addEventListener('submit', saveUser);
    document.getElementById('ecoponto-registo-form').addEventListener('submit', saveEcopontoRegisto);

    // Ações nas listas
    document.getElementById('clientes-list').addEventListener('click', handleClienteListClick);
    document.getElementById('produtos-list').addEventListener('click', handleProdutoListClick);
    document.getElementById('equipamentos-list').addEventListener('click', handleEquipamentoListClick);
    document.getElementById('materia-prima-list').addEventListener('click', handleMateriaPrimaListClick);
    document.getElementById('users-list').addEventListener('click', handleUserListClick);
     document.getElementById('ecoponto-page').addEventListener('click', handleEcopontoListClick);

    // Modais dinâmicos
    document.getElementById('materia-prima-modal').addEventListener('input', e => { if (e.target.classList.contains('materia-prima-qty') || e.target.classList.contains('materia-prima-unit')) updateTotalPeso(); });
    document.getElementById('add-equipamento-item-btn').addEventListener('click', () => {
        const tipoInput = document.getElementById('equipamento-item-tipo');
        const marcaInput = document.getElementById('equipamento-item-marca');
        const modeloInput = document.getElementById('equipamento-item-modelo');
        const nserieInput = document.getElementById('equipamento-item-nserie');
        const qtyInput = document.getElementById('equipamento-item-qty');

        const qty = parseInt(qtyInput.value, 10) || 1;

        if (!tipoInput.value.trim()) {
            alert('O campo "Tipo" é obrigatório.');
            return;
        }

        addEquipamentoToTable({
            tipo: tipoInput.value,
            marca: marcaInput.value,
            modelo: modeloInput.value,
            nSerie: nserieInput.value,
            qty: qty
        });

        tipoInput.value = '';
        marcaInput.value = '';
        modeloInput.value = '';
        nserieInput.value = '';
        qtyInput.value = '1';
    });

    // Filtros
    document.getElementById('filter-btn').addEventListener('click', applyFiltersAndRender);
    document.getElementById('ecoponto-filter-btn').addEventListener('click', applyFiltersAndRender);
    document.getElementById('clear-filter-btn').addEventListener('click', () => {
        document.getElementById('cliente-filter').value = 'todos';
        document.getElementById('data-inicio').value = '';
        document.getElementById('data-fim').value = '';
        applyFiltersAndRender();
    });
    document.getElementById('ecoponto-clear-filter-btn').addEventListener('click', () => {
        document.getElementById('ecoponto-cliente-filter').value = 'todos';
        document.getElementById('ecoponto-data-inicio').value = '';
        document.getElementById('ecoponto-data-fim').value = '';
        applyFiltersAndRender();
    });

    // Relatório
    document.getElementById('generate-report-btn').addEventListener('click', handleGenerateReport);

    setupEquipamentoSearch();
}

const charts = {};
function createCharts() {
    if (typeof Chart === 'undefined') {
        console.error('Chart.js não foi carregado.');
        return;
    }
    const chartOptions = { scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } };
    const barChartOptions = { indexAxis: 'y', ...chartOptions };

    if (document.getElementById('recolhasChart')) {
        charts.recolhas = new Chart(document.getElementById('recolhasChart').getContext('2d'), {
            type: 'bar', data: { labels: [], datasets: [{ label: 'Recolhas (kg)', data: [], backgroundColor: 'rgba(5, 150, 105, 0.6)', borderRadius: 5 }] }, options: chartOptions
        });
    }
    if (document.getElementById('topEquipamentosChart')) {
        charts.topEquipamentos = new Chart(document.getElementById('topEquipamentosChart').getContext('2d'), {
            type: 'bar', data: { labels: [], datasets: [{ label: 'Quantidade', data: [], backgroundColor: 'rgba(5, 150, 105, 0.6)', borderRadius: 5 }] }, options: barChartOptions
         });
    }
}

function updateCharts(equipamentosData, materiaPrimaData){
    if (Object.keys(charts).length === 0) return;
    if(charts.recolhas) {
        const recolhasAggr = {};
        const allData = [...equipamentosData, ...materiaPrimaData];
        allData.forEach(item => {
            if (item.dataInicio) {
                const monthYear = new Date(item.dataInicio).toISOString().slice(0, 7);
                const pesoKg = parseFloat(item.pesoTotal) || 0;
                recolhasAggr[monthYear] = (recolhasAggr[monthYear] || 0) + pesoKg;
            }
        });
        const sortedLabels = Object.keys(recolhasAggr).sort();
        charts.recolhas.data.labels = sortedLabels;
        charts.recolhas.data.datasets[0].data = sortedLabels.map(label => recolhasAggr[label]);
        charts.recolhas.update();
    }

    if(charts.topEquipamentos){
        const equipAggr = {};
        equipamentosData.forEach(reg => {
            (reg.items || []).forEach(item => {
                const tipo = item.tipo || item.nome;
                equipAggr[tipo] = (equipAggr[tipo] || 0) + (item.qty || 1);
            });
        });
        const top5 = Object.entries(equipAggr).sort((a,b) => b[1] - a[1]).slice(0, 5);
        charts.topEquipamentos.data.labels = top5.map(item => item[0]);
        charts.topEquipamentos.data.datasets[0].data = top5.map(item => item[1]);
        charts.topEquipamentos.update();
    }
}
