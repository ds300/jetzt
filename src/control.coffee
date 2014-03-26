killEvent = (ev) ->
  ev.preventDefault()
  ev.stopImmediatePropagation()
  return
jetzt = window.jetzt
H = jetzt.helpers
config = jetzt.config
control = {}
jetzt.control = control

###
hooks an executor up to keyboard controls.
###
control.keyboard = (executor) ->
  jetzt.view.reader.onKeyDown (ev) ->
    return  if ev.ctrlKey or ev.metaKey
    
    # handle custom keybindings eventually
    switch ev.keyCode
      when 27 #esc
        killEvent ev
        jetzt.quit()
      when 38 #up
        killEvent ev
        config.adjustWPM +10
      when 40 #down
        killEvent ev
        config.adjustWPM -10
      when 37 #left
        killEvent ev
        if ev.altKey
          executor.prevParagraph()
        else
          executor.prevSentence()
      when 39 #right
        killEvent ev
        if ev.altKey
          executor.nextParagraph()
        else
          executor.nextSentence()
      when 32 #space
        killEvent ev
        executor.toggleRunning()
      # =/+ (MSIE, Safari, Chrome)
      # =/+ (Firefox, numpad)
      when 187, 107, 61 # =/+ (Firefox, Opera)
        killEvent ev
        config.adjustScale 0.1
      # -/_ (numpad, Opera, Firefox)
      # -/_ (MSIE, Safari, Chrome)
      when 109, 189, 173 # -/_ (Firefox)
        killEvent ev
        config.adjustScale -0.1
      when 48 #0 key, for changing the theme
        killEvent ev
        config "dark", not config("dark")
      when 191 # / and ?
        killEvent ev
        config "show_message", not config("show_message")

  return

window.addEventListener "keydown", (ev) ->
  if not jetzt.isOpen() and ev.altKey and ev.keyCode is 83
    ev.preventDefault()
    jetzt.select()
  return
