chrome.browserAction.onClicked.addListener(function(tab) {
  console.log('Speed-reading in ' + tab.url);
  chrome.tabs.executeScript(null,{
    code: 'window.jetzt.select()'
  });
});

chrome.contextMenus.create({
	"id": "jetztMenu"
	,"title": "Speed-read this with Jetzt"
	,"contexts": [
		"selection"
	]
});

chrome.contextMenus.onClicked.addListener(function(data) {
  if (data.menuItemId == 'jetztMenu') {
    chrome.tabs.executeScript(null,{
      code: 'window.jetzt.select()'
    });
  }
});
