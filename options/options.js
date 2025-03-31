// DOM Elements
const optionsForm = document.getElementById('options-form');
const beeminderUsernameInput = document.getElementById('beeminder-username');
const beeminderAuthTokenInput = document.getElementById('beeminder-auth-token');
const saveBtn = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');
const goalDefaultsContainer = document.getElementById('goal-defaults-container');

let currentGoals = [];
let defaultValues = {};

// Load saved options on page load
document.addEventListener('DOMContentLoaded', () => {
  browser.storage.sync.get(['beeminderUsername', 'beeminderAuthToken', 'defaultValues'])
    .then((result) => {
      beeminderUsernameInput.value = result.beeminderUsername || '';
      beeminderAuthTokenInput.value = result.beeminderAuthToken || '';
      
      defaultValues = result.defaultValues || {};
      
      // If credentials are set, fetch goals
      if (result.beeminderUsername && result.beeminderAuthToken) {
        fetchGoals(result.beeminderUsername, result.beeminderAuthToken);
      } else {
        goalDefaultsContainer.innerHTML = '<p>Please enter your Beeminder credentials to manage goal defaults.</p>';
      }
    })
    .catch(error => {
      console.error('Error loading options:', error);
    });
});

// Save options when form is submitted
optionsForm.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const beeminderUsername = beeminderUsernameInput.value.trim();
  const beeminderAuthToken = beeminderAuthTokenInput.value.trim();
  
  if (!beeminderUsername || !beeminderAuthToken) {
    showStatus('Please fill in all fields', 'error');
    return;
  }
  
  // Save to storage
  browser.storage.sync.set({
    beeminderUsername,
    beeminderAuthToken
  })
    .then(() => {
      showStatus('Settings saved successfully!', 'success');
      
      // Fetch goals with the new credentials
      fetchGoals(beeminderUsername, beeminderAuthToken);
    })
    .catch(error => {
      console.error('Error saving options:', error);
      showStatus(`Error saving settings: ${error.message}`, 'error');
    });
});

// Fetch goals from Beeminder API
function fetchGoals(username, token) {
  goalDefaultsContainer.innerHTML = '<div class="loading">Loading your goals...</div>';
  
  fetch(`https://www.beeminder.com/api/v1/users/${username}/goals.json?auth_token=${token}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      currentGoals = data;
      renderGoalDefaults(data);
    })
    .catch(error => {
      console.error('Error fetching goals:', error);
      goalDefaultsContainer.innerHTML = `<p class="error">Error fetching goals: ${error.message}</p>`;
    });
}

// Render goal defaults UI
function renderGoalDefaults(goals) {
  if (goals.length === 0) {
    goalDefaultsContainer.innerHTML = '<p>No goals found.</p>';
    return;
  }
  
  // Create container for the goals
  goalDefaultsContainer.innerHTML = `
    <div id="goal-defaults-list"></div>
    <div class="buttons">
      <button type="button" id="save-defaults-btn">Save Default Values</button>
    </div>
  `;
  
  const goalDefaultsList = document.getElementById('goal-defaults-list');
  
  // Create UI for each goal
  goals.forEach(goal => {
    const goalElement = document.createElement('div');
    goalElement.className = 'goal-default-item';
    
    // Get saved default value or use 1 as default
    const defaultValue = defaultValues[goal.slug] || 1;
    
    goalElement.innerHTML = `
      <div class="goal-info">
        <div class="goal-name">${goal.title || goal.slug}</div>
        <div class="goal-slug">@${beeminderUsernameInput.value}/${goal.slug}</div>
      </div>
      <input type="number" 
             class="default-value-input" 
             data-goal-slug="${goal.slug}" 
             value="${defaultValue}" 
             step="0.01" 
             min="0.01">
    `;
    
    goalDefaultsList.appendChild(goalElement);
  });
  
  // Add event listener to save button
  const saveDefaultsBtn = document.getElementById('save-defaults-btn');
  saveDefaultsBtn.addEventListener('click', saveGoalDefaults);
}

// Save goal default values
function saveGoalDefaults() {
  const inputs = document.querySelectorAll('.default-value-input');
  const newDefaults = {};
  
  // Collect values from inputs
  inputs.forEach(input => {
    const goalSlug = input.getAttribute('data-goal-slug');
    const value = parseFloat(input.value);
    
    if (!isNaN(value) && value > 0) {
      newDefaults[goalSlug] = value;
    }
  });
  
  // Save to storage
  browser.storage.sync.set({ defaultValues: newDefaults })
    .then(() => {
      defaultValues = newDefaults;
      showStatus('Default values saved successfully!', 'success');
    })
    .catch(error => {
      console.error('Error saving default values:', error);
      showStatus(`Error saving default values: ${error.message}`, 'error');
    });
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = type;
  
  // Clear status message after a delay
  setTimeout(() => {
    statusMessage.textContent = '';
    statusMessage.className = '';
  }, 3000);
}
