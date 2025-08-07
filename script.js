// Load saved progress on page load
document.addEventListener('DOMContentLoaded', function () {
    loadProgress();
    updateProgress();
});

function toggleSection(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.collapse-icon');

    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        header.classList.remove('collapsed');
        content.style.maxHeight = content.scrollHeight + 'px';
    } else {
        content.classList.add('collapsed');
        header.classList.add('collapsed');
        content.style.maxHeight = '0px';
    }
}

function updateProgress() {
    const checkboxes = document.querySelectorAll('.topic-checkbox');
    const checkedBoxes = document.querySelectorAll('.topic-checkbox:checked');
    const total = checkboxes.length;
    const completed = checkedBoxes.length;
    const percentage = Math.round((completed / total) * 100);

    // Update progress bar
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    progressFill.style.width = percentage + '%';
    progressText.textContent = `${percentage}% Complete (${completed}/${total} topics)`;

    // Update completed items visual state
    checkboxes.forEach(checkbox => {
        const topicItem = checkbox.closest('.topic-item');
        if (checkbox.checked) {
            topicItem.classList.add('completed');
        } else {
            topicItem.classList.remove('completed');
        }
    });

    // Update section headers based on completion
    updateSectionHeaders();

    // Save progress
    saveProgress();
}

function updateSectionHeaders() {
    const sections = document.querySelectorAll('.section');

    sections.forEach(section => {
        const checkboxes = section.querySelectorAll('.topic-checkbox');
        const checkedBoxes = section.querySelectorAll('.topic-checkbox:checked');
        const header = section.querySelector('.section-header');

        if (checkboxes.length > 0 && checkedBoxes.length === checkboxes.length) {
            header.classList.add('completed');
        } else {
            header.classList.remove('completed');
        }
    });
}

function saveProgress() {
    const checkboxes = document.querySelectorAll('.topic-checkbox');
    const progress = [];

    checkboxes.forEach((checkbox, index) => {
        progress[index] = checkbox.checked;
    });

    // Save to localStorage for persistence
    localStorage.setItem('javaCourseTodoProgress', JSON.stringify(progress));
}

function loadProgress() {
    const progressStr = localStorage.getItem('javaCourseTodoProgress');
    if (progressStr) {
        const progress = JSON.parse(progressStr);
        const checkboxes = document.querySelectorAll('.topic-checkbox');
        checkboxes.forEach((checkbox, index) => {
            if (progress[index]) {
                checkbox.checked = true;
            }
        });
    }
}

function clearSavedProgress() {
    localStorage.removeItem('javaCourseTodoProgress');
}