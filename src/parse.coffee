# Licensed under the Apache License v2.0.

# A copy of which can be found at the root of this distrubution in 
# the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0

S = window.jetzt.streams

# Take a dom range and get it's string contents
# This uses window.getSelection() to avoid non-visible CDATA being picked up
range2Str = (range) ->
  sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange range
  result = sel.toString()
  sel.removeAllRanges()
  result

# range2str wrapper for dom nodes
elem2str = (elem) ->
  range = window.document.createRange()
  range.selectNodeContents elem
  range2Str range

# get a stream of string matches in a piece of text
regexSectionStream = (regex, text) ->
  new S.Stream () -> 
    match = regex.match text
    if match
      string: match[0]
      start: match.index
      end: match.index + match[0].length

# get a heirarchical stream mapping nodes to start/end positions in the text
# they contain
nodeSectionStream = (node, text, index = 0) ->
  text = text or elem2str node

  stack = [node]

  new S.Stream () ->
    if not stack.length
      @die()
    else
      node = stack.pop()

      string = elem2str(node).trim()

      start = text.indexOf string index

      if node.childNodes?.length
        # push the kids in reverse order !important
        stack.push kid for kid in node.childNodes by -1
      else
        # done with this node, ok to bump index
        index = start + str.length
      
      return {
        node: node
        string: string
        start: start
        end: start + str.length
      }


sectionsIntersect = (a, b) ->
  not (a.start > b.end || b.start > a.end)

countLeadingWhitespace = (str) ->
  str.match(/^\s+/)?[0].length or 0

# @string    is the text of the token
# @textEnd   is the index of the character immediately following this token
#            in the original document
# @startNode is a node, probably a text node, in which the token's first
#            character can be found.
# @offset    is the number of characters from the start of the text contained by
#            @startnode at which this token lies (excluding whitespace)
# @styles    is an array of style sections for to compile the string into an
#            html fragment for display. This will most often be empty.
class Token
  constructor: (@string, @textEnd, @startNode, @offest, @styles) ->

  select: () ->
      # first select the node this token starts on;
      range = window.document.createRange()
      range.selectNodeContents @startNode

      sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange range

      # get it's parsed text so we know how many whitespace chars it starts with
      base = numLeadingWhitespaceChars sel.toString()

      # now collapse the selection to the start, move it to the token's offset,
      # and then extend it to the end of the token.
      sel.collapseToStart()

      sel.modify "move", "forward", "character" for i in [0...@offset + base]

      sel.modify "extend", "forward", "character" for i in [0...@string.length]

      return sel;


# take a stream of token sections and node/filter sections, then smoosh them
# together with a special blend of fresh algorithms and juicy laziness
tokenStream = (tokens, sections) ->

