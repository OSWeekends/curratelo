var sentiment = require('sentiment-spanish'),
    config = require('../config'),
    project = require('pillars'),
    slackLog = require("../bots/slackBot"),
    io = require('socket.io')(project.services.get('http').server),
    Scheduled = require("scheduled"),
    twitter = require('twitter');

var startingDate = new Date();
var hashtagsSpanish = ['#trabajo', '#empleo', '#trabajoIT', '#ofertadeempleo'];
var hashtagsEnglish = ['#ITJobs', '#jobs', '#job', '#devJobs', '#devJob', '#techjobs', '#jobsearch', '#jobs4u', '#carrer', '#newJob', '#hiring'];
var keywords = ['#php', 'developer', 'desarrollador', '#node', 'nodejs', 'node.js', 'scrum', '#js', 'javascript', 'jquery', 'angular', 'frontend', 'front-end', 'python', 'django', 'backend', 'back-end' ];

// Gestión Eventos de Sockets
var streamSpanish = new twitter(config.twitter);
var streamEnglish = new twitter(config.twitter);

var totalAnalyzedEnglish = 0, totalAnalyzedSpanish = 0, totalAnalyzed = 0, totalValid = 0, totalValidEnglish = 0, totalValidSpanish = 0;

streamSpanish.startStream = function(){
  streamSpanish.stream('statuses/filter', {track: hashtagsSpanish.join(','), language: 'es' }, function(stream){
    
    stream.on('data', function(tweet){
      if(tweet.text !== undefined){
        var text = tweet.text.toLowerCase();
        totalAnalyzedSpanish++;
        if(text.inString(keywords) && tweet.user.screen_name !== "curratelo_es"){
          totalValidSpanish++;
          //console.log("[V](ES)",tweet.text);
          //console.log("user:", tweet.user.screen_name);
          var data = {
              tweet: tweet.text,
              tweetId: tweet.id_str,
              tweetUsserPhoto: tweet.user.profile_image_url,
              tweeter: tweet.user.screen_name,
              sentiment: sentiment(tweet.text)
          };
          io.emit('spanishJobs', data);
        }
        
        sendStats();
      }  
    });
    
    stream.on('error', function(error, code){
      slackLog("[SERVER][ERROR][Twitter-Stream-Spanish] Código: "+code+". Detalle: "+error+". Cc: @\"");
    });
    
  });
};

streamEnglish.startStream = function(){
  streamEnglish.stream('statuses/filter', {track: hashtagsEnglish.join(','), language: 'en' }, function(stream){
    
    stream.on('data', function(tweet){
      if(tweet.text !== undefined){
        var text = tweet.text.toLowerCase();
  
        totalAnalyzedEnglish++;
        if(text.inString(keywords) && tweet.user.screen_name !== "curratelo_es"){
          totalValidEnglish++;
          //console.log("[V](EN)",tweet.text);
          var data = {
              tweet: tweet.text,
              tweetId: tweet.id_str,
              tweetUsserPhoto: tweet.user.profile_image_url,
              tweeter: tweet.user.screen_name,
              sentiment: sentiment(tweet.text)
          };
          io.emit('englishJobs', data);
        }
        
        sendStats();
        
      }  
    });
    
    stream.on('error', function(error, code){
      slackLog("[SERVER][ERROR][Twitter-Stream-English] Código: "+code+". Detalle: "+error+". Cc: @"+config.slack.keyUser);
    });
    
  });
};


function updateStats(){
  totalAnalyzed = totalAnalyzedEnglish + totalAnalyzedSpanish;
  totalValid = totalValidEnglish + totalValidSpanish;

  stats = {
    spanish: {
      totalAnalyzed: totalAnalyzedSpanish,
      totalValid: totalValidSpanish
    },
    english: {
        totalAnalyzed: totalAnalyzedEnglish,
        totalValid: totalValidEnglish
    },
    totalAnalyzed: totalAnalyzed,
    totalValid: totalValid,
    startDate: startingDate.toISOString()
  };
  
  return stats;
}

function sendStats(){
  updateStats();
  io.emit('stats', stats);
}

/*
streamSpanish.startStream();
streamEnglish.startStream();
*/
var stats = {};

var prevValidation = {
  totalAnalyzedEnglish: 0,
  totalAnalyzedSpanish: 0
};

var statsJob = new Scheduled({
    id: "statsJob",
    pattern: "15,45 * * * * *",  // **:15, **:45
    task: function(){
      
      slackLog("[SERVER][INFO][Twitter-Stream-Total] Funcionando desde "+new Date(stats.startDate).toLocaleString('es-ES')+" | Analizados: "+stats.totalAnalyzed+" | Relevantes: "+stats.totalValid+" ("+(stats.totalValid / stats.totalAnalyzed).toFixed(3)+"%)");
      slackLog("[SERVER][INFO][Twitter-Stream-Spanish] Analizados: "+stats.spanish.totalAnalyzed+" | Relevantes: "+stats.spanish.totalValid+" ("+(stats.spanish.totalValid / stats.spanish.totalAnalyzed).toFixed(3)+"%)");
      slackLog("[SERVER][INFO][Twitter-Stream-English] Analizados: "+stats.english.totalAnalyzed+" | Relevantes: "+stats.english.totalValid+" ("+(stats.english.totalValid / stats.english.totalAnalyzed).toFixed(3)+"%)");
      
      // If no new data.... restart the service.
      if(prevValidation.totalAnalyzedEnglish === stats.english.totalAnalyzed){
          streamEnglish.startStream();
          slackLog("[SERVER][INFO][Twitter-Stream-English] Reinicializado servicio como respuesta a datos no actualizados en la última media hora. Cc: @"+config.slack.keyUser);
      }
      
      if(prevValidation.totalAnalyzedSpanish === stats.spanish.totalAnalyzed){
          streamSpanish.startStream(); 
          slackLog("[SERVER][INFO][Twitter-Stream-Spanish] Reinicializado servicio como respuesta a datos no actualizados en la última media hora. Cc: @"+config.slack.keyUser);
      }
      
      // Update prev.... data!
      prevValidation.totalAnalyzedEnglish = stats.english.totalAnalyzed;
      prevValidationtotalAnalyzedSpanish = stats.spanish.totalAnalyzed;
            
    }
}).start();


function mostrarTweets(gw, io) {
        gw.render('./templates/realtime.jade');
}

module.exports = {
  startSpanish: streamSpanish.startStream,
  startEnglish: streamEnglish.startStream,
  mostrarTweets: mostrarTweets,
  stats: updateStats
};