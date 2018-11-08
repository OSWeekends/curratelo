var exec = require('child_process').exec, child, child1,
    slackLog = require("./slackBot"),
    Scheduled = require("scheduled");

var systemInfo = {
    memory: {
        percent: {}
    }
};

setInterval(function(){
    // Function for checking memory
    child = exec("egrep --color 'MemTotal' /proc/meminfo | egrep '[0-9.]{4,}' -o", function (error, stdout, stderr) {
        if (error !== null) {
            console.log('[ERROR][SYSINFO][MEM] Exec error: ' + error);
        } else {
            var memTotal = stdout.replace("\n","");
            systemInfo.memory.total = parseInt(memTotal);
        }
    });
    
    // Function for checking hostname
    child = exec("hostname", function (error, stdout, stderr) {
        if (error !== null) {
            console.log('[ERROR][SYSINFO][Hostname] Exec error: ' + error);
        } else {
            var hostname = stdout.replace("\n","");
            systemInfo.hostname = hostname;
        }
    });
      
    // Function for checking uptime
    child = exec("uptime | tail -n 1 | awk '{print $1}'", function (error, stdout, stderr) {
        if (error !== null) {
            console.log('[ERROR][SYSINFO][Uptime] Exec error: ' + error);
        } else {
            var uptime = stdout.replace("\n","");
            systemInfo.uptime = uptime;
        }
    });
    
    // Function for checking Kernel version
    child = exec("uname -r", function (error, stdout, stderr) {
        if (error !== null) {
            console.log('[ERROR][SYSINFO][Kernel] Exec error: ' + error);
        } else {
            var kernel = stdout.replace("\n","");   
            systemInfo.kernel = kernel;
        }
    });
    
    // Function for checking Top list
    child = exec("ps aux --width 30 --sort -rss --no-headers | head  | awk '{print $11}'", function (error, stdout, stderr) {
        if (error !== null) {
            console.log('[ERROR][SYSINFO][Top-list] Exec error: ' + error);
        } else {
            systemInfo.topListOriginal = stdout;
            var topList = stdout.split("\n");
            systemInfo.topList = topList;
        }
    });
    
    // Function for checking CPUUsage
    child = exec("top -d 0.5 -b -n2 | grep 'Cpu(s)'|tail -n 1 | awk '{print $2 + $4}'", function (error, stdout, stderr) {
        if (error !== null) {
            console.log('[ERROR][SYSINFO][CPU] Exec error: ' + error);
        } else {
            var cpuUsageUpdate = parseFloat(stdout);
            systemInfo.cpu = cpuUsageUpdate;
        }
    });
}, 2000);


// Function for checking memory free and used
setInterval(function(){
    child1 = exec("egrep --color 'MemFree' /proc/meminfo | egrep '[0-9.]{4,}' -o", function (error, stdout, stderr) {
        if (error === null) {
            var memFree = stdout.replace("\n","");      
            var memUsed = parseInt(systemInfo.memory.total)-parseInt(memFree);
            var percentUsed = Math.round(parseInt(memUsed)*100/parseInt(systemInfo.memory.total));
            var percentFree = 100 - percentUsed;
            systemInfo.memory.free = parseInt(memFree);
            systemInfo.memory.percent.free = percentFree;
            systemInfo.memory.used = parseInt(memUsed);
            systemInfo.memory.percent.used = percentUsed;
        } else {
            console.log('[ERROR][SYSINFO][MEM-DETAILS] Exec error: ' + error);
        }
    });
        
    
    // Function for checking memory buffered
    child1 = exec("egrep --color 'Buffers' /proc/meminfo | egrep '[0-9.]{4,}' -o", function (error, stdout, stderr) {
        if (error === null) {
            var memBuffered = stdout.replace("\n","");
            var percentBuffered = Math.round(parseInt(memBuffered)*100/parseInt(systemInfo.memory.total));
            systemInfo.memory.buffered = parseInt(memBuffered);
            systemInfo.memory.percent.buffered = percentBuffered;
        } else {
            console.log('[ERROR][SYSINFO][MEM-BUFFERED] Exec error: ' + error);
        }
    });
    
    
    
    // Function for checking memory buffered
    child1 = exec("egrep --color 'Cached' /proc/meminfo | egrep '[0-9.]{4,}' -o", function (error, stdout, stderr) {
        if (error === null) {
            var memCached = stdout.replace("\n","");
            var percentCached = Math.round(parseInt(memCached)*100/parseInt(systemInfo.memory.total));
            systemInfo.memory.cached = parseInt(memCached);
            systemInfo.memory.percent.cached = percentCached;      
        } else {
            console.log('[ERROR][SYSINFO][MEM-CACHED] Exec error: ' + error);
        }
    });
    
}, 4000);




// Tareas programadas

var systemInfoJob = new Scheduled({
    id: "systemInfoJob",
    pattern: "20,50 * * * * *",  // **:20, **:50
    task: function(){
      slackLog("[SERVER][SYSTEM][General] Uptime: "+systemInfo.uptime+" | Kernel: "+systemInfo.kernel+" | Hostname: "+systemInfo.hostname);
      slackLog("[SERVER][SYSTEM][CPU & RAM] Total: "+systemInfo.memory.total+" | Libre: "+systemInfo.memory.free+" ("+systemInfo.memory.percent.free+"%) | Usada: "+systemInfo.memory.used+" ("+systemInfo.memory.percent.used+"%)");
      slackLog("[SERVER][SYSTEM][CPU & RAM] CPU: "+systemInfo.cpu+"%  | Buffered: "+systemInfo.memory.buffered+" ("+systemInfo.memory.percent.buffered+"%) | Cached: "+systemInfo.memory.cached+" ("+systemInfo.memory.percent.cached+"%)");
      slackLog("[SERVER][SYSTEM][Top List] Top 10:\n"+systemInfo.topListOriginal);
    }
}).start();


module.exports = systemInfo;

setTimeout(function(){
    systemInfoJob.launch();
},18000);