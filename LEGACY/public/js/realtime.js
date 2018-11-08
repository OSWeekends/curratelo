(function() {
    /*global $*/
    /*global io*/
    /*global ListFuzzySearch*/
    /*global List*/
    var socket = io();
    // Stats Data
    var totalAnalyzedEnglish = 0,
        totalAnalyzedSpanish = 0,
        totalValidEnglish = 0,
        totalValidSpanish = 0,
        totalAnalyzed = 0,
        totalValid = 0,
        tweetsDisponibles = 0;
    // Interval Vars
    var previous = 0;
    // New Teewts Vars
    var firstime = true;
    var tweetContent = "";

    function updateSpanishStats() {
        $('#spanish-stats-analyzed').html(totalAnalyzedSpanish);
        $('#spanish-stats-relevants').html(totalValidSpanish);
        $('#spanish-stats-percentage').html((totalValidSpanish / totalAnalyzedSpanish).toFixed(3) + "%");
        updateTotalStats();
    }

    function updateEnglishStats() {
        $('#english-stats-analyzed').html(totalAnalyzedEnglish);
        $('#english-stats-relevants').html(totalValidEnglish);
        $('#english-stats-percentage').html((totalValidEnglish / totalAnalyzedEnglish).toFixed(3) + "%");
        updateTotalStats();
    }

    function updateTotalStats() {
        totalAnalyzed = totalAnalyzedEnglish + totalAnalyzedSpanish;
        totalValid = totalValidEnglish + totalValidSpanish;
            // Update HTML
        $('#total-stats-analyzed').html(totalAnalyzed);
        $('#total-stats-relevants').html(totalValid);
        $('#total-stats-percentage').html((totalValid / totalAnalyzed).toFixed(3) + "%");
    }
    setInterval(function() {
        if (totalValid !== 0 && previous !== 0) {
            var ratio = totalAnalyzed - previous;
            var ratioHour = ratio * 60;
            var ratioDay = ratioHour * 24;
            // Update HTML
            $('#forecast-stats-minute').html(ratio);
            $('#forecast-stats-hour').html(ratioHour);
            $('#forecast-stats-day').html(ratioDay);
        }
        previous = totalAnalyzed;
    }, 60000);

    function updateHTML(data) {
        // Quitando lorem Tweets...
        if (firstime) {
            document.getElementById("lorem-data").style.display = "none";
            firstime = false;
        }
        // Añadiendo Tweets a la lista...
        var newTweet = ('<li><div class="panel panel-default"><div class="panel-body">' +
            '<a href="http://twitter.com/' + data.tweeter + '" target="_blank"><img src="' + data.tweetUsserPhoto + '" class="pull-left img-circle profile_picture"></a>' +
            '<a href="http://twitter.com/' + data.tweeter + '" target="_blank"><b class="user">' + data.tweeter + '</b></a> said ' +
            '<i class="content">' + data.tweet + '</i>' +
            '<hr class="hr-twitter">' +
            //'<span class="pull-left">' + data.sentiment.score + '</span>' +
            '<a href="https://twitter.com/' + data.tweeter + '/status/' + data.tweetId + '" target="_blank"><span class="pull-right glyphicon glyphicon-link"></span></a>' +
            '</div></div></li>');
        tweetContent += newTweet;
        if (!searchActive) {
            // No Activity search performed by the user
            if (tweetsDisponibles > 100) {
                tweetsDisponibles = 100;
                $('#tweets li:last-of-type').remove();
            }
            $("#tweets").prepend(tweetContent);
            tweetContent = "";
            // Search Data
            var options = {
                valueNames: ['user', 'content'],
                plugins: [ListFuzzySearch()]
            };
            var tweetList = new List('tweets-col', options);
        }
        // Actualizando el buscador...
        var divBuscador = document.getElementById('tweets-buscador');
        divBuscador.innerHTML = tweetsDisponibles;
    }
    /*
     * SOCKET EVENTS
     */
    socket.on('spanishJobs', function(msg) {
        tweetsDisponibles++;
        updateHTML(msg);
    });
    socket.on('englishJobs', function(msg) {
        tweetsDisponibles++;
        updateHTML(msg);
    });
    socket.on('stats', function(msg) {
        totalAnalyzedSpanish = msg.spanish.totalAnalyzed;
        totalValidSpanish = msg.spanish.totalValid;
        totalAnalyzedEnglish = msg.english.totalAnalyzed;
        totalValidEnglish = msg.english.totalValid;
        updateSpanishStats();
        updateEnglishStats();
    });
    /*
     * DOM EVENTS
     */
    var searchActive = false;
    document.getElementById("search-input").addEventListener('keyup', function(e) {
        if (!this.value) {
            searchActive = false;
        } else {
            searchActive = true;
        }
    }, true);
})();