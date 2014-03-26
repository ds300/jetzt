# Licensed under the Apache License v2.0.

# A copy of which can be found at the root of this distrubution in 
# the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0

# if you add any properties to themes, make sure to bump this

# put more themes here

# Don't commit changes to these without prior approval please

# if we change config structure in future versions, having this means
# we can update users' persisted configs to match.

###
STATE **
###

# This is where we store the options for the current instance of jetzt.
# The identity of the object never changes.

# list of folks to notify of changes
announce = ->
  listeners.forEach (cb) ->
    cb()
    return

  return

# recursive lookup. Like clojure's get-in;
lookup = (map, keyPath) ->
  throw new Error("No keys specified.")  if keyPath.length is 0
  key = keyPath[0]
  if keyPath.length is 1
    console.warn "config lookup: no key '" + key + "'"  unless map.hasOwnProperty(key)
    map[key]
  else
    submap = map[key]
    if H.realTypeOf(submap) isnt "Object"
      console.warn "config lookup: no key '" + key + "'"
      return
    else
      lookup submap, keyPath.slice(1)

# recursive put. Like clojure's assoc-in
put = (map, keyPath, val) ->
  throw new Error("No keys specified.")  if keyPath.length is 0
  key = keyPath[0]
  if keyPath.length is 1
    map[key] = val
  else
    submap = map[key]
    if H.realTypeOf(submap) isnt "Object"
      submap = {}
      map[key] = submap
    _put submap, keyPath.slice(1), val
  return

###
BACKEND **
###

# the backend is a swappable object with two methods, get and set. 
# get takes a cb and should invoke the callback, supplying the persisted
# JSON if available, or some falsey value if not. Set takes some json and
# presumably puts it somewhere. Or not. whatevs.

# It is initialised with a localStorage placeholder for the bookmarklet and
# demo page.

###
(DE)SERIALISATION **
###
persist = ->
  configBackend.set JSON.stringify(options)
  return
unpersist = (json) ->
  try
    opts = JSON.parse(json or "{}")
    repersist = false
    unless opts.config_version is CONFIG_VERSION
      
      # update custom themes
      if opts.custom_themes
        H.keys(opts.custom_themes).forEach (id) ->
          customTheme = opts.custom_themes[id]
          opts.custom_themes[id] = H.recursiveExtend(DEFAULT_THEMES.Classic, customTheme)
          return

      opts.config_version = CONFIG_VERSION
      repersist = true
    H.recursiveExtend options, opts
    window.jazz = options
    repersist and persist()
    announce()
  catch e
    throw new Error("corrupt config json", e)
  return
jetzt = window.jetzt
H = jetzt.helpers
CONFIG_VERSION = 0
DEFAULT_THEMES = [
  name: "Classic"
  dark:
    backdrop_opacity: "0.86"
    colors:
      backdrop: "#000000"
      background: "#303030"
      foreground: "#E0E0E0"
      message: "#909090"
      pivot: "#73b5ee"
      progress_bar_background: "#000000"
      progress_bar_foreground: "#3a5566"
      reticle: "#656565"
      wrap_background: "#404040"
      wrap_foreground: "#a1a1a1"

  light:
    backdrop_opacity: "0.07"
    colors:
      backdrop: "black"
      background: "#fbfbfb"
      foreground: "#333333"
      message: "#929292"
      pivot: "#E01000"
      progress_bar_background: "black"
      progress_bar_foreground: "#00c00a"
      reticle: "#efefef"
      wrap_background: "#f1f1f1"
      wrap_foreground: "#666"
]
DEFAULT_MODIFIERS =
  normal: 1
  start_clause: 1
  end_clause: 1.8
  start_sentence: 1.3
  end_sentence: 2.2
  start_paragraph: 2.0
  end_paragraph: 2.8
  short_space: 1.5
  long_space: 2.2

DEFAULT_OPTIONS =
  config_version: CONFIG_VERSION
  target_wpm: 400
  scale: 1
  dark: false
  selected_theme: 0
  show_message: false
  selection_color: "#FF0000"
  modifiers: DEFAULT_MODIFIERS
  font_family: "Menlo, Monaco, Consolas, monospace"
  custom_themes: []

options = H.clone(DEFAULT_OPTIONS)
listeners = []
KEY = "jetzt_options"
configBackend =
  get: (cb) ->
    json = localStorage.getItem(KEY)
    if json
      cb "{}"
    else
      cb json
    return

  set: (json) ->
    localStorage.setItem KEY, json
    return


###
jetzt.config
get and set config variables.

e.g.
jetzt.config("cheese", "Edam")

sets the "cheese" option to the string "Edam"

jetzt.config("cheese")

=> "edam"

It also has support for key paths

jetzt.config(["cheese", "color"], "blue")
jetzt.config(["cheese", "name"], "Stilton")

jetzt.config(["cheese", "name"])

=> "Stilton"

jetzt.config("cheese")

=> {color: "blue", name: "Stilton"}
###
config = (keyPath, val) ->
  keyPath = [keyPath]  if typeof keyPath is "string"
  if arguments.length is 1
    lookup options, keyPath
  else
    put options, keyPath, val
    persist()
    announce()
  return

jetzt.config = config
config.DEFAULTS = H.clone(DEFAULT_OPTIONS)
config.DEFAULT_THEMES = H.clone(DEFAULT_THEMES)

###
takes a callback and invokes it each time an option changes
returns a function which, when invoked, unregisters the callback
###
config.onChange = (cb) ->
  listeners.push cb
  ->
    H.removeFromArray listeners, cb
    return


###
Set the config 'backend' store. Should be an object with methods
void get(cb(opts))
void set(opts)
###
config.setBackend = (backend) ->
  configBackend = backend
  @refresh()
  announce()
  return


###
Triggers an automatic reload of the persisted options
###
config.refresh = (cb) ->
  configBackend.get (json) ->
    unpersist json
    cb and cb()
    return

  return

config.getSelectedTheme = ->
  DEFAULT_THEMES[options.selected_theme] or DEFAULT_THEMES[0]


###
convenience function for finding the highest of two modifiers.
###
config.maxModifier = (a, b) ->
  (if this([
    "modifiers"
    a
  ]) > this([
    "modifiers"
    b
  ]) then a else b)

config.adjustWPM = (diff) ->
  options.target_wpm = H.clamp(100, options.target_wpm + diff, 1500)
  announce()
  persist()
  return

config.adjustScale = (diff) ->
  options.scale = H.clamp(0, options.scale + diff, 1)
  return


###
might be neccessary to trigger a save manually
###
config.save = ->
  persist()
  return


# load the options from the default config backend to get the ball rolling
config.refresh()