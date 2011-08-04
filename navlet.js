(function() {

	var navlet = (function() {
		
		var supportNavigationTimingAPI;
		
		var displayNoSupportMessage = function () {
			
				alert("Your browser does not support the Navigation Timing API");
		};
		
		var displayAPIInfo = function () {
			
				var p = window.performance.timing;
        
        var mainContainerDiv = document.createElement("div");
        mainContainerDiv.id = "mainContainer";
        mainContainerDiv.setAttribute("style", "position:fixed;bottom:0; left:0; right:0;background-color:black;opacity:0.85;z-index:10000;");
        
        var advListDiv = document.createElement("div");
        advListDiv.setAttribute("style", "float: left; padding-left:50px;");
        advListDiv.id = "advList";
        
        var rawListDiv = document.createElement("div");
        rawListDiv.setAttribute("style", "float: left;");
        rawListDiv.id = 'rawList';
        
        var closeAnchor = document.createElement("a");
        closeAnchor.id = 'closeAnchor';
        closeAnchor.innerHTML = "close";
        closeAnchor.setAttribute("style", "position:absolute;top:0; left:0; display:block; text-decoration:underline;color: yellow; padding: 10px; cursor:pointer;");
        closeAnchor.setAttribute('onClick', 'javascript:document.getElementsByTagName("body")[0].removeChild(document.getElementById("mainContainer"))');
        
        document.getElementsByTagName('body')[0].appendChild(mainContainerDiv);
        mainContainerDiv.appendChild(advListDiv);
        mainContainerDiv.appendChild(rawListDiv);
        mainContainerDiv.appendChild(closeAnchor);
        
        var rawList = "<ul>";
        for(var key in p) {
           rawList += "<li style='color:white'><span style='font-weight: bold;'>"+key+"</span>: "+p[key] + "</li>"
        }
        rawList += "</ul>";
        
        document.getElementById('rawList').innerHTML = rawList;
        
        var advList = "<ul>";
        
        function addItemToAdvList(key, value) {
            advList += "<li style='color:white'><span style='font-weight: bold;'>"+key+"</span>: "+value + "</li>";
        }
        
        addItemToAdvList("responseStart - navigationTime", (p.responseStart - p.navigationStart));
        
        addItemToAdvList("domLoading - responseStart", (p.domLoading - p.responseStart));
        addItemToAdvList("domInteractive - responseStart", (p.domInteractive - p.responseStart));
        
        addItemToAdvList("domContentLoadedEventStart - responseStart", (p.domContentLoadedEventStart - p.responseStart));
        addItemToAdvList("domReadyEvent duration", (p.domContentLoadedEventEnd - p.domContentLoadedEventStart));
        
        addItemToAdvList("loadEventStart - responseStart", (p.loadEventStart - p.responseStart));
        addItemToAdvList("loadEvent duration", (p.loadEventEnd - p.loadEventStart));
        
        advList += "</ul>";
        
        document.getElementById('advList').innerHTML = advList;
		};
		
		return {
			init: function() {
			
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