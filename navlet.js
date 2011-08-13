(function() {
	
	var navlet;
	
	var neededFeatures = [
		"performance",
		"localStorage",
		"JSON.stringify",
		"JSON.parse",
		"document.querySelectorAll"
	]
	
	var minimalRealisticUnixTime = 1300000000000 ; // an arbitrary date in the past
	
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
	
	var log = function(msg, obj) {
		console.log(msg);
		if(isSet(obj)) {
			console.log(obj);
		}
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
			
			serialize : function() {
				
				return ctx.JSON.stringify({
					
					"navigationTimingData" : navigationTimingData,
					"creationTime": creationTime,
					"isReady": this.isReady()
					
				});
			},
			
			setFromSerializedPerfData: function(serializedPerfData) {
				
				var obj = ctx.JSON.parse(serializedPerfData);
				
				navigationTimingData = obj.navigationTimingData;
				creationTime = obj.creationTime;
				
				return this;
			},
			
			getNavTimingData : function() {
				
				return navigationTimingData;
			},
			
			creationTime : function() {
			
				return creationTime;
			},
			
			isReady : function() {
			
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
			if(panelContent.style.visibility == "hidden") {
				panelContent.style.visibility = "visible";
			}
			else {
				panelContent.style.visibility = "hidden";
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
			
			html.push("<div style='visibility:hidden' class='panel-content'><div class='panel-content-wrap'>");
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
		
		var canvas_frame, ctx, body, head, navletMainNode,
		    panels = [],
		    masterWindow, remoteWindow,
		    monitorModeOn = false,
		    unsupportedFeatures = [],
		    rawOffsetValue,
		    dockPanel, rawValuesPanel, customValuesPanel, chartPanel,
			windowName = "MasterWindow";
		
		// For remote only:
		var autoCloseTimer = null;
		
		var log = function(msg, obj) {
		
			var prefix = ""
			if(isSet(windowName)) {
				prefix = "[" + windowName + "]: ";
			}
			masterWindow.console.log(prefix + msg);
			if(isSet(obj)) {
				masterWindow.console.log(obj);
			}
		};
		
		var getOffsetRawValuesOption = function() {
			var storedOffsetOption = ctx.localStorage.getItem("rawOffsetValue");
			if(storedOffsetOption != null) {
				
				if(storedOffsetOption == "true" || storedOffsetOption == "false") {
					return rawOffsetValue = (storedOffsetOption === 'true');
				}	
			}
			return false;
		};
		
		var getUnsupportedFeatures = function(ctx) {
		
			if(!isSet(ctx)) {
				ctx = window;
			}
		
			var unsupportedFeatures = [];
			var feat, featurePath;
			
			for(var i=0;i<neededFeatures.length;i++) {
				
				featurePath = neededFeatures[i].split('.');
				feat = ctx;
				for(var p=0; p<featurePath.length; p++) {
					feat = feat[featurePath[p]];
					if(!isSet(feat)) {
						unsupportedFeatures.push(neededFeatures[i]);
						break;
					}
				}
			}
			
			return unsupportedFeatures;
		}
		
		var displayNoSupportMessage = function () {
				
				var msg = "Your browser does not support some needed JavaScript APIs.\n\n";
				msg += "The following list of features is not supported: "+unsupportedFeatures.join(", ")+".\n\n";
				msg += "Please use IE9 (check your document mode in developer ) or an up to date Google Chrome.\n";
				alert(msg);
		};
			
		
		var clean = function() {
			// Destroy previous instances:
			var dirtyNavletContainer = ctx.document.getElementById("navlet");
			if(isSet(dirtyNavletContainer)) {
				body.removeChild(dirtyNavletContainer);
			}
		};
		
		var initLocalMode = function() {
			
			rawOffsetValue = getOffsetRawValuesOption();
			unsupportedFeatures = getUnsupportedFeatures(ctx);
			
			if(unsupportedFeatures.length == 0) {
			
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
				
				drawPanels();	
			}
			else {
				displayNoSupportMessage();
			}
		};
		
		var drawPanels = function() {
		
				var data = PerfData(ctx);
				
				if(!data.isReady()) {
					log("Data not ready, waiting before drawing panels");
					ctx.document.getElementById('navlet-loader').innerHTML = "Waiting for window.performance object to be available...";
					setTimeout(drawPanels, 100);
					return;
				}
				
				// We are done loading dependencies and window.performance is available: we hide the loader
				var loader = ctx.document.getElementById('navlet-loader');
				loader.innerHTML = "";
				loader.style.padding = 0;
				
					
		
			
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
						
						var storedOffsetOption = getOffsetRawValuesOption()
						
						var rawOffsetOption = "<div class='option-column'>";
						rawOffsetOption += "<input id='rawOffsetOption' data-global-event='offset-raw-values' class='action' type='checkbox' " + (rawOffsetValue ? "checked='yes'" : "" )  + " />"
						rawOffsetOption += "<label class='font' for='rawOffsetOption' >Offset raw values with navigationStart value</label>";
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
							
							rawListHtml += "<li class='entry "+ NA +"'><span class='entry-label row-font'>"+ tmpPropName +"</span><span class='entry-value row-font'>"+value + "</span></li>"
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
							advList += "<li class='entry'><span class='entry-label row-font'>"+key+"</span><span class='entry-value row-font'>"+value + "</span></li>";
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
						
						var navData = data.getNavTimingData(),
							initialTime = navData["navigationStart"],
							DT = navData["loadEventEnd"] - navData["navigationStart"],
							availableWidthInPixel = ctx.document.querySelectorAll('#bottom-panel-id .panel-content-wrap')[0].offsetWidth - 160,
							widthPerc, leftMargin;
						
						console.log(ctx.document.querySelectorAll('#bottom-panel-id .panel-content')[0].offsetWidth)
						console.log(availableWidthInPixel)
						var buildTimelineBlock = function(htmlArray, startTime, endTime, className) {
							widthPerc = Math.floor(availableWidthInPixel*(endTime - startTime)/DT);
							leftMargin = Math.floor(availableWidthInPixel*(startTime - initialTime)/DT)
							htmlArray.push("<div class='timeline-block reveal ");
							if(isSet(className)) {
								htmlArray.push(className);
							}
							htmlArray.push("' style='width:");
							htmlArray.push(widthPerc);
							htmlArray.push('px;left:');
							htmlArray.push(leftMargin);
							htmlArray.push("px;' >");
							htmlArray.push("<div class='timeline-block-label none'>pouet</div></div>");
							
							
						};
						
						var chartHtml = [];
						
						chartHtml.push("<div id='rawValuesChart' class='rawValuesChart'>");
						chartHtml.push("<div class='timeline'>");
						
						buildTimelineBlock(chartHtml, navData["domainLookupStart"], navData["domainLookupEnd"], 'chart-dnsBlock');
						buildTimelineBlock(chartHtml, navData["connectStart"], navData["connectEnd"], 'chart-TCPBlock');
						buildTimelineBlock(chartHtml, navData["requestStart"], navData["responseStart"], 'chart-requestBlock');
						buildTimelineBlock(chartHtml, navData["responseStart"], navData["responseEnd"], 'chart-responseBlock');
						
						chartHtml.push("</div>");
						
						chartHtml.push("<div class='timeline'>");
						
						buildTimelineBlock(chartHtml, navData["domLoading"], navData["domContentLoadedEventStart"], 'chart-domReady');
						buildTimelineBlock(chartHtml, navData["domContentLoadedEventStart"], navData["domContentLoadedEventEnd"], 'chart-domReadyDuration');
						buildTimelineBlock(chartHtml, navData["domContentLoadedEventEnd"], navData["domComplete"], 'chart-domReadyToLoad');
						
						buildTimelineBlock(chartHtml, navData["loadEventStart"], navData["loadEventEnd"]);
						
						chartHtml.push("</div>");
						
						chartHtml.push("</div>");
						
						chartHtml.push("<div id='customValuesChart' class='customValuesChart'>");
						
						
						
						chartHtml.push("</div>");
						
						return chartHtml.join('');;
					}
				});
				panels.push(chartPanel);
			
		
		};
		
		var onPostMessageReceived = function(e){
				//log("Receiving serialized data received from remote window: "+e.data);
				ctx.console.log("[MasterWindow]: <-- Receiving serialized data received from remote window...");
				var unserializedPostMessageData = PerfData().setFromSerializedPerfData(e.data);
				//log("unserializedPostMessageData: ", unserializedPostMessageData);
				
				for(var i=0; i<panels.length; i++) {
					panels[i].updateData(unserializedPostMessageData);
					panels[i].updateView();
				}
				reloadRemoteWindow();
		
		};
		
		var startMonitorMode = function() {
			
			monitorModeOn = true;
			// Attach event handler to receive data from remote windows:
			ctx.addEventListener("message", onPostMessageReceived, false);
			
			spawnRemoteWindow();
		};
		
		var stopMonitorMode = function() {
			
			// Attach event handler to receive data from remote windows:
			ctx.removeEventListener("message", onPostMessageReceived);
			
			if(isSet(remoteWindow)) {
				if(remoteWindow.close) {
					remoteWindow.close();
				}
				remoteWindow = null;
			}
			
			monitorModeOn = false;
		};
		
		var spawnRemoteWindow = function() {
			
			log("Initial spawning of remote window")
			if(isSet(remoteWindow)) {
				if(remoteWindow.close) {
					remoteWindow.close();
				}
				remoteWindow = null;
			}
			
			var windowOptions = [];
			windowOptions.push("width=400");
			windowOptions.push("height=400");
			windowOptions.push("fullscreen=yes");
			//windowOptions.push("menubar=1");
			windowOptions.push("resizable=yes");
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
				log("Clearing - autoclosing");
				remoteWindow.clearTimeout(autoCloseTimer);
			}
			log("reloading");
			remoteWindow.location.reload();
			
			ctx.setTimeout(function(){
				log("Creating Navlet remote instance")
			
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
			
			windowName = "RemoteWindow";
			
			log("initRemoteMode called")
			
			var serializedMessage,
				autoCloseTimerDuration = 20000,
				dataReadyPollingInterval = 500,
				data ;
			
			var postData = function() {
				
				data = PerfData(ctx);
				
				if(data.isReady()) {
					serializedMessage = PerfData(ctx).serialize();
					//masterWindow.console.log("[RemoteWindow]: --> Sending serialized data: "+serializedMessage);
					log(" --> Sending serialized data...");
					masterWindow.postMessage(serializedMessage, ctx.location.href);
				}
				else {
					log("Data not ready - waiting "+ dataReadyPollingInterval + "ms before posting again");
					setTimeout(postData, dataReadyPollingInterval);
				}
			};
			
			setTimeout(postData, dataReadyPollingInterval);
			
			autoCloseTimer = ctx.setTimeout(function(){	
						
				// Autoclose programmed if we lose connection 
				// with masterWindow (could be close by the user for instance)
				log("Connection lost - autoclosing remoteWindow");
				ctx.close();	
			}, autoCloseTimerDuration);
			
			log("initialization done.");		
		}
		
		return {
			init: function(context, conf) {
				
				ctx = isSet(context) ? context : window;	
				masterWindow = ctx;				
				body = ctx.document.getElementsByTagName('body')[0];
				head = ctx.document.getElementsByTagName('head')[0];
								
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