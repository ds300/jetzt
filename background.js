
if (window.chrome && chrome.contextMenus) {
  chrome.contextMenus.create({
    type: "normal", 
    title: "jetzt this!",
    contexts: ["selection"],
    onclick: function (ev) {
      document.write("jesus fookin christ");
    }
  })
}
