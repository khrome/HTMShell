//Abbey's experimental ECMAScript Shell
//todo: https://github.com/mscdex/node-ncurses
var path = './';
if(arguments.length == 1){
    path = arguments[0];
}
print('HTMShell 0.1');
load(path+'lib/env.rhino.1.1.js');
load(path+'lib/mootools-core-server.js');
print('MooTools v'+MooTools.version);
load(path+'lib/print_r.js');
load(path+'lib/Base64.js');

if(!String.splitHonoringQuotes){
    String.implement({
        splitHonoringQuotes: function(delimiter, quotes) {
            if(quotes == undefined) quotes = ['\'', '"'];
            var results = [''], inQuote = false, quote = null;
            for(var lcv=0; lcv < this.length; lcv++){
                if(inQuote){
                    if(this[lcv] == quote){
                        inQuote = false;
                    }else{
                        results[results.length-1] += this[lcv];
                    }
                }else{
                    if(quotes.contains(this[lcv])){
                        quote = this[lcv];
                        inQuote = true;
                    }else if(this[lcv] == delimiter){
                        results[results.length] = '';
                    }else{
                        results[results.length-1] += this[lcv];
                    }
                }
            }
            return results;
        }
    });
}
if(!String.execute){
    String.implement({
        execute : function(){
            var pieces = this.splitHonoringQuotes(' ');
            var command = pieces.shift();
            var options = {
                args : pieces,
                output : ''
            }
            runCommand(command, options);
            return options.output;
        }
    });
}

var cmd = function(input){
    return input.execute();
}

// executable

var htmsh = {
    register: function(binary, scope){
        if(scope) scope[binary.name] = binary.execute.bind(binary);
        this[binary.name] = binary.execute.bind(binary);
    }
};
// This is the core binary base class
var Binary = new Class({
    name : '',
    mapping : {},
    defaults : {},
    noValueOpts : [],
    requiredOpts : [],
    initialize : function(name){
        this.name = name;
    },
    execute : function(options){
        if(!options) options = {};
        var opts = {};
        for(optName in options){
            opts[optName] = options[optName];
        }
        this.requiredOpts.each(function(optName){
            if(options[optName] == undefined){
                print_r(options);
                throw('Required option ('+optName+') not found.');
            }
        });
        for(optName in this.defaults){
            if(!options[optName]){
                options[optName] = this.defaults[optName];
            }
        }
        for(optName in options){
            if(this.mapping[optName]){
                options[this.mapping[optName]] = options[optName];
                delete options[optName];
            }
        }
        var args = [];
        var targets = [];
        this.noValueOpts.each(function(opt){
            if(options[opt]){
                targets.push(options[opt]);
                delete options[optName];
            }
        });
        for(optName in options){
            if(options[optName] == '') continue;
            print(optName+' : '+options[optName])
            if(options[optName] === true){
                if(optName.trim().length == 1) args.push('-'+optName);
                else args.push('--'+optName);
            }else{
                if(optName.trim().length == 1) args.push('-'+optName+' "'+options[optName]+'"');
                else args.push('--'+optName+' "'+options[optName]+'"');
            }
        }
        targets.each(function(target){
            args.push(target);
        });
        var runOpt={
            output:'',
            args:args
        };
        runCommand(this.name, runOpt);
        return this.parse(runOpt.output.trim(), opts);
    },
    parse : function(output, options){
        return output;
    }
});
// [ls]******************************************************
htmsh.register(new new Class({ //Yes, I just did that
    Extends : Binary,
    initialize : function(){
        this.parent('ls');
        this.noValueOpts = ['directory'];
        this.mapping = {
            longformat : 'l',
            all : 'a'
        }
        this.defaults = {
            directory : '.'
        }
    },
    execute : function(options){ //we're going to allow the user to pass in a directory as a string
        if(!options) options = {};
        if(options && typeof options == 'string' && options.indexOf(' ') == -1) options = {directory:options};
        return this.parent(options);
    },
    parse : function(data, options){
        var results = [];
        var lines = data.split("\n");
        lines.each(function(line){
            if(options.longformat){
                var info = line.replace(/ +/g, ' ').split(' ');
                if(info.length > 7)
                results.push({
                    permissions : info.shift(),
                    links : info.shift(),
                    user : info.shift(),
                    group : info.shift(),
                    bytes : info.shift(),
                    date : info.shift()+' '+info.shift()+' '+info.shift(),
                    name : info.join(' ')
                    
                });
            }else{
                results.push(line);
            }
        });
        return results;
    }
}), this);
// [cd]******************************************************
htmsh.register(new new Class({
    Extends : Binary,
    initialize : function(){
        this.parent('cd');
        this.noValueOpts = ['directory'];
        this.requiredOpts = ['directory'];
    },
    execute : function(options){ //we're going to allow the user to pass in a directory as a string
        if(!options) options = {};
        if(options && typeof options == 'string') options = {directory:options};
        return this.parent(options);
    }
}), this);
// [pwd]*****************************************************
htmsh.register(new new Class({
    Extends : Binary,
    initialize : function(){
        this.parent('pwd');
    }
}), this);
// [exit]******************************************************
command = new new Class({
    initialize : function(){},
    execute : function(options){
        quit();
    }
});
var exit = command.execute.bind(command);
var x = exit;
htmsh.register(command);
//***********************************************************
delete command; //now we 
// morse code for 'try' : _._._.__
var _={_:{_:{__:function(){print(readFile('resources/opus').decodeBase64());}}}}