import { applyFiltersAndRender } from './data.js';
import { renderEcopontoFormEquipamentos } from './reports.js';

let onConfirmCallback = null;

function setButtonLoadingState(button, isLoading, loadingText) {
    if (!button) return;
    const originalText = button.dataset.originalText || button.innerHTML;
    if (!button.dataset.originalText) {
        button.dataset.originalText = originalText;
    }

    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${loadingText}`;
    } else {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

function handleNavClick(e) {
    e.preventDefault();
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    e.currentTarget.classList.add('active');

    const pageId = e.currentTarget.dataset.page + '-page';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    document.getElementById('page-title').textContent = e.currentTarget.textContent.trim();
     if(pageId === 'dashboard-page' || pageId === 'ecoponto-page') {
        applyFiltersAndRender();
     }
    if (pageId === 'ecoponto-form-page') {
        document.getElementById('ecoponto-registo-form').reset();
        document.getElementById('ecoponto-form-id').value = '';
        document.getElementById('ecoponto-form-title').textContent = 'Novo Registo de Ecoponto';
        renderEcopontoFormEquipamentos();
    }
}

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
    onConfirmCallback = null;
}

function showConfirmationModal(title, body, onConfirm) {
    document.getElementById('confirm-modal-title').textContent = title || 'Confirmar Ação';
    document.getElementById('confirm-modal-body').textContent = body || 'Tem a certeza que quer apagar este registo? Esta ação não pode ser desfeita.';
    onConfirmCallback = onConfirm;
    openModal('confirm-modal');
}

function showInfoModal(title, body) {
    document.getElementById('info-modal-title').textContent = title;
    document.getElementById('info-modal-body').textContent = body;
    openModal('info-modal');
}

function getOnConfirmCallback() {
    return onConfirmCallback;
}

export {
    setButtonLoadingState,
    handleNavClick,
    openModal,
    closeModal,
    showConfirmationModal,
    showInfoModal,
    getOnConfirmCallback
};
