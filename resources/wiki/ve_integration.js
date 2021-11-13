//see also: https://www.mediawiki.org/wiki/VisualEditor/Gadgets/Add_a_tool

mw.loader.using( 'ext.visualEditor.desktopArticleTarget.init' ).done( function() {
	mw.libs.ve.addPlugin( function() {
		//return $.getScript('https://www.mediawiki.org/w/index.php?title=User:Me/myScript.js&action=raw&ctype=text/javascript');
		VeExtensions_init();
	} );
} );

function VeExtensions_init() {
mw.loader.using( [ 'ext.visualEditor.core', 'ext.visualEditor.mwtransclusion' ] )
	.done( function() {
		VeExtensions_create();
} );
}

//Initialize
//mw.hook( 've.loadModules' ).add( function( addPlugin ) {
//	addPlugin( function() {
//		return mw.loader.using( [ 'ext.visualEditor.core', 'ext.visualEditor.mwwikitext', 'ext.visualEditor.mwtransclusion' ] )
//			.then( function() {
//				//VeExtensions_init_WellPlateEditor();
//			} );
//	} );
//} );


var tool_groups = [{name: 'labnote', label: 'LabNote'}];
var template_tools = [
    {
	group: 'labnote', //built in: insert
        custom_group: true, 
        title: 'Wellplate',
	icon: 'table', //https://doc.wikimedia.org/oojs-ui/master/demos/?page=icons&theme=wikimediaui&direction=ltr&platform=desktop
	name: 'wellplate_viewer', 
	//command_name: 'eln_viewer_wellplate',
        sequence: '{W}',
        shortcut: 'ctrl+alt+w',
	template: { target: {href: 'Template:ELN/Viewer/Wellplate', wt: 'ELN/Viewer/Wellplate'}, params: {'file_name': {wt: 'wellplate_01'}}} 
    }
];


mw.loader.using( [ 'ext.visualEditor.mediawiki' ] ).then( function() {
	function addGroup( target ) {
                tool_groups.forEach(function (tool_group) {
		target.static.toolbarGroups.push( {
			name: tool_group.name,
			label: tool_group.label,
			type: 'list',
			indicator: 'down',
			include: [ { group: tool_group.name } ],
		} );
		} );
	}
	for ( var n in ve.init.mw.targetFactory.registry ) {
		addGroup( ve.init.mw.targetFactory.lookup( n ) );
	}
	ve.init.mw.targetFactory.on( 'register', function ( name, target ) {
		addGroup( target );
	} );
} );

function VeExtensions_create() {
    template_tools.forEach(function (template_tool) {
        //Create and register command
        template_tool.command_name = template_tool.name + '_command';

	var custom_template = [ {type: 'mwTransclusionBlock', attributes: {mw: {parts: [ {template: template_tool.template} ]}}}, {type: '/mwTransclusionBlock'} ];

	ve.ui.commandRegistry.register(
		new ve.ui.Command( template_tool.command_name, 'content', 'insert', {
			args: [ custom_template, false, true ],
			supportedSelections: [ 'linear' ]
		} )
	);

	//Create and register wikitext command (only for source editor
	//if ( ve.ui.wikitextCommandRegistry ) {
	//	ve.ui.wikitextCommandRegistry.register(
	//		new ve.ui.Command( 'eln_viewer_wellplate', 'mwWikitext', 'wrapSelection', {
	//			args: [ '{{ELN/Viewer/Wellplate|', '}}', 'file_name' ],
	//			supportedSelections: [ 'linear' ]
	//		} )
	//	);
	//}

	//Create and register tool
	function CustomTool() {
		CustomTool.parent.apply( this, arguments );
	}
	OO.inheritClass( CustomTool, ve.ui.MWTransclusionDialogTool );

	CustomTool.static.name =  template_tool.name;
	CustomTool.static.group =  template_tool.group;
        if (template_tool.custom_group){
		CustomTool.static.autoAddToCatchall = false;
		CustomTool.static.autoAddToGroup = true;
	}
	CustomTool.static.title =  template_tool.title;
	CustomTool.static.icon =  template_tool.icon;
	CustomTool.static.commandName = template_tool.command_name;
	ve.ui.toolFactory.register( CustomTool );
	console.log(template_tool.shortcut.replace('ctrl','cmd'));
	//Register keyboard shortcut
	ve.ui.triggerRegistry.register(template_tool.command_name, {
        	mac: new ve.ui.Trigger(template_tool.shortcut.replace('ctrl','cmd')),
        	pc: new ve.ui.Trigger(template_tool.shortcut)
        });
   
        //Register input sequence
        if (template_tool.sequence != null){
		ve.ui.sequenceRegistry.register(new ve.ui.Sequence(template_tool.name + '_sequence', template_tool.command_name, template_tool.sequence, template_tool.sequence.length));
        }
    });
}
