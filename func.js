const taskForm = document.getElementById('taskForm');
const taskInput = document.getElementById('taskInput');
const dueDateInput = document.getElementById('dueDateInput');
const priorityInput = document.getElementById('priorityInput');
const taskDescription = document.getElementById('taskDescription');
const taskList = document.getElementById('taskList');

const createTaskBtn = document.getElementById('createTaskBtn');
const taskFormContainer = document.getElementById('taskFormContainer');
const searchInput = document.getElementById('searchTasks');
const filterPriority = document.getElementById('filterPriority');
const filterStatus = document.getElementById('filterStatus');
const sortTasks = document.getElementById('sortTasks');

const taskViewModal = document.getElementById('taskViewModal');
const closeModalBtn = document.querySelector('.close-modal');

const completedTasksModal = document.getElementById('completedTasksModal');
const viewCompletedBtn = document.getElementById('viewCompletedBtn');
const closeCompletedModal = document.getElementById('closeCompletedModal');

const taskFormModal = document.getElementById('taskFormModal');
const closeTaskModal = document.getElementById('closeTaskModal');

const approverInput = document.getElementById('approverInput');
const approverSuggestions = document.getElementById('approverSuggestions');

const reminderSound = new Audio('sounds/notification.mp3');

const searchCompletedTasks = document.getElementById('searchCompletedTasks');
const completedTasksList = document.getElementById('completedTasksList');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const pageInfo = document.getElementById('pageInfo');

let currentPage = 1;
const tasksPerPage = 5;

let tasks = [];
let isCheckedIn = false;
let checkInTime = null;

// Sample approvers data (replace with your actual data source)
const approvers = [
    { 
        id: 1, 
        name: 'John Doe', 
        role: 'Team Lead', 
        image: 'img/profile.jpg',
        department: 'Engineering'
    },
    { 
        id: 2, 
        name: 'Jane Smith', 
        role: 'Project Manager', 
        image: 'img/profile.jpg',
        department: 'Product'
    },
    { 
        id: 3, 
        name: 'Mike Johnson', 
        role: 'Department Head', 
        image: 'img/profile.jpg',
        department: 'Operations'
    }
];

// Function to reset the form and close the modal
function resetAndCloseModal() {
    const taskForm = document.getElementById('taskForm');
    const taskFormModal = document.getElementById('taskFormModal');

    if (taskForm) {
        taskForm.reset();
    }

    if (taskFormModal) {
        taskFormModal.classList.remove('show');
    }
}

// Single initialization function
function initializeTaskForm() {
    const taskForm = document.getElementById('taskForm');
    if (!taskForm) return;

    // Remove any existing listeners
    const newTaskForm = taskForm.cloneNode(true);
    taskForm.parentNode.replaceChild(newTaskForm, taskForm);

    // Initialize approver input
    const approverInput = document.getElementById('approverInput');
    const approverSuggestions = document.getElementById('approverSuggestions');
    
    if (approverInput) {
        approverInput.addEventListener('input', handleApproverSearch);
        approverInput.addEventListener('focus', handleApproverSearch);
    }

    // Initialize reminder toggle
    const reminderToggle = document.getElementById('reminderToggle');
    const reminderSettings = document.getElementById('reminderSettings');
    
    if (reminderToggle) {
        reminderToggle.addEventListener('change', function() {
            if (this.checked) {
                reminderSettings.style.display = 'block';
            } else {
                reminderSettings.style.display = 'none';
            }
        });
    }

    // Add form submit listener
    newTaskForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const taskData = {
            text: document.getElementById('taskInput').value,
            description: document.getElementById('taskDescription').value,
            dueDate: document.getElementById('dueDateInput').value,
            priority: document.getElementById('priorityInput').value,
            approverName: document.getElementById('approverInput').value,
            reminder: {
                enabled: reminderToggle?.checked || false,
                time: document.getElementById('reminderTime')?.value || 0
            }
        };
        
        addTask(taskData);
        resetAndCloseModal(); // Reset the form and close the modal
    });

    // Add click-outside handler for approver suggestions
    document.addEventListener('click', (e) => {
        if (approverInput && approverSuggestions && 
            !approverInput.contains(e.target) && 
            !approverSuggestions.contains(e.target)) {
            approverSuggestions.style.display = 'none';
        }
    });
}

// Update DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function() {
    // Load initial tasks
    loadTasks();
    displayTasks();
    updateTaskStats();
    
    // Initialize form
    initializeTaskForm();
    
    // Other initialization code...
}, { once: true });

function addTask(taskData) {
    const newTask = {
        id: Date.now(),
        text: taskData.text,
        description: taskData.description || '',
        dueDate: taskData.dueDate,
        priority: taskData.priority,
        approverName: taskData.approverName || '-',
        status: 'todo', // Ensure the status is set to 'todo'
        completed: false,
        startTime: null,
        completedAt: null,
        reminder: taskData.reminder || null // Include reminder data
    };
    
    tasks.unshift(newTask); // Add the new task at the beginning of the array
    saveTasks();
    displayTasks();
    updateTaskStats();
    showNotification('Task added successfully!', 'success');
}

function updateTaskStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    
    // Add null checks for the stat elements
    const totalElement = document.querySelector('.stat-total');
    const pendingElement = document.querySelector('.stat-pending');
    const completedElement = document.querySelector('.stat-completed');
    
    if (totalElement) totalElement.textContent = totalTasks;
    if (pendingElement) totalElement.textContent = pendingTasks;
    if (completedElement) totalElement.textContent = completedTasks;
}

// Function to display tasks
function displayTasks(filteredTasks = tasks) {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    // Filter out completed tasks
    const tasksToDisplay = filteredTasks.filter(task => task.status !== 'completed');

    taskList.innerHTML = `
        <table class="task-table">
            <thead>
                <tr>
                    <th>Task</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Approver</th>
                    <th>Status</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${tasksToDisplay.length ? '' : `
                    <tr>
                        <td colspan="6" class="empty-state">
                            <i class="fas fa-tasks"></i>
                            <p>No tasks found</p>
                        </td>
                    </tr>
                `}
                ${tasksToDisplay.map(task => `
                    <tr>
                        <td data-label="Task Title">${escapeHtml(task.text)}</td>
                        <td data-label="Due Date">${formatDate(task.dueDate)}</td>
                        <td data-label="Priority">
                            <span class="priority-badge ${task.priority.toLowerCase()}">${escapeHtml(task.priority)}</span>
                        </td>
                        <td data-label="Approver">${escapeHtml(task.approverName || '-')}</td>
                        <td data-label="Status">
                            <span class="status-badge ${task.status.toLowerCase().replace(' ', '-')}">
                                <i class="fas ${getStatusIcon(task.status)}"></i>
                                ${getStatusLabel(task.status)}
                            </span>
                        </td>
                        <td data-label="Actions">
                            <div class="task-actions">
                                <button onclick="viewTask(${task.id})" class="action-btn view-btn" title="View">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button onclick="editTask(${task.id})" class="action-btn edit-btn" title="Edit">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button onclick="deleteTask(${task.id})" class="action-btn delete-btn" title="Delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                                ${task.status === 'todo' ? `
                                    <button onclick="startTask(${task.id})" class="action-btn " id="start-btn" title="Start Task">
                                        <i class="fas fa-play"></i> Start
                                    </button>
                                ` : ''}
                                ${task.status === 'in progress' ? `
                                    <button onclick="completeTask(${task.id})" class="action-btn " id="complete-btn" title="Complete Task">
                                        <i class="fas fa-check"></i> Done
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Add event listeners after rendering
    tasks.forEach(task => {
        const startBtn = document.querySelector(`button[onclick="startTask(${task.id})"]`);
        const completeBtn = document.querySelector(`button[onclick="completeTask(${task.id})"]`);
        
        if (startBtn) {
            startBtn.disabled = task.status === 'in progress' || task.status === 'completed';
        }
        
        if (completeBtn) {
            completeBtn.disabled = task.status !== 'in progress';
        }
    });
}

// Function to display completed tasks in the modal
function displayCompletedTasks(tasks) {
    const startIndex = (currentPage - 1) * tasksPerPage;
    const endIndex = startIndex + tasksPerPage;
    const paginatedTasks = tasks.slice(startIndex, endIndex);

    completedTasksList.innerHTML = paginatedTasks.map(task => `
        <tr>
            <td>${task.text}</td>
            <td>${task.dueDate}</td>
            <td>${task.priority}</td>
            <td>${task.completedAt}</td>
            <td>
                <button class="action-btn view-btn" onclick="viewTask(${task.id})">
                    <i class="fas fa-eye"></i> View
                </button>
            </td>
        </tr>
    `).join('');

    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(tasks.length / tasksPerPage)}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === Math.ceil(tasks.length / tasksPerPage);
}

// Event listeners for the view completed tasks button
document.addEventListener('DOMContentLoaded', function() {
    const viewCompletedBtn = document.getElementById('viewCompletedBtn');
    const completedTasksModal = document.getElementById('completedTasksModal');
    const closeCompletedModal = document.getElementById('closeCompletedModal');

    if (viewCompletedBtn) {
        viewCompletedBtn.addEventListener('click', function() {
            const completedTasks = tasks.filter(task => task.status === 'completed');
            displayCompletedTasks(completedTasks);
            completedTasksModal.classList.add('show');
        });
    }

    if (closeCompletedModal) {
        closeCompletedModal.addEventListener('click', function() {
            completedTasksModal.classList.remove('show');
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target === completedTasksModal) {
            completedTasksModal.classList.remove('show');
        }
    });

    const searchCompletedTasks = document.getElementById('searchCompletedTasks');
    const completedTasksList = document.getElementById('completedTasksList');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    let currentPage = 1;
    const tasksPerPage = 5;

    searchCompletedTasks.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const filteredTasks = tasks.filter(task => task.text.toLowerCase().includes(searchTerm) && task.status === 'completed');
        displayCompletedTasks(filteredTasks);
    });

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            const completedTasks = tasks.filter(task => task.status === 'completed');
            displayCompletedTasks(completedTasks);
        }
    });

    nextPageBtn.addEventListener('click', function() {
        if (currentPage < Math.ceil(tasks.length / tasksPerPage)) {
            currentPage++;
            const completedTasks = tasks.filter(task => task.status === 'completed');
            displayCompletedTasks(completedTasks);
        }
    });

    // Initial display
    const completedTasks = tasks.filter(task => task.status === 'completed');
    displayCompletedTasks(completedTasks);
});

function handleEditTask(task) {
    taskInput.value = task.text;
    taskDescription.value = task.description;
    dueDateInput.value = task.dueDate;
    priorityInput.value = task.priority;
    
    // Store task ID for update
    taskForm.dataset.editId = task.id;
    
    showTaskForm();
}

function handleDeleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        displayTasks();
        updateTaskStats();
        showNotification('Task deleted successfully!', 'success');
    }
}

function handleCompleteTask(taskId, completed) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = completed;
        task.status = completed ? 'completed' : 'todo';
        task.completedAt = completed ? new Date().toISOString() : null;
        saveTasks();
        displayTasks();
        updateTaskStats();
    }
}

function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const filteredTasks = tasks.filter(task => 
        task.text.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm)
    );
    renderFilteredTasks(filteredTasks);
}

function handleFilters() {
    const priority = filterPriority.value;
    const status = filterStatus.value;
    
    const filteredTasks = tasks.filter(task => {
        const priorityMatch = priority === 'all' || task.priority === priority;
        const statusMatch = status === 'all' || 
            (status === 'completed' && task.completed) ||
            (status === 'pending' && !task.completed);
        return priorityMatch && statusMatch;
    });
    
    renderFilteredTasks(filteredTasks);
}

function handleSort(e) {
    const sortBy = e.target.value;
    const sortedTasks = [...tasks].sort((a, b) => {
        switch(sortBy) {
            case 'dueDate':
                return new Date(a.dueDate) - new Date(b.dueDate);
            case 'priority':
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            case 'status':
                return a.status.localeCompare(b.status);
            default:
                return 0;
        }
    });
    
    renderFilteredTasks(sortedTasks);
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.id);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

document.querySelectorAll('.task-list').forEach(column => {
    column.addEventListener('dragover', e => {
        e.preventDefault();
        const draggable = document.querySelector('.dragging');
        if (draggable) {
            column.appendChild(draggable);
        }
    });
    
    column.addEventListener('drop', e => {
        e.preventDefault();
        const taskId = parseInt(e.dataTransfer.getData('text/plain'));
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.status = column.id.replace('List', '');
            saveTasks();
            displayTasks();
        }
    });
});

function renderFilteredTasks(filteredTasks) {
    taskList.innerHTML = '';
    filteredTasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.classList.add('task-item');
        taskItem.innerHTML = `
            <div class="task-content">
                <h4>${task.text}</h4>
                <div class="task-details">
                    <span class="task-date"><i class="far fa-calendar-alt"></i> ${task.dueDate}</span>
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                </div>
            </div>
            <div class="task-actions">
                <button class="edit-btn"><i class="fas fa-edit"></i></button>
                <button class="delete-btn"><i class="fas fa-trash"></i></button>
                <input type="checkbox" class="complete-btn" title="Mark as complete" ${task.completed ? 'checked' : ''}>
            </div>
        `;
        taskList.appendChild(taskItem);

        taskItem.querySelector('.delete-btn').addEventListener('click', function() {
            taskList.removeChild(taskItem);
            tasks = tasks.filter(t => t.text !== task.text);
            saveTasks();
        });

        taskItem.querySelector('.edit-btn').addEventListener('click', function() {
            taskInput.value = task.text;
            dueDateInput.value = task.dueDate;
            priorityInput.value = task.priority;
            taskList.removeChild(taskItem);
            tasks = tasks.filter(t => t.text !== task.text);
            saveTasks();
        });

        taskItem.querySelector('.complete-btn').addEventListener('change', function() {
            taskItem.classList.toggle('completed', this.checked);
            tasks.find(t => t.text === task.text).completed = this.checked;
            saveTasks();
        });
    });
}

function saveTasks() {
    try {
        const tasksToSave = tasks.map(task => ({
            ...task,
            status: task.status || 'todo',
            reminder: task.reminder || null // Ensure reminder data is included
        }));
        localStorage.setItem('tasks', JSON.stringify(tasksToSave));
        console.log('Saved tasks:', tasksToSave);
    } catch (error) {
        console.error('Error saving tasks:', error);
    }
}

function updateEmptyState(listElement) {
    if (listElement.children.length === 0) {
        listElement.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard"></i>
                <p>No tasks here yet</p>
            </div>
        `;
    }
}

function showNotification(message, type = 'success') {
    // Remove existing notification if any
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add icon based on type
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span class="notification-message">${message}</span>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Remove after delay
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function hideAllPages() {
    const sections = document.querySelectorAll('.content');
    sections.forEach(section => {
        section.style.display = 'none';
    });
}

function showSection(sectionId) {
    hideAllPages();
    const section = document.getElementById(sectionId);
    if (section) {
        section.style.display = 'block';
    }
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function() {
        document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
        this.classList.add('active');
        const targetSection = this.getAttribute('href').substring(1);
        showSection(targetSection);
    });
});

showSection('welcome');

function showTaskDetails(task) {
    const modal = document.getElementById('taskViewModal');
    if (!modal) return;

    // Populate the modal with task details
    modal.querySelector('.task-title').textContent = task.text;
    modal.querySelector('.task-description').textContent = task.description;
    modal.querySelector('.task-due-date').textContent = formatDate(task.dueDate);
    modal.querySelector('.task-priority').textContent = task.priority;
    modal.querySelector('.task-approver').textContent = task.approverName || '-';
    modal.querySelector('.task-status').textContent = task.status;
    
    // Populate reminder data
    const reminderElement = modal.querySelector('.task-reminder');
    if (task.reminder) {
        reminderElement.textContent = `Reminder set for ${formatDate(task.reminder)}`;
    } else {
        reminderElement.textContent = 'No reminder set';
    }

    // Show the modal
    modal.style.display = 'block';
}

// Helper function to format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// Add event listeners for closing the modal
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('taskViewModal').classList.remove('show');
});

// Close modal when clicking outside
document.getElementById('taskViewModal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('taskViewModal')) {
        e.target.classList.remove('show');
    }
});

// Add this helper function if not already present
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/<//g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Attendance functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const attendanceModal = document.getElementById('attendanceModal');
    const attendanceBtn = document.getElementById('attendanceBtn');
    const closeAttendanceBtn = document.getElementById('closeAttendanceModal');
    const checkInBtn = document.getElementById('checkInBtn');
    const checkOutBtn = document.getElementById('checkOutBtn');
    const currentDateEl = document.getElementById('currentDate');
    const currentTimeEl = document.getElementById('currentTime');
    const checkInTimeEl = document.getElementById('checkInTime');
    const checkOutTimeEl = document.getElementById('checkOutTime');
    const workingHoursEl = document.getElementById('workingHours');

    // Initialize state from localStorage
    let isCheckedIn = localStorage.getItem('isCheckedIn') === 'true';
    let checkInTime = localStorage.getItem('checkInTime');

    // Format time function
    function formatTime(date) {
        if (!date) return 'Not recorded';
        const dateObj = new Date(date);
        return dateObj.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // Update current date and time
    function updateDateTime() {
        const now = new Date();
        currentDateEl.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        currentTimeEl.textContent = formatTime(now);
    }

    // Save attendance data to localStorage
    function saveAttendanceData() {
        localStorage.setItem('isCheckedIn', isCheckedIn);
        localStorage.setItem('checkInTime', checkInTime);
    }

    // Update attendance UI
    function updateAttendanceUI() {
        console.log('Updating UI - isCheckedIn:', isCheckedIn, 'checkInTime:', checkInTime); // Debug log

        if (isCheckedIn && checkInTime) {
            checkInBtn.disabled = true;
            checkOutBtn.disabled = false;
            checkInTimeEl.textContent = formatTime(checkInTime);
            checkOutTimeEl.textContent = 'Not clocked out';
            workingHoursEl.textContent = 'In progress';
        } else {
            checkInBtn.disabled = false;
            checkOutBtn.disabled = true;
            checkInTimeEl.textContent = checkInTime ? formatTime(checkInTime) : 'Not clocked in';
            checkOutTimeEl.textContent = 'Not clocked out';
            workingHoursEl.textContent = '-';
        }
    }

    // Event Listeners
    attendanceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        attendanceModal.classList.add('show');
        updateDateTime();
        updateAttendanceUI();
    });

    closeAttendanceBtn.addEventListener('click', () => {
        attendanceModal.classList.remove('show');
    });

    checkInBtn.addEventListener('click', () => {
        console.log('Clock In clicked'); // Debug log
        isCheckedIn = true;
        checkInTime = new Date().toISOString();
        saveAttendanceData();
        updateAttendanceUI();
        showNotification('Successfully clocked in!', 'success');
    });

    checkOutBtn.addEventListener('click', () => {
        if (!isCheckedIn) return;
        
        const checkOutTime = new Date();
        const checkInDate = new Date(checkInTime);
        
        // Format date to show day and month as words
        const formattedDate = checkOutTime.toLocaleDateString('en-US', {
            weekday: 'long', // Add day of week
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Calculate time difference
        const timeDiff = checkOutTime - checkInDate;
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const hoursWorked = `${hours}:${formattedMinutes}`;
        
        // Save attendance record with formatted date
        const attendanceRecord = {
            date: formattedDate, // Now shows as "Monday, January 1, 2024"
            checkIn: formatTime(checkInTime),
            checkOut: formatTime(checkOutTime),
            hoursWorked: hoursWorked
        };

        // Get existing records or initialize empty array
        const attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory') || '[]');
        attendanceHistory.push(attendanceRecord);
        localStorage.setItem('attendanceHistory', JSON.stringify(attendanceHistory));

        // Update display
        checkOutTimeEl.textContent = formatTime(checkOutTime);
        workingHoursEl.textContent = hoursWorked;
        
        // Reset state
        isCheckedIn = false;
        checkInTime = null;
        saveAttendanceData();
        updateAttendanceUI();
        
        // Update attendance history display
        displayAttendanceHistory();
        showNotification('Successfully clocked out!', 'success');
    });

    // Display attendance history
    function displayAttendanceHistory() {
        const historyList = document.getElementById('attendanceHistory');
        if (!historyList) return;

        const attendanceHistory = JSON.parse(localStorage.getItem('attendanceHistory') || '[]');
        
        // Create table structure
        historyList.innerHTML = `
            <table class="attendance-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Clock In</th>
                        <th>Clock Out</th>
                        <th>Hours Worked</th>
                    </tr>
                </thead>
                <tbody>
                    ${attendanceHistory.length ? '' : `
                        <tr>
                            <td colspan="4" class="empty-state">No attendance records found.</td>
                        </tr>
                    `}
                    ${attendanceHistory.reverse().map(record => `
                        <tr>
                            <td>${record.date}</td>
                            <td>${record.checkIn}</td>
                            <td>${record.checkOut}</td>
                            <td>${record.hoursWorked}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // Start the clock update interval
    setInterval(updateDateTime, 1000);

    // Initial updates
    updateDateTime();
    updateAttendanceUI();
    displayAttendanceHistory();

    // Modal click handler
    function handleModalClick(event) {
        if (event.target === attendanceModal) {
            attendanceModal.classList.remove('show');
        }
    }

    // Add event listeners for modal
    attendanceModal.addEventListener('click', handleModalClick);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && attendanceModal.classList.contains('show')) {
            attendanceModal.classList.remove('show');
        }
    });
});

// Modal event listeners
viewCompletedBtn.addEventListener('click', () => {
    // Filter and display only completed tasks
    const completedTasks = tasks.filter(task => task.status === 'completed');
    displayTasks(completedTasks);
    
    // Update button text and icon to show all tasks
    viewCompletedBtn.innerHTML = '<i class="fas fa-tasks"></i> View All Tasks';
    
    // Toggle button functionality
    viewCompletedBtn.onclick = () => {
        displayTasks(); // Show all tasks
        viewCompletedBtn.innerHTML = '<i class="fas fa-check-circle"></i> View Completed Tasks';
        viewCompletedBtn.onclick = () => location.reload(); // Reset to original state
    };
});

closeCompletedModal.addEventListener('click', () => {
    completedTasksModal.classList.remove('show');
});

// Close modal when clicking outside
completedTasksModal.addEventListener('click', (event) => {
    if (event.target === completedTasksModal) {
        completedTasksModal.classList.remove('show');
    }
});

// Add these functions to handle the button clicks
function viewTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        // Update modal content with all available task data
        document.getElementById('viewTaskTitle').textContent = escapeHtml(task.text);
        document.getElementById('viewTaskDescription').textContent = escapeHtml(task.description || 'No description provided');
        document.getElementById('viewTaskDueDate').textContent = formatDate(task.dueDate);
        document.getElementById('viewTaskPriority').textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        document.getElementById('viewTaskStatus').textContent = task.status.charAt(0).toUpperCase() + task.status.slice(1);
        document.getElementById('viewTaskApprover').textContent = escapeHtml(task.approverName || 'Not assigned');
        document.getElementById('viewTaskCreatedDate').textContent = formatDate(task.createdAt || new Date());
        
        // Format reminder display
        const reminderText = formatReminderText(task.reminder);
        document.getElementById('viewTaskReminder').textContent = reminderText;
        
        // Update completion status
        const completionStatus = document.getElementById('viewTaskCompletion');
        if (completionStatus) {
            completionStatus.innerHTML = task.completed ? 
                '<span class="status-badge completed"><i class="fas fa-check"></i> Completed</span>' : 
                '<span class="status-badge todo"><i class="fas fa-clock"></i> Pending</span>';
        }
        
        // Show modal
        const taskViewModal = document.getElementById('taskViewModal');
        taskViewModal.classList.add('show');
    }
}

// Helper function to format reminder text
function formatReminderText(reminder) {
    if (!reminder || !reminder.enabled) {
        return 'No reminder set';
    }

    switch (reminder.time) {
        case '0':
            return 'At due time';
        case '15':
            return '15 minutes before due';
        case '30':
            return '30 minutes before due';
        case '60':
            return '1 hour before due';
        case '120':
            return '2 hours before due';
        case '1440':
            return '1 day before due';
        default:
            return `${reminder.time} minutes before due`;
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        // Fill form with task data
        taskInput.value = task.text;
        taskDescription.value = task.description || '';
        dueDateInput.value = task.dueDate;
        priorityInput.value = task.priority;
        
        // Store task ID for update
        taskForm.dataset.editId = taskId;
        
        // Show form
        taskFormContainer.style.display = 'block';
        createTaskBtn.style.display = 'none';
    }
}

function deleteTask(taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        displayTasks();
        updateTaskStats();
        showNotification('Task deleted successfully!', 'success');
    }
}

function toggleComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        task.status = task.completed ? 'completed' : 'todo';
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveTasks();
        displayTasks();
        updateTaskStats();
        showNotification(`Task marked as ${task.completed ? 'completed' : 'incomplete'}`, 'success');
    }
}

// Remove any duplicate event listeners or render calls

// Add this to your existing JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Handle dropdown toggle
    const dropdownToggle = document.querySelector('.dropdown-toggle');
    const navDropdown = document.querySelector('.nav-dropdown');
    
    dropdownToggle.addEventListener('click', function(e) {
        e.preventDefault();
        navDropdown.classList.toggle('active');
    });

    // Handle dropdown item clicks
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Remove active class from all items
            dropdownItems.forEach(i => i.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // Update content based on selection
            const target = this.getAttribute('href').substring(1);
            updateOperationContent(target);
        });
    });
});

function updateOperationContent(target) {
    // Hide all operation content sections
    document.querySelectorAll('.operation-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show selected section
    const selectedSection = document.getElementById(`${target}Section`);
    if (selectedSection) {
        selectedSection.style.display = 'block';
    }
}

// Function to load tasks from localStorage
function loadTasks() {
    try {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks).map(task => ({
                ...task,
                status: task.status || 'todo',
                completed: Boolean(task.completed),
                startTime: task.startTime || null,
                completedAt: task.completedAt || null
            }));
        }
        console.log('Loaded tasks:', tasks);
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasks = [];
    }
}

// Add this to your existing document.addEventListener('DOMContentLoaded', function() { ... })
document.addEventListener('DOMContentLoaded', function() {
    // Get all nav links that are not in the operation submenu
    const navLinks = document.querySelectorAll('.nav-link:not(.sub-link)');
    const operationSubmenu = document.getElementById('operationSubmenu');
    const dropdownToggle = document.querySelector('.dropdown-toggle');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Skip if this is the operation dropdown toggle itself
            if (this.classList.contains('dropdown-toggle')) {
                return;
            }

            // Collapse the operation submenu
            if (operationSubmenu) {
                operationSubmenu.classList.remove('show');
                dropdownToggle.setAttribute('aria-expanded', 'false');
            }
        });
    });
});

// Add event listeners for approver input
approverInput.addEventListener('input', handleApproverSearch);
approverInput.addEventListener('focus', handleApproverSearch);
document.addEventListener('click', (e) => {
    if (!approverInput.contains(e.target) && !approverSuggestions.contains(e.target)) {
        approverSuggestions.style.display = 'none';
    }
});

function handleApproverSearch() {
    const searchTerm = this.value.toLowerCase();
    let filteredApprovers;
    
    if (searchTerm === '') {
        // Show all approvers when input is empty
        filteredApprovers = approvers;
    } else {
        // Filter by name, role, or department
        filteredApprovers = approvers.filter(approver => 
            approver.name.toLowerCase().includes(searchTerm) ||
            approver.role?.toLowerCase().includes(searchTerm) ||
            approver.department?.toLowerCase().includes(searchTerm)
        );
    }
    
    displayApproverSuggestions(filteredApprovers);
}

function displayApproverSuggestions(filteredApprovers) {
    const approverSuggestions = document.getElementById('approverSuggestions');
    if (!approverSuggestions) return;

    if (filteredApprovers.length === 0) {
        approverSuggestions.innerHTML = `
            <div class="suggestion-empty">
                <i class="fas fa-user-slash"></i>
                <p>No approvers found</p>
            </div>
        `;
        approverSuggestions.style.display = 'block';
        return;
    }

    approverSuggestions.innerHTML = `
        <div class="suggestion-header">
            <small>Select an approver</small>
        </div>
        ${filteredApprovers.map(approver => `
            <div class="suggestion-item" data-approver-id="${approver.id}">
                <div class="suggestion-item-content">
                    <img src="${approver.image || ''}" alt="${approver.name}" class="approver-avatar">
                    <div class="approver-info">
                        <div class="approver-name">${approver.name}</div>
                        <div class="approver-details">
                            <span class="approver-role">${approver.role || ''}</span>
                            <span class="approver-department">${approver.department || ''}</span>
                        </div>
                    </div>
                </div>
                <div class="suggestion-select">
                    <i class="fas fa-check"></i>
                </div>
            </div>
        `).join('')}
    `;

    approverSuggestions.style.display = 'block';

    // Add click handlers for suggestions
    const suggestionItems = approverSuggestions.querySelectorAll('.suggestion-item');
    suggestionItems.forEach(item => {
        item.addEventListener('click', () => selectApprover(item));
    });
}

function selectApprover(item) {
    const approverInput = document.getElementById('approverInput');
    const approverSuggestions = document.getElementById('approverSuggestions');
    const approverId = item.dataset.approverId;
    const approver = approvers.find(a => a.id === parseInt(approverId));
    
    if (approverInput && approver) {
        // Update input with selected approver
        approverInput.value = approver.name;
        approverInput.dataset.approverId = approverId;
        
        // Hide suggestions
        if (approverSuggestions) {
            approverSuggestions.style.display = 'none';
        }
    }
}

// Add these event listeners
approverInput.addEventListener('focus', () => {
    if (approverInput.value === '') {
        handleApproverSearch();
    }
});

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!approverInput.contains(e.target) && 
        !approverSuggestions.contains(e.target)) {
        approverSuggestions.style.display = 'none';
    }
});

function scheduleReminder(task) {
    const dueDate = new Date(task.dueDate);
    const reminderTime = task.reminder.time;
    
    // Calculate reminder time
    const reminderDate = new Date(dueDate.getTime() - (reminderTime * 60 * 1000));
    
    // Check if reminder time is in the future
    if (reminderDate > new Date()) {
        const timeUntilReminder = reminderDate.getTime() - new Date().getTime();
        
        setTimeout(() => {
            showReminderNotification(task);
        }, timeUntilReminder);
    }
}

function showReminderNotification(task) {
    // Play sound
    const reminderSound = document.getElementById('reminderSound');
    if (reminderSound) {
        reminderSound.currentTime = 0; // Reset sound to start
        reminderSound.play().catch(error => {
            console.log('Error playing sound:', error);
        });
    }
    
    // Show notification
    showNotification(`Reminder: Task "${task.title}" is due ${task.reminder.time === 0 ? 'now' : 'soon'}!`, 'reminder');
    
    // Browser notification
    if (Notification.permission === 'granted') {
        new Notification('Task Reminder', {
            body: `Task "${task.title}" is due ${task.reminder.time === 0 ? 'now' : 'soon'}!`,
            icon: '/path/to/your/icon.png'
        });
    }
}

// Request notification permission when page loads
document.addEventListener('DOMContentLoaded', () => {
    if (Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
});

// Add this after your other declarations
const reminderToggle = document.getElementById('reminderToggle');
const reminderSettings = document.getElementById('reminderSettings');

// Add event listener for reminder toggle
reminderToggle.addEventListener('change', function() {
    if (this.checked) {
        reminderSettings.style.display = 'block';
    } else {
        reminderSettings.style.display = 'none';
    }
});

function updateTaskTable(tasks) {
    const tableBody = document.querySelector('#taskList tbody');
    // Clear existing content
    tableBody.innerHTML = '';
    
    // Add new content
    tasks.forEach(task => {
        // Your existing task row creation code
    });
}

// Remove any existing event listeners for the form
document.addEventListener('DOMContentLoaded', function() {
    const taskForm = document.getElementById('taskForm');
    const taskFormModal = document.getElementById('taskFormModal');

    if (taskForm) {
        // Remove any existing listeners
        const newTaskForm = taskForm.cloneNode(true);
        taskForm.parentNode.replaceChild(newTaskForm, taskForm);

        // Add new submit listener
        newTaskForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const taskData = {
                text: document.getElementById('taskInput').value,
                description: document.getElementById('taskDescription').value,
                dueDate: document.getElementById('dueDateInput').value,
                priority: document.getElementById('priorityInput').value,
                approverName: document.getElementById('approverInput').value,
                id: Date.now(),
                status: 'todo',
                completed: false
            };
            
            // Add task to tasks array
            tasks.push(taskData);
            
            // Save to localStorage
            saveTasks();
            
            // Update display
            renderTasks(tasks);
            updateTaskStats();
            
            // Show success notification
            showNotification('Task added successfully!', 'success');
            
            // Reset form
            newTaskForm.reset();
            
            // Reset reminder toggle and settings
            const reminderToggle = document.getElementById('reminderToggle');
            if (reminderToggle) {
                reminderToggle.checked = false;
                document.getElementById('reminderSettings').style.display = 'none';
            }
            
            // Close modal
            if (taskFormModal) {
                taskFormModal.classList.remove('show');
            }

            // Log for debugging
            console.log('Form submitted and modal should be closed');
        });
    }
});

// Separate function to render tasks
function renderTasks(tasks) {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;

    // Sort tasks by id in descending order (most recent first)
    tasks.sort((a, b) => b.id - a.id);

    // Clear existing content
    taskList.innerHTML = '';

    // Create and append the table
    const table = document.createElement('table');
    table.className = 'task-table';
    
    // Add table structure
    table.innerHTML = `
        <thead>
            <tr>
                <th>Task</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Approver</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            ${tasks.length ? '' : `
                <tr>
                    <td colspan="6" class="empty-state">
                        <i class="fas fa-tasks"></i>
                        <p>No tasks found</p>
                    </td>
                </tr>
            `}
            ${tasks.map(task => `
                <tr>
                    <td data-label="Task Title">${escapeHtml(task.text)}</td>
                    <td data-label="Due Date">${formatDate(task.dueDate)}</td>
                    <td data-label="Priority">
                        <span class="priority-badge ${task.priority.toLowerCase()}">${escapeHtml(task.priority)}</span>
                    </td>
                    <td data-label="Approver">${escapeHtml(task.approverName || '-')}</td>
                    <td data-label="Status">
                        <span class="status-badge ${task.status}">${escapeHtml(task.status)}</span>
                    </td>
                    <td data-label="Actions">
                        <div class="task-actions">
                            <button onclick="viewTask(${task.id})" class="action-btn view-btn" title="View">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button onclick="editTask(${task.id})" class="action-btn edit-btn" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteTask(${task.id})" class="action-btn delete-btn" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        
                        </div>
                    </td>
                </tr>
            `).join('')}
        </tbody>
    `;

    taskList.appendChild(table);
}

// Helper function to escape HTML and prevent XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Format date helper function
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Update event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initial render of tasks
    loadTasks();
    renderTasks(tasks);
    updateTaskStats();

    // Search functionality
    const searchInput = document.getElementById('searchTasks');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredTasks = tasks.filter(task => 
                (task.text || task.title).toLowerCase().includes(searchTerm) ||
                task.approverName?.toLowerCase().includes(searchTerm)
            );
            renderTasks(filteredTasks);
        });
    }

    // Filter functionality
    const filterPriority = document.getElementById('filterPriority');
    const filterStatus = document.getElementById('filterStatus');
    
    function applyFilters() {
        const priorityValue = filterPriority.value;
        const statusValue = filterStatus.value;
        
        let filteredTasks = [...tasks];
        
        if (priorityValue !== 'all') {
            filteredTasks = filteredTasks.filter(task => 
                task.priority.toLowerCase() === priorityValue.toLowerCase()
            );
        }
        
        if (statusValue !== 'all') {
            filteredTasks = filteredTasks.filter(task => 
                task.status.toLowerCase() === statusValue.toLowerCase()
            );
        }
        
        renderTasks(filteredTasks);
    }

    if (filterPriority) filterPriority.addEventListener('change', applyFilters);
    if (filterStatus) filterStatus.addEventListener('change', applyFilters);
});

// Add these event listeners for the modal
document.addEventListener('DOMContentLoaded', function() {
    // Get modal elements
    const createTaskBtn = document.getElementById('createTaskBtn');
    const taskFormModal = document.getElementById('taskFormModal');
    const closeTaskModal = document.getElementById('closeTaskModal');
    const taskForm = document.getElementById('taskForm');

    // Show modal when clicking Add Task button
    if (createTaskBtn) {
        createTaskBtn.addEventListener('click', function() {
            taskFormModal.classList.add('show');
        });
    }

    // Close modal when clicking the close button
    if (closeTaskModal) {
        closeTaskModal.addEventListener('click', function() {
            closeAndResetModal();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === taskFormModal) {
            closeAndResetModal();
        }
    });

    // Handle form submission
    if (taskForm) {
        taskForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Your existing task creation logic here
            // ...

            // After successful task creation:
            closeAndResetModal();
        });
    }

    // Function to close and reset modal
    function closeAndResetModal() {
        // Reset form fields
        if (taskForm) {
            taskForm.reset();
            
            // Reset any additional fields that might need clearing
            const approverInput = document.getElementById('approverInput');
            if (approverInput) {
                approverInput.value = '';
            }

            // Clear any selected approver display if it exists
            const selectedApprover = document.querySelector('.selected-approver');
            if (selectedApprover) {
                selectedApprover.remove();
            }

            // Reset reminder toggle and settings
            const reminderToggle = document.getElementById('reminderToggle');
            if (reminderToggle) {
                reminderToggle.checked = false;
            }
        }

        // Close the modal
        taskFormModal.classList.remove('show');
    }

    // Initialize form
    initializeTaskForm();
    
    // Load initial tasks
    loadTasks();
    renderTasks(tasks);
    updateTaskStats();
}, { once: true });

// Add function to start a task
function startTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.status = 'in progress';
        task.startTime = new Date().toISOString();
        saveTasks();
        displayTasks();
        updateTaskStats();
        showNotification('Task started successfully!', 'success');
    }
}

// Add function to complete a task
function completeTask(taskId) {
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex !== -1) {
        tasks[taskIndex].status = 'completed';
        tasks[taskIndex].completedAt = new Date().toISOString();
        saveTasks();
        displayTasks();
        updateTaskStats();
        showNotification('Task marked as completed!', 'success');
    }
}

// Helper function to get status icon
function getStatusIcon(status) {
    switch(status.toLowerCase()) {
        case 'in progress':
            return 'fa-spinner fa-spin';
        case 'completed':
            return 'fa-check-circle';
        default: // todo
            return 'fa-clock';
    }
}

// Helper function to get status label
function getStatusLabel(status) {
    switch(status.toLowerCase()) {
        case 'todo':
            return 'To Do';
        case 'in progress':
            return 'In Progress';
        case 'completed':
            return 'Completed';
        default:
            return status;
    }
}

// Add this helper function
function standardizeStatus(status) {
    status = status.toLowerCase().trim();
    if (status === 'to do' || status === 'todo') return 'todo';
    if (status === 'in progress') return 'in progress';
    if (status === 'completed') return 'completed';
    return 'todo'; // default status
}

// Update the task creation/editing to use standardized status
function handleTaskSubmit(event) {
    event.preventDefault();
    const taskId = taskForm.dataset.editId;
    const task = {
        id: taskId || Date.now(),
        text: taskInput.value,
        description: taskDescription.value,
        dueDate: dueDateInput.value,
        priority: priorityInput.value,
        status: standardizeStatus('todo'), // Set initial status as 'todo'
        // ... other task properties
    };
    // ... rest of the submit handler
}

// Add CSS for disabled buttons
const style = document.createElement('style');
style.textContent = `
    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

// Add event listeners for the view completed tasks button
document.addEventListener('DOMContentLoaded', function() {
    const viewCompletedBtn = document.getElementById('viewCompletedBtn');
    if (viewCompletedBtn) {
        viewCompletedBtn.addEventListener('click', function() {
            const isViewingCompleted = viewCompletedBtn.classList.toggle('viewing-completed');
            if (isViewingCompleted) {
                const completedTasks = tasks.filter(task => task.status === 'completed');
                displayTasks(completedTasks);
                viewCompletedBtn.innerHTML = '<i class="fas fa-tasks"></i> View All Tasks';
            } else {
                displayTasks();
                viewCompletedBtn.innerHTML = '<i class="fas fa-check-circle"></i> View Completed Tasks';
            }
        });
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const viewCompletedBtn = document.getElementById('viewCompletedBtn');
    const completedTasksModal = document.getElementById('completedTasksModal');
    const closeCompletedModal = document.getElementById('closeCompletedModal');

    if (viewCompletedBtn) {
        viewCompletedBtn.addEventListener('click', function() {
            completedTasksModal.classList.add('show');
        });
    }

    if (closeCompletedModal) {
        closeCompletedModal.addEventListener('click', function() {
            completedTasksModal.classList.remove('show');
        });
    }

    window.addEventListener('click', function(event) {
        if (event.target === completedTasksModal) {
            completedTasksModal.classList.remove('show');
        }
    });

    const searchCompletedTasks = document.getElementById('searchCompletedTasks');
    const completedTasksList = document.getElementById('completedTasksList');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');

    let currentPage = 1;
    const tasksPerPage = 5;

    function displayCompletedTasks(tasks) {
        const startIndex = (currentPage - 1) * tasksPerPage;
        const endIndex = startIndex + tasksPerPage;
        const paginatedTasks = tasks.slice(startIndex, endIndex);

        completedTasksList.innerHTML = paginatedTasks.map(task => `
            <tr>
                <td>${task.text}</td>
                <td>${task.dueDate}</td>
                <td>${task.priority}</td>
                <td>${task.completedAt}</td>
                <td>
                    <button class="action-btn view-btn" onclick="viewTask(${task.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                </td>
            </tr>
        `).join('');

        pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(tasks.length / tasksPerPage)}`;
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === Math.ceil(tasks.length / tasksPerPage);
    }

    searchCompletedTasks.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const filteredTasks = tasks.filter(task => task.text.toLowerCase().includes(searchTerm));
        displayCompletedTasks(filteredTasks);
    });

    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayCompletedTasks(tasks);
        }
    });

    nextPageBtn.addEventListener('click', function() {
        if (currentPage < Math.ceil(tasks.length / tasksPerPage)) {
            currentPage++;
            displayCompletedTasks(tasks);
        }
    });

    // Initial display
    displayCompletedTasks(tasks);
});
