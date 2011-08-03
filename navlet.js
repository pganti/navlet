
(function() {

	var navlet = function() {} (
		
		var supportNavigationTimingAPI;
		
		var displayNoSupportMessage = function () {
			
				alert("Your browser does not support the Navigation TIming API");
		};
		
		var displayAPIInfo = function () {
			
				alert("Your browser does support the Navigation TIming API");
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
	);
	var supportNavigationTimingAPI = window.performance ? true : false ;
	
	if(supportNavigationTimingAPI) {
		displayAPIInfo();
	}
	else {
		();
	}
	
	var displayNoSupportMessage = function 
	

})()