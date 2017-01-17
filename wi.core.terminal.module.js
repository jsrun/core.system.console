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

let SystemException = require("../wi.core.exception.js"),
    TemplateEngine = require("../wi.core.template.js");

module.exports = {    
    /**
     * List module assets
     * @type object
     */
    assets: {
        css: [__dirname + "/jquery.terminal/css/jquery.terminal.min.css", __dirname + "/wi.core.terminal.style.css"],
        js: [__dirname + "/jquery.terminal/js/jquery.mousewheel-min.js", __dirname + "/jquery.terminal/js/jquery.terminal.min.js", __dirname + "/jquery.terminal/js/unix_formatting.js", __dirname + "/wi.core.terminal.events.js"]
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
    }
};