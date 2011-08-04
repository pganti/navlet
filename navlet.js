(function() {
	
	// Convenience shortcuts:
	var get = function(id) {
			return document.getElementById(id);
		},
		body = document.getElementsByTagName('body')[0],
		head = document.getElementsByTagName('head')[0],
		isSet = function(obj) {
			return typeof(obj) == "object" && obj != null;
		};
	
	
	var NavTimingProperties = [
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
		
	];
	

	var navlet = (function() {
		
		var supportNavigationTimingAPI;
		
		var displayNoSupportMessage = function () {
			
				alert("Your browser does not support the Navigation Timing API");
		};
		
		var displayAPIInfo = function () {
			
				var p = window.performance.timing;
					
				var mainContainerDiv = document.createElement("div");
				var style = [];
				mainContainerDiv.id = "navlet";
				mainContainerDiv.className = "mainContainer";
				
				mainContainerDiv.setAttribute("style", style.join(";"));
				
				var advListDiv = document.createElement("div");
				advListDiv.setAttribute("style", "float: left; padding-left:50px;");
				advListDiv.id = "advList";
				
				var rawListDiv = document.createElement("div");
				rawListDiv.setAttribute("style", "float: left;");
				rawListDiv.id = 'rawList';
				
				var closeAnchor = document.createElement("a");
				closeAnchor.id = 'closeTrigger';
				closeAnchor.innerHTML = "close";
				closeAnchor.setAttribute('onClick', 'javascript:document.getElementsByTagName("body")[0].removeChild(document.getElementById("navlet"))');
				
				body.appendChild(mainContainerDiv);
				mainContainerDiv.appendChild(advListDiv);
				mainContainerDiv.appendChild(rawListDiv);
				mainContainerDiv.appendChild(closeAnchor);
				
				var rawList = "<ul>";
				var tmpPropName ;
				for(var i=0, l=NavTimingProperties.length; i<l; i++) {
					tmpPropName = NavTimingProperties[i].name
					rawList += "<li class='entry'><span class='entry-label'>"+ tmpPropName +"</span>: "+p[tmpPropName] + "</li>"
				}
				   
				rawList += "</ul>";
				
				get('rawList').innerHTML = rawList;
				
				var advList = "<ul>";
				
				function addItemToAdvList(key, value) {
					advList += "<li class='entry'><span class='entry-label'>"+key+"</span>: "+value + "</li>";
				}
				
				addItemToAdvList("responseStart - navigationTime", (p.responseStart - p.navigationStart));
				
				addItemToAdvList("domLoading - responseStart", (p.domLoading - p.responseStart));
				addItemToAdvList("domInteractive - responseStart", (p.domInteractive - p.responseStart));
				
				addItemToAdvList("domContentLoadedEventStart - responseStart", (p.domContentLoadedEventStart - p.responseStart));
				addItemToAdvList("domReadyEvent duration", (p.domContentLoadedEventEnd - p.domContentLoadedEventStart));
				
				addItemToAdvList("loadEventStart - responseStart", (p.loadEventStart - p.responseStart));
				addItemToAdvList("loadEvent duration", (p.loadEventEnd - p.loadEventStart));
				
				advList += "</ul>";
				
				get('advList').innerHTML = advList;
		};
		
		
		
		return {
			init: function() {
				
				// Destroy previous instances:
				var dirtyNavletContainer = get("navlet");
				if(isSet(dirtyNavletContainer)) {
					body.removeChild(dirtyNavletContainer);
				}
				
				// Check for support:
				supportNavigationTimingAPI = window.performance ? true : false ;
				
				if(supportNavigationTimingAPI) {
					displayAPIInfo();
				}
				else {
					displayNoSupportMessage();
				}
			}
		}
	})();
	
	navlet.init();
	

})()