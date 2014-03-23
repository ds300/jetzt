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
  new S.Stream -> 
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

  new S.Stream ->
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
#            in the original document. Used to indicate progress.
# @startNode is a node, probably a text node, in which the token's first
#            character can be found.
# @offset    is the number of characters from the start of the text contained by
#            @startnode at which this token lies (excluding whitespace)
# @styles    is an array of style sections for to compile the string into an
#            html fragment for display. This will most often be empty.
class AlignedToken
  constructor: (@string, @textEnd, @startNode, @offest, @styles) ->

  select: ->
      # first select the node this token starts on;
      range = window.document.createRange()
      range.selectNodeContents @startNode

      sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange range

      # get it's parsed text so we know how many whitespace chars it starts with
      base = countLeadingWhitespace sel.toString()

      # now collapse the selection to the start, move it to the token's offset,
      # and then extend it to the end of the token.
      sel.collapseToStart()

      for i in [0...@offset + base]
        sel.modify "move", "forward", "character"

      for i in [0...@string.length]
        sel.modify "extend", "forward", "character"

      sel

# special token for linefeeds.
LINEFEED =
  select: ->
    sel = window.getSelection()
    sel.removeAllRanges()
    sel

# streams are ordered first by start index (ASC), then by end index (ASC)
mergeSectionStreams = (a, b) ->
  asec = a.next()
  bsec = b.next()
  new S.Stream ->
    if asec? and bsec?
      if asec.start < bsec.start
        result = asec
        asec = a.next()
      else if asec.start > bsec.start
        result = bsec
        bsec = b.next()
      else if asec.end < bsec.end
        result = asec
        asec = a.next()
      else
        result = bsec
        bsec = b.next()
    else if asec?
      result = asec
      asec = a.next()
    else if bsec?
      result = bsec
      bsec = b.next()
    else result = @die()

    result


# break types
NONE      = -1   # e.g. <>token
ENCOMPASS = 0    # e.g. <token>
HEAD      = 1    # e.g. <to>ken
TAIL      = 2    # e.g. tok<en>
MIDRIFF   = 3    # e.g. to<k>en

discoverBreakType = (token, section) ->
  if section.start <= token.start
    if section.end <= token.start
      NONE
    else if section.end < token.end
      HEAD
    else
      ENCOMPASS
  else
    if section.start >= token.end
      NONE
    else if section.end < token.end
      MIDRIFF
    else
      TAIL

# breaks a token around the bounds of some section. if filterMode is true,
# does not include the part of the token which was inside the section.
# e.g.
#     say we have the word 'doppelganger' and a section which spans the
#     chracters 'elg'
#
#     with filterMode false, we get back the array like ['dopp', 'elg', 'anger']
#     but with filterMode true, only ['dopp', 'anger']
breakToken = (token, section, filterMode = false, breakType) ->
  breakType = if breakType? then breakType else discoverBreakType token, section

  if breakType = NONE
    [token]
  else if breakType = ENCOMPASS
    if filterMode
      []
    else
      [token]
  else
    s = section
    t = token
    # start and end indices are relative to original text, not the token, so
    # we need to offset them by the start index of the token to do all the
    # string slicing
    offset = (index) -> index - t.start
    result = []

    switch breakType
      when HEAD
        if not filterMode
          result.push
            string : t.string[0...offset(s.end)]
            start  : t.start
            end    : s.end
        result.push
          string : t.string[offset(s.end)..]
          start  : s.end
          end    : t.end
      when TAIL
        result.push
          string : t.string[0...offset(s.start)]
          start  : t.start
          end    : s.start
        if not filterMode
          result.push
            string : t.string[offset(s.start)..]
            start  : s.start
            end    : t.end
      when MIDRIFF
        result.push
          string : t.string[0...offset(s.start)]
          start  : t.start
          end    : s.start
        if not filterMode
          string : t.string[offset(s.start)...offset(s.end)]
          start  : s.start
          end    : s.end
        result.push
          string : t.string[offset(s.end)..]
          start  : s.end
          end    : t.end

    result


# take a stream of token sections and node/filter sections, then smoosh them
# together with a special blend of fresh algorithms and juicy laziness
alignedTokenStream = (tokens, sections) ->

  nextSection = sections.next()

  stack = []

  # when breaking tokens apart for filters, semantic nodes, or word length,
  # we need a way to push them back into the token stream and deal with them as
  # if they are just normal tokens coming in (otherwise too much nasty logic
  # is required). So we do that, but also push the sections back into the
  # relevant stream too, to make sure that nothing gets missed.
  pushbackTokens = (tkns) ->
    tokens = tokens.pushBack tkns

    # also push back sections from stack
    pbSections = stack
    pbSections.push nextSection
    nextSection = pbSections.shift()

    sections = sections.pushBack pbSections

    stack = []

  new S.Stream ->
    if !(nextToken = tokens.next())? or !nextSection?
      @die()
    else if nextToken.string.match /\n+/
      LINEFEED
    else

      # construct the appropriate stack for the token

      # first get rid of any sections which end before the token begins
      while stack.length and stack[stack.length-1].end <= nextToken.start
        stack.pop()

      # now get rid of any sections from the stream which end before the token
      # begins (this only maybe happens after filtering)
      while nextSection? and nextSection.end <= nextToken.start
        nextSection = sections.next()

      if !nextSection?
        return @die()

      # now pull in sections until they start after the token ends
      while nextSection.start < nextToken.end
        stack.push nextSection
        nextSection = sections.next()

      # now apply regex filters and node breakers
      for section in stack
        if section.filter
          bt = discoverBreakType nextToken, section
          if bt isnt NONE
            if bt isnt ENCOMPASS
              pushbackTokens breakToken nextToken, section, true, bt
            # if bt *is* encompass, we just drop this token
            return @next()
        else if section.node?.nodeName of BREAKER_NODES
          bt = discoverBreakType nextToken, section
          if bt > ENCOMPASS
            pushbackTokens breakToken nextToken, section
            return @next()




