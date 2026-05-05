import { Fragment, useEffect, useState } from '@wordpress/element';
import { Button, Notice, SelectControl, Spinner, TextControl } from '@wordpress/components';
import { DataViews as WPDataViews } from '@wordpress/dataviews/wp';
import { __, sprintf } from '@wordpress/i18n';
import { apiPath, config, formatMoney, normalizeCurrency, restFetch } from '../shared';

export default function ListPage() {
	const [ items, setItems ] = useState( [] );
	const [ loading, setLoading ] = useState( false );
	const [ errorMessage, setErrorMessage ] = useState( '' );
	const [ successMessage, setSuccessMessage ] = useState( '' );
	const [ activePropertiesId, setActivePropertiesId ] = useState( 0 );
	const [ inlineTitle, setInlineTitle ] = useState( '' );
	const [ inlineStatus, setInlineStatus ] = useState( 'draft' );
	const [ savingProperties, setSavingProperties ] = useState( false );
	const [ deletingId, setDeletingId ] = useState( 0 );
	const [ view, setView ] = useState( {
		type: 'table',
		page: 1,
		perPage: 20,
		fields: [ 'title', 'note_preview', 'total_price', 'status' ],
		layout: {
			enableMoving: false,
			styles: {
				title: { width: '30%' },
				note_preview: { width: '35%' },
				total_price: { width: '18%' },
				status: { width: '17%' },
			},
		},
		filters: [],
	} );

	const DataViewsComponent = WPDataViews || window?.wp?.dataviews?.DataViews;

	const loadItems = async () => {
		setLoading( true );
		try {
			const response = await restFetch( { path: apiPath( '/calculators?limit=200' ) } );
			setItems( Array.isArray( response.items ) ? response.items : [] );
		} catch ( error ) {
			setErrorMessage( error.message || 'Не удалось загрузить калькуляторы' );
		} finally {
			setLoading( false );
		}
	};

	useEffect( () => {
		loadItems();
	}, [] );

	const openProperties = ( item ) => {
		setActivePropertiesId( item.id );
		setInlineTitle( item.title || '' );
		setInlineStatus( item.status || 'draft' );
		setErrorMessage( '' );
		setSuccessMessage( '' );
	};

	const saveProperties = async () => {
		if ( ! activePropertiesId ) {
			return;
		}

		setSavingProperties( true );
		try {
			await restFetch( {
				path: apiPath( `/calculators/${ activePropertiesId }` ),
				method: 'PUT',
				data: { title: inlineTitle, status: inlineStatus },
			} );
			setSuccessMessage( __( 'Properties updated.', 'phpavel-dev-calculators' ) );
			setActivePropertiesId( 0 );
			await loadItems();
		} catch ( error ) {
			setErrorMessage( error.message || __( 'Failed to update properties.', 'phpavel-dev-calculators' ) );
		} finally {
			setSavingProperties( false );
		}
	};

	const deleteItem = async ( item ) => {
		if (
			! window.confirm(
				sprintf(
					__( 'Delete calculator "%s"?', 'phpavel-dev-calculators' ),
					item.title || `#${ item.id }`
				)
			)
		) {
			return;
		}

		setDeletingId( item.id );
		try {
			await restFetch( { path: apiPath( `/calculators/${ item.id }` ), method: 'DELETE' } );
			setSuccessMessage( __( 'Calculator deleted.', 'phpavel-dev-calculators' ) );
			await loadItems();
		} catch ( error ) {
			setErrorMessage( error.message || __( 'Failed to delete calculator.', 'phpavel-dev-calculators' ) );
		} finally {
			setDeletingId( 0 );
		}
	};

	const statusLabels = {
		draft: __( 'Draft', 'phpavel-dev-calculators' ),
		active: __( 'Active', 'phpavel-dev-calculators' ),
		archived: __( 'Archived', 'phpavel-dev-calculators' ),
	};

	const getNotePreview = ( note ) => {
		const source = String( note || '' );
		if ( !source.trim() ) {
			return '—';
		}

		const lines = source
			.replace( /\r/g, '' )
			.split( '\n' )
			.map( ( line ) => line.trim() )
			.filter( Boolean );

		if ( lines.length === 0 ) {
			return '—';
		}

		const twoLines = lines.slice( 0, 2 ).join( '\n' );
		return lines.length > 2 ? `${ twoLines }\n...` : twoLines;
	};

	const fields = [
		{
			id: 'title',
			label: __( 'Title', 'phpavel-dev-calculators' ),
			enableSorting: false,
			enableHiding: false,
			filterBy: false,
			render: ( { item } ) => (
				<strong>
					<a href={ `${ config.editPageUrl }&id=${ item.id }` }>
						{ item.title || sprintf( __( 'Calculator #%d', 'phpavel-dev-calculators' ), item.id ) }
					</a>
				</strong>
			),
		},
		{
			id: 'note_preview',
			label: __( 'Project note', 'phpavel-dev-calculators' ),
			enableSorting: false,
			enableHiding: false,
			filterBy: false,
			getValue: ( { item } ) => item.note || '',
			render: ( { item } ) => (
				<div className="phpavel-dev-calculators-list-page__note-preview">{ getNotePreview( item.note ) }</div>
			),
		},
		{
			id: 'total_price',
			label: __( 'Total', 'phpavel-dev-calculators' ),
			type: 'number',
			enableSorting: false,
			enableHiding: false,
			filterBy: false,
			getValue: ( { item } ) => Number( item.total_price || 0 ),
			render: ( { item } ) => {
				const currency = normalizeCurrency( item?.settings?.main?.currency );
				return formatMoney( item.total_price, currency );
			},
		},
		{
			id: 'status',
			label: __( 'Status', 'phpavel-dev-calculators' ),
			enableSorting: false,
			enableHiding: false,
			filterBy: false,
			getValue: ( { item } ) => item.status || 'draft',
			render: ( { item } ) => statusLabels[ item.status ] || item.status || 'draft',
		},
	];

	const actions = [
		{
			id: 'edit',
			label: __( 'Edit', 'phpavel-dev-calculators' ),
			supportsBulk: false,
			callback: ( selectedItems ) => {
				const selected = selectedItems?.[ 0 ];
				if ( !selected ) {
					return;
				}
				window.location.href = `${ config.editPageUrl }&id=${ selected.id }`;
			},
		},
		{
			id: 'properties',
			label: __( 'Properties', 'phpavel-dev-calculators' ),
			supportsBulk: false,
			callback: ( selectedItems ) => {
				const selected = selectedItems?.[ 0 ];
				if ( !selected ) {
					return;
				}
				openProperties( selected );
			},
		},
		{
			id: 'delete',
			label: __( 'Delete', 'phpavel-dev-calculators' ),
			supportsBulk: false,
			isEligible: ( item ) => deletingId !== item.id,
			callback: ( selectedItems ) => {
				const selected = selectedItems?.[ 0 ];
				if ( !selected ) {
					return;
				}
				deleteItem( selected );
			},
		},
	];

	const perPage = Number( view.perPage || 20 ) || 20;
	const paginationInfo = {
		totalItems: items.length,
		totalPages: Math.max( 1, Math.ceil( items.length / perPage ) ),
	};

	return (
		<div className="phpavel-dev-calculators-list-page">
			<h1 className="wp-heading-inline">{ __( 'Calculators', 'phpavel-dev-calculators' ) }</h1>
			<a className="page-title-action" href={ `${ config.editPageUrl }&action=new` }>
				{ __( 'Add calculator', 'phpavel-dev-calculators' ) }
			</a>

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
			) : DataViewsComponent ? (
				<div className="phpavel-dev-calculators-list-page__dataviews">
					<DataViewsComponent
						view={ view }
						onChangeView={ setView }
						fields={ fields }
						actions={ actions }
						data={ items }
						getItemId={ ( item ) => String( item.id ) }
						defaultLayouts={ { table: true } }
						paginationInfo={ paginationInfo }
						search={ false }
						empty={ __( 'No calculators found.', 'phpavel-dev-calculators' ) }
					>
						<DataViewsComponent.Layout />
						<DataViewsComponent.Footer />
					</DataViewsComponent>
				</div>
			) : (
				<table className="wp-list-table widefat fixed striped table-view-list posts">
					<thead>
						<tr>
							<th className="manage-column column-title">{ __( 'Title', 'phpavel-dev-calculators' ) }</th>
							<th className="manage-column column-note">{ __( 'Project note', 'phpavel-dev-calculators' ) }</th>
							<th className="manage-column column-total">{ __( 'Total', 'phpavel-dev-calculators' ) }</th>
							<th className="manage-column column-status">{ __( 'Status', 'phpavel-dev-calculators' ) }</th>
						</tr>
					</thead>
					<tbody>
						{ items.length === 0 && (
							<tr>
								<td colSpan="4">{ __( 'No calculators found.', 'phpavel-dev-calculators' ) }</td>
							</tr>
						) }
						{ items.map( ( item ) => (
							<Fragment key={ item.id }>
								<tr>
									<td className="column-title has-row-actions">
										<strong>
											<a href={ `${ config.editPageUrl }&id=${ item.id }` }>
												{ item.title || sprintf( __( 'Calculator #%d', 'phpavel-dev-calculators' ), item.id ) }
											</a>
										</strong>
										<div className="row-actions">
											<span className="edit">
												<a href={ `${ config.editPageUrl }&id=${ item.id }` }>{ __( 'Edit', 'phpavel-dev-calculators' ) }</a> |{' '}
											</span>
											<span className="inline hide-if-no-js">
												<button type="button" className="button-link" onClick={ () => openProperties( item ) }>
													{ __( 'Properties', 'phpavel-dev-calculators' ) }
												</button>{' '}
												|{' '}
											</span>
											<span className="trash">
												<button
													type="button"
													className="button-link delete"
													disabled={ deletingId === item.id }
													onClick={ () => deleteItem( item ) }
												>
													{ __( 'Delete', 'phpavel-dev-calculators' ) }
												</button>
											</span>
										</div>
									</td>
									<td className="column-note">
										<div className="phpavel-dev-calculators-list-page__note-preview">{ getNotePreview( item.note ) }</div>
									</td>
									<td>{ formatMoney( item.total_price, normalizeCurrency( item?.settings?.main?.currency ) ) }</td>
									<td>{ item.status || 'draft' }</td>
								</tr>
								{ activePropertiesId === item.id && (
									<tr>
										<td colSpan="4">
											<div className="phpavel-dev-calculators-inline-properties">
												<TextControl label={ __( 'Title', 'phpavel-dev-calculators' ) } value={ inlineTitle } onChange={ setInlineTitle } />
												<SelectControl
													label={ __( 'Status', 'phpavel-dev-calculators' ) }
													value={ inlineStatus }
													options={ [
														{ label: __( 'Draft', 'phpavel-dev-calculators' ), value: 'draft' },
														{ label: __( 'Active', 'phpavel-dev-calculators' ), value: 'active' },
														{ label: __( 'Archived', 'phpavel-dev-calculators' ), value: 'archived' },
													] }
													onChange={ setInlineStatus }
												/>
												<div className="phpavel-dev-calculators-inline-properties__actions">
													<Button variant="primary" isBusy={ savingProperties } onClick={ saveProperties }>
														{ __( 'Save', 'phpavel-dev-calculators' ) }
													</Button>
													<Button variant="secondary" onClick={ () => setActivePropertiesId( 0 ) }>
														{ __( 'Cancel', 'phpavel-dev-calculators' ) }
													</Button>
												</div>
											</div>
										</td>
									</tr>
								) }
							</Fragment>
						) ) }
					</tbody>
				</table>
			) }

			{ DataViewsComponent && activePropertiesId > 0 && (
				<div className="phpavel-dev-calculators-inline-properties">
					<TextControl label={ __( 'Title', 'phpavel-dev-calculators' ) } value={ inlineTitle } onChange={ setInlineTitle } />
					<SelectControl
						label={ __( 'Status', 'phpavel-dev-calculators' ) }
						value={ inlineStatus }
						options={ [
							{ label: __( 'Draft', 'phpavel-dev-calculators' ), value: 'draft' },
							{ label: __( 'Active', 'phpavel-dev-calculators' ), value: 'active' },
							{ label: __( 'Archived', 'phpavel-dev-calculators' ), value: 'archived' },
						] }
						onChange={ setInlineStatus }
					/>
					<div className="phpavel-dev-calculators-inline-properties__actions">
						<Button variant="primary" isBusy={ savingProperties } onClick={ saveProperties }>
							{ __( 'Save', 'phpavel-dev-calculators' ) }
						</Button>
						<Button variant="secondary" onClick={ () => setActivePropertiesId( 0 ) }>
							{ __( 'Cancel', 'phpavel-dev-calculators' ) }
						</Button>
					</div>
				</div>
			) }
		</div>
	);
}
