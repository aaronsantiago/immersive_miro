let savedSelections = [];
let boardId = null;
miro.onReady((async function() {
    boardId = (await miro.board.info.get()).id;
    loadData();
  }));

async function saveSelection() {
  // When we save, we want the full data available from the API
  // not just what is returned from the selection updated system
  let selectedWidgets = await miro.board.selection.get();
  let selection = {
    groupName : "MyGroup",
    widgets : selectedWidgets
  };
  savedSelections.push(selection);
  updatePanel(selection);
}

function updatePanel(sel) {
  clear();
  if (sel.widgets.length > 0) {
    const statView = document.createElement('div')
    statView.className = 'stat-list__table'
    let itemView = document.createElement('div')
    itemView.className = 'stat-list__item';
    itemView.innerHTML = 
      `<span class="stat-list__item-name">${sel.widgets.length} elements</span>` +
      `<button class="stat-list__item-value miro-btn miro-btn--primary miro-btn--small" onclick="saveSelection();">save</button>`
    statView.appendChild(itemView)
    getContainer().appendChild(statView)
  }
  createSavedGroupsDiv('There are no saved groups.', savedSelections);
  saveData();
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

function saveData() {
  console.log(savedSelections);
  console.log(JSON.stringify(savedSelections));
  console.log('immerseData_' + boardId);
  localStorage.setItem('immerseData_' + boardId, JSON.stringify(savedSelections));
}

function loadData() {
  savedSelections = JSON.parse(localStorage.getItem('immerseData_' + boardId));
  if(savedSelections == null) {
    savedSelections = [];
  }
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
      let buttonId = "" + Math.random() + "-" + Math.random();
      let inputId = "" + Math.random() + "-" + Math.random();
      itemView.className = 'stat-list__item'
      itemView.innerHTML = `
      <div class="miro-input-group miro-input-group--medium">
          <input id="${inputId}" type="text" class="miro-input miro-input--primary" value="${item.groupName}" placeholder="Selection Name">
          <button id="${buttonId}" class="miro-btn miro-btn--primary">Spawn/Reset</button>
      </div>`;
      statView.appendChild(itemView);
      document.getElementById(inputId).addEventListener('input', function(event) {
        item.groupName = event.target.value;
        saveData();
      });
      document.getElementById(buttonId).onclick = async function() {
        let allWidgets = await miro.board.widgets.get();

        let nonexistentWidgets = [];
        let existentWidgets = [];
        let allWidgetsFound = true;
        for (let savedWidget of item.widgets) {
          let widgetFound = false;
          for (let boardWidget of allWidgets) {
            if (savedWidget.id === boardWidget.id) {
              existentWidgets.push(savedWidget);
              widgetFound = true;
              break;
            }
          }
          if (!widgetFound) {
            nonexistentWidgets.push(savedWidget);
          }
        }
        // if there are some missing widgets, lets spawn them
        if (nonexistentWidgets.length > 0) {
          let res = await miro.board.widgets.create(nonexistentWidgets);
          // we have to match the widgets from the spawned ones
          // to the ones we have saved (for the reset function to work later)
          for (let newWidget of res) {
            let foundMatch = null;
            for (let savedWidget of item.widgets) {
              if (newWidget.type != savedWidget.type) {
                continue;
              }
              if (newWidget.type == "IMAGE" && 
                  newWidget.url != savedWidget.url) {
                continue;
              }
              else if (newWidget.text != savedWidget.text) {
                continue;
              }
              if (Math.abs(newWidget.x - savedWidget.x) > .01) {
                continue;
              }
              if (Math.abs(newWidget.y - savedWidget.y) > .01) {
                continue;
              }
              if (Math.abs(newWidget.rotation - savedWidget.rotation) > .01) {
                continue;
              }
              if (Math.abs(newWidget.scale - savedWidget.scale) > .01) {
                continue;
              }
              foundMatch = savedWidget;
              break;
            }
            // lets copy the new values to our saved widget
            if (foundMatch != null) {
              Object.assign(foundMatch, newWidget);
            }
            else {
              console.log("match not found!", savedWidget);
            }
          }
        }
        if (existentWidgets.length > 0) {
          // lets strip the URLs so the images don't reload
          let updateWidgetList = []
          for (let existentWidget of existentWidgets) {
            let newWidget = {};
            Object.assign(newWidget, existentWidget);
            if (newWidget.hasOwnProperty("url")) delete newWidget["url"];
            updateWidgetList.push(newWidget);
          }
          miro.board.widgets.update(updateWidgetList);
        }
      };
    }
  }
  return statView;
}


miro.onReady(() => {
  miro.addListener('SELECTION_UPDATED', (e) => {
    let selection = {
      groupName : "MyGroup",
      widgets : e.data
    };
    updatePanel(selection);
  });
  (async function() {
    let selectedWidgets = await miro.board.selection.get();
    let selection = {
      groupName : "MyGroup",
      widgets : selectedWidgets
    };
    updatePanel(selection);
  })();
})
