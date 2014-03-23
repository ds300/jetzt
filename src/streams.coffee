# Licensed under the Apache License v2.0.

# A copy of which can be found at the root of this distrubution in 
# the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0


# Pushback Streams

class Stream
  constructor: (@next) ->

  pushBack: (arr) ->
    saved = @next
    i = 0
    @next = =>
      if i < arr.length
        arr[i++]
      else
        @next = saved
        @next()
    @

  die: ->
    @next = -> null
    null


# Concatenate two or more streams together
concat = (streams...) ->
  i = 0
  new Stream ->
    result = streams[i].next()
    if result?
      result
    else
      i++
      if i is streams.length
        @die()
      @next()


# Map a function over one or more streams
map = (fn, streams...) ->
  done = false
  next = (s) ->
    result = s.next()
    if result?
      result
    else
      done = true

  new Stream ->
    args = (next s for s in streams)
    if done then @die() else fn(args...)

# Remove items for which pred returns false
filter = (pred, stream) ->
  new Stream ->
    result = stream.next()

    while result? and not pred result
      result = stream.next()

    if result? then result else @die()

# Buffer a stream. Buffering is done in chunks, with a setTimeout call
# in between to avoid locking the browser.
buffer = (stream, bufferSize = 100, chunkSize = 10, delay = 10) ->
  buf = []
  
  do fill = ->
    targetSize = Math.min bufferSize, buf.length + chunkSize

    while buf.length < targetSize and (result = stream.next())?
      buf.push result

    if result? and targetSize < bufferSize
      window.setTimeout fill, delay

    buf.length

  new Stream ->
    result = if not buf.length and not fill()
               @die()
             else
               buf.shift()

    if buf.length < bufferSize - chunkSize then fill()

    result


# Make a stream out of the items in the array
arrayStream = (arr) ->
  i = 0
  new Stream ->
    if i < arr.length
      arr[i++]
    else
      @die()




window.jetzt.streams = 
  Stream: Stream
  concat: concat
  map: map
  filter: filter
  buffer: buffer
  arrayStream: arrayStream
