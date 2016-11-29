
"use strict";

var cheerio = require('cheerio')
var request = require('request')
var querystring = require('querystring')
var iconvlite = require('iconv-lite')
var fs = require('fs')
var util = require('util')
const LINE_TOKEN = process.env.HUBOT_LINE_TOKEN;

module.exports = function(robot){
    robot.respond(/hello/i, function(res){
        console.log('world');
        res.reply('world');
    });

    robot.respond(/google (.*)/i, function(res){
        let keyword = res.match[1];
        keyword = querystring.escape(keyword);
        cheerioTest(res, keyword);
    });
    // Test on web
    // robot.router.get('/', function(req, res){
    //     // robot.logger.debug('GET LINE MSG');
    //     // res.send('GET MSG');
    // });
    // console.log(robot.listeners[0]);
    // robot.router.post('/', function(req, res){
    //     robot.logger.debug('GET LINE MSG');
    //     robot.logger.debug(req.body);
    //     // console.log(util.inspect(LineAdapter, false, null))
    //     // let msgObj = getLineMsg(req.body);
    //     // const replyToken = msgObj.replyToken;
    //     // const msg = msgObj.msg;
    //     // const reply = formatReplyMsg(replyToken, `Get msg: ${msg}`);
    //     // replyLineMsg(res, reply, robot.logger);
    //     // res.send('GET MSG');
    // });
}
// Line Message API
function getLineMsg(body){
    const msg = body.events[0].message.text;
    const replyToken = body.events[0].replyToken;
    return {msg: msg, replyToken: replyToken};
}
function formatReplyMsg(replyToken, text){
    const reply = {
        "replyToken": replyToken,
        "messages":[
            {
                "type": "text",
                "text": text
            }
        ]
    }
    return reply;
}
function replyLineMsg(user, replyObj, logger){
    const MsgType = {
        Text: 'text',
        Image: 'image',
        Video: 'video',
        Audio: 'audio',
        Location: 'location',
        Sticker: 'sticker'
    }
    const options = {
        url: 'https://api.line.me/v2/bot/message/reply',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LINE_TOKEN}`
        },
        method: 'POST',
        body: JSON.stringify(replyObj)
    }
    request(options, function(error, response, body){
        logger.debug(options.header);
        logger.debug(response.statusCode);
        logger.debug(body);
        // user.send(`GET YOUR MSG: ${data}`);
    });

}
// Google Search
function cheerioTest(user, keyword){
    const options = {
        url: `https://www.google.com/search?gws_rd=ssl&num=3&q=${keyword}`,
        headers: {
            'User-Agnet': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
        },
        encoding: null,
        method: 'GET'
    }
    request(options, function(error, response, body){
        if (!error && response.statusCode == 200) {
            const content = iconvlite.decode(body, 'big5');
            const $ = cheerio.load(content);
            // debug
            // console.log($('div.g').length);
            const ele = $('div.g').first();

            const result = existYoutubeView(ele)? getYoutubeView(ele) : getNormalView(ele);
            user.reply(result);

        }
    });
    // .pipe(fs.createWriteStream('debug.html'));
}
// Youtube, Image, Normal
function existYoutubeView(ele){
    return ele.find('h3._X8d a').length != 0
}
function getNormalView(ele){
    let linkEle = ele.find('h3.r a');
    let temp = linkEle.attr('href');
    let link = querystring.parse(temp)['/url?q'];
    // Skip Image Result
    if(!link){
        ele = ele.next();
        linkEle = ele.find('h3.r a');
        temp = linkEle.attr('href');
        link = querystring.parse(temp)['/url?q'];
    }
    const linkText = linkEle.first().text();
    const desc = ele.find('span.st').text();
    return `${linkText}\n${link}\n${desc}`;
}
function getYoutubeView(ele){
    const linkEle = ele.find('h3._X8d a');
    const linkText = linkEle.first().text();
    let temp = linkEle.attr('href');
    const link = querystring.parse(temp)['/url?q'];
    return `${linkText}\n${link}`;
}
