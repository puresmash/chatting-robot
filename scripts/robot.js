
var cheerio = require('cheerio')
var request = require('request')
var querystring = require('querystring')
var iconvlite = require('iconv-lite')
var fs = require('fs')

module.exports = function(robot){
    robot.respond(/hello/, function(res){
        res.send('world');
    });
    robot.respond(/google (.*)/i, function(res){
        let keyword = res.match[1];
        keyword = querystring.escape(keyword);
        cheerioTest(res, keyword);
    });
}
//
function cheerioTest(user, keyword){
    const options = {
        url: `https://www.google.com/search?gws_rd=ssl&num=3&q=${keyword}`,
        header: {
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
            console.log($('div.g').length);
            const ele = $('div.g').first();

            const result = existSpecialView(ele)? getWithoutDesc(ele) : getWithDesc(ele);
            user.send(result);

        }
    });
    // .pipe(fs.createWriteStream('debug.html'));
}
function existSpecialView(ele){
    return ele.find('h3._X8d a').length != 0
}
function getWithDesc(ele){
    const linkEle = ele.find('h3.r a');
    const linkText = linkEle.first().text();
    let temp = linkEle.attr('href');
    const link = querystring.parse(temp)['/url?q'];
    const desc = ele.find('span.st').text();
    return `${linkText}\n${link}\n${desc}`;
}
function getWithoutDesc(ele){
    const linkEle = ele.find('h3._X8d a');
    const linkText = linkEle.first().text();
    let temp = linkEle.attr('href');
    const link = querystring.parse(temp)['/url?q'];
    return `${linkText}\n${link}`;
}
