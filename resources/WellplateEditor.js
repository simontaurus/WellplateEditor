$(document).ready(function() {
	if( $('.WellplateViewer').length === 0) return; //only on pages with a WellplateEditor-div
	$('.WellplateViewer').each(function(i) {
		var context = {};
		context.targetElement = $(this);
		context.targetPage = context.targetElement.text();
		context.targetElement.text("");
		context.targetElement.append( $( '<p><a href="/w/index.php?title=ELN/Editor/Wellplate&targetPage=' + context.targetPage + '">Open Editor</a></p>' ) );
		$.getJSON("/w/api.php?action=query&prop=revisions&titles=" + context.targetPage + "&rvprop=content&formatversion=2&format=json", WellplateViewer_displayImage(context));	
	});
});

var WellplateViewer_displayImage = function(context) {
    return function(data) {
			if (data.query.pages[0].hasOwnProperty("missing") && data.query.pages[0].missing === true) {
				console.log("Page does not exist");
		    }
			else {
				console.log("Page exists:");
				console.log(data.query.pages[0].revisions[0].content);
				var content = data.query.pages[0].revisions[0].content;
				//wpe.loadPreview(content);
				var loadedData;
				try {loadedData = JSON.parse(content)} catch(error) { $(this).append( $("<p>Unable to load the layout. <i>" + error + "</i></p>")) }
				console.log(loadedData);
	    		console.log(loadedData[2][0].img);
	    		context.targetElement.append( $( '<p><img src="'+loadedData[2][0].img+'"/></p>' ) );
			}
    };
};

$(document).ready(function() {
	if( $('#WellplateEditor').length === 0) return; //only on pages with a WellplateEditor-div
	//this doesn't work because classes like "Editor" loaded as module are not visible on global level (e.g. window.Editor)
	//mw.loader.using( 'ext.WellplateEditor', function () {
	//mw.loader.using( [ 'ext.WellplateEditor' ], function ( require ) {
    //	var Editor = require( '.dist/editor.min.js' );
    //	Editor.init();
	//} );
	const resource_path = "/w/extensions/WellplateEditor/resources/";
	//$.when(
	    //$.getScript( resource_path + "dependencies/papaparse.min.js" ),
	    //$.getScript( resource_path + "dependencies/jszip.min.js" ),
	    //$.getScript( resource_path + "dist/ui.min.js" ),
	    //$.getScript( resource_path + "dist/shared.min.js" ),
	    //$.getScript( resource_path + "dist/editor.min.js" ),
	    //$.getScript( resource_path + "dist/analyzer.min.js" ),
	    //$.Deferred(function( deferred ){
	    //    $( deferred.resolve );
    	//})
	//).done(function(){
	    
	    var wpe = Editor.init();
	    
	    searchParams = new URLSearchParams(window.location.search);
        var targetPage = "";
		if (searchParams.has('targetPage')) targetPage = searchParams.get('targetPage');
	    
	    $("span[title='Save the current layout']").click(function() {
	    	if (targetPage === "") return;
			console.log( "Save data" );
			data = WellplateEditor_getData(wpe);
			img = WellplateEditor_getImage(wpe);
			dataObject = JSON.parse(data);
			dataObject.push([{"img":img}]);
			data = JSON.stringify(dataObject);
			var params = {
				action: 'edit',
				title: targetPage,
				text: data,
				format: 'json'
			};
			var api = new mw.Api();
			api.postWithToken( 'csrf', params ).done( function ( data ) {
				console.log( 'Saved!' );
			});
		});
		$("span[title='Load a layout from file']").click(function() {
			console.log( "Load data clicked" );
		});
		
		$.getJSON("/w/api.php?action=query&prop=revisions&titles=" + targetPage + "&rvprop=content&formatversion=2&format=json", function(data) {
			if (data.query.pages[0].hasOwnProperty("missing") && data.query.pages[0].missing === true) {
				console.log("Page does not exist");
		    }
			else {
				console.log("Page exists:");
				console.log(data.query.pages[0].revisions[0].content);
				var content = data.query.pages[0].revisions[0].content;
				//wpe.loadPreview(content);
				var loadedData;
				try {loadedData = JSON.parse(content)} catch(error) {wpe.Console.log({Message: "Unable to load the layout. <i>" + error + "</i>", Gravity: "Error"}); }
				console.log(loadedData);
	    		var plate = loadedData[0];
				var areas = loadedData[1];
				wpe.loadData(plate, areas);
	    		//console.log(wpe);
	    		//console.log(loadedData[2][0].img);
	    		//$( "#WellplateViewer" ).append( $( '<img src="'+loadedData[2][0].img+'"/>' ) );
			}
		});
		
		//data = '[{"Rows":8,"Cols":12,"KeepSelected":true,"Digits":1,"Layers":[[]]},[{"Name":"a","Color":"lightskyblue","Type":"Sample","Replicates":1,"Direction":"Horizontal","Priority":"Row","Tags":[{"Layer":0,"Wells":[{"Index":0,"RangeIndex":1},{"Index":1,"RangeIndex":1},{"Index":2,"RangeIndex":1},{"Index":12,"RangeIndex":1},{"Index":13,"RangeIndex":1},{"Index":14,"RangeIndex":1},{"Index":24,"RangeIndex":1},{"Index":25,"RangeIndex":1},{"Index":26,"RangeIndex":1}]}]}]]';
	    

	    
	//});

});

function WellplateEditor_getData(wpe){
	    //save data
	    var save = "["; //Layout is saved as a JSON.stringified array of 2 elts, a plate and areas definitions
		save += Plate.save(wpe.Plate) + ",";
		areas = "[";
		var hasArea = false;
		wpe.Tables.Areas.Array.forEach(function(a, index) { //Save the areas
			if(index > 0) {areas += ","}
			areas += Area.save(a);
			hasArea = true;
		});
		save += areas + "]]";
		if(hasArea === false && wpe.Plate === undefined) {wpe.Console.log({Message: "Nothing to save", Gravity: "Warning"});} //No area + no plate = nothing to save
		//Form.download(save, {DataType: "text/json;charset=utf-8", FileName: "Layout.save"});
	    console.log(save);
	    return save;
}

function WellplateEditor_getImage(wpe){
	//save image
	var l = wpe.Plate.Layers[0];
	var canvas = document.createElement("canvas"); //Create an empty canvas element
	var scale = 1;
	canvas.height = l.Grid.height*scale; //Define its size to match that of the Grid
	canvas.width = l.Grid.width*scale;
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height); //Apply a white background first, to prevent transparent pixels from turning black
	ctx.drawImage(l.Grid, 0, 0, l.Grid.width*scale, l.Grid.height*scale); //Draw the grid and contents, drop the highlight
	ctx.drawImage(l.Contents, 0, 0, l.Contents.width*scale, l.Contents.height*scale);
	var img = canvas.toDataURL('image/png');
	console.log(img);
	return img;
	    
}
