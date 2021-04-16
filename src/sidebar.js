let savedSelections = [];
let selection = null;

async function saveSelection() {
  // When we save, we want the full data available from the API
  // not just what is returned from the selection updated system
  selection = await miro.board.selection.get();
  selection.name = "MyGroup";
  savedSelections.push(selection);
  updatePanel(selection);
}

function updatePanel(sel) {
  selection = sel;
  clear()
  if (sel.length > 0) {
    const statView = document.createElement('div')
    statView.className = 'stat-list__table'
    let itemView = document.createElement('div')
    itemView.className = 'stat-list__item';
    itemView.innerHTML = 
      `<span class="stat-list__item-name">${sel.length} elements</span>` +
      `<button class="stat-list__item-value miro-btn miro-btn--primary miro-btn--small" onclick="saveSelection();">save</button>`
    statView.appendChild(itemView)
    getContainer().appendChild(statView)
  }
  createSavedGroupsDiv('There are no saved groups.', savedSelections);
}

function clear() {
  const elements = getContainer().getElementsByClassName('stat-list__table')
  for (let i = elements.length - 1; i >= 0; i--) {
    elements.item(i).remove()
  }
}

function getContainer() {
  return document.getElementById('stat-container')
}

function createSavedGroupsDiv(emptyText, data) {
  const statView = document.createElement('div')
  statView.className = 'stat-list__table'
  getContainer().appendChild(statView);

  if (data.length === 0) {
    const emptyView = document.createElement('div')
    emptyView.className = 'stat-list__empty'
    emptyView.innerText = emptyText
    statView.appendChild(emptyView)
  } else {
    for (let item of data) {
      let itemView = document.createElement('div')
      let randId = "" + Math.random() + "-" + Math.random();
      itemView.className = 'stat-list__item'
      itemView.innerHTML = `
      <div class="miro-input-group miro-input-group--medium">
          <input type="text" class="miro-input miro-input--primary" value="${item.name}" placeholder="Selection Name">
          <button id="${randId}" class="miro-btn miro-btn--primary">Spawn</button>
      </div>`;
      statView.appendChild(itemView);
      document.getElementById(randId).onclick = function() {
        console.log(item);
        miro.board.widgets.create(item);
      };
    }
  }
  return statView;
}


miro.onReady(() => {
  miro.addListener('SELECTION_UPDATED', (e) => {
    updatePanel(e.data)
  })
  miro.board.selection.get().then(updatePanel)
})
