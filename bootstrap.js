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
    os = require('os'),
    pty = require('node-pty'),
    SystemException = require("../wi.core.exception.js"),
    TemplateEngine = require("../wi.core.template.js");

module.exports = {    
    /**
     * List of terminals 
     * @type object
     */
    terminals: {},
    
    /**
     * Logs 
     * @type object
     */
    logs: {},
    
    /**
     * List module assets
     * @type object
     */
    assets: {
        css: [__dirname + "/node_modules/xterm/dist/xterm.css", __dirname + "/node_modules/xterm/dist/addons/fullscreen/fullscreen.css"],
        js: [__dirname + "/node_modules/xterm/dist/xterm.js", __dirname + "/node_modules/xterm/dist/addons/attach/attach.js", __dirname + "/node_modules/xterm/dist/addons/fit/fit.js", __dirname + "/node_modules/xterm/dist/addons/fullscreen/fullscreen.js"]
    },
    
    /**
     * Function to create terminal
     * 
     * @param string cwd
     * @return object
     */
    create: function(cwd, cols, rows){
        let _this = this;
                       
        let term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
            name: 'xterm-color',
            cols: cols,
            rows: rows,
            cwd: cwd
        });
        
        this.logs[term.pid] = "";
        term.on('data', (data) => { _this.logs[term.pid] += data.toString(); });
        this.terminals[term.pid] = term;
        
        return term;
    },
    
    /**
     * Function to return exists terminal by id
     * 
     * @param string id
     * @return boolean
     */
    has: function(id){
        return (typeof this.terminals[id] == "object");
    },
    
    /**
     * Function to get terminal
     * 
     * @param string id
     * @return object|null
     */
    get: function(id){
        return (this.has(id)) ? this.terminals[id] : null;
    },
    
    /**
     * Function to write in terminal
     * 
     * @param string id
     * @param string cmd
     * @param function onend
     * @return boolean
     */
    write: function(id, cmd, onend){
        if(this.terminals[id]){
            this.terminals[id].write(cmd + "\n");
            this.terminals[id].on("exit", onend);
            return true;
        }
        else{
            return false;
        }  
    },
    
    /**
     * Function to remove terminal
     * 
     * @param string id
     * @return boolean
     */
    remove: function(id){
        if(this.has(id)){
            try{ process.kill(this.terminals[id].pid); } catch(e) {}            
            delete this.terminals[id];
            delete this.logs[id];
            return true;
        }
        else{
            return false;
        }
    },
    
     /**
     * Module startup function
     * 
     * @param object app
     * @return this
     */
    bootstrap: function(_this){
        let __this = this;
        
        _this.commands.addCommand({name: "webide:newterminal", bind: {mac: "Command-T", win: "Alt-T"}});
        _this.navbar.addItem("Window/New Terminal", {command: "webide:newterminal"}, 800);
        
        _this.app.post("/terminal/create", (req, res) => {
            let _id = (req.user) ? req.user._id : 0;
            let workspaceDirname = fs.realpathSync(__dirname + "/../../.workspaces/" + _id);
            res.send(__this.create(workspaceDirname, parseInt(req.body.cols), parseInt(req.body.rows)).pid.toString());            
        });
        
        _this._.setSocketsEvents(function(socket){
            /**
             * @see https://github.com/sourcelair/xterm.js/blob/master/demo/app.js
             */
            if(!socket.hasEvent("terminal:stdin")){                 
                socket.on('terminal:stdin', (id, data) => {                    
                    __this.get(id).write(data);
                });
                
                socket.on('terminal:resize', (id, cols, rows) => {                    
                    __this.get(id).resize(cols, rows);
                });
                                
                socket.on('terminal:logs', (id, termID) => {
                    socket.emit("terminal:stdout", id, __this.logs[termID]);
                    
                    __this.get(termID).on('data', (data) => {                         
                        socket.emit("terminal:stdout", id, data);
                    });
                    
                    __this.get(termID).on("exit", () => {
                        __this.remove(id);
                        socket.emit("terminal:close", id);
                    });
                });
                
                socket.on('terminal:close', (id) => {                    
                    __this.remove(id);
                });
            }   
        });
    }
};