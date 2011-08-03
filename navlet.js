
(function() {

	var navlet = (function() {
		
		var supportNavigationTimingAPI;
		
		var displayNoSupportMessage = function () {
			
				alert("Your browser does not support the Navigation Timing API");
		};
		
		var displayAPIInfo = function () {
			
				alert("Your browser support the Navigation TIming API");
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