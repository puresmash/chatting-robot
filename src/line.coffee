try
  {Robot,Adapter,TextMessage,User} = require 'hubot'
catch
  prequire = require('parent-require')
  {Robot,Adapter,TextMessage,User} = prequire 'hubot'

{EventEmitter} = require 'events'
util = require 'util'
HmacSHA256 = require 'crypto-js/hmac-sha256'

class LineAdapter extends Adapter
    constructor: ->
        super

        @REPLY_URL = 'https://api.line.me/v2/bot/message/reply'
        @LINE_TOKEN = process.env.HUBOT_LINE_TOKEN


    reply: (envelope, strings...) ->
        @_sendText envelope.user.replyToken, msg for msg in strings

    _sendText: (token, msg) ->
        @robot.http(@REPLY_URL)
            .header('Content-Type', 'application/json')
            .header('Authorization', 'Bearer #{@LINE_TOKEN}')
            .post(JSON.stringify(_formatReplyObj token, msg)) (err, res, body) ->
                if err
                    @robot.logger.error 'Error sending msg: #{err}'
                    return
                if res.statusCode is 200
                    @robot.logger.debug 'Success, response body: #{body}'
                else
                    @robot.logger.debug 'Error with statusCode: #{res.statusCode}'
                    @robot.logger.debug 'Body: #{body}'


    _formatReplyObj: (token, msg) ->
        return {
            "replyToken": token,
            "messages":[
                {
                    "type": "text",
                    "text": msg
                }
            ]
        }

    run: ->
        self = @
        robot = @robot#
        options =
            path: '/'

        bot = new LineStreaming(options, @robot)

        bot.on 'message',
            (userId, replyToken, text, id) ->
                user = @robot.brain.userForId userId, {replyToken}
                # console.log util.inspect replyToken, false, null
                message = new TextMessage(user, text, id)
                robot.receive message, console.log 'doen'
        bot.listen()
        self.emit "connected"

class LineStreaming extends EventEmitter
    constructor: (options, @robot) ->
        # router listen path: '/'
        @PATH = options.path
        @CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET

    listen: ->
        @robot.router.get @PATH, (req, res) =>
            @robot.logger.debug 'GET LINE MSG'
            @robot.logger.debug 'req.body'
            console.log 'LISTEN'
            replyToken = 'testing token'
            eventType = 'message'
            text = 'Hubot:hello'
            id = 'testing id'
            userId = 'testing uid';
            headerSignature = 'testing sign';
            isValid = @validateSignature text, headerSignature
            # Can't handle other event now, discards them
            if eventType is 'message'
                @emit 'message', userId, replyToken, text, id
            res.send 'OK'
        @robot.router.post @PATH, (req, res) =>
            @robot.logger.debug 'GET LINE MSG'
            @robot.logger.debug 'req.body'
            replyToken = req.body.events[0].replyToken;
            eventType = req.body.events[0].type;
            text = req.body.events[0].message.text;
            id = req.body.events[0].message.id;
            userId = req.body.events[0].source.userId;
            @robot.logger.debug util.inspect req.headers, false, null
            headerSignature = req.headers['X-Line-Signature'];
            @robot.logger.debug headerSignature
            isValid = @validateSignature text, headerSignature
            @robot.logger.debug isValid
            # Can't handle other event now, discards them
            if eventType is 'message'
                @emit 'message', userId, replyToken, text, id
            res.send 'OK'

    validateSignature: (content, headerSignature)->
        genSign = @generateSignature content
        console.log(genSign)
        @robot.logger.debug genSign
        headSign = @decodeHeaderSignature headerSignature
        console.log(headSign)
        @robot.logger.debug headSign

        return genSign is headSign

    generateSignature: (content)->
        return HmacSHA256(content, @CHANNEL_SECRET)

    decodeHeaderSignature: (headerSignature)->
        return Buffer.from(headerSignature, 'base64')

# module.exports = LineAdapter
exports.use = (robot) ->
    new LineAdapter robot
