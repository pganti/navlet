(function() {
	
	var navlet;
	
	var minimalRealisticUnixTime = 1300000000000 ; // an arbitrary date in the past
	
	/*
	// Thx doug 
	Object.prototype.begetObject = function () {
		function F() {}
		F.prototype = this;
		return new F();
	};
	*/
	
	var AppConfig = {
		
		"useIframeMode": false, // Deprecated but we never know ...
		
		"neededFeatures" : [
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
			"Expand" : "expand",
			"Collapse" : "collapse"
		},
		
		"timers": {
			"autoCloseTimerDuration" : 5000,
			"dataReadyPollingInterval": 500
		},	

		"minimalRealisticUnixTime" : 1300000000000, // an arbitrary date in the past, to smoke test unix times
		
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
	
	var trim = function (stringToTrim) {
		return stringToTrim.replace(/^\s+|\s+$/g,"");
	}
	
	var ltrim = function (stringToTrim) {
		return stringToTrim.replace(/^\s+/,"");
	}
	
	var rtrim = function (stringToTrim) {
		return stringToTrim.replace(/\s+$/,"");
	}
	
	var hasClass = function(elt, className) {
	
		var classes = elt.className;
		if(typeof(classes)=='string') {
			if((new RegExp("\\b" + className + "\\b","ig")).test(classes)) {
				return true;
			}
		}
		return false;
	};
	
	var removeClass = function(elt, className) {
	
		var classes = elt.className;
		if(typeof(classes)=='string') {
			elt.className =classes.replace(new RegExp("\\b" + className + "\\b","ig"),'');
		}
		return elt;
	};
	
	var addClass = function(elt, className) {
	
		var classes = elt.className;
		if(typeof(classes)=='string') 
			elt.className = className + " " + classes.replace(new RegExp("\\b" + className + "\\b","ig"),'');
		else
			elt.className = className;
			
		return elt;
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
	
		if(isSet(t) && t > AppConfig.minimalRealisticUnixTime) {
			return true;
		}
		return false;
	};
	
	
	
	
	
	
	
	var PerfData = function(ctx) {
		
		this._ctx = ctx;
		if(!isSet(ctx)) {
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
	
		/**
		* @private
		*/
		_queryData : function(queryKey, value) {
		
			var retValue, keyPath, dataObj = this._data;
			if(typeof(queryKey) == 'string') {
				
				keyPath = queryKey.split('.');
				try {
				
					for(var i=0; i<keyPath.length; i++) {
						
						dataObj = dataObj[keyPath[i]];
					}
				}
				catch(ex) {
					throw "[PerfData] Issue when querying PerfData object with key <" + queryKey+ ">";
					console.log(this._data);
					console.log(ex);
				}
				
				if(arguments.length > 1) { 
					// Setter mode:
					dataObj = value;
				}
				else {
					// getter mode:
					return dataObj;
				}
			}
			else {
				throw('[PerfData] Bad key format to query/set PerfData. queryKey: <' + queryKey +'>');
			}
			
			return retValue
		},
		
		query : function(queryKey, normalized) {
			
			return (normalized) ? this._queryData(queryKey) - this._data.timeReference :  this._queryData(queryKey) ;
		},
		
		set : function(queryKey, value) {
		
			this._queryData(queryKey, value);
		},
		
		queryNav : function(queryKey, normalized) {
			
			return (normalized) ? this._queryData("performance.timing." + queryKey) - this._data.timeReference:  this._queryData("performance.timing." + queryKey) ;
		},
		
		setNav : function(queryKey, value) {
		
			this._queryData("performance.timing." + queryKey, value);
		},
		 
		serialize : function() {
				
			return this._ctx.JSON.stringify(this._data);
		},
		
		setData : function(data) {
			
			if(typeof(data)=='string') {
				
				// Possibly a serialied JSON object:
				data = this._ctx.JSON.parse(data);
			}
			this._data = data;
		},
		
		getNormalizedData : function() {
		
			if(!this.ready()) {
				throw "[PerfData]: Can't get normalized data if PerfData object is not ready !"
			}
			
			
			
		},
		
		getRawData : function() {
		
			return this._data;
		},
		
		isReady : function() {
			
			// Check if the performance object was ready when get:
			// Basically we check that the first and last field
			// were well set:
			if(isValidUnixTime(this.queryNav('navigationStart')) 
				&& 
			   isValidUnixTime(this.queryNav('loadEventEnd'))) {
				return true;
			}
			return false;
		}
	}
	
	var PerfDataSet = function() {
		
		var set = [];
		var nRecord = 0;
		//var minRecordTime = Infinity;
		//var maxRecordTime = 0;
		
		var averageData = null;
		
		var aggregateData = function(newData) {
		
			/*
			if(newData.creationTime < minRecordTime) {
				minRecordTime = newData.creationTime;
			}
			else if(newData.creationTime > maxRecordTime) {
				maxRecordTime = newData.creationTime;
			}*/
			
			var shiftNewData = {};
			processJson(newData.getRawData(), shiftNewData, function(x,y) {debugger;return x - newData.queryNav("navigationStart")});
			

			
			if(averageData == null) {
				
				averageData = shiftNewData;
			}
			else {
				
				processJson(newData.getRawData(), shiftNewData, function(x, y) {
				
					debugger;
					return x - y;
				});
			}
		}
		
		var processJson = function (_obj, _copy, cb) {
			
			if(typeof(cb) == 'undefined')
				cb = function(x) {return x;};
			
			for(var k in _obj) {
				if(typeof(_obj[k])=='object') {
				
					if(typeof(_copy[k]) == 'undefined') 
						_copy[k] = {};
					processJson(_obj[k], _copy[k], cb);
				}
				else {
					
					_copy[k] = cb(_obj[k], _copy[k]);
				}
			}
		}
		
		return {
			"getRecordCount" : function() {
			
				return nRecord;
			},
			
			"addPerfData" : function(perfData) {
				if(perfData.isReady()) {
					nRecord++;
					set.push(perfData);
					aggregateData(perfData);
				}
				else {
					throw "[PerfDataSet]: Trying to add an invalid PerfData object.";
					log(perfData);
				}
			},
			
			
			// Flag used at template level to know 
			// if they handle a single PerfData or a PerfDataSet objetct:
			"isAggregated": true
			
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
				"class": "panel " + panelType + " collapsed"
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
			
			var panel = ctx.document.getElementById(id);
			var panelToggle = panel.querySelectorAll(".panel-header .panel-toggle")[0];
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
			if(hasClass(panel, 'collapsed')) {
			
				addClass(panel, "expanded");
				removeClass(panel, "collapsed");
			}
			else {
			
				addClass(panel, "collapsed");
				removeClass(panel, "expanded");
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
			
			html.push("<div class='panel-content'><div class='panel-content-wrap'>");
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
			windowName = "MasterWindow",
			dataSet;
		
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
			
			for(var i=0;i<AppConfig.neededFeatures.length;i++) {
				
				featurePath = AppConfig.neededFeatures[i].split('.');
				feat = ctx;
				for(var p=0; p<featurePath.length; p++) {
					feat = feat[featurePath[p]];
					if(!isSet(feat)) {
						unsupportedFeatures.push(AppConfig.neededFeatures[i]);
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
		
				var data = new PerfData(ctx);
				
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
						
						if(monitorModeOn) {
							
							html.push("<a id='toggle-monitoring' data-global-event='toggle-monitoring' class='monitoring-on navlet-button color action' href='javascript:void(0)' >" +  AppConfig.labels.StopMonitoring  + "</a>");
							html.push("<div class='monitor-feedback-panel'>");
							
							html.push("Samples:" + dataSet.getRecordCount());
							html.push("<a>focus remoteWindow</a>");// + dataSet.getRecordCount());
							html.push("<a>export data</a>");// + dataSet.getRecordCount());
							html.push("<a>help</a>");// + dataSet.getRecordCount());
							html.push("<a>reset</a>");
							
							html.push("</div>");
						}
						else {
						
							html.push("<a id='toggle-monitoring' data-global-event='toggle-monitoring' class='navlet-button color action' href='javascript:void(0)' >" + AppConfig.labels.StartMonitoring + "</a>");
						}
						html.push("<a data-global-event='about' class='navlet-button color action' href='javascript:void(0)' >about</a>");
						html.push("<a data-global-event='close-navlet' class='navlet-button color action' href='javascript:void(0)' >close Navlet</a>");
						
						
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
						
						
						
						for(var i=0, l=AppConfig.NavTimingProperties.length; i<l; i++) {
							tmpPropName = AppConfig.NavTimingProperties[i].name;
							value = data.queryNav(tmpPropName, rawOffsetValue);
							
							NA = "";
							if(!isValidUnixTime(value)) {
								value = "NA";
								NA = " na";
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
						
						function addItemToAdvList(key, value) {
							advList += "<li class='entry'><span class='entry-label row-font'>"+key+"</span><span class='entry-value row-font'>"+value + "</span></li>";
						}
						
						addItemToAdvList("responseStart - navigationTime", (data.queryNav("responseStart") - data.queryNav("navigationStart")));
						
						addItemToAdvList("connection duration", (data.queryNav("connectEnd") - data.queryNav("connectStart")));
						addItemToAdvList("domLoading - responseStart", (data.queryNav("domLoading") - data.queryNav("responseStart")));
						addItemToAdvList("domInteractive - responseStart", (data.queryNav("domInteractive") - data.queryNav("responseStart")));
						
						addItemToAdvList("domContentLoadedEventStart - responseStart", (data.queryNav("domContentLoadedEventStart") - data.queryNav("responseStart")));
						addItemToAdvList("domReadyEvent duration", (data.queryNav("domContentLoadedEventEnd") - data.queryNav("domContentLoadedEventStart")));
						
						addItemToAdvList("loadEventStart - responseStart", (data.queryNav("loadEventStart") - data.queryNav("responseStart")));
						addItemToAdvList("loadEvent duration", (data.queryNav("loadEventEnd") - data.queryNav("loadEventStart")));
						
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
						
						var initialTime = data.queryNav("navigationStart"),
							DT = data.queryNav("loadEventEnd") - data.queryNav("navigationStart"),
							availableWidthInPixel = ctx.document.querySelectorAll('#bottom-panel-id .panel-content-wrap')[0].offsetWidth - 160,
							widthPerc, leftMargin,
							positionContextClass;
						

						var buildTimelineBlock = function(htmlArray, timelineBlockConf) {
							pixelWidth = Math.floor(availableWidthInPixel*(timelineBlockConf.endEventValue - timelineBlockConf.startEventValue)/DT);
							leftMargin = Math.floor(availableWidthInPixel*(timelineBlockConf.startEventValue - initialTime)/DT)
							
							if(pixelWidth == 0) {
								return;
							}
							
							htmlArray.push("<div class='timeline-block reveal ");
							
							if(pixelWidth < 350) {
								if (leftMargin < availableWidthInPixel/2) {
									
									positionContextClass = " close-left-side ";
								}
								else {
								
									positionContextClass = " close-right-side ";
								}
								htmlArray.push(positionContextClass);
							}
							
							htmlArray.push(timelineBlockConf.cssClass);
							
							htmlArray.push("' style='width:");
							htmlArray.push(pixelWidth);
							htmlArray.push('px;left:');
							htmlArray.push(leftMargin);
							htmlArray.push("px;' >");
							
							if(timelineBlockConf.timelineName.length * 10 < pixelWidth) {
								htmlArray.push("<div class='font timeline-label'>" + timelineBlockConf.timelineName + "</div>");
							}
							
							htmlArray.push("<div class='timeline-block-flag start none'><div class='link-to-bar shadow'></div><div class='timeline-block-label font shadow'>"+ timelineBlockConf.startEventName +":  " +(timelineBlockConf.startEventValue - initialTime)+ "ms</div></div>");
							htmlArray.push("<div class='timeline-block-flag end none'><div class='link-to-bar shadow'></div><div class='timeline-block-label font shadow'>"+ timelineBlockConf.endEventName +":  " +(timelineBlockConf.endEventValue - initialTime)+ "ms</div></div>");
							htmlArray.push("<div class='timeline-block-flag middle none'><div class='link-to-bar shadow'></div><div class='timeline-block-label font shadow'>"+  timelineBlockConf.timelineName +":  " +(timelineBlockConf.endEventValue - timelineBlockConf.startEventValue)+ "ms</div></div>");
							
							
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
											"startEventValue" : data.queryNav("navigationStart"),
											"endEventName" : "fetchStart",
											"endEventValue" : data.queryNav("fetchStart")
										},
										{
											"cssClass" : "chart-dnsBlock",
											"timelineName" : "DNS",
											"startEventName" : "domainLookupStart",
											"startEventValue" : data.queryNav("domainLookupStart"),
											"endEventName" : "domainLookupEnd",
											"endEventValue" : data.queryNav("domainLookupEnd")
										},
										{
											"cssClass" : "chart-TCPBlock",
											"timelineName" : "TCP",
											"startEventName" : "connectStart",
											"startEventValue" : data.queryNav("connectStart"),
											"endEventName" : "connectEnd",
											"endEventValue" : data.queryNav("connectEnd")
										},
										{
											"cssClass" : "chart-requestBlock",
											"timelineName" : "REQ",
											"startEventName" : "requestStart",
											"startEventValue" : data.queryNav("requestStart"),
											"endEventName" : "responseStart",
											"endEventValue" : data.queryNav("responseStart")
										},
										{
											"cssClass" : "chart-responseBlock",
											"timelineName" : "REP",
											"startEventName" : "responseStart",
											"startEventValue" : data.queryNav("responseStart"),
											"endEventName" : "responseEnd",
											"endEventValue" : data.queryNav("responseEnd")
										}
									]
								},
								
								{
									values : [
										{
											"cssClass" : "chart-domReady",
											"timelineName" : "DOM READY",
											"startEventName" : "domLoading",
											"startEventValue" : data.queryNav("domLoading"),
											"endEventName" : "domContentLoadedEventStart",
											"endEventValue" : data.queryNav("domContentLoadedEventStart")
										},
										{
											"cssClass" : "chart-domReadyDuration",
											"timelineName" : "DOM READY DURATION",
											"startEventName" : "domContentLoadedEventStart",
											"startEventValue" : data.queryNav("domContentLoadedEventStart"),
											"endEventName" : "domContentLoadedEventEnd",
											"endEventValue" : data.queryNav("domContentLoadedEventEnd")
										},
										{
											"cssClass" : "chart-domReadyToLoad",
											"timelineName" : "DOM READY-LOAD",
											"startEventName" : "domContentLoadedEventEnd",
											"startEventValue" : data.queryNav("domContentLoadedEventEnd"),
											"endEventName" : "domComplete",
											"endEventValue" : data.queryNav("domComplete")
										},
										{
											"cssClass" : "chart-loadEventDuration",
											"timelineName" : "DOM LOAD DURATION",
											"startEventName" : "loadEventStart",
											"startEventValue" : data.queryNav("loadEventStart"),
											"endEventName" : "loadEventEnd",
											"endEventValue" : data.queryNav("loadEventEnd")
										}
									]
								}	
							]
						};
						
						var chartHtml = [];
						
						chartHtml.push("<div class='timeline-scale'>");
	
						chartHtml.push("</div>");
						
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
				});
				panels.push(chartPanel);
			
		
		};
		
		var onPostMessageReceived = function(e){
				//log("Receiving serialized data received from remote window: "+e.data);
				ctx.console.log("[MasterWindow]: <-- Receiving serialized data received from remote window...");
				var remoteWindowPerfData = new PerfData();
				remoteWindowPerfData.setData(e.data)
				//log("unserializedPostMessageData: ", unserializedPostMessageData);
				
				if(monitorModeOn) {
					
					dataSet.addPerfData(remoteWindowPerfData);
				}
				
				for(var i=0; i<panels.length; i++) {
					panels[i].updateData(dataSet);
					panels[i].updateView();
				}
				reloadRemoteWindow();
		
		};
		
		var startMonitorMode = function() {
			
			monitorModeOn = true;
			dataSet = PerfDataSet();
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
			windowOptions.push("width=800");
			windowOptions.push("height=680");
			windowOptions.push("fullscreen=yes"); // Working on IE only 
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
			
		//	remoteWindow.setTimeout(function(){
				log("Creating Navlet remote instance")
			
				var remoteNavlet = new Navlet();
				remoteNavlet.init(remoteWindow, 
					{
						"remote" : true,
						"masterWindow": ctx
					}
				);
		//	}, 1000);
			
			autoCloseTimer = remoteWindow.setTimeout(function(){	
						
				// Autoclose programmed if we lose connection 
				// with masterWindow (could be close by the user for instance)
				log("Connection lost - autoclosing remoteWindow");
				remoteWindow.close();	
			}, AppConfig.timers.autoCloseTimerDuration);
			
		};
		
		var initRemoteMode = function() {
			
			windowName = "RemoteWindow";
			
			log("initRemoteMode called")
			
			var serializedMessage,
				data ;
			
			var postData = function() {
				
				data = new PerfData(ctx);
				
				if(data.isReady()) {
					serializedMessage = data.serialize();
					//masterWindow.console.log("[RemoteWindow]: --> Sending serialized data: "+serializedMessage);
					log(" --> Sending serialized data...");
					masterWindow.postMessage(serializedMessage, ctx.location.href);
				}
				else {
					log("Data not ready - waiting "+ AppConfig.timers.dataReadyPollingInterval + "ms before posting again");
					setTimeout(postData,  AppConfig.timers.dataReadyPollingInterval);
				}
			};
			
			setTimeout(postData, AppConfig.timers.dataReadyPollingInterval);
			
			log("initialization done.");		
		}
		
		var disableRawOffset = function() {
				
			rawOffsetValue = true;
			document.getElementById('rawOffsetOption').setAttribute('disabled', 'disabled');
			rawValuesPanel.updateView();
		};
		
		var enableRawOffset = function() {
			
			document.getElementById('rawOffsetOption').removeAttribute('disabled');
			rawValuesPanel.updateView();
		};
			
		
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
						disableRawOffset();
						stopMonitorMode();
					}
					else {
						disableRawOffset();
						startMonitorMode();
					}
					dockPanel.updateView();
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