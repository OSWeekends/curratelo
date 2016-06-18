var project = require('pillars'),
    Scheduled = require("scheduled"),
    jade = require('jade'),
    config = require('./config'),
    firebase = require('firebase'),
    ProviderRSS = require('./providers/rss'),
    ProviderSheets = require('./providers/sheets'),
    fs = require('fs');

// Prototypes
String.prototype.textCleaner = function() {
    var _self = this;
    var finalText;
    
    finalText = _self.replace(/(<([^>]+)>)/ig,"");
    finalText = finalText.replace(/(&([^>]+);)/ig,"");
    finalText = finalText.replace(/\r?\n|\r/, " ");
    
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

Date.prototype.isInFrame = function(dateTarget){
    var _self = this;
    var currentWeek = _self.getWeek();
    return _self.getTime() <= currentWeek[1] && _self.getTime() >= currentWeek[0];
};

// Inicialización de Firebase
firebase.initializeApp({
  serviceAccount: ".secret/serviceAccountCredentials.json",
  databaseURL: config.databaseURL
});

// Fuentes RSS
var betabeers = new ProviderRSS({
	url: "https://betabeers.com/post/feed/",
	provider_db: "betabeers",
	provider: "Betabeers Empleos",
	provider_logo: "https://betabeers.com/static/img/ios_icon.png",
	outstanding: false
});

var stackoverflow = new ProviderRSS({
	url: "http://stackoverflow.com/jobs/feed",
	provider_db: "stackoverflow",
	provider: "Stackoverflow Jobs",
	provider_logo: "http://cdn.sstatic.net/Sites/stackoverflow/img/favicon.ico",
	outstanding: false
});

var github = new ProviderRSS({
	url: "https://jobs.github.com/positions.atom",
	provider_db: "github",
	provider: "Github Jobs",
	provider_logo: "https://jobs.github.com/images/layout/invertocat.png",
	outstanding: false
});

// Fuentes SHEETS
var destacados = new ProviderSheets({
    id: config.sheetCode,
	provider_db: "destacados",
	outstanding: true
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

var estatics = new Route({
    id: 'estatics',
    path: '/*:path',
    directory: {
        path: './public',
        listing: true
    }
});


// Adding Routes to Pillars
project.routes.add(index);
project.routes.add(estatics);


// Gestión de tareas automáticas
var datos;

var rssJob = new Scheduled({
	id: "rssJob",
	pattern: "2 * * * * *", // xx:02
	task: function(){
		github.uploadJobs();
        stackoverflow.uploadJobs();
        betabeers.uploadJobs();
	}
}).start();

var sheetJob = new Scheduled({
	id: "sheetJob",
	pattern: "0 * * * * *",  // xx:00
	task: function(){
		destacados.uploadJobs();
	}
}).start();


var updateView = new Scheduled({
	id: "updateView",
	pattern: "5 * * * * *", // xx:05
	task: function(){
        firebase.database().ref('/data/').once('value').then(function(snapshot) {
            datos = snapshot.val();
            
            if(!datos.betabeers){
                console.log("ERROR con Betabeers");
            }
            
            if(!datos.stackoverflow){
                console.log("ERROR con Stackoverflow");
            }
            
            if(!datos.github){
                console.log("ERROR con Github");
            }
             if(!datos.destacados){
                console.log("ERROR con Destacados");
            }           
            var finalBlock = JSON.stringify(datos, null, 2);
            fs.writeFile('datos.json', finalBlock, "UTF-8", function (err){
                if (err) { 
                    throw err;
                }
              console.log('Copia de la base de datos en datos.json');
            });           
            

        });
	}
}).start();

rssJob.launch();
sheetJob.launch();
updateView.launch();