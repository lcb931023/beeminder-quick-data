// DOM Elements
const loginView = document.getElementById('login-view');
const goalsView = document.getElementById('goals-view');
const openOptionsBtn = document.getElementById('open-options');
const goalsContainer = document.getElementById('goals-container');
const loading = document.getElementById('loading');
const datapointForm = document.getElementById('datapoint-form');
const selectedGoalName = document.getElementById('selected-goal-name');
const valueInput = document.getElementById('value');
const commentInput = document.getElementById('comment');
const submitDatapointBtn = document.getElementById('submit-datapoint');
const cancelDatapointBtn = document.getElementById('cancel-datapoint');
const statusMessage = document.getElementById('status-message');

let currentGoals = [];
let selectedGoal = null;
let credentials = null;
let currentTab = null;

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  // Get current tab information
  getCurrentTabInfo();
  
  // Check if credentials are set
  browser.storage.sync.get(['beeminderUsername', 'beeminderAuthToken', 'defaultValues'])
    .then(result => {
      credentials = result;
      if (result.beeminderUsername && result.beeminderAuthToken) {
        // Credentials found, fetch goals
        loginView.style.display = 'none';
        goalsView.style.display = 'block';
        fetchGoals(result.beeminderUsername, result.beeminderAuthToken);
      } else {
        // No credentials, show login view
        loginView.style.display = 'block';
        goalsView.style.display = 'none';
      }
    });
});

// Get current tab information
function getCurrentTabInfo() {
  browser.tabs.query({active: true, currentWindow: true})
    .then(tabs => {
      if (tabs.length > 0) {
        currentTab = tabs[0];
      }
    })
    .catch(error => {
      console.error('Error getting tab info:', error);
    });
}

// Open options page when button is clicked
openOptionsBtn.addEventListener('click', () => {
  browser.runtime.openOptionsPage();
});

// Fetch goals from Beeminder API
function fetchGoals(username, token) {
  loading.style.display = 'block';
  goalsContainer.style.display = 'none';
  
  fetch(`https://www.beeminder.com/api/v1/users/${username}/goals.json?auth_token=${token}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      currentGoals = data;
      
      // Fetch datapoints for today for all goals
      return Promise.all(data.map(goal => 
        checkTodayDatapoint(username, token, goal.slug)
      ));
    })
    .then(todayDatapointResults => {
      // Create a map of goals with today's data totals
      const goalsTodayData = {};
      todayDatapointResults.forEach((todayValue, index) => {
        goalsTodayData[currentGoals[index].slug] = todayValue;
      });
      
      renderGoals(currentGoals, goalsTodayData);
      loading.style.display = 'none';
      goalsContainer.style.display = 'block';
    })
    .catch(error => {
      console.error('Error fetching goals:', error);
      showStatus(`Error fetching goals: ${error.message}`, 'error');
      loading.style.display = 'none';
    });
}

// Check if a goal has a datapoint for today and return the total value
function checkTodayDatapoint(username, token, goalSlug) {
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  return fetch(`https://www.beeminder.com/api/v1/users/${username}/goals/${goalSlug}/datapoints.json?auth_token=${token}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(datapoints => {
      // Calculate sum of all datapoints created today
      let todayTotal = 0;
      
      datapoints.forEach(datapoint => {
        const datapointDate = new Date(datapoint.timestamp * 1000);
        const datapointYear = datapointDate.getFullYear();
        const datapointMonth = String(datapointDate.getMonth() + 1).padStart(2, '0');
        const datapointDay = String(datapointDate.getDate()).padStart(2, '0');
        const datapointDateString = `${datapointYear}-${datapointMonth}-${datapointDay}`;
        
        if (datapointDateString === dateString) {
          todayTotal += parseFloat(datapoint.value) || 0;
        }
      });
      
      return todayTotal;
    })
    .catch(error => {
      console.error(`Error checking datapoints for ${goalSlug}:`, error);
      return 0;
    });
}

// Get goal urgency information
function getUrgencyInfo(goal) {
  // For lane: 0 = green, 1 = blue, 2 = orange, 3 = red
  const lane = goal.lane || 0;
  const color = goal.roadstatuscolor || 'green';
  
  // Get days until derailment
  let daysLeft = 0;
  if (goal.losedate) {
    const now = new Date();
    const loseDate = new Date(goal.losedate * 1000); // Convert to milliseconds
    daysLeft = Math.ceil((loseDate - now) / (1000 * 60 * 60 * 24));
  }
  
  // Get urgency label
  let urgencyLabel = '';
  if (daysLeft <= 0) {
    urgencyLabel = 'Due today!';
  } else if (daysLeft === 1) {
    urgencyLabel = 'Due tomorrow';
  } else if (daysLeft < 7) {
    urgencyLabel = `Due in ${daysLeft} days`;
  } else {
    urgencyLabel = `${daysLeft} days left`;
  }
  
  return {
    lane,
    color,
    daysLeft,
    urgencyLabel,
    className: `urgency-${color}`
  };
}

// Render goals in the container with default values for one-click logging
function renderGoals(goals, goalsTodayData) {
  goalsContainer.innerHTML = '';
  
  if (goals.length === 0) {
    goalsContainer.innerHTML = '<p>No goals found.</p>';
    return;
  }
  
  // Sort goals by urgency (most urgent first)
  goals.sort((a, b) => {
    const laneDiff = (a.lane || 0) - (b.lane || 0);
    if (laneDiff !== 0) return laneDiff;
    
    // If same lane, sort by days to derailment
    const aLoseDate = a.losedate || Number.MAX_SAFE_INTEGER;
    const bLoseDate = b.losedate || Number.MAX_SAFE_INTEGER;
    return aLoseDate - bLoseDate;
  });
  
  // Get default values for goals from storage
  browser.storage.sync.get('defaultValues')
    .then(result => {
      const defaultValues = result.defaultValues || {};
      
      goals.forEach(goal => {
        const defaultValue = defaultValues[goal.slug] || 1; // Default to 1 if not set
        const urgency = getUrgencyInfo(goal);
        const todayValue = goalsTodayData[goal.slug] || 0;
        
        // Check if today's value meets or exceeds the daily rate
        const dailyRate = goal.rate || 0;
        const meetsRate = todayValue >= dailyRate;
        
        const goalElement = document.createElement('div');
        goalElement.className = `goal-item ${urgency.className}`;
        
        goalElement.innerHTML = `
          <div class="goal-info">
            <div class="goal-header">
              <div class="goal-name" title="${goal.title || ''}">${goal.slug}</div>
              <div class="urgency-badge">${urgency.urgencyLabel}</div>
              ${meetsRate ? `<div class="today-indicator" title="Daily rate (${dailyRate}) met: ${todayValue}">✓</div>` : ''}
            </div>
          </div>
          <div class="quick-actions">
            <button class="quick-add" data-value="${defaultValue}">+${defaultValue}</button>
            <button class="custom-add">...</button>
          </div>
        `;
        
        // Get the quick add button
        const quickAddBtn = goalElement.querySelector('.quick-add');
        quickAddBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent the goalElement click from firing
          const value = quickAddBtn.getAttribute('data-value');
          
          // Create comment with tab information only for read-paper goal
          let comment = `Quick add via extension`;
          if (goal.slug === 'read-paper' && currentTab && currentTab.title) {
            comment += ` [Tab: ${currentTab.title}]`;
          }
          
          submitDatapoint(goal.slug, value, comment);
        });
        
        // Get the custom add button
        const customAddBtn = goalElement.querySelector('.custom-add');
        customAddBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Prevent the goalElement click from firing
          selectedGoal = goal;
          showDatapointForm(goal);
        });
        
        goalsContainer.appendChild(goalElement);
      });
    });
}

// Show datapoint submission form for selected goal
function showDatapointForm(goal) {
  selectedGoalName.textContent = goal.title || goal.slug;
  goalsContainer.style.display = 'none';
  datapointForm.style.display = 'block';
  valueInput.value = '';
  
  // Pre-fill comment with tab information only for read-paper goal
  let comment = '';
  if (goal.slug === 'read-paper' && currentTab && currentTab.title) {
    comment = `[Tab: ${currentTab.title}]`;
  }
  commentInput.value = comment;
  
  valueInput.focus();
}

// Cancel datapoint submission
cancelDatapointBtn.addEventListener('click', () => {
  datapointForm.style.display = 'none';
  goalsContainer.style.display = 'block';
  selectedGoal = null;
});

// Submit datapoint to Beeminder
submitDatapointBtn.addEventListener('click', () => {
  const value = valueInput.value.trim();
  
  if (!value) {
    showStatus('Please enter a value', 'error');
    return;
  }
  
  const comment = commentInput.value.trim();
  
  submitDatapoint(selectedGoal.slug, value, comment);
});

// Submit datapoint to Beeminder API
function submitDatapoint(goalSlug, value, comment) {
  const formData = new FormData();
  formData.append('auth_token', credentials.beeminderAuthToken);
  formData.append('value', value);
  
  if (comment) {
    formData.append('comment', comment);
  }
  
  const username = credentials.beeminderUsername;
  
  fetch(`https://www.beeminder.com/api/v1/users/${username}/goals/${goalSlug}/datapoints.json`, {
    method: 'POST',
    body: formData
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      showStatus(`Data point added successfully!`, 'success');
      
      // Refresh the goals to update the today indicator
      fetchGoals(username, credentials.beeminderAuthToken);
      
      // Return to goals view after a short delay
      setTimeout(() => {
        datapointForm.style.display = 'none';
        goalsContainer.style.display = 'block';
        statusMessage.className = '';
        statusMessage.textContent = '';
      }, 2000);
    })
    .catch(error => {
      console.error('Error submitting datapoint:', error);
      showStatus(`Error submitting data point: ${error.message}`, 'error');
    });
}

// Show status message
function showStatus(message, type) {
  statusMessage.textContent = message;
  statusMessage.className = type;
}
