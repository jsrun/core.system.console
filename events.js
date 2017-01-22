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
    //Register tab type
    tabs.layout.registerComponent('terminal', function(container, state){
        container.id = state.id;
        container.getElement().html("<div id='wi-terminal-" + state.id + "' class='wi-terminal'></div>");
        tabs.itens[state.id].container = container;
        
        if(typeof tabs.itens[state.id].cb == "function")
            tabs.itens[state.id].cb(state.id);
    });
    
    //Map command to create terminal
    commands.add("webide:newterminal", function(){
        webide.terminal.create();
    });
    
    this.io.on('connect', function (data) {        
        webide.terminal.all(function(terminal){
            terminal.enable();
            terminal.find('.cursor').show();
            terminal.find('.prompt').show();
        });
    });

    this.io.on('disconnect', function (data) {        
        webide.terminal.all(function(terminal){
            terminal.disable();
            terminal.error("connection lost");
            terminal.find('.cursor').hide();
            terminal.find('.prompt').hide();
        });
    });

    this.io.on('reconnect', function (data) {        
        webide.terminal.all(function(terminal){
            terminal.enable();
            terminal.echo("connected");
            terminal.find('.cursor').show();
            terminal.find('.prompt').show();
        });        
    });

    this.io.on('stdout', function (data) {
        webide.terminal.get(data._id, function(terminal){
            terminal.echo(data.out);
            terminal.find('.cursor').hide();
            terminal.find('.prompt').hide();
        });
    });
    
    this.io.on('stderr', function (data) {
        webide.terminal.get(data._id, function(terminal){
            terminal.error(data.out); 
            terminal.find('.cursor').hide();
            terminal.find('.prompt').hide();
        });
    });

    this.io.on('cwd', function (data) {
        webide.terminal.get(data._id, function(terminal){
            terminal.cwd = data.cwd;
            terminal.set_prompt('webide@' + terminal.user + ':'+ terminal.cwd +'# ');
            terminal.find('.cursor').show();
            terminal.find('.prompt').show();
        });
    });

    this.io.on('enable', function(data) {
        webide.terminal.get(data._id, function(terminal){
            terminal.enable();
            terminal.find('.cursor').show();
            terminal.find('.prompt').show();
        });
    });

    this.io.on('disable', function(data) {
        webide.terminal.get(data._id, function(terminal){
            terminal.disable();
            terminal.find('.cursor').hide();
            terminal.find('.prompt').hide();
        });
    });
    
    this.io.on('ls', function(data) {
        webide.terminal.get(data._id, function(terminal){
            terminal.set_command(data.cmd);
        });
    });
    
    this.terminal = {
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
        get: function(_id, fn){
            if(this.terminals[_id])
                if(typeof fn == "function")
                    fn(this.terminals[_id]);
        },
        
        /**
         * Function to create terminal
         * 
         * @param string username
         * @param function cb
         * @return void
         */
        create: function(username, cb){
            var _this = this;
            var _id = new Date().getTime();
            
            if(!username)
                username = "user";
            
            webide.tabs.add("Terminal", _id.toString(), "terminal", {height: 150}, function(id){
                setTimeout(function(id){
                    _this.terminals[id] = $("#wi-terminal-" + id).terminal(function(command, term) {
                        webide.io.emit('stdin', {cmd: command, cwd: _this.terminals[id].cwd, _id: id, socket: webide.io.id});
                        _this.terminals[id].disable();
                        _this.terminals[id].find('.cursor').hide();
                        _this.terminals[id].find('.prompt').hide();
                    }, {
                        greetings: 'Welcome to WebIDE terminal',
                        prompt: 'webide@' + username + ':~# ',
                        exit: false,
                        keydown: function(e) {
                            if (e.ctrlKey && e.which == 67) {
                                console.log("Ctrl+C");
                                return false;
                            }
                            else if(e.which == 9){
                                _this.terminals[id].echo(_this.terminals[id].get_prompt() + "" + _this.terminals[id].get_command());
                                webide.io.emit('ls', {cmd: _this.terminals[id].get_command(), cwd: _this.terminals[id].cwd, _id: id, socket: webide.io.id});
                                return false;
                            }
                        }
                    });
                    
                    _this.terminals[id].user = username;
                    _this.terminals[id].cwd = "~"
                    
                    if(typeof cb == "function")
                        cb(_this.terminals[id], id);
                }, 300, id);
            });
        },
        
        /**
         * Function to exec command in new terminal
         * 
         * @param string cwd
         * @param string cmd
         * @return void
         */
        exec: function(cwd, cmd, onexit){
            var _this = this;
            
            this.create("root", function(terminal, id){
                _this.terminals[id].cwd = cwd;
                _this.terminals[id].set_prompt('webide@' + _this.terminals[id].user + ':'+ _this.terminals[id].cwd +'# ');
                
                if(typeof cmd == "string")
                    webide.io.emit('stdin', {cmd: cmd, cwd: cwd, _id: id, socket: webide.io.id, onexit: onexit});
            });
        }
    };
});