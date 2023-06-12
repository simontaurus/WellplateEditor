/*@nomin*/
/* 
DEV: MediaWiki:WellplateEditor.js
REL: resources/WellplateEditor.js
hint: ResourceLoader minifier does not ES6 yet, therefore skip minification  with "nomin" (see https://phabricator.wikimedia.org/T255556)
*/

/*$(document).ready(function() {
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
};*/

$(document).ready(function() {
	if( $('.WellplateEditor').length === 0) return; //only on pages with a WellplateEditor-div
	//this doesn't work because classes like "Editor" loaded as module are not visible on global level (e.g. window.Editor)
	//mw.loader.using( 'ext.WellplateEditor', function () {
	//mw.loader.using( [ 'ext.WellplateEditor' ], function ( require ) {
    //	var Editor = require( '.dist/editor.min.js' );
    //	Editor.init();
	//} );
	const resource_path = "/w/extensions/WellplateEditor/resources/";
	mw.loader.load( resource_path + "dist/ui-styles.css", 'text/css' );
	mw.loader.load( resource_path + "dist/editor-styles.css", 'text/css' );
	mw.loader.load( resource_path + "dist/shared-styles.css", 'text/css' );
	mw.loader.load( resource_path + "dist/analyzer-styles.css", 'text/css' );
	$.when(
	    $.getScript( resource_path + "dependencies/papaparse.min.js" ),
	    $.getScript( resource_path + "dependencies/jszip.min.js" ),
	    $.getScript( resource_path + "dist/ui.min.js" ),
	    $.getScript( resource_path + "dist/shared.min.js" ),
	    $.getScript( resource_path + "dist/editor.min.js" ),
	    $.getScript( resource_path + "dist/analyzer.min.js" ),
	    $.getScript("https://repolab.github.io/steganography.js/build/steganography.js"),
	    $.getScript("https://cburgmer.github.io/rasterizeHTML.js/rasterizeHTML.allinone.js"),
	    mw.loader.using('oojs-ui-core'),
	    $.Deferred(function( deferred ){
	        $( deferred.resolve );
    	})
	).done(function(){
	    const debug = true;
        if (debug) console.log("WellPlateEditor init");
	    
	    $('.WellplateEditor').each(function() {
	    	const editorName = 'wellplate';
            $element = $(this);
			const config = $element.data('config') ? $element.data('config') : {};

        	searchParams = new URLSearchParams(window.location.search);
        	var fileName = "";
        	var urlLoaded = false;
        	if (searchParams.has('fileName')) {
        		fileName = searchParams.get('fileName');
        		urlLoaded = true;
        	}
            else fileName = config.file_title ? config.file_title : $element.text().split(';')[0];
            
            const fileType = fileName.split('.')[fileName.split('.').length - 1];
            const fileDisplayName = config.file_label ? config.file_label : fileName.replace(fileType, "");
            const filePageName = "File:" + fileName;
            const filePage = "/wiki/" + filePageName;
            const fileUrl = "/wiki/Special:Redirect/file/" + fileName;
            const options = {format: fileType, data: 'embedded'};
            
            $element.text("");
            $element.show();
	    
            const uid = (performance.now().toString(36) + Math.random().toString(36)).replace(/\./g, "");
            const element_img_box_html = `
            <div id="${editorName}-img-box-${uid}">
              <div align="right">
                <span class="mw-${editorName}">
                  <span class="mw-editsection-bracket">[</span>
                  <a id="${editorName}-edit-link-${uid}" href="javascript:void(0)">Edit</a>
                  <span class="mw-editsection-bracket">]</span>
                </span>
              </div>
              <div id="${editorName}-placeholder-${uid}" class="DrawioEditorInfoBox" style="display:none;"><b>${fileDisplayName}</b><br>empty ${editorName}</div>
            </div>`;
            const element_img_html = `
            <a id="${editorName}-img-href-${uid}" href="${filePage}">
              <img id="${editorName}-img-${uid}" src="${fileUrl}" title="${fileName}" alt="${fileName}" style="height: auto; width: 100%; max-width: 500px;">
            </a>`;
            const element_img_svg = `
            <a id="${editorName}-img-href-${uid}" href="${filePage}">
              <div id="${editorName}-img-${uid}" style="height: auto; width: 100%;">
            </a>`;
            const element_editor_html = ` 
            <div id="${editorName}-editor-box-${uid}" style="display:none;">
              <div id="${editorName}-editor-buttons-${uid}" class="${editorName}-editor-buttons"></div>
            </div>`;

            $element.append(element_img_box_html);
            $element.append(element_editor_html);
            //$element.append(`<div id="${editorName}-html-out-${uid}"></div>`);
            //$element.append(`<div id="${editorName}-canvas-out-${uid}"><canvas id="${editorName}-canvas-out-${uid}-canvas" width="800" height="1600"></canvas></div>`);
            //$element.append(`<div id="${editorName}-img-out-${uid}"></div>`);
            
            var file_exists = false;
            var editor_requested = false;
            var editor_ready = false;
            var svg = "";
            var dataString = "";
            //test if file exists
            $.getJSON(`/w/api.php?action=query&prop=revisions&titles=${filePageName}&rvprop=content&formatversion=2&format=json`, function(data) {
                if (data.query.pages[0].hasOwnProperty("missing") && data.query.pages[0].missing === true) {
                    if (debug) console.log("File does not exist");
                    $(`#${editorName}-placeholder-${uid}`).show();
                } else {
                    //fetch file
                    if (options.format === 'png' && options.data === 'embedded') {
                    $(`#${editorName}-img-box-${uid}`).append(element_img_html);
                    $(`#${editorName}-img-${uid}`)[0].onload = function (){ 
                    	if (debug) console.log("Image loaded");
                    		dataString = steg.decode($(`#${editorName}-img-${uid}`)[0]);
                    		if (debug) console.log("Embedded data: " + dataString);
                    		file_exists = true;
                    };
                    }
                    if (options.format === 'svg' && options.data === 'embedded'){
		                	$.ajax({
		                        url: fileUrl,
		                        dataType: "text",
		                        success: function(data) {
		                        	//$(`#${editorName}-img-box-${uid}`).append(element_img_html);
		                        	$(`#${editorName}-img-box-${uid}`).append(element_img_svg);

		                            if (debug) console.log("Load: " + data);
		                            svg = data;
		                            $(`#${editorName}-img-${uid}`).html(svg);
		                            //$(`#${editorName}-img-${uid}`)[0].onload = function (){ 
										//var svg_element = $(`#${editorName}-img-${uid}`).find('svg')[0];
										//var bbox = svg_element.firstElementChild.getBBox();
										//svg_element.setAttribute("height", bbox.height + "px");
										var scrollHeight = $(`#${editorName}-img-${uid}`).find('div')[0].scrollHeight;
        								$(`#${editorName}-img-${uid}`).css("height",scrollHeight + "px");
									//};
		                            dataString = WellplateEditor_getDataFromSvg(svg);
                    				if (debug) console.log("Embedded data: " + dataString);
		                            file_exists = true;
		                        },
		                        error: function(data) {
		                            if (debug) console.log("Error while fetching file: " + data);
		                            $(`#svgedit-placeholder-${uid}`).show();
		                        }
		                    });
                    }
                }
            });

            var save_button = new OO.ui.ButtonWidget({
                label: 'Save'
            });
            var close_button = new OO.ui.ButtonWidget({
                label: 'Close'
            });
            var test_button = new OO.ui.ButtonWidget({
                label: 'Test'
            });
            $(`#${editorName}-editor-buttons-${uid}`).append(save_button.$element);
            $(`#${editorName}-editor-buttons-${uid}`).append(close_button.$element);
            //$(`#${editorName}-editor-buttons-${uid}`).append(test_button.$element);
            $(`#${editorName}-editor-buttons-${uid}`).append('<a class="external text" rel="nofollow" target="_blank" href="https://sourceforge.net/p/plateeditor/wiki/Quick%20Tour/">Tutorial</a>');
            
            const $editor = $(`
            <div id="${editorName}-editor-${uid}" class="${editorName}-editor">
	            <div id="Console" class="LinkCtrl_Tab LinkCtrl_Round" style="padding: 0.3em"></div>
				<div id="WellplateEditorContainer">
					<div id="Editor_Popup" class="Popup"></div>
					<div id="Editor_Menu" style="float: left; width: 23em; max-height: 85vh; overflow: auto"></div>
					<div id="Editor_Main" style="margin-left: 24em; max-height: 85vh; overflow: auto"></div>
				</div>
				<div id="WellplateViewer"></div>
			</div>
			`);
			
			var wpe = null;
			$(`#${editorName}-edit-link-${uid}`).on('click', function() {
                $(`#${editorName}-img-box-${uid}`).hide();
                editor_requested = true;
                $(`#${editorName}-editor-box-${uid}`).append($editor);
                $(`#${editorName}-editor-box-${uid}`).show();
                
                wpe = Editor.init();
                
                if (file_exists) {
	                var loadedData;
					try {loadedData = JSON.parse(dataString)} catch(error) {wpe.Console.log({Message: "Unable to load the layout. <i>" + error + "</i>", Gravity: "Error"}); }
					if (debug) console.log(loadedData);
		    		var plate = loadedData[0];
					var areas = loadedData[1];
					wpe.loadData(plate, areas);
                }
            });
            
            test_button.on('click', function() {
            	//const html = WellplateEditor_getHtml(wpe);
            	//$(`#${editorName}-html-out-${uid}`).html(html);
            	//var canvas = document.getElementById(`${editorName}-canvas-out-${uid}-canvas`);
        		//rasterizeHTML.drawHTML(html,canvas);
        		svg =WellplateEditor_getSvg(wpe);
        		console.log(svg);
        		$(`#${editorName}-html-out-${uid}`).html(svg);
            });
		
			//data = '[{"Rows":8,"Cols":12,"KeepSelected":true,"Digits":1,"Layers":[[]]},[{"Name":"a","Color":"lightskyblue","Type":"Sample","Replicates":1,"Direction":"Horizontal","Priority":"Row","Tags":[{"Layer":0,"Wells":[{"Index":0,"RangeIndex":1},{"Index":1,"RangeIndex":1},{"Index":2,"RangeIndex":1},{"Index":12,"RangeIndex":1},{"Index":13,"RangeIndex":1},{"Index":14,"RangeIndex":1},{"Index":24,"RangeIndex":1},{"Index":25,"RangeIndex":1},{"Index":26,"RangeIndex":1}]}]}]]';
	        save_button.on('click', function() {
                dataString = WellplateEditor_getData(wpe);
                
                if (debug) console.log("Save: " + dataString);
                if (debug) console.log("Uploading " + fileName);
                if (options.format === 'png' && options.data === 'embedded'){
                	const img = WellplateEditor_getImage(wpe);
	                const temp_img = document.createElement('img');
	            	temp_img.src = img;
	            	temp_img.onload = function (){  
		            	const cap = steg.getHidingCapacity(temp_img);
		            	if(debug) console.log("Data/Cap = " + dataString.length + "/" + cap);
		            	const dataUrl = steg.encode(dataString, img);
		            	//WellplateEditor_downloadPromt("Wellplate.png", dataUrl.replace(/^data:image\/[^;]/, 'data:application/octet-stream'));
		            	//WellplateEditor_uploadBlob("WellplateEditorTest.png", WellplateEditor_dataURItoBlob(dataUrl), "Created with WellPlatEditor", "");
	                	const blob = WellplateEditor_dataURItoBlob(dataUrl);
	                	WellplateEditor_uploadBlob(blob, fileName, "", "Created with WellPlateEditor", debug, fileDisplayName);
	            	};
                }
                if (options.format === 'svg' && options.data === 'embedded'){
                	svg = WellplateEditor_getSvg(wpe);
        			if (debug) console.log(svg);
        			const blob = new Blob([svg], {type: 'image/svg+xml'});
        			WellplateEditor_uploadBlob(blob, fileName, "", "Created with WellPlateEditor", debug, fileDisplayName);
                }
                file_exists = true;
            });
            
            close_button.on('click', function() {
            	wpe.reset();
                $editor.remove();
                editor_ready = false;
                $(`#${editorName}-editor-box-${uid}`).hide();
                $(`#${editorName}-img-box-${uid}`).show();
                //force reload image
                //const img_element = `<img id="${editorName}-img-${uid}" src="${fileUrl}?ts=${new Date().getTime()}" title="${fileName}" alt="${fileName}" style="height: auto; width: 100%; max-width: 500px;">`;
                //$(`#${editorName}-img-href-${uid}`).append(img_element);
                if (file_exists) {
                    $(`#${editorName}-placeholder-${uid}`).hide();
                    $(`#${editorName}-img-${uid}`).remove(); //prevent duplicates

                    if (options.format === 'png'){
                    	$(`#${editorName}-img-box-${uid}`).append(element_img_html);
                    	//force reload image
                    	$(`#${editorName}-img-${uid}`).attr('src', `${fileUrl}?ts=${new Date().getTime()}" title="${fileName}`);
                    }
                    if (options.format === 'svg') {
                    	$(`#${editorName}-img-box-${uid}`).append(element_img_svg);
                    	$(`#${editorName}-img-${uid}`).html(svg);
                    	var scrollHeight = $(`#${editorName}-img-${uid}`).find('div')[0].scrollHeight;
        				$(`#${editorName}-img-${uid}`).css("height",scrollHeight + "px");
                    }

                } else {
                    //nothing to do here
                }
                if (debug) console.log("Close ");
            });
            
	    	$("span[title='Save the current layout']").click(function() {
				if(debug) console.log( "Save data clicked" );
			});
			$("span[title='Load a layout from file']").click(function() {
				if(debug) console.log( "Load data clicked" );
			});
	    });
	});
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
	    //console.log(save);
	    return save;
}

function WellplateEditor_getHtml(wpe){
	    //save data
	    var save = "";
		var hasLayer = false;
		wpe.Plate.Layers.forEach(function(l, index) { //Save the areas
			//if(index > 0) {areas += ","}
			save += Layer.getAsHTML(l).HTML;
			hasLayer = true;
		});
		//save += areas + "]]";
		//if(hasLayer === false && wpe.Plate === undefined) {wpe.Console.log({Message: "Nothing to save", Gravity: "Warning"});} //No area + no plate = nothing to save
		//Form.download(save, {DataType: "text/json;charset=utf-8", FileName: "Layout.save"});
		save = save.replaceAll("<br>","<br/>"); //fix tags
	    //console.log(save);
	    return save;
}

function WellplateEditor_getSvg(wpe){
	var json = WellplateEditor_getData(wpe);
	json = btoa(json); //base64 encoding
	//json = json.replaceAll("<","&lt;");
	//json = json.replaceAll(">","&gt;");
	//json = json.replaceAll("&","&amp;");
	//json = json.replaceAll('"',"&quot;");
	var svg = `<svg width='100%' height='100%' xmlns="http://www.w3.org/2000/svg" content-type="wellplatejs-json-base64" content="${json}">
		<g>
    	<foreignObject  width='100%' height='100%'>
			<div xmlns="http://www.w3.org/1999/xhtml">
			${WellplateEditor_getHtml(wpe)}
			</div>
		</foreignObject>
		</g>
	</svg>`
	return svg;
}

function WellplateEditor_getDataFromSvg(svg){
	var json = $(svg).attr('content');
	json = atob(json); //base64 encoding
	//json = json.replaceAll("&lt;","<");
	//json = json.replaceAll("&gt;",">");
	//json = json.replaceAll("&amp;","&");
	//json = json.replaceAll("&quot;",'"');
	return json;
}

function WellplateEditor_getImage(wpe){
	//save image
	var l = wpe.Plate.Layers[0];
	var canvas = document.createElement("canvas"); //Create an empty canvas element
	var scale = 2;
	canvas.height = l.Grid.height*scale; //Define its size to match that of the Grid
	canvas.width = l.Grid.width*scale;
	var ctx = canvas.getContext("2d");
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, canvas.width, canvas.height); //Apply a white background first, to prevent transparent pixels from turning black
	ctx.drawImage(l.Grid, 0, 0, l.Grid.width*scale, l.Grid.height*scale); //Draw the grid and contents, drop the highlight
	ctx.drawImage(l.Contents, 0, 0, l.Contents.width*scale, l.Contents.height*scale);
	var img = canvas.toDataURL('image/png');
	//console.log(img);
	return img;
}

function WellplateEditor_downloadPromt(reportName, dataUrl) {
    var link = document.createElement('a');
    link.href = dataUrl;//window.URL.createObjectURL(blob);
    var fileName = reportName;
    link.download = fileName;
    link.click();
}

//from https://stackoverflow.com/questions/12168909/blob-from-dataurl
function WellplateEditor_dataURItoBlob(dataURI) {
  // convert base64 to raw binary data held in a string
  // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
  var byteString = atob(dataURI.split(',')[1]);

  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]

  // write the bytes of the string to an ArrayBuffer
  var ab = new ArrayBuffer(byteString.length);

  // create a view into the buffer
  var ia = new Uint8Array(ab);

  // set the bytes of the buffer to the correct values
  for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
  }

  // write the ArrayBuffer to a blob, and you're done
  var blob = new Blob([ab], {type: mimeString});
  return blob;

}

function WellplateEditor_uploadBlob(blob, fileName, text, comment, debug = false, fileLabel) {
                	let file = new File([blob], fileName, {
                    	type: blob.type,
                    	lastModified: new Date().getTime()
                	});
                	let container = new DataTransfer();
                	container.items.add(file);
                	fileInput = $('<input/>').attr('type', 'file');
                	fileInput.files = container.files;
                	var param = {
                    	filename: fileName,
                    	comment: comment,
                    	text: text,
                    	format: 'json',
                    	ignorewarnings: true
                	};
	                var api = new mw.Api();
	                api.upload(blob, param).done(function(data) {
	                    if (debug) console.log(data.upload.filename + ' has sucessfully uploaded.');
	                    file_exists = true;
			    mw.hook( 'wellplateeditor.file.uploaded' ).fire({exists: false, name: fileName, label: fileLabel});
	                    mw.notify('Saved', {
	                        type: 'success'
	                    });
	                    return {result: 'success', msg: 'Saved'}; 
	                }).fail(function(retStatus, data) {
	                    if (debug) console.log(data);
	                    if (data.upload.result === 'Success') {
                                mw.hook( 'wellplateeditor.file.uploaded' ).fire({exists: true, name: fileName, label: fileLabel});
	                    	mw.notify('Saved', {
	                        	type: 'success'
	                    	});
	                    	return {result: 'success', msg: 'Saved'}; 
	                    }
	                    else {
	                    	mw.notify('An error occured while saving. \nPlease save your work on the local disk.', {
	                        	title: 'Error',
	                        	type: 'error'
	                    	});
	                    	return {result: 'error', msg: 'An error occured while saving. \nPlease save your work on the local disk.'}; 
	                    }
	                });
}
