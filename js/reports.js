import { liveEquipamentos, liveMateriaPrima, liveEcopontoRegistos, getLiveProdutos } from './data.js';
import { setButtonLoadingState, showInfoModal } from './ui.js';
import { getUserId, getCurrentUserNome } from './auth.js';
import { db, appId } from './firebase-config.js';
import { collection, doc, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const logoBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPoAAABDCAMAAAC1QzLAAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJAUExURQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAAAAEBAQAA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";

function drawFooter(doc, pageNum, pageCount) {
    doc.setFontSize(8);
    const footerText = `Página ${pageNum} de ${pageCount}`;
    doc.text(footerText, 196, 290, { align: 'right' });
}

function drawSummaryCards(doc, totalResiduosKg, totalEquipUnid, totalMateriaPrimaKg, totalCo2EvitadoKg) {
    const drawCard = (x, y, title, value, unit) => {
        doc.setDrawColor(229, 231, 235);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, 45, 25, 3, 3, 'FD');
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text(title, x + 22.5, y + 7, { align: 'center' });
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(31, 41, 55);
        doc.text(value, x + 22.5, y + 16, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(unit, x + 22.5, y + 21, { align: 'center' });
    };

    drawCard(14, 60, 'Resíduos Recolhidos', formatWeight(totalResiduosKg).split(' ')[0], formatWeight(totalResiduosKg).split(' ')[1]);
    drawCard(62, 60, 'Equipamentos', totalEquipUnid.toString(), 'unid.');
    drawCard(110, 60, 'Matéria-Prima', formatWeight(totalMateriaPrimaKg).split(' ')[0], formatWeight(totalMateriaPrimaKg).split(' ')[1]);
    drawCard(158, 60, 'CO₂e Evitado', formatWeight(totalCo2EvitadoKg).split(' ')[0], formatWeight(totalCo2EvitadoKg).split(' ')[1]);
}

async function generateProductionReport(doc, filteredEquipamentos, filteredMateriaPrima, y) {
    const materiaPrimaAggr = {};
    filteredMateriaPrima.forEach(reg => {
        (reg.quantidades || []).forEach(item => {
            const pesoKg = item.unit === 't' ? item.qty * 1000 : item.qty;
            materiaPrimaAggr[item.nome] = (materiaPrimaAggr[item.nome] || 0) + pesoKg;
        });
    });

    if (Object.keys(materiaPrimaAggr).length > 0) {
        const chartCanvas = document.createElement('canvas');
        chartCanvas.width = 400; chartCanvas.height = 400;
        const chartCtx = chartCanvas.getContext('2d');
        new Chart(chartCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(materiaPrimaAggr),
                datasets: [{
                    data: Object.values(materiaPrimaAggr),
                    backgroundColor: ['#059669', '#10B981', '#34D399', '#6EE7B7'],
                }]
            },
            options: { responsive: false, animation: { duration: 0 }, plugins: { legend: { position: 'right' } } }
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        const chartImage = chartCanvas.toDataURL('image/png');
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Composição da Matéria-Prima (Produção)', 14, y);
        doc.addImage(chartImage, 'PNG', 14, y + 5, 70, 70);
    }

    const equipAggr = {};
    filteredEquipamentos.forEach(reg => {
        (reg.items || []).forEach(item => {
            const tipo = item.tipo || item.nome;
            equipAggr[tipo] = (equipAggr[tipo] || 0) + (item.qty || 1);
        });
    });
    const topEquipamentos = Object.entries(equipAggr).sort((a,b) => b[1] - a[1]).slice(0, 10);

    if(topEquipamentos.length > 0){
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Top Equipamentos (Produção)', 110, y);
        doc.autoTable({
            startY: y + 5,
            head: [['Equipamento', 'Unidades']],
            body: topEquipamentos,
            theme: 'grid',
            headStyles: { fillColor: [6, 78, 59] },
            margin: { left: 110 }
        });
        return doc.autoTable.previous.finalY > y + 75 ? doc.autoTable.previous.finalY + 15 : y + 90;
    }
    return y;
}

async function generateEcopontoReport(doc, filteredEcoponto, y) {
    const materiaPrimaAggrEcoponto = {};
    filteredEcoponto.forEach(reg => {
        Object.entries(reg.materiasPrimas || {}).forEach(([nome, peso]) => {
            materiaPrimaAggrEcoponto[nome] = (materiaPrimaAggrEcoponto[nome] || 0) + peso;
        });
    });

    if (Object.keys(materiaPrimaAggrEcoponto).length > 0) {
        const chartCanvas = document.createElement('canvas');
        chartCanvas.width = 400; chartCanvas.height = 400;
        const chartCtx = chartCanvas.getContext('2d');
        new Chart(chartCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(materiaPrimaAggrEcoponto),
                datasets: [{
                    data: Object.values(materiaPrimaAggrEcoponto),
                    backgroundColor: ['#059669', '#10B981', '#34D399', '#6EE7B7'],
                }]
            },
            options: { responsive: false, animation: { duration: 0 }, plugins: { legend: { position: 'right' } } }
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        const chartImage = chartCanvas.toDataURL('image/png');
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Composição da Matéria-Prima (Ecoponto)', 14, y);
        doc.addImage(chartImage, 'PNG', 14, y + 5, 70, 70);
    }

    const equipAggrEcoponto = {};
     filteredEcoponto.forEach(reg => {
        (reg.equipamentos || []).forEach(item => {
            equipAggrEcoponto[item.nome] = (equipAggrEcoponto[item.nome] || 0) + item.qty;
        });
    });
    const topEquipamentosEcoponto = Object.entries(equipAggrEcoponto).sort((a,b) => b[1] - a[1]).slice(0, 10);

    if(topEquipamentosEcoponto.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Top Equipamentos (Ecoponto)', 110, y);
        doc.autoTable({
            startY: y + 5,
            head: [['Equipamento', 'Unidades']],
            body: topEquipamentosEcoponto,
            theme: 'grid',
            headStyles: { fillColor: [6, 78, 59] },
            margin: { left: 110 }
        });
        return doc.autoTable.previous.finalY > y + 75 ? doc.autoTable.previous.finalY + 15 : y + 90;
    }
    return y;
}

async function generateReport() {
    const doc = new window.jspdf.jsPDF();

    drawHeader(doc, logoBase64);

    const clienteId = document.getElementById('report-cliente-filter').value;
    const startDate = document.getElementById('report-data-inicio').value;
    const endDate = document.getElementById('report-data-fim').value;
    const reportType = document.getElementById('report-type').value;
    const clienteNome = clienteId === 'todos' ? 'Todos os Clientes' : document.getElementById('report-cliente-filter').options[document.getElementById('report-cliente-filter').selectedIndex].text;

    const filterPredicate = (item) => {
        const date = item.dataInicio || item.data;
        const clienteMatch = !clienteId || clienteId === 'todos' || item.clienteId === clienteId;
        const startDateMatch = !startDate || new Date(date) >= new Date(startDate);
        const endDateMatch = !endDate || new Date(date) <= new Date(endDate);
        return clienteMatch && startDateMatch && endDateMatch;
    };

    let filteredEquipamentos = [];
    let filteredMateriaPrima = [];
    let filteredEcoponto = [];

    if (reportType === 'producao' || reportType === 'geral') {
        filteredEquipamentos = liveEquipamentos.filter(filterPredicate);
        filteredMateriaPrima = liveMateriaPrima.filter(filterPredicate);
    }
    if (reportType === 'ecoponto' || reportType === 'geral') {
        filteredEcoponto = liveEcopontoRegistos.filter(filterPredicate);
    }

    let totalEquipUnid = filteredEquipamentos.reduce((sum, item) => sum + (item.totalUnidades || 0), 0);
    let totalMateriaPrimaKg = filteredMateriaPrima.reduce((sum, item) => sum + (item.pesoTotal || 0), 0);
    let totalResiduosKg = filteredEquipamentos.reduce((sum, item) => sum + (parseFloat(item.pesoTotal) || 0), 0) + totalMateriaPrimaKg;

    filteredEcoponto.forEach(reg => {
        totalEquipUnid += (reg.equipamentos || []).reduce((sum, item) => sum + item.qty, 0);
        const mpKg = Object.values(reg.materiasPrimas || {}).reduce((sum, val) => sum + val, 0);
        totalMateriaPrimaKg += mpKg;
        totalResiduosKg += mpKg;
    });

    const totalCo2EvitadoKg = totalMateriaPrimaKg * 1.5;

    doc.setFontSize(11);
    doc.text(`Cliente: ${clienteNome}`, 14, 40);
    doc.text(`Período: ${startDate || 'Início'} a ${endDate || 'Fim'}`, 14, 46);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-PT')}`, 14, 52);

    drawSummaryCards(doc, totalResiduosKg, totalEquipUnid, totalMateriaPrimaKg, totalCo2EvitadoKg);

    let y = 100;

    if (reportType === 'producao' || reportType === 'geral') {
        y = await generateProductionReport(doc, filteredEquipamentos, filteredMateriaPrima, y);
    }
    if (reportType === 'ecoponto' || reportType === 'geral') {
        y = await generateEcopontoReport(doc, filteredEcoponto, y);
    }

    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        drawFooter(doc, i, pageCount);
    }

    doc.save(`Relatorio_Sustentabilidade_${new Date().toISOString().slice(0,10)}.pdf`);
}

function renderEcopontoFormEquipamentos() {
    const container = document.getElementById('ecoponto-form-equipamentos-container');
    const equipamentosDisponiveis = getLiveProdutos().filter(p => p.categoria === 'Equipamento' && p.origem === 'Ecoponto');
    container.innerHTML = equipamentosDisponiveis.map(eq => `
        <div class="bg-gray-50 p-4 rounded-lg border">
            <label class="block text-sm font-medium text-gray-700 mb-2">${eq.nome}</label>
            <input type="number" min="0" data-nome="${eq.nome}" class="ecoponto-equipamento-qty w-full border border-gray-300 rounded-md p-2 shadow-sm" placeholder="Unidades">
        </div>
    `).join('');
}

async function saveEcopontoRegisto(e) {
    e.preventDefault();
    const button = e.currentTarget.querySelector('button[type="submit"]');
    setButtonLoadingState(button, true);

    const id = document.getElementById('ecoponto-form-id').value;
    const select = document.getElementById('ecoponto-form-cliente-select');
    const data = {
        clienteId: select.value,
        clienteNome: select.options[select.selectedIndex].text,
        data: document.getElementById('ecoponto-form-data').value,
        responsavelNome: getCurrentUserNome(),
        responsavelId: getUserId(),
        materiasPrimas: {},
        equipamentos: []
    };

    const metal = parseFloat(document.getElementById('ecoponto-form-metal').value) || 0;
    if(metal > 0) data.materiasPrimas['Metal'] = metal;
    const plasticos = parseFloat(document.getElementById('ecoponto-form-plasticos').value) || 0;
    if(plasticos > 0) data.materiasPrimas['Plásticos'] = plasticos;
    const vidro = parseFloat(document.getElementById('ecoponto-form-vidro').value) || 0;
    if(vidro > 0) data.materiasPrimas['Vidro'] = vidro;
    const papel = parseFloat(document.getElementById('ecoponto-form-papel').value) || 0;
    if(papel > 0) data.materiasPrimas['Papel'] = papel;

    document.querySelectorAll('.ecoponto-equipamento-qty').forEach(input => {
        const qty = parseInt(input.value, 10) || 0;
        if (qty > 0) {
            data.equipamentos.push({ nome: input.dataset.nome, qty: qty });
        }
    });

    try {
        const collectionRef = collection(db, 'artifacts', appId, 'users', getUserId(), 'ecoponto_registos');
         if (id) {
            await updateDoc(doc(collectionRef, id), data);
            showInfoModal('Sucesso', 'Registo do ecoponto atualizado com sucesso!');
        } else {
            await addDoc(collectionRef, data);
            showInfoModal('Sucesso', 'Registo do ecoponto salvo com sucesso!');
        }
        document.getElementById('ecoponto-registo-form').reset();
        document.getElementById('ecoponto-form-id').value = '';
        closeModal();
        document.querySelector('.nav-link[data-page="ecoponto"]').click();
    } catch(error) {
        console.error("Erro ao salvar registo do ecoponto:", error);
        showInfoModal('Erro', 'Não foi possível salvar o registo.');
    } finally {
        setButtonLoadingState(button, false);
    }
}

async function handleEcopontoListClick(e) {
    const target = e.target.closest('button');
    if (!target) return;

    const id = target.dataset.id;
    if (!id) return;

    const collectionRef = collection(db, 'artifacts', appId, 'users', getUserId(), 'ecoponto_registos');

    if (target.classList.contains('delete-ecoponto')) {
        showConfirmationModal('Apagar Registo de Ecoponto', 'Tem a certeza que quer apagar este registo? Esta ação não pode ser desfeita.', async () => {
            try {
                await deleteDoc(doc(collectionRef, id));
                showInfoModal('Sucesso', 'Registo apagado com sucesso.');
            } catch (error) {
                console.error("Erro ao apagar registo do ecoponto:", error);
                showInfoModal('Erro', 'Não foi possível apagar o registo.');
            }
        });
    }

    if (target.classList.contains('edit-ecoponto')) {
        const docRef = doc(collectionRef, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();

            document.querySelector('.nav-link[data-page="ecoponto-form"]').click();

            setTimeout(() => {
                document.getElementById('ecoponto-registo-form').reset();
                document.getElementById('ecoponto-form-id').value = id;
                document.getElementById('ecoponto-form-title').textContent = 'Editar Registo de Ecoponto';
                document.getElementById('ecoponto-form-cliente-select').value = data.clienteId;
                document.getElementById('ecoponto-form-data').value = data.data;

                if (data.materiasPrimas) {
                    document.getElementById('ecoponto-form-metal').value = data.materiasPrimas['Metal'] || '';
                    document.getElementById('ecoponto-form-plasticos').value = data.materiasPrimas['Plásticos'] || '';
                    document.getElementById('ecoponto-form-vidro').value = data.materiasPrimas['Vidro'] || '';
                    document.getElementById('ecoponto-form-papel').value = data.materiasPrimas['Papel'] || '';
                }

                if (data.equipamentos) {
                    data.equipamentos.forEach(item => {
                        const input = document.querySelector(`.ecoponto-equipamento-qty[data-nome="${item.nome}"]`);
                        if (input) {
                            input.value = item.qty;
                        }
                    });
                }
            }, 100);
        }
    }
}

function handleGenerateReport() {
    const btn = document.getElementById('generate-report-btn');
    setButtonLoadingState(btn, true, "Gerando...");
    generateReport().finally(() => setButtonLoadingState(btn, false, "Gerar PDF"));
}

export {
    handleGenerateReport,
    saveEcopontoRegisto,
    handleEcopontoListClick,
    renderEcopontoFormEquipamentos
};
