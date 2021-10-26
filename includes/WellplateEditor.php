<?php

class WellplateEditor {

	public static function onBeforePageDisplay( $out ) {

		$out->addModules( 'ext.WellplateEditor.editor' );

		return true;

	}

}
