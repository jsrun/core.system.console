/**
 *  __          __  _    _____ _____  ______ _______                  _             _ 
 *  \ \        / / | |  |_   _|  __ \|  ____|__   __|                (_)           | |
 *   \ \  /\  / /__| |__  | | | |  | | |__     | | ___ _ __ _ __ ___  _ _ __   __ _| |
 *    \ \/  \/ / _ \ '_ \ | | | |  | |  __|    | |/ _ \ '__| '_ ` _ \| | '_ \ / _` | |
 *     \  /\  /  __/ |_) || |_| |__| | |____ _ | |  __/ |  | | | | | | | | | | (_| | |
 *      \/  \/ \___|_.__/_____|_____/|______(_)|_|\___|_|  |_| |_| |_|_|_| |_|\__,_|_|
 *                                                                                                                                                                                                               
 *  @author André Ferreira <andrehrf@gmail.com>
 *  @license MIT
 */

"use strict";

let fs = require("fs"),
    path = require("path"),
    glob = require("glob"),
    exec = require('child_process').exec,
    SystemException = require("../wi.core.exception.js"),
    TemplateEngine = require("../wi.core.template.js");

module.exports = {    
    /**
     * List module assets
     * @type object
     */
    assets: {
        css: [__dirname + "/node_modules/jquery.terminal/css/jquery.terminal.min.css"],
        js: [__dirname + "/node_modules/jquery.terminal/js/jquery.mousewheel-min.js", __dirname + "/node_modules/jquery.terminal/js/jquery.terminal.min.js", __dirname + "/node_modules/jquery.terminal/js/unix_formatting.js"]
    },
    
     /**
     * Module startup function
     * 
     * @param object app
     * @return this
     */
    bootstrap: function(_this){ 
        _this.commands.addCommand({
            name: "webide:newterminal",
            bind: {mac: "Command-T", win: "Alt-T"},
        });
    
        _this.navbar.addItem("Window/New Terminal", {
            command: "webide:newterminal"
        }, 100);
        
        _this._.setSocketsEvents(function(socket){
            if(!socket.hasEvent("stdin")){ 
                socket.on('stdin', function (data) {
                    if(typeof data.cmd == "string"){
                        switch(data.cmd.split(" ")[0]){
                            case "cd":
                                try{
                                    var _id = (socket.user) ? socket.user._id : 0;
                                    var workspaceDirname = fs.realpathSync(__dirname + "/../../.workspaces/" + _id);

                                    var workspaceDirnameWithCwd = (data.cwd !== "~") ? workspaceDirname + data.cwd : data.cwd.replace("~", workspaceDirname);

                                    if(typeof data.cmd.split(" ")[1] == "string"){
                                        var dir = data.cmd.split(" ")[1];

                                        switch(dir.substr(0,1)){
                                            case "/":                                             
                                                if(fs.statSync(workspaceDirnameWithCwd + dir))
                                                    socket.emit("cwd", {_id: data._id, cwd: dir}); 
                                                else
                                                    socket.emit("stderr", {_id: data._id, out: "cd: " + dir + ": " + _this.i18n.__("No such file or directory")});

                                                socket.emit("enable", {_id: data._id});
                                            break;
                                            case "~":                                             
                                                if(fs.statSync(dir.replace("~", workspaceDirnameWithCwd)))
                                                    socket.emit("cwd", {_id: data._id, cwd: dir}); 
                                                else
                                                    socket.emit("stderr", {_id: data._id, out: "cd: " + dir + ": " + _this.i18n.__("No such file or directory")}); 

                                                socket.emit("enable", {_id: data._id});
                                            break;
                                            default:                                             
                                                if(fs.statSync(workspaceDirnameWithCwd + "/" + dir))
                                                    socket.emit("cwd", {_id: data._id, cwd: fs.realpathSync(workspaceDirnameWithCwd + "/" + dir).replace(workspaceDirname, "")}); 
                                                else
                                                    socket.emit("stderr", {_id: data._id, out: "cd: " + dir + ": " + _this.i18n.__("No such file or directory")});

                                                socket.emit("enable", {_id: data._id});
                                            break;
                                        }

                                    }
                                    else{
                                        socket.emit("enable", {_id: data._id});
                                    }
                                }
                                catch(e){
                                    socket.emit("stderr", {_id: data._id, out: "cd: " + dir + ": " + _this.i18n.__("No such file or directory")});
                                    socket.emit("enable", {_id: data._id});
                                }
                            break;
                            case "ls":
                                var _id = (socket.user) ? socket.user._id : 0;
                                var workspaceDirname = fs.realpathSync(__dirname + "/../../.workspaces/" + _id);

                                if(data.cwd !== "~")
                                    workspaceDirname += data.cwd;

                                glob(workspaceDirname + "/*", {stat: false, cache: true, dot: true}, function (er, files) {
                                    var out = "";

                                    for(let key in files)
                                        out += path.basename(files[key])+"\t";

                                    socket.emit("stdout", {_id: data._id, out: out}); 
                                    socket.emit("enable", {_id: data._id});
                                });
                            break;
                            default: 
                                var _id = (socket.user) ? socket.user._id : 0;
                                var workspaceDirname = fs.realpathSync(__dirname + "/../../.workspaces/" + _id);

                                if(data.cwd !== "~")
                                    workspaceDirname += data.cwd;
                                                                
                                var execDockerCompose = exec(data.cmd, { cwd: workspaceDirname });
                                execDockerCompose.stdout.on('data', (out) => { socket.emit("stdout", {out: out.toString(), _id: data._id}); });
                                execDockerCompose.stderr.on('data', (out) => { socket.emit("stderr", {out: out.toString(), _id: data._id}); });
                                execDockerCompose.on('exit', () => { 
                                    socket.emit("enable", {_id: data._id}); 
                                    
                                    if(typeof data.onexit == "string")
                                        socket.emit(data.onexit, {_id: data._id}); 
                                });
                            break;
                        }
                    }
                });
            }
            
            if(!socket.hasEvent("ls")){
                socket.on('ls', function(data){
                    var _id = (socket.user) ? socket.user._id : 0;
                    var workspaceDirname = fs.realpathSync(__dirname + "/../../.workspaces/" + _id);

                    if(data.cwd == "/")
                        var workspaceDirnameWithCwd = workspaceDirname;
                    else
                        var workspaceDirnameWithCwd = (data.cwd !== "~") ? workspaceDirname + data.cwd : data.cwd.replace("~", workspaceDirname);

                    var cmds = data.cmd.split(" ");

                    glob(workspaceDirnameWithCwd + "/" + cmds[cmds.length-1] + "*", {cache: true, dot: true}, function (er, files) {
                        if(files.length > 1){
                            var out = "";

                            for(let key in files)
                                out += path.basename(files[key])+"\t";

                            socket.emit("stdout", {_id: data._id, out: out}); 
                            socket.emit("enable", {_id: data._id});
                        }
                        else if(files.length == 1){
                            socket.emit("ls", {_id: data._id, cmd: data.cmd.replace(cmds[cmds.length-1], files[0].replace(/\\/img, "/").replace((workspaceDirnameWithCwd + "/").replace(/\\/img, "/"), ""))}); 
                        }
                    });
                });
            }
        });
    }
};