# Licensed under the Apache License v2.0.

# A copy of which can be found at the root of this distrubution in 
# the file LICENSE-2.0 or at http://www.apache.org/licenses/LICENSE-2.0

if window.jetzt?
  throw new Error "window.jetzt already defined"
else
  window.jetzt = {}