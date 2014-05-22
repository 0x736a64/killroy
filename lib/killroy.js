/**
 * killroy
 *
 * Copyright 2014 sd84
 * Released under the MIT license
 */
(function(){
	'use strict';	
	
	var killroy = {};
	
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
	 * Cleverbot instance
	 * @param ai
	 */
	var ai = new Cleverbot();

	/**
	 * @param {string} input - the word(s) to be defined.
	 * @event define
	 */
	function define (input){
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
						description: killroy.definition.cyan.bold + killroy.question.cyan.bold
					};
					speak(define, function (err, result){
						filter(result.define);
					});
				}
			}
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
	 * Get the available commands
	 * @event getCommands
	 */
	function getCommands (){
		var orders = [];
		for (var i in killroy.commands){
			orders.push(killroy.commands[i].title);
		}
		return orders;
	}

	/**
	 * Get the current count of interactions
	 * @event getCount
	 */
	function getCount (){
		return killroy.count;
	}

	/**
	 * Get the current message delimiter
	 * @event getDelimiter
	 */
	function getDelimiter (){
		return prompt.delimiter;
	}

	/**
	 * Get the currently set name
	 * @event getName
	 */
	function getName (){
		return killroy.name;
	}
	
	/**
	 * Get the current build version
	 * @event getVersion
	 */
	function getVersion (){
		return pkg.version;
	}

	/**
	 * Say hello
	 * @event greet
	 */
	function greet(){
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
	}

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
	 * Set a new message delimiter
	 * @event killroy.setDelimiter
	 */
	function setDelimiter (delimiter){
		killroy.delimiter = delimiter;
		prompt.delimiter = killroy.delimiter;
	}

	/**
	 * Set a new name
	 * @event killroy.setName
	 */
	function setName (name){
		killroy.name = name;
		prompt.message = killroy.name + ' ';
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

	/** @param {integer} killroy.count - init the interaction counter */
	killroy.count = 0;

	/** @param {string} killroy.input - set word placeholder */
	killroy.input = undefined;

	/** @param {string} killroy.msg - set message envelope */
	killroy.msg = undefined;

	/** @param {string} killroy.question - set prompt dialogue */
	killroy.question = "\nwhat's next?";
	
	/** @param {string} killroy.user - set user placehodler */
	killroy.user = undefined;

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
					description: getCommands().toString().cyan.bold + killroy.question.cyan.bold
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
					description: getCount().toString().cyan.bold + killroy.question.cyan.bold
				};
				speak(count, function (err, result){
					filter(result.count);
				});
			}
		},
		{
			title: 'define',
			code: function (){
				define(killroy.input);
			}
		},
		{
			title: 'version',
			code: function (){
				var version = {
					name: 'version',
					type: 'string',
					description: getVersion().cyan.bold + killroy.question.cyan.bold
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
		sys.puts("\nKillroy is running!".cyan.bold);
		setName(this.name || '');
		setDelimiter(this.delimiter || '');
		greet();
	};

	module.exports = killroy;
})();