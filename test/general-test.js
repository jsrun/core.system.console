/**
 *  __          __  _    _____ _____  ______ _______        _   
 *  \ \        / / | |  |_   _|  __ \|  ____|__   __|      | |  
 *   \ \  /\  / /__| |__  | | | |  | | |__     | | ___  ___| |_ 
 *    \ \/  \/ / _ \ '_ \ | | | |  | |  __|    | |/ _ \/ __| __|
 *     \  /\  /  __/ |_) || |_| |__| | |____ _ | |  __/\__ \ |_ 
 *      \/  \/ \___|_.__/_____|_____/|______(_)|_|\___||___/\__|
 *                                                                                                                                                                                                   
 *  @author André Ferreira <andrehrf@gmail.com>
 *  @license MIT
 */

"use strict";

let assert = require("assert"),
    terminal = require("../bootstrap.js");
    
describe("Testing terminal functions", () => {
    it("Checking terminal typeof", () => { assert.equal(typeof terminal, "object"); });
    
    var term = terminal.create(__dirname, 80, 80);
    var termData = "";
    
    term.on('data', (data) => { termData = data.toString(); });
    
    it("Creating terminal", () => { assert.equal(typeof term, "object"); });
    it("Checking if it is a process", () => { assert.equal(typeof term.pid, "number"); });
    it("Checking has()", () => { assert.equal(terminal.has(term.pid), true); });
    it("Checking get()", () => { assert.equal(typeof terminal.get(term.pid), "object"); });
    
    it("Checking write()", () => { 
        terminal.write(term.pid, "ok");
        setTimeout(function(){ assert.equal(termData, "ok");  }, 200);
    });
    
    it("Checking remove()", () => { assert.equal(terminal.remove(term.pid), true); });
    
    //Testing bootstrap function
});