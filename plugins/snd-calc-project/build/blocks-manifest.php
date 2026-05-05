<?php
// This file is generated. Do not modify it manually.
return array(
	'snd-calc-project' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'snd/calc-project',
		'version' => '0.1.0',
		'title' => 'Калькулятор проекта',
		'category' => 'widgets',
		'icon' => 'calculator',
		'description' => 'Калькулятор проекта',
		'example' => array(
			'viewportWidth' => 1200
		),
		'supports' => array(
			'html' => false,
			'align' => true,
			'className' => false,
			'visibility' => false,
			'reusable' => false,
			'lock' => true
		),
		'attributes' => array(
			'align' => array(
				'type' => 'string',
				'default' => 'full'
			),
			'settings' => array(
				'type' => 'object',
				'default' => array(
					'main' => array(
						'tax' => 6,
						'hourlyRate' => 1500,
						'hoursPerDay' => 8
					),
					'perks' => array(
						'nda' => array(
							'activate' => false,
							'value' => 30
						),
						'marketing' => array(
							'activate' => false,
							'value' => 20
						),
						'quickly' => array(
							'activate' => false,
							'value' => 25
						),
						'distribution' => true
					),
					'parther' => array(
						'activate' => false,
						'value' => 10
					)
				)
			),
			'works' => array(
				'type' => 'array',
				'default' => array(
					
				)
			),
			'additionalCosts' => array(
				'type' => 'array',
				'default' => array(
					
				)
			),
			'note' => array(
				'type' => 'string',
				'default' => ''
			)
		),
		'textdomain' => 'snd-calc-project',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css',
		'style' => 'file:./style-index.css'
	)
);
