(function() {
	
	var navlet;
	
	var minimalRealisticUnixTime = 1313237533128 ;
	
	var AppConfig = {
		
		"useIframeMode": false,
		
		"labels": {
			
			"StartMonitoring" : "Start Monitoring",
			"StopMonitoring" : "Stop Monitoring",
			"Expand" : "expand",
			"Collapse" : "collapse"
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
	
	var isValidUnixTime = function(t) {
	
		if(isSet(t) && t > minimalRealisticUnixTime) {
			return true;
		}
		return false;
	};
	
	var PerfData = function(ctx) {
		
		if(!isSet(ctx)) {
			ctx = window;
		}
		
		var navigationTimingData = ctx.performance.timing
		var creationTime = new Date().getTime();
		
		return {
			
			getNavTimingData : function() {
				
				return navigationTimingData;
			},
			
			creationTime : function() {
			
				return creationTime;
			},
			
			isValid : function() {
			
				// Check if the performance object was ready when get:
				// Basically we check that the first and last field
				// were well set:
				
				if(isValidUnixTime(navigationTimingData['navigationStart']) 
					&& 
				   isValidUnixTime(navigationTimingData['loadEventEnd'])) {
					return true;
				}
				return false;
			}
		}
	}
	
	var PerfDataSet = function() {
		
		var set = [];
		
		return {
			
			addPerfData : function(perfData) {
				
				set.push(perfData);
			},
			
			getAverages: function() {
				return null;
			}
		}
	}
	
	var Panel = function() {
		
		var id, tpl, domCtx, ctx, cssClass, panelType, template, data, layoutClass;
		
		var predefinedPanels = {
			"dock-panel": {},
			"bottom-panel" : {},
			"top-left-panel": {},
			"top-right-panel": {}
		}
		
		var generateContainer = function(html) {
			
			var elt ;
			
			elt = generateElement("div", {
				"id": id,
				"class": "panel " + panelType
			}, ctx.document);
			
			
			domCtx.appendChild(elt);
			
			var panel = ctx.document.getElementById(id);
			panel.innerHTML = html;
			update();
			
			var previousState = ctx.localStorage.getItem(panelType + "-state")
			
			if(
				(previousState == AppConfig.labels.Expand)  // was expanded
				||
				(previousState == null)){ // was not defined, default state is expanded
				togglePanel();
			}
			
			attachPanelEvents();
			
			return elt;
		}
		
		var attachPanelEvents = function() {
			var toggle = ctx.document.querySelectorAll("#"+ id +" .panel-header")[0]
			addEvent(toggle, "click", togglePanel);
		}
		
		var togglePanel = function() {
			
			var panelToggle = ctx.document.querySelectorAll("#"+ id +" .panel-header .panel-toggle")[0];
			var txt = panelToggle.innerHTML;
			
			panelToggle.innerHTML = (txt == AppConfig.labels.Expand) ? AppConfig.labels.Collapse : AppConfig.labels.Expand;
			
			
			// Extract to a wrapper for try/catch:
			var currentState = (txt == AppConfig.labels.Expand) ? AppConfig.labels.Expand : AppConfig.labels.Collapse;
			
			
			
			// Apply layout CSS class:
			if(currentState ==  AppConfig.labels.Expand) {
				
				panelToggle.innerHTML = AppConfig.labels.Collapse;
				if(layoutClass != "")
					ctx.document.getElementById("navlet").setAttribute('class', layoutClass);
			}
			else {
				
				panelToggle.innerHTML = AppConfig.labels.Expand;
				if(layoutClass != "")
					ctx.document.getElementById("navlet").setAttribute('class', '');
			}
			ctx.localStorage.setItem(panelType + "-state", currentState);
			
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
			var expanded = false;
			
			html.push("<div class='panel-header'>");
			html.push("    <h1 class='title-font panel-title'>" + title + "</h1>");
			
			html.push("    <a class='panel-toggle panel-action anchor-font' href='javascript:void(0)'>" + (expanded ? AppConfig.labels.Expand : AppConfig.labels.Expand) + "</a>");
			//html.push("    <a class='panel-close panel-action' href='javascript:void(0)'>close</a>");
			
			html.push("</div>");
			
			html.push("<div style='display:none' class='panel-content'><div class='panel-content-wrap'>");
			html.push("</div>");
			
			var panelStub = generateContainer(html.join(""));
			
		};
		
		return {
			init: function(windowContext, jsonConf) {
				ctx = windowContext || window;
				
				if(isSet(jsonConf)) {
					domCtx =  jsonConf.domContext ||  ctx.document.getElementsByTagName('body')[0];
					title = jsonConf.title || "";
					layoutClass = jsonConf.layoutClass || "";
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
			updateView: function() {
				update();
			},
			updateData: function(newData) {
				data = newData ;	
			}
		}
	}
	
	var Navlet = function() {
		
		var supportNavigationTimingAPI;
		var canvas_frame, ctx, body, head, navletMainNode;
		var panels = [];
		var masterWindow, remoteWindow;
		var monitorModeOn = false;
		var rawOffsetValue = false;
		var dockPanel, rawValuesPanel, customValuesPanel, chartPanel;
		
		// For remote only:
		var autoCloseTimer = null;
		
		var displayNoSupportMessage = function () {
			
				alert("Your browser does not support the Navigation Timing API");
		};
			
		
		var clean = function() {
			// Destroy previous instances:
			var dirtyNavletContainer = ctx.document.getElementById("navlet");
			if(isSet(dirtyNavletContainer)) {
				body.removeChild(dirtyNavletContainer);
			}
		};
		
		var initLocalMode = function() {
			
			if(supportNavigationTimingAPI) {
			
				clean();
				
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
				
				
				var data = PerfData(ctx);
				
				dockPanel = Panel().init(ctx, {
					"title" : "",
					"domContext" : navletMainNode,
					"panelType" : "dock-panel",
					"template": function(data) {
						
						var html = [];
						html.push("<a id='toggle-monitoring' data-global-event='toggle-monitoring' class='button color action' href='javascript:void(0)' >" + (monitorModeOn ? AppConfig.labels.StopMonitoring : AppConfig.labels.StartMonitoring ) + "</a>");
						html.push("<a data-global-event='about' class='button color action' href='javascript:void(0)' >about</a>");
						html.push("<a data-global-event='close-navlet' class='button color action' href='javascript:void(0)' >close Navlet</a>");
						
						
						return html.join('');
					}
				});
				panels.push(dockPanel);
				
				rawValuesPanel = Panel().init(ctx, {
					"title" : "Navigation Timing API raw values",
					"domContext" : navletMainNode,
					"panelType" : "top-left-panel",
					"data": data,
					"template" : function(data) {
						
						var storedOffsetOption = ctx.localStorage.getItem("rawOffsetValue");
						if(storedOffsetOption != null) {
							
							if(storedOffsetOption == "true" || storedOffsetOption == "false") {
								rawOffsetValue = (storedOffsetOption === 'true');
							}
							
						}
						
						var rawOffsetOption = "<div class='option-column'>";
						rawOffsetOption += "<input id='rawOffsetOption' data-global-event='offset-raw-values' class='action' type='checkbox' " + (rawOffsetValue ? "checked='yes'" : "" )  + " />"
						rawOffsetOption += "<label for='rawOffsetOption' >Offset raw values with navigationStart value</label>";
						rawOffsetOption += "</div>";
						
						var rawListHtml = rawOffsetOption + "<ul  class='list'>";
						var tmpPropName, value, NA ;
						
						var offset = 0;
						if(rawOffsetValue) {
							offset = data.getNavTimingData()["navigationStart"];
						}
						
						for(var i=0, l=AppConfig.NavTimingProperties.length; i<l; i++) {
							tmpPropName = AppConfig.NavTimingProperties[i].name;
							value = data.getNavTimingData()[tmpPropName];
							
							NA = "";
							if(!isValidUnixTime(value)) {
								value = "NA";
								NA = " na";
							}
							else {
								value = value - offset;
							}
							
							rawListHtml += "<li class='entry "+ NA +"'><span class='entry-label'>"+ tmpPropName +"</span><span class='entry-value'>"+value + "</span></li>"
						}
						   
						rawListHtml += "</ul>";
						
						return rawListHtml;
					}
				});
				panels.push(rawValuesPanel);
				
				customValuesPanel = Panel().init(ctx, {
					"title" : "User defined metrics",
					"domContext" : navletMainNode,
					"panelType" : "top-right-panel",
					"data": data,
					"template" : function(data) {
						
						var advList = "<ul class='list'>";
						
						var navData = data.getNavTimingData();
						
						function addItemToAdvList(key, value) {
							advList += "<li class='entry'><span class='entry-label'>"+key+"</span><span class='entry-value'>"+value + "</span></li>";
						}
						
						addItemToAdvList("responseStart - navigationTime", (navData.responseStart - navData.navigationStart));
						
						addItemToAdvList("connection duration", (navData.connectEnd - navData.connectStart));
						addItemToAdvList("domLoading - responseStart", (navData.domLoading - navData.responseStart));
						addItemToAdvList("domInteractive - responseStart", (navData.domInteractive - navData.responseStart));
						
						addItemToAdvList("domContentLoadedEventStart - responseStart", (navData.domContentLoadedEventStart - navData.responseStart));
						addItemToAdvList("domReadyEvent duration", (navData.domContentLoadedEventEnd - navData.domContentLoadedEventStart));
						
						addItemToAdvList("loadEventStart - responseStart", (navData.loadEventStart - navData.responseStart));
						addItemToAdvList("loadEvent duration", (navData.loadEventEnd - navData.loadEventStart));
						
						advList += "</ul>";
						
						return advList;
					}
				});
				panels.push(customValuesPanel);
				
				chartPanel = Panel().init(ctx, {
					"title" : "Timeline representation",
					"domContext" : navletMainNode,
					"panelType" : "bottom-panel",
					"data": data,
					"layoutClass" : "bottom-panel-open",
					"template" : function(data) {
						
						var advList = "TBD- TBD TBD ul class='list' fdgf f g dfg ";
						
						
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
					ctx.console.log(e.data);
					
					for(var i=0; i<panels.length; i++) {
						panels[i].updateData(e.data);
						panels[i].updateView();
					}
					reloadRemoteWindow();
			
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
			
			ctx.console.log("spawnRemoteWindow")
			if(isSet(remoteWindow)) {
				if(remoteWindow.close) {
					remoteWindow.close();
				}
				remoteWindow = null;
			}
			
			var windowOptions = [];
			windowOptions.push("width=400");
			windowOptions.push("height=400");
			//windowOptions.push("menubar=1");
			//windowOptions.push("resizable=1");
			//windowOptions.push("location=1"); 
			
			//var windowId =(new Date()).getTime();
			
			remoteWindow = ctx.open(
				ctx.location.href,
				"_blank",
				windowOptions.join(',')
			);
			
			ctx.focus();
			
			
			remoteWindow.navlet = {"url_root" : ctx.navlet.url_root }
			
			reloadRemoteWindow();
			
		};
		
		var reloadRemoteWindow = function() {
			
			if(autoCloseTimer != null) {
				// Autoclose set, deactivating it:
				ctx.console.log("Clearing - autoclosing");
				remoteWindow.clearTimeout(autoCloseTimer);
			}
			ctx.console.log("reloadRemoteWindow 1")
			remoteWindow.location.reload();
			ctx.console.log("reloadRemoteWindow 2")
			
			ctx.setTimeout(function(){
				ctx.console.log("reloadRemoteWindow 3")
			
				var remoteNavlet = new Navlet();
				remoteNavlet.init(remoteWindow, 
					{
						"remote" : true,
						"masterWindow": ctx
					}
				);
					
				ctx.console.log("reloadRemoteWindow 4")
			
			}, 1000);
			ctx.console.log("reloadRemoteWindow 5")
			
		};
		
		var initRemoteMode = function() {
			masterWindow.console.log("initRemoteMode 1")
			setTimeout(function(){	
					 masterWindow.console.log("initRemoteMode 2")
					 masterWindow.postMessage(ctx.performance.timing, ctx.location.href);
					 masterWindow.console.log("initRemoteMode 3")
					
					autoCloseTimer = ctx.setTimeout(function(){	
						
						// Autoclose programmed if we lose connection 
						// with masterWindow (could be close by the user for instance)
						masterWindow.console.log("Connection lost - autoclosing remoteWindow");
						ctx.close();	
					},10000);
					
			},2000);
			masterWindow.console.log("initRemoteMode 4")
			
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
					clean();
				}
				else if(actionName == "offset-raw-values") {
					rawOffsetValue = !rawOffsetValue;
					ctx.localStorage.setItem("rawOffsetValue", ""+rawOffsetValue);
					
					rawValuesPanel.updateView();
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