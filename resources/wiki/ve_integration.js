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
		VeExtensions_init_WellPlateEditor();
} );
}

//Initialize
mw.hook( 've.loadModules' ).add( function( addPlugin ) {
	addPlugin( function() {
		return mw.loader.using( [ 'ext.visualEditor.core', 'ext.visualEditor.mwwikitext', 'ext.visualEditor.mwtransclusion' ] )
			.then( function() {
				VeExtensions_init_WellPlateEditor();
			} );
	} );
} );

function integrateIntoVE() {

    function Tool1() {
        Tool1.super.apply( this, arguments );
    }
    OO.inheritClass( Tool1, OO.ui.Tool );
    Tool1.static.name = 'mytool1';
    Tool1.static.title = 'Tool 1';
    Tool1.prototype.onUpdateState = function () {};
    Tool1.prototype.onSelect = function () {
        //Implement me
    };

    function Tool2() {
        Tool2.super.apply( this, arguments );
    }
    OO.inheritClass( Tool2, OO.ui.Tool );
    Tool2.static.name = 'mytool2';
    Tool2.static.title = 'Tool 2';
    Tool2.prototype.onUpdateState = function () {};
    Tool2.prototype.onSelect = function () {
        //Implement me
    };

    toolbar = ve.init.target.getToolbar();
    myToolGroup = new OO.ui.ListToolGroup( toolbar, {
        title: 'My tools',
        include: [ 'mytool1', 'mytool2' ]
    } );
    ve.ui.toolFactory.register( Tool1 );
    ve.ui.toolFactory.register( Tool2 );
    toolbar.addItems( [ myToolGroup ] );
}

mw.hook( 've.activationComplete' ).add( integrateIntoVE );

function VeExtensions_init_WellPlateEditor() {
	//Create and register command
	var custom_template = [ {
		type: 'mwTransclusionBlock',
		attributes: {
			mw: {
				parts: [ {
					template: {
						target: {
							href: 'Template:ELN/Viewer/Wellplate',
							wt: 'ELN/Viewer/Wellplate'
						},
						params: {
							'file_name': {
								wt: 'wellplate_01'
							}
						}
					}
				} ]
			}
		}
	}, {
		type: '/mwTransclusionBlock'
	} ];

	ve.ui.commandRegistry.register(
		new ve.ui.Command( 'eln_viewer_wellplate', 'content', 'insert', {
			args: [ custom_template, false, true ],
			supportedSelections: [ 'linear' ]
		} )
	);

	//Create and register wikitext command
	if ( ve.ui.wikitextCommandRegistry ) {
		ve.ui.wikitextCommandRegistry.register(
			new ve.ui.Command( 'eln_viewer_wellplate', 'mwWikitext', 'wrapSelection', {
				args: [ '{{ELN/Viewer/Wellplate|', '}}', 'file_name' ],
				supportedSelections: [ 'linear' ]
			} )
		);
	}

	//Create and register tool
	function WellPlateEditor() {
		WellPlateEditor.parent.apply( this, arguments );
	}
	OO.inheritClass( WellPlateEditor, ve.ui.MWTransclusionDialogTool );

	WellPlateEditor.static.name = 'wellplate_viewer';
	WellPlateEditor.static.group = 'insert';
	WellPlateEditor.static.title = 'Wellplate';
	WellPlateEditor.static.commandName = 'eln_viewer_wellplate';
	ve.ui.toolFactory.register( WellPlateEditor );
	
	//Register keyboard shortcut
	ve.ui.triggerRegistry.register('eln_viewer_wellplate', {
        mac: new ve.ui.Trigger('cmd+shift+w'),
        pc: new ve.ui.Trigger('ctrl+shift+w')
    });
   
    //Register input sequence
	ve.ui.sequenceRegistry.register(
		new ve.ui.Sequence('wellplate_viewer_sequence', 'wellplate_viewer', '{W}', 3)
	);

}
