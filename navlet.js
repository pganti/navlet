(function() {
	
	var navlet,
		layoutManager,
		eventBus,
		mainLogger;
	
	
	var AppConfig = {
		
		"useIframeMode": false, // Deprecated but we never know ...
		
		"neededFeatures" : [
			"console",
			"performance",
			"localStorage",
			"JSON.stringify",
			"JSON.parse",
			"document.querySelectorAll",
			"document.removeEventListener"
		],
		
		"labels": {
			
			"StartMonitoring" : "Start Monitoring",
			"StopMonitoring" : "Stop Monitoring",
			"PauseMonitoring" : "Pause Monitoring",
			"Expand" : "expand",
			"Collapse" : "collapse"
		},
		
		"timers": {
			"autoCloseTimerDuration" : 60000,
			"dataReadyPollingInterval": 500,
			"relayoutInterval": 80
		},	

		"minimalRealisticUnixTime" : 1300000000000, // an arbitrary date in the past, to smoke test unix times
		
		"misc" : {
		
			"projectUrl" : "http://code.google.com/p/navlet/"
		},
		
		"NavTimingProperties" : [
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
	};
	
	
	var AppState = {
	
		monitorModeOn: false,
		monitorModePause: false,
		numberRecords: 0
	};
	
	var EventBus = (function (){
	
		var listeners = {};
	
		return {
			
			fire: function(eventName, data) {
			
				if(Utils.isArray(listeners[eventName])) {
					var eventListeners = listeners[eventName];
					for(var i=0, l =eventListeners.length; i<l; i++) {
						
						eventListeners[i]["callback"].apply(eventListeners[i]["scope"], [data]);
					}
				}
				else {
					console.log("warning: no event named " +eventName+ " registered")
				}
			},
			listen: function(eventName, conf) {
				
				if(typeof(eventName) != "string" ||
				   typeof(conf.callback) != "function") {
					console.log("[EventBus]: Bad listener configuration for <"+eventName+"><"+conf.callback+"><"+conf.scope+"> parameter.")
				}
				
				if(!Utils.isArray(listeners[eventName])) {
					
					listeners[eventName] = [];
				}
				
				listeners[eventName].push({
					
					callback: conf.callback,
					scope: conf.scope || window
				});
			}
		}
	})();
	
	var LayoutManager = (function() {
	  
		var inst,
			ctx,
			body,
			cssText = "",
			layoutInfo = null,
			layoutTimer = null,
			popupIframe = null,
			iframePanels = {};
		
		var initDefaultLayoutConfiguration = function() {
		
			layoutInfo = {
				viewportHeight: ctx.innerHeight,
				viewportWidth: ctx.innerWidth,
				defaultHeaderHeight: 28,
				leftColumnPanel: {
				
					width: 400, 
					// Columns are flexible, they take all the availalble height
					height: 28 // But they initial render as collapse
				},
				rightColumnPanel: {
				
					width: 400, 
					// Columns are flexible, they take all the availalble height
					height: 28 // But they initial render as collapse
				},
				bottomPanel: {
					height: 28,
					heightWhenExpanded: 153
				},
				
				dockPanel: {
					height: 42,
					heightWhenExpanded: 42
				}
			};
		};
		
		var onWindowResize = function() {
		
			layoutInfo.viewportHeight = window.innerHeight;
			layoutInfo.viewportWidth = window.innerWidth;
			
			// Charts drawing depends on the window size, we force a refresh:
			EventBus.fire('ui-dirty-state', {panelName : "bottomPanel"});
			
			relayout()
		};
		
		var relayout = function() {
		
			layoutTimer = null;
			
			if(layoutTimer == null) {
				layoutTimer = setTimeout(function() {
					for(var p in iframePanels) {
						
						iframePanels[p].updateIframeStyle();
					}
					
					layoutTimer = null;
				},
				AppConfig.timers.relayoutInterval);
			}	
		};
		
		
		return {
		
			clean : function() {
				// Destroy previous instances:
				var dirtyNavletContainers = ctx.document.querySelectorAll(".navlet-container");
				for(var i=0; i<dirtyNavletContainers.length; i++) {
					body.removeChild(dirtyNavletContainers[i]);
				}
			},
			
			updateLayoutDefinition: function(evtData) {
			
				
				if(evtData.panelName in iframePanels) {
					
					var iframePanel = iframePanels[evtData.panelName] ;
					if(evtData.state ==  AppConfig.labels.Collapse) {
						
						layoutInfo[evtData.panelName].height = layoutInfo.defaultHeaderHeight;
						
					}
					else if(evtData.state ==  AppConfig.labels.Expand) {
					
						if(layoutInfo[evtData.panelName].heightWhenExpanded) {
							
							layoutInfo[evtData.panelName].height = layoutInfo[evtData.panelName].heightWhenExpanded;
						}
						else {
							delete layoutInfo[evtData.panelName].height;
						} 
					}
				}	
			},
			
			updateLayoutDefinitionAndLayout: function(evtData) {
			
				inst.updateLayoutDefinition(evtData);
				relayout();
			}, 
			
			init: function(mainWindowContext) {
			
				ctx = mainWindowContext;
				
				initDefaultLayoutConfiguration()
				
				Utils.addEvent(window, "resize", onWindowResize);
				
				body = ctx.document.getElementsByTagName("body")[0];
				inst = this;
				
				inst.clean();
				EventBus.listen("close-navlet", {callback: inst.clean});
				
				EventBus.listen("panel-state-init", {callback: inst.updateLayoutDefinition});
				EventBus.listen("panel-state-changed", {callback: inst.updateLayoutDefinitionAndLayout});
				
				// Following part is about creating the popupIframe,
				// TODO: should be extracted to some Domain classes/functions
				
				// Any popup used for navlet are made using a shared iframe 
				// that weposition using javascript.
				// Again we use an inconvenient iframe to protect navlet's style from
				// external styles coming from the page.
				popupIframe =  Utils.generateElement("iframe", {
					"id": "iframePopup",
					"name": "iframePopup",
					"frameborder": 0,
					"class": "iframePopup",
					"src": "about:blank"
					//,"style": "border: red 2px solid; position: fixed;"
				}, ctx.document);
				
				ctx.document.getElementsByTagName("body")[0].appendChild(popupIframe);
				
				popupIframe.contentDocument.write("<html><head></head><body></body></html>"); // Needed for IE otherwise it can't get a body reference
				popupIframe.contentDocument.getElementsByTagName("body")[0].setAttribute("class", "navlet-container iframe-popup");
				
				
				// TODO: Refactor that to make reuse function in IframePanel.
				// This method should be in a parent class (IframePlaceholder) that
				// will be extended by IframePanel and IframePopup and allow us to share the love.
				var linkNode = Utils.generateElement("link", {
					"id": "navlet-css",
					"type": "text/css",
					"rel": "stylesheet",
					"href": window.navlet.url_root + 'navlet.css',
					"media": "screen"
				}, popupIframe.contentDocument);				
				popupIframe.contentDocument.getElementsByTagName("head")[0].appendChild(linkNode);
				
				// Attaching opening behavior of singleton iframe popup:
				EventBus.listen("show-popup", {
					
					callback: function(evtData) {
						
						var styles = [];
						//styles.push("border: red 2px solid");
						styles.push("position: fixed");
						styles.push("z-index:15000");
						
						styles.push("top:" + evtData.popupConf.top + "px");
						styles.push("left:" + evtData.popupConf.left + "px");
						styles.push("width:" + evtData.popupConf.width + "px");
						styles.push("height:" + evtData.popupConf.height + "px");
						
						
						styles.push("display:block");
						
						popupIframe.setAttribute("style", styles.join(";"));
						popupIframe.contentDocument.body.innerHTML = evtData.content;
					}
				});
				
				// Attaching closing behavior of singleton iframe popup:
				EventBus.listen("hide-popup", {
					
					callback: function(evtData) {
						var styles = [];
						styles.push("position: absolute");
						styles.push("left: -1000em");
						popupIframe.setAttribute("style", styles.join(";"));
					}
				});
				
				/*
				*	The following part is creating each panel of Navlet UI.
				*   Each Panel is encapsulated in an iframe (through iframePanel object) 
				*   to protect the navlet UI from external styles from the page.
				*/
				
				
				iframePanels["leftColumnPanel"] = (new IframePanel("leftColumnPanel", {
				
					panelContentDefinition : rawValuePanelDefinition,
					getPanelStyleCallback: function() {
					
						return {
							"left": 0,
							"bottom" : layoutInfo.bottomPanel.height + layoutInfo.dockPanel.height + "px",
							"width" : layoutInfo.leftColumnPanel.width + "px",
							"height" :  ( layoutInfo.leftColumnPanel.height || (layoutInfo.viewportHeight - layoutInfo.bottomPanel.height - layoutInfo.dockPanel.height))  + "px"
							
						}
					}
				})).init(ctx);
				
				iframePanels["rightColumnPanel"] = (new IframePanel("rightColumnPanel", {
				
					
					panelContentDefinition : customValuesPanelDefinition,
					getPanelStyleCallback: function() {
					
						return {
							"right": 0,
							"bottom" : layoutInfo.bottomPanel.height + layoutInfo.dockPanel.height + "px",
							"width" : layoutInfo.rightColumnPanel.width + "px",
							"height" :  ( layoutInfo.rightColumnPanel.height || (layoutInfo.viewportHeight - layoutInfo.bottomPanel.height - layoutInfo.dockPanel.height))  + "px"
							
						}
					}
				})).init(ctx);
				
				iframePanels["bottomPanel"] = (new IframePanel("bottomPanel", {
				
					panelContentDefinition : chartPanelDefinition,
					getPanelStyleCallback: function() {
					
						return {
							"left": 0,
							"right": 0,
							"bottom" : layoutInfo.dockPanel.height  + "px",
							"width" : "100%",
							"height" :  layoutInfo.bottomPanel.height  + "px"
							
						}
					}
				})).init(ctx);
				
				iframePanels["dockPanel"] = (new IframePanel("dockPanel", {
				
					panelContentDefinition : dockPanelDefinition,
					getPanelStyleCallback: function() {
					
						return {
							"left": 0,
							"right": 0,
							"bottom" : 0,
							"width" : "100%",
							"height" :  layoutInfo.dockPanel.height  + "px"
							
						}
					}
				})).init(ctx);
				
				debugger;
				
				// For each previously created panels, we get the user configuration from 
				// localStorage to restore it.
				// User configuration means only collapse/expand state for a panel for now.
				for(var ifpanel in iframePanels) {
				
					//ctx.localStorage.setItem(panelName + "-state", currentState);
					var expandedState = Utils.parseBoolean(Utils.store.get(ifpanel + "-expanded", "false"));
					inst.updateLayoutDefinition({
						"panelName": ifpanel,
						"state": expandedState ? AppConfig.labels.Expand : AppConfig.labels.Collapse
					})
				}
				
				// Bigbang initial drawing of the UI:
				relayout();
				
				return inst;
			}
		}
	})();
		
	var IframePanel = function(iframeName, conf) {
	
		this.iframe = null;
		this.iframeName = iframeName;
		this.conf = conf || {};
		this.iframeWindow = null;
		this.iframeDocument = null;
		
		this.panelContent = null;
		this.panelContentDef = conf.panelContentDefinition || {};
		this.styleCallback = conf.getPanelStyleCallback;
		this.customStyles = conf.styles ;
		
	}
	
	IframePanel.prototype = {
	
		defaultIframeStyles : {
		
			"position" : "fixed",
			"z-index" : "10000",
			"cursor" : "pointer"	
		},
		
		
		
		loadNavletCSS : function() {
		
			var linkNode = Utils.generateElement("link", {
				"id": "navlet-css",
				"type": "text/css",
				"rel": "stylesheet",
				"href": window.navlet.url_root + 'navlet.css',
				"media": "screen"
			}, this.iframeDocument);
					
			this.iframeDocument.getElementsByTagName("head")[0].appendChild(linkNode);
		},
	
		updateIframeStyle : function() {
		
			var defaultStyles = Utils.cloneJSONObject(this.defaultIframeStyles);
			
			var style = [];
			for(var s in defaultStyles) {
				
				style.push(s + ":" + defaultStyles[s]);
			}
			
			this.customStyles = this.styleCallback();
			for(var s in this.customStyles) {
				
				style.push(s + ":" + this.customStyles[s]);
			}
			
			this.iframe.setAttribute("style", style.join(";"));
		},
		
		createIframePanel : function(conf) {
			
			var iframeElt = Utils.generateElement("iframe", {
				"id": conf.id,
				"name": conf.id,
				"frameborder": 0,
				"class": "navlet-container",
				"src": "about:blank"
			}, conf.context.document);
			
			conf.context.document.getElementsByTagName("body")[0].appendChild(iframeElt);
			
			// TODO: Could be needed for crossbrowser issues:
			
			// IE9 need that otherwise document.body of the iframe is undefined:
			iframeElt.contentDocument.write("<html><head></head><body></body></html>");
			
			return iframeElt;
		},
		
		drawPanelContent : function(data) {
		
			this.panelContent.updateData(data);
			this.panelContent.updateView();
		},
		
		init : function(context) {
		
			this.iframe = this.createIframePanel({
				"id": this.iframeName,
				"context": context,
			});
			
			this.iframeWindow = this.iframe.contentWindow;
			this.iframeDocument = this.iframe.contentDocument;
			
			
			
			this.panelContentDef.domContext = this.iframeDocument.body;
			
			this.iframeDocument.body.className = "navlet-container"; 
			
			this.panelContentDef.masterWindow = this.iframeWindow.top;
			
			this.panelContent = Panel().init(this.iframeWindow, this.panelContentDef);
			
			EventBus.listen("data-updated", {
				callback: this.drawPanelContent,
				scope: this
			});
			
			// Update external style for layout iframe:
			this.updateIframeStyle();
			
			// Loading inner  style in iframe:
			this.loadNavletCSS();
			
			return this;
		}
	}
		
	var rawValuePanelDefinition = {
			"title" : "Navigation Timing API raw values",
			"panelName" : "leftColumnPanel",
			"template" : function(data, ctx) {
				
				var offsetRawValues = Utils.parseBoolean(Utils.store.get( "rawOffsetValue" ,"false"));
				var rawOffsetOption = "";
				
				rawOffsetOption = "<div class='option-column'>";
				rawOffsetOption += "<input id='rawOffsetOption' data-global-event='offset-raw-values' class='action' type='checkbox' " + (offsetRawValues ? "checked='yes'" : "" )  + " />"
				rawOffsetOption += "<label for='rawOffsetOption' >Offset raw values with navigationStart value</label>";
				
				if(data.isDataCollection) {
					
					rawOffsetOption += "<div class='option-disabler' title='Absolute UNIX time values are not available in monitoring mode.'></div>";				
				}
				
				rawOffsetOption += "</div>";
				
				
				var rawListHtml = rawOffsetOption + "<ul  class='list'>";
				var tmpPropName, value, NA, navStartTime ;
				
				navStartTime = data.query( "performance.timing.navigationStart")
				
				for(var i=0, l=AppConfig.NavTimingProperties.length; i<l; i++) {
					tmpPropName = AppConfig.NavTimingProperties[i].name;
					value = data.query( "performance.timing." + tmpPropName);
					
					NA = "";
					
					
					
					// TODO: Move this sniffing into domain class PerfData & PerfDataSet
					if(data.isDataCollection) {
						
						if(!Utils.isValidDeltaTime(value)) {
							value = "NA";
							NA = " na";
						}
					}
					else {
						if(!Utils.isValidUnixTime(value)) {
							value = "NA";
							NA = " na";
						}
						else if(offsetRawValues) {
							value = value - navStartTime;
						}
					}
					
					rawListHtml += "<li class='entry "+ NA +" has-overla' data-overlay-position='right'>";
					rawListHtml += "<span class='entry-label'>"+ tmpPropName +"</span><span class='entry-value'>"+value + "</span>";
					rawListHtml += "<div class='overlay-content none'>pouet</div></li>"
				}
				   
				rawListHtml += "</ul>";
				
				return rawListHtml;
			}
		};
	
	var chartPanelDefinition = {
		"title" : "Timeline representation",
		"panelName" : "bottomPanel",
		"afterCreate": function(data, ctx) {
		
			var tlfd = ctx.document.getElementById("timeline-scale-feedback");
			var ts = ctx.document.getElementById("timeline-scale");
			var tc = ctx.document.getElementById("time-cursor");
			
			function getNumericStyleProperty(style, prop){
				return parseInt(style.getPropertyValue(prop),10) ;
			}

			function element_position(e) {
				var x = 0, y = 0;
				var inner = true ;
				do {
					x += e.offsetLeft;
					y += e.offsetTop;
					var style = getComputedStyle(e,null) ;
					var borderTop = getNumericStyleProperty(style,"border-top-width") ;
					var borderLeft = getNumericStyleProperty(style,"border-left-width") ;
					y += borderTop ;
					x += borderLeft ;
					if (inner){
					  var paddingTop = getNumericStyleProperty(style,"padding-top") ;
					  var paddingLeft = getNumericStyleProperty(style,"padding-left") ;
					  y += paddingTop ;
					  x += paddingLeft ;
					}
					inner = false ;
				} while (e = e.offsetParent);
				return { x: x, y: y };
			}
			
			var ts_pos = element_position(ts);
			
			Utils.addEvent(ts, "mouseenter", function(evt) {
				ctx.document.getElementById('timeline-scale-feedback').style.display = "block";
			});
			
			Utils.addEvent(ts, "mouseleave", function(evt) {
				ctx.document.getElementById('timeline-scale-feedback').style.display = "none";
			});
			
			Utils.addEvent(ts, "mousemove", function(evt) {
				tc.innerHTML = Math.floor((evt.clientX-ts_pos.x) * ((data.query("performance.timing.loadEventEnd") - data.query("performance.timing.navigationStart"))/ctx.document.querySelectorAll('.panel-content-wrap')[0].offsetWidth)) + "ms"
				tlfd.style.left = (evt.clientX-ts_pos.x) + "px";
				
				console.log("tlfd.style.left:"+tlfd.style.left)
			});
			
			/*
			//Transforming sparkline DHTML data into a graph 
			if(ctx.document.querySelectorAll('.sparkline')[0])
				Utils.sparkline(ctx.document.querySelectorAll('.sparkline')[0]);
			*/
		},
		"template" : function(data, ctx) {
			
			// Forcing padding here since we have race conditions between CSS padding style and javascript reader of the offsetWidth property
			ctx.document.querySelectorAll('.panel-content')[0].style.padding = "0 80px";
			
			var initialTime = data.query("performance.timing.navigationStart"),
				DT = data.query("performance.timing.loadEventEnd") - data.query("performance.timing.navigationStart"),
				availableWidthInPixel = ctx.document.querySelectorAll('.panel-content-wrap')[0].offsetWidth,
				widthPerc, leftMargin,
				positionContextClass;
			
			//console.log("availableWidthInPixel" + availableWidthInPixel)
				

			var buildTimelineBlock = function(htmlArray, timelineBlockConf) {
				pixelWidth = Math.floor(availableWidthInPixel*(timelineBlockConf.endEventValue - timelineBlockConf.startEventValue)/DT);
				leftMargin = Math.floor(availableWidthInPixel*(timelineBlockConf.startEventValue - initialTime)/DT)
				//console.log("pixelWidth" + pixelWidth)
				if(pixelWidth == 0) {
					return;
				}
				
				htmlArray.push("<div data-overlay-position='top' class='timeline-block has-overlay ");
				
				if(pixelWidth < 350) {
					if (leftMargin > availableWidthInPixel/2) {
						
						positionContextClass = " close-right-side ";
					}
					
					htmlArray.push(positionContextClass);
				}
				
				var widthRate = " normal ";
				if(pixelWidth < 5) {
					widthRate = " tiny ";
				}
				else {
					if(pixelWidth < 20) {
						widthRate = " small ";
					}
				}
				
				htmlArray.push(timelineBlockConf.cssClass);
				
				htmlArray.push("' style='width:");
				htmlArray.push(pixelWidth);
				htmlArray.push('px;left:');
				htmlArray.push(leftMargin);
				htmlArray.push("px;' >");
				
				if(timelineBlockConf.timelineName.length * 10 < pixelWidth) {
					htmlArray.push("<div class='timeline-label'>" + timelineBlockConf.timelineName + "</div>");
				}
				
				htmlArray.push("<div class='overlay-content none'>");
				htmlArray.push("<div class='timeline-block-flag " + widthRate + positionContextClass+ "'>");
				htmlArray.push("<div class='main-field field'>");
				htmlArray.push("<span class='label'>"+timelineBlockConf.timelineName +":</span><span class='value'>" +(timelineBlockConf.endEventValue - timelineBlockConf.startEventValue)+ " ms</span>" ); 
				htmlArray.push("</div>");
				htmlArray.push("<div class='field'><span class='label ctx-label'>Start event:</span>");
				htmlArray.push("<span class='label'>"+timelineBlockConf.startEventName +":</span><span class='value'>" +(timelineBlockConf.startEventValue - initialTime)+ " ms</span>" ); 
				htmlArray.push("</div>");
				htmlArray.push("<div class='field'><span class='label ctx-label'>End event:</span>");
				htmlArray.push("<span class='label'>"+timelineBlockConf.endEventName +":</span><span class='value'>" +(timelineBlockConf.endEventValue - initialTime)+ " ms</span>" ); 
				htmlArray.push("</div>");
				htmlArray.push("<div class='bottom-arrow'></div>");
				htmlArray.push("</div>");
				htmlArray.push("</div>");
				
				if(data.hasSparklineData) {
				
					htmlArray.push(data.getSparklineData("performance.timing.domContentLoadedEventStart"));
				}
				
				htmlArray.push("</div>");	
			};
			
			var timelineData = {
				timelines : [
					{
						values : [
							{
								"cssClass" : "chart-navBlock",
								"timelineName" : "NAV",
								"startEventName" : "navigationStart",
								"startEventValue" : data.query("performance.timing.navigationStart"),
								"endEventName" : "fetchStart",
								"endEventValue" : data.query("performance.timing.fetchStart")
							},
							{
								"cssClass" : "chart-dnsBlock",
								"timelineName" : "DNS",
								"startEventName" : "domainLookupStart",
								"startEventValue" : data.query("performance.timing.domainLookupStart"),
								"endEventName" : "domainLookupEnd",
								"endEventValue" : data.query("performance.timing.domainLookupEnd")
							},
							{
								"cssClass" : "chart-TCPBlock",
								"timelineName" : "TCP",
								"startEventName" : "connectStart",
								"startEventValue" : data.query("performance.timing.connectStart"),
								"endEventName" : "connectEnd",
								"endEventValue" : data.query("performance.timing.connectEnd")
							},
							{
								"cssClass" : "chart-requestBlock",
								"timelineName" : "REQ",
								"startEventName" : "requestStart",
								"startEventValue" : data.query("performance.timing.requestStart"),
								"endEventName" : "responseStart",
								"endEventValue" : data.query("performance.timing.responseStart")
							},
							{
								"cssClass" : "chart-responseBlock",
								"timelineName" : "RESP",
								"startEventName" : "responseStart",
								"startEventValue" : data.query("performance.timing.responseStart"),
								"endEventName" : "responseEnd",
								"endEventValue" : data.query("performance.timing.responseEnd")
							}
						]
					},
					
					{
						values : [
							{
								"cssClass" : "chart-domReady",
								"timelineName" : "FBT TO DOMREADY",
								"startEventName" : "domLoading",
								"startEventValue" : data.query("performance.timing.domLoading"),
								"endEventName" : "domContentLoadedEventStart",
								"endEventValue" : data.query("performance.timing.domContentLoadedEventStart")
							},
							{
								"cssClass" : "chart-domReadyDuration",
								"timelineName" : "DOMREADY DURATION",
								"startEventName" : "domContentLoadedEventStart",
								"startEventValue" : data.query("performance.timing.domContentLoadedEventStart"),
								"endEventName" : "domContentLoadedEventEnd",
								"endEventValue" : data.query("performance.timing.domContentLoadedEventEnd")
							},
							{
								"cssClass" : "chart-domReadyToLoad",
								"timelineName" : "DOMREADY TO LOAD",
								"startEventName" : "domContentLoadedEventEnd",
								"startEventValue" : data.query("performance.timing.domContentLoadedEventEnd"),
								"endEventName" : "domComplete",
								"endEventValue" : data.query("performance.timing.domComplete")
							},
							{
								"cssClass" : "chart-loadEventDuration",
								"timelineName" : "LOAD DURATION",
								"startEventName" : "loadEventStart",
								"startEventValue" : data.query("performance.timing.loadEventStart"),
								"endEventName" : "loadEventEnd",
								"endEventValue" : data.query("performance.timing.loadEventEnd")
							}
						]
					}	
				]
			};
			
			var chartHtml = [];
			
			chartHtml.push("<div id='timeline-scale' class='timeline-scale reveal'>");
			
			var DT_as_string = "" + DT;
			var max = Math.pow(10, DT_as_string.length) ;
			
			while(max/2 > DT) {
				max = Math.floor(max/2);
			}
			
			var scaleUnit = Math.floor(max/5);
			var timeLabel ;
			var currentPosPx = 0, currentPos = 0;
			
			while(1) {
			
				if(currentPosPx > availableWidthInPixel) {
					break;
				}
				
				timeLabel = currentPos + " ms" ;
				// Adding timeline scale markers (if it does not fall outside of the timeline): 
				if(availableWidthInPixel > (currentPosPx + timeLabel.length*10)) {
				
					chartHtml.push("<div style='left:"+currentPosPx+"px'class='timeline-scale-marker'>"+ timeLabel +"</div>");
				}
				
				currentPos += scaleUnit;
				currentPosPx += Math.floor(availableWidthInPixel*scaleUnit/DT)
			}
			
			chartHtml.push("<div id='timeline-scale-feedback' class='none'>");
			chartHtml.push("<div id='time-cursor' class=''></div>");
			chartHtml.push("<div id='time-vert-line' class=''></div>");

			chartHtml.push("</div></div>");
			
			chartHtml.push("<div id='rawValuesChart' class='rawValuesChart'>");
			
			for(var t=0; t<timelineData.timelines.length; t++) {
				
				var timeline = timelineData.timelines[t];
				
				chartHtml.push("<div class='timeline'>");	
				
				for(var i=0, l=timeline.values.length; i<l; i++) {
					
					buildTimelineBlock(chartHtml, timeline.values[i]);
				}
				
				chartHtml.push("</div>");
			}
			
			chartHtml.push("</div>");
			chartHtml.push("<div id='customValuesChart' class='customValuesChart'></div>");
			
			return chartHtml.join('');;
		}
	};
	
	var customValuesPanelDefinition =  {
		"title" : "User defined metrics",
		"panelName" : "rightColumnPanel",
		"template" : function(data, ctx) {
			
			var advList = "<ul class='list'>";
			
			function addItemToAdvList(key, value) {
				
				advList += "<li class='entry has-overla' data-overlay-position='left'>";
				advList += "<span class='entry-label'>"+key+"</span>";
				advList += "<span class='entry-value'>"+value + "</span>";
				advList += "<span class='overlay-content none'>fion</span>";
				advList += "</li>";
			}
			
			addItemToAdvList("responseStart - navigationTime", (data.query("performance.timing.responseStart") - data.query("performance.timing.navigationStart")));
			
			addItemToAdvList("connection duration", (data.query("performance.timing.connectEnd") - data.query("performance.timing.connectStart")));
			addItemToAdvList("domLoading - responseStart", (data.query("performance.timing.domLoading") - data.query("performance.timing.responseStart")));
			addItemToAdvList("domInteractive - responseStart", (data.query("performance.timing.domInteractive") - data.query("performance.timing.responseStart")));
			
			addItemToAdvList("domContentLoadedEventStart - responseStart", (data.query("performance.timing.domContentLoadedEventStart") - data.query("performance.timing.responseStart")));
			addItemToAdvList("domReadyEvent duration", (data.query("performance.timing.domContentLoadedEventEnd") - data.query("performance.timing.domContentLoadedEventStart")));
			
			addItemToAdvList("loadEventStart - responseStart", (data.query("performance.timing.loadEventStart") - data.query("performance.timing.responseStart")));
			addItemToAdvList("loadEvent duration", (data.query("performance.timing.loadEventEnd") - data.query("performance.timing.loadEventStart")));
			
			advList += "</ul>";
			
			return advList;
		}
	}
	
	var dockPanelDefinition = {
		"title" : "",
		"panelName" : "dockPanel",
		"template": function(data, ctx) {
			
			var html = [];
			
			if(AppState.monitorModeOn) { // if(data.isDataCollection) {
				var monitorLabel = AppConfig.labels.StartMonitoring;
				if(!AppState.monitorModePause) {
					monitorLabel = AppConfig.labels.PauseMonitoring;
				}
				html.push("<a id='toggle-monitoring' data-global-event='toggle-monitoring' title='Click to pause monitoring of this page' class='monitoring-on navlet-button color action' href='javascript:void(0)' >" +  monitorLabel  + "</a>");
				html.push("<div class='monitor-feedback-panel'>");
				
				html.push("<a												class='navlet-button-action' 				href='javascript:void(0)'>Samples: " + AppState.numberRecords + "</a>");
				html.push("<a title='Click to bring monitoring window to foreground' data-global-event='focus-remote-window' 				class='navlet-button-action action' 		href='javascript:void(0)'>Focus monitor window</a>");
				html.push("<a title='Click to export monitoring data to aa serialized JSON' data-global-event='export-monitoring-data' 	class='navlet-button-action action' 		href='javascript:void(0)'>Export data</a>");
				html.push("<a data-global-event='reset-monitoring' 			class='navlet-button-action last action' 	href='javascript:void(0)'>Reset</a>");
				
				html.push("</div>");
			}
			else {
			
				html.push("<a id='toggle-monitoring' title='Click to start monitoring of the current page' data-global-event='toggle-monitoring' class='navlet-button color action' href='javascript:void(0)' >" + AppConfig.labels.StartMonitoring + "</a>");
			}
			html.push("<a data-global-event='about' class='navlet-button color action' href='javascript:void(0)' >about</a>");
			html.push("<a data-global-event='close-navlet' title='Click to close the NAvlet and return to the background page' class='navlet-button color action' href='javascript:void(0)' >close Navlet</a>");
			
			
			return html.join('');
		}
	};
	
	var Utils = {
	
			getLogger : function(windowContext, loggerName) {
				
				var serializeMessage = function(msg) {
				
					if(typeof(msg) != "string") {
						
						try {
						
							// In case the msg is a valid JSON object:
							msg = JSON.stringify(msg);
						}
						catch(e) {
							// if the JSON stringification fail, we just let the JS engine 
							// do the stingification
						}
					}
					
					return msg;
				};
				
				return {
				
					info : function(msg) {
						windowContext.console.info("[" + loggerName + "]: " + serializeMessage(msg) )
					},
					
					error : function(msg) {
						
						windowContext.console.error("[" + loggerName + "]: " + serializeMessage(msg))
					}
				};
			},
			
			logger: function() {
			
				return Utils.getLogger("Utils");
			},
			
			offset: function(elem) {
				var offset = null;
				if ( elem ) {
					offset = {left: 0, top: 0};
					do {
						offset.top += (elem.offsetTop - elem.scrollTop);
						offset.left += (elem.offsetLeft - elem.scrollLeft);
						elem = elem.offsetParent;
					} while ( elem );
				}
				return offset;
			},
			
			parseBoolean: function(booleanAsString) {
				
				if(typeof(booleanAsString) == 'string') {
				
					if(booleanAsString == "true") {
						return true;
					}
					else if (booleanAsString == "false"){
						return false;
					}
					// Boolean parser only accept "true" or "false" string,
					// No support for middle values that generate complex bugs
				}
				
				Utils.logger.error("parseBoolean failed on parsing: <" +booleanAsString+ ">");	
			},
			closestByClass: function(className, elt) {
			
				var cur = elt;
				while ( cur.tagName.toLowerCase() != "body") {
					if ( Utils.hasClass(cur, className) ) {
						
						return cur;

					} else {
						cur = cur.parentNode;
					}
				}
				// body case:
				if(Utils.hasClass(cur, className)) {
					return cur;
				}
				
				return null;
			},
			
			store : {
			
				get: function(key, defaultValue) {
				
					defaultValue = defaultValue || null;
					
					var storedValue = localStorage.getItem(key);
					
					if(storedValue == null) {
						return defaultValue;
					}
					return storedValue
					
				},
				
				set: function(key, value) {
				
					//try
					localStorage.setItem(key, value);
					//catch
				}
			
			},
			
			cloneJSONObject : function(jsonObj) {
			
				return JSON.parse(JSON.stringify(jsonObj));
			},
			
			isAChildOf : function(_parent, _child) {
				
			   if (_parent === _child) { return false; }
				  while (_child && _child !== _parent)
			   { _child = _child.parentNode; }

			   return _child === _parent;
			},
			
			addEvent : (function () {
				
				var mouseEnter = function(_fn) {
				
				   return function(_evt)
				   {
					  var relTarget = _evt.relatedTarget;
					  if (this === relTarget || Utils.isAChildOf(this, relTarget))
						 { return; }

					  _fn.call(this, _evt);
				   }
				};

				var setListener = function (el, ev, fn) {
					if (el.addEventListener) {
						setListener = function (el, ev, fn) {
							if(ev === 'mouseenter') {
							
								el.addEventListener("mouseover", mouseEnter(fn), false);
							}
							else if(ev === 'mouseleave') {
							
								el.addEventListener("mouseout", mouseEnter(fn), false);
							}
							else {
								el.addEventListener(ev, fn, false);
							}
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
			})(),
				
			isSet : function(ref) {
				return typeof(ref) != "undefined" && ref != null;
			},
			
			isArray : function(obj) {
				
				//http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
				return Utils.isSet(obj) &&  Object.prototype.toString.call(obj) === '[object Array]';
			},
			
			trim : function (stringToTrim) {
				return stringToTrim.replace(/^\s+|\s+$/g,"");
			},
			
			ltrim : function (stringToTrim) {
				return stringToTrim.replace(/^\s+/,"");
			},
			
			rtrim : function (stringToTrim) {
				return stringToTrim.replace(/\s+$/,"");
			},
			
			queryObject : function(dataObj, queryKey, value) {
				
				var retValue, keyPath, dataObj;
				
				if(typeof(queryKey) == 'string') {
					
					keyPath = queryKey.split('.');
					try {
					
						for(var i=0; i<keyPath.length; i++) {
							
							dataObj = dataObj[keyPath[i]];
						}
					}
					catch(ex) {
						throw "[queryObject] Issue when querying PerfData object with key <" + queryKey+ ">";
						console.log(this._data);
						console.log(ex);
					}
					
					if(arguments.length == 3) { 
						// Setter mode:
						dataObj = value;
					}
					else {
						// getter mode:
						return dataObj;
					}
				}
				else {
					throw('[queryObject] Bad key format to query/set PerfData. queryKey: <' + queryKey +'> on following object:');
					console.log(dataObj);
				}
				
				return retValue
			},
			
			hasClass : function(elt, className) {
			
				var classes = elt.className;
				console.log(classes + " -- " + className);
				if(typeof(classes)=='string') {
					if((new RegExp("\\b" + className + "\\b","ig")).test(classes)) {
						return true;
					}
				}
				return false;
			},
			
			removeClass : function(elt, className) {
			
				var classes = elt.className;
				if(typeof(classes)=='string') {
					elt.className =classes.replace(new RegExp("\\b" + className + "\\b","ig"),'');
				}
				return elt;
			},
			
			addClass : function(elt, className) {
			
				var classes = elt.className;
				if(typeof(classes)=='string') 
					elt.className = className + " " + classes.replace(new RegExp("\\b" + className + "\\b","ig"),'');
				else
					elt.className = className;
					
				return elt;
			},
			
			generateElement : function(tagName, eltConf, context) {
				
				if(!Utils.isSet(context)) {
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
			},
			
			isValidUnixTime : function(t) {
			
				if(Utils.isSet(t) && t > AppConfig.minimalRealisticUnixTime) {
					return true;
				}
				return false;
			},
			
			isValidDeltaTime : function(t) {
			
				if(Utils.isSet(t) && t >=0) {
					return true;
				}
				return false;
			},
			
			/**
				http://ejohn.org/projects/jspark/
			*/
			sparkline: function (o) {
			  var p = o.innerHTML.split(',');
			  while ( o.childNodes.length > 0 )
				o.removeChild( o.firstChild );

			  var nw = "auto";
			  var nh = "auto";
			  if ( window.getComputedStyle ) {
				nw = window.getComputedStyle( o, null ).width;
				nh = window.getComputedStyle( o, null ).height;
			  }

			  if ( nw != "auto" ) nw = nw.substr( 0, nw.length - 2 );
			  if ( nh != "auto" ) nh = nh.substr( 0, nh.length - 2 );

			  var f = 2;
			  var w = ( nw == "auto" || nw == 0 ? p.length * f : nw - 0 );
			  var h = ( nh == "auto" || nh == 0 ? "1em" : nh );

			  var co = document.createElement("canvas");

			  if ( co.getContext ) o.style.display = 'inline';
			  else return false;

			  co.style.height = h;
			  co.style.width = w;
			  co.width = w;
			  o.appendChild( co );

			  var h = co.offsetHeight;
			  co.height = h;

			  var min = 9999;
			  var max = -1;

			  for ( var i = 0; i < p.length; i++ ) {
				p[i] = p[i] - 0;
				if ( p[i] < min ) min = p[i];
				if ( p[i] > max ) max = p[i];
			  }

			  if ( co.getContext ) {
				var c = co.getContext("2d");
				c.strokeStyle = "red";
				c.lineWidth = 1.0;
				c.beginPath();

				for ( var i = 0; i < p.length; i++ ) {
				  if ( i == 0 )
					c.moveTo( (w / p.length) * i, h - (((p[i] - min) / (max - min)) * h) );
				  c.lineTo( (w / p.length) * i, h - (((p[i] - min) / (max - min)) * h) );
				}

				c.stroke();
				o.style.display = 'inline';
			  }
			}
	};
	
	var PerfData = function(ctx) {
		
		this._ctx = ctx;
		if(!Utils.isSet(ctx)) {
			this._ctx = window;
		}
		
		this._data = {};
		
		this._data.creationTime = new Date().getTime();
		this._data.performance =  this._ctx.performance;
		try {
			// Protect exception in case navigation timing object is not ready
			this._data.timeReference = this._ctx.performance.timing.navigationStart;
		}
		catch(e){ /* Should be catch explicitly through a isReady() call */ }
		
		this._data.customTimers =  {};
		
	}
	
	PerfData.prototype = {
	
		
		query : function(queryKey) {
			
			return Utils.queryObject(this._data, queryKey) ;
		},
		
		set : function(queryKey, value) {
		
			Utils.queryObject(this._data, queryKey, value);
		},
		 
		serialize : function() {
				
			return this._ctx.JSON.stringify(this._data);
		},
		
		setData : function(data) {
			
			if(typeof(data)=='string') {
				
				// Possibly a serialized JSON object:
				data = this._ctx.JSON.parse(data);
			}
			this._data = data;
		},
		
		getRawData : function() {
		
			return this._data;
		},
		
		isReady : function() {
			
			// Check if the performance object was ready when get:
			// Basically we check that the first and last field
			// were well set:
			if(Utils.isValidUnixTime(this.query('performance.timing.navigationStart')) 
				&& 
			   Utils.isValidUnixTime(this.query('performance.timing.loadEventEnd'))) {
				return true;
			}
			return false;
		}
	}
	
	PerfDataSet = function() {
		
		this._set = [];
		this._nRecord = 0;
		this._minRecordTime = Infinity;
		this._maxRecordTime = 0;
		this._aggregatedData = null;
		this.logger = Utils.getLogger(window, "PerfDataSet");
	};
	
	PerfDataSet.prototype = {
	
		/**
		*
		* @private
		*/
		_processJson : function (src, tgt, cb) {
			
			if(typeof(cb) == 'undefined') {
				// callback not defined, the processor will do nothing
				// beside copying the 'src' properties/values into the 'tgt' object
				cb = function(x) {return x;};
			}
			for(var k in src) {
				if (src.hasOwnProperty(k)) {
					if(typeof(src[k])=='object') {
					
						if(typeof(tgt[k]) == 'undefined') {
							tgt[k] = {};
						}
						this._processJson(src[k], tgt[k], cb);
					}
					else {
						
						tgt[k] = cb(src[k], tgt[k]);
					}
				}
			}
		},
		
		/**
		*
		* @private
		*/
		_aggregateData : function(newData) {
		
			/*
			if(newData.creationTime < minRecordTime) {
				minRecordTime = newData.creationTime;
			}
			else if(newData.creationTime > maxRecordTime) {
				maxRecordTime = newData.creationTime;
			}*/
			
			var shiftNewData = {};
			this._processJson(newData.getRawData(), shiftNewData, function(nData, emptyObj) {
				
				// Shifting values with navigationStart value:
				return nData - newData.query("performance.timing.navigationStart")
			});
			
			// Cleaning meaningless information:
			delete shiftNewData.creationTime ;

			if(this._aggregatedData == null) {
				
				this._aggregatedData = shiftNewData;
			}
			else {
				
				var self = this;
				this._processJson(shiftNewData, this._aggregatedData, function(nData, avgData) {
					
					return Math.floor((avgData * self._nRecord + nData)/(self._nRecord + 1));
				});
			}
			
			this._nRecord++;
		},
		
		reset: function() {
			
			this._set = [];
			this._nRecord = 0;
			this._aggregatedData = null;
			
			this._minRecordTime = Infinity;
			this._maxRecordTime = 0;
		
		},
		
		getRecordCount : function() {
			
			return this._nRecord;
		},
		
		exportAsString: function() {
		
			
			var dataAsJson = [];
			for(var i=0, l=this._set.length; i<l ; i++) {
				dataAsJson.push(this._set[i].getRawData());
			}
			this.logger.info(dataAsJson);
			
			return JSON.stringify(dataAsJson);
		},
			
		addPerfData : function(perfData) {
			
			if(perfData.isReady()) {
				this._set.push(perfData);
				this._aggregateData(perfData);
			}
			else {
				throw "[PerfDataSet]: Trying to add an invalid PerfData object.";
				this.logger.error(perfData);
			}
		},
		
		query: function(key) {
		
			return Utils.queryObject(this._aggregatedData, key);
		},
			
		// Flag used at template level to know 
		// if they handle a single PerfData or a PerfDataSet objetct:
		"isDataCollection": true,
		
		"hasSparklineData" : true,
		
		getSparklineData: function(key) {
		
			var tony = []
		
			for(var i=0; i< this._set.length;i ++) {
				
				tony.push(this._set[i].query(key) - this._set[i].query("performance.timing.navigationStart"));
			}
			
			return "<span class='sparkline' style='display:none'>" + tony.join(",") + "</span>";
		}
	};
	
	
	var Panel = function() {
		
		var id,
			inst,		
			tpl, 
			domCtx, 
			ctx,
			masterWindow,			
			cssClass, 
			panelName, 
			template, 
			data, 
			logger,
			afterCreate;
		
		var predefinedPanels = {
			"dockPanel": {},
			"bottomPanel" : {},
			"leftColumnPanel": {},
			"rightColumnPanel": {}
		}
		
		var generateContainer = function(html) {
			
			var elt ;
			
			elt = Utils.generateElement("div", {
				"id": id,
				"class": "panel " + panelName + " collapsed"
			}, ctx.document);
			
			domCtx.appendChild(elt);
			
			var panel = ctx.document.getElementById(id);
			panel.innerHTML = html;
			update();
			
			var wasExpanded = Utils.parseBoolean(Utils.store.get(panelName + "-expanded", "false")); // Not expanded by default
			
			if(wasExpanded){ // was not defined, default state is expanded
				togglePanel();
			}
			
			attachPanelEvents();
			
			return elt;
		}
		
		var attachPanelEvents = function() {
			var toggle = ctx.document.querySelectorAll("#"+ id +" .panel-header")[0]
			Utils.addEvent(toggle, "click", togglePanel);
			
			var panelContent = ctx.document.querySelectorAll("#"+ id +" .panel-content")[0]
			Utils.addEvent(panelContent, "mouseover", showContextualContent);
			Utils.addEvent(panelContent, "mouseout", hideContextualContent);
		}
		
		var showContextualContent = function(evt) {
		
			var popupTrigger = Utils.closestByClass("has-overlay", evt.target);
			
			if(popupTrigger != null) {
				
				var content = popupTrigger.querySelectorAll(".overlay-content")[0].innerHTML;
				var iframeObj = ctx.top.document.getElementById(panelName);  // Assumption: only one level of nested iframes
			    var objPos = Utils.offset(popupTrigger);			
				var relativePosition = popupTrigger.getAttribute("data-overlay-position");
				
				if(content && typeof(relativePosition) == "string") {
				
					var offsetX = 0, 
						offsetY = 0, 
						contentPosConf = null,
						defaultTop = iframeObj.offsetTop + objPos.top
						defaultLeft = iframeObj.offsetLeft + objPos.left;
					
					if(relativePosition == "top") {
						
						contentPosConf = 
							{
								width: 254,
								height: 127											
							};
							
						contentPosConf.top = defaultTop - contentPosConf.height ;
						contentPosConf.left = defaultLeft - Math.floor(contentPosConf.width/2) + Math.floor(popupTrigger.offsetWidth / 2) ;
						
					}
					else if(relativePosition == "left") {
						
						contentPosConf = 
							{
								width: 254,
								height: 127											
							};
							
						contentPosConf.top = defaultTop + Math.floor(popupTrigger.offsetHeight/2) -  Math.floor(contentPosConf.height/2) ;
						contentPosConf.left = defaultLeft - contentPosConf.width;
					}
					else if (relativePosition == "right") {
						
						contentPosConf = 
							{
								width: 254,
								height: 127											
							};
							
						contentPosConf.top = defaultTop + Math.floor(popupTrigger.offsetHeight/2) -  Math.floor(contentPosConf.height/2) ;
						contentPosConf.left = defaultLeft + popupTrigger.offsetWidth;
					}
					else {
						logger.error("relativePosition <'"+ relativePosition +"'> found but not well defined.");
					}
					
					
					
					EventBus.fire("show-popup", 
						{
							"popupConf": contentPosConf,
							"content": content
						}
					);
				}
				else {
					logger.error("'has-overlay' defined but no orientation defined");
				}
				
			}	
		};
		
		
		var hideContextualContent = function(evt) {
			
			var popupTrigger = Utils.closestByClass("has-overlay", evt.target);
			
			if(popupTrigger != null) {
				
				// Exiting a popup that could have triggerred an overlay before, closing it
				EventBus.fire("hide-popup");
			}
		};
		
		
		var togglePanel = function() {
			
			var panel = ctx.document.getElementById(id);
			var panelToggle = panel.querySelectorAll(".panel-header .panel-toggle")[0];
			var txt = panelToggle.innerHTML;
			
			panelToggle.innerHTML = (txt == AppConfig.labels.Expand) ? AppConfig.labels.Collapse : AppConfig.labels.Expand;
			
			
			// Extract to a wrapper for try/catch:
			var currentState = (txt == AppConfig.labels.Expand) ? AppConfig.labels.Expand : AppConfig.labels.Collapse;
			
			// We toggle the panel:
			// Change label and notify the layout manager:
			if(currentState ==  AppConfig.labels.Expand) {
				
				panelToggle.innerHTML = AppConfig.labels.Collapse;
				Utils.store.set(panelName + "-expanded", "true");
				EventBus.fire("panel-state-changed", {panelName: panelName, state: AppConfig.labels.Expand});
			}
			else {
				
				panelToggle.innerHTML = AppConfig.labels.Expand;
				Utils.store.set(panelName + "-expanded", "false");
				EventBus.fire("panel-state-changed", {panelName: panelName, state:  AppConfig.labels.Collapse});
			}
			
			
			
			var panelContent = ctx.document.querySelectorAll("#"+ id +" .panel-content")[0];
			if(Utils.hasClass(panel, 'collapsed')) {
			
				Utils.addClass(panel, "expanded");
				Utils.removeClass(panel, "collapsed");
			}
			else {
			
				Utils.addClass(panel, "collapsed");
				Utils.removeClass(panel, "expanded");
			}
			
		}
		
		var getPanelContent = function() {
		
			return ctx.document.querySelectorAll("#"+ id +" .panel-content")[0];
		}
		
		var update = function() {
		
			if(data) {
			
				ctx.document.querySelectorAll("#"+ id +" .panel-content-wrap")[0].innerHTML = template(data, ctx);
				
				var actions = ctx.document.querySelectorAll("#"+ id +" .action");
				
				for(var i=0; i<actions.length; i++) {
					Utils.addEvent(actions[i], "click", (function() {
						
						var actionEvent = actions[i].getAttribute("data-global-event");
						return function() {
							navlet.executeAction(actionEvent);
						}
					})());
				}
				
				if(afterCreate) {
					
					afterCreate(data, ctx);
				}
			}
		}
		
		var buildPanel = function() {
		
			var html = [];
			var expanded = false;
			
			html.push("<div class='panel-header'>");
			html.push("    <h1 class='panel-title'>" + title + "</h1>");		
			html.push("    <a class='panel-toggle panel-action' href='javascript:void(0)'>" + (expanded ? AppConfig.labels.Expand : AppConfig.labels.Expand) + "</a>");
			html.push("</div>");
			
			html.push("<div class='panel-content'><div class='panel-content-wrap'></div></div>");
			
			var panelStub = generateContainer(html.join(""));
			
		};
		
		var onDirtyUI = function(evtData) {
			
			if(evtData && evtData.panelName) {
				
				// A panelName is defined, we clean current instance only if panelName match:
				if(evtData.panelName == panelName) {
					inst.updateView();
				}
			}
			else {
				// Nothing defined, we clean all panels
				inst.updateView();
			}
		};
		
		return {
			init: function(windowContext, jsonConf) {
				
				jsonConf = jsonConf || {};
				ctx = windowContext || window;
				masterWindow = jsonConf.masterWindow || window;
				inst = this;
				logger = Utils.getLogger(masterWindow, "Panel")
				
				if(Utils.isSet(jsonConf)) {
					domCtx =  jsonConf.domContext ||  ctx.document.getElementsByTagName('body')[0];
					title = jsonConf.title || "";
					panelName = jsonConf.panelName;
					if(!Utils.isSet(predefinedPanels[panelName])) {
						logger.error("Panel type not well defined")
					}
					
					afterCreate = jsonConf.afterCreate;
					
					data = jsonConf.data;
					if(!Utils.isSet(data)) {
						logger.info("Panel data not defined")
					}
					
					template = jsonConf.template;
					if(!Utils.isSet(template)) {
						template = function() {return ''};
						logger.info("Panel template not defined")
					}
					
					id = panelName + "-id";
				}
				else {
					Utils.error("Panel conf not well defined")
				}
				
				buildPanel();
				
				EventBus.listen('ui-dirty-state', {callback: onDirtyUI} );
				
				return inst;
			},
			updateView: function() {
				update();
			},
			updateData: function(newData) {
				data = newData ;	
			}
		}
	}
	
	var RemoteNavlet = function() {
	
		var ctx,
			masterWindow,
			logger ;
			
		var initRemoteMode = function() {
			
			logger.info("initRemoteMode called")
			
			var serializedMessage,
				data ;
			
			var postData = function() {
				
				data = new PerfData(ctx);
				
				if(data.isReady()) {
					serializedMessage = data.serialize();
					//masterWindow.console.log("[RemoteWindow]: --> Sending serialized data: "+serializedMessage);
					logger.info(" --> Sending serialized data...");
					masterWindow.postMessage(serializedMessage, ctx.location.href);
				}
				else {
					logger.info("Data not ready - waiting "+ AppConfig.timers.dataReadyPollingInterval + "ms before probing data again");
					ctx.setTimeout(postData,  AppConfig.timers.dataReadyPollingInterval);
				}
			};
			
			ctx.setTimeout(postData, AppConfig.timers.dataReadyPollingInterval);
			
			logger.info("initialization done.");		
		};
		
		return {
			init: function(context, conf) {
				
				conf = conf || {};
				
				if(!Utils.isSet(conf.masterWindow)) {
					mainLogger.error("RemoteNavlet masterWindow not well defined");
				}
				else {
					masterWindow = conf.masterWindow;
				}
				
				if(!Utils.isSet(conf.remoteWindow)) {
					mainLogger.error("RemoteNavlet remoteWindow not well defined");
				}
				else {
					ctx = conf.remoteWindow;
				}
				
				
				// Using masterWindow in order to see logs in main window (amd not the hidden remote one)
				logger = Utils.getLogger(masterWindow, "RemoteWindow");
				
				initRemoteMode();
			}
		}
	}
	
	var Navlet = function() {
		
		var ctx, 
			body, 
			head, 
			navletMainNode,
		    panels = [],
		    masterWindow, 
			remoteWindow,
		    unsupportedFeatures = [],
		    dockPanel, rawValuesPanel, customValuesPanel, chartPanel,
			dataSet,
			exportWindow,
			logger;
		
		// For remote only:
		var autoCloseTimer = null;
		
		var getUnsupportedFeatures = function(ctx) {
		
			if(!Utils.isSet(ctx)) {
				ctx = window;
			}
		
			var unsupportedFeatures = [];
			var feat, featurePath;
			
			for(var i=0;i<AppConfig.neededFeatures.length;i++) {
				
				featurePath = AppConfig.neededFeatures[i].split('.');
				feat = ctx;
				for(var p=0; p<featurePath.length; p++) {
					feat = feat[featurePath[p]];
					if(!Utils.isSet(feat)) {
						unsupportedFeatures.push(AppConfig.neededFeatures[i]);
						break;
					}
				}
			}
			
			return unsupportedFeatures;
		}
		
		var displayNoSupportMessage = function () {
				
				var msg = "Your browser does not support some needed JavaScript APIs.\n\n";
				msg += "The following list of features is not supported: "+unsupportedFeatures.join(", ")+"\n\n";
				msg += "Please use an up to date Google Chrome or IE9+.\n\n If you're using IE9, make check sure that your 'document mode' is set to 'IE9 standards' in the developer tool console (F12).\n";
				alert(msg);
				ctx.document.getElementById('navlet-loader').innerHTML = msg.replace(/\n\n/g,"<br/>");
		};
					
		var initLocalMode = function() {
			
			rawOffsetValue = Utils.parseBoolean(Utils.store.get( "rawOffsetValue" ,"false")); // getOffsetRawValuesOption();
			unsupportedFeatures = getUnsupportedFeatures(ctx);
			
			if(unsupportedFeatures.length == 0) {
			
				probeForDataReadyness();	
			}
			else {
				displayNoSupportMessage();
			}
			
			logger.info("Navlet initialized");
		};
		
		var probeForDataReadyness = function() {
		
				var data = new PerfData(ctx);
				
				if(!data.isReady()) {
					logger.info("Data not ready, waiting before drawing panels");
					ctx.document.getElementById('navlet-loader').innerHTML = "Waiting for window.performance object to be available...";
					setTimeout(probeForDataReadyness, 300);
					return;
				}
				
				// We are done loading dependencies and window.performance is available: we hide the loader
				var loader = ctx.document.getElementById('navlet-loader');
				loader.innerHTML = "";
				loader.style.padding = 0;
				
				// Main initialization of Navlet layout: 
				LayoutManager.init(window);
				
				// Broadcast data:
				EventBus.fire("data-updated", data);
		};
		
		var onPostMessageReceived = function(e){
				
				logger.info("<-- Receiving serialized data received from remote window...");
				var remoteWindowPerfData = new PerfData();
				remoteWindowPerfData.setData(e.data)
				
				if(AppState.monitorModeOn) {
					
					dataSet.addPerfData(remoteWindowPerfData);
					AppState.numberRecords = dataSet.getRecordCount(); 
					EventBus.fire("data-updated", dataSet);
				}
				
				for(var i=0; i<panels.length; i++) {
					panels[i].updateData(dataSet);
					panels[i].updateView();
				}
				reloadRemoteWindow();
		
		};
		
		var startMonitorMode = function() {
			
			AppState.monitorModeOn = true;
			
			if(AppState.monitorModePause) {
				
				// Navlet was previously in pause
				// Remove flag and keep existing data
				AppState.monitorModePause = false;
			}
			else {
				// Initial start and was not in pause before,
				// new data set:
				dataSet = new PerfDataSet();
			}
			// Attach event handler to receive data from remote windows:
			ctx.addEventListener("message", onPostMessageReceived, false);
			
			spawnRemoteWindow();
		};
		
		var pauseMonitorMode = function() {
			
			// Attach event handler to receive data from remote windows:
			ctx.removeEventListener("message", onPostMessageReceived);
			
			if(Utils.isSet(remoteWindow)) {
				if(remoteWindow.close) {
					remoteWindow.close();
				}
				remoteWindow = null;
			}
			
			AppState.monitorModePause = true;
		};
		
		var resetMonitorMode = function() {
			
			var sampleCount = dataSet.getRecordCount();
			if(sampleCount > 0) {
				if (confirm("Are you sure you want to drop your "+sampleCount+" samples ?" )) { 
					
					// TODO: refactor using global events and module:
					AppState.numberRecords = 0;
					dataSet.reset();
				}
			}
			
			
		};
		
		var spawnRemoteWindow = function() {
			
			logger.info("Initial spawning of remote window")
			if(Utils.isSet(remoteWindow)) {
				if(remoteWindow.close) {
					remoteWindow.close();
				}
				remoteWindow = null;
			}
			
			var windowOptions = [];
			windowOptions.push("width=800");
			windowOptions.push("height=680");
			windowOptions.push("fullscreen=yes"); // Working on IE only 
			//windowOptions.push("menubar=1");
			windowOptions.push("resizable=yes"); 
			//windowOptions.push("location=1"); 
			
			//var windowId =(new Date()).getTime();
			
			remoteWindow = ctx.open(
				ctx.location.href,
				"navletRemoteWindow",
				windowOptions.join(',')
			);
			
			ctx.focus();
			
			
			remoteWindow.navlet = {"url_root" : ctx.navlet.url_root }
			
			reloadRemoteWindow();
			
		};
		
		var focusRemoteWindow = function() {
			
			remoteWindow.focus();
		};
		
		var reloadRemoteWindow = function() {
			
			if(autoCloseTimer != null) {
				// Autoclose set, deactivating it:
				logger.info("Clearing - autoclosing");
				remoteWindow.clearTimeout(autoCloseTimer);
			}
			logger.info("reloading");
			remoteWindow.location.reload();
			
			masterWindow.setTimeout(function(){
				logger.info("Creating Navlet remote instance")
			
				var remoteNavlet = new RemoteNavlet();
				remoteNavlet.init(remoteWindow, 
					{
						"remoteWindow": remoteWindow,
						"masterWindow": ctx
					}
				);
				
				
				autoCloseTimer = remoteWindow.setTimeout(function(){	
							
					// Autoclose programmed if we lose connection 
					// with masterWindow (could be close by the user for instance)
					logger.info("Connection lost - autoclosing remoteWindow");
					remoteWindow.close();	
				}, AppConfig.timers.autoCloseTimerDuration);
				
			}, 1000); // TODO: find a better way to handle 'reload load event' (breaking on IE without setTimeout)
		};
		
		
		var exportData = function() {
			
			var windowOptions = [];
			windowOptions.push("width=800");
			windowOptions.push("height=680");
			windowOptions.push("fullscreen=yes"); // Working on IE only 
			//windowOptions.push("menubar=1");
			windowOptions.push("resizable=yes"); 
			//windowOptions.push("location=1"); 
			
			//var windowId =(new Date()).getTime();
			
			if(exportWindow !== undefined) {
				exportWindow.close();
			}
			
			exportWindow = ctx.open(
				'about:blank',
				"navletExportWindow",
				windowOptions.join(',')
			);
			
			var content = "<html><body><code style='word-wrap: break-word'>" + dataSet.exportAsString() + "</code></body></html>"
			exportWindow.document.write(content) ;
			exportWindow.focus();
		};
		
		return {
			init: function(context, conf) {
				
				mainLogger.info("Initializing navlet")
				
				ctx = Utils.isSet(context) ? context : window;	
				masterWindow = ctx;

				logger = Utils.getLogger(ctx, "masterWindow");
				
				body = ctx.document.getElementsByTagName('body')[0];
				head = ctx.document.getElementsByTagName('head')[0];
								
				initLocalMode();
				
			},
			
			
			executeAction : function(actionName) {
			
				if(actionName == "toggle-monitoring") {
					if(AppState.monitorModeOn) {
						if(AppState.monitorModePause) {
							startMonitorMode();
						}
						else {
							pauseMonitorMode();
						}
					}
					else {
						startMonitorMode();
					}
					EventBus.fire('ui-dirty-state', {"panelName": "dockPanel"});
				}
				else if(actionName == "close-navlet") {
					
					pauseMonitorMode();
					EventBus.fire("close-navlet");
				}
				else if(actionName == "offset-raw-values") {
					rawOffsetValue = !rawOffsetValue;
					Utils.store.set("rawOffsetValue", ""+rawOffsetValue);
					//ctx.localStorage.setItem("rawOffsetValue", ""+rawOffsetValue);
					
					EventBus.fire('ui-dirty-state');
				}
				else if(actionName == "export-monitoring-data") {
					exportData();
				}
				else if(actionName == "focus-remote-window") {
					focusRemoteWindow();
				}
				else if(actionName == "reset-monitoring") {
					resetMonitorMode();
					EventBus.fire('ui-dirty-state', {"panelName": "dockPanel"});
				}
				else if(actionName == "about") {
					
					ctx.open(
						AppConfig.misc.projectUrl,
						'_blank'
					);
				}
				else {
					alert("no action mapped: " + actionName)
				}
				
			}
		}
	};
	
	mainLogger = Utils.getLogger(window, "Navlet");
	
	navlet = new Navlet();
	navlet.init(window);
	
	
	
})()