{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 8,
			"minor" : 0,
			"revision" : 5,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"classnamespace" : "box",
		"rect" : [ 35.0, 79.0, 892.0, 687.0 ],
		"bglocked" : 0,
		"openinpresentation" : 1,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "",
		"subpatcher_template" : "",
		"boxes" : [ 			{
				"box" : 				{
					"id" : "obj-41",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 19.5, 111.0, 85.0, 22.0 ],
					"text" : "prepend notes"
				}

			}
, 			{
				"box" : 				{
					"comment" : "",
					"id" : "obj-40",
					"index" : 0,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 19.5, 62.0, 30.0, 30.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-39",
					"justification" : 1,
					"linecolor" : [ 0.627450980392157, 0.627450980392157, 0.627450980392157, 1.0 ],
					"maxclass" : "live.line",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 19.5, 168.666666701436043, 670.0, 5.0 ],
					"presentation" : 1,
					"presentation_rect" : [ -3.5, 94.0, 670.0, 5.0 ]
				}

			}
, 			{
				"box" : 				{
					"alpha" : 0.329999999999999,
					"autofit" : 1,
					"embed" : 1,
					"forceaspect" : 1,
					"id" : "obj-38",
					"ignoreclick" : 1,
					"maxclass" : "fpic",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "jit_matrix" ],
					"patching_rect" : [ 691.5, 259.0, 12.0, 10.0 ],
					"pic" : "/Users/skarukas/Box Sync/Programming/Max Patches/GitHub/spectralize/zoom-icon.svg",
					"presentation" : 1,
					"presentation_rect" : [ 666.5, 94.0, 12.0, 10.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-37",
					"justification" : 2,
					"linecolor" : [ 0.627450980392157, 0.627450980392157, 0.627450980392157, 1.0 ],
					"maxclass" : "live.line",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 684.5, 165.333333402872086, 5.0, 11.666666597127914 ],
					"presentation" : 1,
					"presentation_rect" : [ 661.5, 90.666666701436043, 5.0, 11.666666597127914 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-36",
					"linecolor" : [ 0.627450980392157, 0.627450980392157, 0.627450980392157, 1.0 ],
					"maxclass" : "live.line",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 19.5, 165.5, 5.0, 11.5 ],
					"presentation" : 1,
					"presentation_rect" : [ -3.5, 90.833333298563957, 5.0, 11.5 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-31",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 635.5, 127.0, 59.0, 22.0 ],
					"text" : "set $1 Hz"
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 8.0,
					"id" : "obj-27",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 19.5, 158.666666701436043, 31.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ -3.5, 94.0, 31.0, 15.0 ],
					"text" : "0 Hz",
					"textcolor" : [ 0.607843137254902, 0.607843137254902, 0.607843137254902, 1.0 ]
				}

			}
, 			{
				"box" : 				{
					"fontsize" : 8.0,
					"id" : "obj-26",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 635.5, 158.666666701436043, 54.0, 15.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 612.5, 94.0, 54.0, 15.0 ],
					"text" : "13000 Hz",
					"textcolor" : [ 0.607843137254902, 0.607843137254902, 0.607843137254902, 1.0 ],
					"textjustification" : 2
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-10",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 116.0, 111.0, 107.0, 22.0 ],
					"text" : "prepend maxvalue"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-9",
					"maxclass" : "newobj",
					"numinlets" : 6,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 635.5, 70.0, 137.0, 22.0 ],
					"text" : "scale 127 0 1000 13000"
				}

			}
, 			{
				"box" : 				{
					"bgcolor" : [ 0.0, 0.0, 0.0, 0.0 ],
					"elementcolor" : [ 0.364705882352941, 0.364705882352941, 0.364705882352941, 0.15 ],
					"id" : "obj-8",
					"knobcolor" : [ 0.47843137254902, 0.47843137254902, 0.47843137254902, 1.0 ],
					"knobshape" : 2,
					"maxclass" : "slider",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 691.5, 168.666666701436043, 13.0, 92.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 666.5, 0.0, 13.0, 96.666666805744171 ],
					"thickness" : 28.0
				}

			}
, 			{
				"box" : 				{
					"border" : 0,
					"filename" : "draw-spectrum.js",
					"id" : "obj-3",
					"maxclass" : "jsui",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 19.5, 177.0, 670.0, 92.0 ],
					"presentation" : 1,
					"presentation_rect" : [ -3.5, 0.0, 670.0, 92.0 ]
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-3", 0 ],
					"midpoints" : [ 125.5, 146.5, 29.0, 146.5 ],
					"source" : [ "obj-10", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-26", 0 ],
					"source" : [ "obj-31", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-41", 0 ],
					"source" : [ "obj-40", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-3", 0 ],
					"source" : [ "obj-41", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-9", 0 ],
					"midpoints" : [ 698.5, 287.666666701436043, 784.5, 287.666666701436043, 784.5, 51.0, 645.0, 51.0 ],
					"source" : [ "obj-8", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-10", 0 ],
					"midpoints" : [ 645.0, 101.0, 125.5, 101.0 ],
					"order" : 1,
					"source" : [ "obj-9", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-31", 0 ],
					"order" : 0,
					"source" : [ "obj-9", 0 ]
				}

			}
 ],
		"dependency_cache" : [ 			{
				"name" : "draw-spectrum.js",
				"bootpath" : "~/Downloads/spectralize-feab3969a0df2ad7013c7e2a0d63b2f313f6f7f8",
				"patcherrelativepath" : ".",
				"type" : "TEXT",
				"implicit" : 1
			}
, 			{
				"name" : "zoom-icon.svg",
				"bootpath" : "~/Box Sync/Programming/Max Patches/GitHub/spectralize",
				"patcherrelativepath" : "../../Box Sync/Programming/Max Patches/GitHub/spectralize",
				"type" : "svg",
				"implicit" : 1
			}
 ],
		"autosave" : 0
	}

}
