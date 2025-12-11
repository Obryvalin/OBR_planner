// Глобальные переменные
let executors = [];
let tasks = [];
let taskIdCounter = 1;

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    updateExecutorsList();
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

// Удаление исполнителя
function removeExecutor(id) {
    executors = executors.filter(e => e.id !== id);
    updateExecutorsList();
    updateTaskExecutorSelect();
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
    select.innerHTML = '<option value="">-- Нет зависимости --</option>';
    
    tasks.forEach(task => {
        const option = document.createElement('option');
        option.value = task.id;
        option.textContent = task.title;
        select.appendChild(option);
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

// Расчет графика
function calculateSchedule() {
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
                alert(`Предупреждение: задача "${task.title}" выходит за дедлайн ${finishBeforeDate.toLocaleDateString()}`);
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
                <button onclick="deleteTask(${task.id})" class="delete-btn">Удалить</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Удаление задачи
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    updateTaskDependencySelect();
    renderTasksTable();
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
    a.download = 'waterfall-project.xml';
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