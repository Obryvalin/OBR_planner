// Глобальные переменные
let executors = [];
let epics = [];
let features = [];
let tasks = [];
let taskIdCounter = 1;
let editingTaskId = null;
let editingEpicId = null;
let editingFeatureId = null;

// Состояние сортировки
let currentSort = {
    column: null,
    direction: 'asc'
};

// Состояние фильтрации
let currentFilters = {
    executor: '',
    feature: '',
    epic: '',
    priority: ''
};

// Временные данные для редактирования задачи
let currentExecutors = [];
let currentDependencies = [];

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    updateTaskExecutorSelect();
    updateTaskFeatureSelect();
    updateTaskDependencySelect();
    updateFeatureEpicSelect();
    updateFilterSelects();
});

// === МОДАЛЬНЫЕ ОКНА ===

// Открытие модального окна добавления задачи
function openAddTaskModal() {
    document.getElementById('task-modal-title').textContent = 'Добавить задачу';
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    editingTaskId = null;
    currentExecutors = [];
    currentDependencies = [];
    updateTaskExecutorSelect();
    updateTaskFeatureSelect();
    updateTaskDependencySelect();
    updateSelectedExecutorsList();
    updateSelectedDependenciesList();
    document.getElementById('task-modal').style.display = 'block';
}

// Открытие модального окна редактирования задачи
function openEditTaskModal(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    document.getElementById('task-modal-title').textContent = 'Редактировать задачу';
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-duration').value = task.duration;
    document.getElementById('task-start-date').value = task.startDate || '';
    document.getElementById('task-end-date').value = task.endDate || '';
    document.getElementById('task-start-after').value = task.startAfter || '';
    document.getElementById('task-finish-before').value = task.finishBefore || '';
    document.getElementById('task-feature').value = task.featureId || '';
    document.getElementById('task-priority').value = task.priority || 5;
    document.getElementById('task-comments').value = task.comments || '';

    // Установка текущих исполнителей и зависимостей
    currentExecutors = [...task.executors];
    currentDependencies = [...task.dependencies];

    editingTaskId = taskId;
    document.getElementById('task-modal').style.display = 'block';
    
    // Обновляем списки выбранных элементов
    updateSelectedExecutorsList();
    updateSelectedDependenciesList();
}

// Закрытие модального окна задачи
function closeTaskModal() {
    document.getElementById('task-modal').style.display = 'none';
}

// Открытие модального окна управления исполнителями задачи
function openExecutorsModal() {
    document.getElementById('executors-modal').style.display = 'block';
    
    // Заполняем доступных исполнителей
    const availableSelect = document.getElementById('available-executors');
    availableSelect.innerHTML = '';
    
    executors.forEach(executor => {
        if (!currentExecutors.includes(executor.id)) {
            const option = document.createElement('option');
            option.value = executor.id;
            option.textContent = executor.name;
            availableSelect.appendChild(option);
        }
    });
    
    // Заполняем выбранных исполнителей
    const selectedSelect = document.getElementById('selected-executors');
    selectedSelect.innerHTML = '';
    
    currentExecutors.forEach(execId => {
        const executor = executors.find(e => e.id === execId);
        if (executor) {
            const option = document.createElement('option');
            option.value = executor.id;
            option.textContent = executor.name;
            selectedSelect.appendChild(option);
        }
    });
}

// Закрытие модального окна управления исполнителями задачи
function closeExecutorsModal() {
    document.getElementById('executors-modal').style.display = 'none';
}

// Открытие модального окна управления зависимостями задачи
function openDependenciesModal() {
    document.getElementById('dependencies-modal').style.display = 'block';
    
    // Заполняем доступные задачи (исключаем текущую)
    const availableSelect = document.getElementById('available-dependencies');
    availableSelect.innerHTML = '';
    
    tasks.forEach(task => {
        if (editingTaskId && task.id === editingTaskId) return; // Исключаем саму редактируемую задачу
        if (!currentDependencies.includes(task.id)) {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.title;
            availableSelect.appendChild(option);
        }
    });
    
    // Заполняем выбранные зависимости
    const selectedSelect = document.getElementById('selected-dependencies');
    selectedSelect.innerHTML = '';
    
    currentDependencies.forEach(depId => {
        const task = tasks.find(t => t.id === depId);
        if (task) {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.title;
            selectedSelect.appendChild(option);
        }
    });
}

// Закрытие модального окна управления зависимостями задачи
function closeDependenciesModal() {
    document.getElementById('dependencies-modal').style.display = 'none';
}

// Открытие модального окна управления исполнителями
function openManageExecutorsModal() {
    document.getElementById('executor-modal').style.display = 'block';
    renderExecutorsList();
}

// Закрытие модального окна исполнителей
function closeExecutorModal() {
    document.getElementById('executor-modal').style.display = 'none';
}

// Открытие модального окна управления эпиками
function openManageEpicsModal() {
    document.getElementById('epic-modal').style.display = 'block';
    updateEpicFormSelects();
    renderEpicsList();
}

// Закрытие модального окна эпиков
function closeEpicModal() {
    document.getElementById('epic-modal').style.display = 'none';
}

// Открытие модального окна управления фичами
function openManageFeaturesModal() {
    document.getElementById('feature-modal').style.display = 'block';
    updateFeatureFormSelects();
    renderFeaturesList();
}

// Закрытие модального окна фич
function closeFeatureModal() {
    document.getElementById('feature-modal').style.display = 'none';
}

// Закрытие модальных окон при клике вне содержимого
window.onclick = function(event) {
    const modalIds = [
        'task-modal', 'executors-modal', 'dependencies-modal', 
        'executor-modal', 'epic-modal', 'feature-modal'
    ];
    
    modalIds.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// === ИСПОЛНИТЕЛИ ===

// Добавление исполнителя из модального окна
function addExecutorFromModal() {
    const nameInput = document.getElementById('new-executor-name');
    const efficiencyInput = document.getElementById('new-executor-efficiency');
    const availabilityInput = document.getElementById('new-executor-availability');
    
    if (!nameInput.value.trim()) {
        alert('Введите имя исполнителя');
        return;
    }
    
    const executor = {
        id: Date.now(),
        name: nameInput.value.trim(),
        efficiency: parseFloat(efficiencyInput.value) || 1.0,
        availability: availabilityInput.value === 'true'
    };
    
    executors.push(executor);
    nameInput.value = '';
    efficiencyInput.value = '1.0';
    availabilityInput.value = 'true';
    
    updateTaskExecutorSelect();
    updateFilterSelects();
    renderExecutorsList();
}

// Рендер списка исполнителей в модальном окне
function renderExecutorsList() {
    const listDiv = document.getElementById('executors-list-modal');
    listDiv.innerHTML = '';
    
    executors.forEach(executor => {
        const div = document.createElement('div');
        div.className = 'executor-item';
        div.innerHTML = `
            <div class="executor-info">
                <span class="executor-name">${executor.name}</span>
                <span class="executor-details">Производительность: ${executor.efficiency}, ${executor.availability ? 'Доступен' : 'Недоступен'}</span>
            </div>
            <div class="executor-actions">
                <button class="executor-toggle" onclick="toggleExecutorAvailability(${executor.id})">
                    ${executor.availability ? '❌' : '✅'}
                </button>
                <button class="executor-delete" onclick="removeExecutor(${executor.id})">×</button>
            </div>
        `;
        listDiv.appendChild(div);
    });
}

// Переключение доступности исполнителя
function toggleExecutorAvailability(id) {
    const executor = executors.find(e => e.id === id);
    if (executor) {
        executor.availability = !executor.availability;
        renderExecutorsList();
        updateTaskExecutorSelect();
        updateFilterSelects();
    }
}

// Удаление исполнителя
function removeExecutor(id) {
    if (confirm('Вы уверены, что хотите удалить этого исполнителя?')) {
        // Проверяем, не назначен ли он на какие-либо задачи
        const assignedTasks = tasks.filter(task => task.executors.includes(id));
        if (assignedTasks.length > 0) {
            alert(`Невозможно удалить исполнителя, так как он назначен на ${assignedTasks.length} задач(и)`);
            return;
        }
        
        executors = executors.filter(e => e.id !== id);
        updateTaskExecutorSelect();
        updateFilterSelects();
        renderExecutorsList();
    }
}

// Обновление выпадающего списка исполнителей в форме задачи
function updateTaskExecutorSelect() {
    const select = document.getElementById('task-executor');
    if (select) {
        select.innerHTML = '';
        
        executors.forEach(executor => {
            const option = document.createElement('option');
            option.value = executor.id;
            option.textContent = executor.name;
            select.appendChild(option);
        });
    }
}

// === ЭПИКИ ===

// Добавление эпика из модального окна
function addEpicFromModal() {
    const nameInput = document.getElementById('new-epic-name');
    const descriptionInput = document.getElementById('new-epic-description');
    const priorityInput = document.getElementById('new-epic-priority');
    
    if (!nameInput.value.trim()) {
        alert('Введите название эпика');
        return;
    }
    
    const epic = {
        id: editingEpicId || Date.now(),
        name: nameInput.value.trim(),
        description: descriptionInput.value.trim(),
        priority: parseInt(priorityInput.value) || 5
    };
    
    if (editingEpicId) {
        // Редактирование существующего эпика
        const index = epics.findIndex(e => e.id === editingEpicId);
        if (index !== -1) {
            epics[index] = epic;
        }
        editingEpicId = null;
    } else {
        // Добавление нового эпика
        epics.push(epic);
    }
    
    nameInput.value = '';
    descriptionInput.value = '';
    priorityInput.value = '5';
    
    updateFeatureEpicSelect();
    updateFilterSelects();
    updateEpicFormSelects();
    renderEpicsList();
}

// Рендер списка эпиков в модальном окне
function renderEpicsList() {
    const listDiv = document.getElementById('epics-list-modal');
    listDiv.innerHTML = '';
    
    epics.forEach(epic => {
        const div = document.createElement('div');
        div.className = 'epic-item';
        div.innerHTML = `
            <div class="epic-info">
                <span class="epic-name">${epic.name}</span>
                <span class="epic-details">${epic.description || 'Без описания'}, приоритет: ${epic.priority}/9</span>
            </div>
            <div class="epic-actions">
                <button class="epic-edit" onclick="editEpic(${epic.id})">✏️</button>
                <button class="epic-delete" onclick="removeEpic(${epic.id})">×</button>
            </div>
        `;
        listDiv.appendChild(div);
    });
}

// Редактирование эпика
function editEpic(epicId) {
    const epic = epics.find(e => e.id === epicId);
    if (!epic) return;
    
    document.getElementById('new-epic-name').value = epic.name;
    document.getElementById('new-epic-description').value = epic.description || '';
    document.getElementById('new-epic-priority').value = epic.priority || 5;
    
    editingEpicId = epicId;
}

// Удаление эпика
function removeEpic(id) {
    if (confirm('Вы уверены, что хотите удалить этот эпик?')) {
        // Проверяем, не связан ли он с какими-либо фичами
        const associatedFeatures = features.filter(feature => feature.epicId === id);
        if (associatedFeatures.length > 0) {
            alert(`Невозможно удалить эпик, так как с ним связаны ${associatedFeatures.length} фич(и)`);
            return;
        }
        
        epics = epics.filter(e => e.id !== id);
        updateFeatureEpicSelect();
        updateFilterSelects();
        updateEpicFormSelects();
        renderEpicsList();
    }
}

// Обновление выпадающих списков эпиков
function updateEpicFormSelects() {
    // Обновляем список эпиков в форме фич
    const featureEpicSelect = document.getElementById('new-feature-epic');
    if (featureEpicSelect) {
        featureEpicSelect.innerHTML = '<option value="">-- Выберите эпик --</option>';
        
        epics.forEach(epic => {
            const option = document.createElement('option');
            option.value = epic.id;
            option.textContent = epic.name;
            featureEpicSelect.appendChild(option);
        });
    }
}

// === ФИЧИ ===

// Добавление фичи из модального окна
function addFeatureFromModal() {
    const nameInput = document.getElementById('new-feature-name');
    const epicSelect = document.getElementById('new-feature-epic');
    const businessValueInput = document.getElementById('new-feature-business-value');
    const descriptionInput = document.getElementById('new-feature-description');
    
    if (!nameInput.value.trim()) {
        alert('Введите название фичи');
        return;
    }
    
    const feature = {
        id: editingFeatureId || Date.now(),
        name: nameInput.value.trim(),
        epicId: parseInt(epicSelect.value) || null,
        businessValue: parseInt(businessValueInput.value) || 5,
        description: descriptionInput.value.trim()
    };
    
    if (editingFeatureId) {
        // Редактирование существующей фичи
        const index = features.findIndex(f => f.id === editingFeatureId);
        if (index !== -1) {
            features[index] = feature;
        }
        editingFeatureId = null;
    } else {
        // Добавление новой фичи
        features.push(feature);
    }
    
    nameInput.value = '';
    epicSelect.value = '';
    businessValueInput.value = '5';
    descriptionInput.value = '';
    
    updateTaskFeatureSelect();
    updateFilterSelects();
    updateFeatureFormSelects();
    renderFeaturesList();
}

// Рендер списка фич в модальном окне
function renderFeaturesList() {
    const listDiv = document.getElementById('features-list-modal');
    listDiv.innerHTML = '';
    
    features.forEach(feature => {
        const epicName = getEpicNameById(feature.epicId);
        const div = document.createElement('div');
        div.className = 'feature-item';
        div.innerHTML = `
            <div class="feature-info">
                <span class="feature-name">${feature.name}</span>
                <span class="feature-details">${epicName ? `Эпик: ${epicName}` : 'Без эпика'}, ценность: ${feature.businessValue}/9</span>
                ${feature.description ? `<span class="feature-details">${feature.description}</span>` : ''}
            </div>
            <div class="feature-actions">
                <button class="feature-edit" onclick="editFeature(${feature.id})">✏️</button>
                <button class="feature-delete" onclick="removeFeature(${feature.id})">×</button>
            </div>
        `;
        listDiv.appendChild(div);
    });
}

// Редактирование фичи
function editFeature(featureId) {
    const feature = features.find(f => f.id === featureId);
    if (!feature) return;
    
    document.getElementById('new-feature-name').value = feature.name;
    document.getElementById('new-feature-epic').value = feature.epicId || '';
    document.getElementById('new-feature-business-value').value = feature.businessValue || 5;
    document.getElementById('new-feature-description').value = feature.description || '';
    
    editingFeatureId = featureId;
}

// Удаление фичи
function removeFeature(id) {
    if (confirm('Вы уверены, что хотите удалить эту фичу?')) {
        // Проверяем, не связана ли она с какими-либо задачами
        const associatedTasks = tasks.filter(task => task.featureId === id);
        if (associatedTasks.length > 0) {
            alert(`Невозможно удалить фичу, так как с ней связаны ${associatedTasks.length} задач(и)`);
            return;
        }
        
        features = features.filter(f => f.id !== id);
        updateTaskFeatureSelect();
        updateFilterSelects();
        updateFeatureFormSelects();
        renderFeaturesList();
    }
}

// Обновление выпадающих списков фич
function updateFeatureFormSelects() {
    // Обновляем список эпиков в форме фич (для фильтрации)
    updateFeatureEpicSelect();
}

// Обновление выпадающего списка эпиков в форме фич
function updateFeatureEpicSelect() {
    const select = document.getElementById('new-feature-epic');
    if (select) {
        select.innerHTML = '<option value="">-- Выберите эпик --</option>';
        
        epics.forEach(epic => {
            const option = document.createElement('option');
            option.value = epic.id;
            option.textContent = epic.name;
            select.appendChild(option);
        });
    }
}

// === ЗАДАЧИ ===

// Обновление выпадающего списка фич в форме задачи
function updateTaskFeatureSelect() {
    const select = document.getElementById('task-feature');
    if (select) {
        select.innerHTML = '<option value="">-- Выберите фичу --</option>';
        
        features.forEach(feature => {
            const epicName = getEpicNameById(feature.epicId);
            const option = document.createElement('option');
            option.value = feature.id;
            option.textContent = `${feature.name}${epicName ? ` (${epicName})` : ''}`;
            select.appendChild(option);
        });
    }
}

// Обновление выпадающего списка зависимостей
function updateTaskDependencySelect() {
    const select = document.getElementById('task-dependency');
    if (select) {
        select.innerHTML = '';
        
        tasks.forEach(task => {
            if (editingTaskId && task.id === editingTaskId) return; // Исключаем саму редактируемую задачу
            
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.title;
            select.appendChild(option);
        });
    }
}

// Обновление списка выбранных исполнителей
function updateSelectedExecutorsList() {
    const container = document.getElementById('selected-executors-list');
    container.innerHTML = '';
    
    if (currentExecutors.length === 0) {
        container.innerHTML = '<span class="no-items">Нет исполнителей</span>';
        return;
    }
    
    const listDiv = document.createElement('div');
    listDiv.className = 'selected-items-list';
    
    currentExecutors.forEach(execId => {
        const executor = executors.find(e => e.id === execId);
        if (executor) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'selected-item';
            itemDiv.innerHTML = `
                ${executor.name}
                <button onclick="removeExecutorFromTask(${executor.id})">×</button>
            `;
            listDiv.appendChild(itemDiv);
        }
    });
    
    container.appendChild(listDiv);
}

// Обновление списка выбранных зависимостей
function updateSelectedDependenciesList() {
    const container = document.getElementById('selected-dependencies-list');
    container.innerHTML = '';
    
    if (currentDependencies.length === 0) {
        container.innerHTML = '<span class="no-items">Нет зависимостей</span>';
        return;
    }
    
    const listDiv = document.createElement('div');
    listDiv.className = 'selected-items-list';
    
    currentDependencies.forEach(depId => {
        const task = tasks.find(t => t.id === depId);
        if (task) {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'selected-item';
            itemDiv.innerHTML = `
                ${task.title}
                <button onclick="removeDependencyFromTask(${task.id})">×</button>
            `;
            listDiv.appendChild(itemDiv);
        }
    });
    
    container.appendChild(listDiv);
}

// Удаление исполнителя из задачи
function removeExecutorFromTask(execId) {
    currentExecutors = currentExecutors.filter(id => id !== execId);
    updateSelectedExecutorsList();
}

// Удаление зависимости из задачи
function removeDependencyFromTask(depId) {
    currentDependencies = currentDependencies.filter(id => id !== depId);
    updateSelectedDependenciesList();
}

// === УПРАВЛЕНИЕ ИСПОЛНИТЕЛЯМИ В ЗАДАЧЕ ===

// Добавление выбранных исполнителей
function addSelectedExecutors() {
    const availableSelect = document.getElementById('available-executors');
    const selectedOptions = Array.from(availableSelect.selectedOptions);
    
    selectedOptions.forEach(option => {
        const execId = parseInt(option.value);
        if (!currentExecutors.includes(execId)) {
            currentExecutors.push(execId);
        }
        availableSelect.removeChild(option);
    });
    
    updateExecutorsModalLists();
}

// Удаление выбранных исполнителей
function removeSelectedExecutors() {
    const selectedSelect = document.getElementById('selected-executors');
    const selectedOptions = Array.from(selectedSelect.selectedOptions);
    
    selectedOptions.forEach(option => {
        const execId = parseInt(option.value);
        currentExecutors = currentExecutors.filter(id => id !== execId);
        selectedSelect.removeChild(option);
    });
    
    updateExecutorsModalLists();
}

// Обновление списков в модальном окне исполнителей
function updateExecutorsModalLists() {
    // Обновляем доступных исполнителей
    const availableSelect = document.getElementById('available-executors');
    availableSelect.innerHTML = '';
    
    executors.forEach(executor => {
        if (!currentExecutors.includes(executor.id)) {
            const option = document.createElement('option');
            option.value = executor.id;
            option.textContent = executor.name;
            availableSelect.appendChild(option);
        }
    });
    
    // Обновляем выбранных исполнителей
    const selectedSelect = document.getElementById('selected-executors');
    selectedSelect.innerHTML = '';
    
    currentExecutors.forEach(execId => {
        const executor = executors.find(e => e.id === execId);
        if (executor) {
            const option = document.createElement('option');
            option.value = executor.id;
            option.textContent = executor.name;
            selectedSelect.appendChild(option);
        }
    });
}

// Сохранение исполнителей
function saveExecutors() {
    updateSelectedExecutorsList();
    closeExecutorsModal();
}

// === УПРАВЛЕНИЕ ЗАВИСИМОСТЯМИ В ЗАДАЧЕ ===

// Добавление выбранных зависимостей
function addSelectedDependencies() {
    const availableSelect = document.getElementById('available-dependencies');
    const selectedOptions = Array.from(availableSelect.selectedOptions);
    
    selectedOptions.forEach(option => {
        const depId = parseInt(option.value);
        if (!currentDependencies.includes(depId)) {
            currentDependencies.push(depId);
        }
        availableSelect.removeChild(option);
    });
    
    updateDependenciesModalLists();
}

// Удаление выбранных зависимостей
function removeSelectedDependencies() {
    const selectedSelect = document.getElementById('selected-dependencies');
    const selectedOptions = Array.from(selectedSelect.selectedOptions);
    
    selectedOptions.forEach(option => {
        const depId = parseInt(option.value);
        currentDependencies = currentDependencies.filter(id => id !== depId);
        selectedSelect.removeChild(option);
    });
    
    updateDependenciesModalLists();
}

// Обновление списков в модальном окне зависимостей
function updateDependenciesModalLists() {
    // Обновляем доступные задачи
    const availableSelect = document.getElementById('available-dependencies');
    availableSelect.innerHTML = '';
    
    tasks.forEach(task => {
        if (editingTaskId && task.id === editingTaskId) return; // Исключаем саму редактируемую задачу
        if (!currentDependencies.includes(task.id)) {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.title;
            availableSelect.appendChild(option);
        }
    });
    
    // Обновляем выбранные зависимости
    const selectedSelect = document.getElementById('selected-dependencies');
    selectedSelect.innerHTML = '';
    
    currentDependencies.forEach(depId => {
        const task = tasks.find(t => t.id === depId);
        if (task) {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.title;
            selectedSelect.appendChild(option);
        }
    });
}

// Сохранение зависимостей
function saveDependencies() {
    updateSelectedDependenciesList();
    closeDependenciesModal();
}

// Обработка отправки формы задачи
function handleTaskSubmit(event) {
    event.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    const duration = parseInt(document.getElementById('task-duration').value) || 1;
    const startDate = document.getElementById('task-start-date').value;
    const endDate = document.getElementById('task-end-date').value;
    const startAfter = document.getElementById('task-start-after').value;
    const finishBefore = document.getElementById('task-finish-before').value;
    const featureId = parseInt(document.getElementById('task-feature').value) || null;
    const priority = parseInt(document.getElementById('task-priority').value) || 5;
    const comments = document.getElementById('task-comments').value;
    
    if (!title) {
        alert('Введите название задачи');
        return;
    }
    
    // Проверка на циклические зависимости
    if (hasCircularDependency(editingTaskId, currentDependencies)) {
        alert('Обнаружена циклическая зависимость! Проверьте связи между задачами.');
        return;
    }
    
    const task = {
        id: editingTaskId || taskIdCounter++,
        title: title,
        duration: duration,
        startDate: startDate,
        endDate: endDate,
        startAfter: startAfter,
        finishBefore: finishBefore,
        executors: [...currentExecutors],
        featureId: featureId,
        priority: priority,
        dependencies: [...currentDependencies],
        comments: comments,
        calculatedStart: null,
        calculatedEnd: null
    };
    
    if (editingTaskId) {
        // Редактирование существующей задачи
        const index = tasks.findIndex(t => t.id === editingTaskId);
        if (index !== -1) {
            tasks[index] = task;
        }
    } else {
        // Добавление новой задачи
        tasks.push(task);
    }
    
    closeTaskModal();
    updateTaskDependencySelect();
    updateFilterSelects();
    renderTasksTable();
}

// Проверка циклических зависимостей
function hasCircularDependency(taskId, newDependencies) {
    // Если это новая задача, присваиваем временный ID
    const tempId = taskId || Date.now();
    
    // Создаем временную копию зависимостей
    const tempDeps = new Map();
    tasks.forEach(task => {
        if (task.id !== taskId) { // Исключаем редактируемую задачу
            tempDeps.set(task.id, [...task.dependencies]);
        }
    });
    
    // Обновляем зависимости для проверяемой задачи
    tempDeps.set(tempId, newDependencies);
    
    // Проверяем наличие цикла
    const visited = new Set();
    const temp = new Set();
    
    function hasCycle(currentId) {
        if (visited.has(currentId)) return false;
        if (temp.has(currentId)) return true; // Цикл найден
        
        temp.add(currentId);
        const deps = tempDeps.get(currentId) || [];
        
        for (let depId of deps) {
            if (hasCycle(depId)) return true;
        }
        
        temp.delete(currentId);
        visited.add(currentId);
        return false;
    }
    
    return hasCycle(tempId);
}

// Расчет графика с оптимизацией по доступности исполнителей
function calculateSchedule() {
    if (tasks.length === 0) {
        alert('Нет задач для расчета');
        return;
    }
    
    // Сортируем задачи по зависимостям (топологическая сортировка)
    let sortedTasks = [...tasks];
    let visited = new Set();
    let temp = new Set();
    let order = [];

    function visit(taskId) {
        if (visited.has(taskId)) return true;
        if (temp.has(taskId)) return false; // Цикл обнаружен
        
        temp.add(taskId);
        
        const task = sortedTasks.find(t => t.id === taskId);
        if (task && task.dependencies) {
            for (let dep of task.dependencies) {
                if (!visit(dep)) return false;
            }
        }
        
        temp.delete(taskId);
        visited.add(taskId);
        order.unshift(taskId);
        return true;
    }

    for (let task of sortedTasks) {
        if (!visited.has(task.id)) {
            if (!visit(task.id)) {
                alert('Обнаружен цикл в зависимостях задач!');
                return;
            }
        }
    }

    // Рассчитываем даты для каждой задачи в порядке выполнения
    for (let taskId of order) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) continue;

        let startDate = null;
        let endDate = null;

        // Определяем начальную дату
        if (task.startDate) {
            startDate = new Date(task.startDate);
        } else {
            // Минимальная дата - начало после всех зависимостей
            let maxEndDate = null;
            
            if (task.dependencies && task.dependencies.length > 0) {
                for (let depId of task.dependencies) {
                    const depTask = tasks.find(t => t.id === depId);
                    if (depTask && depTask.calculatedEnd) {
                        const depEnd = new Date(depTask.calculatedEnd);
                        if (!maxEndDate || depEnd > maxEndDate) {
                            maxEndDate = depEnd;
                        }
                    }
                }
            }
            
            // Если есть ограничение "начать не раньше"
            if (task.startAfter) {
                const startAfterDate = new Date(task.startAfter);
                if (!maxEndDate || startAfterDate > maxEndDate) {
                    maxEndDate = startAfterDate;
                }
            }
            
            startDate = maxEndDate ? new Date(maxEndDate.getTime() + 24*60*60*1000) : new Date(); // +1 день
        }

        // Проверяем, доступны ли исполнители в выбранные дни
        startDate = findAvailableDateForExecutors(task.executors, startDate, task.duration);

        // Рассчитываем конечную дату
        const workDays = task.duration;
        endDate = addWorkDays(new Date(startDate), workDays);

        // Если есть ограничение "закончить не позже"
        if (task.finishBefore) {
            const finishBeforeDate = new Date(task.finishBefore);
            if (endDate > finishBeforeDate) {
                console.warn(`Предупреждение: задача "${task.title}" выходит за дедлайн ${finishBeforeDate.toLocaleDateString()}`);
            }
        }

        task.calculatedStart = startDate.toISOString().split('T')[0];
        task.calculatedEnd = endDate.toISOString().split('T')[0];
    }

    renderTasksTable();
}

// Поиск доступной даты для исполнителей (учитываем, что один исполнитель не может делать 2 задачи в один день)
function findAvailableDateForExecutors(executorIds, startDate, duration) {
    let candidateDate = new Date(startDate);
    let maxRetries = 30; // Максимальное количество дней для поиска
    let retries = 0;
    
    while (retries < maxRetries) {
        // Проверяем, свободны ли все исполнители в этот день и на протяжении всей задачи
        let isAvailable = true;
        
        for (let dayOffset = 0; dayOffset < duration; dayOffset++) {
            const checkDate = addWorkDays(new Date(candidateDate), dayOffset);
            const checkDateStr = checkDate.toISOString().split('T')[0];
            
            for (const execId of executorIds) {
                // Проверяем, не заняты ли исполнители в этот день
                const assignedTasks = tasks.filter(t => 
                    t.executors.includes(execId) && 
                    t.calculatedStart && 
                    t.calculatedEnd
                );
                
                for (const assignedTask of assignedTasks) {
                    const taskStart = new Date(assignedTask.calculatedStart);
                    const taskEnd = new Date(assignedTask.calculatedEnd);
                    
                    // Проверяем пересечение дат
                    if (checkDate >= taskStart && checkDate <= taskEnd) {
                        isAvailable = false;
                        break;
                    }
                }
                
                if (!isAvailable) break;
            }
            
            if (!isAvailable) break;
        }
        
        if (isAvailable) {
            return candidateDate;
        }
        
        // Если не доступны, пробуем следующий день
        candidateDate = addWorkDays(candidateDate, 1);
        retries++;
    }
    
    // Если не нашли подходящую дату, возвращаем исходную (пользователь увидит конфликт)
    return startDate;
}

// Добавление рабочих дней к дате (без выходных)
function addWorkDays(date, days) {
    let result = new Date(date);
    let addedDays = 0;
    
    while (addedDays < days) {
        result.setDate(result.getDate() + 1);
        
        // Проверяем, является ли день выходным (сб, вс)
        const dayOfWeek = result.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = воскресенье, 6 = суббота
            addedDays++;
        }
    }
    
    return result;
}

// Сортировка таблицы
function sortTable(column) {
    // Обновляем индикаторы сортировки
    document.querySelectorAll('.sort-indicator').forEach(indicator => {
        indicator.className = 'sort-indicator';
        indicator.textContent = '↕️';
    });
    
    // Определяем направление сортировки
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // Обновляем индикатор текущей сортировки
    const sortIndicator = document.getElementById(`${column}-sort`);
    if (sortIndicator) {
        sortIndicator.className = 'sort-indicator active';
        sortIndicator.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
    }
    
    // Сортируем задачи
    tasks.sort((a, b) => {
        let valueA, valueB;
        
        switch (column) {
            case 'title':
                valueA = a.title.toLowerCase();
                valueB = b.title.toLowerCase();
                break;
            case 'duration':
                valueA = a.duration;
                valueB = b.duration;
                break;
            case 'startDate':
                valueA = a.calculatedStart || a.startDate || '';
                valueB = b.calculatedStart || b.startDate || '';
                break;
            case 'endDate':
                valueA = a.calculatedEnd || a.endDate || '';
                valueB = b.calculatedEnd || b.endDate || '';
                break;
            case 'executors':
                valueA = getExecutorNames(a.executors).toLowerCase();
                valueB = getExecutorNames(b.executors).toLowerCase();
                break;
            case 'feature':
                valueA = getFeatureName(a.featureId).toLowerCase();
                valueB = getFeatureName(b.featureId).toLowerCase();
                break;
            case 'priority':
                valueA = a.priority;
                valueB = b.priority;
                break;
            default:
                return 0;
        }
        
        // Для дат используем специальное сравнение
        if (column === 'startDate' || column === 'endDate') {
            if (!valueA && !valueB) return 0;
            if (!valueA) return currentSort.direction === 'asc' ? 1 : -1;
            if (!valueB) return currentSort.direction === 'asc' ? -1 : 1;
            return currentSort.direction === 'asc' ? 
                new Date(valueA) - new Date(valueB) : 
                new Date(valueB) - new Date(valueA);
        }
        
        // Для чисел
        if (typeof valueA === 'number' && typeof valueB === 'number') {
            return currentSort.direction === 'asc' ? valueA - valueB : valueB - valueA;
        }
        
        // Для строк
        if (currentSort.direction === 'asc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        } else {
            return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        }
    });
    
    renderTasksTable();
}

// Получение имен исполнителей
function getExecutorNames(executorIds) {
    return executorIds.map(id => {
        const exec = executors.find(e => e.id === id);
        return exec ? exec.name : 'Не назначен';
    }).join(', ');
}

// Получение имени фичи
function getFeatureName(featureId) {
    if (!featureId) return '-';
    const feature = features.find(f => f.id === featureId);
    return feature ? feature.name : '-';
}

// Фильтрация задач
function applyFilters() {
    // Обновляем текущие фильтры
    currentFilters.executor = document.getElementById('filter-executor').value;
    currentFilters.feature = document.getElementById('filter-feature').value;
    currentFilters.epic = document.getElementById('filter-epic').value;
    currentFilters.priority = document.getElementById('filter-priority').value;
    
    renderTasksTable();
}

// Очистка фильтров
function clearExecutorFilter() {
    document.getElementById('filter-executor').value = '';
    currentFilters.executor = '';
    renderTasksTable();
}

function clearFeatureFilter() {
    document.getElementById('filter-feature').value = '';
    currentFilters.feature = '';
    renderTasksTable();
}

function clearEpicFilter() {
    document.getElementById('filter-epic').value = '';
    currentFilters.epic = '';
    renderTasksTable();
}

function clearPriorityFilter() {
    document.getElementById('filter-priority').value = '';
    currentFilters.priority = '';
    renderTasksTable();
}

// Обновление выпадающих списков фильтров
function updateFilterSelects() {
    // Обновление фильтра по исполнителям
    const executorSelect = document.getElementById('filter-executor');
    executorSelect.innerHTML = '<option value="">Все исполнители</option>';
    
    executors.forEach(executor => {
        const option = document.createElement('option');
        option.value = executor.id;
        option.textContent = executor.name;
        executorSelect.appendChild(option);
    });
    
    // Обновление фильтра по фичам
    const featureSelect = document.getElementById('filter-feature');
    featureSelect.innerHTML = '<option value="">Все фичи</option>';
    
    features.forEach(feature => {
        const option = document.createElement('option');
        option.value = feature.id;
        option.textContent = feature.name;
        featureSelect.appendChild(option);
    });
    
    // Обновление фильтра по эпикам
    const epicSelect = document.getElementById('filter-epic');
    epicSelect.innerHTML = '<option value="">Все эпики</option>';
    
    epics.forEach(epic => {
        const option = document.createElement('option');
        option.value = epic.id;
        option.textContent = epic.name;
        epicSelect.appendChild(option);
    });
}

// Отображение задач в таблице
function renderTasksTable() {
    const tbody = document.getElementById('tasks-tbody');
    tbody.innerHTML = '';

    // Фильтрация задач
    let filteredTasks = tasks.filter(task => {
        // Фильтр по исполнителю
        if (currentFilters.executor && !task.executors.includes(parseInt(currentFilters.executor))) {
            return false;
        }
        
        // Фильтр по фиче
        if (currentFilters.feature && task.featureId !== parseInt(currentFilters.feature)) {
            return false;
        }
        
        // Фильтр по эпику
        if (currentFilters.epic) {
            const feature = features.find(f => f.id === task.featureId);
            if (!feature || feature.epicId !== parseInt(currentFilters.epic)) {
                return false;
            }
        }
        
        // Фильтр по приоритету
        if (currentFilters.priority) {
            if (currentFilters.priority === 'high' && task.priority < 7) return false;
            if (currentFilters.priority === 'medium' && (task.priority < 4 || task.priority > 6)) return false;
            if (currentFilters.priority === 'low' && task.priority > 3) return false;
        }
        
        return true;
    });

    filteredTasks.forEach(task => {
        const row = document.createElement('tr');
        
        // Определение класса по приоритету
        let priorityClass = '';
        if (task.priority >= 7) priorityClass = 'task-high-priority';
        else if (task.priority >= 4) priorityClass = 'task-medium-priority';
        else priorityClass = 'task-low-priority';
        
        row.className = priorityClass;
        
        // Получение имен исполнителей
        const executorNames = task.executors.map(execId => {
            const exec = executors.find(e => e.id === execId);
            return exec ? exec.name : 'Не назначен';
        }).join(', ');

        // Получение имени фичи и эпика
        const feature = features.find(f => f.id === task.featureId);
        const featureName = feature ? feature.name : '-';
        const epicName = feature && feature.epicId ? getEpicNameById(feature.epicId) : '-';

        // Форматирование дат
        const displayStartDate = task.calculatedStart || task.startDate || '—';
        const displayEndDate = task.calculatedEnd || task.endDate || '—';

        row.innerHTML = `
            <td title="${task.title}">${truncateString(task.title, 25)}</td>
            <td>${task.duration}</td>
            <td>${displayStartDate}</td>
            <td>${displayEndDate}</td>
            <td title="${executorNames}">${truncateString(executorNames, 20)}</td>
            <td title="${featureName} (${epicName})">${truncateString(`${featureName} (${epicName})`, 25)}</td>
            <td>${task.priority}</td>
            <td>
                <button onclick="openEditTaskModal(${task.id})" class="edit-btn" title="Редактировать">✏️</button>
                <button onclick="deleteTask(${task.id})" class="delete-btn" title="Удалить">🗑️</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    // Показываем сообщение, если нет задач
    if (tbody.children.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="8" style="text-align: center; color: #6c757d;">Нет задач, соответствующих фильтрам</td>`;
        tbody.appendChild(row);
    }
}

// Утилита: обрезка строки
function truncateString(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
}

// Получение имени эпика по ID
function getEpicNameById(epicId) {
    if (!epicId) return null;
    const epic = epics.find(e => e.id === epicId);
    return epic ? epic.name : null;
}

// Удаление задачи
function deleteTask(id) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        // Проверяем, нет ли задач, зависящих от этой
        const dependentTasks = tasks.filter(task => task.dependencies.includes(id));
        if (dependentTasks.length > 0) {
            alert(`Невозможно удалить задачу, так как на нее ссылаются ${dependentTasks.length} другие задачи`);
            return;
        }
        
        tasks = tasks.filter(task => task.id !== id);
        updateTaskDependencySelect();
        updateFilterSelects();
        renderTasksTable();
    }
}

// === JSON ===

// Сохранение в JSON
function saveToJSON() {
    if (tasks.length === 0) {
        alert('Нет задач для сохранения');
        return;
    }
    
    const projectData = {
        executors: executors,
        epics: epics,
        features: features,
        tasks: tasks,
        taskIdCounter: taskIdCounter
    };
    
    const jsonString = JSON.stringify(projectData, null, 2);
    
    // Создание и скачивание файла
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waterfall-project.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Загрузка из JSON
function loadFromJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const projectData = JSON.parse(e.target.result);
            
            // Загрузка данных
            executors = projectData.executors || [];
            epics = projectData.epics || [];
            features = projectData.features || [];
            tasks = projectData.tasks || [];
            taskIdCounter = projectData.taskIdCounter || 1;
            
            // Обновление UI
            updateTaskExecutorSelect();
            updateTaskFeatureSelect();
            updateTaskDependencySelect();
            updateFeatureEpicSelect();
            updateFilterSelects();
            renderTasksTable();
            
            alert('Проект успешно загружен из JSON!');

        } catch (error) {
            console.error('Ошибка при загрузке JSON:', error);
            alert('Ошибка при загрузке файла JSON. Проверьте формат файла.');
        }
    };
    reader.readAsText(file);
}