
LineAdapter = require './src/line'
Response    = require './src/response'

module.exports = {
  LineAdapter
  Response
}

exports.use = (robot) ->
    new LineAdapter robot
