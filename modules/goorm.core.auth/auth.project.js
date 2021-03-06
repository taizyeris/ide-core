/**
 * Copyright Sung-tae Ryu, goormDev Team. All rights reserved.
 * Code licensed under the AGPL v3 License:
 * http://www.goorm.io/intro/License
 * email : contact@goorm.io
 *       : sungtae.ryu@goorm.io
 * project_name : goormIDE
 * version: 2.0.0
 **/

var duration = 60 * 60 * 36; // seconds

var EventEmitter = require("events").EventEmitter;
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var fs = require('fs');
var async = require('async');



var g_auth_manager = require('./auth.manager.js');
var g_secure = require('../goorm.core.secure/secure');
var platform = require('os');




var os = {

	// Group Add
	'get_new_group': function(author) {
		var randomStringfunc = function(bits) {
			var chars, rand, i, ret;

			chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzabcdefghijkl';
			ret = '';

			while (bits > 0) {
				// 32-bit integer
				rand = Math.floor(Math.random() * 0x100000000);
				// base 64 means 6 bits per character, so we use the top 30 bits from rand to give 30/6=5 characters.
				for (i = 26; i > 0 && bits > 0; i -= 6, bits -= 6) {
					ret += chars[0x3F & rand >>> i];
				}
			}

			return ret;
		};

		var new_group = randomStringfunc(54).toLowerCase() + (new Date()).getTime();

		return new_group;
	},

	'generate_group': function(new_group) {
		var c = '';

		if (new_group) {
			new_group = g_secure.command_filter(new_group);
			c = 'addgroup ' + new_group;
		}

		return c;
	},

	'get_uid': function(author) {
		var c = '';

		if (author) {
			author = g_secure.command_filter(author);
			c = 'id -u ' + author;
		}

		return c;
	},

	'get_gid': function(group_name) {
		var c = '';

		if (group_name) {
			group_name = g_secure.command_filter(group_name);
			c = 'cat /etc/group | grep ^' + group_name + ':';
		}

		return c;
	},

	'group_del': function(group_name) {
		var c = '';

		if (group_name) {
			group_name = g_secure.command_filter(group_name);
			c = 'groupdel ' + group_name;
		}

		return c;
	},

	'user_add': function(group, user) {
		var c = '';

		if (group && user) {
			group = g_secure.command_filter(group);
			user = g_secure.command_filter(user);
			c = 'usermod -a -G ' + group + ' ' + user;
		}

		return c;
	},

	'user_del': function(group, user) {
		var c = '';

		if (group && user) {
			group = g_secure.command_filter(group);
			user = g_secure.command_filter(user);
			c = 'gpasswd -d ' + user + ' ' + group + ' &';
		}

		return c;
	}
};

module.exports = {
	

	

	

	

	
	

	

	
	
	
	add_user: function(user_list, group_name, callback) {
		var self = this;
		// var evt = new EventEmitter();

		// evt.on('add_user', function(evt, i) {
		// 	if (user_list[i]) {
		// 		var user = user_list[i];
		// 		// if (user_list[i].indexOf('_') > -1) {
		// 		// 	user = user.split('_');
		// 		// 	user.pop();
		// 		// 	user.join('_');
		// 		// 	user = user[0];
		// 		// }

		// 		self.g_exec(os.user_add(group_name, user), function(result) {
		// 			evt.emit('add_user', evt, ++i);
		// 		});
		// 	} else {
		// 		callback(true);
		// 	}
		// });
		// evt.emit('add_user', evt, 0);
		async.each(user_list, function(item, callback) {
			var user = item;

			self.g_exec(os.user_add(group_name, user), function(result) {
				callback();
			});
		}, function(err) {
			if (!err) {
				callback(true);
			}
		});
	},

	del_user: function(user_list, group_name, callback) {
		var self = this;
		var evt = new EventEmitter();

		// evt.on('del_user', function(evt, i) {
		// 	if (user_list[i]) {
		// 		// var user = user_list[i].split('_')[0];
		// 		var user = user_list[i];

		// 		self.g_exec(os.user_del(group_name, user), function(result) {
		// 			evt.emit('del_user', evt, ++i);
		// 		});
		// 	} else {
		// 		callback(true);
		// 	}
		// });
		// evt.emit('del_user', evt, 0);
		async.each(user_list, function(item, callback) {
			var user = item;

			self.g_exec(os.user_del(group_name, user), function(result) {
				callback();
			});
		}, function(err) {
			if (!err) {
				callback(true);
			}
		});
	},
	
	

	

	
	add_group: function(option, callback) {
		var self = this;

		var author = option.author; // user id
		var project_path = option.project_path;

		// 1. get new group
		var new_group = os.get_new_group(author);

		// 2-1. add group to ubuntu
		self.g_exec(os.group_generate(author), function(group_generate_result) {

			// 3. user add

		});
		
	},
	
	g_exec: function(command, callback) {

		exec(command, function(err, stdout, stderr) {
			if (err) {
				console.log(err, stdout, stderr);
				if (callback) callback(false);
			} else {
				var result = stdout || true;
				if (callback) callback(result);
			}
		});
	},

	get_invite_email_content: function(user_data, project_path, _permission, callback) {
		var email_content_path = global.__path + 'modules/goorm.core.collaboration/invitation_mail_content_' + user_data.language;
		var permission = this.convert_permission(_permission, user_data.language);

		fs.readFile(email_content_path, "utf8", function(err, data) {
			var protocol = (global.__secure) ? 'https' : 'http';

			data = data.replace(/\[DEMO_URL\]/gi, protocol+'://'+IDE_HOST+'/user/project/collaboration/invitation/push/email?project_path='+project_path).replace(/\[HOST_USER\]/gi, user_data.invite_user).replace(/\[CLIENT_USER\]/gi, user_data.name).replace(/\[PROJECT_NAME\]/gi, user_data.project_name).replace(/\[PROJECT_TYPE\]/gi, user_data.project_type).replace(/\[PROJECT_PERMISSION\]/gi, permission).replace(/\[PROJECT_DATE\]/gi, user_data.project_date).replace(/\[INVITATION_MESSAGE\]/gi, user_data.invitation_msg);

			// this part must be changed to follow localization data....
			var subject = "";
			if (user_data.language == "kor") {
				subject = user_data.invite_user + " 님께서 " + user_data.name + " 님을 '" + user_data.project_name + "' 프로젝트에 초대하셨습니다.";
			}
			else if (user_data.language == "us") {
				subject = user_data.invite_user + " invites you (" + user_data.name + ") to '" + user_data.project_name + "' project.";
			}
			else {
				subject = user_data.invite_user + "님께서 " + user_data.name + "님을 '" + user_data.project_name + "' 프로젝트에 초대하셨습니다.";
			}
			
			callback(subject, data);
		});
	},

	convert_permission: function (permission, language) {
		var contents = permission;
		
		switch (permission) {
			case "readonly":
				if (language === 'kor') {
					contents = "읽기 전용";
				}
				else {
					contents = "ReadOnly";
				}
				break;

			case "editable":
				if (language === 'kor') {
					contents = "수정 가능";
				}
				else {
					contents = "Writable";
				}
				break;

			case "manager":
				if (language === 'kor') {
					contents = "수정 및 공유 가능";
				}
				else {
					contents = "Writable & Shareble";
				}
				break;

			default:
				break;
		}

		return contents;
	},

	

	

	
	
	
	// change goorm.manifest's permission and owner. Jeong-Min Im.
	manifest_setting: function(project_path, callback) {
		

		
	},

	// change bin's group permission. Jeong-Min Im.
	bin_setting: function(project_path, callback) {
		exec('find ' + global.__workspace + project_path + '/bin -exec chmod -R 774 {} \\;', function(err) {
			callback();
		});
	},

	// check manifest is valid or not. Jeong-Min Im.
	valid_manifest: function(project_path, cur_manifest, callback) {
		var self = this;
		var today = new Date();
		var today_month = parseInt(today.getMonth(), 10) + 1;
		var date_string = today.getFullYear() + '/' + today_month + '/' + today.getDate() + ' ' + today.getHours() + ':' + today.getMinutes() + ':' + today.getSeconds();

		// validate manifest and fix it. Jeong-Min Im.
		function fix_manifest() {
			if (cur_manifest.author + '_' + cur_manifest.name != project_path) { // wrong goorm.manifest -> fix it!
				
			} else { // right goorm.manifest
				self.manifest_setting(project_path, function() {
					callback(JSON.stringify(cur_manifest));
				});
			}
		}

		if (!cur_manifest) {
			fs.readFile(global.__workspace + project_path + '/goorm.manifest', { // getting cur_manifest
				encoding: 'utf8'
			}, function(err, data) {
				if (err) { // jeongmin: no goorm.manifest
					console.log('goorm.manifest reading error in valid_manifest:', err);

					// jeongmin: dummy cur_manifest
					cur_manifest = {
						author: '',
						name: ''
					};

					fix_manifest(); // jeongmin: make goorm.manifest
				} else { // jeongmin: goorm.manifest exists
					try {
						cur_manifest = JSON.parse(data);

						fix_manifest();
					} catch (e) {
						console.log('goorm.manifest parsing error in valid_manifest:', e);

						self.manifest_setting(project_path, callback);
					}
				}
			});
		} else {
			fix_manifest();
		}
	},

		
};