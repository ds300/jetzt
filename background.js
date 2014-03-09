chrome.browserAction.onClicked.addListener(function(tab) {
  console.log('Speed-reading in ' + tab.url);
  chrome.tabs.executeScript(null,{
    code: 'window.jetzt.select()'
  });
});

chrome.contextMenus.create({
	"id": "spritzMenu"
	,"title": "OpenSpritz this"
	,"contexts": [
		"selection"
	]
});

chrome.contextMenus.onClicked.addListener(function(data) {
  if (data.menuItemId == 'spritzMenu') {
    chrome.tabs.executeScript(null,{
      code: 'window.jetzt.select()'
    });
  }
});
