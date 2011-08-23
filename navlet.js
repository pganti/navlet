(function() {
	
	var navlet;
	
	var minimalRealisticUnixTime = 1300000000000 ; // an arbitrary date in the past
	
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
			"PauseMonitoring" : "Pause Monitoring",
			"Expand" : "expand",
			"Collapse" : "collapse"
		},
		
		"timers": {
			"autoCloseTimerDuration" : 60000,
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
	
	var queryObject = function(dataObj, queryKey, value) {
		
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
	
	var isValidDeltaTime = function(t) {
	
		if(isSet(t) && t >=0) {
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
	
		
		query : function(queryKey) {
			
			return queryObject(this._data, queryKey) ;
		},
		
		set : function(queryKey, value) {
		
			queryObject(this._data, queryKey, value);
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
			if(isValidUnixTime(this.query('performance.timing.navigationStart')) 
				&& 
			   isValidUnixTime(this.query('performance.timing.loadEventEnd'))) {
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
			console.log(dataAsJson);
			
			return JSON.stringify(dataAsJson);
		},
			
		addPerfData : function(perfData) {
			
			if(perfData.isReady()) {
				this._set.push(perfData);
				this._aggregateData(perfData);
			}
			else {
				throw "[PerfDataSet]: Trying to add an invalid PerfData object.";
				log(perfData);
			}
		},
		
		query: function(key) {
		
			return queryObject(this._aggregatedData, key);
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
			
			if(afterCreate) {
				
				afterCreate(data);
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
					
					afterCreate = jsonConf.afterCreate;
					
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
			monitorModePause = false,
		    unsupportedFeatures = [],
		    rawOffsetValue,
		    dockPanel, rawValuesPanel, customValuesPanel, chartPanel,
			windowName = "MasterWindow",
			dataSet,
			exportWindow;
		
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
				msg += "The following list of features is not supported: "+unsupportedFeatures.join(", ")+"\n\n";
				msg += "Please use an up to date Google Chrome or IE9+.\n\n If you're using IE9, make check sure that your 'document mode' is set to 'IE9 standards' in the developer tool console (F12).\n";
				alert(msg);
				ctx.document.getElementById('navlet-loader').innerHTML = msg.replace(/\n\n/g,"<br/>");
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
					"data": data,
					"template": function(data) {
						
						var html = [];
						
						if(monitorModeOn) { // if(data.isDataCollection) {
							var monitorLabel = AppConfig.labels.StartMonitoring;
							if(!monitorModePause) {
								monitorLabel = AppConfig.labels.PauseMonitoring;
							}
							html.push("<a id='toggle-monitoring' data-global-event='toggle-monitoring' title='Click to pause monitoring of this page' class='monitoring-on navlet-button color action' href='javascript:void(0)' >" +  monitorLabel  + "</a>");
							html.push("<div class='monitor-feedback-panel'>");
							
							html.push("<a												class='navlet-button-action' 				href='javascript:void(0)'>Samples: " + dataSet.getRecordCount() + "</a>");
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
				});
				panels.push(dockPanel);
				
				rawValuesPanel = Panel().init(ctx, {
					"title" : "Navigation Timing API raw values",
					"domContext" : navletMainNode,
					"panelType" : "top-left-panel",
					"data": data,
					"template" : function(data) {
						
						var storedOffsetOption = getOffsetRawValuesOption()
						
						var rawOffsetOption = "";
						
						rawOffsetOption = "<div class='option-column'>";
						rawOffsetOption += "<input id='rawOffsetOption' data-global-event='offset-raw-values' class='action' type='checkbox' " + (rawOffsetValue ? "checked='yes'" : "" )  + " />"
						rawOffsetOption += "<label class='font' for='rawOffsetOption' >Offset raw values with navigationStart value</label>";
						
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
								
								if(!isValidDeltaTime(value)) {
									value = "NA";
									NA = " na";
								}
							}
							else {
								if(!isValidUnixTime(value)) {
									value = "NA";
									NA = " na";
								}
								else if(rawOffsetValue) {
									value = value - navStartTime;
								}
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
				});
				panels.push(customValuesPanel);
				
				chartPanel = Panel().init(ctx, {
					"title" : "Timeline representation",
					"domContext" : navletMainNode,
					"panelType" : "bottom-panel",
					"data": data,
					"layoutClass" : "bottom-panel-open",
					"afterCreate": function(data) {
					
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
						
						
						addEvent(ts, "mousemove", function(evt) {
							tc.innerHTML = Math.floor((evt.clientX-ts_pos.x) * ((data.query("performance.timing.loadEventEnd") - data.query("performance.timing.navigationStart"))/ctx.document.querySelectorAll('#bottom-panel-id .panel-content-wrap')[0].offsetWidth)) + "ms"
							tlfd.style.left = (evt.clientX-ts_pos.x) + "px";
						});
						
						if(ctx.document.querySelectorAll('#bottom-panel-id .sparkline')[0])
							sparkline(ctx.document.querySelectorAll('#bottom-panel-id .sparkline')[0]);
						
					},
					"template" : function(data) {
						
						// Forcing padding here since we have race conditions between CSS padding style and javascript reader of the offsetWidth property
						ctx.document.querySelectorAll('#bottom-panel-id .panel-content')[0].style.padding = "0 80px";
						
						var initialTime = data.query("performance.timing.navigationStart"),
							DT = data.query("performance.timing.loadEventEnd") - data.query("performance.timing.navigationStart"),
							availableWidthInPixel = ctx.document.querySelectorAll('#bottom-panel-id .panel-content-wrap')[0].offsetWidth,
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
							
							htmlArray.push("<div class='timeline-block reveal ");
							
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
								htmlArray.push("<div class='font timeline-label'>" + timelineBlockConf.timelineName + "</div>");
							}
							
							htmlArray.push("<div class='timeline-block-flag none " + widthRate + positionContextClass+ "'>");
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
				});
				panels.push(chartPanel);
			
		
		};
		
		var onPostMessageReceived = function(e){
				
				ctx.console.log("[MasterWindow]: <-- Receiving serialized data received from remote window...");
				var remoteWindowPerfData = new PerfData();
				remoteWindowPerfData.setData(e.data)
				
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
			
			if(monitorModePause) {
				
				// Navlet was previously in pause
				// Remove flag and keep existing data
				monitorModePause = false;
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
			
			if(isSet(remoteWindow)) {
				if(remoteWindow.close) {
					remoteWindow.close();
				}
				remoteWindow = null;
			}
			
			monitorModePause = true;
		};
		
		var resetMonitorMode = function() {
			
			var sampleCount = dataSet.getRecordCount();
			if(sampleCount > 0) {
				if (confirm("Are you sure you want to drop your "+sampleCount+" samples ?" )) { 
				
					dataSet.reset();
				}
			}
			
			
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
				log("Clearing - autoclosing");
				remoteWindow.clearTimeout(autoCloseTimer);
			}
			log("reloading");
			remoteWindow.location.reload();
			
			masterWindow.setTimeout(function(){
				log("Creating Navlet remote instance")
			
				var remoteNavlet = new Navlet();
				remoteNavlet.init(remoteWindow, 
					{
						"remote" : true,
						"masterWindow": ctx
					}
				);
				
				
				autoCloseTimer = remoteWindow.setTimeout(function(){	
							
					// Autoclose programmed if we lose connection 
					// with masterWindow (could be close by the user for instance)
					log("Connection lost - autoclosing remoteWindow");
					remoteWindow.close();	
				}, AppConfig.timers.autoCloseTimerDuration);
				
			}, 1000); // TODO: find a better way to handle 'reload load event' (breaking on IE without setTimeout)
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
					log("Data not ready - waiting "+ AppConfig.timers.dataReadyPollingInterval + "ms before probing data again");
					setTimeout(postData,  AppConfig.timers.dataReadyPollingInterval);
				}
			};
			
			setTimeout(postData, AppConfig.timers.dataReadyPollingInterval);
			
			log("initialization done.");		
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
						if(monitorModePause) {
							startMonitorMode();
						}
						else {
							pauseMonitorMode();
						}
					}
					else {
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
				else if(actionName == "export-monitoring-data") {
					exportData();
				}
				else if(actionName == "focus-remote-window") {
					focusRemoteWindow();
				}
				else if(actionName == "reset-monitoring") {
					resetMonitorMode();
					dockPanel.updateView();
				}
				else {
					alert("no action mapped: " + actionName)
				}
				
			}
		}
	};
	
	/**
	
		http://ejohn.org/projects/jspark/
	*/
	function sparkline(o) {
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
	
	navlet = new Navlet();
	navlet.init(window);
	
})()