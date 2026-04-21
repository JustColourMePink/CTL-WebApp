import scheduleData from './schedule.json';

// State
let schedule = [];
let mySelection = JSON.parse(localStorage.getItem('ctl-schedule')) || {};

// Elements
const tabBuild = document.getElementById('tab-build');
const tabMy = document.getElementById('tab-my');
const viewBuild = document.getElementById('view-build');
const viewMy = document.getElementById('view-my');
const buildContainer = document.getElementById('schedule-options-container');
const myContainer = document.getElementById('my-schedule-container');

// Initialization
function init() {
  schedule = scheduleData;
  autoAssignSingleEvents();
  renderBuildView();
  setupTabs();
}

function autoAssignSingleEvents() {
  let changed = false;
  schedule.forEach(slot => {
    if (slot.isSingleEvent) {
      const eventToAssign = slot.events[0];
      // If not already assigned or assigned differently
      if (!mySelection[slot.time] || mySelection[slot.time].title !== eventToAssign.title) {
        mySelection[slot.time] = eventToAssign;
        changed = true;
      }
    }
  });
  
  if (changed) {
    saveSelection();
  }
}

function saveSelection() {
  localStorage.setItem('ctl-schedule', JSON.stringify(mySelection));
}

function setupTabs() {
  const handleBuildTab = () => {
    if (tabBuild.classList.contains('active')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      activateBuildTab();
      // Scroll to top when switching views as a courtesy
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleMyTab = () => {
    if (tabMy.classList.contains('active')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      activateMyTab();
      // Scroll to top when switching views
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  tabBuild.addEventListener('click', handleBuildTab);
  tabBuild.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleBuildTab();
    }
  });

  tabMy.addEventListener('click', handleMyTab);
  tabMy.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleMyTab();
    }
  });
}

function activateBuildTab() {
  tabBuild.classList.add('active');
  tabBuild.setAttribute('aria-selected', 'true');
  tabMy.classList.remove('active');
  tabMy.setAttribute('aria-selected', 'false');
  viewBuild.classList.add('active');
  viewMy.classList.remove('active');
  viewBuild.classList.remove('hidden');
  viewMy.classList.add('hidden');
  renderBuildView();
}

function activateMyTab() {
  tabMy.classList.add('active');
  tabMy.setAttribute('aria-selected', 'true');
  tabBuild.classList.remove('active');
  tabBuild.setAttribute('aria-selected', 'false');
  viewMy.classList.add('active');
  viewBuild.classList.remove('active');
  viewMy.classList.remove('hidden');
  viewBuild.classList.add('hidden');
  renderMySchedule();
}

function renderBuildView() {
  buildContainer.innerHTML = '';
  
  schedule.forEach(slot => {
    const block = document.createElement('div');
    block.className = 'timeslot-block';
    
    // Using section & heading for screen reader navigation
    block.setAttribute('role', 'region');
    block.setAttribute('aria-label', `Options for ${slot.time}`);
    
    const header = document.createElement('h2');
    header.className = 'timeslot-header';
    header.textContent = slot.time;
    block.appendChild(header);
    
    const grid = document.createElement('div');
    grid.className = 'events-grid';
    
    // Group events by room just for the layout
    slot.events.forEach(event => {
      const roomCol = document.createElement('div');
      roomCol.className = 'room-col';
      
      const roomHeader = document.createElement('h3');
      roomHeader.className = 'room-header';
      roomHeader.textContent = event.room;
      roomCol.appendChild(roomHeader);
      
      const card = document.createElement('div');
      card.className = 'event-card';
      
      if (slot.isSingleEvent) {
        card.classList.add('single-event');
        const badge = document.createElement('div');
        badge.className = 'event-badge';
        badge.textContent = '★';
        badge.setAttribute('aria-label', 'Auto-assigned single event');
        card.appendChild(badge);
        // Make it clear for screen readers without being a button layout
        card.setAttribute('aria-label', `${event.title} in ${event.room}, Mandatory Event`);
        card.tabIndex = 0;
      } else {
        card.setAttribute('role', 'button');
        card.tabIndex = 0;
        
        let isSelected = false;
        // Normal interactive card
        if (mySelection[slot.time] && mySelection[slot.time].title === event.title) {
          card.classList.add('selected');
          isSelected = true;
        }
        card.setAttribute('aria-pressed', isSelected.toString());
        
        const actionToggle = () => toggleSelection(slot.time, event);
        card.addEventListener('click', actionToggle);
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            actionToggle();
          }
        });
      }
      
      const title = document.createElement('div');
      title.className = 'event-title';
      title.textContent = event.title;
      card.appendChild(title);
      
      if (event.presenter) {
        const presenter = document.createElement('div');
        presenter.className = 'event-presenter';
        presenter.textContent = event.presenter;
        card.appendChild(presenter);
      }
      
      if (event.description) {
        const detailsWrapper = document.createElement('details');
        detailsWrapper.className = 'event-details-wrapper';
        detailsWrapper.addEventListener('click', (e) => e.stopPropagation());
        
        const summary = document.createElement('summary');
        summary.className = 'event-summary';
        summary.textContent = 'View Description';
        
        const desc = document.createElement('div');
        desc.className = 'event-desc';
        desc.textContent = event.description;
        
        detailsWrapper.appendChild(summary);
        detailsWrapper.appendChild(desc);
        card.appendChild(detailsWrapper);
      }
      
      roomCol.appendChild(card);
      grid.appendChild(roomCol);
    });
    
    block.appendChild(grid);
    buildContainer.appendChild(block);
  });
}

function toggleSelection(time, event) {
  if (mySelection[time] && mySelection[time].title === event.title) {
    // Deselect if already selected
    delete mySelection[time];
  } else {
    // Select this one
    mySelection[time] = event;
  }
  saveSelection();
  renderBuildView(); // Re-render to update selected classes
}

function renderMySchedule() {
  myContainer.innerHTML = '';
  
  // Create an array sorted by the original schedule order showing all slots
  const chronologicalSelection = [];
  schedule.forEach(slot => {
    chronologicalSelection.push({
      time: slot.time,
      event: mySelection[slot.time] ? mySelection[slot.time] : null
    });
  });
  
  const list = document.createElement('div');
  list.className = 'my-schedule-list';
  
  chronologicalSelection.forEach(item => {
    const eventEl = document.createElement('div');
    eventEl.className = 'my-event-item';
    
    const timeEl = document.createElement('div');
    timeEl.className = 'my-event-time';
    timeEl.textContent = item.time;
    
    const details = document.createElement('div');
    details.className = 'my-event-details';
    
    if (!item.event) {
      eventEl.style.opacity = '0.6';
      details.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">No event selected for this time. Go back to 'Build Schedule' to choose one!</span>`;
    } else {
      const room = document.createElement('div');
      room.className = 'my-event-room';
      room.textContent = item.event.room;
      
      const title = document.createElement('div');
      title.className = 'my-event-title';
      title.textContent = item.event.title;
      
      details.appendChild(room);
      details.appendChild(title);
      
      if (item.event.presenter) {
        const presenter = document.createElement('div');
        presenter.className = 'my-event-presenter';
        presenter.textContent = item.event.presenter;
        details.appendChild(presenter);
      }
      
      if (item.event.description) {
        const detailsWrapper = document.createElement('details');
        detailsWrapper.className = 'event-details-wrapper';
        
        const summary = document.createElement('summary');
        summary.className = 'event-summary';
        summary.textContent = 'View Description';
        
        const desc = document.createElement('div');
        desc.className = 'my-event-desc';
        desc.textContent = item.event.description;
        
        detailsWrapper.appendChild(summary);
        detailsWrapper.appendChild(desc);
        details.appendChild(detailsWrapper);
      }
    }
    
    eventEl.appendChild(timeEl);
    eventEl.appendChild(details);
    
    list.appendChild(eventEl);
  });
  
  myContainer.appendChild(list);
}

// Start app
document.addEventListener('DOMContentLoaded', init);
