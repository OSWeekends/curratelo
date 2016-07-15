var project = require('pillars'),
    Scheduled = require("scheduled"),
    jade = require('jade'),
    config = require('./config'),
    firebase = require('firebase'),
    ProviderRSS = require('./providers/rss'),
    ProviderSheets = require('./providers/sheets'),
    providerDomestika = require('./providers/scraping/domestika'),
    statsTwitter = require('./realtime/stream').stats,
    realtimeTweets = require('./realtime/stream').mostrarTweets,
    startSpanish = require('./realtime/stream').startSpanish,
    startEnglish = require('./realtime/stream').startEnglish,
    slackLog = require("./bots/slackBot"),
    hangouts = require("./bots/hangouts"),
    fs = require('fs');

slackLog("[SERVER] Iniciando el servidor...");
// Prototypes
Array.prototype.inArray = function(word) {
    var _self = this;
    for(var i = 0; i < _self.length; i++) {
        if(_self[i] == word){ 
            return true;
        }
    }
    return false;
};

String.prototype.inString = function(array) {
    var _self = this;

    for(var i = 0; i < array.length; i++) {
        if(_self.indexOf(array[i])  > -1){ 
            return true;
        }
    }
    return false;
};

String.prototype.textCleaner = function() {
    var _self = this;
    var finalText;
    
    finalText = _self.replace(/(<([^>]+)>)/ig,"");
    finalText = finalText.replace(/(]]>)/ig,"");
    finalText = finalText.replace(/(&([^>]+);)/ig,"");
    finalText = finalText.replace(/\r?\n|\r/ig," ");
    finalText = finalText.trim();
    if (finalText.length > 400){
        finalText = finalText.substring(0,400) + ' ...';
    }
    
    return finalText;
};


Date.prototype.getWeek = function(){
    var today = new Date();
    var StartDate = new Date();
    StartDate.setDate(StartDate.getDate() - 6);
    return [StartDate.getTime(), today.getTime()];
};

Date.prototype.isInWeek = function(dateTarget){
    var _self = this;
    var currentWeek = _self.getWeek();
    return _self.getTime() <= currentWeek[1] && _self.getTime() >= currentWeek[0];
};

Date.prototype.isIn2Days = function(dateTarget){
    var _self = this;
    var daysAgo2 = new Date();
    daysAgo2.setDate(daysAgo2.getDate() - 2);  
    return _self.getTime() >= daysAgo2.getTime();
};

Date.prototype.isIn15Days = function(dateTarget){
    var _self = this;
    var daysAgo2 = new Date();
    daysAgo2.setDate(daysAgo2.getDate() - 15);  
    return _self.getTime() >= daysAgo2.getTime();
};

// Inicialización de Firebase
firebase.initializeApp({
  serviceAccount: ".secret/serviceAccountCredentials.json",
  databaseURL: config.databaseURL
});

// Stream Twitter
slackLog("[SERVER] Iniciando el streaming de tweets...");
startSpanish();
startEnglish();

// Fuentes RSS
var betabeers = new ProviderRSS({
    url: "https://betabeers.com/post/feed/",
    provider_db: "betabeers",
    provider: "Betabeers Empleos",
    provider_logo: "img/betabeers_jobs.png",
    outstanding: false
});

var stackoverflow = new ProviderRSS({
    url: "http://stackoverflow.com/jobs/feed",
    provider_db: "stackoverflow",
    provider: "Stackoverflow Jobs",
    provider_logo: "img/stackoverflow_jobs.png",
    outstanding: false
});

var github = new ProviderRSS({
    url: "https://jobs.github.com/positions.atom",
    provider_db: "github",
    provider: "Github Jobs",
    provider_logo: "img/github_jobs.png",
    outstanding: false
});


// Fuentes destacados
var destacados = new ProviderSheets({
    id: config.sheetCode,
    provider_db: "destacados",
    outstanding: true
});

// Fuentes exclusivo
var exclusives = new ProviderSheets({
    id: config.sheetCodeExclusives,
    provider_db: "exclusives",
    outstanding: true,
    router: true
});


// Starting the project
project.services.get('http').configure({
    port: process.env.PORT || 8080
}).start();


// Template Engine
var templated = global.templated;
templated.addEngine('jade', function compiler(source, path) {
    return jade.compile(source, {
        filename: path,
        pretty: false,
        debug: false,
        compileDebug: false
    });
});


// Routes definition
var index = new Route({
        id: "index",
        path: "/"
    },
    function(gw) {
        gw.render('./templates/index.jade', {datos: datos});
    });

var realtime = new Route({
        id: "realtime",
        path: "/realtime"
    },
    function(gw, io) {
        realtimeTweets(gw, io);
    });


var detailsRoute = new Route({
        id: "sheet",
        path: "/job/*:path"
    },
    function(gw) {
        if (gw.pathParams.path === "") {
            gw.redirect("/");
        } else {
            datosDetalle.forEach(function(item){
                if (gw.pathParams.path === item.id) {
                    gw.render('./templates/details.jade', {item: item});
                    console.log("Premio!!");
                } else {
                    gw.redirect("/");
                }
            });
        }
});

var estatics = new Route({
    id: 'estatics',
    path: '/*:path',
    directory: {
        path: './public',
        listing: true
    }
});



// Adding Routes to Pillars
project.routes.add(realtime);
project.routes.add(index);
project.routes.add(detailsRoute);
project.routes.add(estatics);


// Gestión de tareas automáticas
// Subiendo stadisticas cada día a Firebase.
var previousDailyStats = {
    english: {
        totalAnalyzed: 0,
        totalValid: 0 
    },
    spanish: {
        totalAnalyzed: 0,
        totalValid: 0          
    },
    totalAnalyzed: 0,
    totalValid: 0,
    startDate: ""
};

var statsFirebaseDailyJob = new Scheduled({
    id: "statsFirebaseDailyJob",
    pattern: "59 23 * * * *",  // 23:59
    task: function(){
        var stats = statsTwitter();
        stats.english.totalAnalyzed -= previousDailyStats.english.totalAnalyzed;
        stats.english.totalValid -= previousDailyStats.english.totalValid;
        stats.spanish.totalAnalyzed -= previousDailyStats.spanish.totalAnalyzed;
        stats.spanish.totalValid -= previousDailyStats.spanish.totalValid;      
        stats.totalValid -= previousDailyStats.totalValid;
        stats.totalAnalyzed -=   previousDailyStats.totalAnalyzed;
        stats.frequency = 86400000;
        stats.timestamp = new Date().getTime();
        var ref = firebase.database().ref('stats/day/'+stats.timestamp);
        ref.set(stats, function(error){
            if (error) {
                console.warn('[FIREBASE] ERROR - Sincronización fallida con la subida diaria de estadísticas!');
            }
            previousDailyStats = stats;
        });
    }
}).start();

var previousHourlyStats = {
    english: {
        totalAnalyzed: 0,
        totalValid: 0 
    },
    spanish: {
        totalAnalyzed: 0,
        totalValid: 0          
    },
    totalAnalyzed: 0,
    totalValid: 0,
    startDate: ""
};

// Subiendo stadisticas cada hora a Firebase.
var statsFirebaseHourlyJob = new Scheduled({
    id: "statsFirebaseHourlyJob",
    pattern: "59 * * * * *",  // **:59
    task: function(){
        
        var stats = statsTwitter();
        stats.english.totalAnalyzed -= previousHourlyStats.english.totalAnalyzed;
        stats.english.totalValid -= previousHourlyStats.english.totalValid;
        stats.spanish.totalAnalyzed -= previousHourlyStats.spanish.totalAnalyzed;
        stats.spanish.totalValid -= previousHourlyStats.spanish.totalValid;
        stats.totalValid -= previousHourlyStats.totalValid;
        stats.totalAnalyzed -=   previousHourlyStats.totalAnalyzed;
        stats.frequency = 3600000;
        stats.timestamp = new Date().getTime();
        var ref = firebase.database().ref('stats/hour/'+stats.timestamp);
        ref.set(stats, function(error){
            if (error) {
                console.warn('[FIREBASE] ERROR - Sincronización fallida con la subida (**:59) de estadísticas!');
            }
            previousHourlyStats = stats;
        });
    }
}).start();

var datos;
var datosDetalle = [];
var rssJob = new Scheduled({
    id: "rssJob",
    pattern: "2 5 * * * *", // 05:02
    task: function(){
        slackLog("[SERVER] Iniciando la actualización programada de los proveedores RSS...");
        github.uploadJobs();
        stackoverflow.uploadJobs();
        betabeers.uploadJobs();
    }
}).start().launch();

var sheetJob = new Scheduled({
    id: "sheetJob",
    pattern: "0 5 * * * *",  // 05:02
    task: function(){
        slackLog("[SERVER] Iniciando la actualización programada de Google Sheets...");
        destacados.uploadJobs();
        exclusives.uploadJobs();
    }
}).start().launch();

var scrapingJob = new Scheduled({
    id: "scrapingJob",
    pattern: "0 5 * * * *",  // 05:02
    task: function(){
        slackLog("[SERVER] Iniciando la actualización programada de Domestica...");
        providerDomestika.uploadJobs();
    }
}).start().launch();

setTimeout(function(){
var  updateView = new Scheduled({
        id: "updateView",
        pattern: "5 5 * * * *", // 05:02
        task: function(){
            firebase.database().ref('/data/').once('value').then(function(snapshot) {
                // Unificación
                
                datos = snapshot.val();
                
                if(!datos.betabeers){
                    slackLog("[SERVER][INFO] Betabeers vacío...");
                }
                
                if(!datos.stackoverflow){
                    slackLog("[SERVER][INFO] Stackoverflow vacío...");
                }
                
                if(!datos.github){
                    slackLog("[SERVER][INFO] Github vacío...");
                }
                
                if(!datos.domestika){
                    slackLog("[SERVER][INFO] Domestika vacío...");
                }
                
                if(!datos.destacados){
                    slackLog("[SERVER][INFO] Destacados vacío...");
                }
                if(!datos.exclusives){
                    slackLog("[SERVER][INFO] Ofertas exclusivas vacío...");
                }                
                
                
                var newDatos = [];
                for (var dato in datos) {
                    for (var i = 0; i < datos[dato].length; i++) {
                        if(dato === "exclusives"){
                            datosDetalle.push(datos[dato][i]);
                        }
                        newDatos.push(datos[dato][i]);
                    }
                }
                
                newDatos.sort(function(obj1, obj2) {
                    return new Date(obj2.pubdate) - new Date(obj1.pubdate);
                });
                
                datos = newDatos;

                var finalBlock = JSON.stringify(datos, null, 2);
                fs.writeFile('temp/datos.json', finalBlock, "UTF-8", function (err){
                    if (err) { 
                        throw err;
                    }
                    slackLog("[SERVER][INFO] temp/datos.json actualizado...");
                });
    
            });
        }
    }).start().launch();
}, 120000);