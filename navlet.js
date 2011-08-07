(function() {
	
	var navlet;
	
	var AppConfig = {
		
		"useIframeMode": false,
		
		"labels": {
			
			"StartMonitoring" : "Start Monitoring",
			"StopMonitoring" : "Stop Monitoring"
		},
		
		NavTimingProperties : [
			{
				"name" : "navigationStart",
				"desc" : "Time point at which the navigation begins"
			},
			{
				"name" : "unloadEventStart",
				"desc" : "Time at which the user agent starts unloading the previous document, if there is one, otherwise 0"
			},
			{
				"name" : "unloadEventEnd",
				"desc" : "Time at which the previous document finishes unloading the previous document, otherwise 0"
			},
			{
				"name" : "redirectStart",
				"desc" : "If any redirects are involved, this is the time point at which the first fetch request that initiates the redirect starts, other wise 0"
			},
			{
				"name" : "redirectEnd",
				"desc" : "If there were any redirects involved, the time point at which the last byte of the last redirect is received, otherwise 0"
			},
			{
				"name" : "fetchStart",
				"desc" : "For HTTP GET requests, the time at which the user agent starts to check the application cache, otherwise the point at which the resource fetch starts"
			},
			{
				"name" : "domainLookupStart",
				"desc" : "Time point at which the user agent starts the domain name lookup for the document. If the document is retrieved from the cache, this is the same as fetchStart"
			},
			{
				"name" : "domainLookupEnd",
				"desc" : "Time at which the user agent finishes looking up the domain name. If the document is being retrieved from a cache or locally, same as fetchStart"
				
			},
			{
				"name" : "connectStart",
				"desc" : "Time when the user agent starts establishing a connection to the server. If the document is retrieved from the application cache or otherwise locally, this is the same as domainLookupEnd"
			},
			{
				"name" : "connectEnd",
				"desc" : "Time when the user agent finishes establishing a connection to the server. If the document is retrieved from the application cache or otherwise locally, this is the same as domainLookupEnd"
			},
			{
				"name" : "secureConnectionStart",
				"desc" : "Optional attribute – it is undefined for user agents that don’t provide it. If HTTPS is used, this is the time point when the user agent starts the handshake process to secure the connection. If HTTPS is not used, this is 0"
			},
			{
				"name" : "requestStart",
				"desc" : "The time when the user agent starts requesting the document from the server, or from the application cache or other local resource"
			},
			{
				"name" : "responseStart",
				"desc" : "Time point immediately following when the user agent receives the first byte of the response from the server, application cache, or local resource"
			},
			{
				"name" : "responseEnd",
				"desc" : "Time point immediately following when the user agent receives the last byte of the response from the server, application cache, or local resource"
			},
			{
				"name" : "domLoading",
				"desc" : "Time point when the user agent sets the readyState of the current document to “loading”"
			},
			{
				"name" : "domInteractive",
				"desc" : "Time point when the user agent sets the readyState of the current document to “interactive” – this is the first point where the user can interact with the page"
			},
			{
				"name" : "domContentLoadedEventStart",
				"desc" : "Time point right before the user agent fires the DOMContentLoaded event"
			},
			{
				"name" : "domContentLoadedEventEnd",
				"desc" : "Time point right after the DOMContentLoaded event completes"
			},
			{
				"name" : "domComplete",
				"desc" : "Time point right before the user agent sets the readyState to “complete”"
			},
			{
				"name" : "loadEventStart",
				"desc" : "Time point right before the user agent fires the onload event"
			},
			{
				"name" : "loadEventEnd",
				"desc" : "Time point right after the onload event completes"
			}
			
		]
	}
	
	var log = function(msg) {
		console.log(msg);
	}
	
	var error = function(msg) {
		console.error(msg);
	}
	
	var addEvent = (function () {
		var setListener = function (el, ev, fn) {
			if (el.addEventListener) {
				setListener = function (el, ev, fn) {
					el.addEventListener(ev, fn, false);
				};
			} else if (el.attachEvent) {
				setListener = function (el, ev, fn) {
					el.attachEvent('on' + ev, fn);
				};
			} else {
				setListener = function (el, ev, fn) {
					el['on' + ev] =  fn;
				};
			}
			setListener(el, ev, fn);
		};
	 
		return function (el, ev, fn) {
			setListener(el, ev, fn);
		};
	})();
		
	var isSet = function(ref) {
		return typeof(ref) != "undefined" && ref != null;
	};
		
	var generateElement = function(tagName, eltConf, context) {
		
		if(!isSet(context)) {
			context = window.document;
		}
		
		var elt = context.createElement(tagName);
		
		for(var attr in eltConf) {
			if(attr == "innerHTML") {
				elt.innerHTML = eltConf[attr];
			}
			else {
				elt.setAttribute(attr, eltConf[attr]);
			}			
		}
		
		return elt;
	}
		
	
	
	var Panel = function() {
		
		var id, tpl, domCtx, ctx, cssClass, panelType, template, data;
		
		var predefinedPanels = {
			"dock-panel": {},
			"bottom-panel" : {},
			"top-left-panel": {},
			"top-right-panel": {}
		}
		
		var generateContainer = function(html, cb) {
			
			var elt ;
			
			elt = generateElement("div", {
				"id": id,
				"class": "panel " + panelType
			}, ctx.document);
			
			
			domCtx.appendChild(elt);
			
			var panel = ctx.document.getElementById(id);
			panel.innerHTML = html;
			update();
			togglePanel();
			attachPanelEvents();
			
			return elt;
		}
		
		var attachPanelEvents = function() {
			var toggle = ctx.document.querySelectorAll("#"+ id +" .panel-header")[0]
			addEvent(toggle, "click", togglePanel);
		}
		
		var togglePanel = function() {
			
			var panelContent = ctx.document.querySelectorAll("#"+ id +" .panel-content")[0];
			if(panelContent.style.display == "none") {
				panelContent.style.display = "block";
			}
			else {
				panelContent.style.display = "none";
			}
			
		}
		
		var getPanelContent = function() {
		
			return ctx.document.querySelectorAll("#"+ id +" .panel-content")[0];
		}
		
		var update = function() {
			ctx.document.querySelectorAll("#"+ id +" .panel-content-wrap")[0].innerHTML = template(data);
			
			var actions = ctx.document.querySelectorAll("#"+ id +" .action");
			
			for(var i=0; i<actions.length; i++) {
				addEvent(actions[i], "click", (function() {
					
					var actionEvent = actions[i].getAttribute("data-global-event");
					return function() {
						navlet.executeAction(actionEvent);
					}
				})());
			}
		}
		
		var buildPanel = function() {
		
			var html = [];
			var expanded = true;
			
			html.push("<div class='panel-header'>");
			html.push("    <h1 class='panel-title'>" + title + "</h1>");
			
			html.push("    <a class='panel-toggle panel-action' href='javascript:void(0)'>" + (expanded ? "collapse" : "expand") + "</a>");
			//html.push("    <a class='panel-close panel-action' href='javascript:void(0)'>close</a>");
			
			html.push("</div>");
			
			html.push("<div style='display:none' class='panel-content'><div class='panel-content-wrap'>");
			html.push("</div>");
			
			var panelStub = generateContainer(html.join(""), function() {alert('done')});
			
		};
		
		return {
			init: function(windowContext, jsonConf) {
				ctx = windowContext || window;
				
				if(isSet(jsonConf)) {
					domCtx =  jsonConf.domContext ||  ctx.document.getElementsByTagName('body')[0];
					title = jsonConf.title || "Default title";
					panelType = jsonConf.panelType;
					if(!isSet(predefinedPanels[panelType])) {
						error("Panel type not well defined")
					}
					
					data = jsonConf.data;
					if(!isSet(data)) {
						log("Panel data not defined")
					}
					
					template = jsonConf.template;
					if(!isSet(template)) {
						template = function() {return ''};
						log("Panel template not defined")
					}
					
					id = panelType + "-id";
				}
				else {
					error("Panel conf not well defined")
				}
				
				buildPanel();
				
				return this;
			},
			
			updateData: function(newData) {
				data = newData ;
				update();
			}
		}
	}
	
	var Navlet = function() {
		
		var supportNavigationTimingAPI;
		var canvas_frame, ctx, body, head, navletMainNode;
		var panels = [];
		var masterWindow, remoteWindow;
		var monitorModeOn = false;
		
		var displayNoSupportMessage = function () {
			
				alert("Your browser does not support the Navigation Timing API");
		};
			
		
		var initLocalMode = function() {
			
			if(supportNavigationTimingAPI) {
			
				// Destroy previous instances:
				var dirtyNavletContainer = ctx.document.getElementById("navlet");
				if(isSet(dirtyNavletContainer)) {
					body.removeChild(dirtyNavletContainer);
				}
				
				navletMainNode = generateElement("div", {
					"id": "navlet"
				}, ctx.document);
				
				body.appendChild(navletMainNode);
				
				var linkNode = generateElement("link", {
					"id": "navlet-css",
					"type": "text/css",
					"rel": "stylesheet",
					"href": ctx.navlet.url_root + 'navlet.css',
					"media": "screen"
				}, ctx.document);
				
				body.appendChild(linkNode);
				
				
				var data = ctx.performance.timing;
				
				var dockPanel = Panel().init(ctx, {
					"title" : "Dock",
					"domContext" : navletMainNode,
					"panelType" : "dock-panel",
					"template": function(data) {
						
						var html = [];
						html.push("<a data-global-event='close-navlet' class='button action' href='javascript:void(0)' >close Navlet</a>");
						html.push("<a id='toggle-monitoring' data-global-event='toggle-monitoring' class='button action' href='javascript:void(0)' >"+ AppConfig.labels.StartMonitoring+"</a>");
						html.push("<a data-global-event='close-navlet' class='button action' href='javascript:void(0)' >show diagram</a>");
						html.push("<a data-global-event='close-navlet' class='button action' href='javascript:void(0)' >about</a>");
						
						return html.join('');
					}
				});
				panels.push(dockPanel);
				
				var rawValuePanel = Panel().init(ctx, {
					"title" : "Raw Values",
					"domContext" : navletMainNode,
					"panelType" : "top-left-panel",
					"data": data,
					"template" : function(data) {
						
						var rawListHtml = "<ul  class='list'>";
						var tmpPropName ;
						for(var i=0, l=AppConfig.NavTimingProperties.length; i<l; i++) {
							tmpPropName = AppConfig.NavTimingProperties[i].name
							rawListHtml += "<li class='entry'><span class='entry-label'>"+ tmpPropName +"</span>: "+data[tmpPropName] + "</li>"
						}
						   
						rawListHtml += "</ul>";
						
						return rawListHtml;
					}
				});
				panels.push(rawValuePanel);
				
				var advValuePanel = Panel().init(ctx, {
					"title" : "Custom Values",
					"domContext" : navletMainNode,
					"panelType" : "top-right-panel",
					"data": data,
					"template" : function(data) {
						
						var advList = "<ul class='list'>";
				
						function addItemToAdvList(key, value) {
							advList += "<li class='entry'><span class='entry-label'>"+key+"</span>: "+value + "</li>";
						}
						
						addItemToAdvList("responseStart - navigationTime", (data.responseStart - data.navigationStart));
						
						addItemToAdvList("connection duration", (data.connectEnd - data.connectStart));
						addItemToAdvList("domLoading - responseStart", (data.domLoading - data.responseStart));
						addItemToAdvList("domInteractive - responseStart", (data.domInteractive - data.responseStart));
						
						addItemToAdvList("domContentLoadedEventStart - responseStart", (data.domContentLoadedEventStart - data.responseStart));
						addItemToAdvList("domReadyEvent duration", (data.domContentLoadedEventEnd - data.domContentLoadedEventStart));
						
						addItemToAdvList("loadEventStart - responseStart", (data.loadEventStart - data.responseStart));
						addItemToAdvList("loadEvent duration", (data.loadEventEnd - data.loadEventStart));
						
						advList += "</ul>";
						
						return advList;
					}
				});
				panels.push(advValuePanel);
				
				var chartPanel = Panel().init(ctx, {
					"title" : "Chart",
					"domContext" : navletMainNode,
					"panelType" : "bottom-panel",
					"data": data,
					"template" : function(data) {
						
						var advList = "<ul class='list'>";
				
						function addItemToAdvList(key, value) {
							advList += "<li class='entry'><span class='entry-label'>"+key+"</span>: "+value + "</li>";
						}
						
						addItemToAdvList("responseStart - navigationTime", (data.responseStart - data.navigationStart));
						
						addItemToAdvList("connection duration", (data.connectEnd - data.connectStart));
						addItemToAdvList("domLoading - responseStart", (data.domLoading - data.responseStart));
						addItemToAdvList("domInteractive - responseStart", (data.domInteractive - data.responseStart));
						
						addItemToAdvList("domContentLoadedEventStart - responseStart", (data.domContentLoadedEventStart - data.responseStart));
						addItemToAdvList("domReadyEvent duration", (data.domContentLoadedEventEnd - data.domContentLoadedEventStart));
						
						addItemToAdvList("loadEventStart - responseStart", (data.loadEventStart - data.responseStart));
						addItemToAdvList("loadEvent duration", (data.loadEventEnd - data.loadEventStart));
						
						advList += "</ul>";
						
						return advList;
					}
				});
				panels.push(chartPanel);
				
			}
			else {
				displayNoSupportMessage();
			}
		};
		
		var startMonitorMode = function() {
			
			monitorModeOn = true;
			// Attach event handler to receive data from remote windows:
			ctx.addEventListener("message", function(e){
					console.log(e.data);
					
					for(var i=0; i<panels.length; i++) {
						panels[i].updateData(e.data);
					}
					spawnRemoteWindow();
			}, false);
			
			spawnRemoteWindow();
		};
		
		var stopMonitorMode = function() {
			
			// Attach event handler to receive data from remote windows:
			ctx.removeEventListener("message");
			
			if(isSet(remoteWindow)) {
				if(remoteWindow.close) {
					remoteWindow.close();
				}
				remoteWindow = null;
			}
			
			monitorModeOn = false;
		};
		
		var spawnRemoteWindow = function() {
			
			var windowOptions = [];
			windowOptions.push("width=400");
			windowOptions.push("height=400");
			//windowOptions.push("menubar=1");
			//windowOptions.push("resizable=1");
			//windowOptions.push("location=1"); 
			
			var windowId =(new Date()).getTime();
			
			if(isSet(remoteWindow)) {
				if(remoteWindow.close) {
					remoteWindow.close();
				}
				remoteWindow = null;
			}
			
			remoteWindow = ctx.open(
				ctx.location.href,
				"_blank",
				windowOptions.join(',')
			);
			
			ctx.focus();
			
			
			remoteWindow.navlet = {"url_root" : ctx.navlet.url_root }
			
			setTimeout(function(){
			
				var remoteNavlet = new Navlet();
				remoteNavlet.init(remoteWindow, 
					{
						"remote" : true,
						"masterWindow": ctx
					}
				);
					
				
			}, 1000);
			
		};
		
		var initRemoteMode = function() {
			
			setTimeout(function(){	
					 masterWindow.postMessage(ctx.performance.timing, ctx.location.href);
					 ctx.close();
			},2000);
		}
		
		return {
			init: function(context, conf) {
				
				ctx = isSet(context) ? context : window;	
				masterWindow = ctx;				
				body = ctx.document.getElementsByTagName('body')[0];
				head = ctx.document.getElementsByTagName('head')[0];
								
				// Check for support:
				supportNavigationTimingAPI = ctx.performance ? true : false ;
				
				if(isSet(conf) && isSet(conf.masterWindow)) {
					masterWindow = conf.masterWindow;
				}
				
				
				if(isSet(conf) && typeof(conf.remote) == "boolean" && conf.remote) {
					
					initRemoteMode();				
				}
				else {
				
					initLocalMode();
				}
				
			},
			
			executeAction : function(actionName) {
			
				if(actionName == "toggle-monitoring") {
					if(monitorModeOn) {
						stopMonitorMode();
						ctx.document.getElementById("toggle-monitoring").innerHTML = AppConfig.labels.StartMonitoring;
					}
					else {
						startMonitorMode();
						ctx.document.getElementById("toggle-monitoring").innerHTML = AppConfig.labels.StopMonitoring
					}
				}
				else if(actionName == "close-navlet") {
					stopMonitorMode();
				}
				else {
					alert("no action mapped: " + actionName)
				}
				
			}
		}
	};
	
	navlet = new Navlet();
	navlet.init(window);
	
})()