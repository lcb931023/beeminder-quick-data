// Background script for the Beeminder Quick Data extension
// This script runs in the background and can handle data caching or other background tasks

// Check if notification should be shown to remind the user to add data
browser.alarms.create('checkForNotification', {
  periodInMinutes: 1440 // Check once a day
});

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkForNotification') {
    // You could implement notification logic here if needed
  }
});

// Listen for messages from the popup or options page
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getCredentials') {
    browser.storage.sync.get(['beeminderUsername', 'beeminderAuthToken'])
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        console.error('Error getting credentials:', error);
        sendResponse({error: error.message});
      });
    return true; // Required for async sendResponse
  }
});
