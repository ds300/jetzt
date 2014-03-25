# Licensed under the Apache License v2.0.

# A copy of which can be found at the root of this distrubution in 
# the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0

# instruction types

class Word
  constructor: (@html, @wrap, @progress, @startNode, @offset) ->

class AsideStart
  constructor: (@id, @node, @type, @whatever) ->

class AsideEnd
  constructor: (@id)->

SENTENCE_START = {}
PARAGRAPH_START = {}
LONG_SPACE = {}
SHORT_SPACE = {}


window.exec = {}

window.exec.instructions =
  Word: Word
  AsideStart: AsideStarts
  AsideEnd: AsideEnd
  SENTENCE_START: SENTENCE_START
  PARAGRAPH_START: PARAGRAPH_START
  LONG_SPACE: LONG_SPACE
  SHORT_SPACE: SHORT_SPACE