# Licensed under the Apache License v2.0.

# A copy of which can be found at the root of this distrubution in
# the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0

S = window.jetzt.streams

# Take a dom range and get it's string contents
# This uses window.getSelection() to avoid non-visible (P)CDATA being picked up
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
    match = regex.exec text
    if match
      string: match[0]
      start: match.index
      end: match.index + match[0].length

filterSectionStream = (sectionStream) ->
  S.map ((section)-> section.type = "filter"; section), sectionStream

ASIDE_NODES =
  "ASIDE" : true
  "IMG"   : true

BREAKER_NODES = {}

breakerNodeTypes = ["LI", "DT", "DD", "IMG", "DIV", "PRE", "TABLE", "BLOCKQUOTE"
                    , "FORM", "PRE", "H1", "H2", "H3", "H4", "H5", "H6"]

for nodeType in breakerNodeTypes
  BREAKER_NODES[nodeType] = true

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

      start = text.indexOf string, index

      if node.childNodes?.length
        # push the kids in reverse order !important
        stack.push kid for kid in node.childNodes by -1
      else
        # done with this node, ok to bump index
        index = start + string.length

      if node.___jetzt_filter
        type = "filter"
      else if node.___jetzt_aside or node.nodeName of ASIDE_NODES
        type = "aside"

      return {
        node: node
        type: type or "node"
        string: string
        start: start
        end: start + string.length
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


wordIsTooLong = (word) ->
  word.length > 13 or word.length > 9 and word.indexOf("-") > -1

splitLongWord = (word) ->
  result = []

  split = (w) ->
    if not wordIsTooLong w
      result.push w
    else
      # try to get individual sections down to 6 characters
      numPartitions = Math.ceil w.length / 7
      partitionLength = Math.floor w.length / numPartitions
      for i in [0...numPartitions-1]
        result.push w[i*partitionLength...(i+1)*partitionLength]

      # and finally the last part
      result.push w[(numPartitions-1)*partitionLength..]

  if word[1...-1].indexOf("-") > -1
    split part for part in word.split("-")
  else
    split word

  result

splitLongToken = (token) ->
  wordParts = splitLongWord token.string
  index = 0
  result = []
  for part in wordParts
    index = token.string.indexOf part, index
    result.push
      string : part + "-"
      start  : index + token.start
      end    : index + token.start + part.length # don't include the '-'
    index += part.length

  ## remove that last dash
  last = result[result.length-1]
  last.string = last.string[...-1]
  result


# map from node names to start/end tag renderers
STYLE_NODES = {}

standardStyleTypes = ["EM", "STRONG", "SUP", "SUB", "S", "CODE"]

for type in standardStyleTypes
  ltype = type.toLowerCase()
  STYLE_NODES[type] =
    startTag: -> "<#{ltype}>"
    endTag: -> "</#{ltype}>"

STYLE_NODES["A"] =
  startTag: (node) -> "<a href='#{node.href}'>"
  endTag: -> "</a>"

wrapfn = (left, right, style) ->
  wrap = left: left, right: right
  -> wrap

WRAP_NODES =
  BLOCKQUOTE: wrapfn "‘", "’"
  H1: wrapfn "•••", "•••", "strong"
  H2: wrapfn "••", "••", "strong"
  H3: wrapfn "•", "•", "strong"
  H4: wrapfn "•", "•"
  H5: wrapfn "•", "•"
  H6: wrapfn "•", "•"
  LI: (node) ->
    parentType = node.parentNode.nodeName
    if parentType is "UL"
      left: "•", right: ""
    else if parentType is "OL"
      # oh jeez, we have to find its index
      idx = 0
      n = node
      while (n = n.previousSibling)?
        idx++

      p = node.parentNode

      left: getOrderedListBullet(idx, p.start, p.type), right: ""

getOrderedListBullet = (idx, start=1, type="1") ->
  return idx + start + "."
  # TODO. make this good. It turns out to be super complex if you take negative
  # numbers and li.value/type attributes into account.


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
    if !(token = tokens.next())? or !nextSection?
      @die()
    else if token.string.match /\n+/
      LINEFEED
    else

      # construct the appropriate stack for the token

      # first get rid of any sections which end before the token begins
      while stack.length and stack[stack.length-1].end <= token.start
        stack.pop()

      # now get rid of any sections from the stream which end before the token
      # begins (this only maybe happens after filtering)
      while nextSection? and nextSection.end <= token.start
        nextSection = sections.next()

      if !nextSection?
        return @die()

      # now pull in sections until they start after the token ends
      while nextSection.start < token.end
        stack.push nextSection
        nextSection = sections.next()

      # now apply regex filters and node breakers
      for section in stack
        if section.type is "filter"
          bt = discoverBreakType token, section
          if bt isnt NONE
            if bt isnt ENCOMPASS
              pushbackTokens breakToken token, section, true, bt
            # if bt *is* encompass, we just drop this token
            return @next()
        else if section.node?.nodeName of BREAKER_NODES
          bt = discoverBreakType token, section
          if bt > ENCOMPASS
            pushbackTokens breakToken token, section
            return @next()

      # now do word length splitting
      if wordIsTooLong token.string
        pushbackTokens splitLongToken token
        return @next()

      # I think we're all good on the splitting/filtering front now, so just
      # specialise the sections for the current token, removing the document
      # offset
      tokenSections = []
      for section in stack
        if !section.filter? and section.node?.nodeName of STYLE_NODES
          tokenSections.push
            node  : section.node
            start : section.start - token.start
            end   : Math.min section.end - token.start, token.end - token.start

      # get the start node of the element
      # (this could be merged into the previous loop for performance, but I
      # want the algorithm to be as clear as possible for the moment)
      startNode = null
      for section in stack
        if section.start <= token.start
          if section.node?
            startNode = section.node
        else break

      if not startNode?
        throw new Error "No start node found. What the jazz?"

      new AlignedToken  token.string
                      , token.end
                      , startNode
                      , token.start - startNode.start
                      , tokenSections

document.addEventListener "DOMContentLoaded", ->
  console.log "good"
  tknregex = /["«»“”\(\)\/–—]|--+|\n+|[^\s"“«»”\(\)\/–—]+/g
  nodes = nodeSectionStream window.document.body
  tokens = regexSectionStream tknregex, elem2str window.document.body

  alignedtokens = alignedTokenStream tokens, nodes

  while (tkn = alignedtokens.next())
    console.log tkn

