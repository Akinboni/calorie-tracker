/**
 * Calorie Tracker
 * Plain JavaScript (ES6+), no frameworks, no libraries, no build tools.
 * All data persisted in localStorage.
 */

(function () {
  'use strict';

  // --- Storage Keys ---
  const STORAGE_KEY_ENTRIES = 'calorie_tracker_entries_v1';
  const STORAGE_KEY_GOAL = 'calorie_tracker_goal_v1';
  const DEFAULT_GOAL = 2000;

  // --- State ---
  let currentDate = new Date();
  let dailyGoal = DEFAULT_GOAL;
  let entries = [];
  let editingEntryId = null;

  // --- DOM Elements ---
  // Date Navigation
  const prevDayBtn = document.getElementById('prev-day-btn');
  const nextDayBtn = document.getElementById('next-day-btn');
  const todayBtn = document.getElementById('today-btn');
  const datePickerInput = document.getElementById('date-picker-input');
  const currentDateHeading = document.getElementById('current-date-heading');

  // Daily Summary & Goal
  const totalConsumedEl = document.getElementById('total-consumed');
  const targetGoalEl = document.getElementById('target-goal');
  const remainingLabelEl = document.getElementById('remaining-label');
  const caloriesRemainingEl = document.getElementById('calories-remaining');
  const progressBarFillEl = document.getElementById('progress-bar-fill');
  const progressPercentageEl = document.getElementById('progress-percentage');
  const progressIndicatorTextEl = document.getElementById('progress-indicator-text');
  const summaryStatusTextEl = document.getElementById('summary-status-text');

  // Meal Subtotals
  const subtotalBreakfastEl = document.getElementById('subtotal-breakfast');
  const subtotalLunchEl = document.getElementById('subtotal-lunch');
  const subtotalDinnerEl = document.getElementById('subtotal-dinner');
  const subtotalSnackEl = document.getElementById('subtotal-snack');

  // Goal Form
  const toggleGoalBtn = document.getElementById('toggle-goal-btn');
  const goalEditForm = document.getElementById('goal-edit-form');
  const goalInput = document.getElementById('goal-input');
  const cancelGoalBtn = document.getElementById('cancel-goal-btn');
  const goalErrorEl = document.getElementById('goal-error');

  // Food Entry Form
  const foodEntryForm = document.getElementById('food-entry-form');
  const entryIdInput = document.getElementById('entry-id-input');
  const foodNameInput = document.getElementById('food-name-input');
  const caloriesInput = document.getElementById('calories-input');
  const mealTypeSelect = document.getElementById('meal-type-select');
  const foodNameErrorEl = document.getElementById('food-name-error');
  const caloriesErrorEl = document.getElementById('calories-error');
  const submitEntryBtn = document.getElementById('submit-entry-btn');
  const submitBtnText = document.getElementById('submit-btn-text');
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  const formTitleEl = document.getElementById('form-title');
  const formModeBadgeEl = document.getElementById('form-mode-badge');

  // Entries List & Empty State
  const entriesListEl = document.getElementById('entries-list');
  const emptyStateEl = document.getElementById('empty-state');
  const entriesCountTextEl = document.getElementById('entries-count-text');

  // --- Date Helpers ---
  function formatDateToKey(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function parseKeyToDate(keyStr) {
    const [year, month, day] = keyStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function formatDisplayDate(d) {
    const todayKey = formatDateToKey(new Date());
    const targetKey = formatDateToKey(d);

    const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
    const dateFormatted = d.toLocaleDateString(undefined, options);

    if (targetKey === todayKey) {
      return `Today (${dateFormatted})`;
    }

    // Check yesterday and tomorrow
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (targetKey === formatDateToKey(yesterday)) {
      return `Yesterday (${dateFormatted})`;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (targetKey === formatDateToKey(tomorrow)) {
      return `Tomorrow (${dateFormatted})`;
    }

    return dateFormatted;
  }

  // --- LocalStorage Helpers ---
  function loadData() {
    try {
      const storedEntries = localStorage.getItem(STORAGE_KEY_ENTRIES);
      if (storedEntries) {
        entries = JSON.parse(storedEntries);
        if (!Array.isArray(entries)) {
          entries = [];
        }
      } else {
        entries = [];
      }
    } catch (e) {
      console.error('Error loading entries from localStorage:', e);
      entries = [];
    }

    try {
      const storedGoal = localStorage.getItem(STORAGE_KEY_GOAL);
      if (storedGoal) {
        const parsed = Number(storedGoal);
        if (Number.isFinite(parsed) && parsed > 0) {
          dailyGoal = Math.round(parsed);
        } else {
          dailyGoal = DEFAULT_GOAL;
        }
      } else {
        dailyGoal = DEFAULT_GOAL;
      }
    } catch (e) {
      console.error('Error loading daily goal from localStorage:', e);
      dailyGoal = DEFAULT_GOAL;
    }
  }

  function saveEntries() {
    try {
      localStorage.setItem(STORAGE_KEY_ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Error saving entries to localStorage:', e);
      alert('Unable to save data. Your browser storage might be full or restricted.');
    }
  }

  function saveGoal(newGoal) {
    dailyGoal = newGoal;
    try {
      localStorage.setItem(STORAGE_KEY_GOAL, String(newGoal));
    } catch (e) {
      console.error('Error saving goal to localStorage:', e);
    }
  }

  // --- Form Validation ---
  function clearErrors() {
    foodNameErrorEl.textContent = '';
    caloriesErrorEl.textContent = '';
    foodNameInput.classList.remove('input-error');
    caloriesInput.classList.remove('input-error');
  }

  function validateFoodEntry(name, calories) {
    let isValid = true;
    clearErrors();

    if (!name || name.trim() === '') {
      foodNameErrorEl.textContent = 'Food name is required.';
      foodNameInput.classList.add('input-error');
      isValid = false;
    }

    const calNum = Number(calories);
    if (!calories || isNaN(calNum) || calNum <= 0) {
      caloriesErrorEl.textContent = 'Calories must be a positive number greater than 0.';
      caloriesInput.classList.add('input-error');
      isValid = false;
    } else if (calNum > 50000) {
      caloriesErrorEl.textContent = 'Please enter a realistic calorie value (max 50,000).';
      caloriesInput.classList.add('input-error');
      isValid = false;
    }

    return isValid;
  }

  // --- Rendering ---
  function render() {
    const currentKey = formatDateToKey(currentDate);

    // 1. Update Date Controls
    datePickerInput.value = currentKey;
    currentDateHeading.textContent = formatDisplayDate(currentDate);

    // 2. Filter entries for the selected day
    const dayEntries = entries.filter(item => item.date === currentKey);

    // 3. Compute totals and meal subtotals
    let totalCalories = 0;
    const mealTotals = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0
    };

    dayEntries.forEach(item => {
      const cals = Number(item.calories) || 0;
      totalCalories += cals;
      if (mealTotals[item.mealType] !== undefined) {
        mealTotals[item.mealType] += cals;
      }
    });

    // 4. Update Summary Card
    totalConsumedEl.textContent = totalCalories.toLocaleString();
    targetGoalEl.textContent = dailyGoal.toLocaleString();

    const remaining = dailyGoal - totalCalories;
    if (remaining >= 0) {
      remainingLabelEl.textContent = 'Remaining';
      caloriesRemainingEl.textContent = remaining.toLocaleString();
      caloriesRemainingEl.className = 'stat-value stat-positive';
      progressIndicatorTextEl.textContent = `${remaining.toLocaleString()} kcal left`;
      summaryStatusTextEl.textContent = `${remaining.toLocaleString()} kcal remaining to meet your target`;
    } else {
      const over = Math.abs(remaining);
      remainingLabelEl.textContent = 'Over Target';
      caloriesRemainingEl.textContent = `+${over.toLocaleString()}`;
      caloriesRemainingEl.className = 'stat-value stat-negative';
      progressIndicatorTextEl.textContent = `${over.toLocaleString()} kcal over target!`;
      summaryStatusTextEl.textContent = `Daily target exceeded by ${over.toLocaleString()} kcal`;
    }

    // Progress Bar Calculation
    const percentage = dailyGoal > 0 ? Math.round((totalCalories / dailyGoal) * 100) : 0;
    const barFillWidth = Math.min(100, Math.max(0, percentage));
    progressBarFillEl.style.width = `${barFillWidth}%`;
    progressBarFillEl.setAttribute('aria-valuenow', String(Math.min(100, percentage)));
    progressPercentageEl.textContent = `${percentage}% of daily target`;

    // Progress Bar Color Status
    progressBarFillEl.classList.remove('progress-fill-normal', 'progress-fill-warning', 'progress-fill-danger');
    if (totalCalories > dailyGoal) {
      progressBarFillEl.classList.add('progress-fill-danger');
    } else if (percentage >= 85) {
      progressBarFillEl.classList.add('progress-fill-warning');
    } else {
      progressBarFillEl.classList.add('progress-fill-normal');
    }

    // Meal Subtotals
    subtotalBreakfastEl.textContent = `${mealTotals.breakfast.toLocaleString()} kcal`;
    subtotalLunchEl.textContent = `${mealTotals.lunch.toLocaleString()} kcal`;
    subtotalDinnerEl.textContent = `${mealTotals.dinner.toLocaleString()} kcal`;
    subtotalSnackEl.textContent = `${mealTotals.snack.toLocaleString()} kcal`;

    // 5. Render Entries List or Empty State
    entriesCountTextEl.textContent = `${dayEntries.length} ${dayEntries.length === 1 ? 'item' : 'items'} logged`;

    if (dayEntries.length === 0) {
      emptyStateEl.classList.remove('is-hidden');
      entriesListEl.classList.add('is-hidden');
      entriesListEl.innerHTML = '';
    } else {
      emptyStateEl.classList.add('is-hidden');
      entriesListEl.classList.remove('is-hidden');
      renderEntriesList(dayEntries);
    }
  }

  function getMealBadgeClass(mealType) {
    switch (mealType) {
      case 'breakfast':
        return 'badge-breakfast';
      case 'lunch':
        return 'badge-lunch';
      case 'dinner':
        return 'badge-dinner';
      case 'snack':
        return 'badge-snack';
      default:
        return 'badge-snack';
    }
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function renderEntriesList(dayEntries) {
    entriesListEl.innerHTML = '';

    dayEntries.forEach(item => {
      const li = document.createElement('li');
      li.className = 'entry-item';
      if (editingEntryId === item.id) {
        li.classList.add('is-editing-item');
      }

      const mainInfoDiv = document.createElement('div');
      mainInfoDiv.className = 'entry-main-info';

      const badge = document.createElement('span');
      badge.className = `meal-badge ${getMealBadgeClass(item.mealType)}`;
      badge.textContent = capitalize(item.mealType);

      const detailsDiv = document.createElement('div');
      detailsDiv.className = 'entry-details';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'entry-name';
      nameSpan.textContent = item.name;

      detailsDiv.appendChild(nameSpan);
      mainInfoDiv.appendChild(badge);
      mainInfoDiv.appendChild(detailsDiv);

      const caloriesSpan = document.createElement('span');
      caloriesSpan.className = 'entry-calories';
      caloriesSpan.textContent = `${Number(item.calories).toLocaleString()} kcal`;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'entry-actions';

      // Edit Button
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'btn btn-icon btn-edit';
      editBtn.setAttribute('aria-label', `Edit ${item.name}`);
      editBtn.innerHTML = '&#9998; Edit';
      editBtn.addEventListener('click', () => {
        startEditingEntry(item);
      });

      // Delete Button
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'btn btn-icon btn-delete';
      deleteBtn.setAttribute('aria-label', `Delete ${item.name}`);
      deleteBtn.innerHTML = '&#128465; Delete';
      deleteBtn.addEventListener('click', () => {
        deleteEntry(item.id, item.name);
      });

      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(mainInfoDiv);
      li.appendChild(caloriesSpan);
      li.appendChild(actionsDiv);

      entriesListEl.appendChild(li);
    });
  }

  // --- Form & Edit Actions ---
  function resetForm() {
    editingEntryId = null;
    entryIdInput.value = '';
    foodEntryForm.reset();
    mealTypeSelect.value = 'breakfast';
    clearErrors();

    formTitleEl.textContent = 'Add Food Entry';
    submitBtnText.textContent = 'Add Food Entry';
    formModeBadgeEl.classList.add('is-hidden');
    cancelEditBtn.classList.add('is-hidden');
  }

  function startEditingEntry(item) {
    editingEntryId = item.id;
    entryIdInput.value = item.id;
    foodNameInput.value = item.name;
    caloriesInput.value = item.calories;
    mealTypeSelect.value = item.mealType;
    clearErrors();

    formTitleEl.textContent = 'Edit Food Entry';
    submitBtnText.textContent = 'Update Entry';
    formModeBadgeEl.classList.remove('is-hidden');
    cancelEditBtn.classList.remove('is-hidden');

    // Scroll form into view and focus
    foodEntryForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    foodNameInput.focus();

    // Re-render to highlight active editing item in list
    render();
  }

  function deleteEntry(id, foodName) {
    const shouldDelete = window.confirm(`Are you sure you want to delete "${foodName}"?`);
    if (!shouldDelete) return;

    if (editingEntryId === id) {
      resetForm();
    }

    entries = entries.filter(item => item.id !== id);
    saveEntries();
    render();
  }

  // --- Event Listeners ---

  // Date Navigation
  prevDayBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    render();
  });

  nextDayBtn.addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    render();
  });

  todayBtn.addEventListener('click', () => {
    currentDate = new Date();
    render();
  });

  datePickerInput.addEventListener('change', (e) => {
    if (e.target.value) {
      currentDate = parseKeyToDate(e.target.value);
      render();
    }
  });

  // Goal Editor
  toggleGoalBtn.addEventListener('click', () => {
    const isCurrentlyHidden = goalEditForm.classList.contains('is-hidden');
    if (isCurrentlyHidden) {
      goalEditForm.classList.remove('is-hidden');
      toggleGoalBtn.setAttribute('aria-expanded', 'true');
      goalInput.value = dailyGoal;
      goalErrorEl.textContent = '';
      goalInput.classList.remove('input-error');
      goalInput.focus();
    } else {
      goalEditForm.classList.add('is-hidden');
      toggleGoalBtn.setAttribute('aria-expanded', 'false');
    }
  });

  cancelGoalBtn.addEventListener('click', () => {
    goalEditForm.classList.add('is-hidden');
    toggleGoalBtn.setAttribute('aria-expanded', 'false');
    goalErrorEl.textContent = '';
    goalInput.classList.remove('input-error');
  });

  goalEditForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = Number(goalInput.value.trim());

    if (!goalInput.value || isNaN(val) || val <= 0) {
      goalErrorEl.textContent = 'Please enter a valid goal greater than 0.';
      goalInput.classList.add('input-error');
      return;
    }

    if (val > 50000) {
      goalErrorEl.textContent = 'Please enter a target of 50,000 kcal or less.';
      goalInput.classList.add('input-error');
      return;
    }

    saveGoal(Math.round(val));
    goalEditForm.classList.add('is-hidden');
    toggleGoalBtn.setAttribute('aria-expanded', 'false');
    goalErrorEl.textContent = '';
    goalInput.classList.remove('input-error');
    render();
  });

  // Food Entry Form Submit
  foodEntryForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = foodNameInput.value.trim();
    const calories = caloriesInput.value.trim();
    const mealType = mealTypeSelect.value;

    if (!validateFoodEntry(name, calories)) {
      return;
    }

    const calorieNumber = Math.round(Number(calories));
    const currentKey = formatDateToKey(currentDate);

    if (editingEntryId) {
      // Update existing entry
      const index = entries.findIndex(item => item.id === editingEntryId);
      if (index !== -1) {
        entries[index].name = name;
        entries[index].calories = calorieNumber;
        entries[index].mealType = mealType;
      }
      resetForm();
    } else {
      // Add new entry
      const newEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: name,
        calories: calorieNumber,
        mealType: mealType,
        date: currentKey,
        createdAt: Date.now()
      };
      entries.unshift(newEntry);
      resetForm();
    }

    saveEntries();
    render();
  });

  // Cancel Edit
  cancelEditBtn.addEventListener('click', () => {
    resetForm();
    render();
  });

  // Clear validation styles on input
  foodNameInput.addEventListener('input', () => {
    if (foodNameInput.value.trim()) {
      foodNameErrorEl.textContent = '';
      foodNameInput.classList.remove('input-error');
    }
  });

  caloriesInput.addEventListener('input', () => {
    const val = Number(caloriesInput.value);
    if (val > 0) {
      caloriesErrorEl.textContent = '';
      caloriesInput.classList.remove('input-error');
    }
  });

  // --- Initialization ---
  function init() {
    loadData();
    render();
  }

  // Run on DOM load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

