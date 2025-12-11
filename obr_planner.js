// Глобальные переменные
let executors = [];
let tasks = [];
let taskIdCounter = 1;

// Переменные для сортировки и фильтрации
let currentSort = { column: null, direction: 'asc' };
let currentFilters = {
    executor: '',
    epic: '',
    priority: '',
    searchTitle: ''
};

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    updateExecutorsList();
    updateTaskDependencySelect();
    updateFilterExecutors();
    updateTaskExecutorSelect();
    updateTaskDependencySelect();
});

// Добавление исполнителя
function addExecutor() {
    const nameInput = document.getElementById('executor-name');
    const efficiencyInput = document.getElementById('executor-efficiency');
    
    if (!nameInput.value.trim()) {
        alert('Введите имя исполнителя');
        return;
    }
    
    const executor = {
        id: Date.now(),
        name: nameInput.value.trim(),
        efficiency: parseFloat(efficiencyInput.value) || 1.0,
        availability: true
    };
    
    executors.push(executor);
    nameInput.value = '';
    efficiencyInput.value = '1.0';
    
    updateExecutorsList();
    updateTaskExecutorSelect();
    updateFilterExecutors();
    updateTaskExecutorSelect();
    updateTaskDependencySelect();
}

// Обновление списка исполнителей
function updateExecutorsList() {
    const listDiv = document.getElementById('executors-list');
    listDiv.innerHTML = '';
    
    executors.forEach(executor => {
        const div = document.createElement('div');
        div.className = 'executor-item';
        div.innerHTML = `
            ${executor.name} (${executor.efficiency})
            <button onclick="removeExecutor(${executor.id})" style="margin-left: 10px; background: #dc3545; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer;">×</button>
        `;
        listDiv.appendChild(div);
    });
}

// Обновление выпадающего списка исполнителей в фильтрах
function updateFilterExecutors() {
    const select = document.getElementById('filter-executor');
    select.innerHTML = '<option value="">Все исполнители</option>';
    
    executors.forEach(executor => {
        const option = document.createElement('option');
        option.value = executor.id;
        option.textContent = executor.name;
        select.appendChild(option);
    });
}

// Удаление исполнителя
function removeExecutor(id) {
    executors = executors.filter(e => e.id !== id);
    updateExecutorsList();
    updateTaskExecutorSelect();
    updateFilterExecutors();
}

// Обновление выпадающего списка исполнителей в форме задачи
function updateTaskExecutorSelect() {
    // Обновляем форму добавления
    const addSelect = document.getElementById('task-executor');
    addSelect.innerHTML = '';
    
    executors.forEach(executor => {
        const option = document.createElement('option');
        option.value = executor.id;
        option.textContent = executor.name;
        addSelect.appendChild(option);
    });
    
    // Обновляем форму редактирования
    const editSelect = document.getElementById('task-executor-edit');
    editSelect.innerHTML = '';
    
    executors.forEach(executor => {
        const option = document.createElement('option');
        option.value = executor.id;
        option.textContent = executor.name;
        editSelect.appendChild(option);
    });
}

// Обновление выпадающего списка зависимостей
function updateTaskDependencySelect() {
    // Обновляем форму добавления
    const addSelect = document.getElementById('task-dependency');
    addSelect.innerHTML = '<option value="">-- Нет зависимости --</option>';
    
    tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.title;
        addSelect.appendChild(option);
    });
    
    // Обновляем форму редактирования
    const editSelect = document.getElementById('task-dependency-edit');
    editSelect.innerHTML = '<option value="">-- Нет зависимости --</option>';
    
    tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.title;
        editSelect.appendChild(option);
    });
}

// Добавление задачи
function addTask() {
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
    
    const task = {
        id: taskIdCounter++,
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
    
    tasks.push(task);
    
    // Сброс формы
    document.getElementById('task-title').value = '';
    document.getElementById('task-duration').value = '1';
    document.getElementById('task-start-date').value = '';
    document.getElementById('task-end-date').value = '';
    document.getElementById('task-start-after').value = '';
    document.getElementById('task-finish-before').value = '';
    document.getElementById('task-epic').value = '';
    document.getElementById('task-priority').value = '5';
    document.getElementById('task-comments').value = '';
    
    // Сброс выбора исполнителей и зависимостей
    document.querySelectorAll('#task-executor option, #task-dependency option').forEach(opt => opt.selected = false);
    
    updateTaskDependencySelect();
    renderTasksTable();
}

// Редактирование задачи
function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Заполняем форму редактирования
    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title-edit').value = task.title;
    document.getElementById('task-duration-edit').value = task.duration;
    document.getElementById('task-start-date-edit').value = task.startDate;
    document.getElementById('task-end-date-edit').value = task.endDate;
    document.getElementById('task-start-after-edit').value = task.startAfter;
    document.getElementById('task-finish-before-edit').value = task.finishBefore;
    document.getElementById('task-epic-edit').value = task.epic;
    document.getElementById('task-priority-edit').value = task.priority;
    document.getElementById('task-comments-edit').value = task.comments || '';
    
    // Устанавливаем выбранных исполнителей
    const executorSelect = document.getElementById('task-executor-edit');
    Array.from(executorSelect.options).forEach(option => {
        option.selected = task.executors.includes(parseInt(option.value));
    });
    
    // Устанавливаем выбранные зависимости
    const dependencySelect = document.getElementById('task-dependency-edit');
    Array.from(dependencySelect.options).forEach(option => {
        option.selected = task.dependencies.includes(parseInt(option.value));
    });
    
    // Показываем форму редактирования
    document.getElementById('add-form-section').style.display = 'none';
    document.getElementById('edit-form-section').style.display = 'block';
    document.getElementById('edit-form-title').textContent = `✏️ Редактировать задачу: ${task.title}`;
}

// Сохранение изменений задачи
function saveTask() {
    const taskId = parseInt(document.getElementById('task-id').value);
    const title = document.getElementById('task-title-edit').value.trim();
    const duration = parseInt(document.getElementById('task-duration-edit').value) || 1;
    const startDate = document.getElementById('task-start-date-edit').value;
    const endDate = document.getElementById('task-end-date-edit').value;
    const startAfter = document.getElementById('task-start-after-edit').value;
    const finishBefore = document.getElementById('task-finish-before-edit').value;
    const epic = document.getElementById('task-epic-edit').value;
    const priority = parseInt(document.getElementById('task-priority-edit').value) || 5;
    const comments = document.getElementById('task-comments-edit').value;
    
    // Получение выбранных исполнителей
    const executorSelect = document.getElementById('task-executor-edit');
    const selectedExecutors = Array.from(executorSelect.selectedOptions).map(opt => parseInt(opt.value));
    
    // Получение зависимостей
    const dependencySelect = document.getElementById('task-dependency-edit');
    const dependencies = Array.from(dependencySelect.selectedOptions).map(opt => parseInt(opt.value));
    
    if (!title) {
        alert('Введите название задачи');
        return;
    }
    
    // Находим задачу и обновляем её
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex] = {
            ...tasks[taskIndex],
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
            comments: comments
        };
    }
    
    // Скрываем форму редактирования
    cancelEdit();
    
    // Обновляем интерфейс
    updateTaskDependencySelect();
    renderTasksTable();
}

// Отмена редактирования
function cancelEdit() {
    document.getElementById('edit-form-section').style.display = 'none';
    document.getElementById('add-form-section').style.display = 'block';
    
    // Сбрасываем форму редактирования
    document.getElementById('task-id').value = '';
    document.getElementById('task-title-edit').value = '';
    document.getElementById('task-duration-edit').value = '1';
    document.getElementById('task-start-date-edit').value = '';
    document.getElementById('task-end-date-edit').value = '';
    document.getElementById('task-start-after-edit').value = '';
    document.getElementById('task-finish-before-edit').value = '';
    document.getElementById('task-epic-edit').value = '';
    document.getElementById('task-priority-edit').value = '5';
    document.getElementById('task-comments-edit').value = '';
    
    // Сбрасываем выборы
    document.querySelectorAll('#task-executor-edit option, #task-dependency-edit option').forEach(opt => opt.selected = false);
}

// Расчет графика с учетом занятости исполнителей
function calculateSchedule() {
    // Сортируем задачи по зависимостям (топологическая сортировка)
    // ВАЖНО: задачи должны обрабатываться в порядке выполнения, а не в обратном
    let sortedTasks = [...tasks];
    let visited = new Set();
    let temp = new Set();
    let order = [];

    // Функция для обхода зависимостей (DFS)
    function visit(taskId) {
        if (visited.has(taskId)) return true;
        if (temp.has(taskId)) {
            alert('Обнаружен цикл в зависимостях задач! Проверьте связи между задачами.');
            return false; // Цикл обнаружен
        }
        
        temp.add(taskId);
        
        const task = sortedTasks.find(t => t.id === taskId);
        if (task && task.dependencies) {
            for (let depId of task.dependencies) {
                if (!visit(depId)) return false;
            }
        }
        
        temp.delete(taskId);
        visited.add(taskId);
        order.push(taskId); // Добавляем задачу в порядок выполнения
        return true;
    }

    // Обходим все задачи
    for (let task of sortedTasks) {
        if (!visited.has(task.id)) {
            if (!visit(task.id)) {
                return; // Цикл обнаружен, выходим
            }
        }
    }

    // Инициализируем расписания исполнителей
    const executorSchedules = {};
    executors.forEach(executor => {
        executorSchedules[executor.id] = [];
    });

    // Рассчитываем даты для каждой задачи в правильном порядке
    for (let taskId of order) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) continue;

        let startDate = null;
        let endDate = null;

        // Определяем минимальную возможную дату начала
        let maxEndDate = null;
        
        // Минимальная дата - после всех зависимостей
        if (task.dependencies && task.dependencies.length > 0) {
            for (let depId of task.dependencies) {
                const depTask = tasks.find(t => t.id === depId);
                // Используем рассчитанную дату окончания, если она есть
                const depEnd = depTask.calculatedEnd ? new Date(depTask.calculatedEnd) : 
                              depTask.endDate ? new Date(depTask.endDate) : null;
                
                if (depEnd && (!maxEndDate || depEnd > maxEndDate)) {
                    maxEndDate = depEnd;
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

        // Учитываем занятость исполнителей
        let maxExecutorEndDate = maxEndDate ? new Date(maxEndDate) : new Date();
        
        if (task.executors && task.executors.length > 0) {
            for (let execId of task.executors) {
                const schedule = executorSchedules[execId] || [];
                
                // Находим ближайшую свободную дату для этого исполнителя
                let execStartDate = new Date(maxExecutorEndDate);
                
                // Проверяем занятость исполнителя
                for (let scheduledTask of schedule) {
                    const taskEnd = new Date(scheduledTask.end);
                    
                    // Если задача пересекается с уже запланированной
                    if (execStartDate < taskEnd) {
                        execStartDate = new Date(taskEnd);
                        execStartDate.setDate(execStartDate.getDate() + 1); // Следующий день
                    }
                }
                
                // Обновляем общую дату начала (берем максимальную из всех исполнителей)
                if (execStartDate > maxExecutorEndDate) {
                    maxExecutorEndDate = execStartDate;
                }
            }
        }

        startDate = maxExecutorEndDate;
        
        // Рассчитываем конечную дату (с учетом эффективности исполнителей)
        const workDays = calculateAdjustedDuration(task);
        endDate = addWorkDays(new Date(startDate), workDays);

        // Если есть ограничение "закончить не позже"
        if (task.finishBefore) {
            const finishBeforeDate = new Date(task.finishBefore);
            if (endDate > finishBeforeDate) {
                alert(`Предупреждение: задача "${task.title}" выходит за дедлайн ${finishBeforeDate.toLocaleDateString()}`);
            }
        }

        // Сохраняем рассчитанные даты
        task.calculatedStart = startDate.toISOString().split('T')[0];
        task.calculatedEnd = endDate.toISOString().split('T')[0];

        // Добавляем задачу в расписания исполнителей
        if (task.executors && task.executors.length > 0) {
            for (let execId of task.executors) {
                executorSchedules[execId].push({
                    taskId: task.id,
                    start: task.calculatedStart,
                    end: task.calculatedEnd,
                    title: task.title,
                    priority: task.priority
                });
            }
        }
    }

    renderTasksTable();
    renderScheduleChart(executorSchedules);
}

// Рассчитывает длительность с учетом эффективности исполнителей
function calculateAdjustedDuration(task) {
    // Базовая длительность
    let baseDays = task.duration;
    
    // Считаем среднюю эффективность исполнителей
    if (task.executors && task.executors.length > 0) {
        let totalEfficiency = 0;
        task.executors.forEach(execId => {
            const executor = executors.find(e => e.id === execId);
            if (executor) {
                totalEfficiency += executor.efficiency;
            }
        });
        
        const avgEfficiency = totalEfficiency / task.executors.length;
        
        // Корректируем длительность (чем выше эффективность, тем меньше дней нужно)
        baseDays = Math.ceil(baseDays / avgEfficiency);
    }
    
    return baseDays;
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
    // Обновляем направление сортировки
    if (currentSort.column === column) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.column = column;
        currentSort.direction = 'asc';
    }
    
    // Обновляем индикаторы сортировки
    document.querySelectorAll('.sort-indicator').forEach(indicator => {
        indicator.classList.remove('active', 'asc', 'desc');
    });
    
    const indicator = document.getElementById(`${column}-sort`);
    indicator.classList.add('active', currentSort.direction);
    
    // Перерисовываем таблицу с учетом сортировки
    renderTasksTable();
}

// Фильтрация задач
function applyFilters() {
    // Обновляем текущие значения фильтров
    currentFilters.executor = document.getElementById('filter-executor').value;
    currentFilters.epic = document.getElementById('filter-epic').value;
    currentFilters.priority = document.getElementById('filter-priority').value;
    currentFilters.searchTitle = document.getElementById('search-title').value.toLowerCase();
    
    // Перерисовываем таблицу с учетом фильтров
    renderTasksTable();
}

// Сброс фильтров
function clearFilters() {
    document.getElementById('filter-executor').value = '';
    document.getElementById('filter-epic').value = '';
    document.getElementById('filter-priority').value = '';
    document.getElementById('search-title').value = '';
    
    currentFilters = {
        executor: '',
        epic: '',
        priority: '',
        searchTitle: ''
    };
    
    renderTasksTable();
}

// Отображение задач в таблице (с сортировкой и фильтрацией)
function renderTasksTable() {
    // Фильтруем задачи
    let filteredTasks = tasks.filter(task => {
        // Фильтр по исполнителю
        if (currentFilters.executor && !task.executors.includes(parseInt(currentFilters.executor))) {
            return false;
        }
        
        // Фильтр по эпику
        if (currentFilters.epic && task.epic !== currentFilters.epic) {
            return false;
        }
        
        // Фильтр по приоритету
        if (currentFilters.priority) {
            if (currentFilters.priority === 'high' && task.priority < 7) return false;
            if (currentFilters.priority === 'medium' && (task.priority < 4 || task.priority > 6)) return false;
            if (currentFilters.priority === 'low' && task.priority > 3) return false;
        }
        
        // Поиск по названию
        if (currentFilters.searchTitle && !task.title.toLowerCase().includes(currentFilters.searchTitle)) {
            return false;
        }
        
        return true;
    });

    // Сортируем задачи
    if (currentSort.column) {
        filteredTasks.sort((a, b) => {
            let aValue = getSortValue(a, currentSort.column);
            let bValue = getSortValue(b, currentSort.column);
            
            // Преобразуем в строки для сравнения
            if (typeof aValue === 'string') aValue = aValue.toLowerCase();
            if (typeof bValue === 'string') bValue = bValue.toLowerCase();
            
            let comparison = 0;
            if (aValue > bValue) comparison = 1;
            else if (aValue < bValue) comparison = -1;
            
            return currentSort.direction === 'asc' ? comparison : -comparison;
        });
    }

    // Отображаем задачи
    const tbody = document.getElementById('tasks-tbody');
    tbody.innerHTML = '';

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
                <button onclick="editTask(${task.id})" class="action-btn edit-btn">✏️</button>
                <button onclick="deleteTask(${task.id})" class="action-btn delete-btn">🗑️</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });

    // Обновляем счетчик результатов
    const resultsCount = document.getElementById('results-count');
    resultsCount.textContent = `Показано ${filteredTasks.length} из ${tasks.length} задач`;
}

// Получение значения для сортировки
function getSortValue(task, column) {
    switch(column) {
        case 'title':
            return task.title || '';
        case 'duration':
            return task.duration || 0;
        case 'startDate':
            return task.calculatedStart || task.startDate || '';
        case 'endDate':
            return task.calculatedEnd || task.endDate || '';
        case 'executors':
            return task.executors.map(id => {
                const exec = executors.find(e => e.id === id);
                return exec ? exec.name : '';
            }).join(', ');
        case 'epic':
            return task.epic || '';
        case 'priority':
            return task.priority || 0;
        default:
            return '';
    }
}

// Отображение графика занятости
function renderScheduleChart(executorSchedules) {
    const chartDiv = document.getElementById('schedule-chart');
    chartDiv.innerHTML = '';

    executors.forEach(executor => {
        const schedule = executorSchedules[executor.id] || [];
        
        const executorDiv = document.createElement('div');
        executorDiv.className = 'executor-schedule';
        
        const header = document.createElement('div');
        header.className = 'executor-name';
        header.textContent = `${executor.name} (${executor.efficiency})`;
        executorDiv.appendChild(header);

        // Сортируем задачи по дате начала
        schedule.sort((a, b) => new Date(a.start) - new Date(b.start));

        schedule.forEach(task => {
            const taskBar = document.createElement('div');
            taskBar.className = `task-bar ${getPriorityClass(task.priority)}`;
            
            // Рассчитываем ширину бара в зависимости от длительности
            const startDate = new Date(task.start);
            const endDate = new Date(task.end);
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            
            // Ширина пропорциональна длительности (условно)
            taskBar.style.width = `${diffDays * 20}px`;
            
            const taskInfo = document.createElement('div');
            taskInfo.className = 'task-info';
            taskInfo.textContent = `${task.title} (${task.start} - ${task.end})`;
            
            taskBar.appendChild(taskInfo);
            executorDiv.appendChild(taskBar);
        });

        chartDiv.appendChild(executorDiv);
    });
}

// Получение класса приоритета для стиля
function getPriorityClass(priority) {
    if (priority >= 7) return 'high-priority';
    if (priority >= 4) return 'medium-priority';
    return 'low-priority';
}

// Удаление задачи
function deleteTask(id) {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
        tasks = tasks.filter(task => task.id !== id);
        updateTaskDependencySelect();
        renderTasksTable();
    }
}

// Сохранение в XML
function saveToXML() {
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
    a.download = 'waterfall-project-v5.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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

// Загрузка из XML
function loadFromXML(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
            
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
            updateExecutorsList();
            updateTaskExecutorSelect();
            updateFilterExecutors();
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
            alert('Ошибка при загрузке файла XML');
        }
    };
    reader.readAsText(file);
}