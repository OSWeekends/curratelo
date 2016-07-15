var pjson = require('./package.json');

var config = {
  	version: pjson.version,
  	creador: pjson.author,
    sheetCode: "",
    sheetCodeExclusives: "",
    // Habgouts BOT
    hangouts: {
      usuarioId: "",
    	usuarioAutorizado: "",
    	botEmail: "",
    	botPassword: ""
    },
    // Slack BOT
    slack: {
      enable: true,
      keyUser: "",
      webhookUri: ""
    },
    //Twitter
    twitter : {
      consumer_key: "", 
      consumer_secret: "",
      access_token_key: "",
      access_token_secret: ""
    },
    //FIREBASE SETUP
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    storageBucket: "",
    type: "",
    project_id: "",
    private_key_id: "",
    private_key: "",
    client_email: "",
    client_id: "",
    auth_uri: "",
    token_uri: "",
    auth_provider_x509_cert_url: "",
    client_x509_cert_url: ""
};

module.exports = config;