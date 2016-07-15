(function() {
    var allDates = document.getElementsByClassName("dateTarget");
    document.getElementById("totalJobs").innerHTML = " Tenemos " + allDates.length + " ofertas para tí!";
    for (var i = 0; allDates.length > i; i++) {
        allDates[i].innerHTML = moment(allDates[i].innerHTML).fromNow();
    }
    var options = {
        valueNames: ['title', 'description'],
        plugins: [ListFuzzySearch()]
    };
    var userList = new List('ofertas', options);
})();