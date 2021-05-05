let savedSelections = [];
let boardId = null;
let appId = "3074457357398428082";
miro.onReady((async function() {
    boardId = (await miro.board.info.get()).id;
    loadData();
    matchWidgetsToSavedWidgets(await miro.board.widgets.get());
  }));

async function importJson() {
  let json = prompt("Please paste in the JSON you wish to import. This will overwrite your current saved groups.", "");
  try {
    let parsedJson = JSON.parse(json);
    savedSelections = parsedJson;
    let selectedWidgets = await miro.board.selection.get();
    let selection = {
      groupName : "MyGroup",
      widgets : selectedWidgets
    };
    updatePanel(selection);
  }
  catch (e) {
    alert("There was a problem parsing the JSON! Check the console for more information.");
    console.log("problem importing");
    console.log(e);
  }
}

async function exportJson() {
  try {
    navigator.clipboard.writeText(JSON.stringify(savedSelections)).then(function() {
      alert("Successfully copied JSON to clipboard");
    }, function() {
      alert("Something was wrong with the JSON");
      console.log("problem copying json");
    });
  }
  catch(e) {

    alert("Something was wrong with the JSON");
    console.log("problem stringifying JSON");
    console.log(e);
  }

}

async function saveSelection() {
  // When we save, we want the full data available from the API
  // not just what is returned from the selection updated system
  let selectedWidgets = await miro.board.selection.get();
  let selection = {
    groupName : "MyGroup",
    widgets : selectedWidgets
  };
  for (let widget of selectedWidgets) {
    if (!widget.metadata) widget.metadata = {};
    if (!widget.metadata[appId]) widget.metadata[appId] = {};
    if (!widget.metadata[appId].persistentId) {
      widget.metadata[appId].persistentId = Math.random() + "" + Math.random();
    }
  }
  miro.board.widgets.update(selectedWidgets);
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
      `<button class="stat-list__item-value miro-btn miro-btn--primary miro-btn--small" onclick="saveSelection();"><i class="fas fa-save"></i></button>`
    statView.appendChild(itemView);
    getContainer().appendChild(statView);
  }
  createSavedGroupsDiv('There are no saved groups.', savedSelections);
  saveData();
}

function clear() {
  const elements = getContainer().getElementsByClassName('stat-list__table')
  for (let i = savedSelections.length - 1; i >= 0; i--) {
    if (savedSelections[i] === null) {
      savedSelections.splice(i, 1);
    }
  }
  for (let i = elements.length - 1; i >= 0; i--) {
    elements.item(i).remove()
  }
}

function getContainer() {
  return document.getElementById('stat-container')
}

function saveData() {
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
    for (let key in data) {
      let item = data[key];
      if (item === null) continue;
      let itemView = document.createElement('div')
      let resetButtonId = "" + Math.random() + "-" + Math.random();
      let selectButtonId = "" + Math.random() + "-" + Math.random();
      let toTopButtonId = "" + Math.random() + "-" + Math.random();
      let toBottomButtonId = "" + Math.random() + "-" + Math.random();
      let deleteButtonId = "" + Math.random() + "-" + Math.random();
      let deleteGroupButtonId = "" + Math.random() + "-" + Math.random();
      let inputId = "" + Math.random() + "-" + Math.random();
      itemView.className = 'stat-list__item'
      itemView.innerHTML = `
      <div class="">
          <div class="miro-input-group miro-input-group--small">
          <input id="${inputId}" type="text" class="groupName miro-input miro-input--primary miro-input--small" value="${item.groupName}" placeholder="Selection Name">
          <button id="${deleteGroupButtonId}" class="miro-btn miro-btn--primary miro-btn--small"><i class="fas fa-folder-minus"></i></button>
        </div>
          <button id="${resetButtonId}" class="miro-btn miro-btn--primary miro-btn--small"><i class="fas fa-sync"></i></button>
          <button id="${selectButtonId}" class="miro-btn miro-btn--primary miro-btn--small"><i class="fas fa-mouse-pointer"></i></button>
          <button id="${deleteButtonId}" class="miro-btn miro-btn--primary miro-btn--small"><i class="fas fa-trash-alt"></i></button>
          <button id="${toTopButtonId}" class="miro-btn miro-btn--primary miro-btn--small"><i class="fas fa-arrow-up"></i></button>
          <button id="${toBottomButtonId}" class="miro-btn miro-btn--primary miro-btn--small"><i class="fas fa-arrow-down"></i></button>
      </div>`;
      statView.appendChild(itemView);
      document.getElementById(inputId).addEventListener('input', function(event) {
        item.groupName = event.target.value;
        saveData();
      });
      document.getElementById(selectButtonId).onclick = async function() {
        validatePersistentIds(item);
        await miro.board.selection.selectWidgets(item.widgets);
      };
      document.getElementById(deleteButtonId).onclick = async function() {
        validatePersistentIds(item);
        await miro.board.widgets.deleteById(item.widgets);
      };
      document.getElementById(toTopButtonId).onclick = async function() {
        validatePersistentIds(item);
        for(let widget of item.widgets) {
          miro.board.widgets.bringForward(widget);
        }
      };
      document.getElementById(toBottomButtonId).onclick = async function() {
        validatePersistentIds(item);
        for(let widget of item.widgets) {
          miro.board.widgets.sendBackward(widget);
        }
      };
      document.getElementById(deleteGroupButtonId).onclick = async function() {
        validatePersistentIds(item);
        delete data[key];
        // When we save, we want the full data available from the API
        // not just what is returned from the selection updated system
        let selectedWidgets = await miro.board.selection.get();
        let selection = {
          groupName : "MyGroup",
          widgets : selectedWidgets
        };
        updatePanel(selection);
      };
      document.getElementById(resetButtonId).onclick = async function() {
        let allWidgets = await miro.board.widgets.get();
        await validatePersistentIds(item, allWidgets);
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
          matchWidgetsToSavedWidgets(res, item);
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

function checkPersistentIdMatch(a, b) {
  return a.metadata &&
      a.metadata[appId] &&
      a.metadata[appId].persistentId &&
      b.metadata &&
      b.metadata[appId] &&
      b.metadata[appId].persistentId &&
      a.metadata[appId].persistentId == b.metadata[appId].persistentId;
}

async function validatePersistentIds(item, allWidgets) {
  if (!allWidgets)
    allWidgets = await miro.board.widgets.get();

  for (let savedWidget of item.widgets) {
    for (let boardWidget of allWidgets) {
      if (savedWidget.id !== boardWidget.id && checkPersistentIdMatch(savedWidget, boardWidget)) {
        savedWidget.id = boardWidget.id;
        break;
      }
    }
  }
}

function matchWidgetsToSavedWidgets(widgets, i) {
  let items = [i];
  if (i == null) {
    items = savedSelections;
  }
  for (let item of items) {
    // we have to match the widgets from the spawned ones
    // to the ones we have saved (for the reset function to work later)
    for (let newWidget of widgets) {
      let foundMatch = null;
      for (let savedWidget of item.widgets) {
        if (!checkPersistentIdMatch(newWidget, savedWidget))
          continue;
        foundMatch = savedWidget;
        break;
      }
      if (foundMatch != null) {
        foundMatch.id = newWidget.id;
      }
    }
  }
}


miro.onReady(() => {
  miro.addListener('SELECTION_UPDATED', async (e) => {
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
