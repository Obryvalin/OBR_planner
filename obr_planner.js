// Глобальные переменные
let executors = [];
let tasks = [];
let taskIdCounter = 1;
let editingTaskId = null;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    updateTaskExecutorSelect();
    updateTaskDependencySelect();
});

// === МОДАЛЬНЫЕ ОКНА ===

// Открытие модального окна добавления задачи
function openAddTaskModal() {
    document.getElementById('task-modal-title').textContent = 'Добавить задачу';
    document.getElementById('task-form').reset();
    document.getElementById('task-id').value = '';
    editingTaskId = null;
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
    document.getElementById('task-epic').value = task.epic || '';
    document.getElementById('task-priority').value = task.priority || 5;
    document.getElementById('task-comments').value = task.comments || '';

    // Установка выбранных исполнителей
    const executorSelect = document.getElementById('task-executor');
    Array.from(executorSelect.options).forEach(option => {
        option.selected = task.executors.includes(parseInt(option.value));
    });

    // Установка выбранных зависимостей
    const dependencySelect = document.getElementById('task-dependency');
    Array.from(dependencySelect.options).forEach(option => {
        option.selected = task.dependencies.includes(parseInt(option.value));
    });

    editingTaskId = taskId;
    document.getElementById('task-modal').style.display = 'block';
}

// Закрытие модального окна задачи
function closeTaskModal() {
    document.getElementById('task-modal').style.display = 'none';
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

// Закрытие модальных окон при клике вне содержимого
window.onclick = function(event) {
    const taskModal = document.getElementById('task-modal');
    const executorModal = document.getElementById('executor-modal');
    
    if (event.target === taskModal) {
        closeTaskModal();
    }
    if (event.target === executorModal) {
        closeExecutorModal();
    }
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
        renderExecutorsList();
    }
}

// Обновление выпадающего списка исполнителей в форме задачи
function updateTaskExecutorSelect() {
    const select = document.getElementById('task-executor');
    select.innerHTML = '';
    
    executors.forEach(executor => {
        const option = document.createElement('option');
        option.value = executor.id;
        option.textContent = executor.name;
        select.appendChild(option);
    });
}

// Обновление выпадающего списка зависимостей
function updateTaskDependencySelect() {
    const select = document.getElementById('task-dependency');
    select.innerHTML = '';
    
    tasks.forEach(task => {
        if (editingTaskId && task.id === editingTaskId) return; // Исключаем саму редактируемую задачу
        
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.title;
        select.appendChild(option);
    });
}

// === ЗАДАЧИ ===

// Обработка отправки формы задачи
function handleTaskSubmit(event) {
    event.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    const duration = parseInt(document.getElementById('task-duration').value) || 1;
    const startDate = document.getElementById('task-start-date').value;
    const endDate = document.getElementById('task-end-date').value;
    const startAfter = document.getElementById('task-start-after').value;
    const finishBefore = document.getElementById('task-finish-before').value;
    const epic = document.getElementById('task-epic').value;
    const priority = parseInt(document.getElementById('task-priority').value) || 5;
    const comments = document.getElementById('task-comments').value;
    
    // Получение выбранных исполнителей
    const executorSelect = document.getElementById('task-executor');
    const selectedExecutors = Array.from(executorSelect.selectedOptions).map(opt => parseInt(opt.value));
    
    // Получение зависимостей
    const dependencySelect = document.getElementById('task-dependency');
    const dependencies = Array.from(dependencySelect.selectedOptions).map(opt => parseInt(opt.value));
    
    if (!title) {
        alert('Введите название задачи');
        return;
    }
    
    // Проверка на циклические зависимости
    if (hasCircularDependency(editingTaskId, dependencies)) {
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
        executors: selectedExecutors,
        epic: epic,
        priority: priority,
        dependencies: dependencies,
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
    renderTasksTable();
}

// Проверка циклических зависимостей
function hasCircularDependency(taskId, newDependencies) {
    // Если это новая задача, присваиваем временный ID
    const tempId = taskId || Date.now();
    
    // Создаем временную копию зависимостей
    const tempDeps = new Map();
    tasks.forEach(task => {
        tempDeps.set(task.id, [...task.dependencies]);
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

// Расчет графика
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

// Отображение задач в таблице
function renderTasksTable() {
    const tbody = document.getElementById('tasks-tbody');
    tbody.innerHTML = '';

    tasks.forEach(task => {
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

        // Форматирование дат
        const displayStartDate = task.calculatedStart || task.startDate || 'Не указана';
        const displayEndDate = task.calculatedEnd || task.endDate || 'Не указана';

        row.innerHTML = `
            <td>${task.title}</td>
            <td>${task.duration} раб. дней</td>
            <td>${displayStartDate}</td>
            <td>${displayEndDate}</td>
            <td>${executorNames}</td>
            <td>${task.epic || '-'}</td>
            <td>${task.priority}/9</td>
            <td>
                <button onclick="openEditTaskModal(${task.id})" class="edit-btn">✏️</button>
                <button onclick="deleteTask(${task.id})" class="delete-btn">🗑️</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
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
        renderTasksTable();
    }
}

// === XML ===

// Сохранение в XML
function saveToXML() {
    if (tasks.length === 0) {
        alert('Нет задач для сохранения');
        return;
    }
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<project name="Waterfall Planner Project">\n';
    
    // Исполнители
    xml += '  <executors>\n';
    executors.forEach(executor => {
        xml += `    <executor id="${executor.id}" name="${escapeXml(executor.name)}" efficiency="${executor.efficiency}" availability="${executor.availability}" />\n`;
    });
    xml += '  </executors>\n';
    
    // Задачи
    xml += '  <tasks>\n';
    tasks.forEach(task => {
        xml += `    <task id="${task.id}" title="${escapeXml(task.title)}" duration="${task.duration}" priority="${task.priority}">\n`;
        xml += `      <start_date>${task.startDate || ''}</start_date>\n`;
        xml += `      <end_date>${task.endDate || ''}</end_date>\n`;
        xml += `      <calculated_start>${task.calculatedStart || ''}</calculated_start>\n`;
        xml += `      <calculated_end>${task.calculatedEnd || ''}</calculated_end>\n`;
        xml += `      <start_after>${task.startAfter || ''}</start_after>\n`;
        xml += `      <finish_before>${task.finishBefore || ''}</finish_before>\n`;
        xml += `      <epic>${task.epic || ''}</epic>\n`;
        xml += `      <comments>${escapeXml(task.comments || '')}</comments>\n`;
        
        // Исполнители
        xml += '      <assignees>\n';
        task.executors.forEach(execId => {
            xml += `        <assignee id="${execId}" />\n`;
        });
        xml += '      </assignees>\n';
        
        // Зависимости
        xml += '      <dependencies>\n';
        task.dependencies.forEach(depId => {
            xml += `        <dependency id="${depId}" />\n`;
        });
        xml += '      </dependencies>\n';
        
        xml += '    </task>\n';
    });
    xml += '  </tasks>\n';
    xml += '</project>';

    // Создание и скачивание файла
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'waterfall-project.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Загрузка из XML
function loadFromXML(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
            
            // Проверка на ошибки парсинга
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('Ошибка парсинга XML');
            }
            
            // Загрузка исполнителей
            executors = [];
            const executorNodes = xmlDoc.querySelectorAll('executor');
            executorNodes.forEach(node => {
                executors.push({
                    id: parseInt(node.getAttribute('id')),
                    name: node.getAttribute('name'),
                    efficiency: parseFloat(node.getAttribute('efficiency')),
                    availability: node.getAttribute('availability') === 'true'
                });
            });

            // Загрузка задач
            tasks = [];
            const taskNodes = xmlDoc.querySelectorAll('task');
            taskNodes.forEach(node => {
                const task = {
                    id: parseInt(node.getAttribute('id')),
                    title: node.getAttribute('title'),
                    duration: parseInt(node.getAttribute('duration')),
                    priority: parseInt(node.getAttribute('priority')),
                    startDate: node.querySelector('start_date')?.textContent || '',
                    endDate: node.querySelector('end_date')?.textContent || '',
                    calculatedStart: node.querySelector('calculated_start')?.textContent || '',
                    calculatedEnd: node.querySelector('calculated_end')?.textContent || '',
                    startAfter: node.querySelector('start_after')?.textContent || '',
                    finishBefore: node.querySelector('finish_before')?.textContent || '',
                    epic: node.querySelector('epic')?.textContent || '',
                    comments: node.querySelector('comments')?.textContent || ''
                };

                // Исполнители
                task.executors = [];
                const assigneeNodes = node.querySelectorAll('assignee');
                assigneeNodes.forEach(assignee => {
                    task.executors.push(parseInt(assignee.getAttribute('id')));
                });

                // Зависимости
                task.dependencies = [];
                const dependencyNodes = node.querySelectorAll('dependency');
                dependencyNodes.forEach(dep => {
                    task.dependencies.push(parseInt(dep.getAttribute('id')));
                });

                tasks.push(task);
            });

            // Обновление UI
            updateTaskExecutorSelect();
            updateTaskDependencySelect();
            renderTasksTable();

            // Обновление счетчика ID
            if (tasks.length > 0) {
                taskIdCounter = Math.max(...tasks.map(t => t.id)) + 1;
            } else {
                taskIdCounter = 1;
            }

            alert('Проект успешно загружен из XML!');

        } catch (error) {
            console.error('Ошибка при загрузке XML:', error);
            alert('Ошибка при загрузке файла XML. Проверьте формат файла.');
        }
    };
    reader.readAsText(file);
}

// Экранирование XML
function escapeXml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
            default: return c;
        }
    });
}