import { useEffect, useMemo, useState } from '@wordpress/element';
import {
	Button,
	Notice,
	Spinner,
	TextControl,
	ToggleControl,
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from '@wordpress/components';
import { DataForm as WPDataForm } from '@wordpress/dataviews/wp';
import { __, _n, sprintf } from '@wordpress/i18n';
import { apiPath, config, createEmptyCalculator, formatMoney, formatPrice, normalizeCurrency, restFetch } from '../shared';

function getSettingsFields( currency ) {
	return [
		{ id: 'title', label: __( 'Title', 'phpavel-dev-calculators' ), type: 'text' },
	{
		id: 'status',
		label: __( 'Status', 'phpavel-dev-calculators' ),
		type: 'text',
		Edit: 'select',
		elements: [
			{ label: __( 'Draft', 'phpavel-dev-calculators' ), value: 'draft' },
			{ label: __( 'Active', 'phpavel-dev-calculators' ), value: 'active' },
			{ label: __( 'Archived', 'phpavel-dev-calculators' ), value: 'archived' },
		],
	},
	{
		id: 'note',
		label: __( 'Project note', 'phpavel-dev-calculators' ),
		type: 'text',
		Edit: {
			control: 'textarea',
			rows: 4,
		},
	},
	{
		id: 'noteSummary',
		label: __( 'Project note', 'phpavel-dev-calculators' ),
		type: 'text',
		readOnly: true,
		render: ( { item } ) => {
			const lines = String( item?.note || '' )
				.split( /\r?\n/ )
				.filter( ( line ) => line.trim() !== '' )
				.slice( 0, 2 );
			const hasContent = lines.length > 0;

			return (
				<span className="phpavel-dev-calculators-note-summary">
					{ hasContent ? (
						lines.map( ( line, index ) => <span key={ index }>{ line }</span> )
					) : (
						<span>{ __( 'No note', 'phpavel-dev-calculators' ) }</span>
					) }
				</span>
			);
		},
	},
	{ id: 'currency', label: __( 'Currency', 'phpavel-dev-calculators' ), type: 'text' },
	{
		id: 'hourlyRate',
		label: sprintf( __( 'Hourly rate, %s/hour', 'phpavel-dev-calculators' ), currency ),
		type: 'number',
	},
	{ id: 'hoursPerDay', label: __( 'Working hours per day', 'phpavel-dev-calculators' ), type: 'number' },
	{ id: 'tax', label: __( 'Tax, %', 'phpavel-dev-calculators' ), type: 'number' },
	{
		id: 'baseSummary',
		label: __( 'Basic', 'phpavel-dev-calculators' ),
		type: 'text',
		readOnly: true,
		render: ( { item } ) => {
			const hourlyRate = Number( item?.hourlyRate || 0 );
			const hoursPerDay = Number( item?.hoursPerDay || 0 );
			const tax = Number( item?.tax || 0 );

			return (
				<span className="phpavel-dev-calculators-base-summary">
					<span>{ sprintf( __( 'Hourly rate: %s', 'phpavel-dev-calculators' ), `${ formatPrice( hourlyRate ) } ${ currency }/hour` ) }</span>
					<span>{ sprintf( __( 'Working hours per day: %d', 'phpavel-dev-calculators' ), hoursPerDay ) }</span>
					<span>{ sprintf( __( 'Tax: %d%%', 'phpavel-dev-calculators' ), tax ) }</span>
				</span>
			);
		},
		getValueFormatted: ( { item } ) => {
			const hourlyRate = Number( item?.hourlyRate || 0 );
			const hoursPerDay = Number( item?.hoursPerDay || 0 );
			const tax = Number( item?.tax || 0 );
			return [
				sprintf( __( 'Hourly rate: %s', 'phpavel-dev-calculators' ), `${ formatPrice( hourlyRate ) } ${ currency }/hour` ),
				sprintf( __( 'Working hours per day: %d', 'phpavel-dev-calculators' ), hoursPerDay ),
				sprintf( __( 'Tax: %d%%', 'phpavel-dev-calculators' ), tax ),
			].join( '\n' );
		},
	},
	{
		id: 'ndaActivate',
		label: __( 'Enable NDA', 'phpavel-dev-calculators' ),
		type: 'boolean',
		Edit: 'toggle',
		getValueFormatted: ( { item } ) =>
			item?.ndaActivate ? __( 'Enabled', 'phpavel-dev-calculators' ) : __( 'Disabled', 'phpavel-dev-calculators' ),
	},
	{
		id: 'ndaValue',
		label: __( 'NDA value, %', 'phpavel-dev-calculators' ),
		type: 'number',
		isVisible: ( item ) => !!item?.ndaActivate,
	},
	{
		id: 'ndaSummary',
		label: 'NDA',
		type: 'text',
		readOnly: true,
		render: ( { item } ) => (
			<span className="phpavel-dev-calculators-group-summary">
				<span>{ item?.ndaActivate ? __( 'Enabled', 'phpavel-dev-calculators' ) : __( 'Disabled', 'phpavel-dev-calculators' ) }</span>
				{ item?.ndaActivate && <span>{ `${ Number( item?.ndaValue || 0 ) }%` }</span> }
			</span>
		),
	},
	{
		id: 'marketingActivate',
		label: __( 'Enable marketing', 'phpavel-dev-calculators' ),
		type: 'boolean',
		Edit: 'toggle',
		getValueFormatted: ( { item } ) =>
			item?.marketingActivate ? __( 'Enabled', 'phpavel-dev-calculators' ) : __( 'Disabled', 'phpavel-dev-calculators' ),
	},
	{
		id: 'marketingValue',
		label: __( 'Marketing value, %', 'phpavel-dev-calculators' ),
		type: 'number',
		isVisible: ( item ) => !!item?.marketingActivate,
	},
	{
		id: 'marketingSummary',
		label: __( 'Marketing', 'phpavel-dev-calculators' ),
		type: 'text',
		readOnly: true,
		render: ( { item } ) => (
			<span className="phpavel-dev-calculators-group-summary">
				<span>{ item?.marketingActivate ? __( 'Enabled', 'phpavel-dev-calculators' ) : __( 'Disabled', 'phpavel-dev-calculators' ) }</span>
				{ item?.marketingActivate && <span>{ `${ Number( item?.marketingValue || 0 ) }%` }</span> }
			</span>
		),
	},
	{
		id: 'quicklyActivate',
		label: __( 'Enable urgency', 'phpavel-dev-calculators' ),
		type: 'boolean',
		Edit: 'toggle',
		getValueFormatted: ( { item } ) =>
			item?.quicklyActivate ? __( 'Enabled', 'phpavel-dev-calculators' ) : __( 'Disabled', 'phpavel-dev-calculators' ),
	},
	{
		id: 'quicklyValue',
		label: __( 'Urgency value, %', 'phpavel-dev-calculators' ),
		type: 'number',
		isVisible: ( item ) => !!item?.quicklyActivate,
	},
	{
		id: 'quicklySummary',
		label: __( 'Urgency', 'phpavel-dev-calculators' ),
		type: 'text',
		readOnly: true,
		render: ( { item } ) => (
			<span className="phpavel-dev-calculators-group-summary">
				<span>{ item?.quicklyActivate ? __( 'Enabled', 'phpavel-dev-calculators' ) : __( 'Disabled', 'phpavel-dev-calculators' ) }</span>
				{ item?.quicklyActivate && <span>{ `${ Number( item?.quicklyValue || 0 ) }%` }</span> }
			</span>
		),
	},
	{
		id: 'distribution',
		label: __( 'Distribute markups across items', 'phpavel-dev-calculators' ),
		type: 'boolean',
		Edit: 'toggle',
		getValueFormatted: ( { item } ) => ( item?.distribution ? __( 'Yes', 'phpavel-dev-calculators' ) : __( 'No', 'phpavel-dev-calculators' ) ),
	},
	{
		id: 'partnerActivate',
		label: __( 'Enable partner fee', 'phpavel-dev-calculators' ),
		type: 'boolean',
		Edit: 'toggle',
		getValueFormatted: ( { item } ) =>
			item?.partnerActivate ? __( 'Enabled', 'phpavel-dev-calculators' ) : __( 'Disabled', 'phpavel-dev-calculators' ),
	},
	{
		id: 'partnerValue',
		label: __( 'Partner fee value, %', 'phpavel-dev-calculators' ),
		type: 'number',
		isVisible: ( item ) => !!item?.partnerActivate,
	},
	{
		id: 'partnerSummary',
		label: __( 'Partner fee', 'phpavel-dev-calculators' ),
		type: 'text',
		readOnly: true,
		render: ( { item } ) => (
			<span className="phpavel-dev-calculators-group-summary">
				<span>{ item?.partnerActivate ? __( 'Enabled', 'phpavel-dev-calculators' ) : __( 'Disabled', 'phpavel-dev-calculators' ) }</span>
				{ item?.partnerActivate && <span>{ `${ Number( item?.partnerValue || 0 ) }%` }</span> }
			</span>
		),
	},
	];
}

const settingsForm = {
	layout: {
		type: 'panel',
		labelPosition: 'side',
	},
	fields: [
		{
			id: 'mainGroup',
			label: 'Основное',
			layout: {
				type: 'panel',
				labelPosition: 'side',
				editVisibility: 'on-hover',
				openAs: 'dropdown',
				summary: [ 'title', 'status' ],
			},
			children: [ 'title', 'status' ],
		},
		{
			id: 'noteGroup',
			label: 'Заметка проекта',
			layout: {
				type: 'panel',
				labelPosition: 'side',
				editVisibility: 'on-hover',
				openAs: 'dropdown',
				summary: [ 'noteSummary' ],
			},
			children: [ 'note' ],
		},
		{
			id: 'baseGroup',
			label: 'Базовые',
			layout: {
				type: 'panel',
				labelPosition: 'side',
				editVisibility: 'on-hover',
				openAs: 'dropdown',
				summary: [ 'baseSummary' ],
			},
			children: [ 'currency', 'hourlyRate', 'hoursPerDay', 'tax' ],
		},
		{
			id: 'ndaGroup',
			label: 'NDA',
			layout: {
				type: 'panel',
				labelPosition: 'side',
				editVisibility: 'on-hover',
				openAs: 'dropdown',
				summary: [ 'ndaSummary' ],
			},
			children: [ 'ndaActivate', 'ndaValue' ],
		},
		{
			id: 'marketingGroup',
			label: 'Маркетинг',
			layout: {
				type: 'panel',
				labelPosition: 'side',
				editVisibility: 'on-hover',
				openAs: 'dropdown',
				summary: [ 'marketingSummary' ],
			},
			children: [ 'marketingActivate', 'marketingValue' ],
		},
		{
			id: 'quicklyGroup',
			label: 'Срочность',
			layout: {
				type: 'panel',
				labelPosition: 'side',
				editVisibility: 'on-hover',
				openAs: 'dropdown',
				summary: [ 'quicklySummary' ],
			},
			children: [ 'quicklyActivate', 'quicklyValue' ],
		},
		'distribution',
		{
			id: 'partnerGroup',
			label: 'Партнерские',
			layout: {
				type: 'panel',
				labelPosition: 'side',
				editVisibility: 'on-hover',
				openAs: 'dropdown',
				summary: [ 'partnerSummary' ],
			},
			children: [ 'partnerActivate', 'partnerValue' ],
		},
	],
};
const DataFormComponent = WPDataForm || window?.wp?.dataviews?.DataForm;

export default function EditPage() {
	const [ calculator, setCalculator ] = useState( createEmptyCalculator() );
	const [ loading, setLoading ] = useState( false );
	const [ saving, setSaving ] = useState( false );
	const [ deleting, setDeleting ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( '' );
	const [ successMessage, setSuccessMessage ] = useState( '' );

	const calculatorId = Number( config.currentId || 0 );
	const isNew = ! calculatorId;
	const currency = normalizeCurrency( calculator?.settings?.main?.currency );
	const settingsFields = useMemo( () => getSettingsFields( currency ), [ currency ] );

	const totals = useMemo(
		() =>
			calculateTotals( {
				settings: calculator.settings || {},
				works: Array.isArray( calculator.works ) ? calculator.works : [],
				additionalCosts: Array.isArray( calculator.additional_costs ) ? calculator.additional_costs : [],
			} ),
		[ calculator.settings, calculator.works, calculator.additional_costs ]
	);

	const message = useMemo(
		() =>
			buildMessage( {
				settings: calculator.settings || {},
				works: Array.isArray( calculator.works ) ? calculator.works : [],
				totals,
				currency,
			} ),
		[ calculator.settings, calculator.works, totals, currency ]
	);

	const settingsFormData = useMemo( () => calculatorToFormData( calculator ), [ calculator ] );

	const applySettingsEdits = ( edits ) => {
		setCalculator( ( prev ) => {
			const mergedData = {
				...calculatorToFormData( prev ),
				...( edits || {} ),
			};

			return {
				...prev,
				title: mergedData.title || '',
				status: mergedData.status || 'draft',
				note: mergedData.note || '',
				settings: formDataToSettings( mergedData ),
			};
		} );
	};

	useEffect( () => {
		if ( isNew ) {
			return;
		}
		setLoading( true );
		restFetch( { path: apiPath( `/calculators/${ calculatorId }` ) } )
			.then( ( response ) => {
				const sanitizedTitle = ( response?.title && String( response.title ) )
					.trim()
					.replace( /<title[^>]*>/i, '' )
					.replace( /<\/title>/i, '' );

				setCalculator( {
					...createEmptyCalculator(),
					...response,
					title: sanitizedTitle.includes( 'WordPress' ) ? '' : sanitizedTitle,
				} );
			} )
			.catch( ( error ) => {
				setErrorMessage( error.message || __( 'Failed to load calculator.', 'phpavel-dev-calculators' ) );
			} )
			.finally( () => {
				setLoading( false );
			} );
	}, [ calculatorId, isNew ] );

	const updateField = ( key, value ) => {
		setCalculator( ( prev ) => ( { ...prev, [ key ]: value } ) );
	};

	const updateWork = ( index, field, value ) => {
		setCalculator( ( prev ) => {
			const works = Array.isArray( prev.works ) ? [ ...prev.works ] : [];
			works[ index ] = { ...works[ index ], [ field ]: value };
			return { ...prev, works };
		} );
	};

	const addWork = () => {
		setCalculator( ( prev ) => {
			const works = Array.isArray( prev.works ) ? [ ...prev.works ] : [];
			works.push( {
				sort_order: works.length,
				title: '',
				calc_type: 'fix',
				fix_price: 0,
				hour_counter: 0,
				work_period_days: 0,
			} );
			return { ...prev, works };
		} );
	};

	const removeWork = ( index ) => {
		setCalculator( ( prev ) => {
			const works = ( Array.isArray( prev.works ) ? prev.works : [] )
				.filter( ( _item, i ) => i !== index )
				.map( ( item, i ) => ( { ...item, sort_order: i } ) );
			return { ...prev, works };
		} );
	};

	const updateAdditionalCost = ( index, field, value ) => {
		setCalculator( ( prev ) => {
			const additionalCosts = Array.isArray( prev.additional_costs ) ? [ ...prev.additional_costs ] : [];
			additionalCosts[ index ] = { ...additionalCosts[ index ], [ field ]: value };
			return { ...prev, additional_costs: additionalCosts };
		} );
	};

	const addAdditionalCost = () => {
		setCalculator( ( prev ) => {
			const additionalCosts = Array.isArray( prev.additional_costs ) ? [ ...prev.additional_costs ] : [];
			additionalCosts.push( {
				sort_order: additionalCosts.length,
				title: '',
				price: 0,
			} );
			return { ...prev, additional_costs: additionalCosts };
		} );
	};

	const removeAdditionalCost = ( index ) => {
		setCalculator( ( prev ) => {
			const additionalCosts = ( Array.isArray( prev.additional_costs ) ? prev.additional_costs : [] )
				.filter( ( _item, i ) => i !== index )
				.map( ( item, i ) => ( { ...item, sort_order: i } ) );
			return { ...prev, additional_costs: additionalCosts };
		} );
	};

	const save = async () => {
		setSaving( true );
		setErrorMessage( '' );
		setSuccessMessage( '' );

		const payload = {
			title: calculator.title,
			status: calculator.status,
			settings: calculator.settings,
			note: calculator.note,
			total_price: Number( totals.price || 0 ),
			total_days: Number( totals.workPeriod || 0 ),
			works: Array.isArray( calculator.works ) ? calculator.works : [],
			additional_costs: Array.isArray( calculator.additional_costs ) ? calculator.additional_costs : [],
		};

		try {
			const response = await restFetch( {
				path: isNew ? apiPath( '/calculators' ) : apiPath( `/calculators/${ calculatorId }` ),
				method: isNew ? 'POST' : 'PUT',
				data: payload,
			} );
			setSuccessMessage( __( 'Calculator saved.', 'phpavel-dev-calculators' ) );

			if ( isNew && response.id ) {
				window.location.href = `${ config.editPageUrl }&id=${ response.id }`;
				return;
			}

			setCalculator( { ...createEmptyCalculator(), ...response } );
		} catch ( error ) {
			setErrorMessage( error.message || __( 'Failed to save calculator.', 'phpavel-dev-calculators' ) );
		} finally {
			setSaving( false );
		}
	};

	const removeCalculator = async () => {
		if ( isNew || !calculatorId ) {
			return;
		}
		if ( !window.confirm( __( 'Delete the calculator and all related data?', 'phpavel-dev-calculators' ) ) ) {
			return;
		}

		setDeleting( true );
		setErrorMessage( '' );
		setSuccessMessage( '' );

		try {
			await restFetch( {
				path: apiPath( `/calculators/${ calculatorId }` ),
				method: 'DELETE',
			} );
			window.location.href = config.listPageUrl;
		} catch ( error ) {
			setErrorMessage( error.message || __( 'Failed to delete calculator.', 'phpavel-dev-calculators' ) );
		} finally {
			setDeleting( false );
		}
	};

	return (
		<div className="phpavel-dev-calculators-edit-page">
			<div className="phpavel-dev-calculators-edit-page__topbar">
				<h1 className="wp-heading-inline">
					{ isNew ? __( 'Add calculator', 'phpavel-dev-calculators' ) : __( 'Edit calculator', 'phpavel-dev-calculators' ) }
				</h1>
				<a className="page-title-action" href={ config.listPageUrl }>
					{ __( 'Back to list', 'phpavel-dev-calculators' ) }
				</a>
			</div>

			{ errorMessage && (
				<Notice status="error" isDismissible onRemove={ () => setErrorMessage( '' ) }>
					{ errorMessage }
				</Notice>
			) }
			{ successMessage && (
				<Notice status="success" isDismissible onRemove={ () => setSuccessMessage( '' ) }>
					{ successMessage }
				</Notice>
			) }

			{ loading ? (
				<Spinner />
			) : (
				<div className="phpavel-dev-calculators-edit-page__layout">
					<div className="phpavel-dev-calculators-edit-page__main">
						<div className="phpavel-dev-calculators-edit-page__item">
							<h2 className="phpavel-dev-calculators-edit-page__item-title">
								{ sprintf( __( 'Project works (%d)', 'phpavel-dev-calculators' ), ( calculator.works || [] ).length ) }
							</h2>
							{ ( calculator.works || [] ).length > 0 ? (
								<div className="phpavel-dev-calculators-edit-page__works">
									{ calculator.works.map( ( work, index ) => {
										const workPrice = getWorkPrice( calculator.settings || {}, work || {} );
										return (
											<div key={ index } className="phpavel-dev-calculators-edit-page__works-item">
												<TextControl
													label={ __( 'Title', 'phpavel-dev-calculators' ) }
													value={ work.title || '' }
													onChange={ ( value ) => updateWork( index, 'title', value ) }
												/>
												<ToggleGroupControl
													label={ __( 'Calculation type', 'phpavel-dev-calculators' ) }
													value={ work.calc_type || 'fix' }
													isBlock
													onChange={ ( value ) => updateWork( index, 'calc_type', value ) }
												>
													<ToggleGroupControlOption value="fix" label={ __( 'Fixed', 'phpavel-dev-calculators' ) } />
													<ToggleGroupControlOption value="hourly" label={ __( 'Hourly', 'phpavel-dev-calculators' ) } />
												</ToggleGroupControl>
												{ ( work.calc_type || 'fix' ) === 'fix' ? (
													<>
														<TextControl
															label={ sprintf( __( 'Price, %s', 'phpavel-dev-calculators' ), currency ) }
															type="number"
															value={ work.fix_price || 0 }
															onChange={ ( value ) => updateWork( index, 'fix_price', Number( value ) ) }
														/>
														<TextControl
															label={ __( 'Duration, days', 'phpavel-dev-calculators' ) }
															type="number"
															value={ work.work_period_days || 0 }
															onChange={ ( value ) => updateWork( index, 'work_period_days', Number( value ) ) }
														/>
													</>
												) : (
													<>
														<TextControl
															label={ __( 'Hours', 'phpavel-dev-calculators' ) }
															type="number"
															value={ work.hour_counter || 0 }
															onChange={ ( value ) => updateWork( index, 'hour_counter', Number( value ) ) }
														/>
														<TextControl
															label={ sprintf( __( 'Total, %s', 'phpavel-dev-calculators' ), currency ) }
															value={ formatPrice( Math.round( workPrice.price || 0 ) ) }
															disabled
														/>
													</>
												) }
												<Button variant="secondary" size="small" isDestructive onClick={ () => removeWork( index ) }>
													{ __( 'Delete', 'phpavel-dev-calculators' ) }
												</Button>
											</div>
										);
									} ) }
								</div>
							) : (
								<div className="phpavel-dev-calculators-edit-page__placeholder">
									{ __( 'Add works to the project.', 'phpavel-dev-calculators' ) }
								</div>
							) }
							<Button variant="secondary" size="small" onClick={ addWork }>
								{ __( 'Add work', 'phpavel-dev-calculators' ) }
							</Button>
						</div>

						<div className="phpavel-dev-calculators-edit-page__item">
							<h2 className="phpavel-dev-calculators-edit-page__item-title">{ __( 'Additional costs', 'phpavel-dev-calculators' ) }</h2>
							{ ( calculator.additional_costs || [] ).length > 0 ? (
								<div className="phpavel-dev-calculators-edit-page__additional-costs">
									{ calculator.additional_costs.map( ( cost, index ) => (
										<div key={ index } className="phpavel-dev-calculators-edit-page__additional-costs-item">
											<TextControl
												label={ __( 'Title', 'phpavel-dev-calculators' ) }
												value={ cost.title || '' }
												onChange={ ( value ) => updateAdditionalCost( index, 'title', value ) }
											/>
											<TextControl
												label={ sprintf( __( 'Price, %s', 'phpavel-dev-calculators' ), currency ) }
												type="number"
												value={ cost.price || 0 }
												onChange={ ( value ) => updateAdditionalCost( index, 'price', Number( value ) ) }
											/>
											<Button variant="secondary" size="small" isDestructive onClick={ () => removeAdditionalCost( index ) }>
												{ __( 'Delete', 'phpavel-dev-calculators' ) }
											</Button>
										</div>
									) ) }
								</div>
							) : (
								<div className="phpavel-dev-calculators-edit-page__placeholder">
									{ __( 'Add additional costs.', 'phpavel-dev-calculators' ) }
								</div>
							) }
							<Button variant="secondary" size="small" onClick={ addAdditionalCost }>
								{ __( 'Add cost', 'phpavel-dev-calculators' ) }
							</Button>
						</div>

					</div>

					<div className="phpavel-dev-calculators-edit-page__sidebar">
						<div className="phpavel-dev-calculators-edit-page__item">
							<div className="phpavel-dev-calculators-edit-page__item-header">
								<h2 className="phpavel-dev-calculators-edit-page__item-title">{ __( 'Settings', 'phpavel-dev-calculators' ) }</h2>
								<div className="phpavel-dev-calculators-edit-page__item-actions">
									<Button variant="primary" size="small" isBusy={ saving } onClick={ save }>
										{ __( 'Save', 'phpavel-dev-calculators' ) }
									</Button>
									<Button
										variant="secondary"
										isDestructive
										size="small"
										disabled={ isNew }
										isBusy={ deleting }
										onClick={ removeCalculator }
									>
										{ __( 'Delete', 'phpavel-dev-calculators' ) }
									</Button>
								</div>
							</div>
							{ DataFormComponent ? (
								<DataFormComponent
									data={ settingsFormData }
									fields={ settingsFields }
									form={ settingsForm }
									onChange={ ( nextData ) => {
										applySettingsEdits( nextData );
									} }
								/>
							) : (
								<div className="phpavel-dev-calculators-settings-fallback">
									<TextControl label={ __( 'Currency', 'phpavel-dev-calculators' ) } type="text" value={ settingsFormData.currency || currency } __next40pxDefaultSize __nextHasNoMarginBottom onChange={ ( v ) => updateField( 'settings', formDataToSettings( { ...settingsFormData, currency: v } ) ) } />
									<TextControl label={ sprintf( __( 'Hourly rate, %s/hour', 'phpavel-dev-calculators' ), currency ) } type="number" value={ settingsFormData.hourlyRate } __next40pxDefaultSize __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, hourlyRate: Number( v ) } ) ) } />
									<TextControl label={ __( 'Working hours per day', 'phpavel-dev-calculators' ) } type="number" value={ settingsFormData.hoursPerDay } __next40pxDefaultSize __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, hoursPerDay: Number( v ) } ) ) } />
									<TextControl label={ __( 'Tax, %', 'phpavel-dev-calculators' ) } type="number" value={ settingsFormData.tax } __next40pxDefaultSize __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, tax: Number( v ) } ) ) } />
									<ToggleControl label={ __( 'Enable NDA', 'phpavel-dev-calculators' ) } checked={ settingsFormData.ndaActivate } __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, ndaActivate: !!v } ) ) } />
									<TextControl label={ __( 'NDA value, %', 'phpavel-dev-calculators' ) } type="number" value={ settingsFormData.ndaValue } __next40pxDefaultSize __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, ndaValue: Number( v ) } ) ) } />
									<ToggleControl label={ __( 'Enable marketing', 'phpavel-dev-calculators' ) } checked={ settingsFormData.marketingActivate } __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, marketingActivate: !!v } ) ) } />
									<TextControl label={ __( 'Marketing value, %', 'phpavel-dev-calculators' ) } type="number" value={ settingsFormData.marketingValue } __next40pxDefaultSize __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, marketingValue: Number( v ) } ) ) } />
									<ToggleControl label={ __( 'Enable urgency', 'phpavel-dev-calculators' ) } checked={ settingsFormData.quicklyActivate } __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, quicklyActivate: !!v } ) ) } />
									<TextControl label={ __( 'Urgency value, %', 'phpavel-dev-calculators' ) } type="number" value={ settingsFormData.quicklyValue } __next40pxDefaultSize __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, quicklyValue: Number( v ) } ) ) } />
									<ToggleControl label={ __( 'Distribute markups across items', 'phpavel-dev-calculators' ) } checked={ settingsFormData.distribution } __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, distribution: !!v } ) ) } />
									<ToggleControl label={ __( 'Enable partner fee', 'phpavel-dev-calculators' ) } checked={ settingsFormData.partnerActivate } __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, partnerActivate: !!v } ) ) } />
									<TextControl label={ __( 'Partner fee value, %', 'phpavel-dev-calculators' ) } type="number" value={ settingsFormData.partnerValue } __next40pxDefaultSize __nextHasNoMarginBottom onChange={ (v) => updateField( 'settings', formDataToSettings( { ...settingsFormData, partnerValue: Number( v ) } ) ) } />
								</div>
							) }
						</div>

						<div className="phpavel-dev-calculators-edit-page__item">
							<h2 className="phpavel-dev-calculators-edit-page__item-title">{ __( 'Client total', 'phpavel-dev-calculators' ) }</h2>
							<div className="phpavel-dev-calculators-edit-page__summary-total">
								<div className="phpavel-dev-calculators-edit-page__summary-price">{ formatMoney( totals.price, currency ) }</div>
								<div>
									{ __( 'Duration:', 'phpavel-dev-calculators' ) }{' '}
									<strong>
										{ sprintf(
											_n( '%d day', '%d days', totals.workPeriod || 0, 'phpavel-dev-calculators' ),
											totals.workPeriod || 0
										) }
									</strong>
								</div>
								<div>
									{ __( 'Hourly rate:', 'phpavel-dev-calculators' ) } <strong>{ formatMoney( totals.hourlyRate, currency ) }</strong>
								</div>
							</div>

							{ ( calculator?.settings?.perks?.nda?.activate ||
								calculator?.settings?.perks?.marketing?.activate ||
								calculator?.settings?.perks?.quickly?.activate ) && (
								<div className="phpavel-dev-calculators-edit-page__summary-box is-perks">
									<div>{ __( 'Base price', 'phpavel-dev-calculators' ) } <span>{ formatMoney( totals.basePrice, currency ) }</span></div>
									{ calculator?.settings?.perks?.nda?.activate && (
										<div>
											{ sprintf( __( 'NDA (%d%%)', 'phpavel-dev-calculators' ), Number( calculator?.settings?.perks?.nda?.value || 0 ) ) }
											<span>
												+{ formatMoney( ( totals.basePrice || 0 ) * ( Number( calculator?.settings?.perks?.nda?.value || 0 ) / 100 ), currency ) }
											</span>
										</div>
									) }
									{ calculator?.settings?.perks?.marketing?.activate && (
										<div>
											{ sprintf( __( 'Marketing (%d%%)', 'phpavel-dev-calculators' ), Number( calculator?.settings?.perks?.marketing?.value || 0 ) ) }
											<span>
												+{ formatMoney( ( totals.basePrice || 0 ) * ( Number( calculator?.settings?.perks?.marketing?.value || 0 ) / 100 ), currency ) }
											</span>
										</div>
									) }
									{ calculator?.settings?.perks?.quickly?.activate && (
										<div>
											{ sprintf( __( 'Urgency (%d%%)', 'phpavel-dev-calculators' ), Number( calculator?.settings?.perks?.quickly?.value || 0 ) ) }
											<span>
												+{ formatMoney( ( totals.basePrice || 0 ) * ( Number( calculator?.settings?.perks?.quickly?.value || 0 ) / 100 ), currency ) }
											</span>
										</div>
									) }
									<div className="is-total">{ __( 'Total with markups', 'phpavel-dev-calculators' ) } <span>{ formatMoney( totals.price, currency ) }</span></div>
								</div>
							) }

							<div className="phpavel-dev-calculators-edit-page__summary-box is-costs">
								<div>{ __( 'Tax', 'phpavel-dev-calculators' ) } <span>{ formatMoney( totals.tax, currency ) }</span></div>
								{ calculator?.settings?.parther?.activate && (
									<div>
										{ sprintf( __( 'Partner (%d%%)', 'phpavel-dev-calculators' ), Number( calculator?.settings?.parther?.value || 0 ) ) }
										<span>{ formatMoney( totals.partnerAmount, currency ) }</span>
									</div>
								) }
								<div>{ __( 'Additional costs', 'phpavel-dev-calculators' ) } <span>{ formatMoney( totals.additionalCosts, currency ) }</span></div>
								<div className="is-total">
									{ __( 'All costs', 'phpavel-dev-calculators' ) }
									<span>{ formatMoney( ( totals.tax || 0 ) + ( totals.additionalCosts || 0 ) + ( totals.partnerAmount || 0 ), currency ) }</span>
								</div>
							</div>
							<div className={ `phpavel-dev-calculators-edit-page__profit ${ totals.profit < 0 ? 'is-minus' : '' }` }>
								{ __( 'Profit:', 'phpavel-dev-calculators' ) } { formatMoney( totals.profit, currency ) }
							</div>
						</div>

						<div className="phpavel-dev-calculators-edit-page__item">
							<h2 className="phpavel-dev-calculators-edit-page__item-title">{ __( 'Client message', 'phpavel-dev-calculators' ) }</h2>
							<div className="phpavel-dev-calculators-edit-page__message">{ message }</div>
							<Button
								variant="secondary"
								size="small"
								onClick={ async () => {
									try {
										await navigator.clipboard.writeText( message );
										setSuccessMessage( __( 'Message copied.', 'phpavel-dev-calculators' ) );
									} catch ( error ) {
										setErrorMessage( __( 'Failed to copy message.', 'phpavel-dev-calculators' ) );
									}
								} }
							>
								{ __( 'Copy message', 'phpavel-dev-calculators' ) }
							</Button>
						</div>

					</div>
				</div>
			) }
		</div>
	);
}

function calculateTotals( { settings, works, additionalCosts } ) {
	const hourlyRate = Number( settings?.main?.hourlyRate || 1500 );
	const hoursPerDay = Number( settings?.main?.hoursPerDay || 8 );
	const taxPercent = Number( settings?.main?.tax || 6 );

	let worksPrice = 0;
	let totalHours = 0;
	let totalDays = 0;

	works.forEach( ( work ) => {
		if ( ( work?.calc_type || 'fix' ) === 'fix' ) {
			worksPrice += Number( work?.fix_price || 0 );
			totalDays += Number( work?.work_period_days || 0 );
		} else {
			const hours = Number( work?.hour_counter || 0 );
			worksPrice += hours * hourlyRate;
			totalHours += hours;
		}
	} );

	totalDays += Math.ceil( totalHours / Math.max( hoursPerDay, 1 ) );
	const basePrice = worksPrice;

	let perksPercent = 0;
	const perks = settings?.perks || {};
	if ( perks?.nda?.activate ) {
		perksPercent += Number( perks?.nda?.value || 0 );
	}
	if ( perks?.marketing?.activate ) {
		perksPercent += Number( perks?.marketing?.value || 0 );
	}
	if ( perks?.quickly?.activate ) {
		perksPercent += Number( perks?.quickly?.value || 0 );
	}

	const perksAmount = worksPrice * ( perksPercent / 100 );
	const additionalCostsSum = additionalCosts.reduce( ( sum, item ) => sum + Number( item?.price || 0 ), 0 );

	const subtotal = worksPrice + perksAmount;

	let partnerAmount = 0;
	let subPartnerAmount = 0;
	if ( settings?.parther?.activate ) {
		subPartnerAmount = subtotal * ( Number( settings?.parther?.value || 0 ) / 100 );
		partnerAmount = subtotal * ( Number( settings?.parther?.value || 0 ) / 100 );
	}

	const taxAmount = subtotal * ( taxPercent / 100 );
	const totalPrice = subtotal;

	return {
		basePrice,
		price: Math.round( totalPrice ),
		workPeriod: totalDays,
		hourlyRate,
		tax: Math.round( taxAmount ),
		additionalCosts: additionalCostsSum,
		subPartnerAmount,
		partnerAmount: Math.round( partnerAmount ),
		profit: Math.round( totalPrice - taxAmount - additionalCostsSum ),
	};
}

function getWorkPrice( settings, work ) {
	let price = 0;
	let plusPricePercent = 0;

	if ( ( work?.calc_type || 'fix' ) === 'fix' ) {
		price = Number( work?.fix_price || 0 );
	} else {
		price = Number( work?.hour_counter || 0 ) * Number( settings?.main?.hourlyRate || 0 );
	}

	if ( settings?.perks?.distribution ) {
		if ( settings?.perks?.nda?.activate ) {
			plusPricePercent += Number( settings?.perks?.nda?.value || 0 );
		}
		if ( settings?.perks?.marketing?.activate ) {
			plusPricePercent += Number( settings?.perks?.marketing?.value || 0 );
		}
		if ( settings?.perks?.quickly?.activate ) {
			plusPricePercent += Number( settings?.perks?.quickly?.value || 0 );
		}
	}

	return {
		price,
		plusPrice: price + price * ( plusPricePercent / 100 ),
	};
}

function buildMessage( { settings, works, totals, currency } ) {
	const cur = normalizeCurrency( currency ?? settings?.main?.currency );
	const lines = [];
	lines.push( __( 'Project works:', 'phpavel-dev-calculators' ) + '\n' );

	works.forEach( ( work, key ) => {
		const title = work?.title || __( 'Untitled', 'phpavel-dev-calculators' );
		const workPrice = getWorkPrice( settings, work );
		lines.push(
			`— ${ title }: ${ formatMoney(
				Math.round( workPrice.plusPrice > 0 ? workPrice.plusPrice : workPrice.price ),
				cur
			) }`
		);
		if ( key !== works.length - 1 ) {
			lines.push( '\n' );
		}
	} );

	if ( ! settings?.perks?.distribution ) {
		lines.push( '\n' );
		if ( settings?.perks?.nda?.activate ) {
			lines.push(
				`\n${ __( 'NDA', 'phpavel-dev-calculators' ) }: ${ formatMoney(
					Math.round( ( totals?.basePrice || 0 ) * ( Number( settings?.perks?.nda?.value || 0 ) / 100 ) ),
					cur
				) }`
			);
		}
		if ( settings?.perks?.marketing?.activate ) {
			lines.push(
				`\n${ __( 'Marketing', 'phpavel-dev-calculators' ) }: ${ formatMoney(
					Math.round( ( totals?.basePrice || 0 ) * ( Number( settings?.perks?.marketing?.value || 0 ) / 100 ) ),
					cur
				) }`
			);
		}
		if ( settings?.perks?.quickly?.activate ) {
			lines.push(
				`\n${ __( 'Urgency', 'phpavel-dev-calculators' ) }: ${ formatMoney(
					Math.round( ( totals?.basePrice || 0 ) * ( Number( settings?.perks?.quickly?.value || 0 ) / 100 ) ),
					cur
				) }`
			);
		}
	}

	lines.push(
		`\n\n${ __( 'Duration:', 'phpavel-dev-calculators' ) } ${ sprintf(
			_n( '%d day', '%d days', totals.workPeriod || 0, 'phpavel-dev-calculators' ),
			totals.workPeriod || 0
		) }`
	);
	lines.push( `\n${ __( 'Total:', 'phpavel-dev-calculators' ) } ${ formatMoney( totals.price, cur ) }` );

	return lines.join( '' );
}

function settingsToFormData( settings ) {
	return {
		currency: normalizeCurrency( settings?.main?.currency ),
		hourlyRate: Number( settings?.main?.hourlyRate || 1500 ),
		hoursPerDay: Number( settings?.main?.hoursPerDay || 8 ),
		tax: Number( settings?.main?.tax || 6 ),
		ndaActivate: !!settings?.perks?.nda?.activate,
		ndaValue: Number( settings?.perks?.nda?.value || 30 ),
		marketingActivate: !!settings?.perks?.marketing?.activate,
		marketingValue: Number( settings?.perks?.marketing?.value || 20 ),
		quicklyActivate: !!settings?.perks?.quickly?.activate,
		quicklyValue: Number( settings?.perks?.quickly?.value || 25 ),
		distribution: settings?.perks?.distribution !== false,
		partnerActivate: !!settings?.parther?.activate,
		partnerValue: Number( settings?.parther?.value || 10 ),
	};
}

function calculatorToFormData( calculator ) {
	return {
		title: calculator?.title || '',
		status: calculator?.status || 'draft',
		note: calculator?.note || '',
		...settingsToFormData( calculator?.settings || {} ),
	};
}

function formDataToSettings( data ) {
	return {
		main: {
			currency: normalizeCurrency( data?.currency ),
			hourlyRate: Number( data?.hourlyRate || 0 ),
			hoursPerDay: Number( data?.hoursPerDay || 0 ),
			tax: Number( data?.tax || 0 ),
		},
		perks: {
			nda: {
				activate: !!data?.ndaActivate,
				value: Number( data?.ndaValue || 0 ),
			},
			marketing: {
				activate: !!data?.marketingActivate,
				value: Number( data?.marketingValue || 0 ),
			},
			quickly: {
				activate: !!data?.quicklyActivate,
				value: Number( data?.quicklyValue || 0 ),
			},
			distribution: !!data?.distribution,
		},
		parther: {
			activate: !!data?.partnerActivate,
			value: Number( data?.partnerValue || 0 ),
		},
	};
}
