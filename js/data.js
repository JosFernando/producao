import { onSnapshot, collection, doc, getDoc, addDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { db, appId } from './firebase-config.js';
import { getUserId, getCurrentUserNome, getCurrentUserRole } from './auth.js';
import { openModal, closeModal, setButtonLoadingState, showConfirmationModal, showInfoModal } from './ui.js';

let clientesUnsubscribe, produtosUnsubscribe, equipamentosUnsubscribe, materiaPrimaUnsubscribe, utilizadoresUnsubscribe, ecopontoRegistosUnsubscribe;
let liveClientes = [];
let liveProdutos = [];
let liveEquipamentos = [];
let liveMateriaPrima = [];
let liveUtilizadores = [];
let liveEcopontoRegistos = [];

function attachFirestoreListeners() {
    const userId = getUserId();
    if (!userId) return;

    const commonPath = `artifacts/${appId}/users/${userId}`;
    const publicPath = `artifacts/${appId}/public/data`;

    clientesUnsubscribe = onSnapshot(collection(db, commonPath, 'clientes'), snapshot => {
        liveClientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderClientes(liveClientes);
        updateClienteDropdowns(liveClientes);
    }, err => console.error("Erro no listener de clientes:", err));

    produtosUnsubscribe = onSnapshot(collection(db, commonPath, 'produtos'), snapshot => {
        liveProdutos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (liveProdutos.length === 0) seedProdutos();
        renderProdutos(liveProdutos);
    }, err => console.error("Erro no listener de produtos:", err));

    equipamentosUnsubscribe = onSnapshot(collection(db, commonPath, 'equipamentos'), snapshot => {
        liveEquipamentos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderEquipamentos(liveEquipamentos);
        applyFiltersAndRender();
    }, err => console.error("Erro no listener de equipamentos:", err));

    materiaPrimaUnsubscribe = onSnapshot(collection(db, commonPath, 'materiaPrima'), snapshot => {
        liveMateriaPrima = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderMateriaPrima(liveMateriaPrima);
        applyFiltersAndRender();
    }, err => console.error("Erro no listener de matéria-prima:", err));

    ecopontoRegistosUnsubscribe = onSnapshot(collection(db, commonPath, 'ecoponto_registos'), snapshot => {
        liveEcopontoRegistos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderEcopontoRegistos(liveEcopontoRegistos);
        applyFiltersAndRender();
    }, err => console.error("Erro no listener de registos do ecoponto:", err));

    utilizadoresUnsubscribe = onSnapshot(collection(db, publicPath, 'utilizadores'), snapshot => {
        liveUtilizadores = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUtilizadores(liveUtilizadores);
    }, err => console.error("Erro no listener de utilizadores:", err));
}

function detachFirestoreListeners() {
    if (clientesUnsubscribe) clientesUnsubscribe();
    if (produtosUnsubscribe) produtosUnsubscribe();
    if (equipamentosUnsubscribe) equipamentosUnsubscribe();
    if (materiaPrimaUnsubscribe) materiaPrimaUnsubscribe();
    if (utilizadoresUnsubscribe) utilizadoresUnsubscribe();
    if (ecopontoRegistosUnsubscribe) ecopontoRegistosUnsubscribe();
}

function applyFiltersAndRender() {
    const dashboardActive = document.getElementById('dashboard-page').classList.contains('active');
    const ecopontoActive = document.getElementById('ecoponto-page').classList.contains('active');

    if (dashboardActive) {
        const clienteId = document.getElementById(`cliente-filter`)?.value;
        const startDate = document.getElementById(`data-inicio`)?.value;
        const endDate = document.getElementById(`data-fim`)?.value;

        const filterPredicate = item => {
            const clienteMatch = !clienteId || clienteId === 'todos' || item.clienteId === clienteId;
            const startDateMatch = !startDate || new Date(item.dataInicio) >= new Date(startDate);
            const endDateMatch = !endDate || new Date(item.dataInicio) <= new Date(endDate);
            return clienteMatch && startDateMatch && endDateMatch;
        };

        const filteredEquipamentos = liveEquipamentos.filter(filterPredicate);
        const filteredMateriaPrima = liveMateriaPrima.filter(filterPredicate);
        updateDashboardUI(filteredEquipamentos, filteredMateriaPrima, false);
    }

    if (ecopontoActive) {
         const clienteId = document.getElementById(`ecoponto-cliente-filter`)?.value;
        const startDate = document.getElementById(`ecoponto-data-inicio`)?.value;
        const endDate = document.getElementById(`ecoponto-data-fim`)?.value;

        const filterPredicate = item => {
            const clienteMatch = !clienteId || clienteId === 'todos' || item.clienteId === clienteId;
            const startDateMatch = !startDate || new Date(item.data) >= new Date(startDate);
            const endDateMatch = !endDate || new Date(item.data) <= new Date(endDate);
            return clienteMatch && startDateMatch && endDateMatch;
        };
        const filteredEcopontoRegistos = liveEcopontoRegistos.filter(filterPredicate);
        updateDashboardUI(filteredEcopontoRegistos, filteredEcopontoRegistos, true);
    }
}

function updateDashboardUI(equipamentosSource, materiaPrimaSource, isEcoponto) {
    if (isEcoponto) {
        updateEcopontoDashboard(equipamentosSource);
    } else {
        updateMainDashboard(equipamentosSource, materiaPrimaSource);
    }
}

function formatWeight(kg) {
    if (kg >= 1000) {
        return `${(kg / 1000).toFixed(2)} t`;
    }
    return `${kg.toFixed(2)} kg`;
}

function updateMainDashboard(equipamentosData, materiaPrimaData) {
     const totalRecolhas = equipamentosData.length + materiaPrimaData.length;
    const totalMateriaPrimaKg = materiaPrimaData.reduce((sum, item) => sum + (item.pesoTotal || 0), 0);

    let totalEquipamentosUnidades = 0;
    equipamentosData.forEach(reg => {
        totalEquipamentosUnidades += (reg.items || []).reduce((sum, item) => sum + (item.qty || 1), 0);
    });

    const totalEquipamentosPeso = equipamentosData.reduce((sum, item) => sum + (parseFloat(item.pesoTotal) || 0), 0);
    const totalResiduosKg = totalMateriaPrimaKg + totalEquipamentosPeso;
    const totalCo2Evitado = totalMateriaPrimaKg * 1.5;

    document.getElementById('stat-recolhas').textContent = totalRecolhas;
    document.getElementById('stat-residuos').textContent = formatWeight(totalResiduosKg);
    document.getElementById('stat-equipamentos').textContent = totalEquipamentosUnidades;
    document.getElementById('stat-materia-prima').textContent = formatWeight(totalMateriaPrimaKg);
    document.getElementById('stat-co2').textContent = formatWeight(totalCo2Evitado);

    const equipAggr = {};
    equipamentosData.forEach(reg => { (reg.items || []).forEach(item => {
        const tipo = item.tipo || item.nome;
        equipAggr[tipo] = (equipAggr[tipo] || 0) + (item.qty || 1);
    }); });
    const topEquipamentos = Object.entries(equipAggr).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById('top-equipamentos-body').innerHTML = topEquipamentos.map(([nome, qtd]) => `<tr><td class="p-2">${nome}</td><td class="p-2 text-right">${qtd}</td></tr>`).join('');

    const materiaAggr = {};
    materiaPrimaData.forEach(reg => { (reg.quantidades || []).forEach(item => { const pesoKg = item.unit === 't' ? item.qty * 1000 : item.qty; materiaAggr[item.nome] = (materiaAggr[item.nome] || 0) + pesoKg; }); });
    const topMateriaPrima = Object.entries(materiaAggr).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById('top-materia-prima-body').innerHTML = topMateriaPrima.map(([nome, peso]) => `<tr><td class="p-2">${nome}</td><td class="p-2 text-right">${formatWeight(peso)}</td></tr>`).join('');

     updateCharts(equipamentosData, materiaPrimaData);
}

function updateEcopontoDashboard(registosEcoponto) {
     const totalRecolhas = registosEcoponto.length;
    let totalEquipamentosUnidades = 0;
    let totalMateriaPrimaKg = 0;
    const equipAggr = {};
    const materiaAggr = {};

    registosEcoponto.forEach(reg => {
        (reg.equipamentos || []).forEach(item => {
            totalEquipamentosUnidades += item.qty;
            equipAggr[item.nome] = (equipAggr[item.nome] || 0) + item.qty;
        });
        Object.entries(reg.materiasPrimas || {}).forEach(([nome, peso]) => {
            totalMateriaPrimaKg += peso;
            materiaAggr[nome] = (materiaAggr[nome] || 0) + peso;
        });
    });

    const totalCo2Evitado = totalMateriaPrimaKg * 1.5;

    document.getElementById('stat-recolhas-ecoponto').textContent = totalRecolhas;
    document.getElementById('stat-residuos-ecoponto').textContent = formatWeight(totalMateriaPrimaKg);
    document.getElementById('stat-equipamentos-ecoponto').textContent = totalEquipamentosUnidades;
    document.getElementById('stat-materia-prima-ecoponto').textContent = formatWeight(totalMateriaPrimaKg);
    document.getElementById('stat-co2-ecoponto').textContent = formatWeight(totalCo2Evitado);

    const topEquipEcoponto = Object.entries(equipAggr).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById('ecoponto-top-equipamentos-body').innerHTML = topEquipEcoponto.map(([nome, qtd]) => `<tr><td class="p-2">${nome}</td><td class="p-2 text-right">${qtd}</td></tr>`).join('');

    const topMateriaEcoponto = Object.entries(materiaAggr).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById('ecoponto-top-materia-prima-body').innerHTML = topMateriaEcoponto.map(([nome, peso]) => `<tr><td class="p-2">${nome}</td><td class="p-2 text-right">${formatWeight(peso)}</td></tr>`).join('');
}

function renderClientes(clientes) {
    const list = document.getElementById('clientes-list');
    list.innerHTML = clientes.map(c => `
        <tr class="border-b">
            <td class="p-3">${c.nome}</td>
            <td class="p-3">${c.nif}</td>
            <td class="p-3">${c.tipo || ''}</td>
            <td class="p-3">${c.contacto || ''}</td>
            <td class="p-3">${c.email || ''}</td>
            <td class="p-3">
                <button class="edit-cliente text-blue-500 mr-2" data-id="${c.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-cliente text-red-500" data-id="${c.id}"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

function renderProdutos(produtos) {
    const list = document.getElementById('produtos-list');
    list.innerHTML = produtos.map(p => `
        <tr class="border-b">
            <td class="p-3">${p.id.substring(0, 5)}...</td>
            <td class="p-3">${p.nome}</td>
            <td class="p-3">${p.categoria}</td>
            <td class="p-3">${p.origem || ''}</td>
            <td class="p-3">
                <button class="edit-produto text-blue-500 mr-2" data-id="${p.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-produto text-red-500" data-id="${p.id}"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

function renderEquipamentos(equipamentos) {
    const list = document.getElementById('equipamentos-list');
    list.innerHTML = equipamentos.map(i => `
        <tr class="border-b">
            <td class="p-3">${i.refRecolha}</td> <td class="p-3">${i.clienteNome}</td> <td class="p-3">${i.dataInicio}</td> <td class="p-3">${i.origem}</td>
            <td class="p-3">${i.responsavelNome || 'N/A'}</td>
            <td class="p-3">
                <button class="edit-equipamento text-blue-500 mr-2" data-id="${i.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-equipamento text-red-500" data-id="${i.id}"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

function renderMateriaPrima(materiaPrima) {
    const list = document.getElementById('materia-prima-list');
    list.innerHTML = materiaPrima.map(mp => `
        <tr class="border-b">
            <td class="p-3">${mp.refRecolha}</td> <td class="p-3">${mp.clienteNome}</td> <td class="p-3">${mp.dataInicio}</td> <td class="p-3">${mp.origem}</td>
            <td class="p-3">${mp.responsavelNome || 'N/A'}</td>
            <td class="p-3">
                <button class="edit-materia-prima text-blue-500 mr-2" data-id="${mp.id}"><i class="fas fa-edit"></i></button>
                <button class="delete-materia-prima text-red-500" data-id="${mp.id}"><i class="fas fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

function renderUtilizadores(utilizadores) {
    const list = document.getElementById('users-list');
    const currentUserRole = getCurrentUserRole();
     list.innerHTML = utilizadores.map(u => {
        const isAdmin = currentUserRole === 'Admin';
        const statusClass = u.status === 'pendente' ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800';
        let actions = '';

        if (isAdmin) {
            if (u.status === 'pendente') {
                 actions = `<button class="approve-user text-green-500 mr-2" data-id="${u.id}" title="Aprovar"><i class="fas fa-check-circle"></i></button>`;
            } else {
                actions = `<button class="edit-user text-blue-500 mr-2" data-id="${u.id}" title="Editar"><i class="fas fa-edit"></i></button>`;
            }
            actions += `<button class="delete-user text-red-500" data-id="${u.id}" title="Apagar"><i class="fas fa-trash"></i></button>`;
        }

        return `
            <tr class="border-b">
                <td class="p-3">${u.nome}</td>
                <td class="p-3">${u.email}</td>
                <td class="p-3">${u.funcao}</td>
                <td class="p-3"><span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">${u.status}</span></td>
                <td class="p-3">${actions}</td>
            </tr>`;
    }).join('');
}

function renderEcopontoRegistos(registos) {
    const list = document.getElementById('ecoponto-registos-list');
    if (!list) return;

    list.innerHTML = registos.map(reg => {
        const totalMP = Object.values(reg.materiasPrimas || {}).reduce((sum, val) => sum + val, 0);
        const totalEquip = (reg.equipamentos || []).reduce((sum, item) => sum + item.qty, 0);

        return `
            <tr class="border-b">
                <td class="p-3">${reg.id.substring(0, 8)}...</td>
                <td class="p-3">${reg.data}</td>
                <td class="p-3">${reg.clienteNome}</td>
                <td class="p-3">${reg.responsavelNome || 'N/A'}</td>
                <td class="p-3">${totalMP.toFixed(2)} kg</td>
                <td class="p-3">${totalEquip}</td>
                <td class="p-3">
                    <button class="edit-ecoponto text-blue-500 mr-2" data-id="${reg.id}" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="delete-ecoponto text-red-500" data-id="${reg.id}" title="Apagar"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function handleNewCliente() {
    document.getElementById('cliente-modal-title').textContent = 'Novo Cliente';
    document.getElementById('cliente-form').reset();
    document.getElementById('cliente-id').value = '';
    openModal('cliente-modal');
}

async function saveCliente(e) {
    e.preventDefault();
    const button = e.currentTarget.querySelector('button[type="submit"]');
    setButtonLoadingState(button, true);
    const id = document.getElementById('cliente-id').value;
    const data = {
        nome: document.getElementById('cliente-nome').value,
        nif: document.getElementById('cliente-nif').value,
        tipo: document.getElementById('cliente-tipo').value,
        contacto: document.getElementById('cliente-contacto').value,
        email: document.getElementById('cliente-email').value
    };
    const collectionRef = collection(db, 'artifacts', appId, 'users', getUserId(), 'clientes');
    try {
        if (id) {
            await updateDoc(doc(collectionRef, id), data);
        } else {
            await addDoc(collectionRef, data);
        }
        closeModal();
    } catch (error) {
        console.error("Erro ao salvar cliente:", error);
    } finally {
        setButtonLoadingState(button, false);
    }
}

async function handleClienteListClick(e) {
    const target = e.target.closest('button');
    if (!target) return;
    const id = target.dataset.id;
    const collectionRef = collection(db, 'artifacts', appId, 'users', getUserId(), 'clientes');

    if (target.classList.contains('edit-cliente')) {
        const docRef = doc(collectionRef, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const cliente = docSnap.data();
            document.getElementById('cliente-modal-title').textContent = 'Editar Cliente';
            document.getElementById('cliente-id').value = id;
            document.getElementById('cliente-nome').value = cliente.nome;
            document.getElementById('cliente-nif').value = cliente.nif;
            document.getElementById('cliente-tipo').value = cliente.tipo || 'Produção';
            document.getElementById('cliente-contacto').value = cliente.contacto;
            document.getElementById('cliente-email').value = cliente.email;
            openModal('cliente-modal');
        }
    }
    if (target.classList.contains('delete-cliente')) {
         showConfirmationModal('Apagar Cliente', `Tem a certeza que quer apagar este cliente?`, async () => {
            await deleteDoc(doc(collectionRef, id));
        });
    }
}

function handleNewProduto() {
    document.getElementById('produto-modal-title').textContent = 'Novo Produto';
    document.getElementById('produto-form').reset();
    document.getElementById('produto-id').value = '';
    openModal('produto-modal');
}

async function saveProduto(e) {
    e.preventDefault();
    const button = e.currentTarget.querySelector('button[type="submit"]');
    setButtonLoadingState(button, true);
    const id = document.getElementById('produto-id').value;
    const data = {
        nome: document.getElementById('produto-nome').value,
        categoria: document.getElementById('produto-categoria').value,
        origem: document.getElementById('produto-origem').value
    };
    const collectionRef = collection(db, 'artifacts', appId, 'users', getUserId(), 'produtos');

    try {
         if (id) {
            await updateDoc(doc(collectionRef, id), data);
        } else {
            await addDoc(collectionRef, data);
        }
        closeModal();
    } catch(error) {
        console.error("Erro ao salvar produto:", error);
    } finally {
        setButtonLoadingState(button, false);
    }
}

async function handleProdutoListClick(e) {
    const target = e.target.closest('button');
    if (!target) return;
    const id = target.dataset.id;
    const collectionRef = collection(db, 'artifacts', appId, 'users', getUserId(), 'produtos');

    if (target.classList.contains('edit-produto')) {
         const docRef = doc(collectionRef, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const produto = docSnap.data();
            document.getElementById('produto-modal-title').textContent = 'Editar Produto';
            document.getElementById('produto-id').value = id;
            document.getElementById('produto-nome').value = produto.nome;
            document.getElementById('produto-categoria').value = produto.categoria;
            document.getElementById('produto-origem').value = produto.origem || 'Produção';
            openModal('produto-modal');
        }
    }
    if (target.classList.contains('delete-produto')) {
        showConfirmationModal('Apagar Produto', `Tem a certeza que quer apagar este produto?`, async () => {
           await deleteDoc(doc(collectionRef, id));
        });
    }
}

function handleNewUser() {
    if (getCurrentUserRole() !== 'Admin') {
       alert('Apenas administradores podem adicionar novos utilizadores.');
       return;
   }
   document.getElementById('user-modal-title').textContent = 'Novo Utilizador';
   document.getElementById('user-form').reset();
   document.getElementById('user-id').value = '';
   openModal('user-modal');
}

async function saveUser(e) {
    e.preventDefault();
    const button = e.currentTarget.querySelector('button[type="submit"]');
    setButtonLoadingState(button, true);

    const id = document.getElementById('user-id').value;
    const data = {
        nome: document.getElementById('user-nome').value,
        email: document.getElementById('user-email').value,
        funcao: document.getElementById('user-funcao').value,
    };
    const collectionRef = collection(db, 'artifacts', appId, 'public/data/utilizadores');

    try {
         if (id) {
            await updateDoc(doc(collectionRef, id), data);
        } else {
            alert('Funcionalidade para admin criar utilizadores com login ainda não implementada.');
        }
        closeModal();
    } catch(error) {
        console.error("Erro ao salvar utilizador:", error);
    } finally {
        setButtonLoadingState(button, false);
    }
}

async function handleUserListClick(e) {
    const target = e.target.closest('button');
    if (!target || getCurrentUserRole() !== 'Admin') return;

    const id = target.dataset.id;
    const collectionRef = collection(db, 'artifacts', appId, 'public/data/utilizadores');

    if (target.classList.contains('approve-user')) {
        await updateDoc(doc(collectionRef, id), { status: 'aprovado' });
    }

    if (target.classList.contains('edit-user')) {
         const docRef = doc(collectionRef, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const user = docSnap.data();
            document.getElementById('user-modal-title').textContent = 'Editar Utilizador';
            document.getElementById('user-id').value = id;
            document.getElementById('user-nome').value = user.nome;
            document.getElementById('user-email').value = user.email;
            document.getElementById('user-funcao').value = user.funcao;
            openModal('user-modal');
        }
    }
    if (target.classList.contains('delete-user')) {
        showConfirmationModal('Apagar Utilizador', `Tem a certeza que quer apagar este utilizador? Esta ação não pode ser desfeita e irá apagar a conta de login.`, async () => {
           await deleteDoc(doc(collectionRef, id));
           alert('Utilizador apagado da lista. A conta de login precisa ser removida manually na consola Firebase.');
        });
    }
}

function updateClienteDropdowns(clientes) {
    const filterSelects = document.querySelectorAll('#cliente-filter, #ecoponto-cliente-filter, #report-cliente-filter');
    filterSelects.forEach(select => {
        if (!select) return;
        const currentValue = select.value;
        select.innerHTML = '<option value="todos">Todos os Clientes</option>' + clientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
        select.value = currentValue;
    });

    updateFormClienteDropdowns('equipamento-cliente-select', 'Produção', clientes);
    updateFormClienteDropdowns('materia-prima-cliente-select', 'Produção', clientes);
    updateFormClienteDropdowns('ecoponto-form-cliente-select', 'Ecoponto', clientes);
}

function updateFormClienteDropdowns(selectId, tipo, allClientes) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const currentValue = select.value;
    const filteredClientes = allClientes.filter(c => c.tipo === tipo);
    select.innerHTML = '<option value="">Selecione um Cliente</option>' + filteredClientes.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    select.value = currentValue;
}

async function seedProdutos() {
    const produtosIniciais = [
        {nome: 'Desktop', categoria: 'Equipamento', origem: 'Produção'}, {nome: 'Portátil', categoria: 'Equipamento', origem: 'Produção'},
        {nome: 'Monitor', categoria: 'Equipamento', origem: 'Produção'}, {nome: 'Impressora', categoria: 'Equipamento', origem: 'Produção'},
        {nome: 'Teclado', categoria: 'Equipamento', origem: 'Produção'}, {nome: 'Rato', categoria: 'Equipamento', origem: 'Produção'},
        {nome: 'TV', categoria: 'Equipamento', origem: 'Ecoponto'}, {nome: 'Frigorífico', categoria: 'Equipamento', origem: 'Ecoponto'},
        {nome: 'Cabos Diversos', categoria: 'Equipamento', origem: 'Produção'}, {nome: 'Transformador', categoria: 'Equipamento', origem: 'Produção'},
        {nome: 'Comando', categoria: 'Equipamento', origem: 'Ecoponto'}, {nome: 'Projector', categoria: 'Equipamento', origem: 'Produção'},
        {nome: 'Cobre', categoria: 'Matéria-prima', origem: 'Produção'}, {nome: 'Alumínio', categoria: 'Matéria-prima', origem: 'Produção'},
        {nome: 'Plástico (ABS)', categoria: 'Matéria-prima', origem: 'Produção'}, {nome: 'Placas de Circuito', categoria: 'Matéria-prima', origem: 'Produção'},
        {nome: 'Ferro', categoria: 'Matéria-prima', origem: 'Produção'}, {nome: 'Baterias de Lítio', categoria: 'Matéria-prima', origem: 'Produção'},
    ];
    const collectionRef = collection(db, 'artifacts', appId, 'users', getUserId(), 'produtos');
    for (const produto of produtosIniciais) {
        await addDoc(collectionRef, produto);
    }
}

function getLiveProdutos() {
    return liveProdutos;
}

export {
    attachFirestoreListeners,
    detachFirestoreListeners,
    applyFiltersAndRender,
    handleNewCliente,
    saveCliente,
    handleClienteListClick,
    handleNewProduto,
    saveProduto,
    handleProdutoListClick,
    handleNewUser,
    saveUser,
    handleUserListClick,
    getLiveProdutos,
    liveEquipamentos,
    liveMateriaPrima,
    liveEcopontoRegistos
};
