var hangoutsBot = require("hangouts-bot"),
    config = require('../config'),
        exec = require('child_process').exec,
        systemInfo = require('./sysinfo'),
        startSpanish = require('../realtime/stream').startSpanish,
        startEnglish = require('../realtime/stream').startEnglish,
    twitter = require('twitter'),
        bot = new hangoutsBot(config.hangouts.botEmail, config.hangouts.botPassword);


var hangouts = {
    container: [],
    communicator: new hangoutsBot(config.hangouts.botEmail, config.hangouts.botPassword),
    regex: {
        terminal: /^[Tt]erminal/,
        hola: /^[Hh]ola/,
        tweet: /^[Tt]weet/,
        ayuda: /^[Aa]yuda/,
        echo: /^[Ee]cho/,
        masterUser: new RegExp(config.hangouts.usuarioId)
    },
    response: function (options) {
        /* Optional */
        options.admin = options.admin || false;
        options.special = options.special || false;
        options.description = options.description || false;
        options.sample = options.sample || false;
        /*Validación*/
        var err = false;
        if(typeof options.id !== 'string') err = "id has to be a string!";
        if(typeof options.condition !== 'function') err = "condition has to be a function!";
        if(typeof options.action !== 'function') err = "success has to be a function!";
        if(options.special && typeof options.special !== 'boolean') err = "special has to be a string!";
        if(options.admin && typeof options.admin !== 'boolean') err = "admin has to be a string!";
        if(options.description && typeof options.description !== 'string') err = "description has to be a string!";
        if(options.sample && typeof options.sample !== 'string') err = "sample has to be a string!";
        
        if(!err) {
            var duplicated = false;
            
            hangouts.container.forEach(function(item,index){
                if(item.id === options.id){
                    duplicated = true;
                }
            });
            
            if(!duplicated){
                hangouts.container.push(options);
            } else {
                console.log("Error: ID ya está en uso... Respuesta no añadida.");
            }
            
        }  else {
            console.log("Error: " + err +". Respuesta no añadida.");
        }
        
    }
};

/*
    ----- EVENTOS -----
*/

// Al conectar!
hangouts.communicator.on('online', function(){
    hangouts.communicator.sendMessage(config.hangouts.usuarioAutorizado, "Hola de nuevo, Humano! Que quieres?");
});

// CONTROL + C
process.on('SIGINT', function() {
    hangouts.communicator.sendMessage(config.hangouts.usuarioAutorizado, "Me piro! Ya no me quieres como antes...");
    process.exit();
});

// Salida Normal
process.on('exit', function() {
    hangouts.communicator.sendMessage(config.hangouts.usuarioAutorizado, "Me piro! Vaciones por fín!");
    process.exit();
});

// Salida inesperada
process.on('uncaughtException', function() {
    hangouts.communicator.sendMessage(config.hangouts.usuarioAutorizado, "Me piro! Cierre inesperado...");
    process.exit();
});


hangouts.communicator.on('message', function(from, message){
    var match = false;
    message = message.trim();
    hangouts.container.forEach(function(item,index){
        // Es tipo admin?
        var validated = item.admin ? hangouts.regex.masterUser.test(from) : true;
        // Resuelta la validación del admin
        if(validated){
            // Verificar la condicción para comprobar que es el mensaje esperado....
            if(item.condition(message)){
                if(!item.special){
                    hangouts.communicator.sendMessage(from, item.action(from, message) || "Operación realizada con éxito");
                } else {
                    item.action(from, message);
                }
                match = true;
            }   
        } else {
            // No resulta con éxito la validación del admin...
            hangouts.communicator.sendMessage(from, 'Buen intento.. pero con esas zapatillas no ejecutas comandos!');
            hangouts.communicator.sendMessage(config.hangouts.usuarioAutorizado, 'Intento de ejecutar código por parte de '+from+'\n Ha solicitado '+message);
        }
    });
    if(!match) {
        hangouts.communicator.sendMessage(from, "No te entiendo... Explicate mejor, Humano!");
    }
});



/*
    ----- MENSAJES/RESPUESTAS -----
*/

hangouts.response({
    id: "ayuda",
    condition: function(msg){
      return hangouts.regex.ayuda.test(msg);
    },
    action: function(from, msg){
        var id = msg.replace(hangouts.regex.ayuda,'');
        id = id.trim();
        var fullAnwser = "";
        if(id === "") {
            fullAnwser = "Comandos disponibles: ";
            hangouts.container.forEach(function(item,index){
                fullAnwser += item.id+", ";
            });
            fullAnwser = fullAnwser.slice(0, -2);
        } else {
            var encontrado = false;
            hangouts.container.forEach(function(item,index){
                if(item.id === id.trim()){
                    encontrado = true;
                    fullAnwser += "ID: "+item.id+"\n";
                    fullAnwser += "Descripción: "+(item.description || "No lo añadiste!")+"\n";
                    fullAnwser += "Ejemplo: "+(item.sample || "Improvisa!")+"\n";
                    fullAnwser += "Admin: "+item.admin+"\n";
                    fullAnwser += "Special: "+item.special;
                }
            });
            if(!encontrado){
                fullAnwser = "Comando no encontrado.";
            }
        }
        return fullAnwser;
    },
    admin: false,
    description: "Facilita obtener información sobre los comandos disponibles.\n [Ayuda]: muestra comandos disponibles. \n [Ayuda (ID)]: Muestra la información detallada de un comando.",
    sample: "ayuda [ID]"
});


hangouts.response({
    // Mandatory
    id: "terminal",
    condition: function(msg){
        return hangouts.regex.terminal.test(msg);
    },
    action: function(from, msg){
        var comando = msg.replace(hangouts.regex.terminal,'');
        comando = comando.trim();
        //console.log(comando);
        
        exec(comando, function (err, stdout, stderr) {
            if(!err){
                hangouts.communicator.sendMessage(from, 'Respuesta: \n'+stdout);
            } else {
                hangouts.communicator.sendMessage(from, 'Error: \n'+err);
            }
        });
        
    },
    // Optionals
    admin: true,
    special: true,
    description: "Lanza comandos de terminal y retorna la respuesta de la consola.",
    sample: "Terminal git status"
});

var curratelo_es = new twitter(config.twitter);

hangouts.response({
    id: "tweet",
    condition: function(msg){
      return hangouts.regex.tweet.test(msg);
    },
    action: function(from, msg){
        var tweetContent = msg.replace(hangouts.regex.tweet,'');
        tweetContent = tweetContent.trim();
        curratelo_es.post('statuses/update', {status: tweetContent},  function(error, tweet, response){
            if(error){
                hangouts.communicator.sendMessage(from, "[Error] "+error+". Tweet: "+tweet);
            } else {
                hangouts.communicator.sendMessage(from, "Tweet Enviado con Éxito.");
            }
        });
    },
    // Optionals
    admin: true,
    special: true,
    description: "Manda un Tweet con la cuenta de @curratelo_es",
    sample: "tweet En @curratelo_es nos flipa muchisimo #Nodejs"
});

hangouts.response({
    id: "relanzarEspañol",
    condition: function(msg){
      return "relanzar español" === msg;
    },
    action: function(from, msg){
        startSpanish();
        return "Stream de Tweets en español... relanzado con éxito!";
    },
    // Optionals
    admin: true,
    description: "Reinicializa el sistema de streaming de Twitter para los hashtags en español",
    sample: "relanzar español"
});

hangouts.response({
    id: "relanzarIngles",
    condition: function(msg){
      return "relanzar ingles" === msg;
    },
    action: function(from, msg){
        startEnglish();
        return "Stream de Tweets en ingles... relanzado con éxito!";
    },
    // Optionals
    admin: true,
    description: "Reinicializa el sistema de streaming de Twitter para los hashtags en inglés",
    sample: "relanzar ingles"
});

hangouts.response({
    id: "SystemInfo",
    condition: function(msg){
      return "System info" === msg;
    },
    action: function(from, msg){
        var data = "[SERVER][SYSTEM][General] Uptime: "+systemInfo.uptime+" | Kernel: "+systemInfo.kernel+" | Hostname: "+systemInfo.hostname+"\n";
        data += "[SERVER][SYSTEM][CPU & RAM] Total: "+systemInfo.memory.total+" | Libre: "+systemInfo.memory.free+" ("+systemInfo.memory.percent.free+"%) | Usada: "+systemInfo.memory.used+" ("+systemInfo.memory.percent.used+"%)\n";
        data += "[SERVER][SYSTEM][CPU & RAM] CPU: "+systemInfo.cpu+"%  | Buffered: "+systemInfo.memory.buffered+" ("+systemInfo.memory.percent.buffered+"%) | Cached: "+systemInfo.memory.cached+" ("+systemInfo.memory.percent.cached+"%)\n";
        data += "[SERVER][SYSTEM][Top List] Top 10:\n"+systemInfo.topListOriginal;
        return data;
    },
    // Optionals
    description: "Informacion del sistema muestra RAM, CPU, etc... en tiempo real.",
    sample: "System info"
});


hangouts.response({
    id: "hora",
    condition: function(msg){
      return "hora" === msg;
    },
    action: function(from, msg){
        var date = new Date();
        return (date.toLocaleString('es-ES'));
    }
});

hangouts.response({
    id: "hola",
    condition: function(msg){
      return hangouts.regex.hola.test(msg);
    },
    action: function(from, msg){
        return "Hola Humano! Qué tal?";
    }
});

hangouts.response({
    id: "quienSoy",
    condition: function(msg){
      return "Quien soy?" === msg;
    },
    action: function(from, msg){
        return "Yo te conozco como "+from;
    },
    sample: "Quien soy?"
});

hangouts.response({
    id: "creador",
    condition: function(msg){
      return "Quien es tu creador?" === msg;
    },
    action: function(from, msg){
        return "Mi creador es "+config.creador;
    },
    sample: "Quien es tu creador?"
});

hangouts.response({
    id: "version",
    condition: function(msg){
      return "Que version eres?" === msg;
    },
    action: function(from, msg){
        return "Yo estoy en la version "+config.version;
    },
    sample: "Que version eres?"
});


hangouts.response({
    id: "quienEres",
    condition: function(msg){
      return "Quien eres?" === msg;
    },
    action: function(from, msg){
        return "Soy un Robot... ayudo a desarrolladores que lo necesitan.";
    },
    sample: "Quien eres?"
});


hangouts.response({
    id: "echo",
    condition: function(msg){
      return hangouts.regex.echo.test(msg);
    },
    action: function(from, msg){
        var echoContent = msg.replace(hangouts.regex.tweet,'');
        echoContent = echoContent.trim();
        return from + ">> " + echoContent;
    }
});