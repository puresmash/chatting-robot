
# {Response} = require 'hubot'

# class Response
#   constructor: (@robot, @message, @match) ->
#     @envelope =
#       room: @message.room
#       user: @message.user
#       message: @message

class StickerResponse
    constructor: (@packageId, @stickerId)->
        # super @robot, @message, @match
        @type = 'sticker'

module.exports = {
    StickerResponse
}
