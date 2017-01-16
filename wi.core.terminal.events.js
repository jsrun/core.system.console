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

(function(){
    webide.tabs.layout.registerComponent('terminal', function(container, state){
        container.getElement().html("<div id='wi-terminal-" + state.id + "' class='wi-terminal'></div>");
        
        if(typeof webide.tabs.itens[state.id].cb == "function")
            webide.tabs.itens[state.id].cb(state.id);
    });
    
    webide.terminal = {
        terminal: null,
        
        create: function(username, cb){
            var _this = this;
            
            webide.tabs.add("Terminal", "terminal", "terminal", null, function(id){
                setTimeout(function(){
                    _this.terminal = $("#wi-terminal-" + id).terminal(function(command, term) {
                        webide.io.emit('stdin', command);
                        _this.terminal.disable();
                        _this.terminal.find('.cursor').hide();
                    }, {
                        greetings: 'Welcome to WebIDE terminal',
                        prompt: 'webide@' + username + '>',
                        exit: false
                    });
                    
                    if(typeof cb == "function")
                        cb(_this.terminal);
                    
                    webide.io.on('connect', function (data) {
                        console.log('connected');
                        _this.terminal.enable();
                        _this.terminal.find('.cursor').show();
                    });

                    webide.io.on('disconnect', function (data) {
                        console.log('you have been disconnected');
                        _this.terminal.disable();
                        _this.terminal.error("connection lost");
                        _this.terminal.find('.cursor').hide();
                    });

                    webide.io.on('reconnect', function (data) {
                        console.log('you have been reconnected');
                        _this.terminal.enable();
                        _this.terminal.echo("connected");
                        _this.terminal.find('.cursor').show();
                    });

                    webide.io.on('stdout', function (data) {
                        _this.terminal.echo(data);
                    });

                    webide.io.on('stderr', function (data) {
                        _this.terminal.error(data);
                        _this.terminal.enable();
                        _this.terminal.find('.cursor').show();
                    });

                    webide.io.on('enable', function() {
                        _this.terminal.enable();
                        _this.terminal.find('.cursor').show();
                    });

                    webide.io.on('disable', function() {
                        _this.terminal.disable();
                        _this.terminal.find('.cursor').hide();
                    });
                }, 300);
            });
        }
    };
    
    //webide.terminal.create();
})();