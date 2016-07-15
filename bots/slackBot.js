var Slack = require('slack-node'),
    config = require('../config');

var slack = new Slack();
slack.setWebhook(config.slack.webhookUri);

function slackNotify (msg){
    msg = msg || "Tu no lo oyes?";
    if(config.slack.enable){
        slack.webhook({
          text: msg
        }, function(err, response) {
            if(err){
                console.log("[Error] Con SLACK", err);
            }
          
        });
    } else {
        console.log("[Slack Desactivado][msg]->",msg);
    }

}

module.exports = slackNotify;