/**
 * killroy
 *
 * Copyright 2014 sd84
 * Released under the MIT license
 */
(function(){
	'use strict';
	/**
	 * Clever bot api wrapper
	 * @param Cleverbot
	 */
	var Cleverbot = require('cleverbot-node');
	
	/**
	 * cli node interaction environment
	 * @param prompt
	 */
	var prompt = require('prompt');
	
	/**
	 * Express module
	 * @param express
	 */
	var express = require('express');

	/**
	 * HTTP request wrapper
	 * @param resquest
	 */
	var request = require('request');
	
	/**
	 * Sys wrapper for node
	 * @param sys
	 */
	var sys = require('sys');
	
	/**
	 * Package.json
	 * @param pkg
	 */
	var pkg = require('../package.json');
	
	/**
	 * Filesystem wrapper for node
	 * @param fs
	 */
	var fs = require('fs');
	
	/**
	 * Cleverbot instance
	 * @param ai
	 */
	var ai = new Cleverbot();
	
	/** @namespace */
	var killroy = {};

	/**
	 * Listens for input messages
	 * @param {string} msg - The input text.
	 * @event listen
     */
	function listen (msg){
		killroy.msg = msg;
		var ask = {
			name: 'ask',
			type: 'string',
			required: true,
			message: "you can say anything, but try checking my 'help'",
			description: killroy.msg.cyan.bold	
		};
		speak(ask, function (err, result){
			filter(result.ask);
		});
	}

	/**
	 * Break strings into array of parts, by spaces
	 * @param {string} input - The input text.
	 * @event filter
	 */
	function filter (input){
		killroy.input = input;
		var words = input.toLowerCase().split(' ');
		think(words);
	}

	/**
	 * Process input agaist set commands, default to cleverbot
	 * @param {array} words - The input text, broken into parts by spaces.
	 * @event think
	 */
	function think (words){
		for (var i in killroy.commands){
			if (words[0] === killroy.commands[i].title){
				killroy.commands[i].code();
				return;
			}
		}
		ai.write(words.toString(), function (resp){
			listen(resp.message);
		});
	}

	/**
	 * Speak through cli
	 * @param {object} options - The input text, broken into parts by spaces.
	 * @event speak
	 */
	function speak (options, callback){
		prompt.get(options, function (err, result){
			callback(err, result);
		});
		killroy.count++;
	}

	/** @param {integer} killroy.count - init the interaction counter */
	killroy.count = 0;


	/** @param {string} killroy.msg - set message envelope */
	killroy.msg = undefined;
	
	/** @param {object} killroy.server - HTTP server instance of express */
	killroy.server = express();

	/** @param {string} killroy.user - set user placehodler */
	killroy.user = undefined;

	/** @param {string} killroy.input - set word placeholder */
	killroy.input = undefined;

	/** @param {integer} killroy.port - set port to listen on */
	killroy.port = undefined;

	/** @param {string} killroy.prompt - set prompt dialogue */
	killroy.prompt = "\nwhat's next?";

	/** @param {integer} killroy.version - killroy version */
	killroy.version = undefined;

	/** @param {array} killroy.commands - command router */
	killroy.commands = [
		{
			title: 'help',
			code: function (){
				var commands = {
					name: 'commands',
					type: 'string',
					description: killroy.getCommands().toString().cyan.bold + killroy.prompt.cyan.bold
				};
				speak(commands, function (err, result){
					filter(result.commands);
				});
			}
		},
		{
			title: 'count',
			code: function (){
				var count = {
					name: 'count',
					type: 'string',
					description: killroy.getCount().toString().cyan.bold + killroy.prompt.cyan.bold
				};
				speak(count, function (err, result){
					filter(result.count);
				});
			}
		},
		{
			title: 'define',
			code: function (){
				killroy.define(killroy.input);
			}
		},
		{
			title: 'version',
			code: function (){
				var version = {
					name: 'version',
					type: 'string',
					description: killroy.getVersion().cyan.bold + killroy.prompt.cyan.bold
				};
				speak(version, function (err, result){
					filter(result.version);
				});
				return;
			}
		}
	];
	
	/**
	 * init the instance of killroy
	 * @event killroy.init
	 */
	killroy.init = function (){
		prompt.start();
		sys.puts("\nKillroy is running! check the api guide here: http://localhost:" + killroy.getPort() + "\n".cyan.bold);
		this.setName(this.name || '');
		this.setDelimiter(this.delimiter || '');
	};

	/**
	 * @param {string} input - the word(s) to be defined.
	 * @event killroy.define
	 */
	killroy.define = function (input){
		var words = input.split('define ');
		var term = words[1];
		var options = {
			uri: "http://api.urbandictionary.com/v0/define?term=" + term,
			method: "GET",
			json: {}
		};
		request(options, function(err, response, body){
			if(!err && response.statusCode == 200){
				if(typeof body != "undefined"){
					if(body.list.length){
						var i = Math.floor(Math.random() * body.list.length);
						var output = body.list[i].definition;
						killroy.definition = '[' + term + ']: ' + output;
					}else{
						killroy.definition = "there are no results";
					}
					var define = {
						name: 'define',
						type: 'string',
						description: killroy.definition.cyan.bold + killroy.prompt.cyan.bold
					};
					speak(define, function (err, result){
						filter(result.define);
					});
				}
			}
		});
	};

	/**
	 * Say hello
	 * @event killroy.greet
	 */
	killroy.greet = function (){
		var greeting = {
			name: 'greet',
			type: 'string',
			required: true,
			default: 'guest',
			description: 'hey there, what\'s your name?'.cyan.bold
		};
		speak(greeting, function (err, result){
			killroy.user = result.greet;
			listen("what's going on, " + result.greet + "?");
		});
	};
	
	/**
	 * Get the available commands
	 * @event killroy.getCommands
	 */
	killroy.getCommands = function (){
		var orders = [];
		for (var i in killroy.commands){
			orders.push(killroy.commands[i].title);
		}
		return orders;
	};

	/**
	 * Get the current count of interactions
	 * @event killroy.getCount
	 */
	killroy.getCount = function (){
		return this.count;
	};

	/**
	 * Get the current message delimiter
	 * @event killroy.getDelimiter
	 */
	killroy.getDelimiter = function (){
		return prompt.delimiter;
	};	

	/**
	 * Get the currently set name
	 * @event killroy.getName
	 */
	killroy.getName = function (){
		return this.name;
	};

	/**
	 * Get the current active port
	 * @event killroy.getPort
	 */
	killroy.getPort = function (){
		if(typeof this.port === "undefined"){
			this.port = 333;
		}
		return this.port;
	};
	
	/**
	 * Get the current build version
	 * @event killroy.getVersion
	 */
	killroy.getVersion = function (){
		return pkg.version;
	};

	/**
	 * Listen to the set port
	 * @param port {integer} - the port to listen on
	 * @event killroy.listen
	 */
	killroy.listen = function (port){
		this.port = port || 333;
		this.server.listen(this.port);
		this.server.use(express.static('./doc/'));
		this.server.get('/', function (request, response){
			response.sendfile('./doc/index.html');
		});
	};

	/**
	 * Set a new message delimiter
	 * @event killroy.setDelimiter
	 */
	killroy.setDelimiter = function (delimiter){
		this.delimiter = delimiter;
		prompt.delimiter = this.delimiter;
	};

	/**
	 * Set a new name
	 * @event killroy.setName
	 */
	killroy.setName = function (name){
		this.name = name;
		prompt.message = this.name + ' ';
	};

	module.exports = killroy;

})();