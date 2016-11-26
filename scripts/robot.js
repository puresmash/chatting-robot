
module.exports = function(robot){
    robot.respond(/hello/, function(res){
        res.send('world');
    });
}
