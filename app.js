const STORAGE_KEY = "java-roadmap-phase-1-progress";

const elements = {
  title: document.querySelector("#roadmap-title"),
  goal: document.querySelector("#roadmap-goal"),
  progressLabel: document.querySelector("#progress-label"),
  progressPercent: document.querySelector("#progress-percent"),
  progressTrack: document.querySelector("#progress-track"),
  progressFill: document.querySelector("#progress-fill"),
  timeEstimate: document.querySelector("#time-estimate"),
  search: document.querySelector("#search-input"),
  filters: [...document.querySelectorAll(".filter-button")],
  reset: document.querySelector("#reset-button"),
  list: document.querySelector("#day-list"),
  resultCount: document.querySelector("#result-count"),
  emptyState: document.querySelector("#empty-state"),
};

let roadmap;
let completedItems = new Set();
let activeFilter = "all";
let searchQuery = "";

function taskId(dayNumber) {
  return `${dayNumber}:task`;
}

function topicId(dayNumber, topicIndex) {
  return `${dayNumber}:topic:${topicIndex}`;
}

function isDayComplete(day) {
  return completedItems.has(taskId(day.day))
    && day.topics.every((_, index) => completedItems.has(topicId(day.day, index)));
}

function loadProgress() {
  const rawProgress = localStorage.getItem(STORAGE_KEY);
  if (rawProgress === null) return;

  let saved;
  try {
    saved = JSON.parse(rawProgress);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    console.error("Could not parse saved roadmap progress; starting with an empty checklist.", error);
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  const validDayNumbers = new Set(roadmap.days.map((day) => day.day));
  const validItemIds = new Set(roadmap.days.flatMap((day) => [
    taskId(day.day),
    ...day.topics.map((_, index) => topicId(day.day, index)),
  ]));
  if (!Array.isArray(saved) || !saved.every((item) => (
    (Number.isInteger(item) && validDayNumbers.has(item))
    || (typeof item === "string" && validItemIds.has(item))
  ))) {
    console.error("Saved roadmap progress has an invalid format; starting with an empty checklist.");
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  completedItems = new Set(saved.map((item) => (
    Number.isInteger(item) ? taskId(item) : item
  )));
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...completedItems]));
  } catch (error) {
    console.error("Could not save roadmap progress to local storage.", error);
    alert("Progress could not be saved. Check your browser storage settings.");
  }
}

function updateProgress() {
  const total = roadmap.days.reduce((count, day) => count + day.topics.length + 1, 0);
  const completed = completedItems.size;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  elements.progressLabel.textContent = `${completed} of ${total} items completed`;
  elements.progressPercent.textContent = `${percent}%`;
  elements.progressFill.style.width = `${percent}%`;
  elements.progressTrack.setAttribute("aria-valuemax", String(total));
  elements.progressTrack.setAttribute("aria-valuenow", String(completed));
}

function createDayCard(day) {
  const card = document.createElement("article");
  const isComplete = isDayComplete(day);
  card.className = `day-card${isComplete ? " is-complete" : ""}`;

  const summary = document.createElement("div");
  summary.className = "day-summary";

  const checkbox = document.createElement("input");
  checkbox.className = "task-checkbox";
  checkbox.type = "checkbox";
  checkbox.checked = completedItems.has(taskId(day.day));
  checkbox.setAttribute("aria-label", `Mark day ${day.day} task ${checkbox.checked ? "not done" : "done"}`);
  checkbox.addEventListener("change", () => {
    updateItemCompletion(taskId(day.day), checkbox.checked, day, card);
    checkbox.setAttribute("aria-label", `Mark day ${day.day} task ${checkbox.checked ? "not done" : "done"}`);
  });

  const toggle = document.createElement("button");
  toggle.className = "day-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-expanded", "false");

  const number = document.createElement("span");
  number.className = "day-number";
  number.textContent = `DAY ${day.day}`;

  const title = document.createElement("span");
  title.className = "day-title";
  title.textContent = day.title;
  toggle.append(number, title);

  const taskTitle = document.createElement("span");
  taskTitle.className = "task-title";
  taskTitle.textContent = day.task.title;

  const chevron = document.createElement("span");
  chevron.className = "chevron";
  chevron.setAttribute("aria-hidden", "true");

  const details = document.createElement("div");
  details.className = "day-details";
  details.hidden = true;

  const topicsHeading = document.createElement("h3");
  topicsHeading.textContent = "Topics";
  const topicList = document.createElement("ul");
  topicList.className = "topic-list";
  for (const [index, topic] of day.topics.entries()) {
    const item = document.createElement("li");
    const topicCheckbox = document.createElement("input");
    topicCheckbox.className = "topic-checkbox";
    topicCheckbox.type = "checkbox";
    topicCheckbox.checked = completedItems.has(topicId(day.day, index));
    topicCheckbox.setAttribute("aria-label", `Mark day ${day.day} topic ${index + 1} ${topicCheckbox.checked ? "not done" : "done"}: ${topic}`);
    const topicLabel = document.createElement("span");
    topicLabel.textContent = topic;
    item.classList.toggle("is-complete", topicCheckbox.checked);
    topicCheckbox.addEventListener("change", () => {
      updateItemCompletion(topicId(day.day, index), topicCheckbox.checked, day, card);
      item.classList.toggle("is-complete", topicCheckbox.checked);
      topicCheckbox.setAttribute("aria-label", `Mark day ${day.day} topic ${index + 1} ${topicCheckbox.checked ? "not done" : "done"}: ${topic}`);
    });
    item.append(topicCheckbox, topicLabel);
    topicList.append(item);
  }

  const taskHeading = document.createElement("h3");
  taskHeading.textContent = day.task.title;
  const description = document.createElement("p");
  description.className = "task-description";
  description.textContent = day.task.description;
  details.append(topicsHeading, topicList, taskHeading, description);

  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    details.hidden = expanded;
  });

  summary.append(checkbox, toggle, taskTitle, chevron);
  card.append(summary, details);
  return card;
}

function updateItemCompletion(itemId, isComplete, day, card) {
  if (isComplete) {
    completedItems.add(itemId);
  } else {
    completedItems.delete(itemId);
  }
  saveProgress();
  updateProgress();

  const dayIsComplete = isDayComplete(day);
  card.classList.toggle("is-complete", dayIsComplete);
  if ((activeFilter === "active" && dayIsComplete)
    || (activeFilter === "completed" && !dayIsComplete)) {
    card.remove();
  }
  const visibleCount = elements.list.querySelectorAll(".day-card").length;
  elements.resultCount.textContent = `Showing ${visibleCount} of ${roadmap.days.length} days`;
  elements.emptyState.hidden = visibleCount > 0;
}

function renderDays() {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const filteredDays = roadmap.days.filter((day) => {
    const isComplete = isDayComplete(day);
    if (activeFilter === "active" && isComplete) return false;
    if (activeFilter === "completed" && !isComplete) return false;
    if (!normalizedQuery) return true;

    const searchableText = [
      day.title,
      day.task.title,
      day.task.description,
      ...day.topics,
      `day ${day.day}`,
    ].join(" ").toLocaleLowerCase();
    return searchableText.includes(normalizedQuery);
  });

  elements.list.replaceChildren(...filteredDays.map(createDayCard));
  elements.resultCount.textContent = `Showing ${filteredDays.length} of ${roadmap.days.length} days`;
  elements.emptyState.hidden = filteredDays.length > 0;
}

function bindControls() {
  elements.search.addEventListener("input", () => {
    searchQuery = elements.search.value;
    renderDays();
  });

  for (const button of elements.filters) {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      for (const filterButton of elements.filters) {
        filterButton.setAttribute("aria-pressed", String(filterButton === button));
      }
      renderDays();
    });
  }

  elements.reset.addEventListener("click", () => {
    if (completedItems.size === 0) return;
    if (!confirm("Reset all saved roadmap progress?")) return;
    completedItems.clear();
    saveProgress();
    updateProgress();
    renderDays();
  });
}

async function initialize() {
  try {
    const response = await fetch("./phase1_java_fundamentals.json");
    if (!response.ok) {
      throw new Error(`Could not load roadmap JSON (${response.status}).`);
    }
    roadmap = await response.json();

    if (!Array.isArray(roadmap.days) || !roadmap.days.every((day) => (
      Number.isInteger(day.day)
      && typeof day.title === "string"
      && Array.isArray(day.topics)
      && typeof day.task?.title === "string"
      && typeof day.task?.description === "string"
    ))) {
      throw new Error("The roadmap JSON does not have the expected day and task structure.");
    }

    elements.title.textContent = roadmap.title;
    elements.goal.textContent = roadmap.goal;
    elements.timeEstimate.textContent = `${roadmap.total_days} days · ${roadmap.daily_time_hours} hours per day`;
    loadProgress();
    bindControls();
    updateProgress();
    renderDays();
  } catch (error) {
    console.error("Could not initialize the roadmap checklist.", error);
    elements.list.textContent = "The roadmap could not be loaded. Run this app from a local web server and check that the JSON file is available.";
    elements.resultCount.textContent = "";
  }
}

initialize();
