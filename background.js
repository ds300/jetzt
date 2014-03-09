chrome.browserAction.onClicked.addListener(function(tab) {
  console.log('Speed-reading in ' + tab.url);
  chrome.tabs.executeScript(null,{
    code: 'window.jetzt.select()'
  });
});