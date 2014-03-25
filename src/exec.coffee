# Licensed under the Apache License v2.0.

# A copy of which can be found at the root of this distrubution in 
# the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0

# instruction types

class Word
  constructor: (@html, @progress, @startNode, @offset, @wrap, @modifier) ->

class AsideStart
  constructor: (@id, @node, @type, @whatever) ->

class AsideEnd
  constructor: (@id)->

class SentenceStart
class ParagraphStart
class LongSpace
class ShortSpace

SENTENCE_START = new SentenceStart
PARAGRAPH_START = new ParagraphStart
LONG_SPACE = new LongSpace
SHORT_SPACE = new ShortSpace


window.exec = {}

window.exec.instructions =
  Word: Word
  AsideStart: AsideStart
  AsideEnd: AsideEnd
  SENTENCE_START: SENTENCE_START
  PARAGRAPH_START: PARAGRAPH_START
  LONG_SPACE: LONG_SPACE
  SHORT_SPACE: SHORT_SPACE