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
    pty = require('node-pty');

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
        let term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {name: 'xterm-color', cols: cols, rows: rows, cwd: cwd});
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
            
            if(typeof onend == "function")
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
    bootstrap: function(commands, terminal, navbar, app, _){        
        commands.addCommand({name: "webide:newterminal", bind: {mac: "Command-T", win: "Alt-T"}});
        navbar.addItem("Window/New Terminal", {command: "webide:newterminal"}, 800);
        
        app.post("/terminal/create", (req, res) => {
            let _id = (req.user) ? req.user._id : 0;
            let workspaceDirname = fs.realpathSync(__dirname + "/../../.workspaces/" + _id);
            res.send(terminal.create(workspaceDirname, parseInt(req.body.cols), parseInt(req.body.rows)).pid.toString());            
        });
        
        _.setSocketsEvents((socket) => {
            /**
             * @see https://github.com/sourcelair/xterm.js/blob/master/demo/app.js
             */
            if(!socket.hasEvent("terminal:stdin")){                 
                socket.on('terminal:stdin', (id, data) => {  
                    terminal.get(id).write(data);
                });
                
                socket.on('terminal:resize', (id, cols, rows) => {                    
                    terminal.get(id).resize(cols, rows);
                });
                                
                socket.on('terminal:logs', (id, termID) => {
                    socket.emit("terminal:stdout", id, terminal.logs[termID]);
                    
                    terminal.get(termID).on('data', (data) => {                         
                        socket.emit("terminal:stdout", id, data);
                    });
                    
                    terminal.get(termID).on("exit", () => {
                        terminal.remove(id);
                        socket.emit("terminal:close", id);
                    });
                });
                
                socket.on('terminal:close', (id) => {                    
                    terminal.remove(id);
                });
            }   
        });
    }
};