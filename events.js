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

webide.module("terminal", function(tabs, commands){
    tabs.layout.registerComponent('terminal', function(container, state){//Register tab type
        container.id = state.id;
        container.getElement().html("<div id='wi-terminal-" + state.id + "' class='wi-terminal'></div>");
        tabs.itens[state.id].container = container;
        
        if(typeof tabs.itens[state.id].cb == "function")
            tabs.itens[state.id].cb(state.id);
    });
        
    commands.add("webide:newterminal", function(){ webide.terminal.create(); });//Map command to create terminal
        
    this.extends("terminal", {
        /**
         * jQuery Terminal object
         * @type object
         */
        terminals: {},
                
        /**
         * Function to perform actions on all terminals
         * @param function fn
         * @return void
         */
        all: function(fn){
            for(var key in this.terminals)
                if(typeof fn == "function")
                    fn(this.terminals[key]);
        },
        
        /**
         * Function to perform actions on a specific terminal
         * 
         * @param string _id
         * @param function fn
         * @return void
         */
        get: function(id, fn){
            if(this.terminals[id])
                if(typeof fn == "function")
                    fn(this.terminals[id]);
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
         * Function to remove terminal
         * 
         * @param string id
         * @return boolean
         */
        remove: function(id){
            if(this.has(id))
                delete this.terminals[id];
        },
        
        /**
         * Function to create terminal
         * 
         * @see http://udvarigabor.hu/replacing-ttyjs-frontend-to-xtermjs/
         * @param string username
         * @param function cb
         * @return void
         */
        create: function(cb){
            var _this = this;
            var _id = new Date().getTime();
                        
            tabs.add("Terminal", _id.toString(), "terminal", {height: 150}, function(id){
                setTimeout(function(id){
                    _this.terminals[id] = new Terminal({cursorBlink: true});                    
                    _this.terminals[id].open(document.querySelector("#wi-terminal-" + id));
                    _this.terminals[id].fit();
                    
                    webide.send("/terminal/create", {cols: _this.terminals[id].cols, rows: _this.terminals[id].rows}, function(termID){
                        _this.terminals[id].id = termID;

                        _this.terminals[id].on('data', function(data) {
                            webide.io.emit('terminal:stdin', termID, data);
                        });

                        _this.terminals[id].on('resize', function(data) {
                            webide.io.emit('resize', termID, _this.terminals[id].cols, _this.terminals[id].rows);
                        });

                        webide.io.on('connect', function() {
                            _this.terminals[id].writeln('Connected.');
                            _this.terminals[id].writeln('');
                        });

                        webide.io.on('terminal:stdout', function(id, data) {
                            _this.terminals[id].write(data);
                        });
                        
                        webide.io.on('terminal:close', function(id) {
                            webide.terminal.remove(id);
                            tabs.remove(id);
                        });
                        
                        setTimeout(function(id, termID){ webide.io.emit('terminal:logs', id, termID); }, 300, id, termID);
                        
                        if(typeof cb == "function")
                            cb(_this.terminals[id], id, termID);
                    });                      
                }, 300, id);
            }, function(id){
                if(_this.has(id))
                    webide.io.emit("terminal:close", _this.get(id).id);
                
                return true;
            });
        },
        
        /**
         * Function to exec command in new terminal
         * 
         * @param string cwd
         * @param string cmd
         * @param function onexit
         * @return void
         */
        exec: function(cwd, cmd, onexit){
            var _this = this;
            
            this.create(function(terminal, id, termID){                
                setTimeout(function(){
                    let cmdStr = "cd ." + cwd;
                    
                    if(cmd)
                        cmdStr += "  && \n " + cmd + "\n";
                    
                    webide.io.emit('terminal:stdin', termID, cmdStr);
                }, 300);
            });
        }
    });
});